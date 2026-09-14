import { enviarCorreoCompra } from '../services/mailerService.js';
import { enviarSms } from '../services/smsService.js';

export async function notificarEmail(req, res) {
  try {
    const { destinatario, asunto, clienteNombre, monto, uuidFactura, xmlComprobante } = req.body;

    if (!destinatario) {
      return res.status(400).json({ error: 'El campo destinatario es obligatorio' });
    }

    const resultado = await enviarCorreoCompra({
      destinatario,
      asunto: asunto || 'Confirmación de Compra ERP Retail',
      clienteNombre: clienteNombre || 'Cliente Estimado',
      monto,
      uuidFactura,
      xmlComprobante
    });

    return res.status(200).json({
      status: 'enviado',
      mensaje: 'Notificación por correo electrónico procesada exitosamente',
      ...resultado
    });
  } catch (error) {
    return res.status(500).json({ error: 'Fallo al procesar la notificación por correo' });
  }
}

export async function notificarSms(req, res) {
  try {
    const { telefono, mensaje } = req.body;

    if (!telefono || !mensaje) {
      return res.status(400).json({ error: 'telefono y mensaje son obligatorios' });
    }

    const resultado = await enviarSms({ telefono, mensaje });

    return res.status(200).json({
      status: 'sms_enviado',
      mensaje: 'SMS enviado satisfactoriamente',
      ...resultado
    });
  } catch (error) {
    return res.status(500).json({ error: 'Fallo al procesar notificación SMS' });
  }
}
