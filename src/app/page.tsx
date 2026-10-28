"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ClipboardCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeloGrau, SeloPrazo } from "@/components/selos";
import { estaAtrasado, ocorrenciasDoPlantao, plantaoDe } from "@/domain/aprazamento";
import { agoraLocal, formatarInstante } from "@/domain/datas";
import { useBanco } from "@/store/banco";
import { iniciarAdmissao } from "@/store/acoes";
import { checagemVigente, residentesAtivos, situacaoResidente } from "@/store/consultas";
import { rotuloPlantao } from "@/components/folha-checagem";

export default function PainelPage() {
  const banco = useBanco()!;
  const router = useRouter();
  const agora = agoraLocal();
  const plantao = plantaoDe(agora);

  const emAdmissao = banco.admissoes.filter((a) => a.status === "RASCUNHO");
  const situacoes = residentesAtivos(banco).map((r) => situacaoResidente(banco, r));
  const revisoes = situacoes.filter((s) => s.prazoSae && s.prazoSae.situacao !== "EM_DIA");
  const escalas = situacoes.filter((s) => s.prazosEscalas.some((e) => !e.prazo || e.prazo.situacao !== "EM_DIA"));

  let total = 0;
  let feitas = 0;
  let atrasadas = 0;
  for (const s of situacoes) {
    if (!s.plano) continue;
    for (const o of ocorrenciasDoPlantao(s.plano.itens, plantao)) {
      total++;
      if (checagemVigente(banco, s.residente.id, o.intervencao.intervencaoId, o.programadoPara)) feitas++;
      else if (estaAtrasado(o.programadoPara, agora)) atrasadas++;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Painel da enfermagem</h1>
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

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/checagem" className="rounded-xl border p-4 hover:bg-muted/50">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <ClipboardCheck className="size-4" /> {rotuloPlantao(plantao)}
          </p>
          <p className="mt-2 text-3xl font-semibold">
            {feitas}/{total}
          </p>
          <p className="text-sm">cuidados checados {atrasadas > 0 && <span className="font-medium text-amber-700">· {atrasadas} atrasado(s)</span>}</p>
        </Link>
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">SAE para revisar</p>
          <p className="mt-2 text-3xl font-semibold">{revisoes.length}</p>
          <p className="text-sm">vence hoje ou vencida</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Admissões em andamento</p>
          <p className="mt-2 text-3xl font-semibold">{emAdmissao.length}</p>
          <p className="text-sm">rascunhos não concluídos</p>
        </div>
      </div>

      {emAdmissao.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-4 text-amber-600" /> Admissões pendentes
          </h2>
          <ul className="flex flex-col gap-2">
            {emAdmissao.map((a) => (
              <li key={a.id}>
                <Link href={`/admissao/${a.id}`} className="flex flex-wrap justify-between gap-2 rounded-lg border p-3 hover:bg-muted/50">
                  <span className="font-medium">{a.dados.identificacao.nome || "Sem nome"}</span>
                  <span className="text-sm text-muted-foreground">Atualizada em {formatarInstante(a.atualizadaEm)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Reavaliações (SAE e escalas)</h2>
        {revisoes.length === 0 && escalas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nada vencido.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {situacoes
              .filter((s) => revisoes.includes(s) || escalas.includes(s))
              .map((s) => (
                <li key={s.residente.id}>
                  <Link href={`/residentes/${s.residente.id}`} className="flex flex-col gap-2 rounded-lg border p-3 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between">
                    <span className="flex items-center gap-2 font-medium">
                      {s.residente.nome} <SeloGrau grau={s.residente.grau} />
                    </span>
                    <span className="flex flex-wrap gap-1">
                      <SeloPrazo rotulo="SAE" prazo={s.prazoSae} />
                      {s.prazosEscalas.map((e) => (
                        <SeloPrazo key={e.escala} rotulo={e.escala === "MORSE" ? "Morse" : "Braden"} prazo={e.prazo} />
                      ))}
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}
