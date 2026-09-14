import { state } from './state.js';
import { 
  fetchInventario, 
  fetchInventarioMatrizFederada, 
  actualizarStockInventario, 
  crearNuevoProducto 
} from './services/inventoryService.js';
import { procesarCargoSoap, timbrarFacturaSoap } from './services/soapClient.js';
import { enviarNotificacionCompra } from './services/notifyService.js';
import { registrarVentaAnalitica, obtenerTendenciasAnalitica } from './services/analyticsService.js';

// Elementos del DOM
const omniboxInput = document.getElementById('omnibox-input');
const searchDropdown = document.getElementById('search-dropdown');
const viewPos = document.getElementById('view-pos');
const viewCatalog = document.getElementById('view-catalog');
const catalogSearchInput = document.getElementById('catalog-search-input');
const catalogProductsGrid = document.getElementById('catalog-products-grid');
const catalogCartBadge = document.getElementById('catalog-cart-badge');
const catalogGoToPos = document.getElementById('catalog-go-to-pos');
const posTableTbody = document.getElementById('pos-table-tbody');
const branchSelect = document.getElementById('branch-select');
const subtotalEl = document.getElementById('pos-subtotal');
const ivaEl = document.getElementById('pos-iva');
const grandTotalEl = document.getElementById('pos-grand-total');
const checkoutBtn = document.getElementById('btn-trigger-checkout');
const itemCountLabel = document.getElementById('item-count-label');
const toastOutlet = document.getElementById('toast-outlet');

// Modales
const modalCheckout = document.getElementById('modal-checkout');
const modalMatrix = document.getElementById('modal-inventory-matrix');
const modalReceipt = document.getElementById('modal-receipt');
const modalAnalytics = document.getElementById('modal-analytics');

// Helper para evitar inyecciones XSS
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

// Notificaciones Toast Corporativas
export function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast-item ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ')}</span> <div>${message}</div>`;
  toastOutlet.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

// Inicialización de la Aplicación
document.addEventListener('DOMContentLoaded', async () => {
  // Cargar inventario inicial
  await refreshPosTable();
  updateFinancialSidebar();
  updateCatalogBadge();

  // Event Listeners de Navegación por Pestañas
  document.querySelectorAll('.nav-tab[data-view]').forEach(tab => {
    tab.addEventListener('click', () => {
      const view = tab.getAttribute('data-view');
      switchView(view);
    });
  });

  // Botón para saltar del catálogo directo al POS
  if (catalogGoToPos) {
    catalogGoToPos.addEventListener('click', () => {
      switchView('pos');
    });
  }

  // Buscador interno del catálogo visual de productos
  if (catalogSearchInput) {
    catalogSearchInput.addEventListener('input', (e) => {
      renderCatalogGrid(e.target.value.trim());
    });
  }

  // Selector de Sucursal Local
  branchSelect.addEventListener('change', async (e) => {
    state.currentBranch = parseInt(e.target.value, 10);
    showToast(`Caja conmutada a Sucursal ${state.currentBranch} (${state.currentBranch === 1 ? 'Central' : 'Norte'})`, 'info');
    await refreshPosTable();
    updateFinancialSidebar();
    if (viewCatalog && viewCatalog.classList.contains('active')) {
      await renderCatalogGrid(catalogSearchInput ? catalogSearchInput.value.trim() : '');
    }
  });

  // Buscador Omnibox: Detección en vivo para mostrar dropdown de coincidencias
  omniboxInput.addEventListener('input', async (e) => {
    const query = e.target.value.trim();
    if (!query) {
      closeSearchDropdown();
      return;
    }
    await renderSearchMatches(query);
  });

  // Buscador Omnibox: Teclas Enter y Escape
  omniboxInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const firstBtn = searchDropdown ? searchDropdown.querySelector('.btn-add-match') : null;
      if (firstBtn) {
        firstBtn.click();
      } else {
        const query = omniboxInput.value.trim();
        if (query) {
          await handleOmniboxQuery(query);
          omniboxInput.value = '';
          closeSearchDropdown();
        }
      }
    } else if (e.key === 'Escape') {
      closeSearchDropdown();
      omniboxInput.value = '';
    }
  });

  // Cerrar dropdown al hacer click fuera
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.omnibox-wrapper')) {
      closeSearchDropdown();
    }
  });

  // Atajos de Teclado Globales ([F1], [F2], [F3], [F4], [F12], [Ctrl+Enter])
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F1') {
      e.preventDefault();
      switchView('pos');
    } else if (e.key === 'F2') {
      e.preventDefault();
      switchView('catalog');
    } else if (e.key === 'F3') {
      e.preventDefault();
      openInventoryMatrix();
    } else if (e.key === 'F4') {
      e.preventDefault();
      openAnalyticsModal();
    } else if (e.key === 'F12' || (e.ctrlKey && e.key === 'Enter')) {
      e.preventDefault();
      if (!checkoutBtn.disabled) {
        openCheckoutModal();
      }
    }
  });

  // Botón de Checkout
  checkoutBtn.addEventListener('click', () => {
    openCheckoutModal();
  });

  // Confirmar Transacción en Checkout
  document.getElementById('btn-confirm-transaction').addEventListener('click', async () => {
    await executePosTransaction();
  });

  // Limpiar lista
  document.getElementById('clear-cart-btn').addEventListener('click', () => {
    if (state.cart.length > 0 && confirm('¿Deseas cancelar los artículos de la transacción actual?')) {
      state.clearCart();
      refreshPosTable();
      updateFinancialSidebar();
      updateCatalogBadge();
      showToast('Lista de artículos vaciada', 'info');
    }
  });

  // Nueva venta desde recibo
  document.getElementById('btn-print-receipt').addEventListener('click', () => {
    modalReceipt.classList.remove('open');
    switchView('pos');
  });

  // Imprimir / Guardar Ticket PDF
  const btnPrintPdf = document.getElementById('btn-print-pdf-ticket');
  if (btnPrintPdf) {
    btnPrintPdf.addEventListener('click', () => {
      imprimirTicketPdf();
    });
  }

  // Formulario alta nuevo producto en matriz
  document.getElementById('matrix-new-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('new-prod-name').value.trim();
    const sku = document.getElementById('new-prod-sku').value.trim();
    const precio = parseFloat(document.getElementById('new-prod-price').value);

    await crearNuevoProducto({ nombre, sku, precio });
    showToast(`Producto ${sku} registrado en catálogo central de C# .NET`, 'success');
    e.target.reset();
    await renderMatrixTable();
    await refreshPosTable();
    if (viewCatalog && viewCatalog.classList.contains('active')) {
      await renderCatalogGrid(catalogSearchInput ? catalogSearchInput.value.trim() : '');
    }
  });

  // Cerrar modales
  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
      if (viewPos.classList.contains('active')) {
        omniboxInput.focus();
      }
    });
  });

  // Sincronización reactiva del carrito
  window.addEventListener('cart:updated', () => {
    refreshPosTable();
    updateFinancialSidebar();
    updateCatalogBadge();
  });

  // Cargar artículos demo en la caja si está vacía
  if (state.cart.length === 0) {
    state.addToCart({
      id: "inv-suc1-001",
      productoNombre: "Laptop Gamer Asus TUF 15.6",
      sku: "LAP-ASUS-001",
      precio: 1299.99,
      sucursalId: 1
    }, 1);
    refreshPosTable();
    updateFinancialSidebar();
    updateCatalogBadge();
  }
});

// Conmutación de Vistas Principales (POS vs Catálogo vs Modales)
function switchView(view) {
  if (view === 'pos') {
    viewPos.classList.add('active');
    if (viewCatalog) viewCatalog.classList.remove('active');
    document.querySelectorAll('.nav-tab[data-view]').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-view') === 'pos');
    });
    omniboxInput.focus();
  } else if (view === 'catalog') {
    viewPos.classList.remove('active');
    if (viewCatalog) viewCatalog.classList.add('active');
    document.querySelectorAll('.nav-tab[data-view]').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-view') === 'catalog');
    });
    renderCatalogGrid(catalogSearchInput ? catalogSearchInput.value.trim() : '');
  } else if (view === 'inventory-matrix') {
    openInventoryMatrix();
  } else if (view === 'analytics-view') {
    openAnalyticsModal();
  }
}

// Renderizar coincidencias de búsqueda en vivo en el dropdown flotante del Omnibox
async function renderSearchMatches(query) {
  if (!searchDropdown) return;

  const matrix = await fetchInventarioMatrizFederada();
  const q = query.toLowerCase();
  const matches = matrix.filter(item => 
    item.sku.toLowerCase().includes(q) || 
    item.productoNombre.toLowerCase().includes(q)
  );

  if (matches.length === 0) {
    searchDropdown.innerHTML = `
      <div style="padding: 1.25rem; text-align: center; color: var(--text-slate-400); font-size: 0.88rem;">
        No se encontraron productos coincidentes para "<strong>${escapeHtml(query)}</strong>"
      </div>
    `;
    searchDropdown.classList.add('open');
    return;
  }

  const currentBranch = state.currentBranch;
  const currentBranchName = currentBranch === 1 ? 'Sucursal 1 (Central)' : 'Sucursal 2 (Norte)';
  const remoteBranchName = currentBranch === 1 ? 'Sucursal 2 (Norte)' : 'Sucursal 1 (Central)';

  searchDropdown.innerHTML = matches.map(m => {
    const localStock = currentBranch === 1 ? m.stockSucursal1 : m.stockSucursal2;
    const remoteStock = currentBranch === 1 ? m.stockSucursal2 : m.stockSucursal1;

    return `
      <div class="search-result-item" data-sku="${m.sku}">
        <div class="search-result-info">
          <div class="search-result-title">${escapeHtml(m.productoNombre)}</div>
          <div class="search-result-meta">
            <span class="td-mono" style="color: var(--primary-600); font-weight: 700;">${m.sku}</span>
            <span class="origin-badge ${localStock > 0 ? 'local' : 'out'}">
              ${localStock > 0 ? '🟢 ' + currentBranchName + ': ' + localStock + ' u.' : '🔴 Agotado localmente'}
            </span>
            <span class="origin-badge ${remoteStock > 0 ? 'transfer' : 'out'}">
              ${remoteStock > 0 ? '🟡 ' + remoteBranchName + ': ' + remoteStock + ' u.' : '⚪ Sin stock remoto'}
            </span>
          </div>
        </div>
        <div class="search-result-actions">
          <div class="td-mono" style="font-weight: 700; font-size: 1.05rem; color: var(--text-slate-900);">$${m.precio.toFixed(2)}</div>
          <button type="button" class="btn-checkout-primary btn-add-match" data-sku="${m.sku}" style="min-height: 32px; padding: 0 0.85rem; font-size: 0.78rem;">
            + Agregar a Cesta
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Event Listeners de clic en items o botones del dropdown
  searchDropdown.querySelectorAll('.btn-add-match').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const sku = btn.getAttribute('data-sku');
      await addSkuToCart(sku, 1);
      closeSearchDropdown();
      omniboxInput.value = '';
      omniboxInput.focus();
    });
  });

  searchDropdown.querySelectorAll('.search-result-item').forEach(itemRow => {
    itemRow.addEventListener('click', async (e) => {
      if (e.target.closest('.btn-add-match')) return;
      const sku = itemRow.getAttribute('data-sku');
      await addSkuToCart(sku, 1);
      closeSearchDropdown();
      omniboxInput.value = '';
      omniboxInput.focus();
    });
  });

  searchDropdown.classList.add('open');
}

function closeSearchDropdown() {
  if (searchDropdown) {
    searchDropdown.classList.remove('open');
  }
}

// Búsqueda directa por Omnibox
async function handleOmniboxQuery(query) {
  const allItems = await fetchInventario(null);
  const q = query.toLowerCase();

  const match = allItems.find(i => 
    i.sku.toLowerCase() === q || 
    i.productoNombre.toLowerCase().includes(q)
  );

  if (match) {
    await addSkuToCart(match.sku, 1);
  } else {
    showToast(`No se encontró ningún artículo para: "${query}"`, 'error');
  }
}

// Función central para agregar SKU a la cesta con soporte multitienda
async function addSkuToCart(sku, quantity = 1) {
  const allItems = await fetchInventario(null);
  const match = allItems.find(i => i.sku === sku && i.sucursalId === state.currentBranch) 
             || allItems.find(i => i.sku === sku);

  if (match) {
    state.addToCart({
      id: match.id,
      productoNombre: match.productoNombre,
      sku: match.sku,
      precio: match.precio,
      sucursalId: match.sucursalId
    }, quantity);
    refreshPosTable();
    updateFinancialSidebar();
    updateCatalogBadge();
    showToast(`+${quantity} "${match.productoNombre}" añadido a la cesta`, 'success');
  } else {
    showToast(`No se encontró el producto ${sku}`, 'error');
  }
}

// Renderizar Módulo Dedicado de Catálogo de Productos con Filtro y Agregado Manual
async function renderCatalogGrid(filterQuery = '') {
  if (!catalogProductsGrid) return;

  const matrix = await fetchInventarioMatrizFederada();
  const q = filterQuery.toLowerCase();
  const filtered = q 
    ? matrix.filter(item => item.sku.toLowerCase().includes(q) || item.productoNombre.toLowerCase().includes(q))
    : matrix;

  if (filtered.length === 0) {
    catalogProductsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-slate-400);">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔍</div>
        <div style="font-weight: 600; color: var(--text-slate-700); font-size: 1rem;">No se encontraron productos coincidentes</div>
        <div style="font-size: 0.85rem; margin-top: 0.25rem;">Intenta buscar con otro nombre o código SKU.</div>
      </div>
    `;
    return;
  }

  const currentBranch = state.currentBranch;
  const currentBranchName = currentBranch === 1 ? 'Sucursal 1 (Central)' : 'Sucursal 2 (Norte)';
  const remoteBranchName = currentBranch === 1 ? 'Sucursal 2 (Norte)' : 'Sucursal 1 (Central)';

  catalogProductsGrid.innerHTML = filtered.map(item => {
    const localStock = currentBranch === 1 ? item.stockSucursal1 : item.stockSucursal2;
    const remoteStock = currentBranch === 1 ? item.stockSucursal2 : item.stockSucursal1;
    const totalRed = item.stockSucursal1 + item.stockSucursal2;

    let badgeClass = 'local';
    let badgeText = `🟢 ${currentBranchName}: En Stock`;
    if (localStock === 0 && remoteStock > 0) {
      badgeClass = 'transfer';
      badgeText = `🟡 ${remoteBranchName}: Traspaso`;
    } else if (localStock === 0 && remoteStock === 0) {
      badgeClass = 'out';
      badgeText = '🔴 Agotado en Red';
    }

    return `
      <div class="product-item-card" data-sku="${item.sku}">
        <div class="product-card-top">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
            <span class="td-mono" style="font-size: 0.72rem; font-weight: 700; color: var(--primary-600); background: var(--primary-50); padding: 0.2rem 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--primary-100);">
              ${item.sku}
            </span>
            <span class="origin-badge ${badgeClass}" style="font-size: 0.7rem;">${badgeText}</span>
          </div>
          <div class="product-card-title">${escapeHtml(item.productoNombre)}</div>
          <div class="product-card-price">$${item.precio.toFixed(2)} <span style="font-size: 0.75rem; font-weight: 500; color: var(--text-slate-400);">USD</span></div>
        </div>

        <div style="background: var(--bg-slate-50); border: 1px solid var(--border-slate-200); border-radius: var(--radius-md); padding: 0.75rem; display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.8rem;">
          <div class="product-card-stock-row">
            <span>📍 ${currentBranchName}:</span>
            <strong style="color: ${localStock > 0 ? 'var(--text-slate-900)' : 'var(--danger-700)'};">${localStock} u.</strong>
          </div>
          <div class="product-card-stock-row">
            <span>🏢 ${remoteBranchName}:</span>
            <strong style="color: var(--text-slate-700);">${remoteStock} u.</strong>
          </div>
          <div class="product-card-stock-row" style="border-top: 1px dashed var(--border-slate-200); padding-top: 0.35rem; margin-top: 0.1rem;">
            <span style="font-weight: 600;">Existencia Total Red:</span>
            <strong style="color: var(--primary-600);">${totalRed} u.</strong>
          </div>
        </div>

        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <div class="qty-stepper" style="flex: 0 0 auto;">
            <button class="qty-btn btn-catalog-dec" data-sku="${item.sku}">-</button>
            <input type="number" class="qty-input catalog-item-qty" data-sku="${item.sku}" value="1" min="1" max="99" style="width: 40px; border: none; text-align: center; font-family: var(--font-data); font-weight: 600;" />
            <button class="qty-btn btn-catalog-inc" data-sku="${item.sku}">+</button>
          </div>
          <button class="btn-add-to-cart btn-catalog-add" data-sku="${item.sku}">
            🛒 Agregar a Cesta
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Event Listeners de Stepper en Catálogo
  catalogProductsGrid.querySelectorAll('.btn-catalog-inc').forEach(b => {
    b.addEventListener('click', () => {
      const sku = b.getAttribute('data-sku');
      const input = catalogProductsGrid.querySelector(`.catalog-item-qty[data-sku="${sku}"]`);
      if (input) input.value = parseInt(input.value || '1', 10) + 1;
    });
  });

  catalogProductsGrid.querySelectorAll('.btn-catalog-dec').forEach(b => {
    b.addEventListener('click', () => {
      const sku = b.getAttribute('data-sku');
      const input = catalogProductsGrid.querySelector(`.catalog-item-qty[data-sku="${sku}"]`);
      if (input && parseInt(input.value || '1', 10) > 1) {
        input.value = parseInt(input.value, 10) - 1;
      }
    });
  });

  // Event Listener Botón Agregar a Cesta
  catalogProductsGrid.querySelectorAll('.btn-catalog-add').forEach(btn => {
    btn.addEventListener('click', async () => {
      const sku = btn.getAttribute('data-sku');
      const input = catalogProductsGrid.querySelector(`.catalog-item-qty[data-sku="${sku}"]`);
      const qty = input ? parseInt(input.value, 10) || 1 : 1;

      await addSkuToCart(sku, qty);

      // Feedback visual inmediato en el botón
      const originalHtml = btn.innerHTML;
      btn.innerHTML = '✓ ¡Añadido a Cesta!';
      btn.style.background = 'var(--success-700)';
      setTimeout(() => {
        btn.innerHTML = originalHtml;
        btn.style.background = '';
      }, 1200);
    });
  });
}

// Actualizar badge del carrito en el encabezado del catálogo
function updateCatalogBadge() {
  const totalQty = state.cart.reduce((s, i) => s + i.quantity, 0);
  if (catalogCartBadge) catalogCartBadge.textContent = totalQty;
}

// Refrescar tabla del POS
async function refreshPosTable() {
  if (state.cart.length === 0) {
    posTableTbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-slate-400); padding: 3rem 1rem;">
          <div>🛒 No hay artículos registrados en esta venta.</div>
          <div style="font-size: 0.8rem; margin-top: 0.25rem;">Escanea un código de barras o escribe en el buscador superior [F1].</div>
        </td>
      </tr>
    `;
    itemCountLabel.textContent = '0 Artículos';
    return;
  }

  // Obtener matriz de inventario federada para determinar badges de origen
  const matrix = await fetchInventarioMatrizFederada();
  const currentBranch = state.currentBranch;

  posTableTbody.innerHTML = state.cart.map(item => {
    const reg = matrix.find(m => m.sku === item.sku);
    let originBadge = '';

    if (reg) {
      const localStock = currentBranch === 1 ? reg.stockSucursal1 : reg.stockSucursal2;
      const remoteStock = currentBranch === 1 ? reg.stockSucursal2 : reg.stockSucursal1;
      const remoteName = currentBranch === 1 ? 'Sucursal 2 (Norte)' : 'Sucursal 1 (Central)';

      if (localStock >= item.quantity) {
        originBadge = `<span class="origin-badge local">🟢 Stock Local (${localStock} u.)</span>`;
      } else if (remoteStock >= item.quantity) {
        originBadge = `<span class="origin-badge transfer">🟡 ${remoteName}: Traspaso (${remoteStock} u.)</span>`;
      } else if ((localStock + remoteStock) >= item.quantity) {
        originBadge = `<span class="origin-badge transfer">🟡 Stock Combinado Red</span>`;
      } else {
        originBadge = `<span class="origin-badge out">🔴 CEDIS Central: 24h</span>`;
      }
    } else {
      originBadge = `<span class="origin-badge local">🟢 Stock Local</span>`;
    }

    const totalItem = (item.precio * item.quantity).toFixed(2);

    return `
      <tr data-sku="${item.sku}">
        <td class="td-mono" style="font-weight: 600; color: var(--primary-600);">${item.sku}</td>
        <td>
          <div style="font-weight: 600;">${item.productoNombre}</div>
        </td>
        <td>${originBadge}</td>
        <td style="text-align: center;">
          <div class="qty-stepper">
            <button class="qty-btn btn-qty-dec" data-id="${item.id}">-</button>
            <span class="qty-input">${item.quantity}</span>
            <button class="qty-btn btn-qty-inc" data-id="${item.id}">+</button>
          </div>
        </td>
        <td class="td-mono td-right">$${item.precio.toFixed(2)}</td>
        <td class="td-mono td-right" style="font-weight: 700; color: var(--text-slate-900);">$${totalItem}</td>
        <td style="text-align: center;">
          <button class="nav-tab btn-remove-item" data-id="${item.id}" style="color: var(--danger-500); padding: 0.2rem 0.4rem;" title="Eliminar fila">&times;</button>
        </td>
      </tr>
    `;
  }).join('');

  const totalQty = state.cart.reduce((s, i) => s + i.quantity, 0);
  itemCountLabel.textContent = `${totalQty} Artículo${totalQty === 1 ? '' : 's'}`;

  // Listeners de cantidad
  document.querySelectorAll('.btn-qty-inc').forEach(b => {
    b.addEventListener('click', () => {
      const id = b.getAttribute('data-id');
      const it = state.cart.find(x => x.id === id);
      if (it) {
        it.quantity += 1;
        state.saveCart();
      }
    });
  });

  document.querySelectorAll('.btn-qty-dec').forEach(b => {
    b.addEventListener('click', () => {
      const id = b.getAttribute('data-id');
      const it = state.cart.find(x => x.id === id);
      if (it) {
        if (it.quantity > 1) {
          it.quantity -= 1;
          state.saveCart();
        } else {
          state.removeFromCart(id);
        }
      }
    });
  });

  document.querySelectorAll('.btn-remove-item').forEach(b => {
    b.addEventListener('click', () => {
      state.removeFromCart(b.getAttribute('data-id'));
    });
  });
}

// Incrementar cantidad del último artículo [F4]
function incrementLastItemQty() {
  if (state.cart.length > 0) {
    const lastItem = state.cart[state.cart.length - 1];
    lastItem.quantity += 1;
    state.saveCart();
    showToast(`Cantidad de "${lastItem.productoNombre}" incrementada a ${lastItem.quantity}`, 'info');
  }
}

// Actualizar barra financiera lateral
function updateFinancialSidebar() {
  const { subtotal, iva, total } = state.getCartTotals();
  subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  ivaEl.textContent = `$${iva.toFixed(2)}`;
  grandTotalEl.textContent = `$${total.toFixed(2)}`;
  checkoutBtn.disabled = state.cart.length === 0;
  updateCatalogBadge();
}

// Abrir Modal de Checkout
function openCheckoutModal() {
  if (state.cart.length === 0) return;
  modalCheckout.classList.add('open');
}

// Ejecutar Transacción de Cobro Segura (Orquestación POS)
async function executePosTransaction() {
  const btn = document.getElementById('btn-confirm-transaction');
  btn.disabled = true;
  btn.textContent = 'PROCESANDO TRANSACCIÓN...';

  const steps = [
    document.getElementById('step-pos-1'),
    document.getElementById('step-pos-2'),
    document.getElementById('step-pos-3'),
    document.getElementById('step-pos-4'),
    document.getElementById('step-pos-5')
  ];

  const markStep = (idx, status) => {
    steps.forEach((s, i) => {
      if (i === idx) s.className = `stepper-row ${status}`;
    });
  };

  const { subtotal, iva, total } = state.getCartTotals();
  const currentBranch = state.currentBranch;

  // Snapshot de los artículos comprados para el ticket térmico antes de vaciar la cesta
  const soldItems = JSON.parse(JSON.stringify(state.cart));
  const soldTotals = { subtotal, iva, total };
  const currentBranchId = currentBranch;

  try {
    // 1. Autorización Bancaria SOAP (Java JAX-WS :8081)
    markStep(0, 'active');
    const pagoRes = await procesarCargoSoap({
      numeroTarjeta: '4532891245678901',
      cvv: '892',
      monto: total,
      fechaExpiracion: '12/28'
    });
    markStep(0, 'completed');

    // 2. Timbrado Fiscal SAT SOAP (VB.NET WCF :80 con WS-Security)
    markStep(1, 'active');
    const facturaRes = await timbrarFacturaSoap({
      rfc: 'XAXX010101000',
      razonSocial: 'Juan Pérez (Público General)',
      montoTotal: total,
      subtotal,
      iva,
      conceptos: state.cart
    });
    markStep(1, 'completed');

    // 3. Decremento de Stock en Sucursal Activa (C# .NET 10 :5084)
    markStep(2, 'active');
    const allItems = await fetchInventario(null);
    for (const item of state.cart) {
      // Buscar registro de inventario de este producto en la sucursal actual
      const invRow = allItems.find(x => x.sku === item.sku && x.sucursalId === currentBranch);
      if (invRow) {
        const nuevoStock = Math.max(0, invRow.cantidad - item.quantity);
        await actualizarStockInventario(invRow.id, nuevoStock);
      }
    }
    markStep(2, 'completed');

    // 4. Notificación al Comprador (Node.js :3000)
    markStep(3, 'active');
    await enviarNotificacionCompra({
      destinatario: 'cliente@retail.com',
      asunto: `Recibo de Compra POS - Folio ${pagoRes.autorizacion}`,
      clienteNombre: 'Juan Pérez',
      monto: total,
      uuidFactura: facturaRes.uuid
    });
    markStep(3, 'completed');

    // 5. Ingesta Analítica NoSQL (Python FastAPI :8001 & MongoDB)
    markStep(4, 'active');
    const transacciones = state.cart.map(item => ({
      ventaId: `V-${Date.now().toString().slice(-6)}`,
      clienteId: 2,
      sku: item.sku,
      sucursalId: currentBranch,
      cantidad: item.quantity,
      precioTotal: item.precio * item.quantity
    }));
    await registrarVentaAnalitica(transacciones);
    markStep(4, 'completed');

    // Éxito: Preparar y renderizar ticket térmico en formato 80mm
    renderThermalTicket({
      items: soldItems,
      totals: soldTotals,
      branchId: currentBranchId,
      pagoRes,
      facturaRes,
      fecha: new Date()
    });

    showToast('¡Cobro aprobado, persistido en BD y facturado!', 'success');

    // Limpiar carrito y mostrar recibo con ticket
    state.clearCart();
    setTimeout(() => {
      modalCheckout.classList.remove('open');
      modalReceipt.classList.add('open');
      btn.disabled = false;
      btn.textContent = 'CONFIRMAR TRANSACCIÓN';
      // Restablecer steppers
      steps.forEach(s => s.className = 'stepper-row');
      refreshPosTable();
      updateFinancialSidebar();

      // Disparar ventana de impresión / guardado como PDF automáticamente
      setTimeout(() => {
        imprimirTicketPdf();
      }, 500);
    }, 800);

  } catch (err) {
    showToast(`Fallo en el cobro: ${err.message}`, 'error');
    btn.disabled = false;
    btn.textContent = 'REINTENTAR TRANSACCIÓN';
  }
}

// Renderizar Ticket Térmico en Formato de 80mm
function renderThermalTicket({ items, totals, branchId, pagoRes, facturaRes, fecha }) {
  const container = document.getElementById('thermal-ticket-container');
  if (!container) return;

  const branchName = branchId === 1 ? 'SUCURSAL 1 - CENTRAL' : 'SUCURSAL 2 - NORTE';
  const branchAddress = branchId === 1 
    ? 'Av. Constitución #450, Monterrey, N.L.' 
    : 'Av. Paseo de los Leones #2800, Monterrey, N.L.';
  
  const folioVenta = `V-${Date.now().toString().slice(-6)}`;
  const fechaStr = fecha ? fecha.toLocaleString('es-MX') : new Date().toLocaleString('es-MX');

  const itemsRows = items.map(item => {
    const importe = (item.precio * item.quantity).toFixed(2);
    return `
      <tr>
        <td style="width: 28px; font-weight: 700;">${item.quantity}x</td>
        <td>
          <div style="font-weight: 600;">${escapeHtml(item.productoNombre)}</div>
          <div style="color: #64748B; font-size: 0.68rem;">SKU: ${item.sku}</div>
        </td>
        <td class="td-right" style="width: 60px;">$${item.precio.toFixed(2)}</td>
        <td class="td-right" style="width: 70px; font-weight: 700;">$${importe}</td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="ticket-header">
      <div class="ticket-brand">ERP RETAIL CORPORATION S.A. DE C.V.</div>
      <div style="font-size: 0.72rem; color: #475569;">RFC: RET-240913-AA1 &bull; RÉGIMEN GENERAL</div>
      <div style="font-size: 0.72rem; font-weight: 700; margin-top: 0.2rem;">${branchName}</div>
      <div style="font-size: 0.7rem; color: #64748B;">${branchAddress}</div>
      <div style="font-size: 0.7rem; color: #64748B;">Tel: (81) 8000-RETAIL</div>
    </div>

    <div class="ticket-divider"></div>

    <div class="ticket-meta-row">
      <span>FOLIO VENTA:</span>
      <strong style="font-family: var(--font-data);">${folioVenta}</strong>
    </div>
    <div class="ticket-meta-row">
      <span>FECHA / HORA:</span>
      <span>${fechaStr}</span>
    </div>
    <div class="ticket-meta-row">
      <span>CAJA / TERMINAL:</span>
      <span>CAJA-0${branchId} &bull; Juan Pérez</span>
    </div>
    <div class="ticket-meta-row">
      <span>CLIENTE:</span>
      <span>Juan Pérez (XAXX010101000)</span>
    </div>

    <div class="ticket-divider"></div>

    <table class="ticket-items-table">
      <thead>
        <tr>
          <th>CANT</th>
          <th>ARTÍCULO</th>
          <th class="td-right">PRECIO</th>
          <th class="td-right">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div class="ticket-divider"></div>

    <div class="ticket-totals-row">
      <span>SUBTOTAL (SIN IVA):</span>
      <span>$${totals.subtotal.toFixed(2)} USD</span>
    </div>
    <div class="ticket-totals-row">
      <span>IVA TRASLADADO (16%):</span>
      <span>$${totals.iva.toFixed(2)} USD</span>
    </div>
    <div class="ticket-totals-row">
      <span>DESCUENTO:</span>
      <span>$0.00 USD</span>
    </div>

    <div class="ticket-grand-total">
      <span>TOTAL A PAGAR:</span>
      <span>$${totals.total.toFixed(2)} USD</span>
    </div>

    <div class="ticket-divider"></div>

    <div style="font-size: 0.72rem; margin-bottom: 0.35rem;">
      <div style="display: flex; justify-content: space-between;">
        <span>FORMA DE PAGO:</span>
        <strong>TARJETA CRÉD/DÉB</strong>
      </div>
      <div style="display: flex; justify-content: space-between; color: #475569;">
        <span>TARJETA:</span>
        <span>•••• •••• •••• 8901</span>
      </div>
      <div style="display: flex; justify-content: space-between; color: #475569;">
        <span>AUTORIZACIÓN BANCARIA:</span>
        <span style="font-weight: 700; color: #0F172A;">${pagoRes.autorizacion}</span>
      </div>
      <div style="display: flex; justify-content: space-between; color: #475569;">
        <span>UUID TIMBRADO SAT:</span>
        <span style="font-size: 0.65rem; word-break: break-all;">${facturaRes.uuid}</span>
      </div>
      <div style="display: flex; justify-content: space-between; color: var(--success-700); font-weight: 700; margin-top: 0.2rem;">
        <span>ESTADO FISCAL:</span>
        <span>APROBADA Y CERTIFICADA</span>
      </div>
    </div>

    <div class="ticket-barcode-box">
      <svg class="ticket-barcode-svg" viewBox="0 0 200 36">
        <rect x="5" y="0" width="2" height="36" fill="#000"/>
        <rect x="10" y="0" width="3" height="36" fill="#000"/>
        <rect x="16" y="0" width="1" height="36" fill="#000"/>
        <rect x="20" y="0" width="4" height="36" fill="#000"/>
        <rect x="28" y="0" width="2" height="36" fill="#000"/>
        <rect x="33" y="0" width="3" height="36" fill="#000"/>
        <rect x="39" y="0" width="1" height="36" fill="#000"/>
        <rect x="44" y="0" width="4" height="36" fill="#000"/>
        <rect x="52" y="0" width="2" height="36" fill="#000"/>
        <rect x="58" y="0" width="3" height="36" fill="#000"/>
        <rect x="64" y="0" width="2" height="36" fill="#000"/>
        <rect x="70" y="0" width="4" height="36" fill="#000"/>
        <rect x="78" y="0" width="1" height="36" fill="#000"/>
        <rect x="83" y="0" width="3" height="36" fill="#000"/>
        <rect x="89" y="0" width="2" height="36" fill="#000"/>
        <rect x="95" y="0" width="4" height="36" fill="#000"/>
        <rect x="103" y="0" width="2" height="36" fill="#000"/>
        <rect x="109" y="0" width="3" height="36" fill="#000"/>
        <rect x="115" y="0" width="1" height="36" fill="#000"/>
        <rect x="120" y="0" width="4" height="36" fill="#000"/>
        <rect x="128" y="0" width="2" height="36" fill="#000"/>
        <rect x="134" y="0" width="3" height="36" fill="#000"/>
        <rect x="140" y="0" width="1" height="36" fill="#000"/>
        <rect x="145" y="0" width="4" height="36" fill="#000"/>
        <rect x="153" y="0" width="2" height="36" fill="#000"/>
        <rect x="159" y="0" width="3" height="36" fill="#000"/>
        <rect x="165" y="0" width="2" height="36" fill="#000"/>
        <rect x="171" y="0" width="4" height="36" fill="#000"/>
        <rect x="179" y="0" width="2" height="36" fill="#000"/>
        <rect x="185" y="0" width="3" height="36" fill="#000"/>
        <rect x="191" y="0" width="2" height="36" fill="#000"/>
      </svg>
      <div style="font-size: 0.65rem; color: #64748B; margin-top: 0.15rem; font-family: var(--font-data);">
        ${facturaRes.uuid}
      </div>
    </div>

    <div class="ticket-footer">
      <div>Este documento es una representación impresa de un CFDI v4.0</div>
      <div>Sello Digital PAC y SAT verificado en tiempo real</div>
      <div style="font-weight: 700; margin-top: 0.25rem; color: #0F172A;">¡GRACIAS POR SU COMPRA!</div>
    </div>
  `;
}

// Imprimir Ticket térmico / Descargar como PDF
function imprimirTicketPdf() {
  const ticketEl = document.getElementById('thermal-ticket-container');
  if (!ticketEl || !ticketEl.innerHTML.trim()) {
    showToast('No hay ticket generado para imprimir', 'error');
    return;
  }

  const printWindow = window.open('', '_blank', 'width=420,height=680');
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket de Compra - ERP Retail POS</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 3mm;
          }
          * { box-sizing: border-box; }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 8px 10px;
            width: 74mm;
            line-height: 1.35;
          }
          .ticket-header { text-align: center; margin-bottom: 8px; }
          .ticket-brand { font-size: 13px; font-weight: bold; }
          .ticket-divider { border: none; border-top: 1px dashed #000; margin: 6px 0; }
          .ticket-meta-row { display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 10px; }
          .ticket-items-table { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 10px; }
          .ticket-items-table th { border-bottom: 1px dashed #000; padding: 3px 0; text-align: left; }
          .ticket-items-table td { padding: 3px 0; vertical-align: top; }
          .ticket-totals-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .ticket-grand-total { display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; }
          .ticket-barcode-box { text-align: center; margin: 8px 0 4px 0; }
          .ticket-barcode-svg { width: 85%; height: 32px; margin: 0 auto; display: block; }
          .ticket-footer { text-align: center; font-size: 9px; margin-top: 6px; }
          .td-right { text-align: right; }
        </style>
      </head>
      <body>
        ${ticketEl.innerHTML}
        <script>
          window.onload = function() {
            window.focus();
            window.print();
          };
        <\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  } else {
    // Si los popups están bloqueados, ejecutar print directamente
    window.print();
  }
}

// Abrir y renderizar Matriz de Inventario Multi-Sucursal (C# .NET 10)
async function openInventoryMatrix() {
  modalMatrix.classList.add('open');
  await renderMatrixTable();
}

async function renderMatrixTable() {
  const tbody = document.getElementById('inventory-matrix-tbody');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-slate-400);">Consultando existencias de Sucursal 1 y Sucursal 2 desde C# .NET...</td></tr>';

  const matrix = await fetchInventarioMatrizFederada();

  tbody.innerHTML = matrix.map(row => {
    const totalRed = row.stockSucursal1 + row.stockSucursal2;
    return `
      <tr>
        <td class="td-mono" style="font-weight: 700; color: var(--primary-600);">${row.sku}</td>
        <td><strong>${row.productoNombre}</strong></td>
        <td class="td-mono td-right">$${row.precio.toFixed(2)}</td>
        <td class="td-right">
          <input 
            type="number" 
            class="field-input field-input-mono matrix-stock-input" 
            data-invid="${row.invIdSucursal1}" 
            value="${row.stockSucursal1}" 
            style="width: 75px; padding: 0.25rem 0.5rem; text-align: right;" 
          />
        </td>
        <td class="td-right">
          <input 
            type="number" 
            class="field-input field-input-mono matrix-stock-input" 
            data-invid="${row.invIdSucursal2}" 
            value="${row.stockSucursal2}" 
            style="width: 75px; padding: 0.25rem 0.5rem; text-align: right; border-color: var(--warning-500);" 
          />
        </td>
        <td class="td-mono td-right" style="font-weight: 700; color: var(--text-slate-900);">${totalRed} u.</td>
        <td style="text-align: center;">
          <button class="nav-tab btn-save-matrix-row" data-sku="${row.sku}" style="padding: 0.3rem 0.75rem; background: var(--primary-50); color: var(--primary-600); font-size: 0.8rem;">
            Guardar
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Guardar cambios de existencias por sucursal
  document.querySelectorAll('.btn-save-matrix-row').forEach(btn => {
    btn.addEventListener('click', async () => {
      const tr = btn.closest('tr');
      const inputs = tr.querySelectorAll('.matrix-stock-input');
      for (const input of inputs) {
        const invId = input.getAttribute('data-invid');
        const cantidad = parseInt(input.value, 10);
        if (invId) {
          await actualizarStockInventario(invId, cantidad);
        }
      }
      showToast('Existencias multi-sucursal actualizadas en SQL Server', 'success');
      await refreshPosTable();
    });
  });
}

// Abrir Modal de Analítica BI (Python FastAPI)
async function openAnalyticsModal() {
  modalAnalytics.classList.add('open');
  const grid = document.getElementById('analytics-grid');
  grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color: var(--text-slate-400);">Consultando motor predictivo en Python (Puerto 8001)...</div>';

  const data = await obtenerTendenciasAnalitica(state.currentBranch, 7);
  grid.innerHTML = data.predicciones.map(p => `
    <div style="background: var(--bg-slate-50); border: 1px solid var(--border-slate-200); border-radius: var(--radius-md); padding: 1rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
        <span class="td-mono" style="font-weight: 700; font-size: 0.75rem; color: var(--primary-600);">${p.sku}</span>
        <span class="origin-badge ${p.nivelAlerta === 'CRITICO' ? 'out' : (p.nivelAlerta === 'MODERADO' ? 'transfer' : 'local')}">
          ${p.nivelAlerta}
        </span>
      </div>
      <div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 0.75rem;">${p.nombre}</div>
      <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-slate-500); margin-bottom: 0.35rem;">
        <span>Demanda Est. (7d):</span>
        <strong class="td-mono" style="color: var(--text-slate-900); font-size: 0.95rem;">${p.demandaEstimada} u.</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-slate-500);">
        <span>Sugerencia Compra:</span>
        <strong class="td-mono" style="color: var(--success-700); font-size: 0.95rem;">${p.sugerenciaReabastecimiento} u.</strong>
      </div>
    </div>
  `).join('');
}
