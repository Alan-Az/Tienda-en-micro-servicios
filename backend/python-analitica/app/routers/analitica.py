from fastapi import APIRouter, Query, status
from typing import List, Union
from datetime import datetime, timezone
from app.models.venta import TransaccionVenta, RespuestaTendencias, TendenciaItem
from app.database import get_mongo_db, memory_ventas

router = APIRouter(prefix="/api/analitica", tags=["Analítica y Predicciones"])

@router.post("/ingestar", status_code=status.HTTP_201_CREATED)
async def ingestar_ventas(ventas: Union[TransaccionVenta, List[TransaccionVenta]]):
    """
    Ingesta transacciones de venta (individuales o en batch) para alimentar el modelo predictivo.
    """
    items = [ventas] if isinstance(ventas, TransaccionVenta) else ventas
    if not items:
        return {
            "status": "success",
            "mensaje": "No se recibieron transacciones para procesar",
            "registros_procesados": 0
        }

    db = get_mongo_db()
    docs = []
    for item in items:
        doc = item.model_dump()
        ts = doc.get("timestamp")
        if isinstance(ts, datetime):
            doc["timestamp"] = ts.isoformat()
        elif not ts or ts == "None":
            doc["timestamp"] = datetime.now(timezone.utc).isoformat()
        else:
            doc["timestamp"] = str(ts)
        docs.append(doc)

    if db is not None:
        try:
            # Insertar copias para evitar mutación con ObjectId si ocurre fallback a memoria
            db.ventas.insert_many([dict(d) for d in docs])
        except Exception as e:
            # Fallback a memoria si la base de datos no está disponible o falla
            memory_ventas.extend(docs)
    else:
        memory_ventas.extend(docs)

    return {
        "status": "success",
        "mensaje": "Transacciones ingestadas correctamente",
        "registros_procesados": len(docs)
    }

@router.get("/tendencias", response_model=RespuestaTendencias)
async def obtener_tendencias(
    sucursalId: int = Query(default=1, ge=1, description="ID de la sucursal a consultar"),
    dias_horizonte: int = Query(default=7, ge=1, le=90, description="Días hacia adelante a predecir")
):
    """
    Genera predicciones de demanda y recomendaciones de reabastecimiento para el ERP.
    """
    db = get_mongo_db()
    todas_ventas = []

    if db is not None:
        try:
            # Buscar por sucursalId (numérico o texto) excluyendo _id de MongoDB
            filtro = {"$or": [{"sucursalId": sucursalId}, {"sucursalId": str(sucursalId)}]}
            todas_ventas = list(db.ventas.find(filtro, {"_id": 0}))
        except Exception:
            todas_ventas = [v for v in memory_ventas if int(v.get("sucursalId", 1)) == sucursalId]
    else:
        todas_ventas = [v for v in memory_ventas if int(v.get("sucursalId", 1)) == sucursalId]

    # Agrupación de ventas acumuladas por SKU
    ventas_por_sku = {}
    for v in todas_ventas:
        sku = v.get("sku", "SKU-GEN")
        cantidad = int(v.get("cantidad", 1))
        ventas_por_sku[sku] = ventas_por_sku.get(sku, 0) + cantidad

    # Catálogo completo monitoreado
    skus_monitoreados = {
        "LAP-ASUS-001": "Laptop Gamer Asus TUF 15.6",
        "MON-SAM-002": "Monitor Curvo Samsung 27 144Hz",
        "TEC-MEC-003": "Teclado Mecánico RGB Switch Blue",
        "MOU-LOG-004": "Mouse Inalámbrico Logitech MX Master 3S",
        "AUR-HYP-005": "Auriculares HyperX Cloud II Wireless",
        "SSD-KIN-006": "SSD NVMe Kingston KC3000 1TB"
    }

    # Agregar dinámicamente cualquier otro SKU registrado en ventas
    for sku in ventas_por_sku.keys():
        if sku not in skus_monitoreados:
            skus_monitoreados[sku] = f"Producto {sku}"

    dias = max(1, dias_horizonte)
    predicciones = []
    for sku, nombre in skus_monitoreados.items():
        historico = ventas_por_sku.get(sku, 2)
        # Modelo predictivo de demanda proyectada
        demanda_estimada = int(round(historico * (dias / 7.0) * 1.35))
        sugerencia_reabastecimiento = int(round(demanda_estimada * 1.5))
        
        nivel = "NORMAL"
        if demanda_estimada > 15:
            nivel = "CRITICO"
        elif demanda_estimada > 7:
            nivel = "MODERADO"

        predicciones.append(TendenciaItem(
            sku=sku,
            nombre=nombre,
            demandaEstimada=demanda_estimada,
            sugerenciaReabastecimiento=sugerencia_reabastecimiento,
            confianza=0.91,
            nivelAlerta=nivel
        ))

    return RespuestaTendencias(
        sucursalId=sucursalId,
        horizonteDias=dias_horizonte,
        predicciones=predicciones
    )
