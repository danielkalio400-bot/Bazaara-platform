#requires -Version 5.1
[CmdletBinding()]
param([string]$RepoRoot = (Join-Path $env:USERPROFILE 'Bazaara\bazaara-platform'))
$ErrorActionPreference = 'Stop'
$repo = [IO.Path]::GetFullPath($RepoRoot)
$api = Join-Path $repo 'services\search-api'
$web = Join-Path $repo 'apps\search-web'
if (-not (Test-Path -LiteralPath (Join-Path $api 'src\server.mjs'))) { throw 'Install E3 Search V1.1 first.' }
if (-not (Test-Path -LiteralPath (Join-Path $web 'node_modules\next')) -and -not (Test-Path -LiteralPath (Join-Path $repo 'node_modules\next'))) {
    throw 'Next.js is not installed. Run npm install --workspaces=false in apps\search-web.'
}
& node (Join-Path $repo 'scripts\check-e3-ports.mjs') --repo $repo
if ($LASTEXITCODE -ne 0) { throw 'Repository port conflict. Do not start E3 until allocations are reconciled.' }
foreach ($port in @(4020, 3020)) {
    $taken = $null
    if (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue) {
        $taken = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
    } else {
        $taken = netstat -ano -p TCP | Select-String -Pattern ":$port\s+.*LISTENING"
    }
    if ($taken) { throw "Port $port is already in use. Identify the listener before starting E3 Search." }
}
if (-not $env:BRAVE_SEARCH_API_KEY) {
    Write-Warning 'BRAVE_SEARCH_API_KEY not set. UI can run, but real search requires your private provider key.'
}
# Override obsolete V1 shell values (4013) and any stale web .env.local at launch.
$env:SEARCH_API_PORT = '4020'
$env:SEARCH_API_HOST = '127.0.0.1'
$env:SEARCH_API_ORIGIN = 'http://127.0.0.1:4020'
Start-Process -FilePath 'powershell.exe' -WorkingDirectory $api -ArgumentList @('-NoExit', '-NoProfile', '-Command', 'node src/server.mjs')
Start-Process -FilePath 'powershell.exe' -WorkingDirectory $web -ArgumentList @('-NoExit', '-NoProfile', '-Command', 'npm run dev --workspaces=false')
Write-Host 'Started Search Web: http://127.0.0.1:3020' -ForegroundColor Green
Write-Host 'Search API: http://127.0.0.1:4020/health/live (ready requires provider key)' -ForegroundColor Cyan
Write-Host 'Existing BazChat 3013 and E1/E2 ports remain untouched.'
