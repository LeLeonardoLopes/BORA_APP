-- ============================================================================
-- SCRIPT DE MIGRAÇÃO (002_add_spatial_and_duration.sql) — BORA! APP
-- DBA Responsável: dba_especialista
-- Objetivo: Suporte a cálculo geoespacial de alta performance (PostGIS GiST)
--           e controle de duração estimada da partida.
-- ============================================================================

-- 1. Garantir que a extensão PostGIS esteja habilitada
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Adicionar coluna duracao_minutos com valor padrão de 90 minutos
ALTER TABLE partida 
ADD COLUMN IF NOT EXISTS duracao_minutos INTEGER NOT NULL DEFAULT 90;

-- 3. Adicionar coluna geoespacial localizacao (Point SRID 4326)
ALTER TABLE partida 
ADD COLUMN IF NOT EXISTS localizacao GEOMETRY(Point, 4326);

-- 4. Atualizar localizacao para registros pré-existentes a partir de lng e lat
UPDATE partida 
SET localizacao = ST_SetSRID(ST_MakePoint(lng, lat), 4326) 
WHERE localizacao IS NULL AND lng IS NOT NULL AND lat IS NOT NULL;

-- 5. Criar índice espacial GiST para consultas ST_DWithin de alta performance (< 800ms)
CREATE INDEX IF NOT EXISTS idx_partida_localizacao_gist ON partida USING GIST(localizacao);
