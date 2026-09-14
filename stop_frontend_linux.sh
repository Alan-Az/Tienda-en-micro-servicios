#!/usr/bin/env bash
# Detener Frontend ERP Retail en Linux
echo "[*] Deteniendo servidor web del frontend en puerto 8090..."
fuser -k 8090/tcp 2>/dev/null || true

echo "[EXITO] Frontend detenido y puerto 8090 liberado."
