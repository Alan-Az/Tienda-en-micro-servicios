#!/usr/bin/env bash
# Detener Backend ERP Retail en Linux
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "[*] Deteniendo contenedores de Docker..."
docker compose -f "$DIR/backend/docker-compose.yml" down

echo "[*] Deteniendo proceso C# si está en ejecución..."
pkill -f "InventarioApi" 2>/dev/null || true

echo "[EXITO] Backend detenido completamente."
