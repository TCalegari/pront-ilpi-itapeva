"use client";

import { respostasCompletas, type DefinicaoEscala, type Respostas } from "@/domain/escalas/escalas";
import { Escolha } from "./campos";
import { SeloNivel } from "./selos";

export function FormEscala({ def, respostas, aoMudar }: { def: DefinicaoEscala; respostas: Respostas; aoMudar: (r: Respostas) => void }) {
  const completa = respostasCompletas(def, respostas);
  const resultado = completa ? def.calcular(respostas) : null;
  const respondidos = def.itens.filter((i) => respostas[i.id] !== undefined).length;

  return (
    <section className="flex flex-col gap-4 rounded-xl border p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{def.nome}</h3>
          <p className="text-xs text-muted-foreground">{def.referencia}</p>
        </div>
        {resultado ? (
          <SeloNivel nivel={resultado.nivel}>
            {resultado.pontuacao} pts — {resultado.classificacao}
          </SeloNivel>
        ) : (
          <span className="text-xs text-muted-foreground">
            {respondidos}/{def.itens.length} itens
          </span>
        )}
      </header>
      {def.itens.map((item) => (
        <div key={item.id} className="flex flex-col gap-2">
          <span className="text-sm font-medium">{item.titulo}</span>
          <Escolha
            opcoes={item.opcoes.map((o) => ({ valor: o.valor, rotulo: def.id === "KATZ" ? o.rotulo : `${o.rotulo} (${o.valor})` }))}
            valor={respostas[item.id]}
            aoMudar={(v) => aoMudar({ ...respostas, [item.id]: v })}
          />
        </div>
      ))}
    </section>
  );
}
