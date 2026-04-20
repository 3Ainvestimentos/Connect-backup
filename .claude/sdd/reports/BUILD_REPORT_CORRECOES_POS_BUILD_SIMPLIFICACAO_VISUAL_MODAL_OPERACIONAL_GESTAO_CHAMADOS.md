# BUILD REPORT: CORRECOES_POS_BUILD_SIMPLIFICACAO_VISUAL_MODAL_OPERACIONAL_GESTAO_CHAMADOS

> Generated: 2026-04-20
> Source: DESIGN_CORRECOES_POS_BUILD_SIMPLIFICACAO_VISUAL_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md
> Status: COMPLETE

## 1. Summary

| Metric | Value |
|--------|-------|
| Tasks Total | 4 |
| Tasks Completed | 4 |
| Tasks Remaining | 0 |
| Files Created | 3 |
| Files Modified | 15 |
| Lines Added | ~330 |

## 2. Execution Timeline

| Time | Task | Agent | Status |
|------|------|-------|--------|
| 15:36 | Enriquecer contrato read-side com `configuredRecipients` | codex | Done |
| 15:36 | Normalizar contrato management e criar helper unico de identidade | codex | Done |
| 15:36 | Atualizar view-model, card e fixtures/testes correlatos | codex | Done |
| 15:36 | Validar com Jest, checar typecheck e gerar build report | codex | Done |

## 3. Files Modified

### `src/lib/workflows/read/types.ts`
```ts
Adicionado `WorkflowRequestConfiguredRecipient` e o novo campo
`action.configuredRecipients` no contrato read-side.
```
**Verification:** cobertura indireta em `src/lib/workflows/read/__tests__/detail.test.js` passando.

### `src/lib/workflows/read/detail.ts`
```ts
Criado builder aditivo de `configuredRecipients` a partir de
`describeCurrentStepAction(version, request).approverIds`, com retorno `[]`
quando a action nao esta disponivel ou possui `configurationError`.
```
**Verification:** `npx jest src/lib/workflows/read/__tests__/detail.test.js --runInBand` passou no lote focal.

### `src/lib/workflows/management/types.ts`
```ts
Espelhado o novo campo `configuredRecipients` no contrato tipado da camada
management.
```
**Verification:** coberto por `api-client.test.ts`, `request-detail-view-model.test.ts` e tipagem dos fixtures.

### `src/lib/workflows/management/api-client.ts`
```ts
Normalizacao do payload oficial agora preserva `configuredRecipients`
separado de `recipients`.
```
**Verification:** `src/lib/workflows/management/__tests__/api-client.test.ts` passou.

### `src/lib/workflows/management/request-identity.ts`
```ts
Novo helper unico `resolveOperationalIdentity()` com `identityKey`
estavel para dedupe e `displayLabel` com fallback em nome, colaborador,
userId ou placeholder final.
```
**Verification:** `src/lib/workflows/management/__tests__/request-identity.test.ts` passou.

### `src/lib/workflows/management/request-detail-view-model.ts`
```ts
Pre-request deixa de usar `action.recipients` como fonte principal e passa a
priorizar `action.configuredRecipients`; pendencias com terceiros agora
deduplicam por `identityKey` em vez de por label renderizado.
```
**Verification:** `src/lib/workflows/management/__tests__/request-detail-view-model.test.ts` passou.

### `src/components/workflows/management/RequestActionCard.tsx`
```tsx
Card da action passou a reutilizar o helper unico de identidade para
requestedBy, recipients do batch e respondedBy, preservando `recipientUserId`
quando nao ha nome amigavel.
```
**Verification:** `src/components/workflows/management/__tests__/RequestActionCard.test.tsx` passou.

### `src/lib/workflows/management/__tests__/request-detail-test-data.ts`
```ts
Fixture base enriquecida com `configuredRecipients` para manter o contrato
canonico nas suites de management.
```
**Verification:** suites de management e componentes consumidoras passaram.

### Testes ajustados
```text
Atualizados testes de read-side, management, componentes management e
fixtures requester tipados para refletir o shape novo sem alterar runtime.
```
**Verification:** lote focal de 6 suites passou; checagem de typecheck para
`configuredRecipients` nao retornou novos erros remanescentes.

## 4. Verification Results

### Syntax Checks
| File | Result |
|------|--------|
| `src/lib/workflows/read/detail.ts` | Pass |
| `src/lib/workflows/management/api-client.ts` | Pass |
| `src/lib/workflows/management/request-detail-view-model.ts` | Pass |
| `src/components/workflows/management/RequestActionCard.tsx` | Pass |

### Integration Checks
| Check | Result |
|-------|--------|
| `npx jest src/lib/workflows/read/__tests__/detail.test.js src/lib/workflows/management/__tests__/api-client.test.ts src/lib/workflows/management/__tests__/request-identity.test.ts src/lib/workflows/management/__tests__/request-detail-view-model.test.ts src/components/workflows/management/__tests__/RequestActionCard.test.tsx src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx --runInBand` | Verified |
| `npm run typecheck` | Failed outside scope |
| `npm run typecheck 2>&1 | rg 'configuredRecipients|WorkflowRequestActionDetail'` | Verified |

### Manual Testing Required
- [ ] Validar no modal operacional de `/gestao-de-chamados` o estado pre-request com `configuredRecipients` populado e `recipients` vazio.
- [ ] Validar em homologacao um batch pendente com recipients sem nome resolvido para confirmar exibicao do `recipientUserId`.

## 5. Issues Encountered

| # | Issue | Resolution | Status |
|---|-------|------------|--------|
| 1 | `typecheck` global do repositorio falha por diversos erros legados fora de workflows management/read | Mantido escopo da microetapa; verificada separadamente a ausencia de novos erros ligados a `configuredRecipients` | Open |

## 6. Deviations from DESIGN

Implementacao 100% conforme DESIGN.

## 7. Documentation Updates Required

| Document | Update Needed |
|----------|---------------|
| CLAUDE.md | Nenhuma obrigatoria |
| `.claude/sdd/features/DESIGN_CORRECOES_POS_BUILD_SIMPLIFICACAO_VISUAL_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md` | Nenhuma obrigatoria |

## 8. Post-Build Checklist

### Completed
- [x] Contrato read-side enriquecido com `configuredRecipients`
- [x] Camada management normalizada para o novo campo
- [x] Helper unico de identidade criado e aplicado no view-model e no card
- [x] Suites focais de regressao atualizadas e aprovadas
- [x] Build report criado em `.claude/sdd/reports/`

### Pending
- [ ] Limpar erros legados do `typecheck` global do repositorio
- [ ] Executar validacao manual no ambiente de integracao com payload real

## 9. Next Steps

1. **Testes:** validar manualmente os cenarios pre-request e pending com terceiros no modal real.
2. **Documentacao:** nenhuma adicional obrigatoria alem deste build report.
3. **Commit:** preparar commit focado apenas em `src/lib/workflows/read/**`, `src/lib/workflows/management/**`, `src/components/workflows/management/**`, ajustes tipados requester e este build report.
4. **Deploy:** sem instrucao adicional; seguir fluxo normal apos validacao manual.

## 10. Implementation Notes

### Code Quality
- O delta foi additive-first: `recipients` manteve semantica de batch e `configuredRecipients` passou a representar configuracao estrutural da etapa.
- A regra de identidade agora tem um unico ponto de manutencao para evitar drift entre shell e card.

### Architecture Decisions
- A copy generica pre-request so entra quando `configuredRecipients` chega vazio; quando o campo existe, a UI usa a fonte oficial do read-side.
- Para nao colapsar identidades distintas, a deduplicacao foi migrada de label renderizado para chave estavel baseada em `userId`.

### Performance Impact
- Impacto desprezivel: apenas mapeamento local de arrays pequenos no read-side e no view-model.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-20 | codex | Initial build report |
