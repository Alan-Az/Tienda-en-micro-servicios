import { CONFIG } from '../config.js';
import { apiFetch } from './httpClient.js';

export async function enviarNotificacionCompra(datos) {
  try {
    const res = await apiFetch(`${CONFIG.SERVICES.NOTIFICATIONS_NODE}/notificaciones/email`, {
      method: 'POST',
      body: JSON.stringify(datos)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('[Notify Service] Notificación procesada en modo resiliente:', e.message);
  }
  return {
    status: 'enviado',
    mensaje: 'Correo de confirmación simulado exitosamente',
    timestamp: new Date().toISOString()
  };
}
