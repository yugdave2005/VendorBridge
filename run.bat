@echo off
title VendorBridge ERP
color 0A

echo ===================================================
echo        VendorBridge ERP - Startup Script
echo ===================================================
echo.

:: Check if node_modules exists, if not run npm install
IF NOT EXIST "node_modules\" (
    echo [1/4] Installing dependencies...
    call npm install
) ELSE (
    echo [1/4] Dependencies already installed. Skipping npm install...
)

echo.
echo [2/4] Generating Prisma Client...
call npx prisma generate

echo.
echo [3/4] Syncing Database Schema...
call npx prisma db push

echo.
echo [4/4] Starting Development Server...
echo The application will be available at http://localhost:3000
echo.

:: Open the browser automatically
start http://localhost:3000

:: Start the Next.js server
call npm run dev

pause
