#requires -Version 5.1
[CmdletBinding()]param([string]$RepoRoot=(Join-Path $env:USERPROFILE 'Bazaara\bazaara-platform'))
$ErrorActionPreference='Stop';$repo=[IO.Path]::GetFullPath($RepoRoot)
$dirs=@('bmail','bazmeet','bmap','translate','news','bazlens','sites','bcloud','admin','tasks','groups','marketplace','learn','bazstore','bazgames','one','analytics','bazservices','bazshield')
foreach($slug in $dirs){$api=Join-Path $repo ('services\'+$slug+'-api');if(-not(Test-Path -LiteralPath $api -PathType Container)){throw "Missing $api"};Push-Location $api;try{npm test --workspaces=false;if($LASTEXITCODE -ne 0){throw "Tests failed: $slug"}}finally{Pop-Location}}
Write-Host 'PASS: all Wave 3 API tests completed.' -ForegroundColor Green
