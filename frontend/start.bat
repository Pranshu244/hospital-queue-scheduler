@echo off
title Hospital Queue Scheduler - Frontend
cd /d "%~dp0"

echo ========================================================
echo   Hospital Queue Scheduler - Frontend Server
echo ========================================================
echo.

if not exist "node_modules\" (
    echo [INFO] node_modules not found. Installing packages...
    call npm install
)

echo.
echo [INFO] Starting Vite development server...
echo [INFO] URL: http://localhost:5173
echo.

REM Automatically open the browser after a 2-second delay in background
start "" /b cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:5173"

REM Start the Vite development server
call npm run dev

pause
