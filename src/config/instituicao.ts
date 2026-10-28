import type { GrauDependencia } from "@/domain/tipos";

// Parâmetros da instituição. Valores marcados "A CONFIRMAR" são suposições do protótipo
// e devem ser ajustados com base no impresso de SAE/escalas usado hoje na ILPI.

export const INSTITUICAO = {
  nome: "ILPI (demonstração)",

  /** Plantões de 12 h. O noturno começa num dia e termina no seguinte. */
  turnos: {
    DIURNO: { inicio: "07:00", fim: "19:00" },
    NOTURNO: { inicio: "19:00", fim: "07:00" },
  },

  /**
   * Intervalo (dias) entre revisões da SAE por grau de dependência.
   * Fluxo informado: graus I e II com intervalo maior; grau III diário.
   * A CONFIRMAR: intervalos exatos dos graus I e II.
   */
  revisaoSaeDias: { I: 30, II: 15, III: 1 } satisfies Record<GrauDependencia, number>,

  /**
   * Intervalo (dias) para reaplicar Morse e Braden, além das reavaliações por evento
   * (queda, internação, mudança do quadro). A CONFIRMAR com o impresso da instituição.
   */
  reavaliacaoEscalasDias: { I: 30, II: 15, III: 7 } satisfies Record<GrauDependencia, number>,

  /** Atraso tolerado antes de um horário aparecer como "atrasado" na checagem. */
  toleranciaAtrasoMin: 60,
};

export type Turno = keyof typeof INSTITUICAO.turnos;
