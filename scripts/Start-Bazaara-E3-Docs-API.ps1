#requires -Version 5.1
[CmdletBinding()]
param([string]$RepoRoot=(Join-Path $env:USERPROFILE 'Bazaara\bazaara-platform'))
$ErrorActionPreference='Stop';$folder=Join-Path $RepoRoot 'services\docs-api'
if(-not(Test-Path -LiteralPath (Join-Path $folder '.env'))){throw "Docs API configuration missing in $folder. Run installer first."}
Push-Location $folder
try{Write-Host 'Starting BAZAARA Docs API on 127.0.0.1:4023 ...' -ForegroundColor Cyan;& node --env-file=.env src/server.mjs;if($LASTEXITCODE -ne 0){throw 'Docs API exited with an error.'}}finally{Pop-Location}
