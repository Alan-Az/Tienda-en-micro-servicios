# =====================================================================
# SISTEMA ERP RETAIL DISTRIBUIDO - BACKEND LAUNCHER (POWERSHELL)
# =====================================================================

Clear-Host
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "          SISTEMA ERP RETAIL DISTRIBUIDO - BACKEND (WINDOWS)         " -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[PUERTOS Y SERVICIOS QUE SE UTILIZARAN]" -ForegroundColor Yellow
Write-Host "  - Microservicio 1 (C# .NET 10 REST):            Puerto 5084  (Inventario)" -ForegroundColor White
Write-Host "  - Microservicio 2 (VB.NET WCF SOAP):            Puerto 8085 / 80 (Facturación)" -ForegroundColor White
Write-Host "  - Microservicio 3 (Java 21 JAX-WS SOAP):        Puerto 8081  (Pagos)" -ForegroundColor White
Write-Host "  - Microservicio 4 (PHP 8.2 Laravel 11 REST):    Puerto 8000  (Clientes/Auth)" -ForegroundColor White
Write-Host "  - Microservicio 5 (Python 3.12 FastAPI REST):   Puerto 8001  (Analítica BI)" -ForegroundColor White
Write-Host "  - Microservicio 6 (Node.js 20 Express REST):    Puerto 3000  (Notificaciones)" -ForegroundColor White
Write-Host "  - Base de Datos PostgreSQL 15:                  Puerto 5432" -ForegroundColor White
Write-Host "  - Base de Datos MongoDB 6.0:                    Puerto 27017" -ForegroundColor White
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

$resp = Read-Host "¿Desea verificar y descargar/restaurar todos los paquetes y dependencias necesarias? (S/N)"

if ($resp -match "^[sSyY]$") {
    Write-Host "`n[*] Restaurando paquetes NuGet de C# .NET 10..." -ForegroundColor Green
    dotnet restore "$PSScriptRoot\backend\csharp-inventario\InventarioApi.csproj"

    Write-Host "`n[*] Restaurando paquetes NuGet de VB.NET WCF..." -ForegroundColor Green
    dotnet restore "$PSScriptRoot\backend\vbnet-facturacion\FacturacionWcf.vbproj"

    Write-Host "`n[*] Descargando y construyendo imágenes Docker (PHP, Python, Node, Java)..." -ForegroundColor Green
    docker compose -f "$PSScriptRoot\backend\docker-compose.yml" build
} else {
    Write-Host "`n[i] Omitiendo descarga de paquetes. Iniciando con paquetes existentes..." -ForegroundColor Gray
}

Write-Host "`n[*] Levantando contenedores en segundo plano (Docker Compose)..." -ForegroundColor Cyan
docker compose -f "$PSScriptRoot\backend\docker-compose.yml" up -d

Write-Host "[*] Iniciando Microservicio C# .NET 10 en puerto 5084 (consola independiente)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend\csharp-inventario'; dotnet run"

Write-Host "`n[EXITO] Backend levantado correctamente." -ForegroundColor Green
Write-Host "Verifica los contenedores de Docker ejecutando: docker compose -f backend\docker-compose.yml ps`n"
