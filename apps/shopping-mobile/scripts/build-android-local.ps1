$ErrorActionPreference="Stop"
$ProjectRoot=Join-Path $HOME "Bazaara\bazaara-platform"
$MobileRoot=Join-Path $ProjectRoot "apps\shopping-mobile"
Set-Location $MobileRoot
Write-Host "BAZAARA Shopping - local Android debug APK" -ForegroundColor Cyan
if(-not(Get-Command java -ErrorAction SilentlyContinue)){throw "Java/JDK was not found. Install the Android Studio/JDK toolchain or use the EAS internal build launcher."}
& npx expo prebuild --platform android
if($LASTEXITCODE -ne 0){throw "Expo Android prebuild failed."}
Push-Location (Join-Path $MobileRoot "android")
try {
  & .\gradlew.bat assembleDebug
  if($LASTEXITCODE -ne 0){throw "Gradle assembleDebug failed."}
} finally { Pop-Location }
$Apk=Join-Path $MobileRoot "android\app\build\outputs\apk\debug\app-debug.apk"
if(-not(Test-Path -LiteralPath $Apk)){throw "Gradle completed but the debug APK was not found."}
Write-Host "APK READY:" -ForegroundColor Green
Write-Host $Apk -ForegroundColor Cyan
