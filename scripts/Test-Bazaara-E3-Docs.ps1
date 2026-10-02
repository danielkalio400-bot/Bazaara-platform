#requires -Version 5.1
[CmdletBinding()]
param([string]$RepoRoot=(Join-Path $env:USERPROFILE 'Bazaara\bazaara-platform'))
$ErrorActionPreference='Stop';$repo=[IO.Path]::GetFullPath($RepoRoot)
Push-Location $repo
try{
 & node (Join-Path $repo 'scripts\check-e3-docs-ports.mjs') --repo $repo;if($LASTEXITCODE -ne 0){throw 'Static Docs port check failed.'}
 Push-Location (Join-Path $repo 'services\docs-api');try{& npm test --workspaces=false;if($LASTEXITCODE -ne 0){throw 'Docs API tests failed.'}}finally{Pop-Location}
 $web=Join-Path $repo 'apps\docs-web';if((Test-Path -LiteralPath (Join-Path $repo 'node_modules\next')) -or (Test-Path -LiteralPath (Join-Path $web 'node_modules\next'))){Push-Location $web;try{& npm run typecheck --workspaces=false;if($LASTEXITCODE -ne 0){throw 'Docs website TypeScript failed.'}}finally{Pop-Location}}else{Write-Warning 'Next.js dependencies are not installed: Docs website TypeScript/build have NOT been verified.'}
}finally{Pop-Location}
Write-Host 'Docs API tests and static checks completed.' -ForegroundColor Green
