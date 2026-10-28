"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, FlaskConical, Home, LibraryBig, Pill, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBanco } from "@/store/banco";
import { profissionalAtual, trocarProfissional } from "@/store/acoes";

const NAV = [
  { href: "/", rotulo: "Painel", icone: Home },
  { href: "/residentes", rotulo: "Residentes", icone: Users },
  { href: "/checagem", rotulo: "Checagem do plantão", icone: ClipboardCheck },
  { href: "/catalogo", rotulo: "Catálogo CIPE®", icone: LibraryBig },
  { href: "/prescricao-medica", rotulo: "Prescrição médica", icone: Pill },
  { href: "/configuracoes", rotulo: "Parâmetros", icone: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const banco = useBanco();
  const pathname = usePathname();
  const prof = banco ? profissionalAtual(banco) : null;

  return (
    <div className="flex min-h-full flex-col">
      <div className="bg-amber-100 px-4 py-1.5 text-center text-xs text-amber-900 print:hidden">
        <FlaskConical className="mr-1 inline size-3.5" />
        Protótipo — somente dados fictícios, guardados neste navegador. Não use com dados reais de residentes.
      </div>
      <header className="border-b bg-card print:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="font-semibold tracking-tight">
            Prontuário ILPI
          </Link>
          {banco && prof && (
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Perfil:</span>
              <select
                className="h-11 rounded-lg border bg-background px-2 text-sm"
                value={prof.id}
                onChange={(e) => trocarProfissional(e.target.value)}
              >
                {banco.profissionais.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} ({p.perfil === "ENFERMEIRO" ? "Enfermeira" : "Técnico"})
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 pb-2">
          {NAV.map(({ href, rotulo, icone: Icone }) => {
            const ativo = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm",
                  ativo ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Icone className="size-4" />
                {rotulo}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {banco ? children : <p className="text-sm text-muted-foreground">Carregando…</p>}
      </main>
    </div>
  );
}
