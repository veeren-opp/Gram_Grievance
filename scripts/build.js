#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

console.log('🏗️  Starting GramSetu Production Build...');

// 1. Run Vite build
try {
  console.log('📦 Running Vite build for core bundle...');
  execSync('npx vite build', { cwd: rootDir, stdio: 'inherit' });
} catch (err) {
  console.error('❌ Vite build failed:', err.message);
  process.exit(1);
}

// 2. Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Helper to copy directory recursively
function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 3. Copy citizen and admin portals into dist
console.log('📁 Copying Citizen Portal to dist/citizen...');
copyDirSync(path.join(rootDir, 'citizen'), path.join(distDir, 'citizen'));

console.log('📁 Copying Admin Portal to dist/admin...');
copyDirSync(path.join(rootDir, 'admin'), path.join(distDir, 'admin'));

// 4. Copy uploads directory if present
if (fs.existsSync(path.join(rootDir, 'uploads'))) {
  console.log('📁 Copying uploads to dist/uploads...');
  copyDirSync(path.join(rootDir, 'uploads'), path.join(distDir, 'uploads'));
}

// 5. Ensure root dist/index.html redirects to /citizen/index.html with fallback
const distIndex = path.join(distDir, 'index.html');
const indexHtmlContent = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GramSetu — Digital Gram Panchayat Grievance Portal</title>
    <meta name="description" content="Official digital grievance redressal portal for citizens and administration of XYZ Gram Panchayat, Buldhana, Maharashtra." />
    <meta property="og:title" content="GramSetu — Digital Gram Panchayat Grievance Portal" />
    <meta property="og:description" content="Official digital grievance redressal portal for citizens and administration of XYZ Gram Panchayat, Buldhana, Maharashtra." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta http-equiv="refresh" content="0; url=/citizen/index.html" />
    <script>
      if (window.location.protocol === 'file:') {
        window.location.replace('./citizen/index.html');
      } else {
        window.location.replace('/citizen/index.html');
      }
    </script>
    <style>
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background: #f8fafc;
        color: #0f172a;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
      }
      .card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 32px 24px;
        max-width: 440px;
        text-align: center;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
      }
      .btn {
        display: inline-block;
        background: #047857;
        color: white;
        font-weight: 600;
        padding: 12px 24px;
        border-radius: 8px;
        text-decoration: none;
        margin-top: 16px;
      }
      .btn:hover { background: #065f46; }
    </style>
  </head>
  <body>
    <div class="card">
      <div style="font-size: 2.5rem; margin-bottom: 8px;">🌾</div>
      <h1 style="font-size: 1.5rem; margin: 0 0 8px 0; color: #047857;">GramSetu</h1>
      <p style="font-size: 0.95rem; color: #64748b; margin: 0 0 16px 0;">
        Digital Gram Panchayat Grievance Redressal Portal<br>
        XYZ Gram Panchayat, Buldhana, Maharashtra
      </p>
      <p style="font-size: 0.85rem; color: #94a3b8;">Redirecting to the Citizen Portal...</p>
      <a href="/citizen/index.html" class="btn" id="directLink">Open Citizen Portal</a>
    </div>
    <script>
      if (window.location.protocol === 'file:') {
        document.getElementById('directLink').href = './citizen/index.html';
      }
    </script>
  </body>
</html>
`;

fs.writeFileSync(distIndex, indexHtmlContent, 'utf-8');
console.log('✅ Generated root dist/index.html with instantaneous redirect.');

console.log('✨ Production build complete! dist/ is ready for deployment to any host.');
