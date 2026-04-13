# BUILD REPORT: FASE1_FACILITIES_ETAPA6

> Generated: 2026-03-31
> Source: DESIGN_FASE1_FACILITIES_ETAPA6.md
> Status: COMPLETE WITH MANUAL VALIDATION PENDING

## 1. Summary

| Metric | Value |
|--------|-------|
| Workflow Surface Expanded | 2 workflows na mesma rota |
| New Modules Added | 5 |
| Existing Modules Modified | 12 |
| Tests Added | 2 |
| Tests Modified | 2 |
| Manual Validation Pending | Yes |

## 2. Delivered Scope

### Multiworkflow bootstrap and filtering
- `src/app/(app)/pilot/facilities/page.tsx`
- `src/components/pilot/facilities/FacilitiesPilotPage.tsx`
- `src/lib/workflows/pilot/workflow-registry.ts`
- `src/lib/workflows/pilot/workflow-filters.ts`
- `src/lib/workflows/pilot/__tests__/workflow-registry.test.ts`
- `src/lib/workflows/pilot/__tests__/workflow-filters.test.ts`

Verification: a rota `/pilot/facilities` agora resolve `?workflow=`, controla workflow ativo no client, espelha a selecao na URL e filtra `current`, `assignments` e `mine` localmente entre `all` e `active` sem criar novos endpoints read-side.

### Upload functional in the dynamic form
- `src/components/pilot/facilities/OpenWorkflowCard.tsx`
- `src/components/pilot/facilities/DynamicFieldRenderer.tsx`
- `src/components/pilot/facilities/__tests__/OpenWorkflowCard.test.tsx`

Verification: o formulario dinamico agora suporta `file`, faz `File -> fileUrl` via `src/lib/workflows/upload/client` antes do `open-request`, reseta ao trocar workflow e diferencia erro de assinatura/permissao de erro de transferencia do blob.

### Workflow identity in operational UI
- `src/components/pilot/facilities/CurrentQueueTab.tsx`
- `src/components/pilot/facilities/AssignmentsTab.tsx`
- `src/components/pilot/facilities/MyRequestsTab.tsx`
- `src/components/pilot/facilities/RequestSummaryList.tsx`
- `src/components/pilot/facilities/RequestDetailsDialog.tsx`
- `src/components/pilot/facilities/__tests__/RequestDetailsDialog.test.tsx`

Verification: listas e dialog passaram a exibir identidade do workflow ativo/item, deixando clara a convivencia de manutencao e suprimentos na mesma superficie operacional.

## 3. Verification Results

| Check | Result |
|------|--------|
| `npm test -- --runInBand src/lib/workflows/upload/__tests__/client.test.ts src/lib/workflows/pilot/__tests__/api-client.test.ts src/lib/workflows/pilot/__tests__/workflow-registry.test.ts src/lib/workflows/pilot/__tests__/workflow-filters.test.ts src/components/pilot/facilities/__tests__/OpenWorkflowCard.test.tsx src/components/pilot/facilities/__tests__/RequestDetailsDialog.test.tsx` | Pass |
| `npm run typecheck -- --pretty false 2>&1 | rg 'src/(lib/workflows/upload|lib/workflows/pilot|components/pilot/facilities|hooks/use-facilities-pilot|app/\\(app\\)/pilot/facilities)'` | Pass (sem matches no recorte) |

## 4. Manual Validation Pending

- [ ] Alternar entre `facilities_manutencao_solicitacoes_gerais` e `facilities_solicitacao_suprimentos` na mesma rota.
- [ ] Abrir `Solicitacao de Suprimentos` com upload real de `anexo_planilha`.
- [ ] Confirmar coexistencia correta em `Chamados atuais`, `Atribuicoes e acoes` e `Minhas solicitacoes` com `Todos os workflows` e `Somente workflow ativo`.
- [ ] Revalidar a trilha completa do workflow 1 apos a integracao de `file`.

## 5. Deviations from DESIGN

Nenhum desvio funcional relevante.

O dialog operacional reforca identidade do workflow, mas continua limitado ao payload do read-side atual, que nao expoe `formData` completo para renderizar links de arquivo dentro do modal.

## 6. Next Steps

1. Rodar os testes direcionados e o typecheck do recorte alterado.
2. Executar o smoke manual autenticado da rota `/pilot/facilities`.
3. Se a validacao manual passar, registrar a entrega nos artefatos de progresso da Fase 1.
