@echo off
title BioScribe MERN Launcher
echo ========================================================
echo   BioScribe: MERN Stack Electronic Laboratory Notebook
echo ========================================================
echo.

:: 1. Ensure MongoDB service is running
echo [1/3] Checking MongoDB Service...
sc query MongoDB | find "RUNNING" >nul
if %ERRORLEVEL% NEQ 0 (
    echo Starting MongoDB service...
    net start MongoDB
) else (
    echo MongoDB is running.
)

:: 2. Start Backend Server
echo [2/3] Starting Backend Server on http://localhost:5001 ...
start "BioScribe Server (Node/Express - Port 5001)" cmd /k "cd /d C:\Users\KAMALESH\Desktop\fsd\server && npm run dev"

:: 3. Start Frontend Client
echo [3/3] Starting Frontend Client on http://localhost:5173 ...
start "BioScribe Client (React/Vite - Port 5173)" cmd /k "cd /d C:\Users\KAMALESH\Desktop\fsd\client && npm run dev"

echo.
echo All services launched!
echo Opening browser in 3 seconds...
timeout /t 3 >nul
start http://localhost:5173
