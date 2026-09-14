import { CONFIG } from '../config.js';
import { apiFetch } from './httpClient.js';

const mockCatalog = [
  {
    id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    productoId: "e1a90c42-2615-46f3-a15d-318eec2e3f55",
    productoNombre: "Laptop Gamer Asus TUF 15.6",
    sku: "LAP-ASUS-001",
    precio: 1299.99,
    sucursalId: 1,
    cantidad: 15
  },
  {
    id: "4ba85f64-5717-4562-b3fc-2c963f66afa7",
    productoId: "f2a90c42-2615-46f3-a15d-318eec2e3f56",
    productoNombre: "Monitor Curvo Samsung 27 144Hz",
    sku: "MON-SAM-002",
    precio: 289.50,
    sucursalId: 1,
    cantidad: 30
  },
  {
    id: "5ca85f64-5717-4562-b3fc-2c963f66afa8",
    productoId: "d3a90c42-2615-46f3-a15d-318eec2e3f57",
    productoNombre: "Teclado Mecánico RGB Switch Blue",
    sku: "TEC-MEC-003",
    precio: 75.00,
    sucursalId: 1,
    cantidad: 50
  }
];

export async function fetchInventario(sucursalId = 1) {
  try {
    const res = await apiFetch(`${CONFIG.SERVICES.INVENTORY_CSHARP}/inventario?sucursalId=${sucursalId}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.warn('[Inventory Service] Usando catálogo local mientras C# .NET arranca:', e.message);
  }
  return mockCatalog.filter(i => i.sucursalId === sucursalId);
}

export async function actualizarStockInventario(inventarioId, nuevaCantidad) {
  try {
    const res = await apiFetch(`${CONFIG.SERVICES.INVENTORY_CSHARP}/inventario/${inventarioId}`, {
      method: 'PUT',
      body: JSON.stringify({ cantidad: nuevaCantidad })
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('[Inventory Service] Actualización de stock en fallback local:', e.message);
  }
  const item = mockCatalog.find(i => i.id === inventarioId);
  if (item) item.cantidad = nuevaCantidad;
  return { success: true, inventarioId, nuevaCantidad };
}

export async function crearNuevoProducto(dto) {
  try {
    const res = await apiFetch(`${CONFIG.SERVICES.INVENTORY_CSHARP}/inventario/productos`, {
      method: 'POST',
      body: JSON.stringify(dto)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('[Inventory Service] Creando producto en fallback local:', e.message);
  }
  const nuevo = {
    id: 'prod-' + Date.now(),
    ...dto,
    fechaCreacion: new Date().toISOString()
  };
  mockCatalog.push({
    id: 'inv-' + Date.now(),
    productoId: nuevo.id,
    productoNombre: nuevo.nombre,
    sku: nuevo.sku,
    precio: nuevo.precio,
    sucursalId: 1,
    cantidad: 10
  });
  return nuevo;
}
