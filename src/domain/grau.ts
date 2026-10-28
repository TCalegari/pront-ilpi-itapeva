import type { GrauDependencia } from "./tipos";

// RDC ANVISA 502/2021 – grau de dependência:
//  I   – independentes, mesmo que usem equipamentos de autoajuda;
//  II  – dependência em até três atividades de autocuidado, sem comprometimento
//        cognitivo ou com alteração cognitiva controlada;
//  III – dependência que requeira assistência em todas as atividades de autocuidado
//        e/ou com comprometimento cognitivo.
// A norma não classifica 4–5 dependências sem comprometimento cognitivo: o sistema
// sugere o grau III (mais protetivo) e exige confirmação do enfermeiro.

export type Cognicao = "PRESERVADA" | "ALTERACAO_CONTROLADA" | "COMPROMETIDA";

export interface SugestaoGrau {
  grau: GrauDependencia;
  motivo: string;
  exigeConfirmacao: boolean;
}

export function sugerirGrau(numeroDependencias: number, cognicao: Cognicao): SugestaoGrau {
  if (!Number.isInteger(numeroDependencias) || numeroDependencias < 0 || numeroDependencias > 6) {
    throw new Error("Número de dependências deve estar entre 0 e 6");
  }
  if (cognicao === "COMPROMETIDA") {
    return { grau: "III", motivo: "Comprometimento cognitivo", exigeConfirmacao: false };
  }
  if (numeroDependencias === 6) {
    return { grau: "III", motivo: "Dependente em todas as atividades de autocuidado", exigeConfirmacao: false };
  }
  if (numeroDependencias >= 4) {
    return {
      grau: "III",
      motivo: `Dependente em ${numeroDependencias} atividades: situação não prevista na RDC 502 — sugerido grau III`,
      exigeConfirmacao: true,
    };
  }
  if (numeroDependencias >= 1) {
    return {
      grau: "II",
      motivo: `Dependente em ${numeroDependencias} atividade(s) de autocuidado`,
      exigeConfirmacao: false,
    };
  }
  return { grau: "I", motivo: "Independente nas atividades de autocuidado", exigeConfirmacao: false };
}
