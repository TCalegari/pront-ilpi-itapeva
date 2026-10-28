import { INSTITUICAO, type Turno } from "@/config/instituicao";
import { diaDaSemana, somarDias } from "./datas";
import type { IntervencaoPrescrita, ItemPlano } from "./tipos";

export interface Plantao {
  /** Data em que o plantão começa. O noturno de 28/10 vai até 07:00 de 29/10. */
  data: string;
  turno: Turno;
}

export interface Ocorrencia {
  diagnosticoId: string;
  intervencao: IntervencaoPrescrita;
  /** "YYYY-MM-DDTHH:mm" local. */
  programadoPara: string;
}

const { DIURNO } = INSTITUICAO.turnos;

/** Plantão a que pertence um horário local "YYYY-MM-DDTHH:mm". */
export function plantaoDe(local: string): Plantao {
  const data = local.slice(0, 10);
  const hora = local.slice(11, 16);
  if (hora >= DIURNO.inicio && hora < DIURNO.fim) return { data, turno: "DIURNO" };
  if (hora >= DIURNO.fim) return { data, turno: "NOTURNO" };
  return { data: somarDias(data, -1), turno: "NOTURNO" };
}

function aplicaNoDia(intervencao: IntervencaoPrescrita, data: string): boolean {
  const dias = intervencao.aprazamento.diasSemana;
  return !dias || dias.length === 0 || dias.includes(diaDaSemana(data));
}

/** Horários aprazados que caem no plantão, em ordem cronológica. */
export function ocorrenciasDoPlantao(itens: ItemPlano[], plantao: Plantao): Ocorrencia[] {
  const resultado: Ocorrencia[] = [];
  const diaSeguinte = somarDias(plantao.data, 1);

  for (const item of itens) {
    for (const intervencao of item.intervencoes) {
      for (const hora of intervencao.aprazamento.horarios) {
        let data: string | null = null;
        if (plantao.turno === "DIURNO") {
          if (hora >= DIURNO.inicio && hora < DIURNO.fim) data = plantao.data;
        } else if (hora >= DIURNO.fim) {
          data = plantao.data;
        } else if (hora < DIURNO.inicio) {
          data = diaSeguinte;
        }
        if (data && aplicaNoDia(intervencao, data)) {
          resultado.push({ diagnosticoId: item.diagnosticoId, intervencao, programadoPara: `${data}T${hora}` });
        }
      }
    }
  }
  return resultado.sort((a, b) => a.programadoPara.localeCompare(b.programadoPara));
}

/** Intervenções "se necessário" (sem horário) do plano. */
export function intervencoesSeNecessario(itens: ItemPlano[]): { diagnosticoId: string; intervencao: IntervencaoPrescrita }[] {
  return itens.flatMap((item) =>
    item.intervencoes
      .filter((i) => i.aprazamento.horarios.length === 0)
      .map((intervencao) => ({ diagnosticoId: item.diagnosticoId, intervencao })),
  );
}

/** Pendente há mais que a tolerância? Compara strings locais "YYYY-MM-DDTHH:mm". */
export function estaAtrasado(programadoPara: string, agora: string, toleranciaMin = INSTITUICAO.toleranciaAtrasoMin): boolean {
  const [d, h] = programadoPara.split("T");
  const [hh, mm] = h.split(":").map(Number);
  const total = hh * 60 + mm + toleranciaMin;
  const dias = Math.floor(total / 1440);
  const resto = total % 1440;
  const limite = `${somarDias(d, dias)}T${String(Math.floor(resto / 60)).padStart(2, "0")}:${String(resto % 60).padStart(2, "0")}`;
  return agora > limite;
}

/** Valida e normaliza uma lista de horários digitada ("8:00, 14h, 20:00"). */
export function interpretarHorarios(texto: string): { horarios: string[]; invalidos: string[] } {
  const horarios = new Set<string>();
  const invalidos: string[] = [];
  for (const parte of texto.split(/[,;\s]+/).filter(Boolean)) {
    const m = parte.match(/^(\d{1,2})(?:[:h](\d{2})?)?h?$/i);
    const hh = m ? Number(m[1]) : NaN;
    const mm = m && m[2] ? Number(m[2]) : 0;
    if (!m || hh > 23 || mm > 59) {
      invalidos.push(parte);
      continue;
    }
    horarios.add(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
  }
  return { horarios: [...horarios].sort(), invalidos };
}
