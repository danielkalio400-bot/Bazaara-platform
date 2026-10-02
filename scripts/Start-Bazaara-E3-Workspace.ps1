#requires -Version 5.1
[CmdletBinding()]
param([string]$RepoRoot = (Join-Path $env:USERPROFILE 'Bazaara\bazaara-platform'))
$ErrorActionPreference='Stop'
$repo = [IO.Path]::GetFullPath($RepoRoot)
$workspace = Join-Path $repo 'apps\workspace-web'
if (-not (Test-Path -LiteralPath (Join-Path $workspace 'package.json'))) { throw 'Install Workspace V1.2 first.' }
if (-not (Test-Path -LiteralPath (Join-Path $repo 'node_modules\next')) -and -not (Test-Path -LiteralPath (Join-Path $workspace 'node_modules\next'))) { throw 'Next.js is missing. Run npm install --workspaces=false inside apps\workspace-web.' }
& node (Join-Path $repo 'scripts\check-e3-workspace-port.mjs') --repo $repo
if($LASTEXITCODE -ne 0){ throw 'Workspace port conflict detected.' }
if(Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue){
    if(Get-NetTCPConnection -LocalPort 3021 -State Listen -ErrorAction SilentlyContinue){ throw 'Port 3021 is already in use; identify that process before starting Workspace.' }
} elseif(netstat -ano -p TCP | Select-String -Pattern ':3021\s+.*LISTENING'){ throw 'Port 3021 is already in use.' }
$env:WORKSPACE_PUBLIC_ORIGIN='http://localhost:3021'
if(-not $env:PLATFORM_API_ORIGIN){$env:PLATFORM_API_ORIGIN='http://127.0.0.1:4000'}
Start-Process -FilePath 'powershell.exe' -WorkingDirectory $workspace -ArgumentList @('-NoExit','-NoProfile','-Command','npm run dev --workspaces=false')
Write-Host 'Workspace: http://localhost:3021' -ForegroundColor Green
Write-Host 'Requires existing Platform API http://localhost:4000, BazID http://localhost:3004, Search http://localhost:3020.' -ForegroundColor Yellow
Write-Host 'Use localhost (not 127.0.0.1) when signing into BazID and Workspace so host-only session cookies are shared.'
