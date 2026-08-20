# 02 — Modelagem de Banco de Dados e Scripts DDL — Bora! App

## 1. Diagrama Entidade-Relacionamento e Convenções

* **Padrão de Nomenclatura:** `snake_case` estrito para todas as tabelas e colunas (conforme especificação da documentação oficial).
* **Identificadores (Chaves Primárias):** UUID v4 para segurança contra enumeração.
* **Geolocalização:** Ponto espacial com SRID 4326 (WGS 84 - Coordenadas GPS mundiais).

---

## 2. Script DDL Completo — PostgreSQL 16 + PostGIS (Recomendado)

```sql
-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

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

-- 4. Tabela de Partidas (2º CRUD - com PostGIS)
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
    geom GEOGRAPHY(Point, 4326) NOT NULL,
    status_partida tipo_status_partida DEFAULT 'Publicada' NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índice Espacial GIST para consultas ultra-rápidas (< 800ms)
CREATE INDEX idx_partida_geom ON partida USING GIST(geom);
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
```

---

## 3. Consultas Críticas de Exemplo

### 3.1. Consulta Geoespacial de Partidas no Raio de Busca (UC02 - ST_DWithin)
```sql
SELECT 
    p.id,
    p.esporte,
    p.descricao,
    p.data_hora,
    p.max_vagas,
    p.vagas_preenchidas,
    p.filtro_genero,
    p.filtro_nivel,
    p.bairro,
    p.cidade,
    -- Converte a distância calculada em metros para o usuário
    ST_Distance(p.geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distancia_metros,
    u.id AS organizador_id,
    u.nome AS organizador_nome,
    u.nota_media AS organizador_nota
FROM partida p
INNER JOIN usuario u ON p.organizador_id = u.id
WHERE p.status_partida = 'Publicada'
  AND p.data_hora > NOW()
  AND ST_DWithin(p.geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
ORDER BY distancia_metros ASC;
```

### 3.2. Verificação de Conflito de Horário (RN01)
```sql
SELECT COUNT(*) 
FROM solicitacao s
INNER JOIN partida p ON s.partida_id = p.id
WHERE s.usuario_id = $1
  AND s.status_solicitacao = 'Aprovada'
  AND p.status_partida IN ('Publicada', 'Lotada', 'Em_Andamento')
  AND p.data_hora BETWEEN ($2::timestamp - INTERVAL '2 hours') AND ($2::timestamp + INTERVAL '2 hours');
```
