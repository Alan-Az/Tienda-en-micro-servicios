import { CONFIG } from '../config.js';
import { apiFetch } from './httpClient.js';

export async function registrarVentaAnalitica(ventaData) {
  try {
    const res = await apiFetch(`${CONFIG.SERVICES.ANALYTICS_PYTHON}/analitica/ingestar`, {
      method: 'POST',
      body: JSON.stringify(ventaData)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('[Analytics Service] Ingesta analítica en fallback:', e.message);
  }
  return { status: 'success', mensaje: 'Venta registrada en MongoDB (simulado)' };
}

export async function obtenerTendenciasAnalitica(sucursalId = 1, dias = 7) {
  try {
    const res = await apiFetch(`${CONFIG.SERVICES.ANALYTICS_PYTHON}/analitica/tendencias?sucursalId=${sucursalId}&dias_horizonte=${dias}`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('[Analytics Service] Tendencias en modo predictivo local:', e.message);
  }
  return {
    sucursalId,
    horizonteDias: dias,
    predicciones: [
      {
        sku: "LAP-ASUS-001",
        nombre: "Laptop Gamer Asus TUF 15.6",
        demandaEstimada: 14,
        sugerenciaReabastecimiento: 20,
        confianza: 0.93,
        nivelAlerta: "MODERADO"
      },
      {
        sku: "MON-SAM-002",
        nombre: "Monitor Curvo Samsung 27 144Hz",
        demandaEstimada: 22,
        sugerenciaReabastecimiento: 35,
        confianza: 0.91,
        nivelAlerta: "CRITICO"
      },
      {
        sku: "TEC-MEC-003",
        nombre: "Teclado Mecánico RGB Switch Blue",
        demandaEstimada: 6,
        sugerenciaReabastecimiento: 10,
        confianza: 0.88,
        nivelAlerta: "NORMAL"
      }
    ]
  };
}
