import { INSTITUICAO } from "@/config/instituicao";
import { diferencaDias, somarDias } from "./datas";
import type { GrauDependencia } from "./tipos";

export type SituacaoPrazo = "EM_DIA" | "VENCE_HOJE" | "VENCIDA";

export interface Prazo {
  previstoPara: string;
  situacao: SituacaoPrazo;
  diasRestantes: number;
}

export function calcularPrazo(ultima: string, intervaloDias: number, hoje: string): Prazo {
  const previstoPara = somarDias(ultima.slice(0, 10), intervaloDias);
  const diasRestantes = diferencaDias(hoje, previstoPara);
  const situacao: SituacaoPrazo = diasRestantes < 0 ? "VENCIDA" : diasRestantes === 0 ? "VENCE_HOJE" : "EM_DIA";
  return { previstoPara, situacao, diasRestantes };
}

export function prazoRevisaoSae(ultimaRevisao: string, grau: GrauDependencia, hoje: string): Prazo {
  return calcularPrazo(ultimaRevisao, INSTITUICAO.revisaoSaeDias[grau], hoje);
}

export function prazoEscala(ultimaAplicacao: string, grau: GrauDependencia, hoje: string): Prazo {
  return calcularPrazo(ultimaAplicacao, INSTITUICAO.reavaliacaoEscalasDias[grau], hoje);
}
