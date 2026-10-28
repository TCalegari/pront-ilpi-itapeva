"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

// Campos de formulário com alvos de toque grandes (uso em tablet à beira-leito).

export function Campo({ rotulo, dica, className, children }: { rotulo: string; dica?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn("flex flex-col gap-1.5 text-sm", className)}>
      <span className="font-medium">{rotulo}</span>
      {children}
      {dica && <span className="text-xs text-muted-foreground">{dica}</span>}
    </label>
  );
}

export function Escolha<T extends string | number>({
  opcoes,
  valor,
  aoMudar,
  vertical,
}: {
  opcoes: { valor: T; rotulo: string }[];
  valor: T | "" | undefined;
  aoMudar: (v: T) => void;
  vertical?: boolean;
}) {
  return (
    <div className={cn("flex gap-2", vertical ? "flex-col" : "flex-wrap")} role="radiogroup">
      {opcoes.map((o) => (
        <button
          key={String(o.valor)}
          type="button"
          role="radio"
          aria-checked={valor === o.valor}
          onClick={() => aoMudar(o.valor)}
          className={cn(
            "min-h-11 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
            valor === o.valor ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted",
          )}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}

export function Marcar({ marcado, aoMudar, children }: { marcado: boolean; aoMudar: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={marcado}
      onClick={() => aoMudar(!marcado)}
      className={cn(
        "flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm",
        marcado ? "border-primary bg-primary/5" : "bg-background hover:bg-muted",
      )}
    >
      <span className={cn("grid size-5 shrink-0 place-items-center rounded border", marcado && "border-primary bg-primary text-primary-foreground")}>
        {marcado && "✓"}
      </span>
      {children}
    </button>
  );
}

export function CampoTexto({ valor, aoMudar, ...props }: { valor: string; aoMudar: (v: string) => void } & Omit<React.ComponentProps<"input">, "value" | "onChange">) {
  return <Input className="h-11" value={valor} onChange={(e) => aoMudar(e.target.value)} {...props} />;
}

export function CampoNumero({
  valor,
  aoMudar,
  passo = 1,
  ...props
}: { valor: number | undefined; aoMudar: (v: number | undefined) => void; passo?: number } & Omit<React.ComponentProps<"input">, "value" | "onChange">) {
  return (
    <Input
      className="h-11"
      type="number"
      inputMode="decimal"
      step={passo}
      value={valor ?? ""}
      onChange={(e) => {
        const t = e.target.value.replace(",", ".");
        aoMudar(t === "" ? undefined : Number(t));
      }}
      {...props}
    />
  );
}

export function AreaTexto({ valor, aoMudar, ...props }: { valor: string; aoMudar: (v: string) => void } & Omit<React.ComponentProps<"textarea">, "value" | "onChange">) {
  return (
    <textarea
      className="min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      value={valor}
      onChange={(e) => aoMudar(e.target.value)}
      {...props}
    />
  );
}

export function Aviso({ tipo = "info", children }: { tipo?: "info" | "erro" | "alerta" | "ok"; children: React.ReactNode }) {
  const estilos = {
    info: "border-sky-200 bg-sky-50 text-sky-900",
    erro: "border-red-200 bg-red-50 text-red-900",
    alerta: "border-amber-200 bg-amber-50 text-amber-900",
    ok: "border-emerald-200 bg-emerald-50 text-emerald-900",
  };
  return <div className={cn("rounded-lg border px-3 py-2 text-sm", estilos[tipo])}>{children}</div>;
}
