# DESIGN: Build 1 - Refatoracao do modal operacional de gestao de chamados

> Generated: 2026-04-16
> Status: Ready for build
> Source: `DEFINE_BUILD1_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`
> Depends on: `DESIGN_AJUSTES_UI_UX_GESTAO_DE_CHAMADOS_OPERACIONAL.md`

## 1. Requirements Summary

### Problem

O modal oficial de `/gestao-de-chamados` continua tratando `Finalizar` como permissao ampla de request `in_progress`, sem considerar se a etapa atual ainda tem continuidade operacional obrigatoria. Em paralelo, a superficie oficial nao integra o endpoint existente de `advance`, o que deixa owner e responsavel sem CTA explicito apos uma action respondida e mantem o detalhe desalinhado do runtime.

### Success Criteria

| Criterion | Target |
|-----------|--------|
| Permissao explicita de continuidade | payload de detalhe passa a expor `canAdvance` alem de `canFinalize`, sem inferencia local no modal |
| Advance oficial | modal operacional chama `POST /api/workflows/runtime/requests/{id}/advance` via client/hook oficial |
| Finalizacao segura | `canFinalize` e `finalize-request` so permitem conclusao quando a proxima etapa no `stepOrder` for a etapa `final` |
| Action obrigatoria respeitada | etapa com `action` configurada exige batch concluido para `advance` e `finalize` |
| Sem auto-advance implicito | responder uma action apenas desbloqueia a continuidade; a troca de etapa continua exigindo `advance` ou `finalize` explicito |
| Contrato unificado de action | owner e responsavel atual recebem a mesma elegibilidade para `requestAction` quando o runtime permitir |
| Papel do destinatario preservado | destinatario de action pendente continua sem `advance` nem `finalize` |
| Regressao do caso `#828` bloqueada | requests em etapa intermediaria nao renderizam nem aceitam `Finalizar` |

### Constraints

- nenhum endpoint novo sera criado; o build deve reutilizar as rotas runtime existentes;
- nenhuma mudanca de schema, migracao ou nova colecao em `workflows_v2`;
- o build deve ser cirurgico no frontend, sem redesenhar todo o modal;
- a UI oficial deve continuar consumindo o read-side como fonte de verdade para permissoes;
- `advance` e `finalize` precisam compartilhar a mesma leitura da maquina de estados, evitando reimplementacoes divergentes;
- `RequestActionCard` continua sendo a superficie oficial da action da etapa atual.

## 2. Architecture

### Source of Truth

Este design foi elaborado a partir de:

- [DEFINE_BUILD1_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_BUILD1_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md)
- [DESIGN_AJUSTES_UI_UX_GESTAO_DE_CHAMADOS_OPERACIONAL.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_AJUSTES_UI_UX_GESTAO_DE_CHAMADOS_OPERACIONAL.md)
- [RequestDetailDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestDetailDialog.tsx)
- [RequestActionCard.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestActionCard.tsx)
- [WorkflowManagementPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/WorkflowManagementPage.tsx)
- [use-workflow-management.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-workflow-management.ts)
- [api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/api-client.ts)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/types.ts)
- [detail.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/detail.ts)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/types.ts)
- [action-helpers.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/action-helpers.ts)
- [authz.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/authz.ts)
- [engine.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/engine.ts)
- [advance-step.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/advance-step.ts)
- [finalize-request.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/finalize-request.ts)
- [route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/runtime/requests/[id]/advance/route.ts)

Em caso de divergencia:

1. prevalece o `DEFINE` para escopo e aceite;
2. prevalece o `stepOrder` publicado para decidir se o request deve avancar ou finalizar;
3. prevalece este design para consolidar a regra unica de continuidade entre read-side, runtime e modal oficial.

### Current Snapshot

O snapshot atual do codigo mostra quatro desalinhamentos que este build precisa fechar:

1. `buildDetailPermissions()` em `read/detail.ts` hoje nao expoe `canAdvance`, libera `canFinalize` para qualquer owner/responsavel em `in_progress` e limita `canRequestAction` apenas ao responsavel.
2. `advance-step.ts` ja usa a rota oficial de runtime, mas so bloqueia action pendente; nao exige batch concluido quando a etapa tem `action`.
3. `finalize-request.ts` finaliza qualquer request `in_progress` autorizado, usando apenas `findFinalStep(version)`, sem verificar se a etapa atual e a ultima nao-final.
4. `RequestDetailDialog.tsx` consome apenas `canFinalize` e `canArchive` no footer; nao existe mutation oficial de `advance` em `api-client.ts` nem em `use-workflow-management.ts`.
5. O contrato atual tambem nao registra explicitamente que `respondAction` nao move o `currentStepId`; sem esse fechamento, o build poderia reinterpretar o fluxo como auto-avanco apos resposta da action.

### System Diagram

```text
Authenticated owner/responsible/pending-recipient
  |
  +--> /gestao-de-chamados
         |
         +--> WorkflowManagementPage
         |      |
         |      +--> useWorkflowManagement
         |      |      |
         |      |      +--> GET /api/workflows/read/requests/{id}
         |      |      |      \--> buildWorkflowRequestDetail
         |      |      |             |
         |      |      |             +--> continuation helper (new shared pure helper)
         |      |      |             +--> action-helpers.ts
         |      |      |             \--> permissions: canAssign/canAdvance/canFinalize/...
         |      |      |
         |      |      +--> POST /runtime/requests/{id}/advance
         |      |      +--> POST /runtime/requests/{id}/finalize
         |      |      +--> POST /runtime/requests/{id}/request-action
         |      |      \--> invalidate current/assignments/completed/detail queries
         |      |
         |      \--> RequestDetailDialog
         |             |
         |             +--> RequestActionCard
         |             +--> footer CTA: Avancar etapa | Finalizar | Arquivar
         |             \--> no local inference about workflow state
         |
         \--> Runtime use cases
                |
                +--> advance-step.ts
                +--> finalize-request.ts
                +--> continuation helper (same rules as read-side)
                +--> authz.ts (actor authorization only)
                \--> repository + read-model updates
```

### Data Flow

```text
LAYER 1 (Read-side contract)
1. GET /api/workflows/read/requests/{id} continua sendo o payload oficial do modal.
2. buildWorkflowRequestDetail() passa a derivar `canAdvance` e endurece `canFinalize`.
3. A decisao usa um helper puro compartilhado com o runtime, baseado em:
   - etapa atual ativa;
   - action pendente ausente;
   - batch concluido quando a etapa possui action;
   - existencia de proxima etapa;
   - tipo da proxima etapa (`work` vs `final`).

LAYER 2 (Frontend oficial)
4. WorkflowManagementPage continua abrindo RequestDetailDialog a partir de `selectedRequestId`.
5. useWorkflowManagement ganha `advanceMutation`, com o mesmo padrao de invalidacao das outras mutacoes operacionais.
6. RequestDetailDialog passa a renderizar `Avancar etapa` quando `permissions.canAdvance === true`.
7. O dialog nao calcula elegibilidade a partir de `progress`, `action.state` ou `summary.statusCategory`; ele apenas confia no payload.

LAYER 3 (Runtime enforcement)
8. advance-step.ts consulta a mesma avaliacao de continuidade antes de trocar `stepStates`.
9. finalize-request.ts tambem usa a mesma avaliacao, mas exige `nextStep.kind === 'final'`.
10. authz.ts continua validando "quem pode", enquanto o helper compartilhado valida "quando pode".

LAYER 4 (Cache and recovery)
11. onSuccess de `advanceMutation` invalida current, assignments, completed e detail.
12. O modal permanece aberto apos `advance`, reconsultando o detalhe ja na nova etapa.
13. A resposta de `respondAction` nao muda a etapa automaticamente; ela apenas atualiza o detalhe para um estado em que `canAdvance` ou `canFinalize` pode se tornar verdadeiro.
14. O modal pode continuar fechando apos `finalize` e `archive`, preservando o comportamento existente.
```

### State Management

| State | Storage | Lifecycle |
|-------|---------|-----------|
| `selectedRequestId` | `useState` em `WorkflowManagementPage` | abre/fecha o detalhe; permanece aberto apos `advance`; fecha apos `finalize/archive` |
| `detail.permissions.canAdvance` | read-side response | calculado server-side por request detail; descartado a cada refetch |
| `detail.permissions.canFinalize` | read-side response | calculado server-side; mutuamente exclusivo com `canAdvance` para a mesma etapa |
| `detail.action.state` | read-side response | segue representando `idle/pending/completed`; nao decide sozinho a continuidade |
| `advanceMutation` | React Query mutation state | pendente durante POST `/advance`; reseta apos sucesso/erro |
| `stepStates/currentStepId/currentStatusKey` | Firestore document `workflows_v2` | atualizados apenas pelo runtime (`advance-step` ou `finalize-request`) |

### Planned Permission Matrix

| Scenario | canRequestAction | canRespondAction | canAdvance | canFinalize |
|----------|------------------|------------------|------------|-------------|
| owner/responsavel em etapa ativa sem action configurada e proxima etapa `work` | false | false | true | false |
| owner/responsavel em etapa ativa sem action configurada e proxima etapa `final` | false | false | false | true |
| owner/responsavel em etapa ativa com `action` configurada e sem batch aberto | true | false | false | false |
| owner/responsavel em etapa ativa com `action` configurada e batch pendente | false | false | false | false |
| owner/responsavel em etapa ativa com `action` configurada e batch concluido, proxima etapa `work` | false | false | true | false |
| owner/responsavel em etapa ativa com `action` configurada e batch concluido, proxima etapa `final` | false | false | false | true |
| destinatario com action pendente | false | true | false | false |
| owner/responsavel em etapa ativa com `action` configurada e erro de configuracao | false | false | false | false |

## 3. Architecture Decisions

### ADR-B1-001: A regra de continuidade nasce em helper puro compartilhado

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-16 |
| **Context** | O snapshot atual repete partes da decisao em `read/detail.ts`, `advance-step.ts` e `finalize-request.ts`, mas cada camada enxerga um subconjunto diferente das regras. |

**Choice:** criar um helper puro no namespace de runtime, sem I/O, responsavel por descrever a continuidade da etapa atual e por informar se o request pode avancar, finalizar ou deve permanecer parado.

**Rationale:**
1. evita reimplementar a mesma regra em read-side e use cases;
2. transforma o `stepOrder` em fonte unica para distinguir "avanco" de "finalizacao";
3. reduz o risco de a UI esconder ou mostrar CTAs divergentes do runtime.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| duplicar a logica dentro de `buildDetailPermissions`, `advance-step` e `finalize-request` | repete as mesmas invariantes e aumenta a chance de regressao futura |
| colocar toda a logica dentro de `authz.ts` | mistura autorizacao de ator com maquina de estados da request |
| derivar `canAdvance` no frontend usando `progress` e `action.state` | viola o define, espalha inferencia e enfraquece o bloqueio server-side |

**Consequences:**
- positivo: read-side e runtime passam a falar a mesma linguagem operacional;
- positivo: novos builds podem reutilizar o helper para copy, badges ou analytics;
- negativo: introduz um novo arquivo utilitario no namespace de runtime.

### ADR-B1-002: `canFinalize` depende da proxima etapa imediata, nao apenas da existencia de uma etapa final

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-16 |
| **Context** | O runtime atual usa `findFinalStep(version)` para concluir o chamado, o que permite pular etapas intermediarias se o request estiver apenas em `in_progress`. |

**Choice:** formalizar que `finalize` so e permitido quando `findNextStep(version, currentStepId)` existir e sua `kind` for `final`.

**Rationale:**
1. traduz exatamente a regra de "ultima etapa nao-final";
2. impede o bug observado no caso `#828` sem depender de labels de status;
3. preserva `finalize-request` como unico caminho para entrar na etapa final.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| continuar usando apenas `findFinalStep(version)` | nao prova que a etapa atual e a predecessora imediata da final |
| usar `completedSteps === totalSteps - 1` como criterio | depende de contagem derivada, nao da estrutura canonica do workflow |

**Consequences:**
- positivo: finalizacao passa a respeitar o desenho publicado do workflow;
- negativo: qualquer inconsistencia no `stepOrder` vira erro explicito de runtime em vez de permissao silenciosa.

### ADR-B1-003: O modal oficial integra `advance` no mesmo pipeline de mutacoes oficiais

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-16 |
| **Context** | O endpoint `/advance` ja existe, mas ainda nao participa do namespace de management (`api-client`, hook, toasts, invalidacao). |

**Choice:** adicionar `advanceManagementRequest()` em `api-client.ts` e `advanceMutation` em `use-workflow-management.ts`, reaproveitando `WorkflowManagementMutationResult` e o mesmo invalidation fan-out das outras mutacoes operacionais.

**Rationale:**
1. mantem a integracao da rota no caminho oficial ja adotado por assign/finalize/archive/request-action/respond-action;
2. evita novo provider, novo hook ou chamadas diretas de `fetch` no componente;
3. facilita teste e rollback porque o patch segue o padrao do modulo.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| chamar `fetch('/advance')` direto no dialog | quebra o padrao de client oficial e dificulta invalidacao consistente |
| criar hook dedicado so para `advance` | aumenta o numero de abstractions sem necessidade |

**Consequences:**
- positivo: implementacao pequena e previsivel;
- negativo: `useWorkflowManagement` ganha mais uma mutation para orquestrar.

### ADR-B1-004: O CTA de continuidade permanece no footer do modal para manter o build cirurgico

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-16 |
| **Context** | O define pede uma mudanca funcional no Build 1, sem antecipar a refatoracao estrutural/visual completa do modal. |

**Choice:** manter `RequestActionCard` no corpo do dialog e inserir `Avancar etapa` no `DialogFooter`, ao lado das demais acoes globais, mas com visibilidade controlada pelo payload oficial e sem coexistencia com `Finalizar` na mesma etapa.

**Rationale:**
1. reaproveita a superficie de acao ja existente no modal;
2. reduz o risco de mexer em layout, scroll e hierarquia visual alem do necessario;
3. resolve o problema funcional com o menor delta visual possivel.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| criar um novo bloco visual completo para operacao da etapa | antecipa escopo do Build 2 |
| mover todos os CTAs operacionais para dentro de `RequestActionCard` | mistura action da etapa com transicoes de workflow diferentes |

**Consequences:**
- positivo: patch visual pequeno e compatibilidade alta com testes existentes;
- negativo: o footer continua sendo uma superficie compartilhada, embora agora com regras corretas e mutuamente exclusivas.

## 4. File Manifest

### Execution Order

| Phase | Files | Agent |
|-------|-------|-------|
| 1. Shared runtime rules | `src/lib/workflows/runtime/continuation.ts`, `src/lib/workflows/runtime/use-cases/*`, `src/lib/workflows/runtime/authz.ts` | @firebase-specialist |
| 2. Read-side contract | `src/lib/workflows/read/detail.ts`, `src/lib/workflows/read/types.ts` | @firebase-specialist |
| 3. Management client/hook | `src/lib/workflows/management/types.ts`, `src/lib/workflows/management/api-client.ts`, `src/hooks/use-workflow-management.ts` | @react-frontend-developer |
| 4. Modal integration | `src/components/workflows/management/RequestDetailDialog.tsx`, `src/components/workflows/management/WorkflowManagementPage.tsx` | @react-frontend-developer |
| 5. Test hardening | runtime/read/client/hook/dialog tests | @firebase-specialist + @react-frontend-developer |

### Detailed Manifest

| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | `src/lib/workflows/runtime/continuation.ts` | Create | helper puro para avaliar etapa ativa, action obrigatoria, proxima etapa e elegibilidade de `advance/finalize` | @firebase-specialist | - |
| 2 | `src/lib/workflows/runtime/use-cases/advance-step.ts` | Modify | usar helper compartilhado e bloquear `advance` sem batch concluido em etapa com action | @firebase-specialist | #1 |
| 3 | `src/lib/workflows/runtime/use-cases/finalize-request.ts` | Modify | usar helper compartilhado e bloquear finalizacao fora da ultima etapa nao-final | @firebase-specialist | #1 |
| 4 | `src/lib/workflows/runtime/authz.ts` | Modify | manter helpers focados em autorizacao de ator e, se necessario, adicionar helper comum owner/responsavel | @firebase-specialist | - |
| 5 | `src/lib/workflows/read/types.ts` | Modify | adicionar `canAdvance` ao contrato oficial do detalhe | @firebase-specialist | #1 |
| 6 | `src/lib/workflows/read/detail.ts` | Modify | derivar `canAdvance`, endurecer `canFinalize`, alinhar `canRequestAction` com owner/responsavel e atualizar `buildAdminDetailPermissions()` com `canAdvance: false` | @firebase-specialist | #1, #5 |
| 7 | `src/lib/workflows/management/types.ts` | Modify | refletir `canAdvance` e adicionar `WorkflowManagementAdvanceInput` | @react-frontend-developer | #5 |
| 8 | `src/lib/workflows/management/api-client.ts` | Modify | normalizar `canAdvance` e expor `advanceManagementRequest()` | @react-frontend-developer | #7 |
| 9 | `src/hooks/use-workflow-management.ts` | Modify | registrar `advanceMutation` com invalidacao das listas e do detalhe | @react-frontend-developer | #8 |
| 10 | `src/components/workflows/management/RequestDetailDialog.tsx` | Modify | renderizar CTA `Avancar etapa`, aceitar `onAdvance`/`isAdvancing` e incluir a permissao no footer | @react-frontend-developer | #7, #9 |
| 11 | `src/components/workflows/management/WorkflowManagementPage.tsx` | Modify | conectar `advanceMutation`, toast de sucesso/erro e comportamento de refetch do modal | @react-frontend-developer | #9, #10 |
| 12 | `src/lib/workflows/runtime/__tests__/runtime-use-cases.test.js` | Modify | cobrir advance/finalize em etapa com action obrigatoria e em ultima etapa nao-final | @firebase-specialist | #1, #2, #3 |
| 13 | `src/app/api/workflows/runtime/requests/__tests__/advance-route.test.ts` | Preserve or minor modify | garantir contrato HTTP inalterado da rota oficial | @firebase-specialist | #2 |
| 14 | `src/app/api/workflows/runtime/requests/__tests__/finalize-route.test.ts` | Preserve or minor modify | garantir propagacao correta de erros de finalizacao endurecida | @firebase-specialist | #3 |
| 15 | `src/lib/workflows/read/__tests__/detail.test.js` | Modify | validar matrix de permissoes com `canAdvance` e owner/responsavel/destinatario | @firebase-specialist | #5, #6 |
| 16 | `src/lib/workflows/read/__tests__/read-api-contract.test.js` | Modify | atualizar shape esperado do detalhe lido pela API oficial | @firebase-specialist | #5, #6 |
| 17 | `src/lib/workflows/management/__tests__/api-client.test.ts` | Modify | normalizar `canAdvance` e mutation `advanceManagementRequest` | @react-frontend-developer | #7, #8 |
| 18 | `src/hooks/__tests__/use-workflow-management.test.tsx` | Modify | validar invalidacao de queries tambem para `advanceMutation` | @react-frontend-developer | #9 |
| 19 | `src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx` | Modify | garantir visibilidade do CTA `Avancar etapa` e ausencia de `Finalizar` em etapa intermediaria | @react-frontend-developer | #10 |
| 20 | `src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx` | Modify | validar wiring de `advance` no container oficial e toasts de sucesso/erro | @react-frontend-developer | #11 |

## 5. Code Patterns

### Pattern 1: Helper compartilhado de continuidade da etapa

```ts
// src/lib/workflows/runtime/continuation.ts
import {
  describeCurrentStepAction,
  getPendingActionEntriesForCurrentStep,
  hasAnyActionBatchForCurrentStep,
} from './action-helpers';
import { findNextStep } from './engine';
import type { WorkflowRequestV2, WorkflowVersionV2 } from './types';

export type RequestContinuationState = {
  currentStepIsActive: boolean;
  nextStepKind: 'start' | 'work' | 'final' | null;
  hasPendingAction: boolean;
  actionConfigured: boolean;
  actionConfigurationError: string | null;
  hasAnyActionBatch: boolean;
  hasCompletedActionBatch: boolean;
  requiresCompletedActionBatch: boolean;
  canAdvanceByState: boolean;
  canFinalizeByState: boolean;
};

export function getRequestContinuationState(
  request: WorkflowRequestV2,
  version: WorkflowVersionV2,
): RequestContinuationState {
  const nextStep = findNextStep(version, request.currentStepId);
  const actionDescription = describeCurrentStepAction(version, request);
  const hasPendingAction = getPendingActionEntriesForCurrentStep(request).length > 0;
  const hasAnyActionBatch = hasAnyActionBatchForCurrentStep(request);
  const hasCompletedActionBatch = hasAnyActionBatch && !hasPendingAction;
  const requiresCompletedActionBatch = actionDescription.available;
  const currentStepIsActive = request.stepStates[request.currentStepId] === 'active';
  const actionGateSatisfied =
    !requiresCompletedActionBatch || (hasCompletedActionBatch && !actionDescription.configurationError);

  return {
    currentStepIsActive,
    nextStepKind: nextStep?.kind ?? null,
    hasPendingAction,
    actionConfigured: actionDescription.available,
    actionConfigurationError: actionDescription.configurationError,
    hasAnyActionBatch,
    hasCompletedActionBatch,
    requiresCompletedActionBatch,
    canAdvanceByState:
      request.statusCategory === 'in_progress' &&
      currentStepIsActive &&
      !hasPendingAction &&
      actionGateSatisfied &&
      nextStep?.kind === 'work',
    canFinalizeByState:
      request.statusCategory === 'in_progress' &&
      currentStepIsActive &&
      !hasPendingAction &&
      actionGateSatisfied &&
      nextStep?.kind === 'final',
  };
}
```

### Pattern 2: Derivacao de permissoes no detalhe oficial

```ts
// src/lib/workflows/read/detail.ts
function buildDetailPermissions(
  request: WorkflowRequestV2,
  version: WorkflowVersionV2,
  actorUserId: string,
): WorkflowRequestDetailPermissions {
  const isOwner = request.ownerUserId === actorUserId;
  const isResponsible =
    request.responsibleUserId != null && request.responsibleUserId === actorUserId;
  const canOperateCurrentStep = isOwner || isResponsible;
  const continuation = getRequestContinuationState(request, version);
  const pendingActionForActor = findPendingActionForActor(request, actorUserId);

  return {
    canAssign:
      isOwner &&
      request.statusCategory !== 'waiting_action' &&
      request.statusCategory !== 'finalized' &&
      request.statusCategory !== 'archived',
    canAdvance: canOperateCurrentStep && continuation.canAdvanceByState,
    canFinalize: canOperateCurrentStep && continuation.canFinalizeByState,
    canArchive:
      isOwner && request.statusCategory === 'finalized' && !request.isArchived,
    canRequestAction:
      canOperateCurrentStep &&
      request.statusCategory === 'in_progress' &&
      continuation.currentStepIsActive &&
      continuation.actionConfigured &&
      !continuation.actionConfigurationError &&
      !continuation.hasAnyActionBatch,
    canRespondAction: Boolean(pendingActionForActor),
  };
}
```

```ts
// src/lib/workflows/read/detail.ts
function buildAdminDetailPermissions(): WorkflowRequestDetailPermissions {
  return {
    canAssign: false,
    canAdvance: false,
    canFinalize: false,
    canArchive: false,
    canRequestAction: false,
    canRespondAction: false,
  };
}
```

### Pattern 3: Runtime usa o helper compartilhado como gate unico de continuidade

```ts
// src/lib/workflows/runtime/use-cases/advance-step.ts
const continuation = getRequestContinuationState(request, version);

if (!continuation.canAdvanceByState) {
  throw new RuntimeError(
    RuntimeErrorCode.INVALID_STEP_TRANSITION,
    continuation.hasPendingAction
      ? 'Nao e possivel avancar o chamado enquanto existem actions pendentes na etapa atual.'
      : continuation.requiresCompletedActionBatch && !continuation.hasCompletedActionBatch
        ? 'A etapa atual exige action concluida antes de avancar o chamado.'
        : 'A proxima etapa e a etapa final. Use finalize-request para concluir o chamado.',
    409,
  );
}
```

```ts
// src/lib/workflows/runtime/use-cases/finalize-request.ts
const continuation = getRequestContinuationState(request, version);

if (!continuation.canFinalizeByState) {
  throw new RuntimeError(
    RuntimeErrorCode.FINALIZATION_NOT_ALLOWED,
    continuation.hasPendingAction
      ? 'Nao e possivel finalizar o chamado enquanto existem actions pendentes na etapa atual.'
      : continuation.requiresCompletedActionBatch && !continuation.hasCompletedActionBatch
        ? 'A etapa atual exige action concluida antes de finalizar o chamado.'
        : 'O chamado ainda possui etapa operacional intermediaria antes da etapa final.',
    409,
  );
}
```

### Pattern 4: Mutation oficial de `advance` no namespace de management

```ts
// src/lib/workflows/management/api-client.ts
export async function advanceManagementRequest(
  user: User,
  payload: WorkflowManagementAdvanceInput,
): Promise<WorkflowManagementMutationResult> {
  const data = await authenticatedManagementFetch<unknown>(
    user,
    `/api/workflows/runtime/requests/${payload.requestId}/advance`,
    {
      method: 'POST',
      body: JSON.stringify({
        actorName: payload.actorName,
      }),
    },
  );

  return normalizeMutationResult(data);
}
```

```ts
// src/hooks/use-workflow-management.ts
const advanceMutation = useMutation({
  mutationFn: (payload: WorkflowManagementAdvanceInput) =>
    advanceManagementRequest(user!, {
      ...payload,
      actorName,
    }),
  onSuccess: async (_, variables) => invalidateOperationalQueries(variables.requestId),
});
```

### Pattern 5: Footer do modal com CTA de continuidade oficial

```tsx
// src/components/workflows/management/RequestDetailDialog.tsx
const canShowAdvance = permissions?.canAdvance === true;
const canShowFinalize = permissions?.canFinalize === true;

<DialogFooter className="border-t px-6 py-4">
  {canShowAdvance ? (
    <Button type="button" onClick={handleAdvance} disabled={isAdvancing}>
      {isAdvancing ? 'Avancando...' : 'Avancar etapa'}
    </Button>
  ) : null}
  {canShowFinalize ? (
    <Button type="button" variant="secondary" onClick={handleFinalize} disabled={isFinalizing}>
      {isFinalizing ? 'Finalizando...' : 'Finalizar'}
    </Button>
  ) : null}
  {canShowArchive ? (
    <Button type="button" variant="outline" onClick={handleArchive} disabled={isArchiving}>
      {isArchiving ? 'Arquivando...' : 'Arquivar'}
    </Button>
  ) : null}
  <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
    Fechar
  </Button>
</DialogFooter>
```

## 6. Contratos de Dados e API

### 6.1. GET `/api/workflows/read/requests/{id}` (contrato alterado)

Objetivo: manter a rota atual, mas adicionar permissao explicita de continuidade.

Novo shape relevante:

```ts
export type WorkflowRequestDetailPermissions = {
  canAssign: boolean;
  canAdvance: boolean;
  canFinalize: boolean;
  canArchive: boolean;
  canRequestAction: boolean;
  canRespondAction: boolean;
};
```

Exemplo de resposta em request intermediario pronto para seguir:

```json
{
  "ok": true,
  "data": {
    "permissions": {
      "canAssign": false,
      "canAdvance": true,
      "canFinalize": false,
      "canArchive": false,
      "canRequestAction": false,
      "canRespondAction": false
    },
    "action": {
      "available": true,
      "state": "completed"
    }
  }
}
```

Regras:

- `canAdvance` e `canFinalize` sao mutuamente exclusivos para a mesma etapa;
- `action.state = completed` sozinho nao implica `canAdvance`; a permissao continua vindo do server;
- `respondAction` nao muda `currentStepId` automaticamente; a resposta apenas desbloqueia a continuidade quando o estado da etapa permitir;
- owner e responsavel atual passam a compartilhar o mesmo gate de `canRequestAction`.

### 6.2. POST `/api/workflows/runtime/requests/{id}/advance` (sem rota nova)

```http
POST /api/workflows/runtime/requests/{id}/advance
Authorization: Bearer {firebase-token}
Content-Type: application/json
```

Request body:

```json
{
  "actorName": "Nome opcional do ator"
}
```

Response success:

```json
{
  "ok": true,
  "data": {
    "docId": "doc-advance-success",
    "requestId": 24,
    "newStepId": "stp_review",
    "newStepName": "Aguardando validacao"
  }
}
```

Response error esperada:

```json
{
  "ok": false,
  "code": "INVALID_STEP_TRANSITION",
  "message": "A etapa atual exige action concluida antes de avancar o chamado."
}
```

Novas regras funcionais:

- somente owner ou responsavel atual podem executar a mutacao;
- request precisa estar em `in_progress`;
- etapa atual precisa estar `active`;
- nao pode haver action pendente na etapa atual;
- se a etapa tiver `action`, deve existir batch concluido para a etapa atual;
- a proxima etapa precisa existir e nao pode ser `final`.

### 6.3. POST `/api/workflows/runtime/requests/{id}/finalize` (sem rota nova)

Contrato HTTP nao muda, mas a semantica muda:

- request precisa estar em `in_progress`;
- etapa atual precisa estar `active`;
- nao pode haver action pendente;
- se a etapa atual tiver `action`, deve existir batch concluido;
- a proxima etapa imediata em `stepOrder` precisa existir e ser `kind === 'final'`.

Erro esperado em request intermediario:

```json
{
  "ok": false,
  "code": "FINALIZATION_NOT_ALLOWED",
  "message": "O chamado ainda possui etapa operacional intermediaria antes da etapa final."
}
```

### 6.4. Frontend management contract

Types novos/alterados:

```ts
export type WorkflowManagementRequestDetailPermissions = {
  canAssign: boolean;
  canAdvance: boolean;
  canFinalize: boolean;
  canArchive: boolean;
  canRequestAction: boolean;
  canRespondAction: boolean;
};

export type WorkflowManagementAdvanceInput = {
  requestId: number;
  actorName?: string;
};
```

Semantica:

- `WorkflowManagementMutationResult` permanece igual;
- `normalizePermissions()` precisa defaultar `canAdvance` para `false`;
- `RequestDetailDialog` recebe `onAdvance(summary)` e `isAdvancing`;
- `WorkflowManagementPage` dispara toast de sucesso sem fechar o modal, para permitir leitura da nova etapa apos refetch.

## 7. Regras de Negocio

1. A etapa atual so pode ser continuada se estiver `active` em `stepStates`.
2. `advance` nunca pode entrar diretamente na etapa `final`.
3. `finalize` continua sendo o unico caminho para entrar na etapa `final`.
4. A ausencia de action pendente e obrigatoria tanto para `advance` quanto para `finalize`.
5. Quando a etapa atual possui `action`, a continuidade exige batch concluido na etapa atual; ausencia total de batch tambem bloqueia.
6. `canRequestAction` existe apenas para owner ou responsavel atual e somente quando ainda nao existe nenhum batch na etapa atual.
7. `canRespondAction` permanece exclusivo do destinatario com action pendente para a etapa atual.
8. Responder uma action nunca avanca a etapa automaticamente; owner ou responsavel continuam precisando executar `advance` ou `finalize` de forma explicita.
9. Em fluxo curto, quando a etapa atual nao tem `action` obrigatoria e a proxima etapa imediata e `final`, o detalhe deve expor apenas `canFinalize`.
10. `canAdvance` e `canFinalize` nunca devem ser inferidos no frontend a partir de `summary.statusCategory`, `progress` ou `action.state`.
11. O request `finalized` continua podendo ser arquivado apenas pelo owner, sem mudanca de regra.
12. O comportamento de cache do management continua sendo invalidacao ampla das filas operacionais e do detalhe apos cada mutacao.

## 8. Database Schema

Nenhuma mudanca no schema.

Nao ha:

- nova colecao;
- novo campo persistido obrigatorio;
- migracao retroativa;
- alteracao de shape em `workflows_v2`.

Todo o endurecimento deste build ocorre em contrato computado e use cases de runtime.

## 9. Testing Strategy

### Unit Tests

| Component | Test |
|-----------|------|
| `runtime/continuation.ts` | matrix de `nextStep.kind`, etapa ativa/inativa, action configurada, batch pendente, batch concluido, ausencia de batch |
| `read/detail.ts` | owner e responsavel ganham `canRequestAction`; `canAdvance` aparece apenas em etapa intermediaria elegivel; `canFinalize` so na ultima etapa nao-final; `buildAdminDetailPermissions()` mantem `canAdvance: false` |
| `management/api-client.ts` | `normalizePermissions()` reconhece `canAdvance`; `advanceManagementRequest()` usa a rota correta |

### Integration Tests

| Flow | Test |
|------|------|
| `advance-step` em etapa sem action | avanca para a proxima etapa `work` e atualiza read model |
| `advance-step` em etapa com action sem batch | retorna `INVALID_STEP_TRANSITION` |
| `advance-step` em etapa com action e batch pendente | retorna `INVALID_STEP_TRANSITION` |
| `advance-step` em etapa com action e batch concluido | avanca com sucesso |
| `finalize-request` em fluxo curto sem action e com proxima etapa `final` | finaliza com sucesso |
| `finalize-request` em etapa intermediaria com proxima etapa `work` | retorna `FINALIZATION_NOT_ALLOWED` |
| `finalize-request` em ultima etapa nao-final com batch concluido exigido | finaliza com sucesso |
| `useWorkflowManagement` | `advanceMutation` invalida current, assignments, completed e detail |
| `RequestDetailDialog` | mostra `Avancar etapa` quando `canAdvance`; nao mostra `Finalizar` no mesmo cenario; em fluxo curto mostra apenas `Finalizar` |

### Acceptance Tests

```gherkin
GIVEN um owner abre um chamado em etapa intermediaria sem action pendente e com proxima etapa de trabalho
WHEN o detalhe oficial e carregado
THEN o modal mostra "Avancar etapa"
AND nao mostra "Finalizar"
```

```gherkin
GIVEN um owner abre um chamado em etapa ativa sem action configurada e com proxima etapa final
WHEN o detalhe oficial e carregado
THEN o modal mostra "Finalizar"
AND nao mostra "Avancar etapa"
```

```gherkin
GIVEN uma etapa atual possui action configurada mas nenhum batch foi concluido
WHEN owner ou responsavel tenta avancar ou finalizar
THEN o runtime bloqueia a transicao
AND o detalhe oficial nao expone canAdvance nem canFinalize
```

```gherkin
GIVEN o destinatario responde uma action pendente com sucesso
WHEN o detalhe oficial e reconsultado
THEN o `currentStepId` permanece o mesmo
AND o modal apenas desbloqueia "Avancar etapa" ou "Finalizar" conforme a proxima etapa
```

```gherkin
GIVEN o destinatario possui uma action pendente na etapa atual
WHEN abre o detalhe oficial
THEN ele ve apenas os controles de resposta da action
AND nao recebe permissao de advance nem finalize
```

## 10. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | reverter o patch do management (`types`, `api-client`, `hook`, `dialog`, `page`) | modal volta ao comportamento anterior sem erro de compilacao |
| 2 | reverter o patch do read-side (`read/types`, `read/detail`) | payload deixa de expor `canAdvance` e volta ao shape anterior |
| 3 | reverter o helper compartilhado e os endurecimentos de runtime (`continuation.ts`, `advance-step.ts`, `finalize-request.ts`) | requests voltam a aceitar a semantica anterior de continuidade |
| 4 | executar a suite de testes de runtime/read/management | confirma retorno ao baseline anterior |

**Metodo rapido:** `git revert <commit-do-build1>`

Observacao:

- o rollback nao exige migracao de dados porque nao ha schema novo;
- o principal risco de rollback e reabrir o bug funcional de finalizacao prematura, nao perder compatibilidade persistida.

## 11. Implementation Checklist

### Pre-Build

- [x] DEFINE aprovado
- [x] Design alinhado ao playbook local de design
- [x] Diagrama ASCII definido
- [x] ADRs registradas
- [x] Manifesto de arquivos mapeado
- [x] Nenhuma mudanca de schema necessaria

### Post-Build

- [ ] `WorkflowRequestDetailPermissions` contem `canAdvance` no read-side e no management
- [ ] `advance-step` e `finalize-request` usam a mesma regra de continuidade
- [ ] `RequestDetailDialog` renderiza `Avancar etapa` no cenario elegivel
- [ ] `WorkflowManagementPage` integra toast/refetch da nova mutacao
- [ ] testes de runtime, read-side, api client, hook e dialog passam
- [ ] caso equivalente ao request `#828` permanece bloqueado

## 12. Specialist Instructions

### For @firebase-specialist

```markdown
Files to modify:
- src/lib/workflows/runtime/continuation.ts
- src/lib/workflows/runtime/use-cases/advance-step.ts
- src/lib/workflows/runtime/use-cases/finalize-request.ts
- src/lib/workflows/runtime/authz.ts
- src/lib/workflows/read/types.ts
- src/lib/workflows/read/detail.ts
- src/lib/workflows/runtime/__tests__/runtime-use-cases.test.js
- src/lib/workflows/read/__tests__/detail.test.js
- src/lib/workflows/read/__tests__/read-api-contract.test.js
- possivelmente src/app/api/workflows/runtime/requests/__tests__/advance-route.test.ts
- possivelmente src/app/api/workflows/runtime/requests/__tests__/finalize-route.test.ts

Key requirements:
- Centralizar a regra de continuidade em helper puro, sem acoplamento a Firestore.
- `finalize` so pode acontecer quando a proxima etapa imediata for `final`.
- Etapa com `action` configurada exige batch concluido para qualquer continuidade.
- `canRequestAction` no detalhe deve alinhar owner e responsavel atual.
- Nao alterar schema nem rotas existentes.
```

### For @react-frontend-developer

```markdown
Files to modify:
- src/lib/workflows/management/types.ts
- src/lib/workflows/management/api-client.ts
- src/hooks/use-workflow-management.ts
- src/components/workflows/management/RequestDetailDialog.tsx
- src/components/workflows/management/WorkflowManagementPage.tsx
- src/lib/workflows/management/__tests__/api-client.test.ts
- src/hooks/__tests__/use-workflow-management.test.tsx
- src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx
- src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx

Key requirements:
- Reusar o padrao oficial de mutation/invalidation ja existente.
- Nao inferir `canAdvance` no frontend; apenas consumir o payload.
- Manter o patch visual minimo: CTA no footer, action card preservado.
- Apos `advance`, manter o modal aberto e permitir refetch do detalhe atualizado.
- Garantir feedback claro de sucesso e erro no fluxo oficial.
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.1 | 2026-04-16 | Codex (`iterate` skill) | Clarified no auto-advance after `respondAction`, specified short-flow `canFinalize`, added explicit runtime patterns for `advance-step` and `finalize-request`, and documented `buildAdminDetailPermissions()` update with `canAdvance: false` |
| 1.0 | 2026-04-16 | Codex (`design` skill) | Initial design for Build 1 of the operational management modal refactor based on the approved DEFINE and current repository snapshot |
