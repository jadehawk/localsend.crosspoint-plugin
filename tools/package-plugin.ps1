param(
  [string]$OutputDirectory = ""
)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$payloadName = 'localsend.crosspoint-plugin'
$payload = Join-Path $root $payloadName
$files = @('manifest.json', 'device.json', 'plugin.js', 'README.md', 'DETAILS.md')
if (-not $OutputDirectory) { $OutputDirectory = Join-Path $root 'dist' }
if (-not (Test-Path -LiteralPath $OutputDirectory)) {
  New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
}
$OutputDirectory = (Resolve-Path -LiteralPath $OutputDirectory).Path
$manifest = Get-Content (Join-Path $payload 'manifest.json') -Raw | ConvertFrom-Json
if ($manifest.name -ne 'localsend' -or $manifest.version -ne '0.1.1') {
  throw 'Unexpected plugin ID or unreleased version'
}
if ((Compare-Object @($manifest.files | Sort-Object) @($files | Sort-Object)).Count -gt 0) {
  throw 'Manifest does not declare exactly the expected runtime files'
}
foreach ($name in $files) {
  if (-not (Test-Path -LiteralPath (Join-Path $payload $name))) { throw "Missing $name" }
}
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

function New-LocalSendZip([string]$zipPath, [string]$rootName) {
  if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
  $stream = [IO.File]::Open($zipPath, [IO.FileMode]::CreateNew, [IO.FileAccess]::ReadWrite)
  try {
    $zip = [IO.Compression.ZipArchive]::new($stream, [IO.Compression.ZipArchiveMode]::Create, $true)
    try {
      foreach ($name in $files) {
        $entry = $zip.CreateEntry("$rootName/$name", [IO.Compression.CompressionLevel]::Optimal)
        $source = [IO.File]::OpenRead((Join-Path $payload $name))
        $destination = $entry.Open()
        try { $source.CopyTo($destination) }
        finally { $destination.Dispose(); $source.Dispose() }
      }
    } finally { $zip.Dispose() }
  } finally { $stream.Dispose() }

  $verify = [IO.Compression.ZipFile]::OpenRead($zipPath)
  try {
    $actual = @($verify.Entries | ForEach-Object { $_.FullName } | Sort-Object)
    $expected = @($files | ForEach-Object { "$rootName/$_" } | Sort-Object)
    if ((Compare-Object $actual $expected).Count -gt 0) {
      throw "Invalid entries in $zipPath"
    }
    foreach ($name in $files) {
      $item = $verify.GetEntry("$rootName/$name")
      if ($null -eq $item -or $item.Length -ne (Get-Item -LiteralPath (Join-Path $payload $name)).Length) {
        throw "Missing or wrong ZIP entry: $name"
      }
    }
  } finally { $verify.Dispose() }
  Write-Output "PASS: $zipPath"
}

# Plugin Hub publishing convention: root must be the direct-child payload name.
New-LocalSendZip (Join-Path $OutputDirectory 'localsend.crosspoint-plugin.zip') $payloadName
# Convenience archive: extract into SD:/plugins/ without renaming any folder.
New-LocalSendZip (Join-Path $OutputDirectory 'localsend-sd.zip') 'localsend'
Write-Output "Files: $($files.Count), version $($manifest.version), DETAILS.md included in both archives"
