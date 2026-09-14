-- ============================================================================
-- SCRIPT DE MIGRAÇÃO (006_widen_raio_busca.sql) — BORA! APP
-- DBA Responsável: dba_especialista
-- Objetivo: Alargar a restrição de raio de busca do atleta para até 30 km
-- ============================================================================

DO $$
BEGIN
    -- Remover constraint antiga se existir
    ALTER TABLE usuario DROP CONSTRAINT IF EXISTS usuario_raio_busca_km_check;
    
    -- Adicionar constraint atualizada permitindo raio de 1 a 30 km
    ALTER TABLE usuario ADD CONSTRAINT usuario_raio_busca_km_check CHECK (raio_busca_km BETWEEN 1 AND 30);
END $$;
