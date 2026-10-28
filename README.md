# pront-ilpi

Protótipo de prontuário eletrônico para ILPI com foco em **admissão do idoso** e **SAE** (Processo de Enfermagem, Res. COFEN 736/2024), usando CIPE® 2019 e CIAP-2.

> **Somente dados fictícios.** Nesta fase os registros ficam no `localStorage` do navegador. Não use com dados reais de residentes.

Demonstração publicada: https://pront-ilpi.vercel.app

## Rodar

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # regras de domínio e fluxo admissão → SAE → checagem
npm run typecheck && npm run lint && npm run build
```

No topo da tela há um seletor de perfil (enfermeira / técnico) para simular as permissões.
Em **Parâmetros** é possível restaurar os dados de demonstração.

## Documentação

- [docs/01-verificacao-sugestoes-gemini.md](docs/01-verificacao-sugestoes-gemini.md) — conferência dos códigos CIPE/CIAP sugeridos pelo Gemini
- [docs/02-arquitetura-e-roadmap.md](docs/02-arquitetura-e-roadmap.md) — o que foi feito, camadas, próximos passos e suposições a confirmar
- [docs/03-modelo-de-dados.sql](docs/03-modelo-de-dados.sql) — schema PostgreSQL proposto

## Stack

Next.js 16.4.3 (App Router), React 19, TypeScript, Tailwind 4, componentes shadcn (Base UI) — a mesma base do projeto `pront-asilo-modelo`, para facilitar a junção com autenticação e banco.
