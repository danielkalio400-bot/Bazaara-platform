#requires -Version 5.1
[CmdletBinding()]
param([string]$RepoRoot = (Join-Path $env:USERPROFILE 'Bazaara\bazaara-platform'))
$ErrorActionPreference='Stop'
$repo=[IO.Path]::GetFullPath($RepoRoot)
Push-Location $repo
try {
    & node (Join-Path $repo 'scripts\check-e3-workspace-port.mjs') --repo $repo
    if($LASTEXITCODE -ne 0){throw 'Port validation failed.'}
    Push-Location (Join-Path $repo 'apps\workspace-web')
    try {
        & npm test --workspaces=false
        if($LASTEXITCODE -ne 0){throw 'Workspace unit tests failed.'}
        & npm run typecheck --workspaces=false
        if($LASTEXITCODE -ne 0){throw 'Workspace TypeScript failed.'}
    } finally { Pop-Location }
} finally { Pop-Location }
Write-Host 'Workspace static tests and typecheck passed. Browser E2E, BazID live login, and production build require separate verification.' -ForegroundColor Green
