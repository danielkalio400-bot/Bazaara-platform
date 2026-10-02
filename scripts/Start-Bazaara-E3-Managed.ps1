#requires -Version 5.1
[CmdletBinding()]
param(
    [string]$RepoRoot = (Join-Path $env:USERPROFILE 'Bazaara\bazaara-platform'),
    [int]$ApiWaitSeconds = 20,
    [int]$WebWaitSeconds = 30,
    [int]$PauseBetweenProductsSeconds = 2,
    [int]$MinFreeRamMB = 450,
    [switch]$IgnoreMemoryGuard
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$repo = [IO.Path]::GetFullPath($RepoRoot)
$logRoot = Join-Path $repo '.bazaara-logs\e3-managed-v5'
New-Item -ItemType Directory -Path $logRoot -Force | Out-Null

function Test-Tcp([int]$Port) {
    foreach ($address in @('127.0.0.1', '::1')) {
        $ip = [System.Net.IPAddress]::Parse($address)
        $client = [System.Net.Sockets.TcpClient]::new(
            $ip.AddressFamily
        )

        try {
            $async = $client.BeginConnect(
                $ip, $Port, $null, $null
            )

            if (-not $async.AsyncWaitHandle.WaitOne(400)) {
                continue
            }

            try {
                $client.EndConnect($async)
                return $true
            }
            catch {
                continue
            }
        }
        catch {
            continue
        }
        finally {
            $client.Dispose()
        }
    }

    return $false
}
function Get-Owner([int]$Port, [int]$TrustedAncestorId = 0) {
    $connections = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
    if ($connections.Count -eq 0) { return $null }
    $ownerIds = @($connections | Select-Object -ExpandProperty OwningProcess -Unique)
    if ($ownerIds.Count -ne 1) {
        return [pscustomobject]@{ Pid = 0; Verified = $false; Reason = 'MULTIPLE_OWNERS' }
    }
    $ownerId = [int]$ownerIds[0]
    $currentId = $ownerId
    $seen = @{}
    $repoNormalized = $repo.TrimEnd('\') + '\'
    for ($depth = 0; $depth -lt 12 -and $currentId -gt 0; $depth++) {
        if ($seen.ContainsKey($currentId)) { break }
        $seen[$currentId] = $true
        if ($TrustedAncestorId -gt 0 -and $currentId -eq $TrustedAncestorId) {
            return [pscustomobject]@{ Pid = $ownerId; Verified = $true; Reason = 'LAUNCHED_PROCESS_TREE' }
        }
        $proc = Get-CimInstance Win32_Process -Filter "ProcessId = $currentId" -ErrorAction SilentlyContinue
        if ($null -eq $proc) { break }
        $cmd = ([string]$proc.CommandLine).Replace('/', '\')
        if ($cmd.IndexOf($repoNormalized, [StringComparison]::OrdinalIgnoreCase) -ge 0) {
            return [pscustomobject]@{ Pid = $ownerId; Verified = $true; Reason = 'REPOSITORY_PROCESS_TREE' }
        }
        $currentId = [int]$proc.ParentProcessId
    }
    # Liveness by itself cannot prove process ownership. Do not stop, reuse as
    # confirmed BAZAARA, or overwrite an unidentified port occupant.
    return [pscustomobject]@{ Pid = $ownerId; Verified = $false; Reason = 'OWNERSHIP_UNVERIFIED' }
}
function Wait-Port([int]$Port, [int]$Seconds) {
    $deadline = (Get-Date).AddSeconds($Seconds)
    do {
        if (Test-Tcp $Port) { return $true }
        Start-Sleep -Milliseconds 500
    } while ((Get-Date) -lt $deadline)
    return $false
}
function Free-RamMB {
    $os = Get-CimInstance Win32_OperatingSystem
    return [math]::Round([double]$os.FreePhysicalMemory / 1024, 0)
}
function Ensure-Memory {
    if ($IgnoreMemoryGuard) { return }
    $available = Free-RamMB
    if ($available -lt $MinFreeRamMB) {
        throw "Memory safety stop: only $available MB RAM free (minimum $MinFreeRamMB MB). Already started services stay running. See the status table and logs; consider more RAM or production-mode builds."
    }
}
function Get-Package([string]$Path) {
    $file = Join-Path $Path 'package.json'
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { return $null }
    $package = Get-Content -LiteralPath $file -Raw | ConvertFrom-Json
    if (-not $package.scripts.dev) { return $null }
    return $package
}
function Start-Workspace([string]$Slug, [string]$Kind, [int]$Port, [int]$WaitSeconds) {
    $folder = if ($Kind -eq 'api') { Join-Path $repo ("services\$Slug-api") } else { Join-Path $repo ("apps\$Slug-web") }
    $label = "$Slug $Kind"
    $package = Get-Package $folder
    if ($null -eq $package) {
        Write-Warning "[MISSING] $label package/dev script: $folder"
        return 'MISSING'
    }
    if (Test-Tcp $Port) {
        $owner = Get-Owner $Port
        if ($null -ne $owner -and $owner.Verified) {
            Write-Host "[REUSE] $label -> $Port (PID $($owner.Pid))" -ForegroundColor Green
            return 'REUSED'
        }
        $pidLabel = if ($null -ne $owner) { [string]$owner.Pid } else { 'unknown' }
        Write-Warning "[OCCUPIED_UNVERIFIED] $label -> $Port (PID $pidLabel). Left untouched; other products will continue."
        return 'OCCUPIED_UNVERIFIED'
    }
    Ensure-Memory
    $safe = "$Slug-$Kind-$Port"
    $out = Join-Path $logRoot "$safe.out.log"
    $err = Join-Path $logRoot "$safe.err.log"
    # Root workspace can contain conflicting npm workspace flags. Running in the
    # exact package directory isolates each dev script without altering the repo.
    $previousPort = $env:PORT
    $previousTelemetry = $env:NEXT_TELEMETRY_DISABLED
    try {
        $env:PORT = [string]$Port
        $env:NEXT_TELEMETRY_DISABLED = '1'
        $launched = Start-Process -FilePath 'npm.cmd' -ArgumentList @('run', 'dev', '--workspaces=false') `
            -WorkingDirectory $folder -RedirectStandardOutput $out `
            -RedirectStandardError $err -WindowStyle Hidden -PassThru
    }
    finally {
        if ($null -eq $previousPort) { Remove-Item Env:PORT -ErrorAction SilentlyContinue } else { $env:PORT = $previousPort }
        if ($null -eq $previousTelemetry) { Remove-Item Env:NEXT_TELEMETRY_DISABLED -ErrorAction SilentlyContinue } else { $env:NEXT_TELEMETRY_DISABLED = $previousTelemetry }
    }
    if (Wait-Port $Port $WaitSeconds) {
        $owner = Get-Owner -Port $Port -TrustedAncestorId ([int]$launched.Id)
        if ($null -eq $owner -or -not $owner.Verified) {
            Write-Warning "[OCCUPIED_UNVERIFIED] $label -> $Port appeared, but launcher ownership is unverified. Left untouched."
            return 'OCCUPIED_UNVERIFIED'
        }
        Write-Host "[READY] $label -> $Port (PID $($owner.Pid))" -ForegroundColor Green
        return 'READY'
    }
    Write-Warning "[TIMEOUT] $label -> $Port. Review $err and $out"
    return 'TIMEOUT'
}

# The legacy master starts E1, E2, Search, Workspace and Box. This launcher
# supplies their separate APIs and then ALL installed E3 Docs/Bulk/Wave3 apps.
$preflight = @(
    @{ Slug='search'; Name='Search'; Api=4020 },
    @{ Slug='box'; Name='Box'; Api=4022 }
)
$products = @(
    @{ Slug='docs'; Name='Docs'; Web=3023; Api=4023 },
    @{ Slug='sheets'; Name='Sheets'; Web=3024; Api=4024 },
    @{ Slug='slides'; Name='Slides'; Web=3025; Api=4025 },
    @{ Slug='forms'; Name='Forms'; Web=3026; Api=4026 },
    @{ Slug='notes'; Name='Notes'; Web=3027; Api=4027 },
    @{ Slug='calendar'; Name='Calendar'; Web=3028; Api=4028 },
    @{ Slug='contacts'; Name='Contacts'; Web=3029; Api=4029 },
    @{ Slug='photos'; Name='Photos'; Web=3030; Api=4030 },
    @{ Slug='vault'; Name='Vault'; Web=3031; Api=4031 },
    @{ Slug='spaces'; Name='Spaces'; Web=3032; Api=4032 },
    @{ Slug='boards'; Name='Boards'; Web=3033; Api=4033 },
    @{ Slug='projects'; Name='Projects'; Web=3034; Api=4034 },
    @{ Slug='flow'; Name='Flow'; Web=3035; Api=4035 },
    @{ Slug='bmail'; Name='Bmail'; Web=3036; Api=4036 },
    @{ Slug='bazmeet'; Name='BazMeet'; Web=3037; Api=4037 },
    @{ Slug='bmap'; Name='BMap'; Web=3038; Api=4038 },
    @{ Slug='translate'; Name='Translate'; Web=3039; Api=4039 },
    @{ Slug='news'; Name='News'; Web=3040; Api=4040 },
    @{ Slug='bazlens'; Name='BazLens'; Web=3041; Api=4041 },
    @{ Slug='sites'; Name='Sites'; Web=3042; Api=4042 },
    @{ Slug='bcloud'; Name='BCloud'; Web=3043; Api=4043 },
    @{ Slug='admin'; Name='Admin'; Web=3044; Api=4044 },
    @{ Slug='tasks'; Name='Tasks'; Web=3045; Api=4045 },
    @{ Slug='groups'; Name='Groups'; Web=3046; Api=4046 },
    @{ Slug='marketplace'; Name='Marketplace'; Web=3047; Api=4047 },
    @{ Slug='learn'; Name='Learn'; Web=3048; Api=4048 },
    @{ Slug='bazstore'; Name='BazStore'; Web=3049; Api=4049 },
    @{ Slug='bazgames'; Name='BazGames'; Web=3050; Api=4050 },
    @{ Slug='one'; Name='Bazaara One'; Web=3051; Api=4051 },
    @{ Slug='analytics'; Name='Analytics'; Web=3052; Api=4052 },
    @{ Slug='bazservices'; Name='BazServices'; Web=3053; Api=4053 },
    @{ Slug='bazshield'; Name='BazShield'; Web=3054; Api=4054 }
)

Write-Host "`nBAZAARA E3 managed V5 full start | $($products.Count) later products + Search/Box APIs" -ForegroundColor Cyan
Write-Host "Logs: $logRoot" -ForegroundColor DarkGray
$report = @()
foreach ($service in $preflight) {
    try {
        $state = Start-Workspace -Slug $service.Slug -Kind 'api' -Port $service.Api -WaitSeconds $ApiWaitSeconds
    }
    catch {
        $state = 'ERROR'
        Write-Warning ("Preflight $($service.Name): " + $_.Exception.Message)
        if ($_.Exception.Message -like 'Memory safety stop:*') { break }
    }
    $report += [pscustomobject]@{ Product=$service.Name; Kind='API'; Port=$service.Api; State=$state }
}
foreach ($p in $products) {
    try {
        $apiState = Start-Workspace -Slug $p.Slug -Kind 'api' -Port $p.Api -WaitSeconds $ApiWaitSeconds
        $report += [pscustomobject]@{ Product=$p.Name; Kind='API'; Port=$p.Api; State=$apiState }
        $webState = Start-Workspace -Slug $p.Slug -Kind 'web' -Port $p.Web -WaitSeconds $WebWaitSeconds
        $report += [pscustomobject]@{ Product=$p.Name; Kind='WEB'; Port=$p.Web; State=$webState }
        Start-Sleep -Seconds $PauseBetweenProductsSeconds
    }
    catch {
        $report += [pscustomobject]@{ Product=$p.Name; Kind='START'; Port=$p.Web; State='ERROR' }
        Write-Warning ("$($p.Name): " + $_.Exception.Message)
        if ($_.Exception.Message -like 'Memory safety stop:*') { break }
    }
}
Write-Host "`nBAZAARA E3 managed startup status" -ForegroundColor Cyan
$report | Format-Table -AutoSize
$csv = Join-Path $logRoot 'latest-status.csv'
$report | Export-Csv -LiteralPath $csv -NoTypeInformation -Encoding UTF8
$failures = @($report | Where-Object { $_.State -notin @('READY','REUSED') })
Write-Host "Status saved: $csv" -ForegroundColor Cyan
if ($failures.Count -gt 0) {
    Write-Warning "$($failures.Count) service checks did not succeed. Review the status and logs; existing services were preserved."
} else {
    Write-Host 'All installed E3 managed service checks passed; application functionality still requires testing.' -ForegroundColor Green
}

Write-Host "`nE3 website port inventory (3020-3054)" -ForegroundColor Cyan
$inventory = foreach ($port in 3020..3054) {
    $listeners = @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
    [pscustomobject]@{
        Port = $port
        State = if ($listeners.Count -gt 0) { 'LISTENING' } else { 'NOT_LISTENING' }
        Pid = (@($listeners | Select-Object -ExpandProperty OwningProcess -Unique) -join ',')
    }
}
$inventory | Format-Table -AutoSize
$inventory | Export-Csv -LiteralPath (Join-Path $logRoot 'latest-web-ports.csv') -NoTypeInformation -Encoding UTF8
