export async function enviarSms({ telefono, mensaje }) {
  console.log(`[Notificaciones SMS] Simulando SMS a: ${telefono} | Texto: "${mensaje}"`);
  return {
    success: true,
    telefono,
    timestamp: new Date().toISOString()
  };
}
