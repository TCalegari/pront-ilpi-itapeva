# Arquitetura do protótipo e caminho até o prontuário completo

## O que existe hoje

| Área | Situação |
|---|---|
| **Admissão do idoso** | Fluxo em 6 etapas: identificação → histórico de saúde → sinais vitais e exame → escalas (Katz, Morse, Braden) e grau RDC 502 → diagnósticos e plano → revisão e conclusão. Rascunho salvo automaticamente; pendências listadas por etapa; ficha imprimível. |
| **SAE** | Plano de cuidados versionado (cada revisão = nova versão com evolução e avaliação dos resultados). Prazo de revisão pelo grau (I e II com intervalo maior, III diário). |
| **Checagem** | Folha por plantão de 12 h (madrugada pertence ao noturno do dia anterior), motivo obrigatório para “não realizado”, retificação ligada ao original, sem exclusão. |
| **Escalas** | Reaplicação periódica ou por evento, com alerta quando o resultado não condiz com a SAE. |
| **Catálogo** | 23 diagnósticos CIPE® com códigos conferidos na CIPE® 2019, CIAP-2, prevalência de referência e intervenções aprazadas. |
| **Prescrição médica** | Página de escopo; ainda não implementada. |

Perfis simulados: enfermeira e técnico (seletor no topo). Diagnóstico, prescrição de enfermagem, conclusão da admissão e revisão da SAE são bloqueados para o técnico (Res. COFEN 736/2024, art. 6º).

## Camadas

```
src/domain/      regras puras (sem React, sem banco) — testadas com vitest
  cipe/catalogo.ts   catálogo CIPE®/CIAP-2 conferido
  escalas/           Morse, Braden, Katz
  grau.ts            sugestão do grau de dependência (RDC 502)
  admissao.ts        modelo da avaliação de admissão, sugestão de diagnósticos, pendências
  aprazamento.ts     plantões, horários do plantão, atraso
  reavaliacao.ts     prazos de revisão da SAE e das escalas
src/config/      parâmetros da instituição (intervalos por grau, plantões)
src/store/       persistência PROVISÓRIA no navegador + ações com as regras de permissão
src/components/  formulários e folhas reutilizáveis
src/app/         páginas (Next.js App Router)
docs/03-modelo-de-dados.sql   schema PostgreSQL proposto para a fase com banco
```

As **regras ficam em `src/domain`** e as **ações em `src/store/acoes.ts`** já validam perfil, imutabilidade e campos obrigatórios. Na fase com banco, `acoes.ts` vira Server Actions (mesmas validações rodando no servidor) e `banco.ts` é substituído por PostgreSQL; as páginas quase não mudam.

## Próximos passos sugeridos

1. **Validar o fluxo de admissão com a equipe** usando o protótipo (tablet do posto). Ajustar campos ao impresso atual.
2. **Incluir o impresso de SAE/Morse/Braden da instituição** no workspace e confirmar:
   - intervalos de revisão dos graus I e II (hoje 30 e 15 dias, provisórios);
   - intervalo de reaplicação das escalas por grau;
   - itens da instituição que não estão no catálogo.
3. **Banco e autenticação** — reaproveitar do `pront-asilo-modelo` (Next.js + Prisma + Better Auth + matriz de permissões), aplicando o schema de `docs/03`.
4. **Prescrição médica e medicação** — reaproveitar `src/lib/medication/schedule.ts` do modelo, integrando à mesma folha de plantão.
5. **Prontuário completo** — evolução multiprofissional (SOAP), sinais vitais com gráfico, intercorrências com notificação de evento sentinela (RDC 502), indicadores.
6. **Assinatura e PDF** — só depois do banco: PDF do plano e do plantão com assinatura ICP-Brasil, se a instituição decidir adotar.

## Decisões e suposições a confirmar

| Tema | Decisão no protótipo | Por quê / o que confirmar |
|---|---|---|
| Grau com 4–5 dependências sem comprometimento cognitivo | Sugere grau III e exige justificativa | A RDC 502 não classifica esse caso |
| Katz | Versão do Anexo 7 do Manual SMS-SP (independente = 1) | “Incontinência ocasional” conta como dependência, como no original |
| Plantões | 07–19 h e 19–07 h | Confirmar escala da instituição |
| Checagem antecipada | Permitida até 1 h antes do horário | Evita checagem “de véspera” |
| Diagnósticos fundidos do Gemini | Separados | ISO 18104: um foco + um julgamento |
| Delirium | CIAP P71 (protocolo SMS-SP usa P99) | Tabela CIAP–CID do CIAP Brasil |
| Next.js | 16.4.3 (o modelo usa 16.4.0) | 16.0.0–16.4.0 tem vulnerabilidade crítica (RCE) |
