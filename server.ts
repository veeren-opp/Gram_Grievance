import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Load environment configuration
dotenv.config();

// Import the GramSetu backend application
import backendApp from './backend/server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const distExists = fs.existsSync(path.resolve(__dirname, 'dist', 'index.html'));
const isProd = process.env.NODE_ENV === 'production' || (!process.env.npm_lifecycle_event && distExists);

async function bootstrap() {
  const app = express();

  // Root redirect: Direct visitors immediately to the official GramSetu Citizen Portal
  app.get('/', (req, res) => {
    return res.redirect('/citizen/index.html');
  });

  // 1. Mount the backend Express application (handles /api/*, /citizen/*, /admin/*, uploads)
  app.use(backendApp);

  // 2. Setup Vite or Static Frontend serving for Developer Overview / System Status
  const distPath = path.resolve(__dirname, 'dist');

  if (isProd && fs.existsSync(distPath)) {
    app.use('/assets', express.static(path.resolve(distPath, 'assets')));
    app.use(express.static(distPath));

    // Developer / Status routes
    app.get(['/developer', '/status', '/system-status'], (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // In dev mode, use Vite middleware with HMR disabled to prevent WebSocket errors in iframe
    try {
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          host: '0.0.0.0',
          port: PORT,
          hmr: false,
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn('Vite middleware could not be started; falling back to direct static serving:', err);
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
      }
    }
  }

  // Fallback for non-API, non-citizen, non-admin routes
  app.get('*', (req, res, next) => {
    if (
      req.originalUrl.startsWith('/api') ||
      req.originalUrl.startsWith('/citizen') ||
      req.originalUrl.startsWith('/admin') ||
      req.originalUrl.startsWith('/uploads')
    ) {
      return next();
    }
    // Redirect unknown paths back to the Citizen Portal
    return res.redirect('/citizen/index.html');
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`  🌾 GRAMSETU — DIGITAL GRAM PANCHAYAT GRIEVANCE PORTAL`);
    console.log(`  Jurisdiction: XYZ Gram Panchayat, Buldhana, MH`);
    console.log(`=======================================================`);
    console.log(`  🌐 Server running at: http://localhost:${PORT}`);
    console.log(`  👤 Citizen Portal:    http://localhost:${PORT}/citizen/index.html`);
    console.log(`  🏛️ Admin Portal:      http://localhost:${PORT}/admin/index.html`);
    console.log(`  🩺 System Health:     http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start GramSetu server:', err);
  process.exit(1);
});
