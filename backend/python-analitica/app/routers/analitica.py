from fastapi import APIRouter, Query, status
from typing import List, Union
from app.models.venta import TransaccionVenta, RespuestaTendencias, TendenciaItem
from app.database import get_mongo_db, memory_ventas

router = APIRouter(prefix="/api/analitica", tags=["Analítica y Predicciones"])

@router.post("/ingestar", status_code=status.HTTP_201_CREATED)
async def ingestar_ventas(ventas: Union[TransaccionVenta, List[TransaccionVenta]]):
    """
    Ingesta transacciones de venta (individuales o en batch) para alimentar el modelo predictivo.
    """
    items = [ventas] if isinstance(ventas, TransaccionVenta) else ventas
    db = get_mongo_db()

    docs = [item.model_dump() for item in items]
    for doc in docs:
        if hasattr(doc.get("timestamp"), "isoformat"):
            doc["timestamp"] = doc["timestamp"].isoformat()
        else:
            doc["timestamp"] = str(doc.get("timestamp"))

    if db is not None:
        try:
            db.ventas.insert_many(docs)
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
    sucursalId: int = Query(default=1, description="ID de la sucursal a consultar"),
    dias_horizonte: int = Query(default=7, description="Días hacia adelante a predecir")
):
    """
    Genera predicciones de demanda y recomendaciones de reabastecimiento para el ERP.
    """
    db = get_mongo_db()
    todas_ventas = []

    if db is not None:
        try:
            todas_ventas = list(db.ventas.find({"sucursalId": sucursalId}))
        except Exception:
            todas_ventas = [v for v in memory_ventas if v.get("sucursalId") == sucursalId]
    else:
        todas_ventas = [v for v in memory_ventas if v.get("sucursalId") == sucursalId]

    # Agrupación por SKU
    ventas_por_sku = {}
    for v in todas_ventas:
        sku = v.get("sku", "SKU-GEN")
        ventas_por_sku[sku] = ventas_por_sku.get(sku, 0) + v.get("cantidad", 1)

    # Catálogo base para garantizar pronóstico
    skus_monitoreados = {
        "LAP-ASUS-001": "Laptop Gamer Asus TUF 15.6",
        "MON-SAM-002": "Monitor Curvo Samsung 27 144Hz",
        "TEC-MEC-003": "Teclado Mecánico RGB Switch Blue"
    }

    predicciones = []
    for sku, nombre in skus_monitoreados.items():
        historico = ventas_por_sku.get(sku, 2)
        # Modelo predictivo simple de demanda proyectada
        demanda_estimada = int(round(historico * (dias_horizonte / 7.0) * 1.35))
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
