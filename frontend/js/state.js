import { CONFIG } from './config.js';

export const state = {
  user: JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER) || 'null'),
  token: localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN) || null,
  cart: JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.CART) || '[]'),
  currentBranch: 1,
  servicesStatus: {
    csharp: 'online',
    vbnet: 'online',
    java: 'online',
    php: 'online',
    python: 'online',
    node: 'online'
  },

  setUser(user, token) {
    this.user = user;
    this.token = token;
    if (user && token) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token);
    } else {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
      localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
    }
    window.dispatchEvent(new CustomEvent('auth:changed', { detail: { user } }));
  },

  addToCart(product, quantity = 1) {
    const existing = this.cart.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.cart.push({ ...product, quantity });
    }
    this.saveCart();
  },

  removeFromCart(productId) {
    this.cart = this.cart.filter(item => item.id !== productId);
    this.saveCart();
  },

  clearCart() {
    this.cart = [];
    this.saveCart();
  },

  saveCart() {
    localStorage.setItem(CONFIG.STORAGE_KEYS.CART, JSON.stringify(this.cart));
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart: this.cart } }));
  },

  getCartTotals() {
    const subtotal = this.cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
    const iva = subtotal * 0.16;
    const total = subtotal + iva;
    return { subtotal, iva, total };
  }
};
