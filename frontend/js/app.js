import { state } from './state.js';
import { loginUser, logoutUser } from './services/authService.js';
import { fetchInventario, actualizarStockInventario, crearNuevoProducto } from './services/inventoryService.js';
import { procesarCargoSoap, timbrarFacturaSoap } from './services/soapClient.js';
import { enviarNotificacionCompra } from './services/notifyService.js';
import { registrarVentaAnalitica, obtenerTendenciasAnalitica } from './services/analyticsService.js';

// DOM Elements
const catalogContainer = document.getElementById('catalog-container');
const cartCountBadge = document.getElementById('cart-count');
const userBtn = document.getElementById('user-btn');
const authModal = document.getElementById('auth-modal');
const checkoutModal = document.getElementById('checkout-modal');
const cartModal = document.getElementById('cart-modal');
const xmlModal = document.getElementById('xml-modal');
const branchSelect = document.getElementById('branch-select');

// Notificaciones Toast
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ')}</span> <div>${message}</div>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Inicialización de Vistas
function initNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn[data-view]');
  const views = document.querySelectorAll('.view-section');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const viewName = btn.getAttribute('data-view');
      navButtons.forEach(b => b.classList.remove('active'));
      views.forEach(v => v.classList.remove('active'));

      btn.classList.add('active');
      const targetView = document.getElementById(`view-${viewName}`);
      if (targetView) targetView.classList.add('active');

      if (viewName === 'catalog') renderCatalog();
      if (viewName === 'admin') renderAdminTable();
      if (viewName === 'analytics') renderAnalytics();
    });
  });
}

// Render del Catálogo
async function renderCatalog() {
  catalogContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Cargando catálogo desde C# .NET 10 (Puerto 5084)...</div>';
  const branchId = parseInt(branchSelect.value, 10);
  const items = await fetchInventario(branchId);

  if (!items || items.length === 0) {
    catalogContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No hay existencias disponibles para esta sucursal.</div>';
    return;
  }

  catalogContainer.innerHTML = items.map(item => `
    <div class="product-card">
      <div class="product-header">
        <span class="product-sku">${item.sku}</span>
        <span class="stock-badge">${item.cantidad} en stock</span>
      </div>
      <h3 class="product-title">${item.productoNombre}</h3>
      <div class="product-price">$${item.precio.toFixed(2)} USD</div>
      <div class="product-stock">Sucursal ${item.sucursalId} &bull; Garantía Retail Oficial</div>
      <button class="btn btn-primary add-cart-btn" data-id="${item.id}" ${item.cantidad <= 0 ? 'disabled' : ''}>
        ${item.cantidad > 0 ? 'Añadir al Carrito' : 'Agotado'}
      </button>
    </div>
  `).join('');

  document.querySelectorAll('.add-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const item = items.find(i => i.id === id);
      if (item) {
        state.addToCart({
          id: item.id,
          productoId: item.productoId,
          productoNombre: item.productoNombre,
          precio: item.precio,
          sku: item.sku,
          sucursalId: item.sucursalId,
          maxStock: item.cantidad
        });
        showToast(`"${item.productoNombre}" añadido al carrito`, 'success');
      }
    });
  });
}

// Actualizar UI del Carrito
function updateCartUI() {
  const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountBadge.textContent = totalCount;
  cartCountBadge.style.display = totalCount > 0 ? 'inline-block' : 'none';

  const cartList = document.getElementById('cart-items-list');
  const { subtotal, iva, total } = state.getCartTotals();

  if (state.cart.length === 0) {
    cartList.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding: 2rem 0;">Tu carrito está vacío.</p>';
    document.getElementById('checkout-trigger-btn').disabled = true;
  } else {
    cartList.innerHTML = state.cart.map(item => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-subtle);">
        <div>
          <div style="font-weight: 600;">${item.productoNombre}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${item.quantity} x $${item.precio.toFixed(2)}</div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-weight: 700; color: var(--accent-emerald);">$${(item.quantity * item.precio).toFixed(2)}</span>
          <button class="btn btn-danger btn-icon remove-item-btn" data-id="${item.id}" style="padding: 0.3rem 0.6rem;">&times;</button>
        </div>
      </div>
    `).join('');
    document.getElementById('checkout-trigger-btn').disabled = false;
  }

  document.getElementById('cart-subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('cart-iva').textContent = `$${iva.toFixed(2)}`;
  document.getElementById('cart-total').textContent = `$${total.toFixed(2)}`;

  document.querySelectorAll('.remove-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.removeFromCart(btn.getAttribute('data-id'));
    });
  });
}

// Flujo Transaccional de Checkout (Orquestación de los 6 Microservicios)
async function executeCheckoutFlow() {
  const btn = document.getElementById('confirm-payment-btn');
  btn.disabled = true;
  btn.textContent = 'Procesando Transacción Multidistribuida...';

  const steps = [
    document.getElementById('step-1'),
    document.getElementById('step-2'),
    document.getElementById('step-3'),
    document.getElementById('step-4'),
    document.getElementById('step-5')
  ];

  const setStepState = (idx, status) => {
    steps.forEach((s, i) => {
      if (i === idx) {
        s.className = `step-item ${status}`;
      }
    });
  };

  const { subtotal, iva, total } = state.getCartTotals();
  const cardNum = document.getElementById('card-number').value || '4532891245678901';
  const cardCvv = document.getElementById('card-cvv').value || '123';
  const cardExp = document.getElementById('card-exp').value || '12/28';
  const rfc = document.getElementById('invoice-rfc').value || 'XAXX010101000';
  const razon = document.getElementById('invoice-razon').value || (state.user?.nombre || 'Publico General');

  try {
    // 1. Pago Bancario SOAP (Java JAX-WS)
    setStepState(0, 'active');
    const pagoRes = await procesarCargoSoap({
      numeroTarjeta: cardNum,
      cvv: cardCvv,
      monto: total,
      fechaExpiracion: cardExp
    });
    setStepState(0, 'completed');
    showToast(`Pago Aprobado con Auth: ${pagoRes.autorizacion}`, 'success');

    // 2. Facturación Electrónica SOAP (VB.NET WCF con WS-Security)
    setStepState(1, 'active');
    const facturaRes = await timbrarFacturaSoap({
      rfc,
      razonSocial: razon,
      montoTotal: total,
      subtotal,
      iva,
      conceptos: state.cart
    });
    setStepState(1, 'completed');
    showToast(`CFDI Timbrado con Folio: ${facturaRes.uuid.substring(0, 8)}...`, 'success');

    // 3. Descuento de Stock REST (C# .NET 10)
    setStepState(2, 'active');
    for (const item of state.cart) {
      const nuevoStock = Math.max(0, (item.maxStock || 10) - item.quantity);
      await actualizarStockInventario(item.id, nuevoStock);
    }
    setStepState(2, 'completed');

    // 4. Notificaciones REST (Node.js Express)
    setStepState(3, 'active');
    await enviarNotificacionCompra({
      destinatario: state.user?.email || 'cliente@retail.com',
      asunto: `Confirmación de Compra ERP - Folio ${pagoRes.autorizacion}`,
      clienteNombre: razon,
      monto: total,
      uuidFactura: facturaRes.uuid,
      xmlComprobante: facturaRes.xmlComprobante
    });
    setStepState(3, 'completed');

    // 5. Ingesta Analítica REST (Python FastAPI & MongoDB)
    setStepState(4, 'active');
    const transacciones = state.cart.map(item => ({
      ventaId: `V-${Date.now().toString().slice(-5)}`,
      clienteId: state.user?.id || 1,
      sku: item.sku,
      sucursalId: item.sucursalId || 1,
      cantidad: item.quantity,
      precioTotal: item.precio * item.quantity
    }));
    await registrarVentaAnalitica(transacciones);
    setStepState(4, 'completed');

    showToast('¡Compra completada y orquestada con éxito en los 6 servicios!', 'success');

    // Preparar visor XML
    document.getElementById('xml-content').textContent = facturaRes.xmlComprobante;
    document.getElementById('xml-uuid-display').textContent = `UUID SAT: ${facturaRes.uuid}`;

    state.clearCart();
    setTimeout(() => {
      checkoutModal.classList.remove('open');
      xmlModal.classList.add('open');
      btn.disabled = false;
      btn.textContent = 'Confirmar Transacción y Pagar';
      renderCatalog();
    }, 1200);

  } catch (error) {
    showToast(`Error en el flujo: ${error.message}`, 'error');
    btn.disabled = false;
    btn.textContent = 'Reintentar Transacción';
  }
}

// Panel Admin de Inventario (C# .NET)
async function renderAdminTable() {
  const tbody = document.getElementById('admin-inventory-tbody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Consultando microservicio C# .NET...</td></tr>';
  const items = await fetchInventario();

  tbody.innerHTML = items.map(item => `
    <tr>
      <td style="font-family: 'JetBrains Mono', monospace;">${item.sku}</td>
      <td><strong>${item.productoNombre}</strong></td>
      <td>$${item.precio.toFixed(2)}</td>
      <td>Sucursal ${item.sucursalId}</td>
      <td>
        <input type="number" class="form-input stock-input" data-id="${item.id}" value="${item.cantidad}" style="width: 85px; padding: 0.3rem 0.5rem;" />
      </td>
      <td>
        <button class="btn btn-primary save-stock-btn" data-id="${item.id}" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;">Guardar</button>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('.save-stock-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const input = document.querySelector(`.stock-input[data-id="${id}"]`);
      const nuevaCantidad = parseInt(input.value, 10);
      await actualizarStockInventario(id, nuevaCantidad);
      showToast(`Stock actualizado a ${nuevaCantidad} unidades`, 'success');
    });
  });
}

// Dashboard de Analítica (Python FastAPI)
async function renderAnalytics() {
  const container = document.getElementById('analytics-cards-container');
  container.innerHTML = '<div style="text-align: center; color: var(--text-muted); grid-column: 1/-1;">Consultando motor predictivo en Python FastAPI (Puerto 8001)...</div>';

  const data = await obtenerTendenciasAnalitica(1, 7);
  container.innerHTML = data.predicciones.map(p => `
    <div class="product-card" style="border-top: 3px solid ${p.nivelAlerta === 'CRITICO' ? 'var(--accent-rose)' : (p.nivelAlerta === 'MODERADO' ? 'var(--accent-amber)' : 'var(--accent-emerald)')};">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <span class="product-sku">${p.sku}</span>
        <span class="stock-badge" style="background: rgba(255,255,255,0.06); color: #fff;">${p.nivelAlerta}</span>
      </div>
      <h4 style="font-size: 1.1rem; margin-bottom: 0.75rem;">${p.nombre}</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem; background: rgba(0,0,0,0.25); padding: 0.85rem; border-radius: var(--radius-md);">
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Demanda Est. (7d)</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: var(--accent-cyan);">${p.demandaEstimada} u.</div>
        </div>
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Sugerencia Compra</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: var(--accent-emerald);">${p.sugerenciaReabastecimiento} u.</div>
        </div>
      </div>
      <div style="font-size: 0.8rem; color: var(--text-secondary);">Índice de Confianza del Modelo: ${(p.confianza * 100).toFixed(0)}%</div>
    </div>
  `).join('');
}

// Event Listeners y Modales
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  renderCatalog();
  updateCartUI();

  window.addEventListener('cart:updated', () => updateCartUI());
  window.addEventListener('auth:changed', () => updateAuthUI());

  branchSelect.addEventListener('change', () => renderCatalog());

  // Carrito Drawer
  document.getElementById('cart-btn').addEventListener('click', () => {
    cartModal.classList.add('open');
  });

  document.getElementById('checkout-trigger-btn').addEventListener('click', () => {
    cartModal.classList.remove('open');
    checkoutModal.classList.add('open');
  });

  document.getElementById('confirm-payment-btn').addEventListener('click', () => {
    executeCheckoutFlow();
  });

  // Auth Modal
  userBtn.addEventListener('click', () => {
    if (state.user) {
      if (confirm(`Sesión iniciada como ${state.user.nombre} (${state.user.puntos_lealtad} puntos). ¿Deseas cerrar sesión?`)) {
        logoutUser();
        showToast('Sesión cerrada');
      }
    } else {
      authModal.classList.add('open');
    }
  });

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    try {
      const res = await loginUser(email, pass);
      showToast(`¡Bienvenido, ${res.user.nombre}!`, 'success');
      authModal.classList.remove('open');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Formulario nuevo producto
  document.getElementById('new-product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('prod-nombre').value;
    const sku = document.getElementById('prod-sku').value;
    const precio = parseFloat(document.getElementById('prod-precio').value);

    await crearNuevoProducto({ nombre, sku, precio });
    showToast(`Producto ${sku} registrado en C# .NET 10`, 'success');
    e.target.reset();
    renderAdminTable();
  });

  // Cerrar modales con botones de cierre
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
    });
  });

  updateAuthUI();
});

function updateAuthUI() {
  if (state.user) {
    userBtn.innerHTML = `<span>👤</span> ${state.user.nombre.split(' ')[0]} (${state.user.puntos_lealtad} pts)`;
    userBtn.classList.add('btn-primary');
    userBtn.classList.remove('btn-secondary');
  } else {
    userBtn.innerHTML = `<span>👤</span> Iniciar Sesión`;
    userBtn.classList.add('btn-secondary');
    userBtn.classList.remove('btn-primary');
  }
}
