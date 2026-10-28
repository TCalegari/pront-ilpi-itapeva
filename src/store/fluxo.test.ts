import { beforeEach, describe, expect, it } from "vitest";

// Fluxo completo contra a camada de dados real, com localStorage simulado.
const memoria = new Map<string, string>();
Object.assign(globalThis, {
  window: {
    localStorage: {
      getItem: (k: string) => memoria.get(k) ?? null,
      setItem: (k: string, v: string) => void memoria.set(k, v),
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  },
});

const { obterBanco, reiniciarDemonstracao } = await import("./banco");
const acoes = await import("./acoes");
const { checagemVigente, planoVigente } = await import("./consultas");
const { itemDoCatalogo } = await import("@/domain/admissao");
const { agoraLocal, hojeLocal, somarDias } = await import("@/domain/datas");

const ENF = "prof_enf";
const TEC = "prof_tec";

/** Último horário par (decúbito 2/2h) já passado, em "YYYY-MM-DDTHH:mm". */
function ultimoHorarioPar(): string {
  const agora = agoraLocal();
  const h = Number(agora.slice(11, 13));
  const par = h - (h % 2);
  return `${agora.slice(0, 10)}T${String(par).padStart(2, "0")}:00`;
}

function admitirCompleto(): string {
  const admId = acoes.iniciarAdmissao();
  const adm = obterBanco().admissoes.find((a) => a.id === admId)!;
  const d = structuredClone(adm.dados);
  Object.assign(d.identificacao, {
    nome: "Residente de Teste",
    nascimento: "1939-02-02",
    quarto: "20",
    responsavelNome: "Fulana",
    responsavelTelefone: "(11) 90000-0000",
  });
  d.saude.alergias = "Sulfa";
  d.sinaisVitais = { pas: 130, pad: 80, fc: 72 };
  Object.assign(d.exame, { orientacao: "DESORIENTADO", cognicao: "COMPROMETIDA", deambulacao: "ACAMADO" });
  d.escalas.KATZ = { higiene: 0, vestuario: 0, vasoSanitario: 0, mobilizacao: 0, continencia: 0, alimentacao: 0 };
  d.escalas.MORSE = { historico: 25, diagnosticoSecundario: 15, auxilio: 0, terapiaEv: 0, marcha: 0, estadoMental: 15 };
  d.escalas.BRADEN = { percepcao: 2, umidade: 2, atividade: 1, mobilidade: 1, nutricao: 2, friccao: 1 };
  d.grau.confirmado = "III";
  d.plano = [itemDoCatalogo("risco-lpp", "Braden 9"), itemDoCatalogo("risco-queda", "Morse 55")];
  acoes.salvarRascunhoAdmissao(admId, d);
  return admId;
}

describe("fluxo admissão → SAE → checagem", () => {
  beforeEach(() => {
    memoria.clear();
    reiniciarDemonstracao();
  });

  it("técnico não conclui admissão; enfermeiro conclui e a SAE nasce vigente", () => {
    const admId = admitirCompleto();
    acoes.trocarProfissional(TEC);
    expect(() => acoes.concluirAdmissao(admId)).toThrow(/privativo do enfermeiro/);

    acoes.trocarProfissional(ENF);
    acoes.concluirAdmissao(admId);
    const b = obterBanco();
    const adm = b.admissoes.find((a) => a.id === admId)!;
    const res = b.residentes.find((r) => r.id === adm.residenteId)!;
    expect(adm.status).toBe("CONCLUIDA");
    expect(res).toMatchObject({ status: "ATIVO", grau: "III", alergias: "Sulfa" });
    expect(b.escalas.filter((e) => e.residenteId === res.id)).toHaveLength(3);
    expect(planoVigente(b, res.id)?.versao).toBe(1);

    expect(() => acoes.salvarRascunhoAdmissao(admId, adm.dados)).toThrow(/concluída/);
  });

  it("admissão incompleta não conclui", () => {
    const admId = acoes.iniciarAdmissao();
    expect(() => acoes.concluirAdmissao(admId)).toThrow(/pendência/);
  });

  it("checagem: sem duplicidade, motivo obrigatório, retificação só pelo autor", () => {
    const admId = admitirCompleto();
    acoes.concluirAdmissao(admId);
    const b = obterBanco();
    const residenteId = b.admissoes.find((a) => a.id === admId)!.residenteId;
    const plano = planoVigente(b, residenteId)!;
    const base = { residenteId, planoId: plano.id, diagnosticoId: "risco-lpp", intervencaoId: "lpp-decubito", justificativa: "" };
    const horario = ultimoHorarioPar();

    acoes.trocarProfissional(TEC);
    expect(() => acoes.registrarChecagem({ ...base, programadoPara: horario, status: "NAO_REALIZADO" })).toThrow(/motivo/);
    expect(() => acoes.registrarChecagem({ ...base, programadoPara: horario.slice(0, 11) + "09:30", status: "REALIZADO" })).toThrow(/aprazamento/);
    expect(() => acoes.registrarChecagem({ ...base, programadoPara: `${somarDias(hojeLocal(), 1)}T${horario.slice(11)}`, status: "REALIZADO" })).toThrow(/antecedência/);

    acoes.registrarChecagem({ ...base, programadoPara: horario, status: "REALIZADO" });
    expect(() => acoes.registrarChecagem({ ...base, programadoPara: horario, status: "REALIZADO" })).toThrow(/já foi checado/);

    const original = checagemVigente(obterBanco(), residenteId, "lpp-decubito", horario)!;
    acoes.trocarProfissional(ENF);
    expect(() => acoes.retificarChecagem(original.id, "NAO_REALIZADO", "Residente estava no banho")).toThrow(/Apenas quem registrou/);

    acoes.trocarProfissional(TEC);
    acoes.retificarChecagem(original.id, "NAO_REALIZADO", "Recusa do residente — checado por engano");
    const vigente = checagemVigente(obterBanco(), residenteId, "lpp-decubito", horario)!;
    expect(vigente.status).toBe("NAO_REALIZADO");
    expect(vigente.retificaId).toBe(original.id);
    expect(obterBanco().checagens.some((c) => c.id === original.id)).toBe(true); // original preservado
  });

  it("revisão da SAE é do enfermeiro e cria nova versão", () => {
    const b = obterBanco();
    const anterior = planoVigente(b, "res_antonio")!;
    const dados = {
      grau: "III" as const,
      itens: anterior.itens,
      evolucao: "Piora da marcha após infecção urinária; passa a depender de auxílio.",
      avaliacaoAnterior: anterior.itens.map((i) => ({ diagnosticoId: i.diagnosticoId, resultado: "PARCIAL" as const })),
    };
    acoes.trocarProfissional(TEC);
    expect(() => acoes.revisarPlano("res_antonio", dados)).toThrow(/privativo/);
    acoes.trocarProfissional(ENF);
    acoes.revisarPlano("res_antonio", dados);
    const novo = planoVigente(obterBanco(), "res_antonio")!;
    expect(novo.versao).toBe(anterior.versao + 1);
    expect(obterBanco().residentes.find((r) => r.id === "res_antonio")?.grau).toBe("III");
  });
});
