[CmdletBinding()]
param([string]$ProjectRoot = (Get-Location).Path)
$ErrorActionPreference="Stop"
$ProjectRoot=[IO.Path]::GetFullPath($ProjectRoot)
if (!(Test-Path -LiteralPath (Join-Path $ProjectRoot "packages/db/prisma/seed-ui-smoke-v15.ts"))) { throw "Install the V15 patch first." }
if (!(Test-Path -LiteralPath (Join-Path $ProjectRoot "node_modules/.bin/tsx.cmd"))) { throw "Dependencies not installed. Run npm ci first." }
if ($env:NODE_ENV -eq "production") { throw "Refusing to seed production." }
$databaseUrl=$env:DATABASE_URL
if (!$databaseUrl) {
    $envFile=Join-Path $ProjectRoot ".env"
    if (!(Test-Path -LiteralPath $envFile)) { $envFile=Join-Path $ProjectRoot "packages/db/.env" }
    if (!(Test-Path -LiteralPath $envFile)) { throw "DATABASE_URL is missing. Set it to your LOCAL development database or create a local .env." }
    $line=Get-Content -LiteralPath $envFile | Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } | Select-Object -First 1
    if (!$line) { throw "DATABASE_URL was not found in .env." }
    $databaseUrl=($line -split '=',2)[1].Trim().Trim('"').Trim("'")
}
try { $uri=[Uri]$databaseUrl } catch { throw "DATABASE_URL must be a valid local PostgreSQL URL." }
if ($uri.Scheme -notin @("postgresql","postgres") -or $uri.Host -notin @("localhost","127.0.0.1","[::1]")) { throw "Demo seed is allowed only on LOCAL PostgreSQL. Refused: $($uri.Host)" }
Write-Host "Demo seed target: $($uri.Host):$($uri.Port)$($uri.AbsolutePath)" -ForegroundColor Yellow
Write-Host "Creates only BAZAARA-V15-DEMO products and a demo Food restaurant. Existing merchant stock is not overwritten." -ForegroundColor Yellow
$approval=Read-Host "Type LOCAL_TEST_ONLY to seed THIS local database"
if ($approval -cne "LOCAL_TEST_ONLY") { throw "No changes made." }
$previousAck=$env:BAZAARA_DEMO_SEED_ACK
$previousDb=$env:DATABASE_URL
try {
    $env:BAZAARA_DEMO_SEED_ACK="LOCAL_TEST_ONLY"
    $env:DATABASE_URL=$databaseUrl
    Push-Location $ProjectRoot
    try { & (Join-Path $ProjectRoot "node_modules/.bin/tsx.cmd") "packages/db/prisma/seed-ui-smoke-v15.ts"; if ($LASTEXITCODE -ne 0) { throw "V15 demo seed failed ($LASTEXITCODE)." } }
    finally { Pop-Location }
}
finally { $env:BAZAARA_DEMO_SEED_ACK=$previousAck; $env:DATABASE_URL=$previousDb }
Write-Host "Demo seed complete. Start BAZAARA locally and run the V15 smoke tests." -ForegroundColor Green
