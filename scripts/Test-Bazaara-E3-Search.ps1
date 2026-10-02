#requires -Version 5.1
[CmdletBinding()]
param([string]$RepoRoot = (Join-Path $env:USERPROFILE 'Bazaara\bazaara-platform'))
$ErrorActionPreference = 'Stop'
$repo = [IO.Path]::GetFullPath($RepoRoot)
$api = Join-Path $repo 'services\search-api'
$web = Join-Path $repo 'apps\search-web'
& node (Join-Path $repo 'scripts\check-e3-ports.mjs') --repo $repo
if ($LASTEXITCODE -ne 0) { throw 'Repository port allocation check FAILED.' }
Push-Location $api
try {
    & node --test 'test/search.test.mjs' 'test/port-plan.test.mjs'
    if ($LASTEXITCODE -ne 0) { throw 'Search API tests FAILED.' }
} finally { Pop-Location }
if ((Test-Path -LiteralPath (Join-Path $web 'node_modules\typescript')) -or (Test-Path -LiteralPath (Join-Path $repo 'node_modules\typescript'))) {
    Push-Location $web
    try {
        & npm run typecheck --workspaces=false
        if ($LASTEXITCODE -ne 0) { throw 'Search Web typecheck FAILED.' }
    } finally { Pop-Location }
} else { Write-Warning 'Web dependencies not installed: browser build/typecheck not tested.' }
Write-Host 'E3 Search validation complete. Release and production checks remain separate.' -ForegroundColor Green
