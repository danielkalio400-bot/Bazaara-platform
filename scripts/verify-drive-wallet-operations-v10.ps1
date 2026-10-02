[CmdletBinding()]
param(
    [switch]$Install,
    [switch]$ApplyMigrations,
    [switch]$Full
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Invoke-Step {
    param([string]$Label, [scriptblock]$Command)
    Write-Host "`n=== $Label ===" -ForegroundColor Cyan
    & $Command
    if ($LASTEXITCODE -ne 0) { throw "$Label failed with exit code $LASTEXITCODE" }
}

if ($Install) {
    Invoke-Step "Install dependencies" { npm ci }
}

Invoke-Step "Static platform validation" { npm run validate:static }
Invoke-Step "Drive / Pharmacy regression" { npm run validate:drive-pharmacy }
Invoke-Step "Food / Business / Operations V6 regression" { npm run validate:food-business-ops-v6 }
Invoke-Step "Business / Operations V8 regression" { npm run validate:business-operations-v8 }
Invoke-Step "Business / Operations V9 regression" { npm run validate:business-operations-v9 }
Invoke-Step "Drive / Wallet / Operations V10 validation" { npm run validate:drive-wallet-operations-v10 }

if ($ApplyMigrations -or $Full) {
    Invoke-Step "Prisma schema validation" { npm run db:validate }
    Invoke-Step "Prisma client generation" { npm run db:generate }
    Invoke-Step "Apply pending migrations" { npm run db:migrate:deploy }
}

if ($Full) {
    Invoke-Step "Workspace TypeScript" { npm run typecheck }
    Invoke-Step "Automated tests" { npm test }
    Invoke-Step "Web builds" { npm run build:web }
    Invoke-Step "Platform API build" { npm run build:api }
}

Write-Host "`n==============================================" -ForegroundColor Green
Write-Host " DRIVE + WALLET + OPERATIONS V10 VERIFIED" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
