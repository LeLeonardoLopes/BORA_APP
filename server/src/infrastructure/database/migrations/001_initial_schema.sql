-- ============================================================================
-- SCRIPT DE MIGRAÇÃO INICIAL (001_initial_schema.sql) — BORA! APP
-- DBA Responsável: dba_especialista
-- Padrão: snake_case estrito, UUID v4 e PostGIS (SRID 4326)
-- ============================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Criação dos tipos enumerados (ENUMs)
CREATE TYPE tipo_status_usuario AS ENUM (
    'Pendente_Validacao', 
    'Ativo', 
    'Suspenso', 
    'Banido'
);

CREATE TYPE tipo_status_partida AS ENUM (
    'Rascunho', 
    'Publicada', 
    'Lotada', 
    'Em_Andamento', 
    'Finalizada', 
    'Cancelada'
);

CREATE TYPE tipo_status_solicitacao AS ENUM (
    'Pendente', 
    'Em_Analise', 
    'Aprovada', 
    'Rejeitada', 
    'Cancelada'
);

-- 3. Tabela de Usuários (1º CRUD)
CREATE TABLE usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    foto_url VARCHAR(500),
    genero VARCHAR(50) NOT NULL,
    data_nascimento DATE NOT NULL,
    raio_busca_km INTEGER DEFAULT 5 NOT NULL CHECK (raio_busca_km BETWEEN 1 AND 5),
    modalidades_favoritas VARCHAR(255),
    nota_media DECIMAL(3,2) DEFAULT 5.00 NOT NULL,
    total_avaliacoes INTEGER DEFAULT 0 NOT NULL,
    status_usuario tipo_status_usuario DEFAULT 'Pendente_Validacao' NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_usuario_email ON usuario(email);
CREATE INDEX idx_usuario_status ON usuario(status_usuario);

-- 4. Tabela de Partidas (2º CRUD)
CREATE TABLE partida (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizador_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    esporte VARCHAR(80) NOT NULL,
    descricao TEXT,
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    max_vagas INTEGER NOT NULL CHECK (max_vagas > 1),
    vagas_preenchidas INTEGER DEFAULT 0 NOT NULL CHECK (vagas_preenchidas <= max_vagas),
    filtro_genero VARCHAR(50),
    filtro_nivel VARCHAR(50),
    endereco_completo VARCHAR(300) NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) DEFAULT 'Franca' NOT NULL,
    lat DECIMAL(10,7) NOT NULL,
    lng DECIMAL(10,7) NOT NULL,
    status_partida tipo_status_partida DEFAULT 'Publicada' NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_partida_status_data ON partida(status_partida, data_hora);
CREATE INDEX idx_partida_organizador ON partida(organizador_id);

-- 5. Tabela de Solicitações de Vagas (3º CRUD)
CREATE TABLE solicitacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partida_id UUID NOT NULL REFERENCES partida(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    status_solicitacao tipo_status_solicitacao DEFAULT 'Pendente' NOT NULL,
    data_requisicao TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    data_decisao TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_usuario_partida UNIQUE (partida_id, usuario_id)
);

CREATE INDEX idx_solicitacao_partida_status ON solicitacao(partida_id, status_solicitacao);
CREATE INDEX idx_solicitacao_usuario ON solicitacao(usuario_id);

-- 6. Tabela de Avaliações
CREATE TABLE avaliacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partida_id UUID NOT NULL REFERENCES partida(id) ON DELETE CASCADE,
    avaliador_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    avaliado_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    nota INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
    comentario TEXT,
    data_avaliacao TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_avaliacao_partida_par UNIQUE (partida_id, avaliador_id, avaliado_id)
);

CREATE INDEX idx_avaliacao_avaliado ON avaliacao(avaliado_id);
