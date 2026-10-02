param(
    [string]$RepoRoot = "$env:USERPROFILE\Bazaara\bazaara-platform"
)

$ErrorActionPreference = "Stop"

Set-Location $RepoRoot

$logRoot = Join-Path $RepoRoot ".bazaara-logs\e3"
New-Item -ItemType Directory -Path $logRoot -Force | Out-Null

$products = @(
    @{ Name="Sheets";   Web="@bazaara/sheets-web";   WebPort=3024; Api="@bazaara/sheets-api";   ApiPort=4024 },
    @{ Name="Slides";   Web="@bazaara/slides-web";   WebPort=3025; Api="@bazaara/slides-api";   ApiPort=4025 },
    @{ Name="Forms";    Web="@bazaara/forms-web";    WebPort=3026; Api="@bazaara/forms-api";    ApiPort=4026 },
    @{ Name="Notes";    Web="@bazaara/notes-web";    WebPort=3027; Api="@bazaara/notes-api";    ApiPort=4027 },
    @{ Name="Calendar"; Web="@bazaara/calendar-web"; WebPort=3028; Api="@bazaara/calendar-api"; ApiPort=4028 },
    @{ Name="Contacts"; Web="@bazaara/contacts-web"; WebPort=3029; Api="@bazaara/contacts-api"; ApiPort=4029 },
    @{ Name="Photos";   Web="@bazaara/photos-web";   WebPort=3030; Api="@bazaara/photos-api";   ApiPort=4030 },
    @{ Name="Vault";    Web="@bazaara/vault-web";    WebPort=3031; Api="@bazaara/vault-api";    ApiPort=4031 },
    @{ Name="Spaces";   Web="@bazaara/spaces-web";   WebPort=3032; Api="@bazaara/spaces-api";   ApiPort=4032 },
    @{ Name="Boards";   Web="@bazaara/boards-web";   WebPort=3033; Api="@bazaara/boards-api";   ApiPort=4033 },
    @{ Name="Projects"; Web="@bazaara/projects-web"; WebPort=3034; Api="@bazaara/projects-api"; ApiPort=4034 },
    @{ Name="Flow";     Web="@bazaara/flow-web";     WebPort=3035; Api="@bazaara/flow-api";     ApiPort=4035 }
)

function Test-Port {
    param([int]$Port)

    return $null -ne (
        Get-NetTCPConnection `
            -LocalPort $Port `
            -State Listen `
            -ErrorAction SilentlyContinue |
        Select-Object -First 1
    )
}

function Test-Workspace {
    param([string]$Workspace)

    $result = npm.cmd pkg get name `
        "--workspace=$Workspace" `
        2>$null

    return $LASTEXITCODE -eq 0
}

function Start-BazaaraWorkspace {
    param(
        [string]$Label,
        [string]$Workspace,
        [int]$Port
    )

    if (Test-Port $Port) {
        Write-Host "[REUSE] $Label -> $Port" -ForegroundColor Yellow
        return
    }

    if (!(Test-Workspace $Workspace)) {
        Write-Host "[MISS ] $Workspace" -ForegroundColor Red
        return
    }

    $safe = $Workspace `
        -replace '@bazaara/', '' `
        -replace '[^a-zA-Z0-9_-]', '-'

    $stdout = Join-Path $logRoot "$safe-$Port.out.log"
    $stderr = Join-Path $logRoot "$safe-$Port.err.log"

    Write-Host "[START] $Label -> $Port" -ForegroundColor Green

    $previousPort = $env:PORT

    try {
        $env:PORT = [string]$Port
        $env:NEXT_TELEMETRY_DISABLED = "1"

        Start-Process `
            -FilePath "npm.cmd" `
            -ArgumentList @(
                "run",
                "dev",
                "--workspace=$Workspace"
            ) `
            -WorkingDirectory $RepoRoot `
            -RedirectStandardOutput $stdout `
            -RedirectStandardError $stderr `
            -WindowStyle Hidden | Out-Null
    }
    finally {
        if ($null -eq $previousPort) {
            Remove-Item Env:PORT -ErrorAction SilentlyContinue
        }
        else {
            $env:PORT = $previousPort
        }
    }
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host " BAZAARA ECOSYSTEM 3 - PRODUCT SUPERVISOR" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Start APIs first
foreach ($product in $products) {
    Start-BazaaraWorkspace `
        "$($product.Name) API" `
        $product.Api `
        $product.ApiPort
}

# Then web applications
foreach ($product in $products) {
    Start-BazaaraWorkspace `
        "$($product.Name) Web" `
        $product.Web `
        $product.WebPort
}

Write-Host ""
Write-Host "Waiting for services..." -ForegroundColor Cyan

$deadline = (Get-Date).AddSeconds(90)

do {
    $pending = @()

    foreach ($product in $products) {
        if (!(Test-Port $product.WebPort)) {
            $pending += "$($product.Name) Web"
        }

        if (!(Test-Port $product.ApiPort)) {
            $pending += "$($product.Name) API"
        }
    }

    if ($pending.Count -eq 0) {
        break
    }

    Start-Sleep -Seconds 2
}
while ((Get-Date) -lt $deadline)

Write-Host ""
Write-Host "BAZAARA E3 PRODUCT STATUS" -ForegroundColor Cyan
Write-Host ""

$status = foreach ($product in $products) {
    [PSCustomObject]@{
        Product = $product.Name
        WebPort = $product.WebPort
        Web     = if (Test-Port $product.WebPort) { "LIVE" } else { "DOWN" }
        ApiPort = $product.ApiPort
        API     = if (Test-Port $product.ApiPort) { "LIVE" } else { "DOWN" }
    }
}

$status | Format-Table -AutoSize

$failed = @(
    $status | Where-Object {
        $_.Web -ne "LIVE" -or $_.API -ne "LIVE"
    }
)

if ($failed.Count -gt 0) {
    Write-Host ""
    Write-Host "Some services did not start." -ForegroundColor Yellow
    Write-Host "Logs: $logRoot" -ForegroundColor Yellow
}
else {
    Write-Host ""
    Write-Host "ALL E3 PRODUCT WEB + API SERVICES ARE LIVE" `
        -ForegroundColor Green
}