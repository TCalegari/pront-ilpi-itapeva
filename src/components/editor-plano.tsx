"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { itemDoCatalogo, type SugestaoDiagnostico } from "@/domain/admissao";
import { interpretarHorarios } from "@/domain/aprazamento";
import { CATALOGO, buscarDiagnostico } from "@/domain/cipe/catalogo";
import type { Aprazamento, IntervencaoPrescrita, ItemPlano, Necessidade } from "@/domain/tipos";
import { AreaTexto, Aviso } from "./campos";
import { CodigoCipe } from "./selos";

const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export function descreverAprazamento(a: Aprazamento): string {
  if (a.horarios.length === 0) return "Se necessário";
  const dias = a.diasSemana?.length ? ` (${a.diasSemana.map((d) => DIAS[d]).join(", ")})` : "";
  return a.horarios.join(" · ") + dias;
}

function EditorHorarios({ aprazamento, aoMudar }: { aprazamento: Aprazamento; aoMudar: (a: Aprazamento) => void }) {
  const [texto, setTexto] = useState(aprazamento.horarios.join(", "));
  const [invalidos, setInvalidos] = useState<string[]>([]);

  return (
    <div className="flex flex-col gap-1">
      <input
        aria-label="Horários"
        className="h-11 w-full rounded-lg border bg-background px-3 font-mono text-sm"
        placeholder="Se necessário (deixe vazio) ou ex.: 08:00, 14:00, 20:00"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={() => {
          const r = interpretarHorarios(texto);
          setInvalidos(r.invalidos);
          setTexto(r.horarios.join(", "));
          aoMudar({ ...aprazamento, horarios: r.horarios });
        }}
      />
      {invalidos.length > 0 && <span className="text-xs text-red-700">Ignorados (formato inválido): {invalidos.join(", ")}</span>}
      {aprazamento.diasSemana?.length ? (
        <span className="text-xs text-muted-foreground">Somente: {aprazamento.diasSemana.map((d) => DIAS[d]).join(", ")}</span>
      ) : null}
    </div>
  );
}

function CartaoItem({ item, aoMudar, aoRemover }: { item: ItemPlano; aoMudar: (i: ItemPlano) => void; aoRemover: () => void }) {
  const modelo = buscarDiagnostico(item.diagnosticoId);
  const ausentes = modelo?.intervencoes.filter((m) => !item.intervencoes.some((i) => i.intervencaoId === m.id)) ?? [];

  const mudarIntervencao = (indice: number, nova: IntervencaoPrescrita) =>
    aoMudar({ ...item, intervencoes: item.intervencoes.map((x, i) => (i === indice ? nova : x)) });

  return (
    <article className="flex flex-col gap-3 rounded-xl border p-4">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold">{item.diagnostico.termo}</h4>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <CodigoCipe codigo={item.diagnostico.codigo} />
            {item.ciap.map((c) => (
              <span key={c.codigo} className="font-mono text-[11px] text-amber-800">
                CIAP-2 {c.codigo}
              </span>
            ))}
          </div>
          <p className="mt-1 text-sm">
            <span className="text-muted-foreground">Resultado esperado:</span> {item.resultado.termo} <CodigoCipe codigo={item.resultado.codigo} />
          </p>
        </div>
        <Button variant="destructive" size="icon-lg" aria-label="Remover diagnóstico" onClick={aoRemover}>
          <Trash2 />
        </Button>
      </header>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Evidências / fatores relacionados</span>
        <AreaTexto className="min-h-11 w-full rounded-lg border bg-background px-3 py-2 text-sm" valor={item.justificativa} aoMudar={(v) => aoMudar({ ...item, justificativa: v })} />
      </label>

      <ul className="flex flex-col gap-3">
        {item.intervencoes.map((int, i) => (
          <li key={int.intervencaoId} className="flex flex-col gap-2 rounded-lg bg-muted/50 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{int.descricao}</p>
                <p className="text-xs text-muted-foreground">
                  {int.cipe.termo} · <CodigoCipe codigo={int.cipe.codigo} /> · executa: {int.executor === "ENFERMEIRO" ? "enfermeiro" : "técnico"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label="Remover intervenção"
                onClick={() => aoMudar({ ...item, intervencoes: item.intervencoes.filter((_, j) => j !== i) })}
              >
                <Trash2 />
              </Button>
            </div>
            <EditorHorarios aprazamento={int.aprazamento} aoMudar={(a) => mudarIntervencao(i, { ...int, aprazamento: a })} />
          </li>
        ))}
      </ul>
      {ausentes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {ausentes.map((m) => (
            <Button
              key={m.id}
              variant="outline"
              className="h-11"
              onClick={() =>
                aoMudar({
                  ...item,
                  intervencoes: [
                    ...item.intervencoes,
                    { intervencaoId: m.id, cipe: m.cipe, descricao: m.descricao, aprazamento: { ...m.aprazamento }, executor: m.executor, exigeJustificativa: m.exigeJustificativa },
                  ],
                })
              }
            >
              <Plus /> {m.cipe.termo}
            </Button>
          ))}
        </div>
      )}
    </article>
  );
}

export function EditorPlano({
  itens,
  aoMudar,
  sugestoes = [],
}: {
  itens: ItemPlano[];
  aoMudar: (itens: ItemPlano[]) => void;
  sugestoes?: SugestaoDiagnostico[];
}) {
  const [escolhido, setEscolhido] = useState("");
  const presentes = new Set(itens.map((i) => i.diagnosticoId));
  const pendentes = sugestoes.filter((s) => !presentes.has(s.diagnosticoId));
  const necessidades = [...new Set(CATALOGO.map((c) => c.necessidade))] as Necessidade[];

  const adicionar = (id: string, justificativa: string) => {
    if (presentes.has(id)) return;
    aoMudar([...itens, itemDoCatalogo(id, justificativa)]);
  };

  return (
    <div className="flex flex-col gap-4">
      {pendentes.length > 0 && (
        <section className="flex flex-col gap-2 rounded-xl border border-sky-200 bg-sky-50/60 p-4">
          <h3 className="text-sm font-semibold text-sky-950">Sugestões a partir da avaliação ({pendentes.length})</h3>
          <p className="text-xs text-sky-900">O sistema sugere; o diagnóstico é decisão do enfermeiro. Confira cada um antes de adicionar.</p>
          <ul className="flex flex-col gap-2">
            {pendentes.map((s) => {
              const m = buscarDiagnostico(s.diagnosticoId)!;
              return (
                <li key={s.diagnosticoId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background p-3">
                  <div>
                    <p className="text-sm font-medium">
                      {m.diagnostico.termo} <CodigoCipe codigo={m.diagnostico.codigo} />
                    </p>
                    <p className="text-xs text-muted-foreground">{s.motivos.join(" · ")}</p>
                  </div>
                  <Button className="h-11" onClick={() => adicionar(s.diagnosticoId, s.motivos.join("; "))}>
                    <Plus /> Adicionar
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {itens.length === 0 && <Aviso tipo="alerta">Nenhum diagnóstico no plano.</Aviso>}
      {itens.map((item) => (
        <CartaoItem
          key={item.diagnosticoId}
          item={item}
          aoMudar={(novo) => aoMudar(itens.map((i) => (i.diagnosticoId === item.diagnosticoId ? novo : i)))}
          aoRemover={() => aoMudar(itens.filter((i) => i.diagnosticoId !== item.diagnosticoId))}
        />
      ))}

      <div className="flex flex-col gap-2 rounded-xl border border-dashed p-4 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1.5 text-sm">
          <span className="font-medium">Adicionar diagnóstico do catálogo</span>
          <select className="h-11 rounded-lg border bg-background px-2" value={escolhido} onChange={(e) => setEscolhido(e.target.value)}>
            <option value="">Selecione…</option>
            {necessidades.map((n) => (
              <optgroup key={n} label={n}>
                {CATALOGO.filter((c) => c.necessidade === n).map((c) => (
                  <option key={c.id} value={c.id} disabled={presentes.has(c.id)}>
                    {c.diagnostico.termo} ({c.diagnostico.codigo})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <Button
          className="h-11"
          disabled={!escolhido}
          onClick={() => {
            adicionar(escolhido, "Identificado na avaliação do enfermeiro");
            setEscolhido("");
          }}
        >
          <Plus /> Adicionar
        </Button>
      </div>
    </div>
  );
}
