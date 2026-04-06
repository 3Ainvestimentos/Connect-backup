# BUILD: FASE2C_SEED_30_WORKFLOWS

> Generated: 2026-04-06
> Status: Built
> Source design: `DESIGN_FASE2C_SEED_30_WORKFLOWS.md`
> Source define: `DEFINE_FASE2C_SEED_30_WORKFLOWS.md`

## 1. Escopo entregue

- pipeline compartilhado da 2C criado em `src/lib/workflows/bootstrap/fase2c/shared/*` para source loading, owner resolution, normalizacao, build de payload e orquestracao `--dry-run` / `--execute`;
- `workflowTypes_v2/{workflowTypeId}` e `versions/1` agora podem ser materializados por lote com precheck de destino existente e politica de contador somente leitura;
- os `5` manifestos curados foram codificados com os `30` `workflowTypeId` canonicos, incluindo todos os overrides obrigatorios de `field.id` e `status.id`;
- os `5` wrappers por lote e os `5` scripts manuais foram criados no padrao builder puro + CLI fina;
- o runtime passou a aceitar `stepsById[*].action` via `StepActionDef`;
- a cobertura automatizada da 2C foi adicionada para builder, normalizacao, owner resolution e orquestracao de execucao.

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
- nao foi executado nenhum `--execute` real contra Firestore neste build;
- nao houve smoke manual em ambiente controlado para leitura final dos docs publicados em `workflowTypes_v2/*`;
- lotes `4` e `5` seguem corretamente bloqueados em `validated` com `active: false`, mas ainda dependem do runtime consumir `stepsById[*].action` para avancarem a `enabled`.

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
- [ ] smoke manual por lote com `--dry-run` real
- [ ] `--execute` real em ambiente controlado
- [ ] gate de enablement dos lotes `4` e `5` apos suporte operacional de `action`
