import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment configuration
dotenv.config();

// Import the GramSetu backend application
import backendApp from './backend/server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

const app = express();

// 1. Root redirect: Direct visitors immediately to the official GramSetu Citizen Portal
app.get(['/', '/index.html'], (req, res) => {
  return res.redirect('/citizen/index.html');
});

// 2. Mount backend Express application (handles /api/*, /citizen/*, /admin/*, /uploads/*)
app.use(backendApp);

// 3. Serve static dist files if built
const distPath = path.resolve(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// 4. Catch-all fallback: redirect non-API routes to the Citizen Portal
app.get('*', (req, res, next) => {
  if (
    req.originalUrl.startsWith('/api') ||
    req.originalUrl.startsWith('/citizen') ||
    req.originalUrl.startsWith('/admin') ||
    req.originalUrl.startsWith('/uploads')
  ) {
    return next();
  }
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

export default app;
