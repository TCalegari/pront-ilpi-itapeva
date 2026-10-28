import { OPCOES, grauSugerido, imc, FAIXAS_SINAIS, type DadosAdmissao, type SinaisVitais } from "@/domain/admissao";
import { formatarData, idade } from "@/domain/datas";
import { BRADEN, KATZ, MORSE, dependenciasKatz, respostasCompletas } from "@/domain/escalas/escalas";
import { descreverAprazamento } from "./editor-plano";

function rotulo<K extends keyof typeof OPCOES>(lista: K, valor: string): string {
  return (OPCOES[lista] as readonly { valor: string; rotulo: string }[]).find((o) => o.valor === valor)?.rotulo ?? "—";
}

function Linha({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-sm">
      <dt className="w-44 shrink-0 text-muted-foreground">{k}</dt>
      <dd className="min-w-0 flex-1 break-words">{v || "—"}</dd>
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid border-t pt-3">
      <h3 className="mb-2 text-sm font-semibold tracking-wide uppercase">{titulo}</h3>
      <dl className="flex flex-col gap-1">{children}</dl>
    </section>
  );
}

export function FichaAdmissao({ dados, hoje, autor, concluidaEm }: { dados: DadosAdmissao; hoje: string; autor?: string; concluidaEm?: string }) {
  const { identificacao: id, saude, sinaisVitais: sv, exame: e, escalas } = dados;
  const sugestao = grauSugerido(dados);
  const valorImc = imc(sv);
  const sinais = (Object.keys(FAIXAS_SINAIS) as (keyof SinaisVitais)[])
    .filter((k) => sv[k] !== undefined)
    .map((k) => `${FAIXAS_SINAIS[k].rotulo} ${sv[k]}${FAIXAS_SINAIS[k].unidade ? ` ${FAIXAS_SINAIS[k].unidade}` : ""}`)
    .join(" · ");
  const resumoEscala = (def: typeof MORSE, r: Record<string, number>) => {
    if (!respostasCompletas(def, r)) return "Incompleta";
    const x = def.calcular(r);
    return `${x.pontuacao} — ${x.classificacao}`;
  };

  return (
    <article className="flex flex-col gap-4">
      <header>
        <h2 className="text-lg font-semibold">Ficha de admissão — Avaliação de Enfermagem</h2>
        <p className="text-xs text-muted-foreground">Res. COFEN 736/2024 (1ª etapa do Processo de Enfermagem) · RDC ANVISA 502/2021</p>
      </header>

      <Bloco titulo="Identificação">
        <Linha k="Nome" v={`${id.nome}${id.nomeSocial ? ` (nome social: ${id.nomeSocial})` : ""}`} />
        <Linha k="Nascimento / idade" v={id.nascimento && `${formatarData(id.nascimento)} — ${idade(id.nascimento, hoje)} anos`} />
        <Linha k="Sexo" v={id.sexo && rotulo("sexo", id.sexo)} />
        <Linha k="CPF / CNS" v={[id.cpf, id.cns].filter(Boolean).join(" / ")} />
        <Linha k="Admissão" v={id.dataAdmissao && `${formatarData(id.dataAdmissao)} — quarto ${id.quarto}${id.leito ? ` / ${id.leito}` : ""}`} />
        <Linha k="Procedência" v={id.procedencia && `${rotulo("procedencia", id.procedencia)}${id.procedenciaDetalhe ? ` — ${id.procedenciaDetalhe}` : ""}`} />
        <Linha k="Responsável" v={id.responsavelNome && `${id.responsavelNome} (${id.responsavelParentesco || "—"}) · ${id.responsavelTelefone}`} />
      </Bloco>

      <Bloco titulo="Histórico de saúde">
        <Linha k="Alergias" v={saude.semAlergiasConhecidas ? "Sem alergias conhecidas" : <strong className="text-red-700">{saude.alergias}</strong>} />
        <Linha k="Diagnósticos médicos" v={saude.diagnosticosMedicos} />
        <Linha k="Medicamentos em uso" v={<span className="whitespace-pre-line">{saude.medicamentosEmUso}</span>} />
        <Linha k="Internação (6 meses)" v={saude.internacaoUltimos6m ? "Sim" : "Não"} />
        <Linha k="Quedas (12 meses)" v={String(saude.quedasUltimos12m)} />
        <Linha k="Dispositivos" v={saude.dispositivos.map((d) => rotulo("dispositivos", d)).join(", ")} />
      </Bloco>

      <Bloco titulo="Sinais vitais e exame">
        <Linha k="Sinais vitais" v={sinais} />
        <Linha k="IMC" v={valorImc && String(valorImc)} />
        <Linha k="Orientação / cognição" v={[e.orientacao && rotulo("orientacao", e.orientacao), e.cognicao && rotulo("cognicao", e.cognicao)].filter(Boolean).join(" · ")} />
        <Linha
          k="Alertas cognitivos"
          v={[e.memoriaPrejudicada && "memória prejudicada", e.confusaoAguda && "CONFUSÃO AGUDA", e.perambulacao && "perambulação"].filter(Boolean).join(", ")}
        />
        <Linha k="Humor" v={[e.humor && rotulo("humor", e.humor), e.isolamento && "isolamento social"].filter(Boolean).join(" · ")} />
        <Linha k="Visão / audição" v={[e.visao && rotulo("visao", e.visao), e.audicao && rotulo("audicao", e.audicao)].filter(Boolean).join(" · ")} />
        <Linha k="Comunicação / sono" v={[e.comunicacao && rotulo("comunicacao", e.comunicacao), e.sono && `sono ${rotulo("sono", e.sono).toLowerCase()}`].filter(Boolean).join(" · ")} />
        <Linha k="Deambulação" v={e.deambulacao && rotulo("deambulacao", e.deambulacao)} />
        <Linha
          k="Alimentação"
          v={[
            e.dieta && `dieta ${rotulo("dieta", e.dieta).toLowerCase()}`,
            e.degluticao && rotulo("degluticao", e.degluticao),
            e.aceitacao && `aceitação ${rotulo("aceitacao", e.aceitacao).toLowerCase()}`,
            e.perdaPeso && "perda de peso",
            e.restricaoHidrica && "restrição hídrica",
            e.ingestaoHidricaBaixa && "baixa ingestão hídrica",
          ]
            .filter(Boolean)
            .join(" · ")}
        />
        <Linha k="Eliminações" v={[e.urinaria && rotulo("urinaria", e.urinaria), e.intestinal && `intestinal: ${rotulo("intestinal", e.intestinal).toLowerCase()}`].filter(Boolean).join(" · ")} />
        <Linha k="Edema / dor crônica" v={[e.edema && "edema periférico", e.dorCronica && "dor crônica"].filter(Boolean).join(" · ")} />
        <Linha
          k="Lesões de pele"
          v={e.lesoes.length === 0 ? "Pele íntegra" : e.lesoes.map((l) => `${rotulo("tipoLesao", l.tipo)} em ${l.local}${l.descricao ? ` (${l.descricao})` : ""}`).join("; ")}
        />
      </Bloco>

      <Bloco titulo="Escalas e grau de dependência">
        <Linha k="Katz" v={`${resumoEscala(KATZ, escalas.KATZ)}${respostasCompletas(KATZ, escalas.KATZ) && dependenciasKatz(escalas.KATZ).length ? ` — dependente em: ${dependenciasKatz(escalas.KATZ).join(", ").toLowerCase()}` : ""}`} />
        <Linha k="Morse" v={resumoEscala(MORSE, escalas.MORSE)} />
        <Linha k="Braden" v={resumoEscala(BRADEN, escalas.BRADEN)} />
        <Linha k="Grau sugerido" v={sugestao && `${sugestao.grau} — ${sugestao.motivo}`} />
        <Linha k="Grau definido" v={dados.grau.confirmado && <strong>Grau {dados.grau.confirmado}</strong>} />
        {dados.grau.justificativa && <Linha k="Justificativa" v={dados.grau.justificativa} />}
      </Bloco>

      <section className="break-inside-avoid border-t pt-3">
        <h3 className="mb-2 text-sm font-semibold tracking-wide uppercase">Diagnósticos, resultados e prescrição de enfermagem</h3>
        <ol className="flex flex-col gap-3">
          {dados.plano.map((item, i) => (
            <li key={item.diagnosticoId} className="text-sm">
              <p className="font-medium">
                {i + 1}. {item.diagnostico.termo} <span className="font-mono text-xs text-muted-foreground">({item.diagnostico.codigo})</span>
              </p>
              <p className="text-muted-foreground">Evidências: {item.justificativa || "—"}</p>
              <p>
                Resultado esperado: {item.resultado.termo} <span className="font-mono text-xs text-muted-foreground">({item.resultado.codigo})</span>
              </p>
              <ul className="mt-1 list-disc pl-5">
                {item.intervencoes.map((int) => (
                  <li key={int.intervencaoId}>
                    {int.descricao} — <span className="font-mono text-xs">{descreverAprazamento(int.aprazamento)}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      {dados.observacoes && (
        <Bloco titulo="Observações">
          <p className="text-sm whitespace-pre-line">{dados.observacoes}</p>
        </Bloco>
      )}

      {autor && (
        <footer className="border-t pt-3 text-sm">
          Concluída por <strong>{autor}</strong>
          {concluidaEm && ` em ${concluidaEm}`}.
        </footer>
      )}
    </article>
  );
}
