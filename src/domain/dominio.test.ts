import { describe, expect, it } from "vitest";
import { admissaoVazia, itemDoCatalogo, pendenciasAdmissao, sugerirDiagnosticos } from "./admissao";
import { estaAtrasado, interpretarHorarios, ocorrenciasDoPlantao, plantaoDe } from "./aprazamento";
import { CATALOGO } from "./cipe/catalogo";
import { idade, somarDias } from "./datas";
import { sugerirGrau } from "./grau";
import { calcularPrazo, prazoRevisaoSae } from "./reavaliacao";

describe("catálogo CIPE", () => {
  it("códigos têm 8 dígitos e ids são únicos", () => {
    const ids = new Set<string>();
    for (const d of CATALOGO) {
      expect(ids.has(d.id)).toBe(false);
      ids.add(d.id);
      for (const c of [d.diagnostico, d.resultado, ...d.intervencoes.map((i) => i.cipe)]) {
        expect(c.codigo).toMatch(/^100\d{5}$/);
      }
      for (const i of d.intervencoes) for (const h of i.aprazamento.horarios) expect(h).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
    }
  });

  it("não reintroduz códigos inexistentes sugeridos pelo Gemini", () => {
    const codigos = CATALOGO.flatMap((d) => [d.diagnostico, d.resultado, ...d.intervencoes.map((i) => i.cipe)]).map((c) => c.codigo);
    for (const errado of ["10022750", "10028490", "10035012", "10045120", "10026895", "10042011", "10022498"]) {
      expect(codigos).not.toContain(errado);
    }
  });
});

describe("grau de dependência (RDC 502)", () => {
  it("I, II e III", () => {
    expect(sugerirGrau(0, "PRESERVADA").grau).toBe("I");
    expect(sugerirGrau(3, "ALTERACAO_CONTROLADA").grau).toBe("II");
    expect(sugerirGrau(6, "PRESERVADA").grau).toBe("III");
    expect(sugerirGrau(0, "COMPROMETIDA").grau).toBe("III");
  });

  it("4–5 dependências sem comprometimento cognitivo exigem confirmação", () => {
    const s = sugerirGrau(4, "PRESERVADA");
    expect(s.grau).toBe("III");
    expect(s.exigeConfirmacao).toBe(true);
  });
});

describe("datas", () => {
  it("soma dias atravessando mês e ano", () => {
    expect(somarDias("2026-12-31", 1)).toBe("2027-01-01");
    expect(somarDias("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("idade antes e depois do aniversário", () => {
    expect(idade("1940-10-29", "2026-10-28")).toBe(85);
    expect(idade("1940-10-28", "2026-10-28")).toBe(86);
  });
});

describe("plantões e aprazamento", () => {
  const plano = [itemDoCatalogo("risco-lpp", "teste")];

  it("madrugada pertence ao noturno do dia anterior", () => {
    expect(plantaoDe("2026-10-29T03:00")).toEqual({ data: "2026-10-28", turno: "NOTURNO" });
    expect(plantaoDe("2026-10-28T07:00")).toEqual({ data: "2026-10-28", turno: "DIURNO" });
    expect(plantaoDe("2026-10-28T19:00")).toEqual({ data: "2026-10-28", turno: "NOTURNO" });
  });

  it("decúbito 2/2h: 6 horários no diurno e 6 no noturno, sem perder a madrugada", () => {
    const decubito = (turno: "DIURNO" | "NOTURNO") =>
      ocorrenciasDoPlantao(plano, { data: "2026-10-28", turno }).filter((o) => o.intervencao.intervencaoId === "lpp-decubito");
    expect(decubito("DIURNO").map((o) => o.programadoPara.slice(11))).toEqual(["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"]);
    const noite = decubito("NOTURNO").map((o) => o.programadoPara);
    expect(noite).toHaveLength(6);
    expect(noite[0]).toBe("2026-10-28T20:00");
    expect(noite.at(-1)).toBe("2026-10-29T06:00");
  });

  it("respeita dia da semana (pesar às segundas)", () => {
    const nutricao = [itemDoCatalogo("nutricao", "teste")];
    const peso = (data: string) =>
      ocorrenciasDoPlantao(nutricao, { data, turno: "DIURNO" }).filter((o) => o.intervencao.intervencaoId === "nutricao-peso");
    expect(peso("2026-10-26")).toHaveLength(1); // segunda
    expect(peso("2026-10-27")).toHaveLength(0);
  });

  it("atraso considera a tolerância e a virada do dia", () => {
    expect(estaAtrasado("2026-10-28T08:00", "2026-10-28T09:00")).toBe(false);
    expect(estaAtrasado("2026-10-28T08:00", "2026-10-28T09:01")).toBe(true);
    expect(estaAtrasado("2026-10-28T23:30", "2026-10-29T00:20")).toBe(false);
    expect(estaAtrasado("2026-10-28T23:30", "2026-10-29T00:31")).toBe(true);
  });

  it("interpreta horários digitados", () => {
    expect(interpretarHorarios("8:00, 14h 20; 8")).toEqual({ horarios: ["08:00", "14:00", "20:00"], invalidos: [] });
    expect(interpretarHorarios("25:00 abc").invalidos).toEqual(["25:00", "abc"]);
  });
});

describe("prazos de reavaliação", () => {
  it("situação do prazo", () => {
    expect(calcularPrazo("2026-10-01", 15, "2026-10-15").situacao).toBe("EM_DIA");
    expect(calcularPrazo("2026-10-01", 15, "2026-10-16").situacao).toBe("VENCE_HOJE");
    expect(calcularPrazo("2026-10-01", 15, "2026-10-17").situacao).toBe("VENCIDA");
  });
  it("grau III revisa diariamente", () => {
    expect(prazoRevisaoSae("2026-10-27", "III", "2026-10-28").situacao).toBe("VENCE_HOJE");
  });
});

describe("admissão", () => {
  it("sempre sugere estresse por mudança do ambiente", () => {
    const ids = sugerirDiagnosticos(admissaoVazia("2026-10-28")).map((s) => s.diagnosticoId);
    expect(ids).toEqual(["estresse-mudanca"]);
  });

  it("sugere diagnósticos a partir das escalas e do exame", () => {
    const d = admissaoVazia("2026-10-28");
    d.escalas.MORSE = { historico: 25, diagnosticoSecundario: 15, auxilio: 15, terapiaEv: 0, marcha: 10, estadoMental: 0 };
    d.escalas.BRADEN = { percepcao: 3, umidade: 2, atividade: 2, mobilidade: 3, nutricao: 2, friccao: 2 };
    d.escalas.KATZ = { higiene: 0, vestuario: 1, vasoSanitario: 1, mobilizacao: 1, continencia: 0, alimentacao: 1 };
    d.exame.degluticao = "DISFAGIA";
    d.sinaisVitais = { pas: 150, pad: 85 };
    const ids = sugerirDiagnosticos(d).map((s) => s.diagnosticoId);
    expect(ids).toEqual(
      expect.arrayContaining(["risco-queda", "risco-lpp", "autocuidado", "incontinencia-urinaria", "risco-aspiracao", "pressao-arterial"]),
    );
  });

  it("lista pendências e libera quando completa", () => {
    const d = admissaoVazia("2026-10-28");
    expect(pendenciasAdmissao(d, "2026-10-28").length).toBeGreaterThan(5);

    Object.assign(d.identificacao, {
      nome: "Maria Teste",
      nascimento: "1940-01-01",
      quarto: "1",
      responsavelNome: "Ana",
      responsavelTelefone: "11 90000-0000",
    });
    d.saude.semAlergiasConhecidas = true;
    d.sinaisVitais = { pas: 120, pad: 80, fc: 70 };
    Object.assign(d.exame, { orientacao: "ORIENTADO", cognicao: "PRESERVADA", deambulacao: "INDEPENDENTE" });
    d.escalas.KATZ = { higiene: 1, vestuario: 1, vasoSanitario: 1, mobilizacao: 1, continencia: 1, alimentacao: 1 };
    d.escalas.MORSE = { historico: 0, diagnosticoSecundario: 0, auxilio: 0, terapiaEv: 0, marcha: 0, estadoMental: 0 };
    d.escalas.BRADEN = { percepcao: 4, umidade: 4, atividade: 4, mobilidade: 4, nutricao: 4, friccao: 3 };
    d.grau.confirmado = "I";
    d.plano = [itemDoCatalogo("estresse-mudanca", "Admissão")];
    expect(pendenciasAdmissao(d, "2026-10-28")).toEqual([]);

    d.grau.confirmado = "II"; // diverge da sugestão (I) sem justificativa
    expect(pendenciasAdmissao(d, "2026-10-28").map((p) => p.mensagem)).toContain("Justifique o grau de dependência escolhido");
  });
});
