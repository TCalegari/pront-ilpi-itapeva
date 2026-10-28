"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, History, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { estaAtrasado, intervencoesSeNecessario, ocorrenciasDoPlantao, type Plantao } from "@/domain/aprazamento";
import { agoraLocal, formatarDataHora, formatarInstante } from "@/domain/datas";
import type { IntervencaoPrescrita } from "@/domain/tipos";
import { profissionalAtual, registrarChecagem, retificarChecagem, rotuloAutor, tentar } from "@/store/acoes";
import { checagemVigente } from "@/store/consultas";
import type { BancoLocal, Checagem, PlanoCuidados, Residente } from "@/store/modelo";
import { AreaTexto, Aviso, Escolha } from "./campos";
import { SeloGrau } from "./selos";

const MOTIVOS = [
  "Recusa do residente",
  "Residente ausente (consulta/passeio)",
  "Residente hospitalizado",
  "Contraindicação clínica",
  "Material indisponível",
  "Outro",
];

type Modo = { tipo: "NAO_REALIZADO" } | { tipo: "SN" } | { tipo: "RETIFICAR"; original: Checagem } | null;

function FormMotivo({ modo, aoConfirmar, aoCancelar }: { modo: NonNullable<Modo>; aoConfirmar: (status: Checagem["status"], texto: string) => void; aoCancelar: () => void }) {
  const [motivo, setMotivo] = useState("");
  const [texto, setTexto] = useState("");
  const [status, setStatus] = useState<Checagem["status"]>(modo.tipo === "RETIFICAR" ? (modo.original.status === "REALIZADO" ? "NAO_REALIZADO" : "REALIZADO") : "NAO_REALIZADO");

  const usaMotivos = modo.tipo === "NAO_REALIZADO" || (modo.tipo === "RETIFICAR" && status === "NAO_REALIZADO");
  const justificativa = usaMotivos && motivo && motivo !== "Outro" ? [motivo, texto.trim()].filter(Boolean).join(" — ") : texto.trim();

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-lg border bg-background p-3">
      {modo.tipo === "RETIFICAR" && (
        <Escolha
          opcoes={[
            { valor: "REALIZADO" as const, rotulo: "Corrigir para: realizado" },
            { valor: "NAO_REALIZADO" as const, rotulo: "Corrigir para: não realizado" },
          ]}
          valor={status}
          aoMudar={setStatus}
        />
      )}
      {usaMotivos && <Escolha opcoes={MOTIVOS.map((m) => ({ valor: m, rotulo: m }))} valor={motivo} aoMudar={setMotivo} />}
      <AreaTexto
        className="min-h-16 w-full rounded-lg border bg-background px-3 py-2 text-sm"
        placeholder={modo.tipo === "SN" ? "Descreva o que foi feito" : modo.tipo === "RETIFICAR" ? "Explique a retificação" : "Complemento (obrigatório se “Outro”)"}
        valor={texto}
        aoMudar={setTexto}
      />
      <div className="flex gap-2">
        <Button className="h-11" onClick={() => aoConfirmar(modo.tipo === "SN" ? "REALIZADO" : status, justificativa)}>
          Confirmar
        </Button>
        <Button className="h-11" variant="outline" onClick={aoCancelar}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function LinhaOcorrencia({
  banco,
  plano,
  diagnosticoId,
  intervencao,
  programadoPara,
}: {
  banco: BancoLocal;
  plano: PlanoCuidados;
  diagnosticoId: string;
  intervencao: IntervencaoPrescrita;
  programadoPara: string | null;
}) {
  const [modo, setModo] = useState<Modo>(null);
  const [erro, setErro] = useState<string | null>(null);
  const prof = profissionalAtual(banco);
  const registro = programadoPara ? checagemVigente(banco, plano.residenteId, intervencao.intervencaoId, programadoPara) : undefined;
  const historicoSn = programadoPara
    ? []
    : banco.checagens
        .filter((c) => c.residenteId === plano.residenteId && c.intervencaoId === intervencao.intervencaoId && c.programadoPara === null)
        .slice(-3);
  const agora = agoraLocal();
  const atrasado = !registro && programadoPara !== null && estaAtrasado(programadoPara, agora);
  const bloqueadoPerfil = intervencao.executor === "ENFERMEIRO" && prof.perfil !== "ENFERMEIRO";

  const registrar = (status: Checagem["status"], justificativa: string) => {
    const e = tentar(() =>
      registrarChecagem({
        residenteId: plano.residenteId,
        planoId: plano.id,
        diagnosticoId,
        intervencaoId: intervencao.intervencaoId,
        programadoPara,
        status,
        justificativa,
      }),
    );
    setErro(e);
    if (!e) setModo(null);
  };

  return (
    <li
      className={cn(
        "rounded-lg border p-3",
        registro?.status === "REALIZADO" && "border-emerald-200 bg-emerald-50/50",
        registro?.status === "NAO_REALIZADO" && "border-red-200 bg-red-50/50",
        atrasado && "border-amber-300 bg-amber-50",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 gap-3">
          <span className="w-12 shrink-0 font-mono text-sm font-semibold">{programadoPara ? programadoPara.slice(11) : "SN"}</span>
          <div className="min-w-0">
            <p className="text-sm font-medium">{intervencao.descricao}</p>
            <p className="text-xs text-muted-foreground">
              {intervencao.cipe.termo} ({intervencao.cipe.codigo})
              {intervencao.executor === "ENFERMEIRO" && " · executa: enfermeiro"}
            </p>
            {registro && (
              <p className="mt-1 text-xs">
                <strong>{registro.status === "REALIZADO" ? "Realizado" : "Não realizado"}</strong>
                {registro.retificaId && " (retificado)"} — {registro.autor}, {formatarInstante(registro.registradoEm)}
                {registro.justificativa && <span className="block text-muted-foreground">Motivo/obs.: {registro.justificativa}</span>}
              </p>
            )}
            {historicoSn.map((c) => (
              <p key={c.id} className="mt-1 text-xs text-muted-foreground">
                {formatarInstante(c.registradoEm)} — {c.justificativa ?? "realizado"} ({c.autor.split(" – ")[0]})
              </p>
            ))}
            {atrasado && <p className="mt-1 text-xs font-medium text-amber-800">Atrasado</p>}
          </div>
        </div>
        <div className="flex gap-2">
          {!registro && programadoPara && !bloqueadoPerfil && (
            <>
              <Button className="h-11 bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => registrar("REALIZADO", "")}>
                <Check /> Realizado
              </Button>
              <Button className="h-11" variant="destructive" onClick={() => setModo({ tipo: "NAO_REALIZADO" })}>
                <X /> Não realizado
              </Button>
            </>
          )}
          {!programadoPara && !bloqueadoPerfil && (
            <Button className="h-11" variant="outline" onClick={() => (intervencao.exigeJustificativa ? setModo({ tipo: "SN" }) : registrar("REALIZADO", ""))}>
              <Check /> Registrar execução
            </Button>
          )}
          {registro && registro.autor === rotuloAutor(prof) && (
            <Button className="h-11" variant="ghost" onClick={() => setModo({ tipo: "RETIFICAR", original: registro })}>
              <History /> Retificar
            </Button>
          )}
        </div>
      </div>
      {modo && (
        <FormMotivo
          modo={modo}
          aoCancelar={() => {
            setModo(null);
            setErro(null);
          }}
          aoConfirmar={(status, justificativa) => {
            if (modo.tipo === "RETIFICAR") {
              const e = tentar(() => retificarChecagem(modo.original.id, status, justificativa));
              setErro(e);
              if (!e) setModo(null);
            } else {
              registrar(status, justificativa);
            }
          }}
        />
      )}
      {erro && (
        <div className="mt-2">
          <Aviso tipo="erro">{erro}</Aviso>
        </div>
      )}
    </li>
  );
}

export function FolhaResidente({ banco, residente, plano, plantao, mostrarCabecalho = true }: { banco: BancoLocal; residente: Residente; plano: PlanoCuidados; plantao: Plantao; mostrarCabecalho?: boolean }) {
  const ocorrencias = ocorrenciasDoPlantao(plano.itens, plantao);
  const sn = intervencoesSeNecessario(plano.itens);
  const feitas = ocorrencias.filter((o) => checagemVigente(banco, residente.id, o.intervencao.intervencaoId, o.programadoPara)).length;

  return (
    <section className="flex flex-col gap-3">
      {mostrarCabecalho && (
        <header className="flex flex-wrap items-center gap-2">
          <Link href={`/residentes/${residente.id}`} className="font-semibold hover:underline">
            {residente.nome}
          </Link>
          <span className="text-sm text-muted-foreground">
            Quarto {residente.quarto}
            {residente.leito && ` / ${residente.leito}`}
          </span>
          <SeloGrau grau={residente.grau} />
          {residente.alergias && <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">Alergia: {residente.alergias}</span>}
          <span className="ml-auto text-sm text-muted-foreground">
            {feitas}/{ocorrencias.length} checados
          </span>
        </header>
      )}
      <ul className="flex flex-col gap-2">
        {ocorrencias.map((o) => (
          <LinhaOcorrencia
            key={`${o.intervencao.intervencaoId}_${o.programadoPara}`}
            banco={banco}
            plano={plano}
            diagnosticoId={o.diagnosticoId}
            intervencao={o.intervencao}
            programadoPara={o.programadoPara}
          />
        ))}
        {sn.map((s) => (
          <LinhaOcorrencia key={`${s.intervencao.intervencaoId}_sn`} banco={banco} plano={plano} diagnosticoId={s.diagnosticoId} intervencao={s.intervencao} programadoPara={null} />
        ))}
      </ul>
      {ocorrencias.length === 0 && sn.length === 0 && <p className="text-sm text-muted-foreground">Sem cuidados aprazados neste plantão.</p>}
    </section>
  );
}

export function rotuloPlantao(p: Plantao): string {
  return p.turno === "DIURNO" ? `Diurno ${formatarDataHora(`${p.data}T07:00`)}–19:00` : `Noturno ${formatarDataHora(`${p.data}T19:00`)} → 07:00`;
}
