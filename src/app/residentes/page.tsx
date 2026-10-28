"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampoTexto, Escolha } from "@/components/campos";
import { SeloGrau, SeloPrazo } from "@/components/selos";
import { hojeLocal, idade } from "@/domain/datas";
import { useBanco } from "@/store/banco";
import { iniciarAdmissao } from "@/store/acoes";
import { situacaoResidente } from "@/store/consultas";
import type { StatusResidente } from "@/store/modelo";

const FILTROS: { valor: StatusResidente | "TODOS"; rotulo: string }[] = [
  { valor: "ATIVO", rotulo: "Ativos" },
  { valor: "EM_ADMISSAO", rotulo: "Em admissão" },
  { valor: "TODOS", rotulo: "Todos" },
];

export default function ResidentesPage() {
  const banco = useBanco()!;
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<StatusResidente | "TODOS">("ATIVO");
  const hoje = hojeLocal();

  const lista = banco.residentes
    .filter((r) => filtro === "TODOS" || r.status === filtro)
    .filter((r) => r.nome.toLowerCase().includes(busca.trim().toLowerCase()))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Residentes</h1>
        <Button
          className="h-11"
          onClick={() => {
            const id = iniciarAdmissao();
            router.push(`/admissao/${id}`);
          }}
        >
          <UserPlus /> Nova admissão
        </Button>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <CampoTexto className="h-11 sm:max-w-xs" placeholder="Buscar por nome" valor={busca} aoMudar={setBusca} />
        <Escolha opcoes={FILTROS} valor={filtro} aoMudar={setFiltro} />
      </div>
      <ul className="flex flex-col gap-2">
        {lista.map((r) => {
          const adm = banco.admissoes.find((a) => a.residenteId === r.id && a.status === "RASCUNHO");
          const s = situacaoResidente(banco, r, hoje);
          const href = r.status === "EM_ADMISSAO" && adm ? `/admissao/${adm.id}` : `/residentes/${r.id}`;
          return (
            <li key={r.id}>
              <Link href={href} className="flex flex-col gap-2 rounded-xl border p-4 hover:bg-muted/50 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2 font-medium">
                    {r.nome || "Sem nome"}
                    {r.status === "EM_ADMISSAO" ? (
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs text-sky-800">Em admissão</span>
                    ) : (
                      <SeloGrau grau={r.grau} />
                    )}
                    {r.alergias && <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">Alergia</span>}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {r.nascimento && `${idade(r.nascimento, hoje)} anos · `}Quarto {r.quarto || "—"}
                    {r.leito && ` / ${r.leito}`}
                  </span>
                </div>
                {r.status === "ATIVO" && (
                  <span className="flex flex-wrap gap-1">
                    <SeloPrazo rotulo="SAE" prazo={s.prazoSae} />
                  </span>
                )}
              </Link>
            </li>
          );
        })}
        {lista.length === 0 && <p className="text-sm text-muted-foreground">Nenhum residente encontrado.</p>}
      </ul>
    </div>
  );
}
