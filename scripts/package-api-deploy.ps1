$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$apiDir = Join-Path $root 'apps/api'
$deployDir = Join-Path $root 'deploy'
$zipPath = Join-Path $deployDir 'api2-codeyourcareer-api.zip'

Push-Location $root
try {
  npm --prefix apps/api run build

  if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
  }

  $paths = @(
    (Join-Path $apiDir 'package.json'),
    (Join-Path $apiDir 'package-lock.json'),
    (Join-Path $apiDir 'server.js'),
    (Join-Path $apiDir 'tsconfig.json'),
    (Join-Path $apiDir '.env.example'),
    (Join-Path $apiDir 'src'),
    (Join-Path $apiDir 'scripts'),
    (Join-Path $apiDir 'dist')
  )

  Compress-Archive -Path $paths -DestinationPath $zipPath -Force
  Write-Host "Generated $zipPath"
} finally {
  Pop-Location
}
