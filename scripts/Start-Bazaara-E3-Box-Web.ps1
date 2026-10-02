#requires -Version 5.1
[CmdletBinding()]
param([string]$RepoRoot=(Join-Path $env:USERPROFILE 'Bazaara\bazaara-platform'))
$ErrorActionPreference='Stop'
$folder=Join-Path $RepoRoot 'apps\box-web'
if(-not(Test-Path -LiteralPath (Join-Path $folder 'package.json'))){throw "Box website not installed in $folder."}
Push-Location $folder
try{
 Write-Host 'Starting BAZAARA Box website at http://localhost:3022 ...' -ForegroundColor Cyan
 & npm run dev --workspaces=false
 if($LASTEXITCODE -ne 0){throw 'Box website failed to start.'}
}finally{Pop-Location}
