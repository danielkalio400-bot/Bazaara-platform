#requires -Version 5.1
[CmdletBinding()]
param(
  [string]$RepoRoot=(Join-Path $env:USERPROFILE 'Bazaara\bazaara-platform'),
  [string[]]$Only=@(),
  [switch]$NoBrowser
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$repo=[IO.Path]::GetFullPath($RepoRoot)
$products=@(
    [pscustomobject]@{ Slug='bmail'; Name='Bmail'; Web=3036; Api=4036 },
    [pscustomobject]@{ Slug='bazmeet'; Name='BazMeet'; Web=3037; Api=4037 },
    [pscustomobject]@{ Slug='bmap'; Name='BMap'; Web=3038; Api=4038 },
    [pscustomobject]@{ Slug='translate'; Name='Translate'; Web=3039; Api=4039 },
    [pscustomobject]@{ Slug='news'; Name='News'; Web=3040; Api=4040 },
    [pscustomobject]@{ Slug='bazlens'; Name='BazLens'; Web=3041; Api=4041 },
    [pscustomobject]@{ Slug='sites'; Name='Sites'; Web=3042; Api=4042 },
    [pscustomobject]@{ Slug='bcloud'; Name='BCloud'; Web=3043; Api=4043 },
    [pscustomobject]@{ Slug='admin'; Name='Admin'; Web=3044; Api=4044 },
    [pscustomobject]@{ Slug='tasks'; Name='Tasks'; Web=3045; Api=4045 },
    [pscustomobject]@{ Slug='groups'; Name='Groups'; Web=3046; Api=4046 },
    [pscustomobject]@{ Slug='marketplace'; Name='Marketplace'; Web=3047; Api=4047 },
    [pscustomobject]@{ Slug='learn'; Name='Learn'; Web=3048; Api=4048 },
    [pscustomobject]@{ Slug='bazstore'; Name='BazStore'; Web=3049; Api=4049 },
    [pscustomobject]@{ Slug='bazgames'; Name='BazGames'; Web=3050; Api=4050 },
    [pscustomobject]@{ Slug='one'; Name='Bazaara One'; Web=3051; Api=4051 },
    [pscustomobject]@{ Slug='analytics'; Name='Analytics'; Web=3052; Api=4052 },
    [pscustomobject]@{ Slug='bazservices'; Name='BazServices'; Web=3053; Api=4053 },
    [pscustomobject]@{ Slug='bazshield'; Name='BazShield'; Web=3054; Api=4054 }
)
if($Only.Count -gt 0){$wanted=@($Only|ForEach-Object{$_.ToLowerInvariant()});$products=@($products|Where-Object{$wanted -contains $_.Slug.ToLowerInvariant()});if($products.Count -eq 0){throw 'No matching Wave 3 products were selected.'}}
function Test-Port([int]$Port){$c=New-Object System.Net.Sockets.TcpClient;try{$a=$c.BeginConnect('127.0.0.1',$Port,$null,$null);if(-not $a.AsyncWaitHandle.WaitOne(300)){return $false};try{$c.EndConnect($a);return $true}catch{return $false}}finally{$c.Dispose()}}
$exe=[System.Diagnostics.Process]::GetCurrentProcess().MainModule.FileName
foreach($p in $products){
  foreach($port in @($p.Web,$p.Api)){if(Test-Port $port){throw "Port $port is already in use before starting $($p.Name)."}}
}
foreach($p in $products){
  $apiDir=Join-Path $repo ('services\'+$p.Slug+'-api');$webDir=Join-Path $repo ('apps\'+$p.Slug+'-web')
  if(-not(Test-Path -LiteralPath $apiDir -PathType Container)){throw "Missing API workspace: $apiDir"}
  if(-not(Test-Path -LiteralPath $webDir -PathType Container)){throw "Missing web workspace: $webDir"}
  $apiCmd="Set-Location -LiteralPath '$($apiDir.Replace("'","''"))'; `$Host.UI.RawUI.WindowTitle='BAZAARA - $($p.Name) API [$($p.Api)]'; npm run dev --workspaces=false"
  $webCmd="Set-Location -LiteralPath '$($webDir.Replace("'","''"))'; `$Host.UI.RawUI.WindowTitle='BAZAARA - $($p.Name) Web [$($p.Web)]'; npm run dev --workspaces=false"
  Start-Process -FilePath $exe -ArgumentList @('-NoExit','-NoProfile','-ExecutionPolicy','Bypass','-Command',$apiCmd)|Out-Null
  Start-Sleep -Milliseconds 180
  Start-Process -FilePath $exe -ArgumentList @('-NoExit','-NoProfile','-ExecutionPolicy','Bypass','-Command',$webCmd)|Out-Null
  Start-Sleep -Milliseconds 180
  Write-Host ("[START] {0} API -> {1} | Web -> {2}" -f $p.Name,$p.Api,$p.Web) -ForegroundColor Green
}
if(-not $NoBrowser -and $products.Count -gt 0){Start-Process ('http://localhost:'+[string]$products[0].Web)}
Write-Host ''
Write-Host 'Wave 3 launch commands:' -ForegroundColor Cyan
Write-Host '  All:   .\scripts\Start-Bazaara-E3-Wave3.ps1'
Write-Host "  Some:  .\scripts\Start-Bazaara-E3-Wave3.ps1 -Only bmail,bazmeet,bmap"
