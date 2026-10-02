[CmdletBinding()]
param(
    [string]$Target = (Join-Path $env:USERPROFILE "bazaara\bazaara-platform"),
    [switch]$Validate
)

$ErrorActionPreference = "Stop"
$Source = Split-Path -Parent $PSScriptRoot
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Backup = "$Target-before-v11-$Stamp"

function Assert-PlatformRoot([string]$Path, [string]$Label) {
    if (-not (Test-Path $Path)) { throw "$Label not found: $Path" }
    if (-not (Test-Path (Join-Path $Path "package.json"))) { throw "$Label is not a BAZAARA platform root: package.json missing" }
    if (-not (Test-Path (Join-Path $Path "packages\db"))) { throw "$Label is not a BAZAARA platform root: packages\db missing" }
}

Assert-PlatformRoot $Source "V11 source"
Assert-PlatformRoot $Target "Canonical target"

Write-Host "`n=== BAZAARA V11 CANONICAL MERGE ===" -ForegroundColor Cyan
Write-Host "Source : $Source"
Write-Host "Target : $Target"
Write-Host "Backup : $Backup"

$SavedEnv = $null
if (Test-Path (Join-Path $Target ".env")) {
    $SavedEnv = Join-Path $env:TEMP "bazaara-v11-env-$Stamp"
    Copy-Item (Join-Path $Target ".env") $SavedEnv -Force
}

New-Item -ItemType Directory -Force -Path $Backup | Out-Null
robocopy $Target $Backup /E /COPY:DAT /DCOPY:DAT /R:1 /W:1 /XD node_modules .git .next .turbo .cache coverage dist build out .expo /XF "*.log" "*.tmp" "*.tsbuildinfo" | Out-Host
if ($LASTEXITCODE -gt 7) { throw "Backup failed with robocopy exit code $LASTEXITCODE" }

robocopy $Source $Target /E /COPY:DAT /DCOPY:DAT /R:2 /W:1 /XD node_modules .git .next .turbo .cache coverage dist build out .expo /XF .env "*.log" "*.tmp" "*.tsbuildinfo" | Out-Host
if ($LASTEXITCODE -gt 7) { throw "V11 merge failed with robocopy exit code $LASTEXITCODE" }

if ($SavedEnv -and (Test-Path $SavedEnv)) {
    Copy-Item $SavedEnv (Join-Path $Target ".env") -Force
    Remove-Item $SavedEnv -Force
}

Set-Location $Target
$Migration = Join-Path $Target "packages\db\prisma\migrations\20260922103000_drive_wallet_support_context\migration.sql"
if (-not (Test-Path $Migration)) { throw "V11 migration missing after merge: $Migration" }

Write-Host "`nV11 merged into canonical platform." -ForegroundColor Green
Write-Host "Existing .env preserved." -ForegroundColor Green
Write-Host "Pre-V11 backup: $Backup" -ForegroundColor Green

if ($Validate) {
    & (Join-Path $Target "scripts\verify-drive-wallet-operations-v11.ps1")
    if ($LASTEXITCODE -ne 0) { throw "V11 source validation failed with exit code $LASTEXITCODE" }
}

Write-Host "`nNext database step (after dependencies/infrastructure are ready):" -ForegroundColor Cyan
Write-Host "  npm run db:validate"
Write-Host "  npm run db:generate"
Write-Host "  npm run db:migrate:deploy"
