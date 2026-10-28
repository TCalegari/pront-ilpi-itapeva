import { describe, expect, it } from "vitest";
import { BRADEN, KATZ, MORSE, dependenciasKatz, respostasCompletas } from "./escalas";

describe("Morse", () => {
  it("classifica nos limites 24/25 e 44/45", () => {
    const base = { historico: 0, diagnosticoSecundario: 0, auxilio: 0, terapiaEv: 0, marcha: 0, estadoMental: 0 };
    expect(MORSE.calcular({ ...base, diagnosticoSecundario: 15, marcha: 0 }).nivel).toBe("BAIXO");
    expect(MORSE.calcular({ ...base, historico: 25 }).classificacao).toBe("Risco médio");
    expect(MORSE.calcular({ ...base, historico: 25, auxilio: 15 }).pontuacao).toBe(40);
    expect(MORSE.calcular({ ...base, historico: 25, marcha: 20 }).nivel).toBe("ALTO");
  });

  it("pontuação máxima é 125", () => {
    const r = MORSE.calcular({ historico: 25, diagnosticoSecundario: 15, auxilio: 30, terapiaEv: 20, marcha: 20, estadoMental: 15 });
    expect(r.pontuacao).toBe(125);
  });

  it("rejeita valor que não existe na escala", () => {
    expect(() => MORSE.calcular({ historico: 10, diagnosticoSecundario: 0, auxilio: 0, terapiaEv: 0, marcha: 0, estadoMental: 0 })).toThrow();
  });
});

describe("Braden", () => {
  const todos = (v: number) => ({ percepcao: v, umidade: v, atividade: v, mobilidade: v, nutricao: v, friccao: Math.min(v, 3) });

  it("faixa 6–23", () => {
    expect(BRADEN.calcular(todos(1)).pontuacao).toBe(6);
    expect(BRADEN.calcular(todos(4)).pontuacao).toBe(23);
  });

  it("classifica nos limites", () => {
    expect(BRADEN.calcular({ ...todos(2), percepcao: 1, umidade: 1, friccao: 1 }).classificacao).toBe("Risco muito alto"); // 9
    expect(BRADEN.calcular({ ...todos(2), friccao: 1 }).classificacao).toBe("Risco alto"); // 11
    expect(BRADEN.calcular({ ...todos(2), friccao: 2 }).pontuacao).toBe(12);
    expect(BRADEN.calcular({ ...todos(2), friccao: 2 }).classificacao).toBe("Risco alto");
    expect(BRADEN.calcular({ ...todos(3), percepcao: 1, umidade: 1 }).classificacao).toBe("Risco moderado"); // 14
    expect(BRADEN.calcular({ ...todos(3) }).classificacao).toBe("Risco baixo"); // 18
    expect(BRADEN.calcular({ ...todos(3), percepcao: 4 }).classificacao).toBe("Sem risco"); // 19
  });
});

describe("Katz", () => {
  it("independente, parcial e total", () => {
    const tudo = (v: number) => Object.fromEntries(KATZ.itens.map((i) => [i.id, v]));
    expect(KATZ.calcular(tudo(1)).classificacao).toBe("Independente");
    expect(KATZ.calcular(tudo(0)).classificacao).toBe("Dependente total");
    expect(KATZ.calcular({ ...tudo(1), higiene: 0, vestuario: 0 }).classificacao).toBe("Dependente parcial (2 de 6 funções)");
    expect(dependenciasKatz({ ...tudo(1), higiene: 0 })).toEqual(["Higiene (banho)"]);
  });

  it("detecta respostas incompletas", () => {
    expect(respostasCompletas(KATZ, { higiene: 1 })).toBe(false);
  });
});
