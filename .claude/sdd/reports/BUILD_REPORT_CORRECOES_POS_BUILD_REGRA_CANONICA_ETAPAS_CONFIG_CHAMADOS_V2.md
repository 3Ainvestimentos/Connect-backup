# BUILD REPORT: CORRECOES_POS_BUILD_REGRA_CANONICA_ETAPAS_CONFIG_CHAMADOS_V2

> Generated: 2026-04-16
> Source: DESIGN_CORRECOES_POS_BUILD_REGRA_CANONICA_ETAPAS_CONFIG_CHAMADOS_V2.md
> Status: COMPLETE

## 1. Summary

| Metric | Value |
|--------|-------|
| Tasks Total | 4 |
| Tasks Completed | 4 |
| Tasks Remaining | 0 |
| Files Created | 2 |
| Files Modified | 10 |
| Lines Added | ~182 |

## 2. Execution Timeline

| Time | Task | Agent | Status |
|------|------|-------|--------|
| 10:57 | Ajustar helper canonico para inspecionar `stepOrder` antes da canonicalizacao | codex | Done |
| 10:57 | Simplificar `publishReadiness` de steps e validar publicacao sobre o draft bruto | codex | Done |
| 10:57 | Remover `initialStepId` do contrato editavel e do payload oficial de save | codex | Done |
| 10:57 | Adicionar/atualizar suites de teste e validar a microetapa | codex | Done |

## 3. Files Modified

### `src/lib/workflows/admin-config/canonical-step-semantics.ts`
```ts
Adicionada inspecao estrutural de `stepOrder`, com preservacao defensiva do shape bruto quando ha ids ausentes ou duplicados. A canonicalizacao da versao agora ocorre apenas em drafts estruturalmente validos.
```
**Verification:** coberto por `canonical-step-semantics.test.ts`.

### `src/lib/workflows/admin-config/publishability.ts`
```ts
`evaluatePublishability()` passou a validar estrutura bruta de etapas antes de canonicalizar. A taxonomia visivel de steps foi reduzida para `MISSING_STEPS`, `DUPLICATE_STEP_ORDER`, `STEP_ORDER_REFERENCES_UNKNOWN_STEP` e `INSUFFICIENT_STEPS`.
```
**Verification:** coberto por `publishability.test.ts`.

### `src/lib/workflows/admin-config/publication-service.ts`
```ts
Publicacao agora avalia readiness sobre a versao bruta carregada do Firestore e apenas canonicaliza depois que os bloqueios estruturais passam.
```
**Verification:** validado indiretamente pelas suites de `publishability` e `draft-repository`.

### `src/lib/workflows/admin-config/types.ts`
```ts
`SaveWorkflowDraftInput` deixou de expor `initialStepId` na borda oficial do cliente.
```
**Verification:** coberto por `WorkflowDraftEditorPage.test.tsx`.

### `src/components/workflows/admin-config/editor/types.ts`
```ts
`WorkflowDraftFormValues` deixou de carregar `initialStepId` como estado editavel do formulario.
```
**Verification:** coberto por `WorkflowDraftEditorPage.test.tsx`.

### `src/components/workflows/admin-config/editor/WorkflowDraftEditorPage.tsx`
```tsx
Reset e submit do editor deixaram de trafegar `initialStepId`; o payload enviado agora contem apenas general, access, fields e steps.
```
**Verification:** coberto por `WorkflowDraftEditorPage.test.tsx`.

### `src/lib/workflows/admin-config/draft-repository.ts`
```ts
Parser de save deixou de depender de `initialStepId` no payload; o backend continua derivando o valor a partir da ordem normalizada.
```
**Verification:** coberto por `draft-repository.test.ts`.

### `src/lib/workflows/admin-config/__tests__/canonical-step-semantics.test.ts`
```ts
Nova suite dedicada cobrindo invariantes do helper para 0, 1, 2, 3 e 4+ etapas, inspecao estrutural e comportamento sem healing silencioso.
```
**Verification:** suite executada com sucesso.

### `src/lib/workflows/admin-config/__tests__/publishability.test.ts`
```ts
Testes alinhados ao contrato final de readiness, incluindo erros estruturais observaveis sem reintroduzir checks canonicos mortos.
```
**Verification:** suite executada com sucesso.

### `src/lib/workflows/admin-config/__tests__/draft-repository.test.ts`
```ts
Payloads de save atualizados para o contrato sem `initialStepId`, mantendo a prova de derivacao server-side.
```
**Verification:** suite executada com sucesso.

### `src/components/workflows/admin-config/__tests__/WorkflowDraftEditorPage.test.tsx`
```tsx
Teste de submit passou a validar o payload real enviado pelo editor e garante ausencia de `initialStepId`.
```
**Verification:** suite executada com sucesso.

## 4. Verification Results

### Syntax Checks
| File | Result |
|------|--------|
| admin-config targeted suites | Pass |

### Integration Checks
| Check | Result |
|-------|--------|
| `npm test -- --runInBand src/lib/workflows/admin-config/__tests__/canonical-step-semantics.test.ts src/lib/workflows/admin-config/__tests__/publishability.test.ts src/lib/workflows/admin-config/__tests__/draft-repository.test.ts src/components/workflows/admin-config/__tests__/WorkflowDraftEditorPage.test.tsx` | Verified |
| `npm run typecheck` | Failed (erros preexistentes e fora do escopo desta microetapa) |

### Manual Testing Required
- [ ] Validar no editor V2 que salvar um draft continua funcionando sem `initialStepId` no payload.
- [ ] Validar via UI/endpoint que drafts com `stepOrder` corrompido exibem o bloqueio estrutural correto em `publishReadiness`.

## 5. Issues Encountered

| # | Issue | Resolution | Status |
|---|-------|------------|--------|
| 1 | Uma suite de `publishability` assumia um draft estruturalmente valido, mas o fixture ficou invalido apos a nova ordem de validacao. | Fixture ajustado para incluir a etapa intermediaria esperada antes de testar approvers duplicados. | Resolved |
| 2 | `npm run typecheck` falhou em diversos arquivos fora de `admin-config`. | Registrado como baseline preexistente; a verificacao focal foi feita por suites do modulo alterado. | Open |

## 6. Deviations from DESIGN

Implementacao 100% conforme DESIGN.

## 7. Documentation Updates Required

| Document | Update Needed |
|----------|---------------|
| `.claude/sdd/reports/BUILD_REPORT_CORRECOES_POS_BUILD_REGRA_CANONICA_ETAPAS_CONFIG_CHAMADOS_V2.md` | Criado nesta entrega |
| Documentacao adicional | Nenhuma obrigatoria para fechar esta microetapa |

## 8. Post-Build Checklist

### Completed
- [x] Inspecao estrutural de `stepOrder` adicionada ao helper canonico.
- [x] `publishReadiness` simplificado para os codigos finais de steps.
- [x] `initialStepId` removido do contrato editavel e do payload oficial de save.
- [x] Suite dedicada de `canonical-step-semantics` criada.
- [x] Suites focais executadas com sucesso.
- [x] `BUILD_REPORT` gerado no padrao do projeto.

### Pending
- [ ] Executar validacao manual end-to-end no shell administrativo.
- [ ] Resolver o baseline de `typecheck` fora do escopo do admin-config.

## 9. Next Steps

1. **Testes:** validar manualmente save/publicacao de drafts no configurador V2.
2. **Documentacao:** nenhuma atualizacao extra obrigatoria alem deste `BUILD_REPORT`.
3. **Commit:** revisar diff e commitar em branch da fase 2 conforme fluxo do repositorio.
4. **Deploy:** sem acao especifica; depende do fluxo normal da aplicacao.

## 10. Implementation Notes

### Code Quality
- A validacao estrutural agora observa o draft bruto antes de qualquer healing, reduzindo risco de mascarar inconsistencias persistidas.

### Architecture Decisions
- `canonicalizeVersionSteps()` passou a ter comportamento dual: preserva shape bruto em drafts invalidos e canonicaliza apenas drafts estruturalmente consistentes.

### Performance Impact
- Impacto desprezivel; a nova inspecao percorre `stepOrder` uma vez antes da canonicalizacao.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-16 | codex | Initial build report |
