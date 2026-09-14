// ==========================================================
// SCRIPT DE INICIALIZACIÓN MONGODB: erp_analytics
// Microservicio: Python 3.12 FastAPI - Analítica y Predicción
// ==========================================================

const db = db.getSiblingDB('erp_analytics');

// Crear colección de ventas y sus índices
db.createCollection('ventas');
db.ventas.createIndex({ sku: 1, sucursalId: 1, timestamp: -1 });

// Inserción de transacciones históricas de prueba
db.ventas.insertMany([
  {
    ventaId: "V-2026-001",
    clienteId: 1,
    sku: "LAP-ASUS-001",
    sucursalId: 1,
    cantidad: 1,
    precioTotal: 1299.99,
    timestamp: new Date("2026-09-10T14:32:00Z")
  },
  {
    ventaId: "V-2026-002",
    clienteId: 2,
    sku: "MON-SAM-002",
    sucursalId: 1,
    cantidad: 2,
    precioTotal: 579.00,
    timestamp: new Date("2026-09-11T16:20:00Z")
  },
  {
    ventaId: "V-2026-003",
    clienteId: 2,
    sku: "TEC-MEC-003",
    sucursalId: 2,
    cantidad: 3,
    precioTotal: 225.00,
    timestamp: new Date("2026-09-12T11:15:00Z")
  }
]);

// Crear colección para predicciones calculadas
db.createCollection('predicciones');
db.predicciones.createIndex({ sku: 1, sucursalId: 1 });
