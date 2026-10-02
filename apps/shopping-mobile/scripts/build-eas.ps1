param([ValidateSet("android-internal","android-development","android-production","ios-development","ios-production")][string]$Target="android-internal")
$ErrorActionPreference="Stop"
$ProjectRoot=Join-Path $HOME "Bazaara\bazaara-platform"
$MobileRoot=Join-Path $ProjectRoot "apps\shopping-mobile"
Set-Location $MobileRoot
$Platform=if($Target.StartsWith("ios")){"ios"}else{"android"}
$Profile=if($Target.EndsWith("production")){"production"}elseif($Target.EndsWith("development")){"development"}else{"internal"}
if($Profile -eq "production"){
  $Api=[string]$env:EXPO_PUBLIC_API_BASE_URL;$BazId=[string]$env:EXPO_PUBLIC_BAZID_BASE_URL
  if($Api -notmatch '^https://'){throw "Production build blocked: EXPO_PUBLIC_API_BASE_URL must be a real HTTPS endpoint."}
  if($BazId -notmatch '^https://'){throw "Production build blocked: EXPO_PUBLIC_BAZID_BASE_URL must be a real HTTPS endpoint."}
}
Write-Host ("BAZAARA Shopping EAS build: {0} / {1}" -f $Platform,$Profile) -ForegroundColor Cyan
& npx eas-cli@latest build --platform $Platform --profile $Profile --non-interactive
if($LASTEXITCODE -ne 0){throw "EAS build command failed."}
