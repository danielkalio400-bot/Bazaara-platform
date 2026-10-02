#requires -Version 5.1
[CmdletBinding()]
param([string]$RepoRoot=(Join-Path $env:USERPROFILE 'Bazaara\bazaara-platform'))

$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest

$repo=[IO.Path]::GetFullPath($RepoRoot)

function Test-PortInUse {
    param([Parameter(Mandatory=$true)][int]$Port)

    $tcp = New-Object System.Net.Sockets.TcpClient

    try {
        $pending = $tcp.BeginConnect('127.0.0.1', $Port, $null, $null)

        if (-not $pending.AsyncWaitHandle.WaitOne(350)) {
            return $false
        }

        try {
            $tcp.EndConnect($pending)
            return $true
        }
        catch [System.Net.Sockets.SocketException] {
            return $false
        }
    }
    finally {
        $tcp.Dispose()
    }
}

foreach ($port in @(3022,4022)) {
    if (Test-PortInUse -Port $port) {
        throw "Port $port is already in use. Stop the previous Box instance or inspect the process using that port."
    }
}

$exe=[System.Diagnostics.Process]::GetCurrentProcess().MainModule.FileName

$api=Join-Path $repo 'scripts\Start-Bazaara-E3-Box-API.ps1'
$web=Join-Path $repo 'scripts\Start-Bazaara-E3-Box-Web.ps1'

foreach ($file in @($api,$web)) {
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
        throw "Script missing: $file"
    }
}

Start-Process `
    -FilePath $exe `
    -WorkingDirectory $repo `
    -ArgumentList @(
        '-NoExit',
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        ('"' + $api + '"'),
        '-RepoRoot',
        ('"' + $repo + '"')
    )

Start-Sleep -Seconds 2

Start-Process `
    -FilePath $exe `
    -WorkingDirectory $repo `
    -ArgumentList @(
        '-NoExit',
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        ('"' + $web + '"'),
        '-RepoRoot',
        ('"' + $repo + '"')
    )

Write-Host ""
Write-Host "BAZAARA Box starting..." -ForegroundColor Green
Write-Host "Web: http://localhost:3022" -ForegroundColor Cyan
Write-Host "API: http://127.0.0.1:4022/health/live" -ForegroundColor Cyan
Write-Host ""
