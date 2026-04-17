# BUILD REPORT: ENRIQUECIMENTO_DATA_ETAPAS_CONCLUIDAS_HISTORICO_V2_MODAL_SOLICITANTE_FINAL_SOLICITACOES

> Generated: 2026-04-17
> Source: DESIGN_ENRIQUECIMENTO_DATA_ETAPAS_CONCLUIDAS_HISTORICO_V2_MODAL_SOLICITANTE_FINAL_SOLICITACOES.md
> Status: COMPLETE

## 1. Summary

| Metric | Value |
|--------|-------|
| Tasks Total | 4 |
| Tasks Completed | 4 |
| Tasks Remaining | 0 |
| Files Created | 2 |
| Files Modified | 7 |
| Lines Added | ~220 |

## 2. Execution Timeline

| Time | Task | Agent | Status |
|------|------|-------|--------|
| 18:05 | Expandir contrato unificado requester para preservar `timeline.action/details` | codex | Done |
| 18:10 | Enriquecer `buildRequesterHistory()` com lookup `step_completed -> stepId` sem alterar ordenacao canonica do `v2` | codex | Done |
| 18:16 | Ajustar `RequesterRequestHistory` para fallback de data apenas no `legacy` | codex | Done |
| 18:23 | Cobrir adapter/helper/dialog com testes e validar com Jest + ESLint dirigido | codex | Done |

## 3. Files Modified

### `src/lib/workflows/requester/unified-types.ts`
```ts
Requester timeline agora preserva `action` e `details` estruturados.
Isso permite o match por `stepId` sem vazar o contrato bruto do endpoint
para a camada de apresentacao.
```
**Verification:** usado por adapter/helper e validado indiretamente nas suítes requester.

### `src/lib/workflows/requester/adapters/v2-to-unified-detail.ts`
```ts
O adapter `v2` deixou de reduzir a timeline a `notes` e passou a copiar
`action` e `details` no detalhe unificado, mantendo `notes` apenas como
campo auxiliar.
```
**Verification:** `src/lib/workflows/requester/adapters/__tests__/v2-to-unified-detail.test.ts`.

### `src/lib/workflows/requester/legacy/derive-legacy-timeline.ts`
```ts
O caminho legado agora popula explicitamente `action: null` e
`details: null`, preservando compatibilidade do contrato unificado.
```
**Verification:** suíte de histórico requester e render legado do dialog.

### `src/lib/workflows/requester/presentation/build-requester-history.ts`
```ts
Implementado mapa `completedAtByStepId` usando apenas eventos
`timeline.action === 'step_completed'` com `details.stepId` valido.
`v2` continua renderizando itens de `progress.items` em ordem de etapa e
anexa `occurredAt` apenas para etapas `completed`.
`legacy` continua derivado de `timeline` com fallback de data sempre visivel.
```
**Verification:** `src/lib/workflows/requester/presentation/__tests__/build-requester-history.test.ts`.

### `src/components/workflows/requester/RequesterRequestHistory.tsx`
```tsx
O render agora respeita `dateVisibility`:
- `legacy`: sempre mostra data/fallback
- `v2`: mostra data somente quando `occurredAt` existir
Isso remove o placeholder artificial de etapas `active`/`pending`.
```
**Verification:** `src/components/workflows/requester/__tests__/RequesterUnifiedRequestDetailDialog.test.tsx`.

### `src/lib/workflows/requester/adapters/__tests__/v2-to-unified-detail.test.ts`
```ts
Nova cobertura do adapter `v2` garantindo preservacao de
`timeline.action/details` no detalhe unificado requester.
```
**Verification:** `PASS`.

### `src/lib/workflows/requester/presentation/__tests__/build-requester-history.test.ts`
```ts
Amplia cobertura do helper para:
- data real em etapa `completed` do `v2`
- escolha do timestamp mais recente por `stepId`
- ausencia de data em `active`/`pending`
- politica `dateVisibility` distinta entre `legacy` e `v2`
```
**Verification:** `PASS`.

### `src/components/workflows/requester/__tests__/RequesterUnifiedRequestDetailDialog.test.tsx`
```tsx
Valida o comportamento visivel do modal requester:
- historico `v2` exibe data real da etapa concluida
- historico `v2` nao renderiza `Sem data`
- eventos tecnicos da timeline continuam invisiveis
```
**Verification:** `PASS`.

### `.claude/sdd/reports/BUILD_REPORT_ENRIQUECIMENTO_DATA_ETAPAS_CONCLUIDAS_HISTORICO_V2_MODAL_SOLICITANTE_FINAL_SOLICITACOES.md`
```md
Relatorio desta execucao, incluindo verificacoes e aderencia ao design.
```
**Verification:** criado nesta entrega.

## 4. Verification Results

### Syntax Checks
| File / Check | Result |
|--------------|--------|
| `npx jest src/lib/workflows/requester/adapters/__tests__/v2-to-unified-detail.test.ts src/lib/workflows/requester/presentation/__tests__/build-requester-history.test.ts src/components/workflows/requester/__tests__/RequesterUnifiedRequestDetailDialog.test.tsx --runInBand` | Pass |
| `npx eslint src/lib/workflows/requester/unified-types.ts src/lib/workflows/requester/adapters/v2-to-unified-detail.ts src/lib/workflows/requester/legacy/derive-legacy-timeline.ts src/lib/workflows/requester/presentation/build-requester-history.ts src/components/workflows/requester/RequesterRequestHistory.tsx src/lib/workflows/requester/adapters/__tests__/v2-to-unified-detail.test.ts src/lib/workflows/requester/presentation/__tests__/build-requester-history.test.ts src/components/workflows/requester/__tests__/RequesterUnifiedRequestDetailDialog.test.tsx` | Pass |

### Integration Checks
| Check | Result |
|-------|--------|
| Match estrutural `step_completed.details.stepId -> progressItem.stepId` | Verified |
| Ordem canonica do `Historico` `v2` preservada por `progress.order` | Verified |
| Fallback `Sem data` mantido no `legacy` | Verified |
| Placeholder removido para `v2` sem timestamp | Verified |

### Manual Testing Required
- [ ] Validar no navegador um chamado `v2` real com pelo menos uma etapa concluida e outra ativa.
- [ ] Validar um chamado `legacy` real sem timestamp em algum item para confirmar o fallback `Sem data`.

## 5. Issues Encountered

| # | Issue | Resolution | Status |
|---|-------|------------|--------|
| 1 | O teste do dialog inicialmente assumia o matcher exato da data curta | Ajustado para o formato real renderizado (`dd/MM/yyyy as HH:mm`) | Resolved |

## 6. Deviations from DESIGN

Implementacao 100% conforme DESIGN.

## 7. Documentation Updates Required

| Document | Update Needed |
|----------|---------------|
| `CLAUDE.md` | Nenhuma |
| `.claude/sdd/features/DESIGN_ENRIQUECIMENTO_DATA_ETAPAS_CONCLUIDAS_HISTORICO_V2_MODAL_SOLICITANTE_FINAL_SOLICITACOES.md` | Nenhuma |

## 8. Post-Build Checklist

### Completed
- [x] Contrato unificado requester enriquecido com `action/details`
- [x] Helper de historico `v2` enriquecido por `timeline`
- [x] Placeholder de data removido do `v2` sem regressao no `legacy`
- [x] Testes automatizados adicionados/atualizados
- [x] Build report gerado

### Pending
- [ ] Smoke manual em `/solicitacoes` com dados reais

## 9. Next Steps

1. **Testes:** executar smoke visual no modal requester com registros `legacy` e `v2`.
2. **Documentacao:** nenhuma atualizacao adicional obrigatoria.
3. **Commit:** preparar commit focado nos arquivos requester e neste build report.
4. **Deploy:** seguir fluxo normal do projeto apos validacao manual.

## 10. Implementation Notes

### Code Quality
- O enrich ficou isolado em helper puro e nao espalhou branches de negocio pelo JSX.
- O contrato unificado permaneceu como fronteira entre read model e apresentacao requester.

### Architecture Decisions
- `timeline` do `v2` foi tratada apenas como lookup table, nunca como fonte visual.
- `legacy` segue sem depender de `action/details`.

### Performance Impact
- Impacto irrelevante. O custo adicional e um `Map` em memoria sobre arrays pequenos do detalhe ja carregado.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-17 | codex | Initial build report |
