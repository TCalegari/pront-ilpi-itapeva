"use client";

import { useState } from "react";
import { Aviso, CampoTexto, Escolha } from "@/components/campos";
import { descreverAprazamento } from "@/components/editor-plano";
import { CodigoCipe } from "@/components/selos";
import { CATALOGO } from "@/domain/cipe/catalogo";
import type { Necessidade } from "@/domain/tipos";

export default function CatalogoPage() {
  const [busca, setBusca] = useState("");
  const [necessidade, setNecessidade] = useState<Necessidade | "Todas">("Todas");
  const [ordem, setOrdem] = useState<"PREVALENCIA" | "ALFABETICA">("PREVALENCIA");
  const necessidades = ["Todas", ...new Set(CATALOGO.map((c) => c.necessidade))] as (Necessidade | "Todas")[];
  const termo = busca.trim().toLowerCase();

  const lista = CATALOGO.filter((c) => necessidade === "Todas" || c.necessidade === necessidade)
    .filter(
      (c) =>
        !termo ||
        c.diagnostico.termo.toLowerCase().includes(termo) ||
        c.diagnostico.codigo.includes(termo) ||
        c.ciap.some((x) => x.codigo.toLowerCase().includes(termo) || x.titulo.toLowerCase().includes(termo)),
    )
    .sort((a, b) =>
      ordem === "PREVALENCIA" ? (b.prevalenciaReferencia ?? -1) - (a.prevalenciaReferencia ?? -1) : a.diagnostico.termo.localeCompare(b.diagnostico.termo),
    );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Catálogo de diagnósticos (CIAP-2 × CIPE®)</h1>
      <Aviso tipo="info">
        Códigos conferidos na CIPE® 2019 pt-BR (ICN). Prevalência = estudo de referência em uma ILPI de Fortaleza (Fernandes et al., REEUSP 2019; n = 203), não média nacional.
        Veja <code>docs/01-verificacao-sugestoes-gemini.md</code>.
      </Aviso>
      <div className="flex flex-col gap-3">
        <CampoTexto className="h-11 sm:max-w-md" placeholder="Buscar por diagnóstico, código CIPE® ou CIAP-2 (ex.: P70)" valor={busca} aoMudar={setBusca} />
        <Escolha opcoes={necessidades.map((n) => ({ valor: n, rotulo: n }))} valor={necessidade} aoMudar={setNecessidade} />
        <Escolha
          opcoes={[
            { valor: "PREVALENCIA" as const, rotulo: "Por prevalência" },
            { valor: "ALFABETICA" as const, rotulo: "Alfabética" },
          ]}
          valor={ordem}
          aoMudar={setOrdem}
        />
      </div>
      <ul className="flex flex-col gap-3">
        {lista.map((c) => (
          <li key={c.id} className="rounded-xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">{c.necessidade}</p>
                <h2 className="font-semibold">
                  {c.diagnostico.termo} <CodigoCipe codigo={c.diagnostico.codigo} />
                </h2>
                <p className="text-sm">
                  Resultado: {c.resultado.termo} <CodigoCipe codigo={c.resultado.codigo} />
                </p>
                <p className="mt-1 flex flex-wrap gap-2 text-xs text-amber-800">
                  {c.ciap.map((x) => (
                    <span key={x.codigo} className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 font-mono">
                      CIAP-2 {x.codigo} {x.titulo}
                    </span>
                  ))}
                </p>
              </div>
              {c.prevalenciaReferencia !== undefined && (
                <div className="w-40 text-right text-xs">
                  <span className="font-semibold">{c.prevalenciaReferencia}%</span> no estudo
                  <div className="mt-1 h-1.5 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(c.prevalenciaReferencia, 1)}%` }} />
                  </div>
                </div>
              )}
            </div>
            {c.observacao && <p className="mt-2 text-xs text-muted-foreground">{c.observacao}</p>}
            <ul className="mt-3 flex flex-col gap-1">
              {c.intervencoes.map((i) => (
                <li key={i.id} className="flex flex-col justify-between gap-1 rounded-lg bg-muted/50 px-3 py-2 text-sm sm:flex-row">
                  <span>
                    {i.descricao}{" "}
                    <span className="text-xs text-muted-foreground">
                      — {i.cipe.termo} ({i.cipe.codigo})
                    </span>
                  </span>
                  <span className="font-mono text-xs whitespace-nowrap">{descreverAprazamento(i.aprazamento)}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
