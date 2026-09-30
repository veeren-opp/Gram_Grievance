import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const archiver = require('archiver');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const zipPath = path.join(publicDir, 'gramsetu-panchayat-portal.zip');
const output = fs.createWriteStream(zipPath);
const archive = archiver('zip', {
  zlib: { level: 9 }, // Best compression
});

output.on('close', () => {
  const sizeMb = (archive.pointer() / (1024 * 1024)).toFixed(2);
  console.log(`Successfully created ZIP archive: ${zipPath} (${sizeMb} MB)`);
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

// Files and folders to include
const foldersToInclude = ['backend', 'citizen', 'admin', 'src'];
const filesToInclude = [
  'index.html',
  'package.json',
  'server.ts',
  'vite.config.ts',
  'tsconfig.json',
  'README.md',
  '.env.example',
  '.gitignore',
  'metadata.json',
];

foldersToInclude.forEach((folder) => {
  const fullPath = path.join(rootDir, folder);
  if (fs.existsSync(fullPath)) {
    archive.directory(fullPath, `gramsetu/${folder}`);
  }
});

filesToInclude.forEach((file) => {
  const fullPath = path.join(rootDir, file);
  if (fs.existsSync(fullPath)) {
    archive.file(fullPath, { name: `gramsetu/${file}` });
  }
});

// Add a quick setup instructions file inside the zip
const setupGuide = `# GramSetu — Digital Gram Panchayat Grievance Redressal Portal
## Quick Start Guide

### Requirements
- Node.js 18 or higher (https://nodejs.org)
- npm or bun

### Setup Steps
1. Unzip this folder:
   \`unzip gramsetu-panchayat-portal.zip\`
2. Navigate into the folder:
   \`cd gramsetu\`
3. Install dependencies:
   \`npm install\`
4. Run the project:
   \`npm run dev\`
5. Open your browser:
   - Gateway / Landing: http://localhost:3000
   - Citizen Portal: http://localhost:3000/citizen/index.html
   - Panchayat Admin Portal: http://localhost:3000/admin/index.html
   - Register Officer: http://localhost:3000/admin/register.html

### Default Credentials
- **Master Admin Security Key:** GramSetu@2026
- **Pre-seeded Demo Resident:** Mobile: 9876543210 | Password: password123
`;

archive.append(setupGuide, { name: 'gramsetu/HOW_TO_RUN.md' });

archive.finalize();
