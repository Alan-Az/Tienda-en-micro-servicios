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
Write-Host "  (Nota: Se usa el puerto 8090 para evitar colisión con Apache/PHP en 8080)" -ForegroundColor Gray
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

$resp = Read-Host "¿Desea verificar paquetes de ejecución de Node.js? (S/N)"

if ($resp -match "^[sSyY]$") {
    Write-Host "`n[*] Verificando runtime de Node.js..." -ForegroundColor Green
    if (Get-Command node -ErrorAction SilentlyContinue) {
        Write-Host "[OK] Node.js detectado correctamente." -ForegroundColor Green
    } else {
        Write-Host "[!] Node.js no encontrado. Se utilizará Python como servidor de respaldo." -ForegroundColor Yellow
    }
} else {
    Write-Host "`n[i] Omitiendo verificaciones. Iniciando servidor..." -ForegroundColor Gray
}

Write-Host "`n[*] Abriendo navegador en http://localhost:8090..." -ForegroundColor Cyan
Start-Process "http://localhost:8090"

Write-Host "[*] Iniciando servidor web para 'frontend' en puerto 8090..." -ForegroundColor Cyan

Set-Location "$PSScriptRoot\frontend"

if (Get-Command node -ErrorAction SilentlyContinue) {
    node server.js
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    py -m http.server 8090
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    python -m http.server 8090
} else {
    Start-Process "index.html"
}
