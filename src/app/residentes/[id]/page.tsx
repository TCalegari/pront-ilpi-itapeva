"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FileText, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaTexto, Aviso, Campo, Escolha } from "@/components/campos";
import { descreverAprazamento } from "@/components/editor-plano";
import { FolhaResidente, rotuloPlantao } from "@/components/folha-checagem";
import { FormEscala } from "@/components/form-escala";
import { CodigoCipe, SeloGrau, SeloNivel, SeloPrazo } from "@/components/selos";
import { cn } from "@/lib/utils";
import { plantaoDe } from "@/domain/aprazamento";
import { buscarDiagnostico } from "@/domain/cipe/catalogo";
import { agoraLocal, formatarData, formatarInstante, hojeLocal, idade } from "@/domain/datas";
import { BRADEN, ESCALAS, MORSE, KATZ, type EscalaId, type Respostas } from "@/domain/escalas/escalas";
import { useBanco } from "@/store/banco";
import { profissionalAtual, registrarAnotacao, registrarEscala, registrarVisualizacao, tentar } from "@/store/acoes";
import { historicoPlanos, situacaoResidente } from "@/store/consultas";
import type { BancoLocal, PlanoCuidados, Residente } from "@/store/modelo";

const ABAS = ["SAE vigente", "Checagem do plantão", "Escalas", "Anotações", "Histórico da SAE"] as const;
type Aba = (typeof ABAS)[number];

function PlanoVisual({ plano }: { plano: PlanoCuidados }) {
  return (
    <div className="flex flex-col gap-3">
      {plano.itens.map((item) => (
        <article key={item.diagnosticoId} className="rounded-xl border p-4">
          <h3 className="font-semibold">
            {item.diagnostico.termo} <CodigoCipe codigo={item.diagnostico.codigo} />
          </h3>
          <p className="text-sm text-muted-foreground">Evidências: {item.justificativa || "—"}</p>
          <p className="text-sm">
            Resultado esperado: {item.resultado.termo} <CodigoCipe codigo={item.resultado.codigo} />
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {item.intervencoes.map((i) => (
              <li key={i.intervencaoId} className="flex flex-col justify-between gap-1 rounded-lg bg-muted/50 px-3 py-2 text-sm sm:flex-row">
                <span>{i.descricao}</span>
                <span className="font-mono text-xs whitespace-nowrap">{descreverAprazamento(i.aprazamento)}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function AbaEscalas({ banco, residente, plano }: { banco: BancoLocal; residente: Residente; plano?: PlanoCuidados }) {
  const [escala, setEscala] = useState<EscalaId | null>(null);
  const [respostas, setRespostas] = useState<Respostas>({});
  const [contexto, setContexto] = useState<"REAVALIACAO" | "EVENTO">("REAVALIACAO");
  const [obs, setObs] = useState("");
  const [msg, setMsg] = useState<{ tipo: "erro" | "alerta" | "ok"; texto: string } | null>(null);
  const aplicacoes = banco.escalas.filter((e) => e.residenteId === residente.id).sort((a, b) => b.registradoEm.localeCompare(a.registradoEm));
  const temDiagnostico = (id: string) => plano?.itens.some((i) => i.diagnosticoId === id) ?? false;

  const salvar = () => {
    if (!escala) return;
    const e = tentar(() => registrarEscala(residente.id, escala, respostas, contexto, obs));
    if (e) return setMsg({ tipo: "erro", texto: e });
    const r = ESCALAS[escala].calcular(respostas);
    const incoerente =
      (escala === "MORSE" && r.nivel !== "BAIXO" && !temDiagnostico("risco-queda")) ||
      (escala === "BRADEN" && r.pontuacao <= 18 && !temDiagnostico("risco-lpp"));
    setMsg(
      incoerente
        ? { tipo: "alerta", texto: `${r.classificacao} (${r.pontuacao}) sem o diagnóstico correspondente na SAE — considere revisar o plano.` }
        : { tipo: "ok", texto: `Registrado: ${r.pontuacao} — ${r.classificacao}` },
    );
    setEscala(null);
    setRespostas({});
    setObs("");
  };

  return (
    <div className="flex flex-col gap-4">
      {msg && <Aviso tipo={msg.tipo}>{msg.texto}</Aviso>}
      {!escala ? (
        <div className="flex flex-wrap gap-2">
          {[MORSE, BRADEN, KATZ].map((d) => (
            <Button key={d.id} variant="outline" className="h-11" onClick={() => (setEscala(d.id), setMsg(null))}>
              Aplicar {d.nome}
            </Button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <FormEscala def={ESCALAS[escala]} respostas={respostas} aoMudar={setRespostas} />
          <Escolha
            opcoes={[
              { valor: "REAVALIACAO" as const, rotulo: "Reavaliação periódica" },
              { valor: "EVENTO" as const, rotulo: "Por evento (queda, internação, piora)" },
            ]}
            valor={contexto}
            aoMudar={setContexto}
          />
          <Campo rotulo={contexto === "EVENTO" ? "Descreva o evento *" : "Observação"}>
            <AreaTexto valor={obs} aoMudar={setObs} className="min-h-16 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          </Campo>
          <div className="flex gap-2">
            <Button className="h-11" onClick={salvar}>
              Registrar
            </Button>
            <Button variant="outline" className="h-11" onClick={() => setEscala(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
      <ul className="flex flex-col gap-2">
        {aplicacoes.map((a) => {
          const nivel = ESCALAS[a.escala].calcular(a.respostas).nivel;
          return (
            <li key={a.id} className="flex flex-col gap-1 rounded-lg border p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="flex flex-wrap items-center gap-2">
                <strong>{ESCALAS[a.escala].nome}</strong>
                <SeloNivel nivel={nivel}>
                  {a.pontuacao} — {a.classificacao}
                </SeloNivel>
                <span className="text-xs text-muted-foreground">
                  {a.contexto === "ADMISSAO" ? "admissão" : a.contexto === "EVENTO" ? `evento: ${a.observacao}` : "reavaliação"}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">
                {formatarInstante(a.registradoEm)} · {a.autor.split(" – ")[0]}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AbaAnotacoes({ banco, residente }: { banco: BancoLocal; residente: Residente }) {
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const lista = banco.anotacoes.filter((a) => a.residenteId === residente.id).sort((a, b) => b.registradoEm.localeCompare(a.registradoEm));
  return (
    <div className="flex flex-col gap-3">
      <Campo rotulo="Nova anotação de enfermagem" dica="Registro do que foi observado e feito. Não pode ser editada depois.">
        <AreaTexto valor={texto} aoMudar={setTexto} />
      </Campo>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Button
        className="h-11 self-start"
        onClick={() => {
          const e = tentar(() => registrarAnotacao(residente.id, texto));
          setErro(e);
          if (!e) setTexto("");
        }}
      >
        Registrar anotação
      </Button>
      <ul className="flex flex-col gap-2">
        {lista.map((a) => (
          <li key={a.id} className="rounded-lg border p-3 text-sm">
            <p className="whitespace-pre-line">{a.texto}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatarInstante(a.registradoEm)} — {a.autor}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ProntuarioPage() {
  const { id } = useParams<{ id: string }>();
  const banco = useBanco()!;
  const [aba, setAba] = useState<Aba>("SAE vigente");
  const residente = banco.residentes.find((r) => r.id === id);

  useEffect(() => {
    registrarVisualizacao(id);
  }, [id]);

  if (!residente) return <Aviso tipo="erro">Residente não encontrado.</Aviso>;

  const hoje = hojeLocal();
  const situacao = situacaoResidente(banco, residente, hoje);
  const plano = situacao.plano;
  const admissao = banco.admissoes.find((a) => a.residenteId === id && a.status === "CONCLUIDA");
  const prof = profissionalAtual(banco);
  const plantao = plantaoDe(agoraLocal());

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-3 rounded-xl border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{residente.nome}</h1>
            <p className="text-sm text-muted-foreground">
              {idade(residente.nascimento, hoje)} anos · Quarto {residente.quarto}
              {residente.leito && ` / ${residente.leito}`} · admitido em {formatarData(residente.dataAdmissao)}
              {residente.responsavel.nome && ` · Responsável: ${residente.responsavel.nome} ${residente.responsavel.telefone}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {admissao && (
              <Button variant="outline" className="h-11" nativeButton={false} render={<Link href={`/admissao/${admissao.id}`} />}>
                <FileText /> Ficha de admissão
              </Button>
            )}
            {plano && prof.perfil === "ENFERMEIRO" && (
              <Button className="h-11" nativeButton={false} render={<Link href={`/residentes/${id}/revisar-sae`} />}>
                <PencilLine /> Revisar SAE
              </Button>
            )}
          </div>
        </div>
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-semibold",
            residente.alergias ? "bg-red-600 text-white" : "border border-emerald-200 bg-emerald-50 text-emerald-800",
          )}
        >
          {residente.alergias ? `ALERGIAS: ${residente.alergias}` : "Sem alergias conhecidas"}
        </div>
        <div className="flex flex-wrap gap-1">
          <SeloGrau grau={residente.grau} />
          <SeloPrazo rotulo="Revisão da SAE" prazo={situacao.prazoSae} />
          {situacao.prazosEscalas.map((e) => (
            <SeloPrazo key={e.escala} rotulo={e.escala === "MORSE" ? "Morse" : "Braden"} prazo={e.prazo} />
          ))}
        </div>
      </header>

      <nav className="flex gap-1 overflow-x-auto">
        {ABAS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAba(a)}
            className={cn("min-h-11 shrink-0 rounded-lg px-3 text-sm", aba === a ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
          >
            {a}
          </button>
        ))}
      </nav>

      {aba === "SAE vigente" &&
        (plano ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Versão {plano.versao} ({plano.origem === "ADMISSAO" ? "admissão" : "revisão"}) · vigente desde {formatarData(plano.vigenteDesde)} · {plano.autor}
            </p>
            <PlanoVisual plano={plano} />
          </div>
        ) : (
          <Aviso tipo="alerta">Residente sem SAE.</Aviso>
        ))}

      {aba === "Checagem do plantão" &&
        (plano ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">{rotuloPlantao(plantao)}</p>
            <FolhaResidente banco={banco} residente={residente} plano={plano} plantao={plantao} mostrarCabecalho={false} />
          </div>
        ) : (
          <Aviso tipo="alerta">Sem SAE vigente.</Aviso>
        ))}

      {aba === "Escalas" && <AbaEscalas banco={banco} residente={residente} plano={plano} />}
      {aba === "Anotações" && <AbaAnotacoes banco={banco} residente={residente} />}

      {aba === "Histórico da SAE" && (
        <ol className="flex flex-col gap-3">
          {historicoPlanos(banco, id).map((p) => (
            <li key={p.id}>
              <details className="rounded-xl border p-4" open={p.id === plano?.id}>
                <summary className="cursor-pointer text-sm font-medium">
                  Versão {p.versao} — {formatarData(p.vigenteDesde)} — Grau {p.grau} — {p.autor.split(" – ")[0]}
                </summary>
                <div className="mt-3 flex flex-col gap-3">
                  <div className="rounded-lg bg-muted/50 p-3 text-sm">
                    <p className="font-medium">Evolução de enfermagem</p>
                    <p className="whitespace-pre-line">{p.evolucao}</p>
                    {p.avaliacaoAnterior.length > 0 && (
                      <ul className="mt-2 text-xs">
                        {p.avaliacaoAnterior.map((a) => (
                          <li key={a.diagnosticoId}>
                            {buscarDiagnostico(a.diagnosticoId)?.diagnostico.termo ?? a.diagnosticoId}: {a.resultado === "ALCANCADO" ? "resultado alcançado" : a.resultado === "PARCIAL" ? "parcialmente alcançado" : "não alcançado"}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <PlanoVisual plano={p} />
                </div>
              </details>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
