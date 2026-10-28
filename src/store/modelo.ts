import type { DadosAdmissao } from "@/domain/admissao";
import type { EscalaId, Respostas } from "@/domain/escalas/escalas";
import type { GrauDependencia, ItemPlano, Perfil } from "@/domain/tipos";

// Entidades persistidas. Espelham o que virá a ser o schema do banco (docs/03).
// Registros clínicos são imutáveis: não há update/delete; correção = novo registro.

export interface Profissional {
  id: string;
  nome: string;
  perfil: Perfil;
  conselho: string;
}

export type StatusResidente = "EM_ADMISSAO" | "ATIVO" | "HOSPITALIZADO" | "DESLIGADO" | "OBITO";

export interface Residente {
  id: string;
  nome: string;
  nomeSocial?: string;
  nascimento: string;
  sexo?: "F" | "M";
  quarto: string;
  leito: string;
  status: StatusResidente;
  grau?: GrauDependencia;
  alergias: string;
  dataAdmissao: string;
  responsavel: { nome: string; parentesco: string; telefone: string };
}

export interface Admissao {
  id: string;
  residenteId: string;
  status: "RASCUNHO" | "CONCLUIDA";
  dados: DadosAdmissao;
  iniciadaEm: string;
  atualizadaEm: string;
  concluidaEm?: string;
  autor?: string;
}

export interface AplicacaoEscala {
  id: string;
  residenteId: string;
  escala: EscalaId;
  respostas: Respostas;
  pontuacao: number;
  classificacao: string;
  contexto: "ADMISSAO" | "REAVALIACAO" | "EVENTO";
  observacao?: string;
  autor: string;
  registradoEm: string;
}

export type AvaliacaoResultado = "ALCANCADO" | "PARCIAL" | "NAO_ALCANCADO";

/** Versão da SAE (prescrição de enfermagem). Cada revisão cria nova versão. */
export interface PlanoCuidados {
  id: string;
  residenteId: string;
  versao: number;
  origem: "ADMISSAO" | "REVISAO";
  grau: GrauDependencia;
  itens: ItemPlano[];
  /** Evolução de enfermagem que fundamentou a revisão (privativa do enfermeiro). */
  evolucao: string;
  avaliacaoAnterior: { diagnosticoId: string; resultado: AvaliacaoResultado }[];
  autor: string;
  registradoEm: string;
  /** Data local da vigência, base do prazo de revisão. */
  vigenteDesde: string;
}

export interface Checagem {
  id: string;
  residenteId: string;
  planoId: string;
  diagnosticoId: string;
  intervencaoId: string;
  /** "YYYY-MM-DDTHH:mm" local; null = execução "se necessário". */
  programadoPara: string | null;
  status: "REALIZADO" | "NAO_REALIZADO";
  justificativa?: string;
  /** Checagem que esta retifica (adendo). */
  retificaId?: string;
  autor: string;
  registradoEm: string;
}

export interface Anotacao {
  id: string;
  residenteId: string;
  texto: string;
  autor: string;
  registradoEm: string;
}

export interface EventoAuditoria {
  id: string;
  acao: "VIEW" | "CREATE" | "AMEND" | "UPDATE_DRAFT";
  entidade: string;
  entidadeId: string;
  residenteId?: string;
  profissionalId: string;
  em: string;
}

export interface BancoLocal {
  versao: 1;
  profissionalAtualId: string;
  profissionais: Profissional[];
  residentes: Residente[];
  admissoes: Admissao[];
  escalas: AplicacaoEscala[];
  planos: PlanoCuidados[];
  checagens: Checagem[];
  anotacoes: Anotacao[];
  auditoria: EventoAuditoria[];
}
