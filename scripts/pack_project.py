#!/usr/bin/env python3
import os
import zipfile
import tarfile

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PUBLIC_DIR = os.path.join(ROOT_DIR, 'public')
os.makedirs(PUBLIC_DIR, exist_ok=True)

ZIP_PATH = os.path.join(PUBLIC_DIR, 'gramsetu-panchayat-portal.zip')
TAR_PATH = os.path.join(PUBLIC_DIR, 'gramsetu-panchayat-portal.tar.gz')

# Folders and files to include
INCLUDE_DIRS = ['backend', 'citizen', 'admin', 'src', 'uploads', 'scripts', 'data']
INCLUDE_FILES = [
    'index.html',
    'server.js',
    'server.ts',
    'package.json',
    'package-lock.json',
    'vite.config.ts',
    'tsconfig.json',
    'vercel.json',
    'netlify.toml',
    'README.md',
    '.env.example',
    '.gitignore',
    'metadata.json',
    'run-windows.bat',
    'run-mac-linux.sh'
]

EXCLUDE_PATTERNS = [
    'node_modules',
    '.git',
    'dist',
    '.cache',
    'gramsetu-panchayat-portal.zip',
    'gramsetu-panchayat-portal.tar.gz'
]

def should_skip(rel_path):
    for pat in EXCLUDE_PATTERNS:
        if pat in rel_path.split(os.sep):
            return True
    return False

# 1. Create ZIP
print(f"Creating ZIP archive at {ZIP_PATH}...")
with zipfile.ZipFile(ZIP_PATH, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for fname in INCLUDE_FILES:
        fpath = os.path.join(ROOT_DIR, fname)
        if os.path.exists(fpath):
            zipf.write(fpath, arcname=os.path.join('gramsetu-project', fname))

    for dname in INCLUDE_DIRS:
        dpath = os.path.join(ROOT_DIR, dname)
        if os.path.exists(dpath):
            for root, dirs, files in os.walk(dpath):
                # Don't descend into node_modules or excluded dirs
                dirs[:] = [d for d in dirs if not should_skip(d)]
                for f in files:
                    full_f = os.path.join(root, f)
                    rel_to_root = os.path.relpath(full_f, ROOT_DIR)
                    if not should_skip(rel_to_root):
                        zipf.write(full_f, arcname=os.path.join('gramsetu-project', rel_to_root))

    # Add quick README
    quick_start = """# GramSetu — Digital Gram Panchayat Redressal System

## 🚀 Option 1: 1-Click Launch (Easiest)
- **Windows:** Double-click `run-windows.bat`
- **Mac / Linux:** Run `chmod +x run-mac-linux.sh && ./run-mac-linux.sh`

This automatically installs packages (if not installed) and opens http://localhost:3000 in your browser!

---

## 💻 Option 2: Standard Terminal Run
1. Open Terminal / Command Prompt in this folder:
   ```bash
   cd gramsetu-project
   npm install
   npm start
   ```
   *(or `npm run dev` for development mode)*

2. Open in your browser:
   - **Main Website (Citizen Portal):** http://localhost:3000
   - **Citizen Direct:** http://localhost:3000/citizen/index.html
   - **Admin Portal:** http://localhost:3000/admin/index.html
   - **API Health:** http://localhost:3000/api/health

---

## 🌐 Option 3: Deploy to Vercel / Netlify / Render

### Full-Stack (Render / Railway / Cloud Run / VPS):
1. Build: `npm run build`
2. Start: `npm start` (runs `node server.js` on port `$PORT`)
3. Add your `MONGODB_URI` environment variable if using MongoDB Atlas.

### Static Frontend (Vercel / Netlify):
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- Pre-configured `vercel.json` and `netlify.toml` are included!
- To connect to your external backend, set `window.GRAMSETU_API_URL = "https://your-api.com"` or use the proxy in `vercel.json`.

---

## 🔑 Key Credentials & Configuration:
- **Master Admin Passcode:** GramSetu@2026
- **Database:** Works out-of-the-box with persistent built-in engine. To connect your cloud MongoDB Atlas, copy `.env.example` to `.env` and fill in `MONGODB_URI`.
"""
    zipf.writestr('gramsetu-project/HOW_TO_RUN.md', quick_start)

zip_size = os.path.getsize(ZIP_PATH) / (1024 * 1024)
print(f"ZIP created successfully: {zip_size:.2f} MB")

# 2. Create TAR.GZ
print(f"Creating TAR.GZ archive at {TAR_PATH}...")
with tarfile.open(TAR_PATH, 'w:gz') as tarf:
    for fname in INCLUDE_FILES:
        fpath = os.path.join(ROOT_DIR, fname)
        if os.path.exists(fpath):
            tarf.add(fpath, arcname=os.path.join('gramsetu-project', fname))

    for dname in INCLUDE_DIRS:
        dpath = os.path.join(ROOT_DIR, dname)
        if os.path.exists(dpath):
            tarf.add(dpath, arcname=os.path.join('gramsetu-project', dname), filter=lambda tarinfo: None if should_skip(tarinfo.name) else tarinfo)

tar_size = os.path.getsize(TAR_PATH) / (1024 * 1024)
print(f"TAR.GZ created successfully: {tar_size:.2f} MB")
