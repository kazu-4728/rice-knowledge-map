$ErrorActionPreference = "Stop"

if (Test-Path ".next") {
  Write-Host "Removing .next cache..."
  Remove-Item -LiteralPath ".next" -Recurse -Force
}

Write-Host "Next.js cache cleaned."
