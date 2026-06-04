$ErrorActionPreference = "Stop"

Write-Host "== rice-knowledge-map verify =="
npm run lint
npm run build
Write-Host "Verification complete."
