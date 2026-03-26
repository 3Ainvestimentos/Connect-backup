# BUILD REPORT: CORRECOES_POS_ETAPA2_FASE1_FACILITIES

> Generated: 2026-03-26
> Source: DESIGN_CORRECOES_POS_ETAPA2_FASE1_FACILITIES.md
> Status: PARTIAL

## 1. Summary

| Metric | Value |
|--------|-------|
| Tasks Total | 4 |
| Tasks Completed | 4 |
| Tasks Remaining | 0 |
| Files Created | 2 |
| Files Modified | 14 |

## 2. Execution Timeline

| Time | Task | Agent | Status |
|------|------|-------|--------|
| 17:xx | Revisao do design, contexto do repo e diff da Etapa 2 | codex | Done |
| 17:xx | Correcao de `verifyBearerToken` e adocao de `authenticateRuntimeActor` nas 9 rotas | codex | Done |
| 17:xx | Reescrita das queries de aba para `statusCategory` e limpeza dos indices | codex | Done |
| 17:xx | Atualizacao/criacao de testes e verificacao final | codex | Done |

## 3. Files Changed

### `src/lib/workflows/runtime/auth-helpers.ts`
```ts
Passa a mapear apenas erros `auth/*` para 401 e re-lanca falhas de infraestrutura.
```
**Verification:** `auth-helpers.test.js` cobre token expirado, token invalido, `app/no-app` e erro generico.

### `src/lib/workflows/read/queries.ts`
```ts
As queries `waiting_assignment`, `in_progress` e `waiting_action` passam a filtrar por `statusCategory == valor`.
```
**Verification:** `queries.test.js` valida a sequencia exata de `where/orderBy`.

### `firestore.indexes.json`
```json
Remove os indices compostos baseados em `hasResponsible` e `hasPendingActions`.
```
**Verification:** restou apenas o indice owner por `ownerUserId + isArchived + statusCategory + lastUpdatedAt`.

### Rotas runtime/read
Arquivos:
- `src/app/api/workflows/runtime/requests/route.ts`
- `src/app/api/workflows/runtime/requests/[id]/assign/route.ts`
- `src/app/api/workflows/runtime/requests/[id]/advance/route.ts`
- `src/app/api/workflows/runtime/requests/[id]/finalize/route.ts`
- `src/app/api/workflows/runtime/requests/[id]/archive/route.ts`
- `src/app/api/workflows/read/current/route.ts`
- `src/app/api/workflows/read/assignments/route.ts`
- `src/app/api/workflows/read/completed/route.ts`
- `src/app/api/workflows/read/mine/route.ts`

```ts
Todas passaram a usar `authenticateRuntimeActor(request)` como ponto unico de autenticacao.
```
**Verification:** nenhuma rota importa `verifyBearerToken` ou `resolveRuntimeActor` diretamente.

### Testes
Arquivos:
- `src/lib/workflows/runtime/__tests__/auth-helpers.test.js`
- `src/lib/workflows/read/__tests__/queries.test.js`
- `src/lib/workflows/read/__tests__/read-api-contract.test.js`

```js
Cobertura nova para auth 401 vs 500, mocks atualizados para `authenticateRuntimeActor` e assertions das queries alinhadas ao design.
```
**Verification:** suite focada verde.

## 4. Verification Results

| Check | Result |
|-------|--------|
| `npm test -- --runInBand src/lib/workflows/runtime/__tests__/auth-helpers.test.js src/lib/workflows/read/__tests__/queries.test.js src/lib/workflows/read/__tests__/read-api-contract.test.js` | Verified |
| `npm run build` | Verified |
| `npm run typecheck` | Failed |
| `npm run typecheck -- --pretty false 2>&1 \| rg 'src/lib/workflows/runtime/auth-helpers\|src/lib/workflows/read\|src/app/api/workflows/read\|src/app/api/workflows/runtime/requests'` | Verified |

## 5. Issues Encountered

| # | Issue | Resolution | Status |
|---|-------|------------|--------|
| 1 | `next build` falhou no sandbox com `ENOTFOUND fonts.googleapis.com` | Reexecutado fora do sandbox; build real passou | Resolved |
| 2 | `npm run typecheck` global continua falhando em modulos legados fora de workflows | Feita filtragem para confirmar ausencia de erros novos nos arquivos alterados | Open |

## 6. Post-Build Checklist

- [x] `verifyBearerToken` distingue `auth/*` de falhas de infraestrutura
- [x] As 3 queries de aba usam `statusCategory == valor`
- [x] `firestore.indexes.json` nao contem indices com `hasResponsible` ou `hasPendingActions`
- [x] As 9 rotas usam `authenticateRuntimeActor`
- [x] Nenhuma rota tocada importa `verifyBearerToken` ou `resolveRuntimeActor` diretamente
- [x] Suite focada do escopo passou
- [x] `npm run build` passou
- [ ] `npm run typecheck` global passa

## 7. Next Steps

1. Corrigir a divida legada que ainda bloqueia o `typecheck` global.
2. Publicar `firestore.indexes.json` no projeto Firebase alvo antes do smoke test em ambiente real.
