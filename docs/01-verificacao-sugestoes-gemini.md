# Verificação das sugestões do Gemini (catálogo CIAP-2 × CIPE® para ILPI)

**Data:** 28/10/2026
**Objeto:** `ciapCipeIlpiCatalog.ts`, `SaeNursingModule.tsx` e o script SQL sugeridos pelo Gemini.

## Fontes usadas na conferência

| Fonte | Uso |
|---|---|
| **CIPE® 2019 – Português do Brasil** (ICN, publicada em 04/09/2019), [PDF oficial](https://www.icn.ch/sites/default/files/inline-files/ICNP%202019%20Portugu%C3%AAs%20do%20Brasil.pdf) | Conferência de **todos os códigos CIPE** (diagnósticos/resultados = eixo DC; intervenções = eixo IC) |
| Fernandes et al. *Rev Esc Enferm USP* 2019;53:e03472 (`cipe ilpi.pdf`) | Prevalências em ILPI (n = 203 idosos, **uma** ILPI de Fortaleza-CE) |
| Fernandes et al. *Rev Científica Integrada* 2023;6(1):e202301 (`Artigo_e202301.pdf`) | Subconjunto terminológico CIPE® para idosos institucionalizados (133 DE/RE, 1474 IE) |
| Clares et al. *Rev Bras Enferm* 2019;72(Supl 2) (`cipe ilpi 2.pdf`) | Intervenções de referência |
| `CIAP Brasil_atualizado.pdf` | Conferência dos códigos **CIAP-2** e da tabela CIAP ↔ CID-10 |
| `protocolo_enfer_idosa_out25.pdf` (SMS-SP, Módulo 2, 5ª ed., 2025) | Vínculo CIAP → diagnósticos de enfermagem usado na APS |
| `Resolucao-736-2024.pdf` (COFEN) | Etapas do Processo de Enfermagem e competências |

> Nenhum dos manuais da pasta `diagnosticos enfermagem` traz **códigos numéricos** CIPE. Por isso os códigos foram conferidos contra a publicação oficial do ICN (CIPE 2019 pt-BR).
> O arquivo `resolucao cofen.pdf` é digitalizado (imagem) e **não pôde ser lido**; a citação “Res. COFEN 754/2024, Art. 1º §2º” feita pelo Gemini **não foi verificada**.

## Resumo

| Item | Resultado |
|---|---|
| Códigos CIPE citados pelo Gemini | **47** (13 diagnósticos, 13 resultados, 21 intervenções) |
| Existem na CIPE 2019 | 11 |
| Existem **e** correspondem ao conceito declarado | **9** (19%) |
| Códigos que existem mas apontam para outro conceito | 2 + 4 (ver abaixo) |
| Códigos inexistentes (inventados) | 36 |
| Diagnósticos “compostos” (dois DE fundidos num só) | 4 de 13 |
| Códigos CIAP-2 incorretos | 3 (P99, T05, Z25) |
| Prevalências | Correspondem a Fernandes 2019, com 1 erro e 4 distorções por fusão |

**Conclusão:** a *estrutura* proposta (CIAP-2 na avaliação → DE CIPE® → resultado → intervenções aprazadas → checagem) é adequada e coerente com a Res. COFEN 736/2024. Os **códigos de resultado e de intervenção não podem ser usados** – quase todos foram gerados sem correspondência real. Alguns são perigosamente plausíveis (ex.: `10028490` existe, mas é “Função Renal, Eficaz”, não “Cognição Estimulada”; `10035012` é “Apneia”, não “Reduzir luminosidade”; `10045120` é “Obter Dados sobre as Orelhas”, não “Trocar fralda”).

## Os 9 códigos corretos

| Código | Conceito (CIPE 2019) |
|---|---|
| 10015122 | Risco de Queda |
| 10001235 | Desorientação |
| 10001203 | Memória, Prejudicada |
| 10027226 | Sono, Prejudicado |
| 10024930 | Sono, Adequado (resultado) |
| 10001046 | Marcha (Caminhada), Prejudicada |
| 10023410 | Déficit de Autocuidado |
| 10022544 | Audição, Prejudicada |
| 10000567 | Constipação |

## Conferência item a item

Legenda: ✅ correto · ⚠️ existe, mas com ressalva · ❌ inexistente ou conceito errado.

### map-01 – Risco de Queda (Mobilidade)
- DE `10015122` Risco de Queda ✅ · prevalência 78% ✅
- Resultado `10027342` ❌ → **`10034704` Queda, Ausente** (ou `10038545` Lesão por Queda, Ausente)
- Intervenções `10032485` ❌, `10036518` ❌, `10014790` ❌ (é o *foco* “Capacidade para Comunicar-se”) → **`10040211` Prevenção de Queda**, **`10037442` Monitorar Risco de Queda**, **`10042507` Manejar (Controlar) Segurança Ambiental**, **`10041135` Usar Técnica de Transferência**
- CIAP `A80` (Lesão traumática/acidente NE) ⚠️ – é o código usado pelo protocolo SMS-SP para “Quedas”, mas descreve o *evento*; para risco sem queda prévia vale registrar o fator causal (ex.: `N17` Vertigem/tontura ✅, `L28`, `P70`).
- **Ressalva clínica:** “manter grades elevadas durante o repouso” como cuidado padrão para todos com risco de queda não é recomendável – em idoso confuso a grade bilateral aumenta a gravidade da queda (escalada) e pode configurar contenção. Deve ser individualizada e justificada.

### map-02 – Visão Prejudicada (Sensorial)
- DE `10022750` ❌ → **`10022748` Visão, Prejudicada** · prevalência 43% ✅
- Resultado `10027410` ❌ → `10047353` Visão, Melhorada (pouco realista em baixa visão irreversível; preferir resultado funcional como `10034704` Queda, Ausente)
- Intervenções `10031102` ❌, `10012455` ❌ → **`10050138` Obter Dados sobre Visão**, `10042507` Manejar Segurança Ambiental
- CIAP `F05` Outras perturbações visuais ✅ (também `F92` Catarata, `F94` Cegueira, `F28` Limitação funcional)

### map-03 – Desorientação (Cognitivo)
- DE `10001235` Desorientação ✅ · prevalência 36% ✅
- Resultado `10029104` ❌ → **`10028586` Orientação, Melhorada**
- Intervenções `10013892` ❌, `10032110` ❌ → **`10041072` Terapia de Orientação para a Realidade**, **`10045424` Monitorar Confusão**, **`10043799` Gerenciar Perambulação**
- CIAP `P70` Demência ✅ · `P99` ⚠️ – o protocolo SMS-SP usa P99 para delirium, mas a tabela de conversão do CIAP Brasil mapeia delirium (CID F05) para **`P71` Outras psicoses orgânicas NE**.
- **Ressalva:** delirium é quadro agudo que exige avaliação médica; não deve ser fundido com desorientação crônica da demência. Separar como DE próprio: `10000449` Confusão, Aguda (ou `10023874` Risco de Confusão, Aguda).

### map-04 – Memória Prejudicada (Cognitivo)
- DE `10001203` Memória, Prejudicada ✅ · prevalência **30% ❌ → 26%** (30% é “Cognição prejudicada”, `10022321`)
- Resultado `10028490` ❌ **– é “Função Renal, Eficaz”** → `10028435` Memória, Eficaz ou, mais realista, `10043866` Capaz de Gerenciar o Regime Medicamentoso
- Intervenção `10024580` ❌ → `10043878` Monitorar Adesão à Medicação; `10025444` Administrar Medicação
- **Ressalva:** administrar medicamento é cumprimento de prescrição médica (módulo de medicação), não cuidado da SAE. Na SAE cabe “supervisionar a ingestão”.

### map-05 – Sono Prejudicado
- DE `10027226` ✅ · resultado `10024930` Sono, Adequado ✅ · prevalência 25% ✅
- Intervenções `10035012` ❌ **– é “Apneia”** e `10019201` ❌ → **`10050949` Promover Sono**, **`10036764` Obter Dados sobre Sono**
- CIAP `P06` ✅

### map-06 – Marcha Prejudicada
- DE `10001046` ✅ · prevalência 23% ✅
- Resultado `10025811` ❌ → **`10028333` Capaz de Andar (Caminhar)**
- Intervenção `10036490` ❌ → **`10036520` Auxiliar na Marcha (Caminhada) com Uso de Dispositivo**
- CIAP `L28` ✅

### map-07 – “Déficit de Autocuidado **e** Risco de LPP” ❌ (fusão)
Um enunciado CIPE tem **um** foco e **um** julgamento (ISO 18104). Separar em dois DE:
- `10023410` Déficit de Autocuidado ✅ (21%) → resultado **`10025714` Capaz de Executar o Autocuidado**
- **`10027337` Risco de Úlcera (Lesão) por Pressão** (9% no estudo, não 21%) → resultado **`10029065` Úlcera (Lesão) por Pressão, Ausente**
- Resultado `10030201` ❌
- Intervenções: `10014757` ⚠️ é o termo **“Posicionar” do eixo Ação**, não uma intervenção → **`10014761` Posicionar Paciente**, **`10040224` Prevenção de Úlcera (Lesão) por Pressão**, **`10030710` Obter Dados sobre Risco de Úlcera por Pressão** (= aplicar Braden); `10032880` ❌ → **`10030821` Auxiliar na Higiene**, **`10035293` Manter Integridade da Pele**
- CIAP `A28` ✅, `S97` ✅ (S97 é para úlcera já existente, não risco)
- **Ressalva:** mudança de decúbito 2/2h deve ser prescrita conforme Braden e mobilidade – não para residente que deambula.

### map-08 – Audição Prejudicada
- DE `10022544` ✅ · prevalência 20% ✅
- Resultado `10029015` ❌ → **`10025025` Capaz de Comunicar-se** (ou `10047369` Audição, Melhorada)
- Intervenção `10019912` ❌ → **`10045067` Orientar sobre Aparelho Auditivo**, **`10050140` Obter Dados sobre Audição**
- CIAP `H02` ✅ (também `H86` Surdez)

### map-09 – Incontinência Urinária
- DE `10026895` ⚠️ **é o FOCO (eixo F)**; o diagnóstico (DC) é **`10025686` Incontinência Urinária** · prevalência 19% ✅
- Subtipos disponíveis: `10026778` Funcional, `10026811` de Urgência, `10026797` de Esforço, `10026914` por Transbordamento
- Resultado `10031520` ❌ → **`10027836` Continência Urinária** e/ou `10028501` Integridade da Pele, Eficaz
- Intervenção `10045120` ❌ **– é “Obter Dados sobre as Orelhas”** → **`10050332` Trocar Fralda**, **`10045154` Cuidados Perineais**, **`10037691` Promover Rotina Vesical**
- **Ressalva:** antes de padronizar fralda a cada 4 h, prescrever micção programada (rotina vesical) quando houver potencial de continência.

### map-10 – “Desnutrição **e** Risco de Aspiração” ❌ (fusão; código inexistente `10042011`)
- A CIPE 2019 **não tem** “Desnutrição” como DC pré-coordenado. Usar **`10025746` Condição Nutricional, Prejudicada** ou `10025519` Ingestão Nutricional Baixa, Prejudicada / `10027316` Baixo Peso (Desnutrição: 17%).
- **`10015024` Risco de Aspiração** (0,5% no estudo) e **`10001033` Deglutição, Prejudicada** (2%)
- Resultado `10030445` ❌ → `10035569` Condição Nutricional, Melhorada; **`10028783` Aspiração, Ausente**
- Intervenções `10014760` ❌, `10039100` ❌ → **`10051810` Prevenir Aspiração**, `10014761` Posicionar Paciente, **`10050313` Oferecer Bebida (ou Líquidos)**, **`10036614` Monitorar Ingestão de Alimentos**, **`10032121` Monitorar Peso**
- CIAP `T08` ✅ · `T05` ⚠️ é “Problemas alimentares do adulto”; **disfagia é `D21`**
- **Ressalva:** “ofertar 200 ml de água” fixo é inseguro em restrição hídrica (ICC, DRC) e em disfagia (exige espessante). Deve ser individualizado e conferido com a prescrição médica/nutricional.

### map-11 – “Edema Periférico **e** Risco de PA Instável” ❌ (fusão; `10027051` é a intervenção “Prover Apoio Emocional”)
- **`10027482` Edema Periférico** (17%) → resultado **`10029020` Edema Periférico, Ausente**
- **`10022954` Pressão Arterial, Alterada** (Hipertensão 9%) → resultado **`10027647` Pressão Arterial, nos Limites Normais**
- Resultado `10029880` ❌
- Intervenções `10032050` ❌ (o correto é **`10032052` Monitorar Pressão Arterial** ou **`10032113` Monitorar Sinais Vitais**), `10021430` ❌ → **`10036793` Gerenciar Edema**
- CIAP `K86` ✅, `K07` ✅

### map-12 – “Humor Deprimido **e** Isolamento Social” ❌ (fusão; `10022498` inexistente)
- **`10022402` Humor, Deprimido** (17%) → resultado `10050027` Humor, Melhorado
- **`10001647` Isolamento Social** (13%) → resultado **`10050070` Isolamento Social, Diminuído**
- Considerar também `10015179` Risco de Solidão (há protocolo específico na pasta de manuais)
- Resultado `10028990` ❌ · intervenção `10038210` ❌ → **`10050898` Promover Capacidade para Socializar-se**, **`10039348` Terapia Recreacional**, **`10027051` Prover Apoio Emocional**
- CIAP `P03` ✅ · **`Z25` ❌ é “Ato/acontecimento violento”** (o próprio protocolo SMS-SP usa Z25 para violência contra a pessoa idosa) → **`Z04` Problema sociocultural** ou `Z29` Problema social NE

### map-13 – Constipação
- DE `10000567` ✅ · prevalência 15% ✅
- Resultado `10029412` ❌ → **`10028403` Defecação, Eficaz**
- Intervenção `10040115` ❌ → **`10037211` Monitorar Motilidade Intestinal**, **`10046454` Prevenir Constipação**, `10041427` Gerenciar Defecação
- CIAP `D12` ✅

## Problemas no componente React (`SaeNursingModule.tsx`)

1. **Justificativa falsificada:** quando o técnico deixa o `window.prompt` vazio, o código grava automaticamente “Recusa do residente / Critério clínico”. Isso cria registro clínico que ninguém fez. O campo `exigeJustificativaSeRecusado` nem é consultado.
2. **Checagem sobrescrevível:** clicar de novo troca o status do mesmo horário – viola a imutabilidade do registro (correção deve ser por adendo).
3. **Chave sem data:** `intervencaoId_horario` não inclui o dia; a checagem de ontem aparece como feita hoje. O horário `00:00`/`02:00` pertence ao plantão noturno que começou no dia anterior.
4. **“Hash SHA-256” simulado:** a função gera um hash de 32 bits + timestamp; a menção a PAdES/ICP-Brasil/VIDaaS é só um `alert`. Em protótipo, rotular como simulação.
5. **COREN fixo** no código e sem identificação real do profissional.
6. **Aprazamento fixo no catálogo** (não individualizado por residente nem pelo grau de dependência).
7. **“Prevalência média em ILPI”** é o dado de **uma** ILPI (n = 203); rotular como “prevalência no estudo de referência”.
8. `window.prompt`/`alert` bloqueiam a interface e não funcionam bem em tablet.

## Problemas no SQL

1. Tabelas criadas em `public` **sem RLS** – no Supabase ficam expostas pela Data API.
2. Sem bloqueio de `UPDATE`/`DELETE` em `sae_checagem_tecnico`: o hash é gerado, mas o registro pode ser alterado depois.
3. O hash não é encadeado (não inclui o hash anterior), então não evidencia remoção de linhas.
4. Sem `UNIQUE (prescricao_id, cipe_intervencao_codigo, data_plantao, horario_aprazado)` → checagem duplicada.
5. Não há tabelas para itens da prescrição de enfermagem (diagnósticos/intervenções prescritos) – a checagem aponta só para o código CIPE, sem vínculo com o que foi prescrito.
6. `residente_id` sem chave estrangeira; `horario_aprazado` como texto.

## O que foi aproveitado no protótipo

- O fluxo CIAP-2 (avaliação) → DE CIPE® → resultado esperado → intervenções aprazadas → checagem pelo técnico.
- As prevalências de Fernandes 2019 (corrigidas e rotuladas pela fonte).
- O conceito de trilha de auditoria por checagem.

O catálogo corrigido está em [`src/domain/cipe/catalogo.ts`](../src/domain/cipe/catalogo.ts), com códigos conferidos na CIPE 2019 e intervenções operacionais da instituição vinculadas ao conceito CIPE mais próximo.
