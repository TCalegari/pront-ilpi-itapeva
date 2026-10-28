import { admissaoVazia, itemDoCatalogo } from "@/domain/admissao";
import { agoraLocal, hojeLocal, somarDias } from "@/domain/datas";
import { BRADEN, KATZ, MORSE, type DefinicaoEscala, type Respostas } from "@/domain/escalas/escalas";
import type { AplicacaoEscala, BancoLocal, PlanoCuidados, Profissional, Residente } from "./modelo";

// Dados FICTÍCIOS para demonstração. Nomes, documentos e conselhos não são reais.

const ENF: Profissional = { id: "prof_enf", nome: "Carla Mendes", perfil: "ENFERMEIRO", conselho: "COREN-SP 000.001 (fictício)" };
const TEC: Profissional = { id: "prof_tec", nome: "João Pereira", perfil: "TECNICO", conselho: "COREN-SP 000.002-TE (fictício)" };
const ROTULO_ENF = "Carla Mendes – Enfermeira COREN-SP 000.001 (fictício)";

export function criarBancoDemonstracao(): BancoLocal {
  const hoje = hojeLocal();
  const instante = (data: string, hora: string) => new Date(`${data}T${hora}:00-03:00`).toISOString();

  const residentes: Residente[] = [
    {
      id: "res_benedita",
      nome: "Benedita Souza Lima",
      nascimento: "1938-03-14",
      sexo: "F",
      quarto: "12",
      leito: "B",
      status: "ATIVO",
      grau: "III",
      alergias: "Dipirona",
      dataAdmissao: somarDias(hoje, -79),
      responsavel: { nome: "Márcia Lima", parentesco: "Filha", telefone: "(11) 90000-0001" },
    },
    {
      id: "res_antonio",
      nome: "Antônio Carlos Ferreira",
      nascimento: "1945-07-02",
      sexo: "M",
      quarto: "08",
      leito: "A",
      status: "ATIVO",
      grau: "II",
      alergias: "",
      dataAdmissao: somarDias(hoje, -57),
      responsavel: { nome: "Paulo Ferreira", parentesco: "Sobrinho", telefone: "(11) 90000-0002" },
    },
    {
      id: "res_iolanda",
      nome: "Iolanda Martins",
      nascimento: "1950-11-20",
      sexo: "F",
      quarto: "05",
      leito: "A",
      status: "ATIVO",
      grau: "I",
      alergias: "Penicilina",
      dataAdmissao: somarDias(hoje, -20),
      responsavel: { nome: "Rita Martins", parentesco: "Irmã", telefone: "(11) 90000-0003" },
    },
    {
      id: "res_sebastiao",
      nome: "Sebastião Rocha",
      nascimento: "1941-05-09",
      sexo: "M",
      quarto: "10",
      leito: "A",
      status: "EM_ADMISSAO",
      alergias: "",
      dataAdmissao: hoje,
      responsavel: { nome: "", parentesco: "", telefone: "" },
    },
  ];

  const escala = (residenteId: string, def: DefinicaoEscala, respostas: Respostas, data: string): AplicacaoEscala => {
    const r = def.calcular(respostas);
    return {
      id: `esc_${residenteId}_${def.id}_${data}`,
      residenteId,
      escala: def.id,
      respostas,
      pontuacao: r.pontuacao,
      classificacao: r.classificacao,
      contexto: "ADMISSAO",
      autor: ROTULO_ENF,
      registradoEm: instante(data, "10:00"),
    };
  };

  const plano = (residenteId: string, grau: PlanoCuidados["grau"], ids: [string, string][], vigenteDesde: string): PlanoCuidados => ({
    id: `plano_${residenteId}_1`,
    residenteId,
    versao: 1,
    origem: "ADMISSAO",
    grau,
    itens: ids.map(([id, just]) => itemDoCatalogo(id, just)),
    evolucao: "Plano elaborado na admissão (dados de demonstração).",
    avaliacaoAnterior: [],
    autor: ROTULO_ENF,
    registradoEm: instante(vigenteDesde, "11:00"),
    vigenteDesde,
  });

  const katz = (dependentes: string[]) => Object.fromEntries(KATZ.itens.map((i) => [i.id, dependentes.includes(i.id) ? 0 : 1]));

  const rascunho = admissaoVazia(hoje);
  Object.assign(rascunho.identificacao, {
    nome: "Sebastião Rocha",
    nascimento: "1941-05-09",
    sexo: "M",
    quarto: "10",
    leito: "A",
    procedencia: "HOSPITAL",
    procedenciaDetalhe: "Alta hospitalar após pneumonia",
  });

  const planoBenedita = plano(
    "res_benedita",
    "III",
    [
      ["risco-queda", "Morse 55 (risco alto)"],
      ["risco-lpp", "Braden 11 (risco alto)"],
      ["autocuidado", "Katz: dependente em 5 funções"],
      ["incontinencia-urinaria", "Incontinente"],
      ["desorientacao", "Demência (P70)"],
      ["risco-aspiracao", "Disfagia, dieta pastosa"],
    ],
    somarDias(hoje, -1),
  );

  // Algumas checagens já feitas no plantão diurno de hoje, se o horário já passou.
  const agora = agoraLocal();
  const checagens = [
    ["risco-lpp", "lpp-decubito", "08:00"],
    ["autocuidado", "autocuidado-higiene", "08:00"],
    ["risco-queda", "queda-prevencao", "07:00"],
  ]
    .filter(([, , hora]) => `${hoje}T${hora}` <= agora)
    .map(([diagnosticoId, intervencaoId, hora]) => ({
      id: `chk_seed_${intervencaoId}`,
      residenteId: "res_benedita",
      planoId: planoBenedita.id,
      diagnosticoId,
      intervencaoId,
      programadoPara: `${hoje}T${hora}`,
      status: "REALIZADO" as const,
      autor: "João Pereira – Técnico de enfermagem COREN-SP 000.002-TE (fictício)",
      registradoEm: instante(hoje, hora),
    }));

  return {
    versao: 1,
    profissionalAtualId: ENF.id,
    profissionais: [ENF, TEC],
    residentes,
    admissoes: [
      {
        id: "adm_sebastiao",
        residenteId: "res_sebastiao",
        status: "RASCUNHO",
        dados: rascunho,
        iniciadaEm: new Date().toISOString(),
        atualizadaEm: new Date().toISOString(),
      },
    ],
    escalas: [
      escala("res_benedita", MORSE, { historico: 25, diagnosticoSecundario: 15, auxilio: 0, terapiaEv: 0, marcha: 0, estadoMental: 15 }, somarDias(hoje, -8)),
      escala("res_benedita", BRADEN, { percepcao: 2, umidade: 2, atividade: 1, mobilidade: 2, nutricao: 2, friccao: 2 }, somarDias(hoje, -8)),
      escala("res_benedita", KATZ, katz(["higiene", "vestuario", "vasoSanitario", "mobilizacao", "continencia"]), somarDias(hoje, -79)),
      escala("res_antonio", MORSE, { historico: 25, diagnosticoSecundario: 15, auxilio: 0, terapiaEv: 0, marcha: 0, estadoMental: 0 }, somarDias(hoje, -16)),
      escala("res_antonio", BRADEN, { percepcao: 4, umidade: 3, atividade: 3, mobilidade: 3, nutricao: 3, friccao: 3 }, somarDias(hoje, -16)),
      escala("res_antonio", KATZ, katz(["higiene"]), somarDias(hoje, -57)),
      escala("res_iolanda", MORSE, { historico: 0, diagnosticoSecundario: 15, auxilio: 0, terapiaEv: 0, marcha: 0, estadoMental: 0 }, somarDias(hoje, -20)),
      escala("res_iolanda", BRADEN, { percepcao: 4, umidade: 4, atividade: 4, mobilidade: 4, nutricao: 3, friccao: 3 }, somarDias(hoje, -20)),
      escala("res_iolanda", KATZ, katz([]), somarDias(hoje, -20)),
    ],
    planos: [
      planoBenedita,
      plano(
        "res_antonio",
        "II",
        [
          ["risco-queda", "Morse 40 e queda prévia"],
          ["pressao-arterial", "Hipertensão (K86)"],
          ["audicao", "Usa prótese auditiva"],
          ["sono", "Insônia referida"],
        ],
        somarDias(hoje, -16),
      ),
      plano(
        "res_iolanda",
        "I",
        [
          ["estresse-mudanca", "Admissão recente"],
          ["humor-deprimido", "Tristeza referida, choro frequente"],
          ["isolamento-social", "Permanece no quarto"],
        ],
        somarDias(hoje, -5),
      ),
    ],
    checagens,
    anotacoes: [],
    auditoria: [],
  };
}
