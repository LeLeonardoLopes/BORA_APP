@echo off
chcp 65001 >nul
title Bora! App - Visualizador do Banco de Dados (PostgreSQL / PostGIS)
color 0A
echo ======================================================================
echo              BORA! APP - BANCO DE DADOS POSTGRESQL / POSTGIS
echo ======================================================================
echo.
echo Conectando ao container 'bora_app_postgres' no banco 'bora_app_db'...
echo.
echo DICAS PARA A APRESENTACAO:
echo   - Digite \dt                          (para listar todas as tabelas)
echo   - Digite \d partida                   (para ver colunas da tabela partida)
echo   - Digite SELECT * FROM usuario;       (para listar usuarios)
echo   - Digite SELECT * FROM partida;       (para listar partidas)
echo   - Digite \q                           (para sair)
echo ======================================================================
echo.

docker exec -it bora_app_postgres psql -U postgres -d bora_app_db

pause
