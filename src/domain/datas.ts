// Datas locais da instituição (America/Sao_Paulo, UTC−3 fixo, sem horário de verão).
// Trabalhamos com strings "YYYY-MM-DD" e "YYYY-MM-DDTHH:mm" no horário local para
// evitar deslocamentos de fuso; instantes absolutos (registradoEm) usam ISO UTC.

const FUSO = "America/Sao_Paulo";

const partes = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "YYYY-MM-DDTHH:mm" no horário de São Paulo. */
export function agoraLocal(agora: Date = new Date()): string {
  const p = Object.fromEntries(partes.formatToParts(agora).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

export function hojeLocal(agora: Date = new Date()): string {
  return agoraLocal(agora).slice(0, 10);
}

/** Soma dias a uma data "YYYY-MM-DD". */
export function somarDias(data: string, dias: number): string {
  const [a, m, d] = data.split("-").map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d + dias));
  return dt.toISOString().slice(0, 10);
}

export function diferencaDias(de: string, ate: string): number {
  const [a1, m1, d1] = de.split("-").map(Number);
  const [a2, m2, d2] = ate.split("-").map(Number);
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86_400_000);
}

/** 0 = domingo. */
export function diaDaSemana(data: string): number {
  const [a, m, d] = data.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay();
}

export function idade(nascimento: string, referencia: string): number {
  const [an, mn, dn] = nascimento.split("-").map(Number);
  const [ar, mr, dr] = referencia.split("-").map(Number);
  let anos = ar - an;
  if (mr < mn || (mr === mn && dr < dn)) anos--;
  return anos;
}

export function formatarData(data: string): string {
  const [a, m, d] = data.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

export function formatarDataHora(local: string): string {
  return `${formatarData(local)} ${local.slice(11, 16)}`;
}

/** Formata um instante ISO (UTC) no horário de São Paulo. */
export function formatarInstante(iso: string): string {
  return formatarDataHora(agoraLocal(new Date(iso)));
}
