import express from 'express';
import cors from 'cors';
import notificacionesRouter from './routes/notificaciones.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' })); // Permitir XML payloads en base64 o strings grandes

// Rutas
app.use('/api/notificaciones', notificacionesRouter);

app.get('/health', (req, res) => {
  res.json({
    servicio: 'Microservicio de Notificaciones ERP Retail',
    estado: 'online',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Microservicio de Notificaciones Node.js en escucha sobre el puerto ${PORT}`);
});
