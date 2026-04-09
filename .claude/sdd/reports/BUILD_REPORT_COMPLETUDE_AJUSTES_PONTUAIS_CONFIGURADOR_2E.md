# BUILD REPORT: COMPLETUDE_AJUSTES_PONTUAIS_CONFIGURADOR_2E

> Generated: 2026-04-09
> Source: DESIGN_COMPLETUDE_AJUSTES_PONTUAIS_CONFIGURADOR_2E.md
> Status: COMPLETE

## 1. Summary

| Metric | Value |
|--------|-------|
| Tasks Total | 7 |
| Tasks Completed | 7 |
| Tasks Remaining | 0 |
| Files Created | 2 |
| Files Modified | 5 |
| Lines Added | ~370 |

Detalhe: o manifest do DESIGN listou 7 itens distintos (1 componente novo + 1 teste do componente novo + 5 modificacoes em arquivos ja existentes).

## 2. Execution Timeline

| Ordem | Task | Agent | Status |
|-------|------|-------|--------|
| 1 | CREATE `WorkflowActionApproverPicker.tsx` | react-frontend-developer | Done |
| 2 | CREATE `WorkflowActionApproverPicker.test.tsx` | react-frontend-developer | Done |
| 3 | MODIFY `WorkflowDraftStepsSection.tsx` (substituir bloco inline) | react-frontend-developer | Done |
| 4 | MODIFY `draft-repository.ts` (`export hydrateApproverSelections`) | firebase-specialist | Done |
| 5 | MODIFY `draft-repository.test.ts` (+2 cenarios) | firebase-specialist | Done |
| 6 | MODIFY `write-routes.test.ts` (+2 cenarios) | firebase-specialist | Done |
| 7 | MODIFY `WorkflowVersionEditorDialog.test.tsx` (+2 cenarios + refactor mock) | react-frontend-developer | Done |
| 8 | MODIFY `WorkflowDraftEditorPage.test.tsx` (+2 cenarios) | react-frontend-developer | Done |

## 3. Files Modified

### CREATE: `src/components/workflows/admin-config/editor/WorkflowActionApproverPicker.tsx`
```tsx
// Componente stateless (apenas estado local de busca).
// Props: collaborators, selectedApprovers, unresolvedApproverIds, readOnly?, onChange, testIdPrefix?
// Responsabilidades:
//   - Filtragem local por nome/email/area (useMemo + search term)
//   - Lista de checkboxes em ScrollArea
//   - Badges dos aprovadores selecionados
//   - Banner ambar (role="alert") quando unresolvedApproverIds.length > 0
//   - Deduplicacao por collaboratorDocId antes de onChange
//   - Limpeza automatica de unresolvedApproverIds a cada toggle (ADR-3)
// Exporta: WorkflowActionApproverPicker + WorkflowActionApproverPickerProps
```
**Verification:** `npx jest ... WorkflowActionApproverPicker.test.tsx` -> 3/3 passed.

### CREATE: `src/components/workflows/admin-config/editor/__tests__/WorkflowActionApproverPicker.test.tsx`
```tsx
// 3 cenarios:
//   1. Renderiza lista de colaboradores disponiveis
//   2. Mostra banner ambar quando ha unresolvedApproverIds
//   3. Limpar selecao chama onChange com arrays vazios
// Mock local de `lucide-react` (Proxy -> <svg />) para evitar erro ESM do checkbox UI.
// Nao usa FormProvider; componente e puro.
```
**Verification:** `npx jest` -> 3/3 passed.

### MODIFY: `src/components/workflows/admin-config/editor/WorkflowDraftStepsSection.tsx`
```tsx
// Removido:
//   - import { ScrollArea } (nao usado fora do bloco)
//   - import { Badge } (nao usado fora do bloco)
//   - useState/useMemo (searchByStep, collaboratorsByStep) -> logica migrou para o picker
//   - Bloco inline de Label + Input filter + flex + ScrollArea + Checkboxes (~85 linhas)
// Adicionado:
//   - import { WorkflowActionApproverPicker } from './WorkflowActionApproverPicker'
//   - Uso do <WorkflowActionApproverPicker/> com callback onChange que dispara
//     dois setValue: steps.${index}.action.approvers e ...unresolvedApproverIds
// Mantidos (ainda usados no parent):
//   - Checkbox (toggle "Usar como etapa inicial" + commentRequired/attachmentRequired)
//   - Input/Label/Select (outros campos da etapa)
```
**Verification:** `npm run typecheck` -> 0 errors neste arquivo. Suites admin-config -> 71/71 passed.

### MODIFY: `src/lib/workflows/admin-config/draft-repository.ts`
```typescript
// Unica alteracao de codigo de producao fora do componente novo:
//   function hydrateApproverSelections(...)  ->  export function hydrateApproverSelections(...)
// Sem mudanca de assinatura, comportamento ou chamadas internas.
// Visibilidade necessaria para o teste unitario adicionado em draft-repository.test.ts.
```
**Verification:** `npm run typecheck` -> 0 errors. Todas as suites internas que chamam `hydrateApproverSelections` continuam passando.

### MODIFY: `src/lib/workflows/admin-config/__tests__/draft-repository.test.ts`
```typescript
// +2 cenarios dentro de describe('draft-repository safeguards', ...):
//   - resolveCollaboratorDocIdsToApproverIds rejeita 422 quando collaboratorDoc nao encontrado
//   - hydrateApproverSelections separa aprovadores resolvidos de nao resolvidos
//
// Alteracao auxiliar: adicionado `hydrateApproverSelections` no destructure do top-level
// require('../draft-repository') para evitar adicionar novos violacoes de lint
// no-require-imports. Isso aproveita o helper recem-exportado.
//
// O primeiro cenario estende o directGetMock para cobrir tambem:
//   - workflowTypes_v2/facilities_manutencao (exists, areaId:facilities, latestPublishedVersion:null)
//   - workflowTypes_v2/facilities_manutencao/versions/1 (exists, state:'draft')
//   - workflowAreas/facilities (exists)
//   - collaborators/collab-apr1 (exists, id3a:'APR1')
//   - collaborators/collab-ghost (NOT exists)
// Isso eh necessario para que saveWorkflowDraft chegue ate normalizeSteps ->
// resolveCollaboratorDocIdsToApproverIds, onde o 422 eh disparado.
```
**Verification:** `npx jest draft-repository.test.ts` -> 10/10 passed.

### MODIFY: `src/app/api/admin/request-config/__tests__/write-routes.test.ts`
```typescript
// +2 cenarios dentro de describe('request-config write routes', ...), antes do
// cenario 'maps runtime errors to the HTTP response':
//   - retorna read-only payload para versao published via GET
//     -> mocka getWorkflowDraftEditorData com state:'published' + mode:'read-only'
//     -> valida body.data.draft.mode === 'read-only' e state === 'published'
//   - salva draft com approverCollaboratorDocIds no PUT
//     -> mocka saveWorkflowDraft
//     -> envia payload com approverCollaboratorDocIds: ['collab-apr1']
//     -> valida que o terceiro argumento chamado no mock contem o array correto
```
**Verification:** `npx jest write-routes.test.ts` -> 10/10 passed.

### MODIFY: `src/components/workflows/admin-config/__tests__/WorkflowVersionEditorDialog.test.tsx`
```tsx
// Refactor do jest.mock de '../editor/WorkflowDraftEditorPage':
//   - De: factory com arrow function inline
//   - Para: WorkflowDraftEditorPage: jest.fn(...) -> permite mockImplementation por teste
//
// Adicionado beforeEach que re-aplica a implementacao default (isDirty:true, isReadOnly:false)
// apos jest.clearAllMocks(), preservando o teste pre-existente.
//
// +2 cenarios:
//   - 'fecha quando dirty e confirmacao e aceita'
//     -> window.confirm -> true; ESC -> onClose chamado 1x
//   - 'fecha sem confirmacao quando modo read-only'
//     -> mockImplementation do editor emitindo isReadOnly:true
//     -> ESC -> window.confirm NAO chamado; onClose chamado 1x
```
**Verification:** `npx jest WorkflowVersionEditorDialog.test.tsx` -> 3/3 passed.

### MODIFY: `src/components/workflows/admin-config/__tests__/WorkflowDraftEditorPage.test.tsx`
```tsx
// +2 cenarios:
//   - 'exibe badge "Somente leitura" e desabilita salvar quando mode e read-only'
//     -> clone do buildDraftPayload com mode:'read-only' + state:'published'
//     -> valida presenca do botao "Somente leitura" e ausencia do "Salvar rascunho"
//   - 'propaga onDirtyStateChange quando formulario e montado'
//     -> passa onDirtyStateChange como prop
//     -> valida chamada inicial com { isDirty: false, isReadOnly: false }
//
// Nota: o teste nao simula transicao dirty:false->true real porque as subsections
// estao mockadas (sem campos de formulario reais). A cobertura do contrato de
// propagacao eh feita via validacao da chamada inicial, conforme nota tecnica
// do DESIGN secao 5.7.
```
**Verification:** `npx jest WorkflowDraftEditorPage.test.tsx` -> 4/4 passed.

## 4. Verification Results

### Syntax Checks (TypeScript)
| File | Result |
|------|--------|
| `WorkflowActionApproverPicker.tsx` | Pass |
| `WorkflowActionApproverPicker.test.tsx` | Pass |
| `WorkflowDraftStepsSection.tsx` | Pass |
| `draft-repository.ts` | Pass |
| `draft-repository.test.ts` | Pass |
| `write-routes.test.ts` | Pass |
| `WorkflowVersionEditorDialog.test.tsx` | Pass |
| `WorkflowDraftEditorPage.test.tsx` | Pass |

Comando: `npm run typecheck` -> 0 erros nos arquivos do escopo. Erros restantes no projeto (dashboard, contexts, etc.) sao pre-existentes e fora do escopo deste DESIGN.

### Lint Checks (`npm run lint`)
- Nenhum erro novo introduzido nos arquivos tocados.
- Contagem total de erros `no-require-imports` reduzida em 1 (de 95 para 94) apos consolidar o require de `hydrateApproverSelections` no top-level existente.
- Os avisos/erros restantes no projeto (require imports em test files legados, warnings em `Dashboard.tsx`, etc.) sao pre-existentes.

### Integration Checks
| Check | Result |
|-------|--------|
| `npx jest src/components/workflows/admin-config src/lib/workflows/admin-config src/app/api/admin/request-config` | 18/18 suites, 71/71 tests passed |
| Picker test suite | 3/3 passed |
| draft-repository test suite | 10/10 passed (7 pre-existentes + 2 novos + hydrate helper split test) |
| write-routes test suite | 10/10 passed (8 pre-existentes + 2 novos) |
| WorkflowVersionEditorDialog test suite | 3/3 passed (1 pre-existente + 2 novos) |
| WorkflowDraftEditorPage test suite | 4/4 passed (2 pre-existentes + 2 novos) |

### Manual Testing Required
- [ ] Smoke manual do editor de draft: abrir versao em rascunho, adicionar etapa de aprovacao, selecionar/desselecionar 2 aprovadores, salvar, reabrir e validar que a selecao persiste (vide secao 8 do DESIGN).
- [ ] Validacao visual do banner ambar quando um draft herda aprovadores nao resolvidos e o banner some ao tocar em qualquer checkbox.
- [ ] Abrir versao publicada e confirmar que o botao "Somente leitura" aparece no lugar do "Salvar rascunho" e que o ESC nao dispara confirm.

## 5. Issues Encountered

| # | Issue | Resolution | Status |
|---|-------|------------|--------|
| 1 | O teste inicial do cenario `resolveCollaboratorDocIdsToApproverIds rejeita 422` falhou com `WORKFLOW_TYPE_NOT_FOUND` (404) porque `saveWorkflowDraft` precisa carregar `workflowTypes_v2/{id}`, `versions/{v}` e `workflowAreas/{areaId}` antes de chegar ao `normalizeSteps`. | Estendido o `directGetMock` com os tres paths adicionais (workflowType, version state:'draft', workflowArea). Sem alteracao no DESIGN, apenas pre-requisito operacional do mock. | Resolved |
| 2 | Jest falhou ao transformar `lucide-react` (ESM) dentro do novo teste do picker, porque `checkbox.tsx` importa `Check`. | Adicionado `jest.mock('lucide-react', () => ...)` no topo do teste (mesmo padrao usado em `WorkflowDraftEditorPage.test.tsx`). | Resolved |
| 3 | Adicionar `require('../draft-repository')` inline no novo teste introduziria uma violacao adicional de `@typescript-eslint/no-require-imports`. | Adicionado `hydrateApproverSelections` no destructure do require ja existente no topo do arquivo, eliminando a necessidade do require local. | Resolved |

## 6. Deviations from DESIGN

| Item | Design Said | Actual Implementation | Reason |
|------|-------------|----------------------|--------|
| Import de `hydrateApproverSelections` no teste | DESIGN 5.4 especifica `const { hydrateApproverSelections } = require('../draft-repository')` local no teste. | Movido para o destructure do require ja existente no topo do arquivo. | Evita adicionar um novo `no-require-imports` violation e mantem o teste mais limpo. O comportamento do teste nao muda. |
| Mock de `saveWorkflowDraft` no teste 422 | DESIGN 5.4 mostra apenas o mock dos paths `collaborators/*`. | Foi necessario estender o mock para incluir `workflowTypes_v2/...`, `versions/1` e `workflowAreas/facilities`. | Pre-requisito operacional: `saveWorkflowDraft` carrega esses documentos antes de chegar ao `resolveCollaboratorDocIdsToApproverIds`. O teste continua validando exatamente o mesmo contrato (422 quando collaborator nao existe). |
| `jest.mock('lucide-react', ...)` no teste do picker | DESIGN 5.2 nao mencionou explicitamente. | Adicionado no topo do arquivo de teste. | Necessario para jest transformar corretamente o `checkbox.tsx` importado pelo picker. Mesmo padrao ja usado em outros testes da suite (`WorkflowDraftEditorPage.test.tsx`). |

## 7. Documentation Updates Required

| Document | Update Needed |
|----------|---------------|
| CLAUDE.md | Nenhuma atualizacao necessaria. |
| .cursor/plans/ | Nao aplicavel (feature sem plano Cursor associado). |

## 8. Post-Build Checklist

### Completed
- [x] Todos os 7 itens do manifest entregues (2 CREATE + 5 MODIFY).
- [x] `npm run typecheck` limpo nos arquivos tocados.
- [x] `npm run lint` sem regressao nos arquivos tocados (saldo -1 violacao).
- [x] `npx jest` 71/71 tests green nas suites admin-config.
- [x] 8 cenarios de teste novos cobrindo os contratos sensiveis listados no DESIGN.
- [x] `hydrateApproverSelections` exportado (unica mudanca de codigo de producao alem do componente novo).
- [x] Picker isolado de `react-hook-form` (ADR-1).
- [x] Deduplicacao por `collaboratorDocId` feita dentro do picker (ADR-2).
- [x] Limpeza automatica de `unresolvedApproverIds` em todo toggle (ADR-3).

### Pending
- [ ] Smoke manual conforme secao 4 "Manual Testing Required".
- [ ] Commit na branch `refactor/workflows` (aguardando comando explicito do usuario).

## 9. Next Steps

1. **Testes manuais:** rodar o smoke manual do editor de draft conforme secao 4 (persistencia de aprovadores, banner ambar, modo read-only).
2. **Documentacao:** nenhuma alteracao necessaria em CLAUDE.md ou README.
3. **Commit:** branch atual `refactor/workflows`. Mensagem sugerida:
   > `feat(workflows): extract WorkflowActionApproverPicker and close 2E test gaps`
   Incluir os 7 arquivos do manifest + `draft-repository.ts` (export do helper). **Aguardar comando explicito do usuario antes de commitar.**
4. **Deploy:** sem impacto em Firestore rules, schema, indexes ou APIs publicas. Apenas rebuild do app (`npm run build`) eh necessario. Sem migracao de dados.

## 10. Implementation Notes

### Code Quality
- O `WorkflowActionApproverPicker` eh totalmente stateless em termos de modelo (apenas estado local de busca). Nao acessa `react-hook-form` diretamente, o que o torna reusavel fora do editor atual.
- O parent (`WorkflowDraftStepsSection`) foi reduzido em ~85 linhas e nao precisa mais do `useState<Record<number, string>>` + `useMemo` para filtragem local por step.
- A unica alteracao de visibilidade em producao (`export` de `hydrateApproverSelections`) eh mecanica, sem mudanca de comportamento. Registrar claramente no commit.

### Architecture Decisions
- Honrados os 3 ADRs do DESIGN:
  - **ADR-1**: picker e stateless e nao toca em RHF.
  - **ADR-2**: deduplicacao por `collaboratorDocId` acontece dentro do picker, antes de `onChange`.
  - **ADR-3**: `onChange` sempre recebe `unresolvedIds: []` para forcar reset do banner.
- Nenhum ADR novo introduzido durante o build.

### Performance Impact
- Neutro. O picker faz o mesmo trabalho de filtragem/deduplicacao que o bloco inline fazia. `useMemo` preserva a igualdade referencial entre renders quando `search`/`collaborators` nao mudam.
- Zero impacto em Firestore (sem leituras/escritas novas).

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-09 | build-agent | Initial build report |
