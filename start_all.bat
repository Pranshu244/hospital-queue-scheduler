@echo off
title Hospital Queue Scheduler - Launcher
cd /d "%~dp0"

echo ========================================================
echo   Hospital Queue Scheduler - Starting All Services
echo ========================================================
echo.

echo [1/2] Starting Backend Server (FastAPI on Port 8000)...
start "Hospital Scheduler - Backend" cmd /k "cd /d "%~dp0Backend" & uvicorn main:app --reload"

echo [2/2] Starting Frontend Server (Vite on Port 5173)...
start "Hospital Scheduler - Frontend" cmd /k "cd /d "%~dp0frontend" & npm run dev"

echo.
echo [INFO] Both servers launched!
echo [INFO] Waiting 3 seconds, then opening browser...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo Application running at: http://localhost:5173
echo.
