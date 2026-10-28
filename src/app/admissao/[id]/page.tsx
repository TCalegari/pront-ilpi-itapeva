"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Plus, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaTexto, Aviso, Campo, CampoNumero, CampoTexto, Escolha, Marcar } from "@/components/campos";
import { EditorPlano } from "@/components/editor-plano";
import { FichaAdmissao } from "@/components/ficha-admissao";
import { FormEscala } from "@/components/form-escala";
import { SeloGrau } from "@/components/selos";
import { cn } from "@/lib/utils";
import {
  FAIXAS_SINAIS,
  OPCOES,
  grauSugerido,
  imc,
  pendenciasAdmissao,
  sugerirDiagnosticos,
  type DadosAdmissao,
  type SinaisVitais,
} from "@/domain/admissao";
import { formatarInstante, hojeLocal } from "@/domain/datas";
import { BRADEN, KATZ, MORSE } from "@/domain/escalas/escalas";
import type { GrauDependencia } from "@/domain/tipos";
import { useBanco } from "@/store/banco";
import { concluirAdmissao, profissionalAtual, salvarRascunhoAdmissao, tentar } from "@/store/acoes";

const ETAPAS = ["Identificação", "Histórico de saúde", "Sinais vitais e exame", "Escalas e grau", "Diagnósticos e plano", "Revisão e conclusão"];

type Atualizar = (fn: (d: DadosAdmissao) => DadosAdmissao) => void;

function EtapaIdentificacao({ d, atualizar }: { d: DadosAdmissao; atualizar: Atualizar }) {
  const set = <K extends keyof DadosAdmissao["identificacao"]>(k: K, v: DadosAdmissao["identificacao"][K]) =>
    atualizar((x) => ({ ...x, identificacao: { ...x.identificacao, [k]: v } }));
  const id = d.identificacao;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Campo rotulo="Nome completo *" className="sm:col-span-2">
        <CampoTexto valor={id.nome} aoMudar={(v) => set("nome", v)} autoComplete="off" />
      </Campo>
      <Campo rotulo="Nome social">
        <CampoTexto valor={id.nomeSocial} aoMudar={(v) => set("nomeSocial", v)} />
      </Campo>
      <Campo rotulo="Data de nascimento *">
        <CampoTexto type="date" valor={id.nascimento} aoMudar={(v) => set("nascimento", v)} />
      </Campo>
      <Campo rotulo="Sexo">
        <Escolha opcoes={OPCOES.sexo} valor={id.sexo} aoMudar={(v) => set("sexo", v)} />
      </Campo>
      <Campo rotulo="CPF">
        <CampoTexto inputMode="numeric" valor={id.cpf} aoMudar={(v) => set("cpf", v)} />
      </Campo>
      <Campo rotulo="Cartão Nacional de Saúde (CNS)">
        <CampoTexto inputMode="numeric" valor={id.cns} aoMudar={(v) => set("cns", v)} />
      </Campo>
      <Campo rotulo="Data de admissão *">
        <CampoTexto type="date" valor={id.dataAdmissao} aoMudar={(v) => set("dataAdmissao", v)} />
      </Campo>
      <div className="grid grid-cols-2 gap-4">
        <Campo rotulo="Quarto *">
          <CampoTexto valor={id.quarto} aoMudar={(v) => set("quarto", v)} />
        </Campo>
        <Campo rotulo="Leito">
          <CampoTexto valor={id.leito} aoMudar={(v) => set("leito", v)} />
        </Campo>
      </div>
      <Campo rotulo="Procedência" className="sm:col-span-2">
        <Escolha opcoes={OPCOES.procedencia} valor={id.procedencia} aoMudar={(v) => set("procedencia", v)} />
      </Campo>
      <Campo rotulo="Detalhes da procedência" dica="Ex.: alta hospitalar após pneumonia; motivo da institucionalização" className="sm:col-span-2">
        <CampoTexto valor={id.procedenciaDetalhe} aoMudar={(v) => set("procedenciaDetalhe", v)} />
      </Campo>
      <Campo rotulo="Responsável / curador *">
        <CampoTexto valor={id.responsavelNome} aoMudar={(v) => set("responsavelNome", v)} />
      </Campo>
      <div className="grid grid-cols-2 gap-4">
        <Campo rotulo="Parentesco">
          <CampoTexto valor={id.responsavelParentesco} aoMudar={(v) => set("responsavelParentesco", v)} />
        </Campo>
        <Campo rotulo="Telefone *">
          <CampoTexto type="tel" valor={id.responsavelTelefone} aoMudar={(v) => set("responsavelTelefone", v)} />
        </Campo>
      </div>
    </div>
  );
}

function EtapaSaude({ d, atualizar }: { d: DadosAdmissao; atualizar: Atualizar }) {
  const set = <K extends keyof DadosAdmissao["saude"]>(k: K, v: DadosAdmissao["saude"][K]) => atualizar((x) => ({ ...x, saude: { ...x.saude, [k]: v } }));
  const s = d.saude;
  return (
    <div className="grid gap-4">
      <Campo rotulo="Alergias *" dica="Medicamentos, alimentos, látex, curativos…">
        <CampoTexto valor={s.alergias} aoMudar={(v) => set("alergias", v)} disabled={s.semAlergiasConhecidas} />
      </Campo>
      <Marcar marcado={s.semAlergiasConhecidas} aoMudar={(v) => atualizar((x) => ({ ...x, saude: { ...x.saude, semAlergiasConhecidas: v, alergias: v ? "" : x.saude.alergias } }))}>
        Sem alergias conhecidas
      </Marcar>
      <Campo rotulo="Diagnósticos médicos / comorbidades" dica="Conforme relatório médico ou de alta (CID ou CIAP-2, se houver)">
        <AreaTexto valor={s.diagnosticosMedicos} aoMudar={(v) => set("diagnosticosMedicos", v)} />
      </Campo>
      <Campo rotulo="Medicamentos em uso (para reconciliação)" dica="Um por linha: nome, dose, horário. A prescrição interna será feita pelo médico.">
        <AreaTexto valor={s.medicamentosEmUso} aoMudar={(v) => set("medicamentosEmUso", v)} />
      </Campo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Marcar marcado={s.internacaoUltimos6m} aoMudar={(v) => set("internacaoUltimos6m", v)}>
          Internação nos últimos 6 meses
        </Marcar>
        <Campo rotulo="Quedas nos últimos 12 meses">
          <CampoNumero valor={s.quedasUltimos12m} aoMudar={(v) => set("quedasUltimos12m", Math.max(0, Math.round(v ?? 0)))} min={0} />
        </Campo>
      </div>
      <Campo rotulo="Dispositivos">
        <div className="flex flex-wrap gap-2">
          {OPCOES.dispositivos.map((o) => (
            <Marcar
              key={o.valor}
              marcado={s.dispositivos.includes(o.valor)}
              aoMudar={(m) => set("dispositivos", m ? [...s.dispositivos, o.valor] : s.dispositivos.filter((x) => x !== o.valor))}
            >
              {o.rotulo}
            </Marcar>
          ))}
        </div>
      </Campo>
    </div>
  );
}

function EtapaExame({ d, atualizar }: { d: DadosAdmissao; atualizar: Atualizar }) {
  const setE = <K extends keyof DadosAdmissao["exame"]>(k: K, v: DadosAdmissao["exame"][K]) => atualizar((x) => ({ ...x, exame: { ...x.exame, [k]: v } }));
  const setSv = (k: keyof SinaisVitais, v: number | undefined) => atualizar((x) => ({ ...x, sinaisVitais: { ...x.sinaisVitais, [k]: v } }));
  const e = d.exame;
  const valorImc = imc(d.sinaisVitais);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h3 className="font-semibold">Sinais vitais e antropometria</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(Object.keys(FAIXAS_SINAIS) as (keyof SinaisVitais)[]).map((k) => (
            <Campo key={k} rotulo={`${FAIXAS_SINAIS[k].rotulo}${FAIXAS_SINAIS[k].unidade ? ` (${FAIXAS_SINAIS[k].unidade})` : ""}`}>
              <CampoNumero valor={d.sinaisVitais[k]} aoMudar={(v) => setSv(k, v)} passo={k === "temperatura" || k === "peso" ? 0.1 : 1} />
            </Campo>
          ))}
        </div>
        {valorImc && <p className="text-sm text-muted-foreground">IMC: {valorImc} kg/m² (idoso: &lt; 22 baixo peso; &gt; 27 sobrepeso)</p>}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <h3 className="font-semibold sm:col-span-2">Cognição, humor e comunicação</h3>
        <Campo rotulo="Orientação *">
          <Escolha opcoes={OPCOES.orientacao} valor={e.orientacao} aoMudar={(v) => setE("orientacao", v)} />
        </Campo>
        <Campo rotulo="Cognição * (define o grau)" dica="Comprometida = déficit que exige supervisão; controlada = diagnóstico em tratamento sem impacto no autocuidado">
          <Escolha opcoes={OPCOES.cognicao} valor={e.cognicao} aoMudar={(v) => setE("cognicao", v)} />
        </Campo>
        <div className="flex flex-col gap-2">
          <Marcar marcado={e.memoriaPrejudicada} aoMudar={(v) => setE("memoriaPrejudicada", v)}>
            Dificuldade de memória
          </Marcar>
          <Marcar marcado={e.confusaoAguda} aoMudar={(v) => setE("confusaoAguda", v)}>
            Alteração aguda da atenção/consciência (suspeita de delirium)
          </Marcar>
          <Marcar marcado={e.perambulacao} aoMudar={(v) => setE("perambulacao", v)}>
            Perambulação
          </Marcar>
        </div>
        {e.confusaoAguda && <Aviso tipo="erro">Suspeita de delirium: comunique o médico. É quadro agudo, não “confusão da idade”.</Aviso>}
        <Campo rotulo="Humor">
          <Escolha opcoes={OPCOES.humor} valor={e.humor} aoMudar={(v) => setE("humor", v)} />
        </Campo>
        <Marcar marcado={e.isolamento} aoMudar={(v) => setE("isolamento", v)}>
          Isolamento social
        </Marcar>
        <Campo rotulo="Visão">
          <Escolha opcoes={OPCOES.visao} valor={e.visao} aoMudar={(v) => setE("visao", v)} />
        </Campo>
        <Campo rotulo="Audição">
          <Escolha opcoes={OPCOES.audicao} valor={e.audicao} aoMudar={(v) => setE("audicao", v)} />
        </Campo>
        <Campo rotulo="Comunicação">
          <Escolha opcoes={OPCOES.comunicacao} valor={e.comunicacao} aoMudar={(v) => setE("comunicacao", v)} />
        </Campo>
        <Campo rotulo="Sono">
          <Escolha opcoes={OPCOES.sono} valor={e.sono} aoMudar={(v) => setE("sono", v)} />
        </Campo>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <h3 className="font-semibold sm:col-span-2">Mobilidade, alimentação e eliminações</h3>
        <Campo rotulo="Deambulação *" className="sm:col-span-2">
          <Escolha opcoes={OPCOES.deambulacao} valor={e.deambulacao} aoMudar={(v) => setE("deambulacao", v)} />
        </Campo>
        <Campo rotulo="Dieta">
          <Escolha opcoes={OPCOES.dieta} valor={e.dieta} aoMudar={(v) => setE("dieta", v)} />
        </Campo>
        <Campo rotulo="Deglutição">
          <Escolha opcoes={OPCOES.degluticao} valor={e.degluticao} aoMudar={(v) => setE("degluticao", v)} />
        </Campo>
        <Campo rotulo="Aceitação alimentar">
          <Escolha opcoes={OPCOES.aceitacao} valor={e.aceitacao} aoMudar={(v) => setE("aceitacao", v)} />
        </Campo>
        <div className="flex flex-col gap-2">
          <Marcar marcado={e.perdaPeso} aoMudar={(v) => setE("perdaPeso", v)}>
            Perda de peso recente
          </Marcar>
          <Marcar marcado={e.ingestaoHidricaBaixa} aoMudar={(v) => setE("ingestaoHidricaBaixa", v)}>
            Baixa ingestão hídrica
          </Marcar>
          <Marcar marcado={e.restricaoHidrica} aoMudar={(v) => setE("restricaoHidrica", v)}>
            Restrição hídrica prescrita
          </Marcar>
        </div>
        <Campo rotulo="Eliminação urinária">
          <Escolha opcoes={OPCOES.urinaria} valor={e.urinaria} aoMudar={(v) => setE("urinaria", v)} />
        </Campo>
        <Campo rotulo="Eliminação intestinal">
          <Escolha opcoes={OPCOES.intestinal} valor={e.intestinal} aoMudar={(v) => setE("intestinal", v)} />
        </Campo>
        <Marcar marcado={e.edema} aoMudar={(v) => setE("edema", v)}>
          Edema periférico
        </Marcar>
        <Marcar marcado={e.dorCronica} aoMudar={(v) => setE("dorCronica", v)}>
          Dor crônica
        </Marcar>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-semibold">Pele</h3>
        <Aviso tipo="info">Registre toda lesão presente na chegada, com local e aspecto. Isso documenta que a lesão é anterior à admissão.</Aviso>
        {e.lesoes.map((l, i) => (
          <div key={l.id} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_2fr_auto]">
            <Campo rotulo="Local *">
              <CampoTexto valor={l.local} aoMudar={(v) => setE("lesoes", e.lesoes.map((x, j) => (j === i ? { ...x, local: v } : x)))} />
            </Campo>
            <Campo rotulo="Aspecto / estágio / medidas">
              <CampoTexto valor={l.descricao} aoMudar={(v) => setE("lesoes", e.lesoes.map((x, j) => (j === i ? { ...x, descricao: v } : x)))} />
            </Campo>
            <Button variant="destructive" size="icon-lg" className="self-end" aria-label="Remover lesão" onClick={() => setE("lesoes", e.lesoes.filter((_, j) => j !== i))}>
              <Trash2 />
            </Button>
            <div className="sm:col-span-3">
              <Escolha opcoes={OPCOES.tipoLesao} valor={l.tipo} aoMudar={(v) => setE("lesoes", e.lesoes.map((x, j) => (j === i ? { ...x, tipo: v } : x)))} />
            </div>
          </div>
        ))}
        <Button
          variant="outline"
          className="h-11 self-start"
          onClick={() => setE("lesoes", [...e.lesoes, { id: crypto.randomUUID().slice(0, 8), local: "", tipo: "LPP", descricao: "" }])}
        >
          <Plus /> Adicionar lesão
        </Button>
      </section>
    </div>
  );
}

function EtapaEscalas({ d, atualizar }: { d: DadosAdmissao; atualizar: Atualizar }) {
  const sugestao = grauSugerido(d);
  const setEscala = (k: keyof DadosAdmissao["escalas"]) => (r: Record<string, number>) => atualizar((x) => ({ ...x, escalas: { ...x.escalas, [k]: r } }));
  const precisaJustificar = sugestao && d.grau.confirmado && (sugestao.exigeConfirmacao || sugestao.grau !== d.grau.confirmado);

  return (
    <div className="flex flex-col gap-4">
      <FormEscala def={KATZ} respostas={d.escalas.KATZ} aoMudar={setEscala("KATZ")} />
      <section className="flex flex-col gap-3 rounded-xl border p-4">
        <h3 className="font-semibold">Grau de dependência (RDC 502/2021)</h3>
        {!sugestao ? (
          <p className="text-sm text-muted-foreground">Complete o Katz e a cognição (etapa anterior) para ver a sugestão.</p>
        ) : (
          <Aviso tipo={sugestao.exigeConfirmacao ? "alerta" : "info"}>
            Sugerido: <strong>Grau {sugestao.grau}</strong> — {sugestao.motivo}.
          </Aviso>
        )}
        <Escolha
          opcoes={(["I", "II", "III"] as GrauDependencia[]).map((g) => ({ valor: g, rotulo: `Grau ${g}` }))}
          valor={d.grau.confirmado}
          aoMudar={(v) => atualizar((x) => ({ ...x, grau: { ...x.grau, confirmado: v } }))}
        />
        {precisaJustificar && (
          <Campo rotulo="Justificativa do grau *">
            <AreaTexto valor={d.grau.justificativa} aoMudar={(v) => atualizar((x) => ({ ...x, grau: { ...x.grau, justificativa: v } }))} />
          </Campo>
        )}
      </section>
      <FormEscala def={MORSE} respostas={d.escalas.MORSE} aoMudar={setEscala("MORSE")} />
      <FormEscala def={BRADEN} respostas={d.escalas.BRADEN} aoMudar={setEscala("BRADEN")} />
    </div>
  );
}

export default function AdmissaoPage() {
  const { id } = useParams<{ id: string }>();
  const banco = useBanco()!;
  const router = useRouter();
  const admissao = banco.admissoes.find((a) => a.id === id);
  const [dados, setDados] = useState<DadosAdmissao | null>(admissao?.dados ?? null);
  const [etapa, setEtapa] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [salvoEm, setSalvoEm] = useState<string | null>(null);
  const alterado = useRef(false);
  const hoje = hojeLocal();

  // Rascunho salvo automaticamente (debounce) enquanto a admissão não é concluída.
  useEffect(() => {
    if (!dados || !alterado.current || admissao?.status !== "RASCUNHO") return;
    const t = setTimeout(() => {
      const e = tentar(() => salvarRascunhoAdmissao(id, dados));
      if (!e) setSalvoEm(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
      setErro(e);
    }, 600);
    return () => clearTimeout(t);
  }, [dados, id, admissao?.status]);

  if (!admissao || !dados) {
    return <Aviso tipo="erro">Admissão não encontrada.</Aviso>;
  }

  if (admissao.status === "CONCLUIDA") {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Button variant="outline" className="h-11" nativeButton={false} render={<Link href={`/residentes/${admissao.residenteId}`} />}>
            <ArrowLeft /> Prontuário
          </Button>
          <Button variant="outline" className="h-11" onClick={() => window.print()}>
            <Printer /> Imprimir
          </Button>
        </div>
        <FichaAdmissao dados={admissao.dados} hoje={hoje} autor={admissao.autor} concluidaEm={admissao.concluidaEm && formatarInstante(admissao.concluidaEm)} />
      </div>
    );
  }

  const atualizar: Atualizar = (fn) => {
    alterado.current = true;
    setDados((d) => (d ? fn(d) : d));
  };
  const pendencias = pendenciasAdmissao(dados, hoje);
  const prof = profissionalAtual(banco);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold">Admissão{dados.identificacao.nome && `: ${dados.identificacao.nome}`}</h1>
        <span className="text-xs text-muted-foreground">{salvoEm ? `Rascunho salvo às ${salvoEm}` : "Rascunho salvo automaticamente"}</span>
      </div>

      <ol className="flex gap-1 overflow-x-auto pb-1">
        {ETAPAS.map((nome, i) => {
          const n = pendencias.filter((p) => p.etapa === i).length;
          return (
            <li key={nome} className="shrink-0">
              <button
                type="button"
                onClick={() => setEtapa(i)}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm",
                  etapa === i ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                <span className="font-mono text-xs">{i + 1}</span> {nome}
                {i < 5 && (n > 0 ? <span className="rounded-full bg-amber-500 px-1.5 text-xs text-white">{n}</span> : <CheckCircle2 className="size-4 text-emerald-600" />)}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="rounded-xl border bg-card p-4 sm:p-6">
        {etapa === 0 && <EtapaIdentificacao d={dados} atualizar={atualizar} />}
        {etapa === 1 && <EtapaSaude d={dados} atualizar={atualizar} />}
        {etapa === 2 && <EtapaExame d={dados} atualizar={atualizar} />}
        {etapa === 3 && <EtapaEscalas d={dados} atualizar={atualizar} />}
        {etapa === 4 && (
          <EditorPlano itens={dados.plano} aoMudar={(plano) => atualizar((x) => ({ ...x, plano }))} sugestoes={sugerirDiagnosticos(dados)} />
        )}
        {etapa === 5 && (
          <div className="flex flex-col gap-4">
            {pendencias.length > 0 ? (
              <Aviso tipo="alerta">
                <p className="mb-1 font-medium">Pendências para concluir:</p>
                <ul className="flex flex-col gap-1">
                  {pendencias.map((p, i) => (
                    <li key={i}>
                      <button type="button" className="text-left underline" onClick={() => setEtapa(p.etapa)}>
                        {ETAPAS[p.etapa]}: {p.mensagem}
                      </button>
                    </li>
                  ))}
                </ul>
              </Aviso>
            ) : (
              <Aviso tipo="ok">Admissão completa. Confira a ficha e conclua.</Aviso>
            )}
            <Campo rotulo="Observações / evolução inicial do enfermeiro">
              <AreaTexto valor={dados.observacoes} aoMudar={(v) => atualizar((x) => ({ ...x, observacoes: v }))} />
            </Campo>
            <FichaAdmissao dados={dados} hoje={hoje} />
            {dados.grau.confirmado && (
              <p className="text-sm">
                Grau definido: <SeloGrau grau={dados.grau.confirmado} />
              </p>
            )}
            {prof.perfil !== "ENFERMEIRO" && (
              <Aviso tipo="info">O técnico pode preencher o rascunho; diagnóstico e prescrição são privativos do enfermeiro (Res. COFEN 736/2024).</Aviso>
            )}
            {erro && <Aviso tipo="erro">{erro}</Aviso>}
            <Button
              className="h-12 self-start bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={pendencias.length > 0 || prof.perfil !== "ENFERMEIRO"}
              onClick={() => {
                const e1 = tentar(() => salvarRascunhoAdmissao(id, dados));
                const e2 = e1 ?? tentar(() => concluirAdmissao(id));
                setErro(e2);
                if (!e2) router.push(`/residentes/${admissao.residenteId}`);
              }}
            >
              <CheckCircle2 /> Concluir admissão e ativar SAE
            </Button>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" className="h-11" disabled={etapa === 0} onClick={() => setEtapa((e) => e - 1)}>
          <ArrowLeft /> Anterior
        </Button>
        <Button variant="outline" className="h-11" disabled={etapa === ETAPAS.length - 1} onClick={() => setEtapa((e) => e + 1)}>
          Próxima <ArrowRight />
        </Button>
      </div>
    </div>
  );
}
