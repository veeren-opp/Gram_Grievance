@echo off
title GramSetu - Digital Gram Panchayat Redressal System
color 0A
echo ================================================================
echo    🌾 GRAMSETU — DIGITAL GRAM PANCHAYAT REDRESSAL PORTAL
echo    1-Click Local System Launcher for Windows
echo ================================================================
echo.

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js was NOT found on your computer!
    echo.
    echo Node.js is required to run the local server.
    echo 1. Download and install Node.js from: https://nodejs.org
    echo 2. Once installed, double-click this run-windows.bat file again.
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js is installed:
node -v
echo.

:: 2. Check if dependencies are installed in node_modules
if not exist "node_modules\" (
    echo [STEP 1/2] Installing project packages (npm install)...
    echo This is required on first run and takes about 1-2 minutes. Please wait...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo.
        echo [ERROR] npm install encountered an error.
        echo Please ensure you are connected to the internet and try running 'npm install' manually.
        pause
        exit /b 1
    )
    echo.
    echo [OK] All dependencies installed successfully!
) else (
    echo [OK] Project dependencies already installed in node_modules.
)

echo.
echo [STEP 2/2] Launching GramSetu Server...
echo.
echo ================================================================
echo  🌐 Gateway:        http://localhost:3000
echo  👤 Citizen Portal: http://localhost:3000/citizen/index.html
echo  🏛️ Admin Portal:   http://localhost:3000/admin/index.html
echo ================================================================
echo.
echo Opening your browser now...
timeout /t 2 >nul
start "" http://localhost:3000

call npm run dev
pause
