from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class TransaccionVenta(BaseModel):
    ventaId: str = Field(..., examples=["V-2026-001"])
    clienteId: Optional[int] = Field(default=1)
    sku: str = Field(..., examples=["LAP-ASUS-001"])
    sucursalId: int = Field(default=1)
    cantidad: int = Field(..., gt=0)
    precioTotal: float = Field(..., gt=0)
    timestamp: Optional[datetime] = Field(default_factory=utc_now)

class TendenciaItem(BaseModel):
    sku: str
    nombre: Optional[str] = "Producto"
    demandaEstimada: int
    sugerenciaReabastecimiento: int
    confianza: float
    nivelAlerta: str  # 'NORMAL', 'MODERADO', 'CRITICO'

class RespuestaTendencias(BaseModel):
    sucursalId: int
    horizonteDias: int
    predicciones: List[TendenciaItem]
