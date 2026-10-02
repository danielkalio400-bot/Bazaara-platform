[CmdletBinding()]
param([switch]$SkipWebBuild)
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

Import-DotEnvToProcess

function Invoke-Step([string]$Name, [scriptblock]$Action) {
    Write-Host "`n=== $Name ===" -ForegroundColor Cyan
    & $Action
    if ($LASTEXITCODE -ne 0) { throw "$Name failed with exit code $LASTEXITCODE" }
}

Invoke-Step 'Prisma schema validation' { npm run db:validate }
Invoke-Step 'Prisma client generation' { npm run db:generate }
Invoke-Step 'Static source/config validation' { npm run validate:static }
Invoke-Step 'Grocery/Food V2 product validation' { npm run validate:grocery-food-v2 }
Invoke-Step 'Monorepo TypeScript validation' { npm run typecheck }
Invoke-Step 'Platform API production build' { npm run build:api }
Invoke-Step 'Tests' { npm test }
if (-not $SkipWebBuild) { Invoke-Step 'Next.js web builds / generated route types' { npm run build:web } }
Write-Host "`nRoadmap-79 validation completed successfully." -ForegroundColor Green
