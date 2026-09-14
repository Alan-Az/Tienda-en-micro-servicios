# =====================================================================
# SISTEMA ERP RETAIL DISTRIBUIDO - FRONTEND LAUNCHER (POWERSHELL)
# =====================================================================

Clear-Host
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "          SISTEMA ERP RETAIL DISTRIBUIDO - FRONTEND (WINDOWS)        " -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[PUERTO QUE SE UTILIZARA]" -ForegroundColor Yellow
Write-Host "  - Portal Web Unificado (HTML5 / ES6):        Puerto 8090" -ForegroundColor White
Write-Host "  - URL de Acceso:                             http://localhost:8090" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[*] Abriendo navegador en http://localhost:8090..." -ForegroundColor Cyan
Start-Process "http://localhost:8090"

Write-Host "[*] Iniciando servidor web para 'frontend' en puerto 8090..." -ForegroundColor Cyan

Set-Location "$PSScriptRoot"

if (Get-Command node -ErrorAction SilentlyContinue) {
    node server.js
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    py -m http.server 8090
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    python -m http.server 8090
} else {
    Start-Process "index.html"
}
