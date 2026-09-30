#!/usr/bin/env bash
echo "================================================================"
echo "   🌾 GRAMSETU — DIGITAL GRAM PANCHAYAT REDRESSAL PORTAL"
echo "   Local System Launcher for macOS / Linux"
echo "================================================================"
echo ""

# 1. Check Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is NOT installed on your computer!"
    echo "Please download and install Node.js (v18+) from: https://nodejs.org"
    exit 1
fi

echo "[OK] Node.js is installed: $(node -v)"
echo ""

# 2. Check dependencies
if [ ! -d "node_modules" ]; then
    echo "[STEP 1/2] Installing project packages (npm install)..."
    echo "Please wait..."
    npm install
fi

echo ""
echo "[STEP 2/2] Starting GramSetu Local Server..."
echo "================================================================"
echo " 🌐 Gateway:        http://localhost:3000"
echo " 👤 Citizen Portal: http://localhost:3000/citizen/index.html"
echo " 🏛️ Admin Portal:   http://localhost:3000/admin/index.html"
echo "================================================================"
echo ""

# Try opening the browser
if which xdg-open > /dev/null 2>&1; then
    xdg-open http://localhost:3000 &
elif which open > /dev/null 2>&1; then
    open http://localhost:3000 &
fi

npm run dev
