// Escalas de avaliação. Funções puras: a pontuação é sempre recalculada a partir
// das respostas (nunca confiar em total enviado pela interface).

export type EscalaId = "MORSE" | "BRADEN" | "KATZ";

export interface OpcaoItem {
  valor: number;
  rotulo: string;
}

export interface ItemEscala {
  id: string;
  titulo: string;
  opcoes: OpcaoItem[];
}

export interface ResultadoEscala {
  pontuacao: number;
  classificacao: string;
  nivel: "BAIXO" | "MEDIO" | "ALTO";
}

export interface DefinicaoEscala {
  id: EscalaId;
  nome: string;
  referencia: string;
  itens: ItemEscala[];
  calcular: (respostas: Respostas) => ResultadoEscala;
}

export type Respostas = Record<string, number>;

export function respostasCompletas(def: DefinicaoEscala, respostas: Respostas): boolean {
  return def.itens.every((item) => item.opcoes.some((o) => o.valor === respostas[item.id]));
}

function somar(def: DefinicaoEscala, respostas: Respostas): number {
  return def.itens.reduce((total, item) => {
    const valor = respostas[item.id];
    if (!item.opcoes.some((o) => o.valor === valor)) {
      throw new Error(`Resposta inválida para "${item.titulo}" na escala ${def.nome}`);
    }
    return total + valor;
  }, 0);
}

// ─── Morse (versão brasileira, Urbanetto et al.) ─────────────────────────────

export const MORSE: DefinicaoEscala = {
  id: "MORSE",
  nome: "Escala de Quedas de Morse",
  referencia: "Versão brasileira (Urbanetto et al., 2013)",
  itens: [
    {
      id: "historico",
      titulo: "Histórico de quedas",
      opcoes: [
        { valor: 0, rotulo: "Não" },
        { valor: 25, rotulo: "Sim" },
      ],
    },
    {
      id: "diagnosticoSecundario",
      titulo: "Diagnóstico secundário",
      opcoes: [
        { valor: 0, rotulo: "Não" },
        { valor: 15, rotulo: "Sim" },
      ],
    },
    {
      id: "auxilio",
      titulo: "Auxílio na deambulação",
      opcoes: [
        { valor: 0, rotulo: "Nenhum, acamado ou auxiliado por profissional" },
        { valor: 15, rotulo: "Muletas, bengala ou andador" },
        { valor: 30, rotulo: "Apoia-se no mobiliário" },
      ],
    },
    {
      id: "terapiaEv",
      titulo: "Terapia endovenosa / dispositivo salinizado",
      opcoes: [
        { valor: 0, rotulo: "Não" },
        { valor: 20, rotulo: "Sim" },
      ],
    },
    {
      id: "marcha",
      titulo: "Marcha",
      opcoes: [
        { valor: 0, rotulo: "Normal, sem deambulação ou acamado" },
        { valor: 10, rotulo: "Fraca" },
        { valor: 20, rotulo: "Comprometida, cambaleante" },
      ],
    },
    {
      id: "estadoMental",
      titulo: "Estado mental",
      opcoes: [
        { valor: 0, rotulo: "Orientado quanto à própria capacidade" },
        { valor: 15, rotulo: "Superestima a capacidade ou esquece limitações" },
      ],
    },
  ],
  calcular(respostas) {
    const pontuacao = somar(MORSE, respostas);
    if (pontuacao >= 45) return { pontuacao, classificacao: "Risco alto", nivel: "ALTO" };
    if (pontuacao >= 25) return { pontuacao, classificacao: "Risco médio", nivel: "MEDIO" };
    return { pontuacao, classificacao: "Risco baixo", nivel: "BAIXO" };
  },
};

// ─── Braden ──────────────────────────────────────────────────────────────────

const BRADEN_1_4 = (r1: string, r2: string, r3: string, r4: string): OpcaoItem[] => [
  { valor: 1, rotulo: r1 },
  { valor: 2, rotulo: r2 },
  { valor: 3, rotulo: r3 },
  { valor: 4, rotulo: r4 },
];

export const BRADEN: DefinicaoEscala = {
  id: "BRADEN",
  nome: "Escala de Braden",
  referencia: "Versão brasileira (Paranhos e Santos, 1999)",
  itens: [
    {
      id: "percepcao",
      titulo: "Percepção sensorial",
      opcoes: BRADEN_1_4("Totalmente limitado", "Muito limitado", "Levemente limitado", "Nenhuma limitação"),
    },
    {
      id: "umidade",
      titulo: "Umidade",
      opcoes: BRADEN_1_4("Completamente molhada", "Muito molhada", "Ocasionalmente molhada", "Raramente molhada"),
    },
    {
      id: "atividade",
      titulo: "Atividade",
      opcoes: BRADEN_1_4("Acamado", "Confinado à cadeira", "Anda ocasionalmente", "Anda frequentemente"),
    },
    {
      id: "mobilidade",
      titulo: "Mobilidade",
      opcoes: BRADEN_1_4("Totalmente imóvel", "Bastante limitado", "Levemente limitado", "Não apresenta limitações"),
    },
    {
      id: "nutricao",
      titulo: "Nutrição",
      opcoes: BRADEN_1_4("Muito pobre", "Provavelmente inadequada", "Adequada", "Excelente"),
    },
    {
      id: "friccao",
      titulo: "Fricção e cisalhamento",
      opcoes: [
        { valor: 1, rotulo: "Problema" },
        { valor: 2, rotulo: "Problema em potencial" },
        { valor: 3, rotulo: "Nenhum problema" },
      ],
    },
  ],
  calcular(respostas) {
    const pontuacao = somar(BRADEN, respostas);
    if (pontuacao <= 9) return { pontuacao, classificacao: "Risco muito alto", nivel: "ALTO" };
    if (pontuacao <= 12) return { pontuacao, classificacao: "Risco alto", nivel: "ALTO" };
    if (pontuacao <= 14) return { pontuacao, classificacao: "Risco moderado", nivel: "MEDIO" };
    if (pontuacao <= 18) return { pontuacao, classificacao: "Risco baixo", nivel: "BAIXO" };
    return { pontuacao, classificacao: "Sem risco", nivel: "BAIXO" };
  },
};

// ─── Katz (Anexo 7 do Manual de Enfermagem – Pessoa Idosa, SMS-SP 2016) ──────
// Cada função: valor 1 = independente, 0 = dependente. Pontuação = nº de funções independentes.

export const KATZ: DefinicaoEscala = {
  id: "KATZ",
  nome: "Índice de Katz (ABVD)",
  referencia: "Manual de Enfermagem – Pessoa Idosa, SMS-SP, Anexo 7",
  itens: [
    {
      id: "higiene",
      titulo: "Higiene (banho)",
      opcoes: [
        { valor: 1, rotulo: "Não recebe ajuda ou só em uma parte do corpo" },
        { valor: 0, rotulo: "Ajuda em mais de uma parte do corpo, ou para entrar/sair do banho" },
      ],
    },
    {
      id: "vestuario",
      titulo: "Vestuário",
      opcoes: [
        { valor: 1, rotulo: "Veste-se sem ajuda (exceto amarrar sapatos)" },
        { valor: 0, rotulo: "Recebe ajuda para pegar a roupa ou vestir-se" },
      ],
    },
    {
      id: "vasoSanitario",
      titulo: "Uso do vaso sanitário",
      opcoes: [
        { valor: 1, rotulo: "Usa, limpa-se e veste-se sem ajuda" },
        { valor: 0, rotulo: "Recebe ajuda ou não vai ao vaso sanitário" },
      ],
    },
    {
      id: "mobilizacao",
      titulo: "Mobilização (transferência)",
      opcoes: [
        { valor: 1, rotulo: "Entra e sai da cama, senta e levanta sem ajuda" },
        { valor: 0, rotulo: "Precisa de ajuda ou não levanta da cama" },
      ],
    },
    {
      id: "continencia",
      titulo: "Continência",
      opcoes: [
        { valor: 1, rotulo: "Controla completamente ambos os esfíncteres" },
        { valor: 0, rotulo: "Incontinência ocasional, supervisão, sonda ou incontinente" },
      ],
    },
    {
      id: "alimentacao",
      titulo: "Alimentação",
      opcoes: [
        { valor: 1, rotulo: "Sem ajuda (ou só para cortar a carne/passar manteiga)" },
        { valor: 0, rotulo: "Ajuda parcial ou total, sonda ou endovenosa" },
      ],
    },
  ],
  calcular(respostas) {
    const pontuacao = somar(KATZ, respostas);
    if (pontuacao === 6) return { pontuacao, classificacao: "Independente", nivel: "BAIXO" };
    if (pontuacao === 0) return { pontuacao, classificacao: "Dependente total", nivel: "ALTO" };
    return { pontuacao, classificacao: `Dependente parcial (${6 - pontuacao} de 6 funções)`, nivel: "MEDIO" };
  },
};

export const ESCALAS: Record<EscalaId, DefinicaoEscala> = { MORSE, BRADEN, KATZ };

/** Funções do Katz em que o residente é dependente. */
export function dependenciasKatz(respostas: Respostas): string[] {
  return KATZ.itens.filter((i) => respostas[i.id] === 0).map((i) => i.titulo);
}
