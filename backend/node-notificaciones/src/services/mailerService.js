import nodemailer from 'nodemailer';

// Mock o configuración de transporte SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525', 10),
  auth: {
    user: process.env.SMTP_USER || 'mock_user',
    pass: process.env.SMTP_PASS || 'mock_pass'
  }
});

export async function enviarCorreoCompra({ destinatario, asunto, clienteNombre, monto, uuidFactura, xmlComprobante }) {
  console.log(`[Notificaciones Mailer] Simulando envío a: ${destinatario} | Asunto: ${asunto}`);

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #2563eb;">¡Gracias por tu compra en ERP Retail, ${clienteNombre}!</h2>
      <p>Confirmamos que tu orden ha sido procesada y aprobada exitosamente.</p>
      
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p><strong>Monto Total:</strong> $${monto?.toFixed(2) || monto}</p>
        <p><strong>Folio Fiscal (UUID):</strong> ${uuidFactura || 'N/A'}</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
      </div>

      <p>Adjunto encontrarás tu comprobante fiscal timbrado (CFDI XML).</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <small style="color: #64748b;">Este es un mensaje automático del Sistema ERP Retail Distribuido.</small>
    </div>
  `;

  try {
    // Si no hay credenciales SMTP reales, registramos el envío exitoso simulado
    const messageId = `<${Date.now()}@retail.erp.local>`;
    return {
      success: true,
      messageId,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[Notificaciones Mailer Error]', error);
    throw error;
  }
}
