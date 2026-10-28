-- Modelo de dados proposto (PostgreSQL 15+) para a SAE e a admissão.
-- Rascunho para a fase com banco; o protótipo atual guarda os mesmos objetos no navegador
-- (src/store/modelo.ts). Corrige os problemas do SQL sugerido pelo Gemini (docs/01).
--
-- Princípios: registro clínico imutável (sem UPDATE/DELETE; correção = novo registro
-- ligado ao original), snapshot do autor em cada registro, trilha de hash encadeada,
-- RLS ligado (se usar Supabase, nada fica exposto pela Data API sem política).

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS pep;

-- ─── Cadastros ────────────────────────────────────────────────────────────────

CREATE TABLE pep.profissional (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          text NOT NULL,
  perfil        text NOT NULL CHECK (perfil IN ('ADMIN','CUIDADOR','TECNICO','ENFERMEIRO','MULTI','MEDICO')),
  conselho      text,                       -- ex.: 'COREN-SP 123456'
  ativo         boolean NOT NULL DEFAULT true
);

CREATE TABLE pep.residente (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            text NOT NULL,
  nome_social     text,
  nascimento      date NOT NULL,
  sexo            char(1) CHECK (sexo IN ('F','M')),
  cpf             char(11) UNIQUE,
  cns             char(15) UNIQUE,
  quarto          text,
  leito           text,
  status          text NOT NULL DEFAULT 'EM_ADMISSAO'
                  CHECK (status IN ('EM_ADMISSAO','ATIVO','HOSPITALIZADO','DESLIGADO','OBITO')),
  grau            text CHECK (grau IN ('I','II','III')),       -- RDC 502/2021
  alergias        text NOT NULL DEFAULT '',
  data_admissao   date NOT NULL,
  responsavel     jsonb NOT NULL DEFAULT '{}'
);

-- Rascunho editável até a conclusão; depois, imutável (ver gatilho abaixo).
CREATE TABLE pep.admissao (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  residente_id  uuid NOT NULL REFERENCES pep.residente(id),
  status        text NOT NULL DEFAULT 'RASCUNHO' CHECK (status IN ('RASCUNHO','CONCLUIDA')),
  dados         jsonb NOT NULL,             -- DadosAdmissao (src/domain/admissao.ts), validado na aplicação
  iniciada_em   timestamptz NOT NULL DEFAULT now(),
  concluida_em  timestamptz,
  autor_id      uuid REFERENCES pep.profissional(id),
  autor_rotulo  text
);

-- ─── Escalas ──────────────────────────────────────────────────────────────────

CREATE TABLE pep.aplicacao_escala (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  residente_id  uuid NOT NULL REFERENCES pep.residente(id),
  escala        text NOT NULL CHECK (escala IN ('MORSE','BRADEN','KATZ')),
  respostas     jsonb NOT NULL,
  pontuacao     smallint NOT NULL,          -- recalculada no servidor
  classificacao text NOT NULL,
  contexto      text NOT NULL CHECK (contexto IN ('ADMISSAO','REAVALIACAO','EVENTO')),
  observacao    text,
  autor_id      uuid NOT NULL REFERENCES pep.profissional(id),
  autor_rotulo  text NOT NULL,
  registrado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON pep.aplicacao_escala (residente_id, escala, registrado_em DESC);

-- ─── SAE: cada revisão é uma nova versão ──────────────────────────────────────

CREATE TABLE pep.plano_cuidados (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  residente_id   uuid NOT NULL REFERENCES pep.residente(id),
  versao         integer NOT NULL,
  origem         text NOT NULL CHECK (origem IN ('ADMISSAO','REVISAO')),
  grau           text NOT NULL CHECK (grau IN ('I','II','III')),
  evolucao       text NOT NULL,             -- evolução de enfermagem (privativa do enfermeiro)
  vigente_desde  date NOT NULL,
  autor_id       uuid NOT NULL REFERENCES pep.profissional(id),
  autor_rotulo   text NOT NULL,
  registrado_em  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (residente_id, versao)
);

CREATE TABLE pep.plano_diagnostico (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id              uuid NOT NULL REFERENCES pep.plano_cuidados(id),
  catalogo_id           text NOT NULL,      -- id em src/domain/cipe/catalogo.ts
  cipe_diagnostico      char(8) NOT NULL,
  cipe_diagnostico_termo text NOT NULL,
  cipe_resultado        char(8) NOT NULL,
  cipe_resultado_termo  text NOT NULL,
  ciap                  text[] NOT NULL DEFAULT '{}',
  justificativa         text NOT NULL
);

-- Avaliação dos resultados da versão anterior, registrada junto com a nova versão.
CREATE TABLE pep.plano_avaliacao (
  plano_id     uuid NOT NULL REFERENCES pep.plano_cuidados(id),   -- versão nova
  catalogo_id  text NOT NULL,
  resultado    text NOT NULL CHECK (resultado IN ('ALCANCADO','PARCIAL','NAO_ALCANCADO')),
  PRIMARY KEY (plano_id, catalogo_id)
);

CREATE TABLE pep.plano_intervencao (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_diagnostico_id uuid NOT NULL REFERENCES pep.plano_diagnostico(id),
  catalogo_id         text NOT NULL,
  cipe_intervencao    char(8) NOT NULL,
  descricao           text NOT NULL,
  horarios            time[] NOT NULL DEFAULT '{}',   -- vazio = se necessário
  dias_semana         smallint[],                     -- 0 = domingo
  executor            text NOT NULL CHECK (executor IN ('TECNICO','ENFERMEIRO')),
  exige_justificativa boolean NOT NULL DEFAULT false
);

-- ─── Checagem do técnico ──────────────────────────────────────────────────────

CREATE TABLE pep.checagem (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_intervencao_id uuid NOT NULL REFERENCES pep.plano_intervencao(id),
  residente_id        uuid NOT NULL REFERENCES pep.residente(id),
  programado_para     timestamp,            -- horário local aprazado; NULL = se necessário
  status              text NOT NULL CHECK (status IN ('REALIZADO','NAO_REALIZADO')),
  justificativa       text,
  retifica_id         uuid REFERENCES pep.checagem(id),
  autor_id            uuid NOT NULL REFERENCES pep.profissional(id),
  autor_rotulo        text NOT NULL,
  registrado_em       timestamptz NOT NULL DEFAULT now(),
  hash_anterior       char(64),
  hash                char(64) NOT NULL,
  CHECK (status = 'REALIZADO' OR length(trim(coalesce(justificativa, ''))) >= 5),
  CHECK (retifica_id IS NULL OR length(trim(coalesce(justificativa, ''))) >= 10)
);
-- Um único registro original por horário; retificações ficam fora da restrição.
CREATE UNIQUE INDEX checagem_unica ON pep.checagem (plano_intervencao_id, programado_para)
  WHERE retifica_id IS NULL AND programado_para IS NOT NULL;

-- Hash encadeado: cada checagem inclui o hash da anterior (evidencia remoção/alteração).
CREATE OR REPLACE FUNCTION pep.fn_hash_checagem() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('pep.checagem'));
  SELECT hash INTO NEW.hash_anterior FROM pep.checagem ORDER BY registrado_em DESC, id DESC LIMIT 1;
  NEW.hash := encode(digest(concat_ws('|',
      coalesce(NEW.hash_anterior, ''), NEW.id, NEW.plano_intervencao_id, NEW.residente_id,
      coalesce(NEW.programado_para::text, 'SN'), NEW.status, coalesce(NEW.justificativa, ''),
      coalesce(NEW.retifica_id::text, ''), NEW.autor_id, NEW.autor_rotulo, NEW.registrado_em::text),
    'sha256'), 'hex');
  RETURN NEW;
END $$;
CREATE TRIGGER trg_hash_checagem BEFORE INSERT ON pep.checagem
  FOR EACH ROW EXECUTE FUNCTION pep.fn_hash_checagem();

CREATE TABLE pep.anotacao (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  residente_id  uuid NOT NULL REFERENCES pep.residente(id),
  texto         text NOT NULL CHECK (length(trim(texto)) >= 10),
  autor_id      uuid NOT NULL REFERENCES pep.profissional(id),
  autor_rotulo  text NOT NULL,
  registrado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pep.auditoria (
  id              bigserial PRIMARY KEY,
  acao            text NOT NULL,            -- VIEW, CREATE, AMEND...
  entidade        text NOT NULL,
  entidade_id     text NOT NULL,
  residente_id    uuid,
  profissional_id uuid,
  em              timestamptz NOT NULL DEFAULT now()
);

-- ─── Imutabilidade ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION pep.fn_bloquear_alteracao() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Registro clínico imutável (%): faça uma retificação/nova versão', TG_TABLE_NAME;
END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['aplicacao_escala','plano_cuidados','plano_diagnostico','plano_avaliacao','plano_intervencao','checagem','anotacao','auditoria']
  LOOP
    EXECUTE format('CREATE TRIGGER trg_imutavel_%1$s BEFORE UPDATE OR DELETE ON pep.%1$s
                    FOR EACH ROW EXECUTE FUNCTION pep.fn_bloquear_alteracao()', t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION pep.fn_admissao_concluida() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'CONCLUIDA' THEN
    RAISE EXCEPTION 'Admissão concluída não pode ser alterada';
  END IF;
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Admissão não pode ser excluída'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_admissao_concluida BEFORE UPDATE OR DELETE ON pep.admissao
  FOR EACH ROW EXECUTE FUNCTION pep.fn_admissao_concluida();

-- ─── RLS: tudo fechado por padrão; acesso via backend com papel próprio ──────

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'pep' LOOP
    EXECUTE format('ALTER TABLE pep.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
