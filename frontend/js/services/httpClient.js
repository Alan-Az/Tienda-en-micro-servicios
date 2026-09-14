import { CONFIG } from '../config.js';
import { state } from '../state.js';

export async function apiFetch(url, options = {}) {
  const token = state.token;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const response = await fetch(url, { ...options, headers });
    return response;
  } catch (error) {
    console.warn(`[API Fetch Warning] Fallo de conexión directa con ${url}:`, error.message);
    throw error;
  }
}
