# 02 — Modelagem de Banco de Dados e Scripts DDL — Bora! App

## 1. Diagrama Entidade-Relacionamento e Convenções

* **Padrão de Nomenclatura:** `snake_case` estrito para todas as tabelas e colunas.
* **Identificadores (Chaves Primárias):** UUID v4 para segurança contra enumeração.
* **Geolocalização:** Ponto espacial PostGIS com SRID 4326 (WGS 84 - Coordenadas GPS mundiais).
* **Soft Delete:** Colunas `deletado_em` e `deletado_por_id` em todas as tabelas transacionais.

---

## 2. Script DDL Completo — PostgreSQL 16 + PostGIS (v8.1 Consolidada)

```sql
-- 1. Extensões e Tipos Enumerados
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TYPE tipo_status_usuario AS ENUM ('Pendente_Validacao', 'Ativo', 'Suspenso', 'Banido');
CREATE TYPE tipo_status_partida AS ENUM ('Rascunho', 'Publicada', 'Lotada', 'Em_Andamento', 'Finalizada', 'Cancelada');
CREATE TYPE tipo_status_solicitacao AS ENUM ('Pendente', 'Em_Analise', 'Aprovada', 'Rejeitada', 'Cancelada');

-- 2. Tabela de Usuários (Trava Dupla CPF + E-mail e Soft Delete)
CREATE TABLE usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    cpf VARCHAR(14) UNIQUE NULL,
    senha_hash VARCHAR(255) NOT NULL,
    foto_url TEXT NULL,
    genero VARCHAR(50) NOT NULL,
    data_nascimento DATE NOT NULL,
    raio_busca_km INTEGER DEFAULT 5 NOT NULL CHECK (raio_busca_km BETWEEN 1 AND 30),
    modalidades_favoritas VARCHAR(255),
    nota_media DECIMAL(3,2) DEFAULT 5.00 NOT NULL,
    total_avaliacoes INTEGER DEFAULT 0 NOT NULL,
    status_usuario tipo_status_usuario DEFAULT 'Pendente_Validacao' NOT NULL,
    time_nome VARCHAR(100) NULL,
    time_escudo_url TEXT NULL,
    time_bairro VARCHAR(100) NULL,
    time_modalidade VARCHAR(80) NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deletado_em TIMESTAMP WITH TIME ZONE NULL,
    deletado_por_id UUID NULL REFERENCES usuario(id)
);

CREATE INDEX idx_usuario_email_ativo ON usuario(email) WHERE deletado_em IS NULL;
CREATE INDEX idx_usuario_cpf_ativo ON usuario(cpf) WHERE deletado_em IS NULL AND cpf IS NOT NULL;
CREATE INDEX idx_usuario_status ON usuario(status_usuario);

-- 3. Tabela de Códigos OTP de Verificação de E-mail
CREATE TABLE codigo_verificacao_email (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    codigo VARCHAR(6) NOT NULL,
    expira_em TIMESTAMP WITH TIME ZONE NOT NULL,
    utilizado BOOLEAN DEFAULT FALSE NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_codigo_otp_ativo ON codigo_verificacao_email(email, codigo, expira_em) WHERE utilizado = FALSE;

-- 4. Tabela de Partidas & Amistosos (PostGIS + RN04 Precificação + RN06 Proteção Feminina)
CREATE TABLE partida (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizador_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    esporte VARCHAR(80) NOT NULL,
    descricao TEXT,
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    duracao_minutos INTEGER DEFAULT 90 NOT NULL,
    max_vagas INTEGER NOT NULL CHECK (max_vagas > 1),
    vagas_preenchidas INTEGER DEFAULT 0 NOT NULL CHECK (vagas_preenchidas <= max_vagas),
    tipo_local VARCHAR(20) DEFAULT 'Publica' NOT NULL CHECK (tipo_local IN ('Publica', 'Privada')),
    formato_jogo VARCHAR(30) DEFAULT 'Avulso' NOT NULL CHECK (formato_jogo IN ('Avulso', 'Amistoso_Times')),
    taxa_campo DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    taxa_juiz DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    filtro_genero VARCHAR(50) DEFAULT 'Misto' NOT NULL, -- 'Misto' ou 'Exclusivo_Feminino' (RN06)
    filtro_nivel VARCHAR(50),
    endereco_completo VARCHAR(300) NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) DEFAULT 'Franca' NOT NULL,
    lat DECIMAL(10,7) NOT NULL,
    lng DECIMAL(10,7) NOT NULL,
    geom GEOMETRY(Point, 4326),
    status_partida tipo_status_partida DEFAULT 'Publicada' NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deletado_em TIMESTAMP WITH TIME ZONE NULL,
    deletado_por_id UUID NULL REFERENCES usuario(id)
);

CREATE INDEX idx_partida_geom_gist ON partida USING GIST(geom);
CREATE INDEX idx_partida_status_data ON partida(status_partida, data_hora) WHERE deletado_em IS NULL;
CREATE INDEX idx_partida_genero ON partida(filtro_genero);

-- 5. Tabela de Solicitações de Vagas / Amistosos
CREATE TABLE solicitacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partida_id UUID NOT NULL REFERENCES partida(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    status_solicitacao tipo_status_solicitacao DEFAULT 'Pendente' NOT NULL,
    data_requisicao TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    data_decisao TIMESTAMP WITH TIME ZONE NULL,
    deletado_em TIMESTAMP WITH TIME ZONE NULL,
    deletado_por_id UUID NULL REFERENCES usuario(id),
    CONSTRAINT uq_usuario_partida UNIQUE (partida_id, usuario_id)
);

CREATE INDEX idx_solicitacao_partida ON solicitacao(partida_id, status_solicitacao) WHERE deletado_em IS NULL;
CREATE INDEX idx_solicitacao_usuario ON solicitacao(usuario_id);

-- 6. Tabela de Avaliações Mútuas Pós-Jogo (Estilo Uber)
CREATE TABLE avaliacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partida_id UUID NOT NULL REFERENCES partida(id) ON DELETE CASCADE,
    avaliador_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    avaliado_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    nota INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
    comentario TEXT NULL,
    data_avaliacao TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deletado_em TIMESTAMP WITH TIME ZONE NULL,
    deletado_por_id UUID NULL REFERENCES usuario(id),
    CONSTRAINT uq_avaliacao_partida_par UNIQUE (partida_id, avaliador_id, avaliado_id)
);

CREATE INDEX idx_avaliacao_avaliado ON avaliacao(avaliado_id);

-- 7. Tabela de Mensagens de Chat da Partida (WebSocket)
CREATE TABLE chat_mensagem (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partida_id UUID NOT NULL REFERENCES partida(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    mensagem TEXT NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deletado_em TIMESTAMP WITH TIME ZONE NULL,
    deletado_por_id UUID NULL REFERENCES usuario(id)
);

CREATE INDEX idx_chat_partida_data ON chat_mensagem(partida_id, criado_em ASC) WHERE deletado_em IS NULL;

-- 8. Tabela de Log de Auditoria Imutável (LGPD)
CREATE TABLE auditoria_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tabela_nome VARCHAR(100) NOT NULL,
    registro_id UUID NOT NULL,
    operacao VARCHAR(20) NOT NULL CHECK (operacao IN ('INSERT', 'UPDATE', 'DELETE', 'SOFT_DELETE')),
    usuario_id UUID NULL,
    dados_anteriores JSONB NULL,
    dados_novos JSONB NULL,
    campos_alterados JSONB NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_auditoria_tabela_reg ON auditoria_log(tabela_nome, registro_id);
CREATE INDEX idx_auditoria_criado_em ON auditoria_log(criado_em DESC);
```

---

## 3. Query Geoespacial com Blindagem Feminina (RN06)

```sql
SELECT 
    p.id,
    p.esporte,
    p.descricao,
    p.data_hora,
    p.duracao_minutos,
    p.max_vagas,
    p.vagas_preenchidas,
    p.tipo_local,
    p.formato_jogo,
    p.taxa_campo,
    p.taxa_juiz,
    p.filtro_genero,
    p.bairro,
    p.cidade,
    ST_Distance(p.geom, ST_SetSRID(ST_MakePoint(:user_lng, :user_lat), 4326)::geography) AS distancia_metros,
    u.id AS organizador_id,
    u.nome AS organizador_nome,
    u.nota_media AS organizador_nota
FROM partida p
INNER JOIN usuario u ON p.organizador_id = u.id
WHERE p.status_partida = 'Publicada'
  AND p.deletado_em IS NULL
  AND p.data_hora > NOW()
  AND ST_DWithin(p.geom, ST_SetSRID(ST_MakePoint(:user_lng, :user_lat), 4326)::geography, :raio_metros)
  -- REGRA RN06: Blindagem Feminina (Homens não enxergam partidas exclusivas para mulheres)
  AND (
      p.filtro_genero = 'Misto'
      OR (p.filtro_genero = 'Exclusivo_Feminino' AND :genero_usuario = 'Feminino')
  )
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
