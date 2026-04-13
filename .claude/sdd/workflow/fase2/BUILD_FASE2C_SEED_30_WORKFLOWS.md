# BUILD: FASE2C_SEED_30_WORKFLOWS

> Generated: 2026-04-06
> Status: Completed
> Source design: `DESIGN_FASE2C_SEED_30_WORKFLOWS.md`
> Source define: `DEFINE_FASE2C_SEED_30_WORKFLOWS.md`

## 1. Escopo entregue

- pipeline compartilhado da 2C criado em `src/lib/workflows/bootstrap/fase2c/shared/*` para source loading, owner resolution, normalizacao, build de payload e orquestracao `--dry-run` / `--execute`;
- `workflowTypes_v2/{workflowTypeId}` e `versions/1` agora podem ser materializados por lote com precheck de destino existente e politica de contador somente leitura;
- os `5` manifestos curados foram codificados com os `30` `workflowTypeId` canonicos, incluindo todos os overrides obrigatorios de `field.id` e `status.id`;
- os `5` wrappers por lote e os `5` scripts manuais foram criados no padrao builder puro + CLI fina;
- o runtime passou a aceitar `stepsById[*].action` via `StepActionDef`;
- a cobertura automatizada da 2C foi adicionada para builder, normalizacao, owner resolution e orquestracao de execucao.

## 1.1. Correcao aplicada apos o primeiro build da 2C

Durante a execucao controlada dos lotes, foi identificado um desvio entre a seed da `2C` e a decisao ja validada na Fase 1 com Facilities:

- workflows diretos estavam preservando a malha legada completa de statuses;
- em Facilities, workflows diretos haviam sido padronizados no canon de `3` etapas:
  - `Solicitação Aberta`
  - `Em andamento`
  - `Finalizado`

Essa observacao gerou uma microetapa de correcao, ja incorporada ao resultado final da `2C`, com as seguintes decisoes fechadas:

- todo workflow da `2C` passou a declarar `stepStrategy` explicitamente no manifesto:
  - `canonical_3_steps`
  - `preserve_legacy`
- `19` workflows diretos, sem `action` e sem checkpoint semantico critico, passaram a publicar o canon de `3` etapas;
- `11` workflows permaneceram em `preserve_legacy`, por um destes motivos:
  - possuem `action`
  - representam checkpoints semanticos relevantes
  - ja eram compactos e nao eram o problema que motivou a correcao
- workflows em `canonical_3_steps` passaram a reproduzir a mesma semantica funcional de Facilities:
  - `Solicitação Aberta` = fila inicial em que o owner designa um responsavel
  - `Em andamento` = chamado atribuido e em execucao
  - `Finalizado` = conclusao operacional
- `canonical_3_steps` ficou explicitamente proibido de coexistir com:
  - `statuses[*].action`
  - `statusIdOverrides`
- `ti_solicitacao_compra_equipamento` deixou de usar `statusIdOverrides` e passou a ser workflow canonico

## 1.2. Resultado operacional da seed

Execucao real concluida em Firestore para os `5` lotes da `2C`.

Estado final esperado e observado:

- lotes `1`, `2` e `3` publicados com `active: true`;
- lotes `4` e `5` publicados com `active: false`, mantendo o gate de enablement para a futura `2D`;
- workflows diretos corrigidos para o canon de `3` etapas;
- workflows com `action` preservados em `preserve_legacy`;
- `counters/workflowCounter_v2` permaneceu apenas como dependencia observada, sem escrita;
- `workflows_v2` nao recebeu escrita da `2C`.

## 2. Arquivos principais

- `src/lib/workflows/bootstrap/fase2c/shared/types.ts`
- `src/lib/workflows/bootstrap/fase2c/shared/source.ts`
- `src/lib/workflows/bootstrap/fase2c/shared/owner-resolution.ts`
- `src/lib/workflows/bootstrap/fase2c/shared/field-normalization.ts`
- `src/lib/workflows/bootstrap/fase2c/shared/status-normalization.ts`
- `src/lib/workflows/bootstrap/fase2c/shared/payload-builder.ts`
- `src/lib/workflows/bootstrap/fase2c/shared/execution.ts`
- `src/lib/workflows/bootstrap/fase2c/manifests/*.ts`
- `src/lib/workflows/bootstrap/fase2c/lote-*-v1.ts`
- `src/scripts/seed-fase2c-lote-*-v1.ts`
- `src/lib/workflows/runtime/types.ts`
- `src/lib/workflows/bootstrap/fase2c/__tests__/payload-builder.test.ts`
- `src/lib/workflows/bootstrap/fase2c/__tests__/normalization-and-owner.test.ts`
- `src/lib/workflows/bootstrap/fase2c/__tests__/execution.test.js`

## 3. Validacao executada

- `npm test -- --runInBand src/lib/workflows/bootstrap/fase2c/__tests__/payload-builder.test.ts src/lib/workflows/bootstrap/fase2c/__tests__/normalization-and-owner.test.ts src/lib/workflows/bootstrap/fase2c/__tests__/execution.test.js src/lib/workflows/runtime/__tests__/repository.test.js`
- `./node_modules/.bin/tsc --noEmit --pretty false 2>&1 | rg 'src/lib/workflows/bootstrap/fase2c|src/lib/workflows/runtime/types.ts'`

Resultado:

- 4 suites / 20 testes verdes;
- nenhuma ocorrencia remanescente do `tsc` apontando para arquivos novos da 2C ou para `src/lib/workflows/runtime/types.ts`.

## 4. Pendencias e limites

- `npm run typecheck` global continua falhando por erros preexistentes e fora do escopo da 2C, em modulos como billing, admin, dashboard, contexts e testes legados;
- a `2C` nao implementa ainda o motor operacional de `requestAction/respondAction`;
- lotes `4` e `5` seguem corretamente bloqueados em `validated` com `active: false`, e ainda dependem da `2D` para avancarem a `enabled`;
- a evolucao futura de checkpoints semanticos preservados para `action` fica para novas versoes administrativas, fora da `v1` seedada nesta etapa.

## 5. Checklist da etapa

- [x] pipeline compartilhado da 2C criado
- [x] manifestos curados dos `5` lotes criados
- [x] `workflowTypeId` canonicos fechados no codigo
- [x] overrides tecnicos de fields e statuses aplicados
- [x] owner resolution via `collaborators.id3a` implementada
- [x] `counterStatus` inspecionado sem escrita no contador
- [x] scripts `--dry-run` / `--execute` criados para todos os lotes
- [x] `StepActionDef` adicionado ao runtime
- [x] cobertura automatizada adicionada para builder e execucao
- [x] correcao do canon de `3` etapas aplicada aos workflows diretos classificados
- [x] `stepStrategy` explicito adicionado aos `30` workflows da `2C`
- [x] lotes `1` e `2` removidos manualmente e reseedados com a correcao
- [x] lote `3` executado ja com o contrato corrigido
- [x] lotes `4` e `5` executados mantendo `active: false`
- [x] smoke manual por lote com `--dry-run` real
- [x] `--execute` real em ambiente controlado
- [ ] gate de enablement dos lotes `4` e `5` apos suporte operacional de `action`
