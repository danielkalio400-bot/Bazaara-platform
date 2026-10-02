#requires -Version 5.1
[CmdletBinding()]
param([string]$RepoRoot=(Join-Path $env:USERPROFILE 'Bazaara\bazaara-platform'))
$ErrorActionPreference='Stop';Set-StrictMode -Version Latest;$repo=[IO.Path]::GetFullPath($RepoRoot)
function Test-PortInUse{param([Parameter(Mandatory=$true)][int]$Port)$tcp=New-Object System.Net.Sockets.TcpClient;try{$pending=$tcp.BeginConnect('127.0.0.1',$Port,$null,$null);if(-not $pending.AsyncWaitHandle.WaitOne(350)){return $false}try{$tcp.EndConnect($pending);return $true}catch [System.Net.Sockets.SocketException]{return $false}}finally{$tcp.Dispose()}}
foreach($port in @(3023,4023)){if(Test-PortInUse -Port $port){throw "Port $port is already in use. Stop the previous Docs instance or inspect the process using that port."}}
$exe=[System.Diagnostics.Process]::GetCurrentProcess().MainModule.FileName;if(-not(Test-Path -LiteralPath $exe -PathType Leaf)){throw 'Cannot resolve the active PowerShell executable.'}
$api=Join-Path $repo 'scripts\Start-Bazaara-E3-Docs-API.ps1';$web=Join-Path $repo 'scripts\Start-Bazaara-E3-Docs-Web.ps1';foreach($file in @($api,$web)){if(-not(Test-Path -LiteralPath $file -PathType Leaf)){throw "Script missing: $file"}}
Start-Process -FilePath $exe -WorkingDirectory $repo -ArgumentList @('-NoExit','-NoProfile','-ExecutionPolicy','Bypass','-File',('"'+$api+'"'),'-RepoRoot',('"'+$repo+'"'))
Start-Sleep -Seconds 2
Start-Process -FilePath $exe -WorkingDirectory $repo -ArgumentList @('-NoExit','-NoProfile','-ExecutionPolicy','Bypass','-File',('"'+$web+'"'),'-RepoRoot',('"'+$repo+'"'))
Write-Host 'Opening two PowerShell windows: Docs API 4023 and Docs website 3023.' -ForegroundColor Green
Write-Host 'Keep Platform API 4000 and Box API 4022 running before using Docs.' -ForegroundColor Yellow
Write-Host 'Web: http://localhost:3023  |  API readiness: http://127.0.0.1:4023/health/ready'
