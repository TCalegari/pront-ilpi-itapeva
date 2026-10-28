# Instruções para agentes — pront-ilpi

Protótipo de prontuário para ILPI (admissão + SAE). Leia `docs/02-arquitetura-e-roadmap.md` antes de mudar código.

## Regras

1. **Códigos CIPE® só da CIPE® 2019 pt-BR oficial (ICN).** Nunca invente nem “complete” código. Diagnóstico = um foco + um julgamento; não fundir dois diagnósticos num enunciado. Ao incluir conceito novo no catálogo, cite termo e código exatamente como na publicação.
2. **Registro clínico é imutável.** Sem update/delete de escala, plano, checagem, anotação. Correção = novo registro ligado ao original (retificação/nova versão). Só o rascunho de admissão é editável.
3. **Permissões no lugar da regra**, não só na interface: diagnóstico, prescrição de enfermagem, conclusão da admissão e revisão da SAE são do ENFERMEIRO (Res. COFEN 736/2024). Validar em `src/store/acoes.ts` (futuras Server Actions).
4. **Nada de justificativa preenchida automaticamente.** “Não realizado” sempre exige motivo informado pelo profissional.
5. **Fuso America/Sao_Paulo.** Datas locais como `YYYY-MM-DD` / `YYYY-MM-DDTHH:mm` (`src/domain/datas.ts`); a madrugada pertence ao plantão noturno do dia anterior.
6. **Regras em funções puras** em `src/domain`, com testes `vitest`. Pontuação de escala é sempre recalculada a partir das respostas.
7. Regra clínica ambígua → pergunte; registre suposições em `src/config/instituicao.ts` e no roadmap.
8. Apenas dados fictícios. Não commitar `.env`.

Antes de concluir: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
Next.js 16 (App Router): `params` são Promise em server components; nas páginas cliente use `useParams`. Componentes UI usam Base UI: compor com `render` (com `nativeButton={false}` para links), não `asChild`.
