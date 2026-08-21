-- ============================================================================
-- SCRIPT DE MIGRAÇÃO (005_add_cpf_and_otp.sql) — BORA! APP
-- DBA Responsável: dba_especialista
-- Objetivo: Suporte a CPF único do atleta e tabela de verificação OTP de e-mail
-- ============================================================================

-- 1. Adicionar coluna CPF na tabela de usuário com unicidade
ALTER TABLE usuario 
ADD COLUMN IF NOT EXISTS cpf VARCHAR(14) UNIQUE;

-- Índice para busca rápida de CPF ativo
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuario_cpf_ativo 
ON usuario(cpf) 
WHERE deletado_em IS NULL AND cpf IS NOT NULL;

-- 2. Tabela imutável/temporária para códigos OTP de verificação de e-mail
CREATE TABLE IF NOT EXISTS codigo_verificacao_email (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    codigo VARCHAR(6) NOT NULL,
    expira_em TIMESTAMP WITH TIME ZONE NOT NULL,
    utilizado BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_codigo_verificacao_email_busca 
ON codigo_verificacao_email(email, codigo, expira_em) 
WHERE utilizado = FALSE;
