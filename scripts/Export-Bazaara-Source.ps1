#requires -Version 5.1
[CmdletBinding()]
param(
    [string]$RepoRoot = (Join-Path $env:USERPROFILE 'Bazaara\bazaara-platform'),
    [string]$OutputZip = (Join-Path $env:USERPROFILE 'Downloads\Bazaara-Source-Only.zip')
)
$ErrorActionPreference = 'Stop'
$source = [IO.Path]::GetFullPath($RepoRoot)
if (-not (Test-Path -LiteralPath (Join-Path $source 'package.json'))) { throw 'BAZAARA root package.json missing.' }
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$skipDirectories = @('node_modules', '.next', '.git', 'dist', 'build', '.expo', 'coverage', '.turbo', '.bazaara-e3-backups', '.bazaara-dev')
$skipExtensions = @('.exe', '.zip', '.tsbuildinfo', '.log', '.tmp', '.pem', '.key', '.p12', '.pfx')
$output = [IO.Path]::GetFullPath($OutputZip)
New-Item -ItemType Directory -Force -Path (Split-Path $output) | Out-Null
if (Test-Path -LiteralPath $output) { throw "Output exists: $output. Use a new name so earlier backups cannot be overwritten." }
$zipStream = [IO.File]::Open($output, [IO.FileMode]::CreateNew)
$count = 0
try {
    $archive = New-Object IO.Compression.ZipArchive($zipStream, [IO.Compression.ZipArchiveMode]::Create, $false)
    try {
        $pending = New-Object 'System.Collections.Generic.Stack[string]'
        $pending.Push($source)
        while ($pending.Count -gt 0) {
            $current = $pending.Pop()
            foreach ($dir in [IO.Directory]::EnumerateDirectories($current)) {
                if ([IO.Path]::GetFileName($dir) -notin $skipDirectories) { $pending.Push($dir) }
            }
            foreach ($file in [IO.Directory]::EnumerateFiles($current)) {
                $name = [IO.Path]::GetFileName($file)
                $ext = [IO.Path]::GetExtension($file).ToLowerInvariant()
                if ($ext -in $skipExtensions) { continue }
                if ($name -match '\.bak(?:-|$)' -or $name -match '^\.env(?:\..*)?$' -and $name -ne '.env.example') { continue }
                $relative = $file.Substring($source.Length).TrimStart([char[]]@('\','/')).Replace('\','/')
                [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $file, $relative, [IO.Compression.CompressionLevel]::Optimal) | Out-Null
                $count++
            }
        }
    } finally { $archive.Dispose() }
} catch {
    if (Test-Path -LiteralPath $output) { Remove-Item -LiteralPath $output -Force }
    throw
} finally { $zipStream.Dispose() }
Write-Host "Created source-only archive: $count files, $output" -ForegroundColor Green
Write-Warning 'Review the ZIP for any project-specific secrets before sharing. Generic exclusions cannot identify every secret.'
