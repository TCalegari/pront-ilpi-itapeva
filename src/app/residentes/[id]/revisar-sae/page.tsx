"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaTexto, Aviso, Campo, Escolha } from "@/components/campos";
import { EditorPlano } from "@/components/editor-plano";
import { SeloPrazo } from "@/components/selos";
import type { SugestaoDiagnostico } from "@/domain/admissao";
import { hojeLocal } from "@/domain/datas";
import { BRADEN, MORSE } from "@/domain/escalas/escalas";
import type { GrauDependencia, ItemPlano } from "@/domain/tipos";
import { useBanco } from "@/store/banco";
import { profissionalAtual, revisarPlano, tentar } from "@/store/acoes";
import { situacaoResidente, ultimaEscala } from "@/store/consultas";
import type { AvaliacaoResultado, BancoLocal } from "@/store/modelo";

const RESULTADOS: { valor: AvaliacaoResultado; rotulo: string }[] = [
  { valor: "ALCANCADO", rotulo: "Alcançado" },
  { valor: "PARCIAL", rotulo: "Parcial" },
  { valor: "NAO_ALCANCADO", rotulo: "Não alcançado" },
];

/** Sugestões da revisão a partir das últimas escalas aplicadas. */
function sugestoesPorEscalas(banco: BancoLocal, residenteId: string): SugestaoDiagnostico[] {
  const s: SugestaoDiagnostico[] = [];
  const morse = ultimaEscala(banco, residenteId, "MORSE");
  if (morse && MORSE.calcular(morse.respostas).nivel !== "BAIXO") s.push({ diagnosticoId: "risco-queda", motivos: [`Última Morse: ${morse.pontuacao}`] });
  const braden = ultimaEscala(banco, residenteId, "BRADEN");
  if (braden && BRADEN.calcular(braden.respostas).pontuacao <= 18) s.push({ diagnosticoId: "risco-lpp", motivos: [`Última Braden: ${braden.pontuacao}`] });
  return s;
}

export default function RevisarSaePage() {
  const { id } = useParams<{ id: string }>();
  const banco = useBanco()!;
  const router = useRouter();
  const residente = banco.residentes.find((r) => r.id === id);
  const situacao = residente ? situacaoResidente(banco, residente, hojeLocal()) : undefined;
  const anterior = situacao?.plano;

  const [itens, setItens] = useState<ItemPlano[]>(() => structuredClone(anterior?.itens ?? []));
  const [grau, setGrau] = useState<GrauDependencia | undefined>(residente?.grau);
  const [evolucao, setEvolucao] = useState("");
  const [avaliacao, setAvaliacao] = useState<Record<string, AvaliacaoResultado>>({});
  const [erro, setErro] = useState<string | null>(null);

  if (!residente || !anterior || !situacao) return <Aviso tipo="erro">Residente ou SAE não encontrada.</Aviso>;
  const prof = profissionalAtual(banco);
  if (prof.perfil !== "ENFERMEIRO") return <Aviso tipo="erro">Revisão da SAE é privativa do enfermeiro.</Aviso>;

  const faltaAvaliar = anterior.itens.filter((i) => !avaliacao[i.diagnosticoId]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Revisar SAE — {residente.nome}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          Versão vigente: {anterior.versao} <SeloPrazo rotulo="Prazo" prazo={situacao.prazoSae} />
        </p>
      </div>

      <section className="flex flex-col gap-3 rounded-xl border p-4">
        <h2 className="font-semibold">1. Avaliação dos resultados esperados</h2>
        {anterior.itens.map((i) => (
          <div key={i.diagnosticoId} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm">
              <strong>{i.diagnostico.termo}</strong> → {i.resultado.termo}
            </span>
            <Escolha opcoes={RESULTADOS} valor={avaliacao[i.diagnosticoId]} aoMudar={(v) => setAvaliacao((a) => ({ ...a, [i.diagnosticoId]: v }))} />
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-xl border p-4">
        <h2 className="font-semibold">2. Evolução de enfermagem *</h2>
        <AreaTexto valor={evolucao} aoMudar={setEvolucao} placeholder="Estado atual, resposta aos cuidados, intercorrências e justificativa das mudanças no plano." />
        <Campo rotulo="Grau de dependência" dica="Mudou o grau? A periodicidade de revisão passa a seguir o novo grau.">
          <Escolha opcoes={(["I", "II", "III"] as GrauDependencia[]).map((g) => ({ valor: g, rotulo: `Grau ${g}` }))} valor={grau} aoMudar={setGrau} />
        </Campo>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">3. Diagnósticos e prescrição de enfermagem</h2>
        <EditorPlano itens={itens} aoMudar={setItens} sugestoes={sugestoesPorEscalas(banco, id)} />
      </section>

      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      {faltaAvaliar.length > 0 && <Aviso tipo="alerta">Avalie o resultado de todos os diagnósticos anteriores ({faltaAvaliar.length} pendente(s)).</Aviso>}
      <Button
        className="h-12 self-start"
        disabled={faltaAvaliar.length > 0 || !grau}
        onClick={() => {
          const e = tentar(() =>
            revisarPlano(id, {
              grau: grau!,
              itens,
              evolucao,
              avaliacaoAnterior: anterior.itens.map((i) => ({ diagnosticoId: i.diagnosticoId, resultado: avaliacao[i.diagnosticoId] })),
            }),
          );
          setErro(e);
          if (!e) router.push(`/residentes/${id}`);
        }}
      >
        <Save /> Salvar nova versão da SAE
      </Button>
    </div>
  );
}
