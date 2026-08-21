-- ============================================================================
-- SCRIPT DE MIGRAÇÃO (004_soft_delete_and_audit_log.sql) — BORA! APP
-- DBA Responsável: dba_especialista
-- Objetivo: Soft Delete universal e Auditoria Log com rastreamento temporal,
--           detecção de deltas JSONB e suporte a contexto de usuário da sessão.
-- ============================================================================

-- 1. Adicionar colunas de Soft Delete nas 5 tabelas de negócio
ALTER TABLE usuario
ADD COLUMN IF NOT EXISTS deletado_em TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS deletado_por_id UUID NULL REFERENCES usuario(id);

ALTER TABLE partida
ADD COLUMN IF NOT EXISTS deletado_em TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS deletado_por_id UUID NULL REFERENCES usuario(id);

ALTER TABLE solicitacao
ADD COLUMN IF NOT EXISTS deletado_em TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS deletado_por_id UUID NULL REFERENCES usuario(id);

ALTER TABLE avaliacao
ADD COLUMN IF NOT EXISTS deletado_em TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS deletado_por_id UUID NULL REFERENCES usuario(id);

ALTER TABLE chat_mensagem
ADD COLUMN IF NOT EXISTS deletado_em TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS deletado_por_id UUID NULL REFERENCES usuario(id);

-- Índices parciais para otimização de consultas ativas (deletado_em IS NULL)
CREATE INDEX IF NOT EXISTS idx_usuario_ativo ON usuario(id) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_partida_ativo ON partida(id) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_solicitacao_ativo ON solicitacao(id) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_avaliacao_ativo ON avaliacao(id) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_chat_mensagem_ativo ON chat_mensagem(id) WHERE deletado_em IS NULL;

-- 2. Criação da tabela imutável de log de auditoria
CREATE TABLE IF NOT EXISTS auditoria_log (
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

-- 3. Índices de alta performance para auditoria e governança
CREATE INDEX IF NOT EXISTS idx_auditoria_tabela_reg ON auditoria_log(tabela_nome, registro_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria_log(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_criado_em ON auditoria_log(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_operacao ON auditoria_log(operacao);
CREATE INDEX IF NOT EXISTS idx_auditoria_dados_gin ON auditoria_log USING GIN(dados_novos);
CREATE INDEX IF NOT EXISTS idx_auditoria_campos_alt_gin ON auditoria_log USING GIN(campos_alterados);

-- 4. Função PL/pgSQL de Trigger para auditoria universal
CREATE OR REPLACE FUNCTION fn_auditar_alteracoes()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id_text TEXT;
    v_user_id UUID := NULL;
    v_operacao VARCHAR(20);
    v_dados_anteriores JSONB := NULL;
    v_dados_novos JSONB := NULL;
    v_campos_alterados JSONB := NULL;
    v_registro_id UUID;
    v_key TEXT;
    v_old_val JSONB;
    v_new_val JSONB;
BEGIN
    -- Obter usuário autor via variável de sessão 'bora.current_user_id'
    v_user_id_text := current_setting('bora.current_user_id', true);
    IF v_user_id_text IS NOT NULL AND v_user_id_text <> '' THEN
        BEGIN
            v_user_id := v_user_id_text::UUID;
        EXCEPTION WHEN OTHERS THEN
            v_user_id := NULL;
        END;
    END IF;

    -- Avaliar tipo de operação
    IF TG_OP = 'INSERT' THEN
        v_operacao := 'INSERT';
        v_registro_id := NEW.id;
        v_dados_novos := to_jsonb(NEW);
        
        -- Fallback para extrair usuario_id caso não esteja na sessão
        IF v_user_id IS NULL THEN
            IF v_dados_novos ? 'usuario_id' AND v_dados_novos->>'usuario_id' IS NOT NULL THEN
                BEGIN
                    v_user_id := (v_dados_novos->>'usuario_id')::UUID;
                EXCEPTION WHEN OTHERS THEN NULL;
                END;
            ELSIF v_dados_novos ? 'organizador_id' AND v_dados_novos->>'organizador_id' IS NOT NULL THEN
                BEGIN
                    v_user_id := (v_dados_novos->>'organizador_id')::UUID;
                EXCEPTION WHEN OTHERS THEN NULL;
                END;
            ELSIF v_dados_novos ? 'avaliador_id' AND v_dados_novos->>'avaliador_id' IS NOT NULL THEN
                BEGIN
                    v_user_id := (v_dados_novos->>'avaliador_id')::UUID;
                EXCEPTION WHEN OTHERS THEN NULL;
                END;
            END IF;
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        v_operacao := 'DELETE';
        v_registro_id := OLD.id;
        v_dados_anteriores := to_jsonb(OLD);

    ELSIF TG_OP = 'UPDATE' THEN
        v_registro_id := NEW.id;
        v_dados_anteriores := to_jsonb(OLD);
        v_dados_novos := to_jsonb(NEW);

        -- Detecção de SOFT_DELETE
        IF (OLD.deletado_em IS NULL AND NEW.deletado_em IS NOT NULL) THEN
            v_operacao := 'SOFT_DELETE';
            IF v_user_id IS NULL AND NEW.deletado_por_id IS NOT NULL THEN
                v_user_id := NEW.deletado_por_id;
            END IF;
        ELSE
            v_operacao := 'UPDATE';
        END IF;

        -- Cálculo do delta JSONB das colunas alteradas
        v_campos_alterados := '{}'::jsonb;
        FOR v_key IN SELECT jsonb_object_keys(v_dados_novos) LOOP
            v_old_val := v_dados_anteriores -> v_key;
            v_new_val := v_dados_novos -> v_key;
            IF v_old_val IS DISTINCT FROM v_new_val THEN
                v_campos_alterados := jsonb_set(
                    v_campos_alterados,
                    ARRAY[v_key],
                    jsonb_build_object('de', v_old_val, 'para', v_new_val)
                );
            END IF;
        END LOOP;

        -- Se for UPDATE comum e não houve mudança real nos campos, encerra sem log
        IF v_operacao = 'UPDATE' AND (v_campos_alterados = '{}'::jsonb OR v_campos_alterados IS NULL) THEN
            RETURN NEW;
        END IF;
    END IF;

    -- Inserir registro imutável no auditoria_log
    INSERT INTO auditoria_log (
        tabela_nome,
        registro_id,
        operacao,
        usuario_id,
        dados_anteriores,
        dados_novos,
        campos_alterados,
        criado_em
    ) VALUES (
        TG_TABLE_NAME,
        v_registro_id,
        v_operacao,
        v_user_id,
        v_dados_anteriores,
        v_dados_novos,
        v_campos_alterados,
        NOW()
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. Triggers AFTER INSERT OR UPDATE OR DELETE para as 5 tabelas
DROP TRIGGER IF EXISTS trg_auditoria_usuario ON usuario;
CREATE TRIGGER trg_auditoria_usuario
AFTER INSERT OR UPDATE OR DELETE ON usuario
FOR EACH ROW EXECUTE FUNCTION fn_auditar_alteracoes();

DROP TRIGGER IF EXISTS trg_auditoria_partida ON partida;
CREATE TRIGGER trg_auditoria_partida
AFTER INSERT OR UPDATE OR DELETE ON partida
FOR EACH ROW EXECUTE FUNCTION fn_auditar_alteracoes();

DROP TRIGGER IF EXISTS trg_auditoria_solicitacao ON solicitacao;
CREATE TRIGGER trg_auditoria_solicitacao
AFTER INSERT OR UPDATE OR DELETE ON solicitacao
FOR EACH ROW EXECUTE FUNCTION fn_auditar_alteracoes();

DROP TRIGGER IF EXISTS trg_auditoria_avaliacao ON avaliacao;
CREATE TRIGGER trg_auditoria_avaliacao
AFTER INSERT OR UPDATE OR DELETE ON avaliacao
FOR EACH ROW EXECUTE FUNCTION fn_auditar_alteracoes();

DROP TRIGGER IF EXISTS trg_auditoria_chat_mensagem ON chat_mensagem;
CREATE TRIGGER trg_auditoria_chat_mensagem
AFTER INSERT OR UPDATE OR DELETE ON chat_mensagem
FOR EACH ROW EXECUTE FUNCTION fn_auditar_alteracoes();
