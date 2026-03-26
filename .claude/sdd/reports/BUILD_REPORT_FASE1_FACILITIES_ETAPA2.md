# BUILD REPORT: FASE1_FACILITIES_ETAPA2

> Generated: 2026-03-26
> Source: DESIGN_FASE1_FACILITIES_ETAPA2.md
> Status: PARTIAL

## 1. Summary

| Metric | Value |
|--------|-------|
| Tasks Total | 6 |
| Tasks Completed | 6 |
| Tasks Remaining | 0 |
| Files Created | 10 |
| Files Modified | 10 |
| Lines Added | ~700 |

## 2. Execution Timeline

| Time | Task | Agent | Status |
|------|------|-------|--------|
| 14:45 | Revisao do DESIGN, estado do repo e contrato atual de `workflows_v2` | codex | Done |
| 14:58 | Extracao do helper Bearer e refactor das rotas runtime para reutilizacao | codex | Done |
| 15:07 | Implementacao do read-side (`types`, `queries`, `read/*`) | codex | Done |
| 15:18 | Ajuste do runtime para `buildAdvanceReadModelUpdate` e limpeza de fixtures | codex | Done |
| 15:26 | Adicao de testes de queries, consistencia e contrato de API | codex | Done |
| 15:35 | Registro dos indices compostos e verificacao final | codex | Done |

## 3. Files Modified

### `src/lib/workflows/runtime/auth-helpers.ts`
```ts
Extrai verificacao Bearer reutilizavel e disponibiliza autenticacao completa do ator runtime.
```
**Verification:** rotas runtime/read importam o helper sem duplicar parsing do header.

### `src/app/api/workflows/runtime/requests/route.ts`
```ts
Substitui validacao inline de token por `verifyBearerToken`.
```
**Verification:** teste direcionado do runtime segue verde.

### `src/app/api/workflows/runtime/requests/[id]/assign/route.ts`
```ts
Substitui validacao inline de token por `verifyBearerToken`.
```
**Verification:** teste direcionado do runtime segue verde.

### `src/app/api/workflows/runtime/requests/[id]/advance/route.ts`
```ts
Substitui validacao inline de token por `verifyBearerToken`.
```
**Verification:** teste direcionado do runtime segue verde.

### `src/app/api/workflows/runtime/requests/[id]/finalize/route.ts`
```ts
Substitui validacao inline de token por `verifyBearerToken`.
```
**Verification:** teste direcionado do runtime segue verde.

### `src/app/api/workflows/runtime/requests/[id]/archive/route.ts`
```ts
Substitui validacao inline de token por `verifyBearerToken`.
```
**Verification:** teste direcionado do runtime segue verde.

### `src/lib/workflows/runtime/read-model.ts`
```ts
Adiciona `buildAdvanceReadModelUpdate` e consolida helpers do backbone desnormalizado.
```
**Verification:** `read-model-consistency.test.js` cobre open/assign/advance/finalize/archive.

### `src/lib/workflows/runtime/use-cases/advance-step.ts`
```ts
Passa a usar `buildAdvanceReadModelUpdate` para manter simetria com os demais helpers de projecao.
```
**Verification:** `runtime-use-cases.test.js` cobre happy path de advance em etapa intermediaria.

### `src/lib/workflows/runtime/__tests__/repository.test.js`
```js
Alinha fixtures com a shape persistida real (`operationalParticipantIds`, pending-actions, month keys).
```
**Verification:** teste direcionado do repositório segue verde.

### `src/lib/workflows/runtime/__tests__/runtime-use-cases.test.js`
```js
Expande cobertura para advance-step com coerencia do read model.
```
**Verification:** suíte passa com 100% dos cenários novos.

### `src/lib/workflows/read/types.ts`
```ts
Define contratos tipados para summaries, filtros, agrupamentos e envelopes read-side.
```
**Verification:** importado por queries e rotas sem erros filtrados de TypeScript.

### `src/lib/workflows/read/queries.ts`
```ts
Implementa builders Firestore e funções de consulta para current, assignments, completed e mine.
```
**Verification:** `queries.test.js` valida filtros, ordenações e agrupamento por mês.

### `src/lib/workflows/read/__tests__/queries.test.js`
```js
Valida builders de query, filtros internos do current e composição das consultas do piloto.
```
**Verification:** suíte passando.

### `src/lib/workflows/read/__tests__/read-model-consistency.test.js`
```js
Valida shape obrigatória do backbone e coerência temporal (`closedAt = finalizedAt`, month keys, archive separado).
```
**Verification:** suíte passando.

### `src/lib/workflows/read/__tests__/read-api-contract.test.js`
```js
Valida envelope `{ ok, data|code,message }`, filtro mínimo de `/read/current` e agrupamento das rotas read-side.
```
**Verification:** suíte passando.

### `src/app/api/workflows/read/current/route.ts`
```ts
Expõe GET read-side para a fila do owner com filtro `all|waiting_assignment|in_progress|waiting_action`.
```
**Verification:** contrato coberto em `read-api-contract.test.js`.

### `src/app/api/workflows/read/assignments/route.ts`
```ts
Expõe GET read-side para atribuídos a mim + ações pendentes.
```
**Verification:** contrato coberto em `read-api-contract.test.js`.

### `src/app/api/workflows/read/completed/route.ts`
```ts
Expõe GET read-side para histórico concluído com agrupamento por `closedMonthKey`.
```
**Verification:** contrato coberto em `read-api-contract.test.js`.

### `src/app/api/workflows/read/mine/route.ts`
```ts
Expõe GET read-side para `Minhas solicitacoes` com agrupamento por `submittedMonthKey`.
```
**Verification:** contrato coberto em `read-api-contract.test.js`.

### `firestore.indexes.json`
```json
Registra os 7 índices compostos necessários para consultas sobre `workflows_v2`.
```
**Verification:** manifesto JSON atualizado com owner queue, assignments, pending actions, completed e requester history.

## 4. Verification Results

### Syntax Checks
| File | Result |
|------|--------|
| runtime/read-model + advance-step + auth-helpers | Pass |
| read/types + read/queries | Pass |
| read routes | Pass |
| testes novos/ajustados | Pass |

### Integration Checks
| Check | Result |
|-------|--------|
| `npm test -- --runInBand src/lib/workflows/runtime/__tests__/repository.test.js src/lib/workflows/runtime/__tests__/runtime-use-cases.test.js src/lib/workflows/read/__tests__/queries.test.js src/lib/workflows/read/__tests__/read-model-consistency.test.js src/lib/workflows/read/__tests__/read-api-contract.test.js` | Verified |
| `npm run typecheck` | Failed |
| `npm run typecheck -- --pretty false \| rg 'src/lib/workflows\|src/app/api/workflows/read'` | Verified |

### Manual Testing Required
- [ ] Provisionar os índices novos no projeto Firebase alvo antes dos smoke tests reais.
- [ ] Exercitar manualmente `GET /api/workflows/read/*` com token válido e dados reais em `workflows_v2`.

## 5. Issues Encountered

| # | Issue | Resolution | Status |
|---|-------|------------|--------|
| 1 | `buildAdvanceReadModelUpdate` apareceu duplicado durante a consolidação do runtime | Mantida uma única implementação e conectado o use case `advance-step` a ela | Resolved |
| 2 | `npm run typecheck` global falha por erros legados fora de workflows/read | Validação foi filtrada para confirmar que os arquivos desta entrega não introduzem novos erros de TypeScript | Open |

## 6. Deviations from DESIGN

| Item | Design Said | Actual Implementation | Reason |
|------|-------------|----------------------|--------|
| `/read/current` | podia retornar contrato mínimo do owner current queue | retorna `filter + items`, aceitando filtros explícitos da aba atual | reduz ambiguidade e cobre os filtros internos já fechados |
| `/read/assignments` | exemplo simples com `items` | retorna `assignedItems + pendingActionItems` | a aba oficial usa duas queries separadas |

## 7. Documentation Updates Required

| Document | Update Needed |
|----------|---------------|
| CLAUDE.md | Nenhuma obrigatória para esta etapa |
| `.claude/sdd/workflows/DESIGN_FASE1_FACILITIES_ETAPA2.md` | Opcional: registrar que `/read/current` expõe filtro explícito por querystring |

## 8. Post-Build Checklist

### Completed
- [x] Helper Bearer compartilhado criado e reaproveitado
- [x] Read layer inicial criada em `src/lib/workflows/read`
- [x] Rotas `GET /api/workflows/read/*` implementadas
- [x] Índices compostos registrados em `firestore.indexes.json`
- [x] Testes objetivos de read-side adicionados

### Pending
- [ ] Provisionamento efetivo dos índices no ambiente Firebase
- [ ] Limpeza dos erros legados que impedem `npm run typecheck` global

## 9. Next Steps

1. **Testes:** executar smoke tests reais das rotas read-side contra Firestore com índices provisionados.
2. **Documentacao:** opcionalmente atualizar o design consolidado com o contrato final de `/read/current` e `/read/assignments`.
3. **Commit:** seguir na branch `refactor/workflows` após revisão do diff.
4. **Deploy:** publicar `firestore.indexes.json` e validar consultas em ambiente de staging/produção.

## 10. Implementation Notes

### Code Quality
- O read-side nasceu separado do runtime, mas consumindo a mesma shape persistida em `workflows_v2`.
- As fixtures agora refletem a shape persistida atual, sem `actionRequests` residual nos cenários da Etapa 1.

### Architecture Decisions
- O helper Bearer foi centralizado em `runtime/auth-helpers.ts`; a resolução do ator operacional continua em `actor-resolution.ts`.
- O endpoint `assignments` consolida as duas queries da aba operacional (`assigned` e `pending action`) sem criar rota extra.

### Performance Impact
- As queries read-side dependem de índices compostos explícitos; sem provisionamento, o custo operacional vira erro de consulta, não degradação silenciosa.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-26 | codex | Initial build report |
