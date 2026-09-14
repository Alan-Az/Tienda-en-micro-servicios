# Detener Frontend ERP Retail
Write-Host "`n[*] Buscando y deteniendo servidor frontend en puerto 8090..." -ForegroundColor Cyan
Get-NetTCPConnection -LocalPort 8090 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] Proceso frontend (PID $($_.OwningProcess)) detenido." -ForegroundColor Green
}
Write-Host "`n[EXITO] Frontend detenido y puerto 8090 liberado.`n" -ForegroundColor Green
