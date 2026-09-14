#!/usr/bin/env bash
# =====================================================================
# SISTEMA ERP RETAIL DISTRIBUIDO - FRONTEND LAUNCHER (LINUX / macOS / WSL)
# =====================================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

clear
echo -e "\e[36m=====================================================================\e[0m"
echo -e "\e[1;36m          SISTEMA ERP RETAIL DISTRIBUIDO - FRONTEND (LINUX)          \e[0m"
echo -e "\e[36m=====================================================================\e[0m"
echo ""
echo -e "\e[33m[PUERTO QUE SE UTILIZARA]\e[0m"
echo -e "  - Portal Web Unificado (HTML5 / ES6):        Puerto \e[32m8090\e[0m"
echo -e "  - URL de Acceso:                             \e[1;34mhttp://localhost:8090\e[0m"
echo -e "  \e[90m(Nota: Se usa el puerto 8090 para evitar conflicto con Apache/PHP en 8080)\e[0m"
echo -e "\e[36m=====================================================================\e[0m"
echo ""

# Pregunta interactiva
read -r -p "¿Desea verificar runtime de Node.js? (s/n): " INSTALAR

if [[ "$INSTALAR" =~ ^[sSyY]$ ]]; then
    echo ""
    echo -e "\e[34m[*] Verificando disponibilidad de Node.js...\e[0m"
    if command -v node &> /dev/null; then
        echo -e "\e[32m[OK] Node.js detectado ($(node -v)).\e[0m"
    else
        echo -e "\e[33m[i] Node.js no detectado. Se utilizará Python o PHP.\e[0m"
    fi
else
    echo ""
    echo -e "\e[90m[i] Omitiendo verificaciones. Iniciando servidor...\e[0m"
fi

echo ""
echo -e "\e[36m[*] Intentando abrir navegador en http://localhost:8090...\e[0m"
if command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:8090" > /dev/null 2>&1 &
elif command -v open &> /dev/null; then
    open "http://localhost:8090" > /dev/null 2>&1 &
fi

echo -e "\e[32m[*] Iniciando servidor web para 'frontend' en puerto 8090...\e[0m"
echo -e "\e[90mPresiona Ctrl+C para detener el servidor cuando desees.\e[0m"
echo ""

cd "$DIR/frontend" || exit 1

# Prioridad 1: Servidor nativo de Node.js
if command -v node &> /dev/null; then
    node server.js
    exit 0
fi

# Prioridad 2: Python 3
if command -v python3 &> /dev/null; then
    python3 -m http.server 8090
    exit 0
fi

# Prioridad 3: PHP CLI
if command -v php &> /dev/null; then
    php -S 0.0.0.0:8090
    exit 0
fi

echo -e "\e[31m[ERROR] No se encontró node, python3 ni php para servir el frontend.\e[0m"
echo -e "Abre manualmente el archivo: \e[1;37mfrontend/index.html\e[0m en tu navegador."
