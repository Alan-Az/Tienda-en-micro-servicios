import { CONFIG } from '../config.js';
import { apiFetch } from './httpClient.js';

// Catálogo federado completo con existencias independientes por sucursal
const mockCatalog = [
  // 1. Laptop Gamer
  {
    id: "inv-suc1-001",
    productoId: "prod-001",
    productoNombre: "Laptop Gamer Asus TUF 15.6",
    sku: "LAP-ASUS-001",
    precio: 1299.99,
    sucursalId: 1,
    cantidad: 15
  },
  {
    id: "inv-suc2-001",
    productoId: "prod-001",
    productoNombre: "Laptop Gamer Asus TUF 15.6",
    sku: "LAP-ASUS-001",
    precio: 1299.99,
    sucursalId: 2,
    cantidad: 8
  },

  // 2. Monitor Curvo
  {
    id: "inv-suc1-002",
    productoId: "prod-002",
    productoNombre: "Monitor Curvo Samsung 27 144Hz",
    sku: "MON-SAM-002",
    precio: 289.50,
    sucursalId: 1,
    cantidad: 30
  },
  {
    id: "inv-suc2-002",
    productoId: "prod-002",
    productoNombre: "Monitor Curvo Samsung 27 144Hz",
    sku: "MON-SAM-002",
    precio: 289.50,
    sucursalId: 2,
    cantidad: 12
  },

  // 3. Teclado Mecánico
  {
    id: "inv-suc1-003",
    productoId: "prod-003",
    productoNombre: "Teclado Mecánico RGB Switch Blue",
    sku: "TEC-MEC-003",
    precio: 75.00,
    sucursalId: 1,
    cantidad: 50
  },
  {
    id: "inv-suc2-003",
    productoId: "prod-003",
    productoNombre: "Teclado Mecánico RGB Switch Blue",
    sku: "TEC-MEC-003",
    precio: 75.00,
    sucursalId: 2,
    cantidad: 25
  },

  // 4. Mouse Logitech
  {
    id: "inv-suc1-004",
    productoId: "prod-004",
    productoNombre: "Mouse Inalámbrico Logitech MX Master 3S",
    sku: "MOU-LOG-004",
    precio: 99.00,
    sucursalId: 1,
    cantidad: 20
  },
  {
    id: "inv-suc2-004",
    productoId: "prod-004",
    productoNombre: "Mouse Inalámbrico Logitech MX Master 3S",
    sku: "MOU-LOG-004",
    precio: 99.00,
    sucursalId: 2,
    cantidad: 15
  },

  // 5. Auriculares HyperX
  {
    id: "inv-suc1-005",
    productoId: "prod-005",
    productoNombre: "Auriculares HyperX Cloud II Wireless",
    sku: "AUR-HYP-005",
    precio: 149.00,
    sucursalId: 1,
    cantidad: 18
  },
  {
    id: "inv-suc2-005",
    productoId: "prod-005",
    productoNombre: "Auriculares HyperX Cloud II Wireless",
    sku: "AUR-HYP-005",
    precio: 149.00,
    sucursalId: 2,
    cantidad: 9
  },

  // 6. SSD Kingston NVMe
  {
    id: "inv-suc1-006",
    productoId: "prod-006",
    productoNombre: "SSD NVMe Kingston KC3000 1TB",
    sku: "SSD-KIN-006",
    precio: 115.00,
    sucursalId: 1,
    cantidad: 35
  },
  {
    id: "inv-suc2-006",
    productoId: "prod-006",
    productoNombre: "SSD NVMe Kingston KC3000 1TB",
    sku: "SSD-KIN-006",
    precio: 115.00,
    sucursalId: 2,
    cantidad: 14
  }
];

/**
 * Consulta inventario. Si sucursalId es null, retorna de TODAS las sucursales.
 */
export async function fetchInventario(sucursalId = null) {
  try {
    const url = sucursalId 
      ? `${CONFIG.SERVICES.INVENTORY_CSHARP}/inventario?sucursalId=${sucursalId}`
      : `${CONFIG.SERVICES.INVENTORY_CSHARP}/inventario`;
      
    const res = await apiFetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    // Modo fallback en memoria
  }

  if (sucursalId) {
    return mockCatalog.filter(i => i.sucursalId === parseInt(sucursalId, 10));
  }
  return [...mockCatalog];
}

/**
 * Retorna matriz federada agrupada por producto con existencias de Sucursal 1 y Sucursal 2
 */
export async function fetchInventarioMatrizFederada() {
  const items = await fetchInventario(null);
  const mapa = new Map();

  items.forEach(item => {
    const key = item.sku;
    if (!mapa.has(key)) {
      mapa.set(key, {
        sku: item.sku,
        productoNombre: item.productoNombre,
        precio: item.precio,
        stockSucursal1: 0,
        stockSucursal2: 0,
        invIdSucursal1: null,
        invIdSucursal2: null
      });
    }

    const reg = mapa.get(key);
    if (item.sucursalId === 1) {
      reg.stockSucursal1 = item.cantidad;
      reg.invIdSucursal1 = item.id;
    } else if (item.sucursalId === 2) {
      reg.stockSucursal2 = item.cantidad;
      reg.invIdSucursal2 = item.id;
    }
  });

  return Array.from(mapa.values());
}

export async function actualizarStockInventario(inventarioId, nuevaCantidad) {
  try {
    const res = await apiFetch(`${CONFIG.SERVICES.INVENTORY_CSHARP}/inventario/${inventarioId}`, {
      method: 'PUT',
      body: JSON.stringify({ cantidad: nuevaCantidad })
    });
    if (res.ok) return await res.json();
  } catch (e) {
    // Fallback local
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
    // Fallback local
  }

  const prodId = 'prod-' + Date.now();
  mockCatalog.push({
    id: 'inv-suc1-' + Date.now(),
    productoId: prodId,
    productoNombre: dto.nombre,
    sku: dto.sku,
    precio: dto.precio,
    sucursalId: 1,
    cantidad: 15
  });
  mockCatalog.push({
    id: 'inv-suc2-' + Date.now(),
    productoId: prodId,
    productoNombre: dto.nombre,
    sku: dto.sku,
    precio: dto.precio,
    sucursalId: 2,
    cantidad: 10
  });

  return { id: prodId, ...dto };
}
