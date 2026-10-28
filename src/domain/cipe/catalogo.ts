import type { DiagnosticoModelo } from "../tipos";

// Catálogo de diagnósticos de enfermagem para ILPI.
//
// Códigos CIPE® conferidos, um a um, na CIPE® 2019 – Português do Brasil (ICN, 04/09/2019).
// Enunciados alinhados ao subconjunto terminológico para idosos institucionalizados
// (Fernandes et al., Rev Científica Integrada 2023). Prevalências: Fernandes et al.,
// Rev Esc Enferm USP 2019;53:e03472 (n = 203, uma ILPI). CIAP-2 conferido no CIAP Brasil.
//
// Regra: um diagnóstico = um foco + um julgamento (ISO 18104). Não fundir diagnósticos.
// A descrição da intervenção é operacional (da instituição); o conceito CIPE® é o mais próximo.
// O aprazamento é apenas o padrão sugerido: o enfermeiro individualiza ao prescrever.

const TURNOS = ["07:00", "19:00"];
const REFEICOES = ["07:30", "11:30", "15:00", "18:30"];
const DE_2_EM_2H = ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];
const DE_4_EM_4H = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"];

export const CATALOGO: DiagnosticoModelo[] = [
  {
    id: "risco-queda",
    necessidade: "Mover-se e manter postura",
    ciap: [
      { codigo: "A80", titulo: "Lesão traumática/acidente NE (quedas)" },
      { codigo: "N17", titulo: "Vertigem/tontura" },
    ],
    diagnostico: { codigo: "10015122", termo: "Risco de Queda" },
    resultado: { codigo: "10034704", termo: "Queda, Ausente" },
    prevalenciaReferencia: 78,
    intervencoes: [
      {
        id: "queda-prevencao",
        cipe: { codigo: "10040211", termo: "Prevenção de Queda" },
        descricao:
          "Manter cama baixa e travada, campainha e pertences ao alcance. Grades somente se prescritas individualmente.",
        aprazamento: { horarios: TURNOS },
        executor: "TECNICO",
        exigeJustificativa: true,
      },
      {
        id: "queda-ambiente",
        cipe: { codigo: "10042507", termo: "Manejar (Controlar) Segurança Ambiental" },
        descricao: "Inspecionar piso seco, iluminação noturna acesa e calçado fechado antiderrapante.",
        aprazamento: { horarios: ["08:00", "20:00"] },
        executor: "TECNICO",
        exigeJustificativa: false,
      },
      {
        id: "queda-transferencia",
        cipe: { codigo: "10041135", termo: "Usar Técnica de Transferência" },
        descricao: "Supervisionar ou auxiliar transferências cama–cadeira–banheiro.",
        aprazamento: { horarios: [] },
        executor: "TECNICO",
        exigeJustificativa: false,
      },
    ],
  },
  {
    id: "visao",
    necessidade: "Evitar perigos",
    ciap: [
      { codigo: "F05", titulo: "Outras perturbações visuais" },
      { codigo: "F92", titulo: "Cataratas" },
      { codigo: "F94", titulo: "Cegueira" },
    ],
    diagnostico: { codigo: "10022748", termo: "Visão, Prejudicada" },
    resultado: { codigo: "10034704", termo: "Queda, Ausente" },
    prevalenciaReferencia: 43,
    intervencoes: [
      {
        id: "visao-oculos-ambiente",
        cipe: { codigo: "10042507", termo: "Manejar (Controlar) Segurança Ambiental" },
        descricao: "Higienizar e entregar os óculos; manter pertences no mesmo lugar e trajeto livre de obstáculos.",
        aprazamento: { horarios: ["07:30"] },
        executor: "TECNICO",
        exigeJustificativa: true,
      },
    ],
  },
  {
    id: "desorientacao",
    necessidade: "Aprender",
    ciap: [{ codigo: "P70", titulo: "Demência" }],
    diagnostico: { codigo: "10001235", termo: "Desorientação" },
    resultado: { codigo: "10028586", termo: "Orientação, Melhorada (ou Aumentada)" },
    prevalenciaReferencia: 36,
    intervencoes: [
      {
        id: "desorientacao-realidade",
        cipe: { codigo: "10041072", termo: "Terapia de Orientação para a Realidade" },
        descricao: "Orientar com calma sobre dia, local e pessoas; manter calendário e relógio visíveis.",
        aprazamento: { horarios: ["08:00", "14:00", "20:00"] },
        executor: "TECNICO",
        exigeJustificativa: false,
      },
      {
        id: "desorientacao-monitorar",
        cipe: { codigo: "10045424", termo: "Monitorar Confusão" },
        descricao:
          "Observar agitação vespertina e piora súbita da confusão. Piora súbita: comunicar o enfermeiro (possível delirium).",
        aprazamento: { horarios: ["18:00", "00:00"] },
        executor: "TECNICO",
        exigeJustificativa: true,
      },
    ],
  },
  {
    id: "confusao-aguda",
    necessidade: "Evitar perigos",
    ciap: [{ codigo: "P71", titulo: "Outras psicoses orgânicas NE (delirium)" }],
    diagnostico: { codigo: "10000449", termo: "Confusão, Aguda" },
    resultado: { codigo: "10028847", termo: "Confusão, Ausente" },
    prevalenciaReferencia: 1,
    observacao:
      "Delirium é quadro agudo: comunicar o médico. O protocolo SMS-SP (2025) usa CIAP P99; a tabela CIAP–CID mapeia delirium (F05) para P71.",
    intervencoes: [
      {
        id: "confusao-monitorar",
        cipe: { codigo: "10045424", termo: "Monitorar Confusão" },
        descricao: "Avaliar nível de consciência, atenção e agitação; registrar mudanças.",
        aprazamento: { horarios: DE_4_EM_4H },
        executor: "TECNICO",
        exigeJustificativa: true,
      },
      {
        id: "confusao-sinais-vitais",
        cipe: { codigo: "10032113", termo: "Monitorar Sinais Vitais" },
        descricao: "Aferir PA, FC, FR, temperatura, SpO₂ e glicemia capilar; comunicar alterações.",
        aprazamento: { horarios: ["06:00", "12:00", "18:00", "00:00"] },
        executor: "TECNICO",
        exigeJustificativa: true,
      },
    ],
  },
  {
    id: "memoria",
    necessidade: "Aprender",
    ciap: [{ codigo: "P20", titulo: "Alterações da memória" }],
    diagnostico: { codigo: "10001203", termo: "Memória, Prejudicada" },
    resultado: { codigo: "10030192", termo: "Adesão ao Regime Medicamentoso" },
    prevalenciaReferencia: 26,
    observacao: "A administração em si segue a prescrição médica; aqui se prescreve a supervisão.",
    intervencoes: [
      {
        id: "memoria-adesao",
        cipe: { codigo: "10043878", termo: "Monitorar Adesão à Medicação" },
        descricao: "Supervisionar a ingestão de todos os medicamentos; nunca deixar medicamento no quarto.",
        aprazamento: { horarios: [] },
        executor: "TECNICO",
        exigeJustificativa: false,
      },
    ],
  },
  {
    id: "sono",
    necessidade: "Dormir e repousar",
    ciap: [{ codigo: "P06", titulo: "Perturbação do sono" }],
    diagnostico: { codigo: "10027226", termo: "Sono, Prejudicado" },
    resultado: { codigo: "10024930", termo: "Sono, Adequado" },
    prevalenciaReferencia: 25,
    intervencoes: [
      {
        id: "sono-promover",
        cipe: { codigo: "10050949", termo: "Promover Sono" },
        descricao: "Reduzir luz e ruído; evitar procedimentos não urgentes durante o sono.",
        aprazamento: { horarios: ["22:00"] },
        executor: "TECNICO",
        exigeJustificativa: false,
      },
      {
        id: "sono-registrar",
        cipe: { codigo: "10036764", termo: "Obter Dados sobre Sono" },
        descricao: "Registrar padrão de sono e despertares da noite.",
        aprazamento: { horarios: ["06:00"] },
        executor: "TECNICO",
        exigeJustificativa: true,
      },
    ],
  },
  {
    id: "marcha",
    necessidade: "Mover-se e manter postura",
    ciap: [{ codigo: "L28", titulo: "Limitação funcional/incapacidade (L)" }],
    diagnostico: { codigo: "10001046", termo: "Marcha (Caminhada), Prejudicada" },
    resultado: { codigo: "10028333", termo: "Capaz de Andar (Caminhar)" },
    prevalenciaReferencia: 23,
    intervencoes: [
      {
        id: "marcha-auxiliar",
        cipe: { codigo: "10036520", termo: "Auxiliar na Marcha (Caminhada) com Uso de Dispositivo" },
        descricao: "Auxiliar a deambulação com o dispositivo indicado (andador/bengala).",
        aprazamento: { horarios: ["09:00", "15:00"] },
        executor: "TECNICO",
        exigeJustificativa: true,
      },
    ],
  },
  {
    id: "autocuidado",
    necessidade: "Manter-se limpo e proteger o tegumento",
    ciap: [{ codigo: "A28", titulo: "Limitação funcional/incapacidade NE" }],
    diagnostico: { codigo: "10023410", termo: "Déficit de Autocuidado" },
    resultado: { codigo: "10025714", termo: "Capaz de Executar o Autocuidado" },
    prevalenciaReferencia: 21,
    intervencoes: [
      {
        id: "autocuidado-higiene",
        cipe: { codigo: "10030821", termo: "Auxiliar na Higiene" },
        descricao: "Banho assistido, estimulando o que o residente consegue fazer sozinho.",
        aprazamento: { horarios: ["08:00"] },
        executor: "TECNICO",
        exigeJustificativa: true,
      },
      {
        id: "autocuidado-oral",
        cipe: { codigo: "10032483", termo: "Promover Higiene Oral (ou Bucal)" },
        descricao: "Higiene oral e da prótese dentária após as refeições principais.",
        aprazamento: { horarios: ["08:00", "12:30", "19:30"] },
        executor: "TECNICO",
        exigeJustificativa: false,
      },
    ],
  },
  {
    id: "risco-lpp",
    necessidade: "Manter-se limpo e proteger o tegumento",
    ciap: [{ codigo: "A28", titulo: "Limitação funcional/incapacidade NE" }],
    diagnostico: { codigo: "10027337", termo: "Risco de Úlcera (Lesão) por Pressão" },
    resultado: { codigo: "10029065", termo: "Úlcera (Lesão) por Pressão, Ausente" },
    prevalenciaReferencia: 9,
    intervencoes: [
      {
        id: "lpp-decubito",
        cipe: { codigo: "10014761", termo: "Posicionar Paciente" },
        descricao: "Mudança de decúbito conforme relógio postural; proteger proeminências ósseas.",
        aprazamento: { horarios: DE_2_EM_2H },
        executor: "TECNICO",
        exigeJustificativa: true,
      },
      {
        id: "lpp-inspecionar",
        cipe: { codigo: "10051712", termo: "Monitorar a Integridade da Pele" },
        descricao: "Inspecionar sacro, calcâneos e trocânteres no banho; hidratar a pele.",
        aprazamento: { horarios: ["08:30"] },
        executor: "TECNICO",
        exigeJustificativa: true,
      },
      {
        id: "lpp-prevencao",
        cipe: { codigo: "10040224", termo: "Prevenção de Úlcera (Lesão) por Pressão" },
        descricao: "Manter lençóis secos e sem dobras; superfície de redistribuição de pressão se Braden ≤ 12.",
        aprazamento: { horarios: TURNOS },
        executor: "TECNICO",
        exigeJustificativa: false,
      },
    ],
  },
  {
    id: "integridade-pele",
    necessidade: "Manter-se limpo e proteger o tegumento",
    ciap: [{ codigo: "S97", titulo: "Úlcera crônica da pele" }],
    diagnostico: { codigo: "10001290", termo: "Integridade da Pele, Prejudicada" },
    resultado: { codigo: "10028517", termo: "Integridade da Pele, Melhorada" },
    prevalenciaReferencia: 3,
    intervencoes: [
      {
        id: "pele-curativo",
        cipe: { codigo: "10032420", termo: "Cuidados com Úlcera (Lesão) por Pressão" },
        descricao: "Curativo conforme protocolo/prescrição; registrar aspecto da lesão.",
        aprazamento: { horarios: ["09:00"] },
        executor: "ENFERMEIRO",
        exigeJustificativa: true,
      },
    ],
  },
  {
    id: "audicao",
    necessidade: "Comunicar-se",
    ciap: [
      { codigo: "H02", titulo: "Problemas de audição" },
      { codigo: "H86", titulo: "Surdez" },
    ],
    diagnostico: { codigo: "10022544", termo: "Audição, Prejudicada" },
    resultado: { codigo: "10025025", termo: "Capaz de Comunicar-se" },
    prevalenciaReferencia: 20,
    intervencoes: [
      {
        id: "audicao-protese",
        cipe: { codigo: "10045067", termo: "Orientar sobre Aparelho Auditivo" },
        descricao: "Checar e colocar a prótese auditiva; falar de frente, pausadamente, sem gritar.",
        aprazamento: { horarios: ["08:00"] },
        executor: "TECNICO",
        exigeJustificativa: false,
      },
    ],
  },
  {
    id: "incontinencia-urinaria",
    necessidade: "Eliminar",
    ciap: [{ codigo: "U04", titulo: "Incontinência urinária" }],
    diagnostico: { codigo: "10025686", termo: "Incontinência Urinária" },
    resultado: { codigo: "10028501", termo: "Integridade da Pele, Eficaz" },
    prevalenciaReferencia: 19,
    observacao: "Subtipos: 10026778 Funcional, 10026811 de Urgência, 10026797 de Esforço, 10026914 por Transbordamento.",
    intervencoes: [
      {
        id: "iu-rotina-vesical",
        cipe: { codigo: "10037691", termo: "Promover Rotina Vesical" },
        descricao: "Oferecer ida ao banheiro ou comadre/papagaio em horários programados.",
        aprazamento: { horarios: ["08:00", "11:00", "14:00", "17:00", "20:00"] },
        executor: "TECNICO",
        exigeJustificativa: false,
      },
      {
        id: "iu-fralda",
        cipe: { codigo: "10045154", termo: "Cuidados Perineais" },
        descricao: "Verificar e trocar fralda; higiene íntima e creme de barreira.",
        aprazamento: { horarios: DE_4_EM_4H },
        executor: "TECNICO",
        exigeJustificativa: true,
      },
    ],
  },
  {
    id: "constipacao",
    necessidade: "Eliminar",
    ciap: [{ codigo: "D12", titulo: "Obstipação" }],
    diagnostico: { codigo: "10000567", termo: "Constipação" },
    resultado: { codigo: "10028403", termo: "Defecação, Eficaz" },
    prevalenciaReferencia: 15,
    intervencoes: [
      {
        id: "constipacao-monitorar",
        cipe: { codigo: "10037211", termo: "Monitorar Motilidade Intestinal" },
        descricao: "Registrar evacuação e aspecto (Bristol); comunicar se ausente há mais de 3 dias.",
        aprazamento: { horarios: TURNOS },
        executor: "TECNICO",
        exigeJustificativa: true,
      },
      {
        id: "constipacao-prevenir",
        cipe: { codigo: "10046454", termo: "Prevenir Constipação" },
        descricao: "Oferecer fibras e líquidos conforme a dieta prescrita.",
        aprazamento: { horarios: ["10:00", "16:00"] },
        executor: "TECNICO",
        exigeJustificativa: false,
      },
    ],
  },
  {
    id: "nutricao",
    necessidade: "Comer e beber",
    ciap: [
      { codigo: "T08", titulo: "Perda de peso" },
      { codigo: "T05", titulo: "Problemas alimentares do adulto" },
    ],
    diagnostico: { codigo: "10025746", termo: "Condição Nutricional, Prejudicada" },
    resultado: { codigo: "10035569", termo: "Condição Nutricional, Melhorada" },
    prevalenciaReferencia: 17,
    observacao: "A CIPE® 2019 não tem “Desnutrição” como diagnóstico pré-coordenado.",
    intervencoes: [
      {
        id: "nutricao-ingestao",
        cipe: { codigo: "10036614", termo: "Monitorar Ingestão de Alimentos" },
        descricao: "Registrar a aceitação de cada refeição (todo, metade, recusou).",
        aprazamento: { horarios: REFEICOES },
        executor: "TECNICO",
        exigeJustificativa: true,
      },
      {
        id: "nutricao-peso",
        cipe: { codigo: "10032121", termo: "Monitorar Peso" },
        descricao: "Pesar em jejum, mesma balança.",
        aprazamento: { horarios: ["07:00"], diasSemana: [1] },
        executor: "TECNICO",
        exigeJustificativa: true,
      },
    ],
  },
  {
    id: "risco-aspiracao",
    necessidade: "Comer e beber",
    ciap: [{ codigo: "D21", titulo: "Problemas de deglutição" }],
    diagnostico: { codigo: "10015024", termo: "Risco de Aspiração" },
    resultado: { codigo: "10028783", termo: "Aspiração, Ausente" },
    prevalenciaReferencia: 0.5,
    intervencoes: [
      {
        id: "aspiracao-prevenir",
        cipe: { codigo: "10051810", termo: "Prevenir Aspiração" },
        descricao:
          "Cabeceira a 30–45° na refeição e por 30 min após; consistência da dieta conforme prescrição; supervisionar.",
        aprazamento: { horarios: REFEICOES },
        executor: "TECNICO",
        exigeJustificativa: true,
      },
    ],
  },
  {
    id: "risco-desidratacao",
    necessidade: "Comer e beber",
    ciap: [{ codigo: "T05", titulo: "Problemas alimentares do adulto" }],
    diagnostico: { codigo: "10041895", termo: "Risco de Desidratação" },
    resultado: { codigo: "10042065", termo: "Hidratação, Adequada" },
    observacao: "Volume conforme prescrição. Não usar volume padrão se houver restrição hídrica ou disfagia.",
    intervencoes: [
      {
        id: "hidratacao-oferecer",
        cipe: { codigo: "10050313", termo: "Oferecer Bebida (ou Líquidos)" },
        descricao: "Oferecer líquidos no volume e consistência prescritos e registrar a aceitação.",
        aprazamento: { horarios: ["09:30", "14:00", "16:30", "20:00"] },
        executor: "TECNICO",
        exigeJustificativa: true,
      },
    ],
  },
  {
    id: "edema",
    necessidade: "Eliminar",
    ciap: [{ codigo: "K07", titulo: "Tornozelos inchados/edema" }],
    diagnostico: { codigo: "10027482", termo: "Edema Periférico" },
    resultado: { codigo: "10029020", termo: "Edema Periférico, Ausente" },
    prevalenciaReferencia: 17,
    intervencoes: [
      {
        id: "edema-gerenciar",
        cipe: { codigo: "10036793", termo: "Gerenciar Edema" },
        descricao: "Elevar membros inferiores no repouso, se não houver contraindicação.",
        aprazamento: { horarios: ["10:00", "16:00"] },
        executor: "TECNICO",
        exigeJustificativa: false,
      },
    ],
  },
  {
    id: "pressao-arterial",
    necessidade: "Evitar perigos",
    ciap: [
      { codigo: "K86", titulo: "Hipertensão sem complicações" },
      { codigo: "K87", titulo: "Hipertensão com complicações" },
    ],
    diagnostico: { codigo: "10022954", termo: "Pressão Arterial, Alterada" },
    resultado: { codigo: "10027647", termo: "Pressão Arterial, nos Limites Normais" },
    prevalenciaReferencia: 9,
    intervencoes: [
      {
        id: "pa-monitorar",
        cipe: { codigo: "10032052", termo: "Monitorar Pressão Arterial" },
        descricao: "Aferir e registrar PA; comunicar PAS ≥ 180 ou ≤ 90 mmHg.",
        aprazamento: { horarios: ["08:00", "20:00"] },
        executor: "TECNICO",
        exigeJustificativa: true,
      },
    ],
  },
  {
    id: "dor-cronica",
    necessidade: "Evitar perigos",
    ciap: [{ codigo: "A01", titulo: "Dor generalizada/múltipla" }],
    diagnostico: { codigo: "10000546", termo: "Dor, Crônica" },
    resultado: { codigo: "10027917", termo: "Dor, Reduzida" },
    prevalenciaReferencia: 6,
    intervencoes: [
      {
        id: "dor-monitorar",
        cipe: { codigo: "10038929", termo: "Monitorar Dor" },
        descricao: "Avaliar dor (escala numérica 0–10 ou observacional se não verbal) e registrar.",
        aprazamento: { horarios: ["08:00", "20:00"] },
        executor: "TECNICO",
        exigeJustificativa: true,
      },
    ],
  },
  {
    id: "humor-deprimido",
    necessidade: "Ocupar-se e realizar-se",
    ciap: [
      { codigo: "P03", titulo: "Tristeza/sensação de depressão" },
      { codigo: "P76", titulo: "Perturbações depressivas" },
    ],
    diagnostico: { codigo: "10022402", termo: "Humor, Deprimido" },
    resultado: { codigo: "10050027", termo: "Humor, Melhorado" },
    prevalenciaReferencia: 17,
    intervencoes: [
      {
        id: "humor-apoio",
        cipe: { codigo: "10027051", termo: "Prover (Proporcionar, Fornecer) Apoio Emocional" },
        descricao: "Escuta ativa; registrar falas de desesperança e comunicar o enfermeiro.",
        aprazamento: { horarios: ["10:00"] },
        executor: "TECNICO",
        exigeJustificativa: false,
      },
    ],
  },
  {
    id: "isolamento-social",
    necessidade: "Recrear-se",
    ciap: [{ codigo: "Z04", titulo: "Problema sociocultural" }],
    diagnostico: { codigo: "10001647", termo: "Isolamento Social" },
    resultado: { codigo: "10050070", termo: "Isolamento Social, Diminuído" },
    prevalenciaReferencia: 13,
    intervencoes: [
      {
        id: "isolamento-socializar",
        cipe: { codigo: "10050898", termo: "Promover Capacidade para Socializar-se" },
        descricao: "Convidar para atividades coletivas e refeições no refeitório; registrar participação.",
        aprazamento: { horarios: ["10:00", "15:30"] },
        executor: "TECNICO",
        exigeJustificativa: false,
      },
    ],
  },
  {
    id: "perambulacao",
    necessidade: "Evitar perigos",
    ciap: [{ codigo: "P70", titulo: "Demência" }],
    diagnostico: { codigo: "10001675", termo: "Tendência para Perambular" },
    resultado: { codigo: "10029201", termo: "Perambulação, Ausente" },
    prevalenciaReferencia: 2,
    intervencoes: [
      {
        id: "perambulacao-gerenciar",
        cipe: { codigo: "10043799", termo: "Gerenciar Perambulação" },
        descricao: "Saber a localização do residente; portas de saída supervisionadas; oferecer caminhada acompanhada.",
        aprazamento: { horarios: TURNOS },
        executor: "TECNICO",
        exigeJustificativa: true,
      },
    ],
  },
  {
    id: "estresse-mudanca",
    necessidade: "Ocupar-se e realizar-se",
    ciap: [{ codigo: "Z04", titulo: "Problema sociocultural" }],
    diagnostico: { codigo: "10021788", termo: "Estresse por Mudança (ou Transferência) do Ambiente" },
    resultado: { codigo: "10027929", termo: "Estresse, Diminuído" },
    observacao: "Diagnóstico típico das primeiras semanas após a admissão.",
    intervencoes: [
      {
        id: "mudanca-acolher",
        cipe: { codigo: "10033126", termo: "Orientar Paciente" },
        descricao: "Apresentar equipe, ambientes e rotina; manter objetos pessoais e preferências registradas.",
        aprazamento: { horarios: ["10:00"] },
        executor: "TECNICO",
        exigeJustificativa: false,
      },
      {
        id: "mudanca-familia",
        cipe: { codigo: "10035887", termo: "Colaborar com a Família" },
        descricao: "Combinar visitas ou ligações da família nas primeiras semanas.",
        aprazamento: { horarios: ["14:00"], diasSemana: [1, 4] },
        executor: "ENFERMEIRO",
        exigeJustificativa: false,
      },
    ],
  },
];

export function buscarDiagnostico(id: string): DiagnosticoModelo | undefined {
  return CATALOGO.find((d) => d.id === id);
}
