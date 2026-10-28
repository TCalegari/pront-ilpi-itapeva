// Tipos de domínio compartilhados. Sem dependência de React nem de persistência,
// para que a mesma regra rode no navegador hoje e no servidor quando houver banco.

/** Grau de dependência — RDC ANVISA 502/2021. */
export type GrauDependencia = "I" | "II" | "III";

export type Perfil = "ENFERMEIRO" | "TECNICO";

/** Conceito pré-coordenado da CIPE® (código de 8 dígitos + termo oficial pt-BR). */
export interface ConceitoCipe {
  codigo: string;
  termo: string;
}

export interface CodigoCiap {
  codigo: string;
  titulo: string;
}

/**
 * Aprazamento: horários "HH:mm" do dia. `diasSemana` (0 = domingo) restringe a
 * dias específicos (ex.: pesar às segundas). Lista vazia = "se necessário".
 */
export interface Aprazamento {
  horarios: string[];
  diasSemana?: number[];
}

/** Necessidades Humanas Fundamentais de Henderson (referencial do subconjunto CIPE® para ILPI). */
export type Necessidade =
  | "Respirar"
  | "Comer e beber"
  | "Eliminar"
  | "Mover-se e manter postura"
  | "Dormir e repousar"
  | "Manter-se limpo e proteger o tegumento"
  | "Evitar perigos"
  | "Comunicar-se"
  | "Aprender"
  | "Ocupar-se e realizar-se"
  | "Recrear-se";

export interface IntervencaoModelo {
  id: string;
  /** Conceito CIPE® de intervenção (eixo IC) mais próximo do cuidado operacional. */
  cipe: ConceitoCipe;
  /** Descrição operacional da instituição — é o que o técnico lê na folha. */
  descricao: string;
  aprazamento: Aprazamento;
  executor: Perfil;
  exigeJustificativa: boolean;
}

export interface DiagnosticoModelo {
  id: string;
  necessidade: Necessidade;
  ciap: CodigoCiap[];
  diagnostico: ConceitoCipe;
  resultado: ConceitoCipe;
  /** Prevalência no estudo de referência (Fernandes et al., 2019: 203 idosos de uma ILPI). */
  prevalenciaReferencia?: number;
  intervencoes: IntervencaoModelo[];
  observacao?: string;
}

/** Intervenção prescrita: cópia do modelo, com aprazamento individualizado. */
export interface IntervencaoPrescrita {
  intervencaoId: string;
  cipe: ConceitoCipe;
  descricao: string;
  aprazamento: Aprazamento;
  executor: Perfil;
  exigeJustificativa: boolean;
}

/** Diagnóstico no plano de cuidados. Os conceitos são copiados (snapshot) do catálogo. */
export interface ItemPlano {
  diagnosticoId: string;
  diagnostico: ConceitoCipe;
  resultado: ConceitoCipe;
  ciap: CodigoCiap[];
  intervencoes: IntervencaoPrescrita[];
  /** Fator relacionado / evidência que justificou o diagnóstico. */
  justificativa: string;
}
