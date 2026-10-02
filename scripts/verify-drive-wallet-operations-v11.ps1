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

# Prisma runs inside the packages/db workspace; import the root .env into this
# process so DATABASE_URL is available even when Prisma's cwd is packages/db.
# Respect environment variables already supplied by the caller.
function Import-ProjectEnv {
    $EnvPath = Join-Path $Root ".env"
    if (-not (Test-Path -LiteralPath $EnvPath)) { return }
    foreach ($Raw in Get-Content -LiteralPath $EnvPath) {
        $Line = $Raw.Trim()
        if (-not $Line -or $Line.StartsWith("#") -or $Line -notmatch '^([A-Za-z_][A-Za-z0-9_]*)\s*=') { continue }
        $Parts = $Line -split '=', 2
        $Name = $Parts[0].Trim()
        $Value = $Parts[1].Trim()
        if ($Value.Length -ge 2 -and
            (($Value.StartsWith('"') -and $Value.EndsWith('"')) -or
             ($Value.StartsWith("'") -and $Value.EndsWith("'")))) {
            $Value = $Value.Substring(1, $Value.Length - 2)
        }
        if (-not [Environment]::GetEnvironmentVariable($Name, "Process")) {
            [Environment]::SetEnvironmentVariable($Name, $Value, "Process")
        }
    }
}

Import-ProjectEnv

if ($Install) {
    Invoke-Step "Install dependencies" { npm ci }
}

Invoke-Step "Complete source release validation" { npm run validate:current-release }

if ($ApplyMigrations -or $Full) {
    if (-not (Test-Path (Join-Path $Root ".env"))) {
        throw "A project .env is required for dependency-backed validation. Copy .env.example and review your database credentials first."
    }
    Invoke-Step "Prisma schema validation" { npm run db:validate }
    Invoke-Step "Prisma client generation" { npm run db:generate }
}

# Migrations are opt-in, even when -Full is supplied. Existing PostgreSQL
# installations may have applied baselines; never reset the user's data.
if ($ApplyMigrations) {
    Invoke-Step "Apply pending migrations (non-destructive migrate deploy)" { npm run db:migrate:deploy }
}

if ($Full) {
    Invoke-Step "Workspace TypeScript" { npm run typecheck }
    Invoke-Step "Automated tests" { npm test }
    Invoke-Step "Web builds" { npm run build:web }
    Invoke-Step "Platform API build" { npm run build:api }
}

Write-Host "`n==============================================" -ForegroundColor Green
Write-Host " DRIVE + WALLET + OPERATIONS V11 VERIFIED" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
