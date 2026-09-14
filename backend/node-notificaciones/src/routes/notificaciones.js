import { Router } from 'express';
import { notificarEmail, notificarSms } from '../controllers/notificacionController.js';

const router = Router();

router.post('/email', notificarEmail);
router.post('/sms', notificarSms);

export default router;
