import os
from typing import List, Dict, Any

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB", "erp_analytics")

# Repositorio en memoria como fallback resiliente si MongoDB no está activo
memory_ventas: List[Dict[str, Any]] = [
    {
        "ventaId": "V-2026-001",
        "clienteId": 1,
        "sku": "LAP-ASUS-001",
        "sucursalId": 1,
        "cantidad": 3,
        "precioTotal": 3899.97,
        "timestamp": "2026-09-10T14:32:00Z"
    },
    {
        "ventaId": "V-2026-002",
        "clienteId": 2,
        "sku": "MON-SAM-002",
        "sucursalId": 1,
        "cantidad": 5,
        "precioTotal": 1447.50,
        "timestamp": "2026-09-11T16:20:00Z"
    },
    {
        "ventaId": "V-2026-003",
        "clienteId": 2,
        "sku": "TEC-MEC-003",
        "sucursalId": 2,
        "cantidad": 8,
        "precioTotal": 600.00,
        "timestamp": "2026-09-12T11:15:00Z"
    }
]

db_client = None

def get_mongo_db():
    global db_client
    try:
        from pymongo import MongoClient
        if db_client is None:
            db_client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=1000)
            db_client.server_info() # Valida conectividad
        return db_client[MONGO_DB_NAME]
    except Exception:
        return None
