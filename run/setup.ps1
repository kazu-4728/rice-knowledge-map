$ErrorActionPreference = "Stop"

Write-Host "== rice-knowledge-map setup =="

if (-not (Test-Path "package.json")) {
  Write-Host "package.json not found. Skipping Node setup."
  exit 0
}

$nodeVersion = node --version
Write-Host "Node: $nodeVersion"

if (Test-Path "package-lock.json") {
  Write-Host "Installing dependencies with npm ci..."
  npm ci --cache .npm-cache
} else {
  Write-Host "Installing dependencies with npm install..."
  npm install --cache .npm-cache
}

Write-Host "Setup complete."
