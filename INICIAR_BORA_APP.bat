@echo off
chcp 65001 >nul
title Bora! App - Inicializador
color 0B
cd /d "%~dp0"

echo ======================================================================
echo                     INICIANDO BORA! APP
echo ======================================================================
echo.

echo [1/5] Verificando o Docker Desktop...
docker info >nul 2>&1
if errorlevel 1 (
  echo.
  echo ERRO: o Docker esta instalado, mas o mecanismo ainda nao esta respondendo.
  echo       Abra o Docker Desktop, espere o icone da baleia parar de animar
  echo       ^(sem a palavra "Starting"^) e execute este arquivo de novo.
  echo       Se continuar, rode "docker info" no CMD para ver a mensagem real.
  pause
  exit /b 1
)

echo [1/5] Subindo o banco de dados PostgreSQL + PostGIS...
docker compose up -d
if errorlevel 1 (
  echo.
  echo ERRO: o "docker compose up" falhou. A mensagem do Docker esta acima.
  echo       Causas comuns: porta 5432 ocupada por outro PostgreSQL, ou falta de internet
  echo       para baixar a imagem postgis/postgis na primeira vez.
  pause
  exit /b 1
)

echo.
echo [2/5] Aguardando o banco ficar pronto...
set TENTATIVAS=0
:ESPERAR_BANCO
docker exec bora_app_postgres pg_isready -U postgres >nul 2>&1
if not errorlevel 1 goto BANCO_PRONTO
set /a TENTATIVAS+=1
if %TENTATIVAS% GEQ 30 (
  echo ERRO: o banco nao respondeu apos 60 segundos. Veja: docker logs bora_app_postgres
  pause
  exit /b 1
)
timeout /t 2 >nul
goto ESPERAR_BANCO
:BANCO_PRONTO

echo.
echo [3/5] Preparando dependencias (somente na primeira vez)...
if not exist "server\.env" copy "server\.env.example" "server\.env" >nul
if not exist "server\node_modules" (
  pushd server
  call npm install
  popd
)
if not exist "client\node_modules" (
  pushd client
  call npm install
  popd
)

echo.
echo [4/5] Criando tabelas e dados de exemplo...
pushd server
call npm run db:setup
popd

echo.
echo [5/5] Abrindo API (porta 3333) e interface (porta 5173)...
start "Bora App - API :3333" cmd /k "cd /d "%~dp0server" && npm run dev"
start "Bora App - Interface :5173" cmd /k "cd /d "%~dp0client" && npm run dev"

timeout /t 6 >nul
start http://localhost:5173

echo.
echo Pronto. Para parar, feche as duas janelas do Bora App.
echo Para testar o sistema inteiro: abra a pasta server e execute: npm run smoke
echo.
pause
