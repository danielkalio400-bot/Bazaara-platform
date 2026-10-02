[CmdletBinding()]
param(
    [switch]$NoBrowser,
    [switch]$SkipInfrastructure
)

# BAZAARA_INFRA_REUSE_V1_1_BEGIN
function Test-BazaaraTcpPort {
    param(
        [Parameter(Mandatory = $true)][int]$Port,
        [string]$HostName = "127.0.0.1",
        [int]$TimeoutMs = 450
    )

    $Client = [System.Net.Sockets.TcpClient]::new()

    try {
        $Connect = $Client.ConnectAsync($HostName, $Port)

        if (-not $Connect.Wait($TimeoutMs)) {
            return $false
        }

        return $Client.Connected
    }
    catch {
        return $false
    }
    finally {
        $Client.Dispose()
    }
}

function Get-BazaaraDockerPortOwner {
    param(
        [Parameter(Mandatory = $true)][int]$Port
    )

    $Rows = @(
        & docker ps `
            --filter "publish=$Port" `
            --format "{{.ID}}|{{.Names}}|{{.Ports}}" `
            2>$null
    )

    if ($LASTEXITCODE -ne 0) {
        throw "Docker is not available. Start Docker Desktop and retry."
    }

    $First = $Rows | Select-Object -First 1

    if ([string]::IsNullOrWhiteSpace($First)) {
        return $null
    }

    $Parts = $First -split "\|", 3

    return [pscustomobject]@{
        Id    = $Parts[0]
        Name  = if ($Parts.Count -gt 1) { $Parts[1] } else { $Parts[0] }
        Ports = if ($Parts.Count -gt 2) { $Parts[2] } else { "" }
    }
}

function Wait-BazaaraPort {
    param(
        [Parameter(Mandatory = $true)][int]$Port,
        [int]$TimeoutSeconds = 30
    )

    $Deadline = (Get-Date).AddSeconds($TimeoutSeconds)

    do {
        if (Test-BazaaraTcpPort -Port $Port) {
            return
        }

        Start-Sleep -Milliseconds 500
    }
    while ((Get-Date) -lt $Deadline)

    throw "Timed out waiting for localhost:$Port."
}

function Start-BazaaraInfrastructureReuseAware {
    Write-Host ""
    Write-Host "=== Bazaara infrastructure ===" -ForegroundColor Cyan

    $Infra = @(
        [pscustomobject]@{
            Service = "postgres"
            Label = "PostgreSQL"
            PrimaryPort = 15433
            Ports = @(15433)
        },
        [pscustomobject]@{
            Service = "redis"
            Label = "Redis"
            PrimaryPort = 6380
            Ports = @(6380)
        },
        [pscustomobject]@{
            Service = "minio"
            Label = "MinIO"
            PrimaryPort = 9000
            Ports = @(9000, 9001)
        }
    )

    & docker info *> $null

    if ($LASTEXITCODE -ne 0) {
        throw "Docker Desktop is not available. Start Docker Desktop and retry."
    }

    $MissingServices = [System.Collections.Generic.List[string]]::new()
    $PortsToWaitFor = [System.Collections.Generic.List[int]]::new()

    foreach ($Item in $Infra) {
        $PrimaryOwner = Get-BazaaraDockerPortOwner -Port $Item.PrimaryPort

        if ($null -ne $PrimaryOwner) {
            Write-Host (
                "Reusing {0} from Docker container {1} on port {2}." -f `
                    $Item.Label,
                    $PrimaryOwner.Name,
                    $Item.PrimaryPort
            ) -ForegroundColor Green

            continue
        }

        if (Test-BazaaraTcpPort -Port $Item.PrimaryPort) {
            throw (
                "{0} port {1} is already open, but Docker does not report a container publishing it. " +
                "The startup script will not kill or replace an unknown process." -f `
                    $Item.Label,
                    $Item.PrimaryPort
            )
        }

        foreach ($Port in $Item.Ports) {
            if ($Port -eq $Item.PrimaryPort) {
                continue
            }

            $OtherOwner = Get-BazaaraDockerPortOwner -Port $Port

            if ($null -ne $OtherOwner) {
                throw (
                    "{0} cannot be started because required host port {1} is already published by Docker container {2}." -f `
                        $Item.Label,
                        $Port,
                        $OtherOwner.Name
                )
            }

            if (Test-BazaaraTcpPort -Port $Port) {
                throw (
                    "{0} cannot be started because required host port {1} is already in use outside Docker." -f `
                        $Item.Label,
                        $Port
                )
            }
        }

        $MissingServices.Add($Item.Service)
        $PortsToWaitFor.Add($Item.PrimaryPort)

        Write-Host (
            "{0} is not running on port {1}; it will be started from this repo." -f `
                $Item.Label,
                $Item.PrimaryPort
        ) -ForegroundColor Yellow
    }

    if ($MissingServices.Count -eq 0) {
        Write-Host "All required infrastructure is already available. Docker Compose startup skipped." -ForegroundColor Green
        return
    }

    $ComposeArgs = @(
        "compose",
        "up",
        "-d",
        "--no-deps"
    ) + @($MissingServices)

    Write-Host ""
    Write-Host (
        "Starting only missing services: {0}" -f `
            ($MissingServices -join ", ")
    ) -ForegroundColor Cyan

    & docker @ComposeArgs

    if ($LASTEXITCODE -ne 0) {
        throw "docker compose up for missing infrastructure services failed."
    }

    foreach ($Port in $PortsToWaitFor) {
        Wait-BazaaraPort -Port $Port -TimeoutSeconds 30
    }

    Write-Host "Missing infrastructure services are ready." -ForegroundColor Green
}
# BAZAARA_INFRA_REUSE_V1_1_END

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root


function Import-DotEnvToProcess {
    param([string]$Path = '.env')
    if (-not (Test-Path $Path)) { return }
    foreach ($rawLine in Get-Content $Path) {
        $line = $rawLine.Trim()
        if (-not $line -or $line.StartsWith('#') -or $line -notmatch '^[A-Za-z_][A-Za-z0-9_]*\s*=') { continue }
        $parts = $line -split '=', 2
        $name = $parts[0].Trim()
        $value = $parts[1].Trim()
        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        if (-not [Environment]::GetEnvironmentVariable($name, 'Process')) {
            [Environment]::SetEnvironmentVariable($name, $value, 'Process')
        }
    }
}


# BAZAARA_UNIFIED_STARTUP_V2
$apps = @(
    # Shared API + Ecosystem 1
    @{ Ecosystem = 1; Name = 'Platform API';     Port = 4000; Script = 'dev:api' },
    @{ Ecosystem = 1; Name = 'Business';         Port = 3001; Script = 'dev:business' },
    @{ Ecosystem = 1; Name = 'Operations';       Port = 3002; Script = 'dev:operations' },
    @{ Ecosystem = 1; Name = 'Shopping';         Port = 3003; Script = 'dev:shopping' },
    @{ Ecosystem = 1; Name = 'BazID';            Port = 3004; Script = 'dev:bazid' },
    @{ Ecosystem = 1; Name = 'BAZAARA Platform'; Port = 3005; Script = 'dev:platform' },
    @{ Ecosystem = 1; Name = 'Grocery';          Port = 3006; Script = 'dev:grocery' },
    @{ Ecosystem = 1; Name = 'Food';             Port = 3007; Script = 'dev:food' },
    @{ Ecosystem = 1; Name = 'Logistics';        Port = 3008; Script = 'dev:logistics' },
    @{ Ecosystem = 1; Name = 'Drive';            Port = 3009; Script = 'dev:drive' },
    @{ Ecosystem = 1; Name = 'Wallet';           Port = 3010; Script = 'dev:wallet' },
    @{ Ecosystem = 1; Name = 'Pharmacy';         Port = 3011; Script = 'dev:pharmacy' },
    @{ Ecosystem = 1; Name = 'Bazasport';        Port = 3012; Script = 'dev:sport' },

    # Ecosystem 2 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Social, Media & Communication
    @{ Ecosystem = 2; Name = 'BChat';            Port = 3013; Script = 'dev:bchat' },
    @{ Ecosystem = 2; Name = 'ZimZam';           Port = 3014; Script = 'dev:zimzam' },
    @{ Ecosystem = 2; Name = 'BTune';            Port = 3015; Script = 'dev:btune' },
    @{ Ecosystem = 2; Name = 'Bicord';           Port = 3017; Script = 'dev:bicord' },
    @{ Ecosystem = 2; Name = 'BazCut';           Port = 3018; Script = 'dev:bazcut' },
    @{ Ecosystem = 2; Name = 'BSend';            Port = 3019; Script = 'dev:bsend' }
)

function Add-BazaaraWorkspaceApp {
    param(
        [Parameter(Mandatory = $true)][int]$Ecosystem,
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][int]$Port,
        [Parameter(Mandatory = $true)][string]$RelativePath
    )

    $packagePath = Join-Path $Root (Join-Path $RelativePath 'package.json')
    if (-not (Test-Path -LiteralPath $packagePath -PathType Leaf)) {
        return
    }

    try {
        $package = Get-Content -LiteralPath $packagePath -Raw | ConvertFrom-Json
        $workspaceName = [string]$package.name
    }
    catch {
        throw "Could not read workspace package: $packagePath"
    }

    if ([string]::IsNullOrWhiteSpace($workspaceName)) {
        throw "Workspace package has no name: $packagePath"
    }

    $script:apps += @{
        Ecosystem = $Ecosystem
        Name = $Name
        Port = $Port
        Workspace = $workspaceName
    }
}

# Ecosystem 3 occupies a separate range so it cannot collide with Ecosystem 2.
Add-BazaaraWorkspaceApp -Ecosystem 3 -Name 'Search'    -Port 3020 -RelativePath 'apps\search-web'
Add-BazaaraWorkspaceApp -Ecosystem 3 -Name 'Workspace' -Port 3021 -RelativePath 'apps\workspace-web'
Add-BazaaraWorkspaceApp -Ecosystem 3 -Name 'Box'       -Port 3022 -RelativePath 'apps\box-web'
Add-BazaaraWorkspaceApp -Ecosystem 2 -Name 'Biflix' -Port 3055 -RelativePath 'apps\biflix-web'
function Get-PortOwner([int]$Port) {
    $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $connection) { return $null }
    $process = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue
    return [PSCustomObject]@{ Port = $Port; Pid = $connection.OwningProcess; Process = $(if ($process) { $process.ProcessName } else { 'unknown' }) }
}

Write-Host 'BAZAARA Platform - unified local startup (Ecosystems 1, 2 and 3)' -ForegroundColor Cyan
Write-Host 'Existing BAZAARA processes from this repository will be reused.' -ForegroundColor DarkGray

function Get-BazaaraListenerState {
    param([Parameter(Mandatory = $true)][int]$Port)

    $owner = Get-PortOwner $Port
    if (-not $owner) { return $null }

    $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $($owner.Pid)" -ErrorAction SilentlyContinue
    $commandLine = if ($processInfo) { [string]$processInfo.CommandLine } else { '' }
    $rootText = $Root.ToLowerInvariant()
    $commandText = $commandLine.ToLowerInvariant()

    $isBazaara = $commandText.Contains($rootText) -or $commandText.Contains('bazaara-platform')

    # Port 4000 may be a previously started BAZAARA API. Confirm it through the public liveness endpoint.
    if (-not $isBazaara -and $Port -eq 4000) {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:4000/health/live' -TimeoutSec 2
            if ($response.StatusCode -eq 200) { $isBazaara = $true }
        }
        catch { }
    }

    return [pscustomobject]@{
        Owner = $owner
        IsBazaara = $isBazaara
        CommandLine = $commandLine
    }
}

$portConflicts = @()
$appsToStart = @()

foreach ($app in $apps) {
    $state = Get-BazaaraListenerState -Port $app.Port

    if (-not $state) {
        $appsToStart += $app
        continue
    }

    if ($state.IsBazaara) {
        Write-Host ("Reusing E{0} {1} on port {2} (PID {3})." -f $app.Ecosystem, $app.Name, $app.Port, $state.Owner.Pid) -ForegroundColor Green
        continue
    }

    $portConflicts += [pscustomobject]@{
        Ecosystem = $app.Ecosystem
        Name = $app.Name
        Port = $app.Port
        Pid = $state.Owner.Pid
        Process = $state.Owner.Process
    }
}

if ($portConflicts.Count -gt 0) {
    Write-Warning 'Some existing listeners could not be verified as BAZAARA. They will be left untouched. Missing services can still start.'
    $portConflicts | Format-Table -AutoSize
}
if (-not $SkipInfrastructure) {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Docker Desktop / docker CLI is required for PostgreSQL, Redis and MinIO.' }
Start-BazaaraInfrastructureReuseAware
}

if (-not (Test-Path '.env')) {
    Copy-Item '.env.example' '.env'
    Write-Host 'Created .env from .env.example. Review external provider values before production use.' -ForegroundColor Yellow
}
Import-DotEnvToProcess

foreach ($app in $appsToStart) {
    $title = "BAZAARA E$($app.Ecosystem) - $($app.Name) [$($app.Port)]"

    if ($app.ContainsKey('Workspace')) {
        $npmCommand = "npm.cmd run dev --workspace=$($app.Workspace)"
    }
    else {
        $npmCommand = "npm.cmd run $($app.Script)"
    }

    $safeRoot = $Root.Replace("'", "''")
    $safeTitle = $title.Replace("'", "''")
    $command = "Set-Location -LiteralPath '$safeRoot'; `$Host.UI.RawUI.WindowTitle = '$safeTitle'; $npmCommand"

    Start-Process powershell.exe -NoNewWindow -ArgumentList @( '-ExecutionPolicy', 'Bypass', '-Command', $command) | Out-Null
    Write-Host ("Starting E{0} {1} on port {2}." -f $app.Ecosystem, $app.Name, $app.Port) -ForegroundColor Cyan
    Start-Sleep -Milliseconds 250
}

Write-Host ''
Write-Host 'BAZAARA unified localhost registry:' -ForegroundColor Green
$apps | Sort-Object Port | ForEach-Object { Write-Host ("  E{0} {1,-18} http://localhost:{2}" -f $_.Ecosystem, $_.Name, $_.Port) }

$healthy = $false
for ($i = 0; $i -lt 60; $i++) {
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:4000/health/live' -TimeoutSec 2
        if ($response.StatusCode -eq 200) { $healthy = $true; break }
    } catch { }
    Start-Sleep -Seconds 1
}
if ($healthy) { Write-Host 'Platform API health check: OK' -ForegroundColor Green }
else { Write-Host 'Platform API did not become healthy within 60 seconds; inspect its PowerShell window.' -ForegroundColor Yellow }


# V4 replaces this legacy auto-start block; old launcher remains available for manual use.

if (-not $NoBrowser) { Start-Process 'http://localhost:3005' }

# V4 replaces this legacy auto-start block; old launcher remains available for manual use.


# BAZAARA_FULL_MANAGED_V5_BEGIN
# Start ALL installed E3 services (3023-3054), safely skipping occupied unverified ports.
$managedLauncher = Join-Path $PSScriptRoot 'Start-Bazaara-E3-Managed.ps1'
if (-not (Test-Path -LiteralPath $managedLauncher -PathType Leaf)) { throw 'V5 managed launcher missing.' }
& $managedLauncher -RepoRoot $Root
# BAZAARA_FULL_MANAGED_V5_END
