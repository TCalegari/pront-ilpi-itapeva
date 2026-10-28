import { cn } from "@/lib/utils";
import { formatarData } from "@/domain/datas";
import type { Prazo } from "@/domain/reavaliacao";
import type { GrauDependencia } from "@/domain/tipos";

const base = "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap";

export function SeloGrau({ grau }: { grau?: GrauDependencia }) {
  if (!grau) return <span className={cn(base, "text-muted-foreground")}>Grau não definido</span>;
  const cor = { I: "border-emerald-200 bg-emerald-50 text-emerald-800", II: "border-amber-200 bg-amber-50 text-amber-800", III: "border-red-200 bg-red-50 text-red-800" };
  return <span className={cn(base, cor[grau])}>Grau {grau}</span>;
}

export function SeloPrazo({ prazo, rotulo }: { prazo?: Prazo; rotulo: string }) {
  if (!prazo) return <span className={cn(base, "text-muted-foreground")}>{rotulo}: sem registro</span>;
  const estilo = {
    EM_DIA: "border-emerald-200 bg-emerald-50 text-emerald-800",
    VENCE_HOJE: "border-amber-200 bg-amber-50 text-amber-800",
    VENCIDA: "border-red-200 bg-red-50 text-red-800",
  }[prazo.situacao];
  const texto = {
    EM_DIA: `até ${formatarData(prazo.previstoPara)}`,
    VENCE_HOJE: "vence hoje",
    VENCIDA: `vencida há ${-prazo.diasRestantes} dia(s)`,
  }[prazo.situacao];
  return (
    <span className={cn(base, estilo)}>
      {rotulo}: {texto}
    </span>
  );
}

export function SeloNivel({ nivel, children }: { nivel: "BAIXO" | "MEDIO" | "ALTO"; children: React.ReactNode }) {
  const estilo = {
    BAIXO: "border-emerald-200 bg-emerald-50 text-emerald-800",
    MEDIO: "border-amber-200 bg-amber-50 text-amber-800",
    ALTO: "border-red-200 bg-red-50 text-red-800",
  }[nivel];
  return <span className={cn(base, estilo)}>{children}</span>;
}

export function CodigoCipe({ codigo }: { codigo: string }) {
  return <span className="font-mono text-[11px] text-muted-foreground">CIPE® {codigo}</span>;
}
