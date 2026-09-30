import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { connectDB, getDBStatus } from './config/db.js';
import { isCloudinaryConfigured } from './config/cloudinary.js';

import authRoutes from './routes/authRoutes.js';
import citizenRoutes from './routes/citizenRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();

// Trust reverse proxy (Google Cloud Run / Nginx / Vite proxy) for correct IP handling & rate-limiting
app.set('trust proxy', 1);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled to allow images from Cloudinary & local assets
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    frameguard: false, // Allows the application to be embedded in AI Studio and Cloud Run previews
  })
);

// CORS configuration
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = getDBStatus();
  return res.json({
    status: 'UP',
    database: dbStatus.connected ? 'connected' : 'disconnected',
    databaseDetails: dbStatus,
    cloudinary: isCloudinaryConfigured() ? 'configured' : 'unconfigured',
    timestamp: new Date().toISOString(),
    location: {
      state: 'Maharashtra',
      district: 'Buldhana',
      gramPanchayat: 'XYZ Gram Panchayat',
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/citizen', citizenRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);

// Download project archive endpoints
app.get(['/api/download/project', '/api/download/zip'], (req, res) => {
  const zipFile = path.join(rootDir, 'public', 'gramsetu-panchayat-portal.zip');
  if (fs.existsSync(zipFile)) {
    return res.download(zipFile, 'gramsetu-panchayat-portal.zip');
  }
  return res.status(404).json({ success: false, error: 'ZIP archive file not found.' });
});

app.get('/api/download/tar', (req, res) => {
  const tarFile = path.join(rootDir, 'public', 'gramsetu-panchayat-portal.tar.gz');
  if (fs.existsSync(tarFile)) {
    return res.download(tarFile, 'gramsetu-panchayat-portal.tar.gz');
  }
  return res.status(404).json({ success: false, error: 'TAR archive file not found.' });
});

// Static file serving for citizen and admin frontends, public assets, plus uploads
app.use(express.static(path.join(rootDir, 'public')));
app.use('/citizen', express.static(path.join(rootDir, 'citizen')));
app.use('/admin', express.static(path.join(rootDir, 'admin')));
app.use('/uploads', express.static(path.join(rootDir, 'uploads')));

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// Connect to MongoDB
connectDB();

export default app;
