# Detener Backend ERP Retail
Write-Host "`n[*] Deteniendo contenedores de Docker..." -ForegroundColor Cyan
docker compose -f "$PSScriptRoot\backend\docker-compose.yml" down

Write-Host "[*] Verificando y deteniendo proceso C# en puerto 5084..." -ForegroundColor Cyan
Get-NetTCPConnection -LocalPort 5084 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] Proceso C# (PID $($_.OwningProcess)) detenido." -ForegroundColor Green
}

Write-Host "`n[EXITO] Backend detenido completamente.`n" -ForegroundColor Green
