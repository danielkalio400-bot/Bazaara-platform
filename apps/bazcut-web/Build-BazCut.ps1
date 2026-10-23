[CmdletBinding()]
param(
  [ValidateSet('windows', 'android', 'ios', 'ios-simulator')]
  [string]$Platform = 'windows',
  [ValidateSet('doctor', 'build', 'dev')]
  [string]$Action = 'build',
  [switch]$Release
)
$ErrorActionPreference = 'Stop'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Install Node.js 22.18+ and reopen PowerShell.' }
Push-Location $PSScriptRoot
try {
  $BuildArgs = @('scripts/native.mjs', $Action, $Platform)
  if ($Release) { $BuildArgs += '--release' }
  & node @BuildArgs
  if ($LASTEXITCODE -ne 0) { throw 'BazCut build did not complete. The missing prerequisite or build error is shown above.' }
} finally { Pop-Location }
