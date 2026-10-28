import { CATALOGO, buscarDiagnostico } from "./cipe/catalogo";
import { idade } from "./datas";
import { BRADEN, KATZ, MORSE, dependenciasKatz, respostasCompletas, type Respostas } from "./escalas/escalas";
import { sugerirGrau, type Cognicao, type SugestaoGrau } from "./grau";
import type { GrauDependencia, ItemPlano } from "./tipos";

// Admissão do idoso = 1ª etapa do Processo de Enfermagem (Avaliação de Enfermagem,
// Res. COFEN 736/2024), mais os dados de cadastro exigidos pela RDC 502/2021.

export interface Opcao<T extends string> {
  valor: T;
  rotulo: string;
}

const op = <T extends string>(...pares: [T, string][]): Opcao<T>[] => pares.map(([valor, rotulo]) => ({ valor, rotulo }));

export const OPCOES = {
  sexo: op(["F", "Feminino"], ["M", "Masculino"]),
  procedencia: op(["DOMICILIO", "Domicílio"], ["HOSPITAL", "Hospital"], ["OUTRA_ILPI", "Outra ILPI"], ["OUTRA", "Outra"]),
  orientacao: op(["ORIENTADO", "Orientado"], ["DESORIENTADO_EVENTUAL", "Desorientado às vezes"], ["DESORIENTADO", "Desorientado"]),
  cognicao: op<Cognicao>(
    ["PRESERVADA", "Preservada"],
    ["ALTERACAO_CONTROLADA", "Alteração controlada"],
    ["COMPROMETIDA", "Comprometida"],
  ),
  humor: op(["ESTAVEL", "Estável"], ["TRISTE", "Triste/desanimado"], ["ANSIOSO", "Ansioso"], ["AGITADO", "Agitado"]),
  visao: op(["NORMAL", "Normal"], ["USA_OCULOS", "Usa óculos, enxerga bem"], ["BAIXA_VISAO", "Baixa visão"], ["CEGUEIRA", "Cegueira"]),
  audicao: op(["NORMAL", "Normal"], ["PROTESE", "Usa prótese auditiva"], ["DEFICIT", "Déficit sem prótese"]),
  comunicacao: op(["VERBAL", "Verbal"], ["LIMITADA", "Limitada"], ["NAO_VERBAL", "Não verbal"]),
  sono: op(["PRESERVADO", "Preservado"], ["PREJUDICADO", "Prejudicado"]),
  deambulacao: op(
    ["INDEPENDENTE", "Independente"],
    ["DISPOSITIVO", "Com dispositivo"],
    ["AUXILIO", "Com auxílio de pessoa"],
    ["CADEIRA", "Cadeira de rodas"],
    ["ACAMADO", "Acamado"],
  ),
  dieta: op(["LIVRE", "Livre"], ["BRANDA", "Branda"], ["PASTOSA", "Pastosa"], ["LIQUIDA", "Líquida"], ["ENTERAL", "Enteral (sonda)"]),
  degluticao: op(["NORMAL", "Normal"], ["DISFAGIA", "Disfagia"]),
  aceitacao: op(["BOA", "Boa"], ["REGULAR", "Regular"], ["RUIM", "Ruim"]),
  urinaria: op(["CONTINENTE", "Continente"], ["OCASIONAL", "Incontinência ocasional"], ["INCONTINENTE", "Incontinente"], ["SONDA", "Sonda vesical"]),
  intestinal: op(["NORMAL", "Normal"], ["CONSTIPACAO", "Constipação"], ["INCONTINENCIA", "Incontinência"], ["DIARREIA", "Diarreia"]),
  tipoLesao: op(
    ["LPP", "Lesão por pressão"],
    ["FRICCAO", "Lesão por fricção"],
    ["VENOSA", "Úlcera venosa"],
    ["ARTERIAL", "Úlcera arterial"],
    ["DERMATITE", "Dermatite"],
    ["OUTRA", "Outra"],
  ),
  dispositivos: op(
    ["SVD", "Sonda vesical"],
    ["SNE", "Sonda nasoenteral"],
    ["GTT", "Gastrostomia"],
    ["O2", "Oxigenoterapia"],
    ["TQT", "Traqueostomia"],
    ["OSTOMIA", "Ostomia intestinal"],
  ),
};

type Valor<K extends keyof typeof OPCOES> = (typeof OPCOES)[K][number]["valor"];

export interface LesaoPele {
  id: string;
  local: string;
  tipo: Valor<"tipoLesao">;
  descricao: string;
}

export interface SinaisVitais {
  pas?: number;
  pad?: number;
  fc?: number;
  fr?: number;
  temperatura?: number;
  spo2?: number;
  glicemia?: number;
  dor?: number;
  peso?: number;
  altura?: number;
}

export interface DadosAdmissao {
  identificacao: {
    nome: string;
    nomeSocial: string;
    nascimento: string;
    sexo: Valor<"sexo"> | "";
    cpf: string;
    cns: string;
    dataAdmissao: string;
    quarto: string;
    leito: string;
    procedencia: Valor<"procedencia"> | "";
    procedenciaDetalhe: string;
    responsavelNome: string;
    responsavelParentesco: string;
    responsavelTelefone: string;
  };
  saude: {
    diagnosticosMedicos: string;
    alergias: string;
    semAlergiasConhecidas: boolean;
    medicamentosEmUso: string;
    internacaoUltimos6m: boolean;
    quedasUltimos12m: number;
    dispositivos: Valor<"dispositivos">[];
  };
  sinaisVitais: SinaisVitais;
  exame: {
    orientacao: Valor<"orientacao"> | "";
    cognicao: Cognicao | "";
    memoriaPrejudicada: boolean;
    confusaoAguda: boolean;
    perambulacao: boolean;
    humor: Valor<"humor"> | "";
    isolamento: boolean;
    visao: Valor<"visao"> | "";
    audicao: Valor<"audicao"> | "";
    comunicacao: Valor<"comunicacao"> | "";
    sono: Valor<"sono"> | "";
    deambulacao: Valor<"deambulacao"> | "";
    dieta: Valor<"dieta"> | "";
    degluticao: Valor<"degluticao"> | "";
    aceitacao: Valor<"aceitacao"> | "";
    perdaPeso: boolean;
    ingestaoHidricaBaixa: boolean;
    restricaoHidrica: boolean;
    urinaria: Valor<"urinaria"> | "";
    intestinal: Valor<"intestinal"> | "";
    edema: boolean;
    dorCronica: boolean;
    lesoes: LesaoPele[];
  };
  escalas: { MORSE: Respostas; BRADEN: Respostas; KATZ: Respostas };
  grau: { confirmado: GrauDependencia | ""; justificativa: string };
  plano: ItemPlano[];
  observacoes: string;
}

export function admissaoVazia(dataAdmissao: string): DadosAdmissao {
  return {
    identificacao: {
      nome: "",
      nomeSocial: "",
      nascimento: "",
      sexo: "",
      cpf: "",
      cns: "",
      dataAdmissao,
      quarto: "",
      leito: "",
      procedencia: "",
      procedenciaDetalhe: "",
      responsavelNome: "",
      responsavelParentesco: "",
      responsavelTelefone: "",
    },
    saude: {
      diagnosticosMedicos: "",
      alergias: "",
      semAlergiasConhecidas: false,
      medicamentosEmUso: "",
      internacaoUltimos6m: false,
      quedasUltimos12m: 0,
      dispositivos: [],
    },
    sinaisVitais: {},
    exame: {
      orientacao: "",
      cognicao: "",
      memoriaPrejudicada: false,
      confusaoAguda: false,
      perambulacao: false,
      humor: "",
      isolamento: false,
      visao: "",
      audicao: "",
      comunicacao: "",
      sono: "",
      deambulacao: "",
      dieta: "",
      degluticao: "",
      aceitacao: "",
      perdaPeso: false,
      ingestaoHidricaBaixa: false,
      restricaoHidrica: false,
      urinaria: "",
      intestinal: "",
      edema: false,
      dorCronica: false,
      lesoes: [],
    },
    escalas: { MORSE: {}, BRADEN: {}, KATZ: {} },
    grau: { confirmado: "", justificativa: "" },
    plano: [],
    observacoes: "",
  };
}

// ─── Sinais vitais: faixas plausíveis (fora delas = erro de digitação) ─────────

export const FAIXAS_SINAIS: Record<keyof SinaisVitais, { min: number; max: number; rotulo: string; unidade: string }> = {
  pas: { min: 50, max: 260, rotulo: "PA sistólica", unidade: "mmHg" },
  pad: { min: 30, max: 160, rotulo: "PA diastólica", unidade: "mmHg" },
  fc: { min: 20, max: 220, rotulo: "FC", unidade: "bpm" },
  fr: { min: 5, max: 60, rotulo: "FR", unidade: "irpm" },
  temperatura: { min: 32, max: 43, rotulo: "Temperatura", unidade: "°C" },
  spo2: { min: 50, max: 100, rotulo: "SpO₂", unidade: "%" },
  glicemia: { min: 20, max: 600, rotulo: "Glicemia capilar", unidade: "mg/dL" },
  dor: { min: 0, max: 10, rotulo: "Dor (0–10)", unidade: "" },
  peso: { min: 20, max: 250, rotulo: "Peso", unidade: "kg" },
  altura: { min: 100, max: 220, rotulo: "Altura", unidade: "cm" },
};

export function errosSinaisVitais(sv: SinaisVitais): string[] {
  return (Object.keys(FAIXAS_SINAIS) as (keyof SinaisVitais)[]).flatMap((k) => {
    const v = sv[k];
    const f = FAIXAS_SINAIS[k];
    return v !== undefined && (v < f.min || v > f.max) ? [`${f.rotulo} fora da faixa ${f.min}–${f.max}`] : [];
  });
}

export function imc(sv: SinaisVitais): number | undefined {
  if (!sv.peso || !sv.altura) return undefined;
  const m = sv.altura / 100;
  return Math.round((sv.peso / (m * m)) * 10) / 10;
}

// ─── Grau de dependência a partir do Katz + cognição ───────────────────────────

export function grauSugerido(d: DadosAdmissao): SugestaoGrau | undefined {
  if (!respostasCompletas(KATZ, d.escalas.KATZ) || !d.exame.cognicao) return undefined;
  return sugerirGrau(dependenciasKatz(d.escalas.KATZ).length, d.exame.cognicao);
}

// ─── Sugestão de diagnósticos ──────────────────────────────────────────────────

export interface SugestaoDiagnostico {
  diagnosticoId: string;
  motivos: string[];
}

export function sugerirDiagnosticos(d: DadosAdmissao): SugestaoDiagnostico[] {
  const motivos = new Map<string, string[]>();
  const sugerir = (id: string, motivo: string) => {
    if (!buscarDiagnostico(id)) throw new Error(`Diagnóstico inexistente no catálogo: ${id}`);
    motivos.set(id, [...(motivos.get(id) ?? []), motivo]);
  };
  const { exame: e, saude: s, sinaisVitais: sv, escalas } = d;

  if (respostasCompletas(MORSE, escalas.MORSE)) {
    const r = MORSE.calcular(escalas.MORSE);
    if (r.nivel !== "BAIXO") sugerir("risco-queda", `Morse ${r.pontuacao} (${r.classificacao.toLowerCase()})`);
  }
  if (s.quedasUltimos12m > 0) sugerir("risco-queda", `${s.quedasUltimos12m} queda(s) nos últimos 12 meses`);
  if (e.deambulacao === "DISPOSITIVO" || e.deambulacao === "AUXILIO") {
    sugerir("marcha", "Deambula com dispositivo ou auxílio");
  }

  if (respostasCompletas(BRADEN, escalas.BRADEN)) {
    const r = BRADEN.calcular(escalas.BRADEN);
    if (r.pontuacao <= 18) sugerir("risco-lpp", `Braden ${r.pontuacao} (${r.classificacao.toLowerCase()})`);
  }
  if (e.lesoes.length > 0) sugerir("integridade-pele", `${e.lesoes.length} lesão(ões) de pele na admissão`);

  if (respostasCompletas(KATZ, escalas.KATZ)) {
    const autocuidado = KATZ.itens
      .filter((i) => ["higiene", "vestuario", "vasoSanitario", "alimentacao"].includes(i.id) && escalas.KATZ[i.id] === 0)
      .map((i) => i.titulo.toLowerCase());
    if (autocuidado.length > 0) sugerir("autocuidado", `Katz: dependente em ${autocuidado.join(", ")}`);
    if (escalas.KATZ.continencia === 0 && e.urinaria !== "SONDA") sugerir("incontinencia-urinaria", "Katz: dependente na continência");
  }
  if (e.urinaria === "INCONTINENTE" || e.urinaria === "OCASIONAL") sugerir("incontinencia-urinaria", "Incontinência urinária referida");
  if (e.intestinal === "CONSTIPACAO") sugerir("constipacao", "Constipação referida");

  if (e.orientacao === "DESORIENTADO" || e.orientacao === "DESORIENTADO_EVENTUAL") sugerir("desorientacao", "Desorientação no exame");
  if (e.confusaoAguda) sugerir("confusao-aguda", "Alteração aguda da atenção/consciência");
  if (e.memoriaPrejudicada) sugerir("memoria", "Dificuldade de memória referida/observada");
  if (e.perambulacao) sugerir("perambulacao", "Perambulação referida");

  if (e.visao === "BAIXA_VISAO" || e.visao === "CEGUEIRA") sugerir("visao", "Baixa visão/cegueira");
  if (e.audicao === "PROTESE" || e.audicao === "DEFICIT") sugerir("audicao", "Déficit auditivo");
  if (e.sono === "PREJUDICADO") sugerir("sono", "Sono prejudicado referido");

  const valorImc = imc(sv);
  if (e.perdaPeso) sugerir("nutricao", "Perda de peso recente");
  if (e.aceitacao === "RUIM") sugerir("nutricao", "Aceitação alimentar ruim");
  if (valorImc !== undefined && valorImc < 22) sugerir("nutricao", `IMC ${valorImc} (< 22, baixo peso no idoso)`);
  if (e.degluticao === "DISFAGIA") sugerir("risco-aspiracao", "Disfagia");
  if (e.dieta === "ENTERAL") sugerir("risco-aspiracao", "Dieta enteral");
  if (e.ingestaoHidricaBaixa) sugerir("risco-desidratacao", "Baixa ingestão hídrica");

  if (e.edema) sugerir("edema", "Edema periférico ao exame");
  if (sv.pas !== undefined && (sv.pas >= 140 || sv.pas < 90)) sugerir("pressao-arterial", `PAS ${sv.pas} mmHg (aferição única — confirmar)`);
  else if (sv.pad !== undefined && sv.pad >= 90) sugerir("pressao-arterial", `PAD ${sv.pad} mmHg (aferição única — confirmar)`);
  if (e.dorCronica) sugerir("dor-cronica", "Dor crônica referida");
  else if (sv.dor !== undefined && sv.dor >= 4) sugerir("dor-cronica", `Dor ${sv.dor}/10 na admissão`);

  if (e.humor === "TRISTE") sugerir("humor-deprimido", "Humor triste/desanimado");
  if (e.isolamento) sugerir("isolamento-social", "Isolamento social observado");

  sugerir("estresse-mudanca", "Admissão recente na instituição");

  // Ordem do catálogo, para leitura previsível.
  return CATALOGO.filter((c) => motivos.has(c.id)).map((c) => ({ diagnosticoId: c.id, motivos: motivos.get(c.id)! }));
}

/** Cria o item do plano a partir do catálogo, com o aprazamento padrão. */
export function itemDoCatalogo(diagnosticoId: string, justificativa: string): ItemPlano {
  const modelo = buscarDiagnostico(diagnosticoId);
  if (!modelo) throw new Error(`Diagnóstico inexistente no catálogo: ${diagnosticoId}`);
  return {
    diagnosticoId: modelo.id,
    diagnostico: modelo.diagnostico,
    resultado: modelo.resultado,
    ciap: modelo.ciap,
    justificativa,
    intervencoes: modelo.intervencoes.map((i) => ({
      intervencaoId: i.id,
      cipe: i.cipe,
      descricao: i.descricao,
      aprazamento: { horarios: [...i.aprazamento.horarios], diasSemana: i.aprazamento.diasSemana },
      executor: i.executor,
      exigeJustificativa: i.exigeJustificativa,
    })),
  };
}

// ─── Pendências para concluir a admissão ───────────────────────────────────────

export interface Pendencia {
  etapa: number;
  mensagem: string;
}

export function pendenciasAdmissao(d: DadosAdmissao, hoje: string): Pendencia[] {
  const p: Pendencia[] = [];
  const add = (etapa: number, mensagem: string) => p.push({ etapa, mensagem });
  const id = d.identificacao;

  if (id.nome.trim().length < 3) add(0, "Informe o nome completo");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(id.nascimento)) add(0, "Informe a data de nascimento");
  else if (id.nascimento > hoje) add(0, "Data de nascimento no futuro");
  else if (idade(id.nascimento, hoje) < 60) add(0, "Residente com menos de 60 anos: confira a data de nascimento");
  if (!id.dataAdmissao) add(0, "Informe a data de admissão");
  else if (id.dataAdmissao > hoje) add(0, "Data de admissão no futuro");
  if (!id.quarto.trim()) add(0, "Informe o quarto");
  if (!id.responsavelNome.trim() || !id.responsavelTelefone.trim()) add(0, "Informe o responsável e o telefone");

  if (!d.saude.semAlergiasConhecidas && !d.saude.alergias.trim()) {
    add(1, "Registre as alergias ou marque “sem alergias conhecidas”");
  }

  const sv = d.sinaisVitais;
  if (sv.pas === undefined || sv.pad === undefined || sv.fc === undefined) add(2, "Registre ao menos PA e FC");
  for (const erro of errosSinaisVitais(sv)) add(2, erro);
  if (!d.exame.orientacao || !d.exame.cognicao) add(2, "Avalie orientação e cognição");
  if (!d.exame.deambulacao) add(2, "Avalie a deambulação");
  if (d.exame.lesoes.some((l) => !l.local.trim())) add(2, "Informe o local de todas as lesões de pele");

  if (!respostasCompletas(KATZ, d.escalas.KATZ)) add(3, "Complete o Índice de Katz");
  if (!respostasCompletas(MORSE, d.escalas.MORSE)) add(3, "Complete a Escala de Morse");
  if (!respostasCompletas(BRADEN, d.escalas.BRADEN)) add(3, "Complete a Escala de Braden");
  const sugestao = grauSugerido(d);
  if (!d.grau.confirmado) add(3, "Confirme o grau de dependência");
  else if (sugestao && (sugestao.exigeConfirmacao || sugestao.grau !== d.grau.confirmado) && d.grau.justificativa.trim().length < 10) {
    add(3, "Justifique o grau de dependência escolhido");
  }

  if (d.plano.length === 0) add(4, "Selecione ao menos um diagnóstico de enfermagem");
  for (const item of d.plano) {
    if (item.intervencoes.length === 0) add(4, `“${item.diagnostico.termo}” está sem intervenções`);
  }
  return p;
}
