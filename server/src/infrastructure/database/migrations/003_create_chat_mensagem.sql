-- ============================================================================
-- SCRIPT DE MIGRAÇÃO (003_create_chat_mensagem.sql) — BORA! APP
-- DBA Responsável: dba_especialista
-- Objetivo: Estrutura para mensagens do chat da partida com integridade referencial
-- ============================================================================

-- 1. Criação da tabela chat_mensagem
CREATE TABLE IF NOT EXISTS chat_mensagem (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partida_id UUID NOT NULL REFERENCES partida(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    mensagem TEXT NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Índices B-Tree para ordenação cronológica por partida e buscas por participante
CREATE INDEX IF NOT EXISTS idx_chat_partida_data ON chat_mensagem(partida_id, criado_em ASC);
CREATE INDEX IF NOT EXISTS idx_chat_usuario ON chat_mensagem(usuario_id);
