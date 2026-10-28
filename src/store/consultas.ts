import { hojeLocal } from "@/domain/datas";
import type { EscalaId } from "@/domain/escalas/escalas";
import { prazoEscala, prazoRevisaoSae, type Prazo } from "@/domain/reavaliacao";
import type { AplicacaoEscala, BancoLocal, Checagem, PlanoCuidados, Residente } from "./modelo";

// Consultas puras sobre o banco (sem efeitos).

export function planoVigente(b: BancoLocal, residenteId: string): PlanoCuidados | undefined {
  return b.planos.filter((p) => p.residenteId === residenteId).sort((a, c) => c.versao - a.versao)[0];
}

export function historicoPlanos(b: BancoLocal, residenteId: string): PlanoCuidados[] {
  return b.planos.filter((p) => p.residenteId === residenteId).sort((a, c) => c.versao - a.versao);
}

export function ultimaEscala(b: BancoLocal, residenteId: string, escala: EscalaId): AplicacaoEscala | undefined {
  return b.escalas
    .filter((e) => e.residenteId === residenteId && e.escala === escala)
    .sort((a, c) => c.registradoEm.localeCompare(a.registradoEm))[0];
}

/** Checagem válida de um horário: a mais recente da cadeia de retificações. */
export function checagemVigente(b: BancoLocal, residenteId: string, intervencaoId: string, programadoPara: string): Checagem | undefined {
  const doHorario = b.checagens.filter((c) => c.residenteId === residenteId && c.intervencaoId === intervencaoId && c.programadoPara === programadoPara);
  // Segue a cadeia: um registro retificado por outro nunca é o vigente (o horário pode empatar).
  const retificados = new Set(doHorario.map((c) => c.retificaId).filter(Boolean));
  return doHorario.filter((c) => !retificados.has(c.id)).sort((a, c) => c.registradoEm.localeCompare(a.registradoEm))[0];
}

export function residentesAtivos(b: BancoLocal): Residente[] {
  return b.residentes.filter((r) => r.status === "ATIVO").sort((a, c) => a.quarto.localeCompare(c.quarto) || a.leito.localeCompare(c.leito));
}

export interface SituacaoResidente {
  residente: Residente;
  plano?: PlanoCuidados;
  prazoSae?: Prazo;
  prazosEscalas: { escala: "MORSE" | "BRADEN"; prazo?: Prazo }[];
}

export function situacaoResidente(b: BancoLocal, r: Residente, hoje = hojeLocal()): SituacaoResidente {
  const plano = planoVigente(b, r.id);
  const grau = r.grau ?? plano?.grau;
  return {
    residente: r,
    plano,
    prazoSae: plano && grau ? prazoRevisaoSae(plano.vigenteDesde, grau, hoje) : undefined,
    prazosEscalas: (["MORSE", "BRADEN"] as const).map((escala) => {
      const ultima = ultimaEscala(b, r.id, escala);
      return { escala, prazo: ultima && grau ? prazoEscala(hojeLocal(new Date(ultima.registradoEm)), grau, hoje) : undefined };
    }),
  };
}
