#requires -Version 5.1
[CmdletBinding()]
param([string]$RepoRoot=(Join-Path $env:USERPROFILE 'Bazaara\bazaara-platform'))
$ErrorActionPreference='Stop'
$repo=[IO.Path]::GetFullPath($RepoRoot)
Push-Location $repo
try{
 & node (Join-Path $repo 'scripts\check-e3-box-ports.mjs') --repo $repo
 if($LASTEXITCODE -ne 0){throw 'Static Box port check failed.'}
 Push-Location (Join-Path $repo 'services\box-api')
 try{& npm test --workspaces=false;if($LASTEXITCODE -ne 0){throw 'Box API tests failed.'}}finally{Pop-Location}
 $web=Join-Path $repo 'apps\box-web'
 if((Test-Path -LiteralPath (Join-Path $repo 'node_modules\next')) -or (Test-Path -LiteralPath (Join-Path $web 'node_modules\next'))){
   Push-Location $web
   try{& npm run typecheck --workspaces=false;if($LASTEXITCODE -ne 0){throw 'Box website TypeScript failed.'}}finally{Pop-Location}
 }else{Write-Warning 'Next.js dependencies are not installed: website TypeScript and production build have NOT been verified.'}
}finally{Pop-Location}
Write-Host 'Box API tests and static checks completed. Manually verify browser login, upload, download, and access controls.' -ForegroundColor Green
