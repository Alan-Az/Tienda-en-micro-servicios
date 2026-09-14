#!/usr/bin/env bash
# =====================================================================
# SISTEMA ERP RETAIL DISTRIBUIDO - BACKEND LAUNCHER (LINUX / macOS / WSL)
# =====================================================================

clear
echo -e "\e[36m=====================================================================\e[0m"
echo -e "\e[1;36m          SISTEMA ERP RETAIL DISTRIBUIDO - BACKEND (LINUX)           \e[0m"
echo -e "\e[36m=====================================================================\e[0m"
echo ""
echo -e "\e[33m[PUERTOS Y SERVICIOS QUE SE UTILIZARAN]\e[0m"
echo -e "  - Microservicio 1 (C# .NET 10 REST):            Puerto \e[32m5084\e[0m  (Inventario)"
echo -e "  - Microservicio 2 (VB.NET WCF SOAP):            Puerto \e[32m8085/80\e[0m (Facturación)"
echo -e "  - Microservicio 3 (Java 21 JAX-WS SOAP):        Puerto \e[32m8081\e[0m  (Pagos)"
echo -e "  - Microservicio 4 (PHP 8.2 Laravel 11 REST):    Puerto \e[32m8000\e[0m  (Clientes/Auth)"
echo -e "  - Microservicio 5 (Python 3.12 FastAPI REST):   Puerto \e[32m8001\e[0m  (Analítica BI)"
echo -e "  - Microservicio 6 (Node.js 20 Express REST):    Puerto \e[32m3000\e[0m  (Notificaciones)"
echo -e "  - Base de Datos PostgreSQL 15:                  Puerto \e[32m5432\e[0m"
echo -e "  - Base de Datos MongoDB 6.0:                    Puerto \e[32m27017\e[0m"
echo -e "\e[36m=====================================================================\e[0m"
echo ""

# Pregunta interactiva para descargar paquetes y construir imágenes
read -r -p "¿Desea verificar y descargar/construir todos los paquetes y dependencias necesarias? (s/n): " DESCARGAR

if [[ "$DESCARGAR" =~ ^[sSyY]$ ]]; then
    echo ""
    echo -e "\e[34m[*] Descargando imágenes base y construyendo microservicios en Docker...\e[0m"
    docker compose -f backend/docker-compose.yml build
    
    # Si dotnet está instalado en Linux, restaurar paquetes C#
    if command -v dotnet &> /dev/null; then
        echo -e "\e[34m[*] Restaurando paquetes NuGet para C# .NET 10...\e[0m"
        dotnet restore backend/csharp-inventario/InventarioApi.csproj
    fi
else
    echo ""
    echo -e "\e[90m[i] Omitiendo descarga de paquetes. Iniciando con imágenes y paquetes existentes...\e[0m"
fi

echo ""
echo -e "\e[36m[*] Levantando stack de contenedores con Docker Compose...\e[0m"
docker compose -f backend/docker-compose.yml up -d

# Iniciar C# en segundo plano si dotnet existe localmente
if command -v dotnet &> /dev/null; then
    echo -e "\e[36m[*] Iniciando C# .NET 10 (Inventario) en segundo plano (puerto 5084)...\e[0m"
    (cd backend/csharp-inventario && dotnet run) > /dev/null 2>&1 &
    echo -e "\e[32m[OK] C# Inventario iniciado en PID: $!\e[0m"
else
    echo -e "\e[33m[NOTA] Para ejecutar C# localmente instala .NET SDK o ejecútalo en Windows/IIS.\e[0m"
fi

echo ""
echo -e "\e[1;32m[EXITO] Ecosistema Backend levantado satisfactoriamente.\e[0m"
echo -e "Verifica el estado con: \e[1;37mdocker compose -f backend/docker-compose.yml ps\e[0m"
echo ""
