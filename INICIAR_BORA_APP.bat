@echo off
chcp 65001 >nul
title Bora! App - Inicializador Completo
color 0B
echo ======================================================================
echo                     INICIANDO BORA! APP (1-CLIQUE)
echo ======================================================================
echo.

cd /d "C:\Users\renat\.gemini\antigravity\scratch\BORA_APP"

echo [1/3] Subindo container Docker do Banco de Dados PostGIS...
docker compose up -d

echo.
echo [2/3] Abrindo servidor Backend (Porta 3333)...
start "Bora App - Backend (API :3333)" cmd /k "cd /d C:\Users\renat\.gemini\antigravity\scratch\BORA_APP\server && npm run dev"

echo.
echo [3/3] Abrindo interface Frontend (Porta 5173)...
start "Bora App - Frontend (React :5173)" cmd /k "cd /d C:\Users\renat\.gemini\antigravity\scratch\BORA_APP\client && npm run dev"

echo.
echo ======================================================================
echo   Aguardando inicializacao e abrindo no navegador...
echo ======================================================================
timeout /t 4 >nul
start http://localhost:5173

exit
