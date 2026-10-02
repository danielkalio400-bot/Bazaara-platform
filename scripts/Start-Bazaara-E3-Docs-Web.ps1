#requires -Version 5.1
[CmdletBinding()]
param([string]$RepoRoot=(Join-Path $env:USERPROFILE 'Bazaara\bazaara-platform'))
$ErrorActionPreference='Stop';$folder=Join-Path $RepoRoot 'apps\docs-web'
if(-not(Test-Path -LiteralPath (Join-Path $folder 'package.json'))){throw "Docs website not installed in $folder."}
Push-Location $folder
try{Write-Host 'Starting BAZAARA Docs website at http://localhost:3023 ...' -ForegroundColor Cyan;& npm run dev --workspaces=false;if($LASTEXITCODE -ne 0){throw 'Docs website failed to start.'}}finally{Pop-Location}
