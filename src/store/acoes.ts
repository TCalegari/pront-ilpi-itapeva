"use client";

import { admissaoVazia, pendenciasAdmissao, type DadosAdmissao } from "@/domain/admissao";
import { agoraLocal, hojeLocal } from "@/domain/datas";
import { ESCALAS, type EscalaId, type Respostas } from "@/domain/escalas/escalas";
import type { GrauDependencia, ItemPlano, Perfil } from "@/domain/tipos";
import { alterar, novoId, obterBanco } from "./banco";
import { checagemVigente, planoVigente } from "./consultas";
import type { AvaliacaoResultado, BancoLocal, Checagem, EventoAuditoria, Profissional } from "./modelo";

// Ações de escrita. Cada uma valida permissão e regras no "servidor" (aqui, no
// cliente — no produto final estas funções viram Server Actions com as mesmas regras).

export class ErroRegra extends Error {}

const ROTULO_PERFIL: Record<Perfil, string> = { ENFERMEIRO: "Enfermeira(o)", TECNICO: "Técnico de enfermagem" };

export function profissionalAtual(b: BancoLocal): Profissional {
  const p = b.profissionais.find((x) => x.id === b.profissionalAtualId);
  if (!p) throw new ErroRegra("Profissional não identificado");
  return p;
}

export function rotuloAutor(p: Profissional): string {
  return `${p.nome} – ${ROTULO_PERFIL[p.perfil]} ${p.conselho}`;
}

function exigirEnfermeiro(p: Profissional, acao: string) {
  if (p.perfil !== "ENFERMEIRO") {
    throw new ErroRegra(`${acao} é privativo do enfermeiro (Res. COFEN 736/2024, art. 6º).`);
  }
}

function auditar(b: BancoLocal, evento: Omit<EventoAuditoria, "id" | "em" | "profissionalId">): EventoAuditoria[] {
  return [...b.auditoria, { ...evento, id: novoId("aud"), profissionalId: b.profissionalAtualId, em: new Date().toISOString() }];
}

export function trocarProfissional(id: string) {
  alterar((b) => ({ ...b, profissionalAtualId: id }));
}

export function registrarVisualizacao(residenteId: string) {
  alterar((b) => ({ ...b, auditoria: auditar(b, { acao: "VIEW", entidade: "Prontuario", entidadeId: residenteId, residenteId }) }));
}

// ─── Admissão ────────────────────────────────────────────────────────────────

export function iniciarAdmissao(): string {
  const residenteId = novoId("res");
  const admissaoId = novoId("adm");
  const hoje = hojeLocal();
  alterar((b) => ({
    ...b,
    residentes: [
      ...b.residentes,
      {
        id: residenteId,
        nome: "",
        nascimento: "",
        quarto: "",
        leito: "",
        status: "EM_ADMISSAO",
        alergias: "",
        dataAdmissao: hoje,
        responsavel: { nome: "", parentesco: "", telefone: "" },
      },
    ],
    admissoes: [
      ...b.admissoes,
      {
        id: admissaoId,
        residenteId,
        status: "RASCUNHO",
        dados: admissaoVazia(hoje),
        iniciadaEm: new Date().toISOString(),
        atualizadaEm: new Date().toISOString(),
      },
    ],
    auditoria: auditar(b, { acao: "CREATE", entidade: "Admissao", entidadeId: admissaoId, residenteId }),
  }));
  return admissaoId;
}

/** O rascunho é editável até a conclusão; depois vira registro imutável. */
export function salvarRascunhoAdmissao(admissaoId: string, dados: DadosAdmissao) {
  alterar((b) => {
    const adm = b.admissoes.find((a) => a.id === admissaoId);
    if (!adm) throw new ErroRegra("Admissão não encontrada");
    if (adm.status !== "RASCUNHO") throw new ErroRegra("Admissão já concluída não pode ser alterada");
    const id = dados.identificacao;
    return {
      ...b,
      admissoes: b.admissoes.map((a) => (a.id === admissaoId ? { ...a, dados, atualizadaEm: new Date().toISOString() } : a)),
      residentes: b.residentes.map((r) =>
        r.id === adm.residenteId
          ? { ...r, nome: id.nome, nascimento: id.nascimento, quarto: id.quarto, leito: id.leito, dataAdmissao: id.dataAdmissao }
          : r,
      ),
    };
  });
}

export function concluirAdmissao(admissaoId: string) {
  alterar((b) => {
    const prof = profissionalAtual(b);
    exigirEnfermeiro(prof, "Concluir a admissão (diagnóstico e prescrição de enfermagem)");
    const adm = b.admissoes.find((a) => a.id === admissaoId);
    if (!adm || adm.status !== "RASCUNHO") throw new ErroRegra("Admissão não encontrada ou já concluída");
    const d = adm.dados;
    const pend = pendenciasAdmissao(d, hojeLocal());
    if (pend.length > 0) throw new ErroRegra(`Há ${pend.length} pendência(s) na admissão`);

    const autor = rotuloAutor(prof);
    const agora = new Date().toISOString();
    const grau = d.grau.confirmado as GrauDependencia;
    const planoId = novoId("plano");
    const escalas = (["KATZ", "MORSE", "BRADEN"] as const).map((e) => {
      const r = ESCALAS[e].calcular(d.escalas[e]);
      return {
        id: novoId("esc"),
        residenteId: adm.residenteId,
        escala: e,
        respostas: d.escalas[e],
        pontuacao: r.pontuacao,
        classificacao: r.classificacao,
        contexto: "ADMISSAO" as const,
        autor,
        registradoEm: agora,
      };
    });
    const id = d.identificacao;

    return {
      ...b,
      admissoes: b.admissoes.map((a) => (a.id === admissaoId ? { ...a, status: "CONCLUIDA", concluidaEm: agora, autor } : a)),
      residentes: b.residentes.map((r) =>
        r.id === adm.residenteId
          ? {
              ...r,
              nome: id.nome.trim(),
              nomeSocial: id.nomeSocial.trim() || undefined,
              nascimento: id.nascimento,
              sexo: id.sexo || undefined,
              quarto: id.quarto.trim(),
              leito: id.leito.trim(),
              dataAdmissao: id.dataAdmissao,
              status: "ATIVO",
              grau,
              alergias: d.saude.semAlergiasConhecidas ? "" : d.saude.alergias.trim(),
              responsavel: { nome: id.responsavelNome, parentesco: id.responsavelParentesco, telefone: id.responsavelTelefone },
            }
          : r,
      ),
      escalas: [...b.escalas, ...escalas],
      planos: [
        ...b.planos,
        {
          id: planoId,
          residenteId: adm.residenteId,
          versao: 1,
          origem: "ADMISSAO",
          grau,
          itens: d.plano,
          evolucao: d.observacoes.trim() || "Plano de cuidados inicial elaborado na admissão.",
          avaliacaoAnterior: [],
          autor,
          registradoEm: agora,
          vigenteDesde: hojeLocal(),
        },
      ],
      auditoria: auditar(b, { acao: "CREATE", entidade: "Admissao", entidadeId: admissaoId, residenteId: adm.residenteId }),
    };
  });
}

// ─── Escalas ─────────────────────────────────────────────────────────────────

export function registrarEscala(
  residenteId: string,
  escala: EscalaId,
  respostas: Respostas,
  contexto: "REAVALIACAO" | "EVENTO",
  observacao: string,
) {
  alterar((b) => {
    const prof = profissionalAtual(b);
    const r = ESCALAS[escala].calcular(respostas); // recalcula; lança erro se incompleta
    if (contexto === "EVENTO" && observacao.trim().length < 5) throw new ErroRegra("Descreva o evento que motivou a reavaliação");
    const id = novoId("esc");
    return {
      ...b,
      escalas: [
        ...b.escalas,
        {
          id,
          residenteId,
          escala,
          respostas,
          pontuacao: r.pontuacao,
          classificacao: r.classificacao,
          contexto,
          observacao: observacao.trim() || undefined,
          autor: rotuloAutor(prof),
          registradoEm: new Date().toISOString(),
        },
      ],
      auditoria: auditar(b, { acao: "CREATE", entidade: "Escala", entidadeId: id, residenteId }),
    };
  });
}

// ─── Revisão da SAE ──────────────────────────────────────────────────────────

export function revisarPlano(
  residenteId: string,
  dados: {
    grau: GrauDependencia;
    itens: ItemPlano[];
    evolucao: string;
    avaliacaoAnterior: { diagnosticoId: string; resultado: AvaliacaoResultado }[];
  },
) {
  alterar((b) => {
    const prof = profissionalAtual(b);
    exigirEnfermeiro(prof, "Revisar a SAE");
    if (dados.evolucao.trim().length < 20) throw new ErroRegra("A evolução de enfermagem deve ter ao menos 20 caracteres");
    if (dados.itens.length === 0) throw new ErroRegra("O plano precisa de ao menos um diagnóstico");
    const anterior = planoVigente(b, residenteId);
    const id = novoId("plano");
    return {
      ...b,
      residentes: b.residentes.map((r) => (r.id === residenteId ? { ...r, grau: dados.grau } : r)),
      planos: [
        ...b.planos,
        {
          id,
          residenteId,
          versao: (anterior?.versao ?? 0) + 1,
          origem: "REVISAO",
          grau: dados.grau,
          itens: dados.itens,
          evolucao: dados.evolucao.trim(),
          avaliacaoAnterior: dados.avaliacaoAnterior,
          autor: rotuloAutor(prof),
          registradoEm: new Date().toISOString(),
          vigenteDesde: hojeLocal(),
        },
      ],
      auditoria: auditar(b, { acao: "CREATE", entidade: "PlanoCuidados", entidadeId: id, residenteId }),
    };
  });
}

// ─── Checagem ────────────────────────────────────────────────────────────────

export interface NovaChecagem {
  residenteId: string;
  planoId: string;
  diagnosticoId: string;
  intervencaoId: string;
  programadoPara: string | null;
  status: Checagem["status"];
  justificativa: string;
}

const MINUTOS_ANTECIPACAO = 60;

function validarChecagem(b: BancoLocal, c: NovaChecagem, prof: Profissional) {
  const plano = b.planos.find((p) => p.id === c.planoId);
  const intervencao = plano?.itens
    .find((i) => i.diagnosticoId === c.diagnosticoId)
    ?.intervencoes.find((i) => i.intervencaoId === c.intervencaoId);
  if (!plano || !intervencao) throw new ErroRegra("Intervenção não encontrada no plano");
  if (intervencao.executor === "ENFERMEIRO" && prof.perfil !== "ENFERMEIRO") {
    throw new ErroRegra("Esta intervenção é executada pelo enfermeiro");
  }
  const precisaJustificar = c.status === "NAO_REALIZADO" || (intervencao.exigeJustificativa && c.programadoPara === null);
  if (precisaJustificar && c.justificativa.trim().length < 5) {
    throw new ErroRegra(c.status === "NAO_REALIZADO" ? "Informe o motivo da não realização" : "Descreva o que foi feito");
  }
  if (c.programadoPara) {
    if (!intervencao.aprazamento.horarios.includes(c.programadoPara.slice(11, 16))) {
      throw new ErroRegra("Horário não consta do aprazamento prescrito");
    }
    const agora = new Date();
    const limite = agoraLocal(new Date(agora.getTime() + MINUTOS_ANTECIPACAO * 60_000));
    if (c.programadoPara > limite) throw new ErroRegra("Não é possível checar um horário com mais de 1 h de antecedência");
  }
}

export function registrarChecagem(c: NovaChecagem) {
  alterar((b) => {
    const prof = profissionalAtual(b);
    validarChecagem(b, c, prof);
    if (c.programadoPara && checagemVigente(b, c.residenteId, c.intervencaoId, c.programadoPara)) {
      throw new ErroRegra("Este horário já foi checado. Para corrigir, use “Retificar”.");
    }
    const id = novoId("chk");
    return {
      ...b,
      checagens: [
        ...b.checagens,
        { ...c, id, justificativa: c.justificativa.trim() || undefined, autor: rotuloAutor(prof), registradoEm: new Date().toISOString() },
      ],
      auditoria: auditar(b, { acao: "CREATE", entidade: "Checagem", entidadeId: id, residenteId: c.residenteId }),
    };
  });
}

/** Retificação = novo registro ligado ao original. Só o autor original retifica. */
export function retificarChecagem(originalId: string, status: Checagem["status"], justificativa: string) {
  alterar((b) => {
    const prof = profissionalAtual(b);
    const original = b.checagens.find((x) => x.id === originalId);
    if (!original) throw new ErroRegra("Checagem não encontrada");
    if (original.autor !== rotuloAutor(prof)) throw new ErroRegra("Apenas quem registrou pode retificar a própria checagem");
    if (justificativa.trim().length < 10) throw new ErroRegra("Explique a retificação (mín. 10 caracteres)");
    const id = novoId("chk");
    return {
      ...b,
      checagens: [
        ...b.checagens,
        {
          ...original,
          id,
          status,
          justificativa: justificativa.trim(),
          retificaId: original.id,
          autor: rotuloAutor(prof),
          registradoEm: new Date().toISOString(),
        },
      ],
      auditoria: auditar(b, { acao: "AMEND", entidade: "Checagem", entidadeId: id, residenteId: original.residenteId }),
    };
  });
}

export function registrarAnotacao(residenteId: string, texto: string) {
  alterar((b) => {
    const prof = profissionalAtual(b);
    if (texto.trim().length < 10) throw new ErroRegra("A anotação deve ter ao menos 10 caracteres");
    const id = novoId("anot");
    return {
      ...b,
      anotacoes: [...b.anotacoes, { id, residenteId, texto: texto.trim(), autor: rotuloAutor(prof), registradoEm: new Date().toISOString() }],
      auditoria: auditar(b, { acao: "CREATE", entidade: "Anotacao", entidadeId: id, residenteId }),
    };
  });
}

/** Executa uma ação e devolve a mensagem de erro de regra, se houver. */
export function tentar(acao: () => void): string | null {
  try {
    acao();
    return null;
  } catch (e) {
    if (e instanceof ErroRegra) return e.message;
    if (e instanceof Error) return e.message;
    return "Erro inesperado";
  }
}

export { obterBanco };
