# DESIGN: FASE1_FACILITIES_ETAPA52

> Generated: 2026-03-24
> Status: Ready for build
> Scope: Fase 1 / Facilities / etapa 5.2
> Primary inputs: `DEFINE_FASE1_FACILITIES_ETAPA0.md`, `ROADMAP_FASE1_FACILITIES.md`, `WORKFLOWS_PRE_BUILD_OFICIAL.md`, `ARQUITETURA_WORKFLOWS_VERSIONADOS.md`, `DESIGN_TECNICO_RUNTIME_WORKFLOWS.md`, `DESIGN_READ_MODEL_WORKFLOWS.md`, `RESOLUCAO_PENDENCIAS_READ_MODEL_RUNTIME.md`, diagrams `01`, `02`, `03`, `05`, `06`, `07`
> Input note: the requested file `docs/workflows_new/docs_step2/DESIGN_TECNICO_E_WORKFLOWS.md` does not exist in the repository. This design uses `docs/workflows_new/docs_step2/DESIGN_TECNICO_RUNTIME_WORKFLOWS.md` as the corresponding runtime source artifact.

## 1. Objective

Materialize the technical foundation of the new workflow engine for the Facilities pilot, already using:

- `workflowTypes`
- immutable `versions`
- `stepsById + stepOrder`
- server-side runtime use cases
- minimum read model required by the pilot

This stage does **not** implement `requestAction` or `respondAction`, but the schema, read model and runtime layering must remain structurally compatible with them so etapa 5.3+ can reuse the same foundation without structural rework.

---

## 2. Scope and Source Precedence

### Included in 5.2

- central engine types;
- pilot materialization in `workflowTypes/{workflowTypeId}` and `workflowTypes/{workflowTypeId}/versions/1`;
- step identity generation;
- runtime base:
  - `resolvePublishedVersion`
  - `open-request`
  - `assign-responsible`
  - `reassign-responsible`
  - `advance-step`
  - `finalize-request`
  - `archive-request`
- minimum denormalized read model inside `workflows`;
- Firestore composite indexes required by the pilot baseline;
- file manifest ready to drive build work.

### Boundary with etapa 5.3

This design intentionally includes the minimum persisted read-model shape and the composite indexes that must already exist by the end of 5.2 because they were explicitly required as output for this stage and because 5.2 runtime writes must already persist the canonical document structure.

What remains outside 5.2 and belongs to 5.3:

- full read-layer consolidation;
- full read API delivery for all tabs as product surface;
- unified screen consumption end to end;
- broader query validation in the pilot UI.

In practice:

- 5.2 persists the read-model backbone and provisions the indexes;
- 5.3 consumes that backbone more broadly in the pilot read experience.

### Explicitly out of scope in 5.2

- `requestAction`;
- `respondAction`;
- owner propagation to active requests;
- full frontend of the unified management screen;
- full migration of the legacy engine.

### Conflict resolution between source artifacts

This design applies the following precedence when artifacts overlap:

1. `DEFINE_FASE1_FACILITIES_ETAPA0.md` for closed pilot decisions.
2. Specific technical docs (`ARQUITETURA_*`, `DESIGN_TECNICO_RUNTIME_*`, `DESIGN_READ_MODEL_*`, `RESOLUCAO_*`) for implementation contracts.
3. `WORKFLOWS_PRE_BUILD_OFICIAL.md` as synthesis and tie-breaker.

Practical consequence:

- `pendingActionCount` is **not** part of the 5.2 MVP read model, even though an older read-model document still mentions it.

---

## 3. Definitive Decisions Applied

The following decisions are treated as closed and must not be reopened in build:

- pilot workflows:
  - `facilities_manutencao_solicitacoes_gerais`
  - `facilities_solicitacao_suprimentos`
  - `facilities_solicitacao_compras`
- pilot owner email:
  - `stefania.otoni@3ainvestimentos.com.br`
- standard SLA:
  - `5` days
- canonical flow for all three workflows:
  - `Solicitacao Aberta`
  - `Em andamento`
  - `Finalizado`
- canonical `statusKey` values:
  - `solicitacao_aberta`
  - `em_andamento`
  - `finalizado`
- `stepId` is system-generated, never manually authored in DEFINE.
- `field.id` stays aligned with the current model, with explicit normalization from `centrodecusto` to `centro_custo` where applicable.
- `requestAction` and `respondAction` are not implemented in 5.2, but the architecture must remain ready for them.

---

## 4. Architecture Overview

```text
Authenticated Frontend
  |
  | POST /api/workflows/runtime/requests/*
  v
Next.js Route Handlers
  |
  +--> Auth guard (Firebase Admin ID token)
  |
  v
Workflow Runtime Service
  |
  +--> repository
  |     |- workflowTypes
  |     |- workflowTypes/{workflowTypeId}/versions
  |     |- workflows
  |     |- counters/workflowCounter
  |
  +--> engine
  |     |- resolvePublishedVersion
  |     |- stepOrder navigation
  |     |- final-step guardrails
  |
  +--> authz
  |     |- requester
  |     |- owner
  |     |- responsible
  |
  +--> history builder
  |
  +--> read-model projector
  |
  +--> notifications (after commit only)
  v
Firestore
  |- workflowTypes/{workflowTypeId}
  |- workflowTypes/{workflowTypeId}/versions/{version}
  |- workflows/{requestDocId}
  |- counters/workflowCounter
```

### Architectural direction for 5.2

- runtime logic leaves `src/contexts/WorkflowsContext.tsx` and `src/components/requests/RequestApprovalModal.tsx`;
- server-side route handlers become the source of truth for workflow writes;
- `workflowDefinitions` remains a legacy authoring source during transition, but no longer governs live runtime decisions;
- request state is always resolved by `workflowTypeId + workflowVersion + currentStepId`.

---

## 5. Data Model for the Pilot Baseline

## 5.1. Core types to materialize in 5.2

```ts
type WorkflowStatusCategory =
  | 'open'
  | 'in_progress'
  | 'waiting_action'
  | 'finalized'
  | 'archived';

type WorkflowStepKind = 'start' | 'work' | 'action' | 'final';

type WorkflowActor = {
  userId: string;
  userName: string;
  userEmail?: string;
};

type WorkflowFieldDefinition = {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'date-range' | 'file';
  required: boolean;
  placeholder?: string;
  options?: string[];
};

type WorkflowTypeRecord = {
  workflowTypeId: string;
  name: string;
  description: string;
  icon: string;
  areaId: string;
  ownerEmail: string;
  ownerUserId: string;
  allowedUserIds: string[];
  active: boolean;
  latestPublishedVersion: number;
  latestDraftVersion?: number;
  createdAt: string;
  createdBy?: string;
  updatedAt: string;
  updatedBy?: string;
};

type WorkflowStepDefinition = {
  stepId: string;
  stepName: string;
  statusKey: string;
  kind: WorkflowStepKind;
  action?: {
    type: 'approval' | 'acknowledgement' | 'execution';
    label: string;
    approverIds?: string[];
    commentRequired?: boolean;
    commentPlaceholder?: string;
    attachmentPlaceholder?: string;
  };
  assignmentMode?: 'owner_queue' | 'manual_owner_or_responsible';
  allowComment?: boolean;
  allowAttachment?: boolean;
};

type WorkflowVersionRecord = {
  workflowTypeId: string;
  version: number;
  state: 'published';
  ownerEmailAtPublish: string;
  defaultSlaDays: number;
  fields: WorkflowFieldDefinition[];
  initialStepId: string;
  stepOrder: string[];
  stepsById: Record<string, WorkflowStepDefinition>;
  publishedAt: string;
  publishedBy?: string;
};

type WorkflowStepState = {
  state: 'pending' | 'active' | 'completed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  completedBy?: WorkflowActor;
};

type WorkflowHistoryEvent = {
  type:
    | 'request_opened'
    | 'responsible_assigned'
    | 'responsible_reassigned'
    | 'step_completed'
    | 'entered_step'
    | 'request_finalized'
    | 'request_archived';
  at: string;
  by: WorkflowActor;
  comment?: string;
  metadata?: Record<string, unknown>;
};

type WorkflowRequestRecord = {
  requestId: string;
  workflowTypeId: string;
  workflowVersion: number;
  formData: Record<string, unknown>;
  stepStates: Record<string, WorkflowStepState>;
  history: WorkflowHistoryEvent[];
  submittedAt: string;
};
```

### Notes

- `waiting_action` stays in the type union even though no 5.2 use case emits it yet.
- `action` stays optional in `stepsById` for future etapa 5.3+, but the three Facilities pilot versions use only `start`, `work`, `final`.
- `ownerUserId` is required in `workflowTypes` because the read model queries are owner-centric.
- `WorkflowRequestRecord` makes explicit the operational data that the runtime writes in `workflows`, beyond the denormalized read-model helpers listed later.

## 5.2. `workflowTypes/{workflowTypeId}` shape for the pilot

Each pilot workflow gets one stable type document with these rules:

- `workflowTypeId` is one of the three closed IDs.
- `name`, `description`, `icon` and `areaId` are copied from the current legacy definition without reinterpretation.
- `ownerEmail` is `stefania.otoni@3ainvestimentos.com.br`.
- `ownerUserId` is resolved from the current collaborator record that matches `ownerEmail`.
- `allowedUserIds` is copied exactly from the current model / DEFINE artifact.
- `active = true`.
- `latestPublishedVersion = 1`.
- `latestDraftVersion` is omitted in the pilot baseline unless an authoring flow is implemented later.

### Owner resolution rule

Because the user only closed the owner **email**, the 5.2 materialization must resolve `ownerUserId` from the current collaborators source before publishing the type documents.

Build rule:

- if the collaborator record for `stefania.otoni@3ainvestimentos.com.br` is not found, materialization fails fast;
- no synthetic fallback owner ID is introduced in this stage.

## 5.3. `workflowTypes/{workflowTypeId}/versions/1` shape

All three pilot workflows publish exactly one version document at path:

- `workflowTypes/{workflowTypeId}/versions/1`

Common rules:

- `version = 1`
- `state = 'published'`
- `ownerEmailAtPublish = stefania.otoni@3ainvestimentos.com.br`
- `defaultSlaDays = 5`
- `fields` comes from the pilot contract already closed in DEFINE
- `stepOrder` contains exactly 3 `stepId` values
- `stepsById` contains exactly 3 entries
- `initialStepId` points to the generated `stepId` for `Solicitacao Aberta`

## 5.4. `stepsById` and `stepOrder`

### Required shape

```ts
stepOrder = [stepIdStart, stepIdWork, stepIdFinal];

stepsById = {
  [stepIdStart]: {
    stepId: stepIdStart,
    stepName: 'Solicitacao Aberta',
    statusKey: 'solicitacao_aberta',
    kind: 'start',
    assignmentMode: 'owner_queue'
  },
  [stepIdWork]: {
    stepId: stepIdWork,
    stepName: 'Em andamento',
    statusKey: 'em_andamento',
    kind: 'work',
    assignmentMode: 'manual_owner_or_responsible'
  },
  [stepIdFinal]: {
    stepId: stepIdFinal,
    stepName: 'Finalizado',
    statusKey: 'finalizado',
    kind: 'final'
  }
};
```

### Required invariants

- `stepOrder` is the only ordered structure.
- `stepsById` is the identity map.
- runtime navigates by `currentStepId` inside `stepOrder`, never by legacy status array index.
- no step metadata is inferred from the step position after materialization.

## 5.5. Step ID generation strategy

The generation strategy must stay simple and stable:

1. During materialization of version `1`, the builder generates one `stepId` per canonical step in logical order.
2. Recommended format:
   - `stp_${shortId}`
3. Recommended implementation:
   - derive `shortId` from `crypto.randomUUID()` or equivalent server-side generator;
   - persist the generated values immediately in `initialStepId`, `stepOrder` and `stepsById`.

### Rules

- `stepId` is never derived from `stepName`.
- `stepId` is never derived from position.
- `stepId` is never authored manually in DEFINE.
- once version `1` is published, those generated IDs are immutable.

## 5.6. Strategy to materialize `version = 1` for the three pilot workflows

### Common materialization rules

- preserve `description`, `icon`, `areaId` and `allowedUserIds` from the current legacy source;
- replace legacy status arrays with the closed 3-step canonical versioned model;
- do not carry intermediate legacy steps such as `em_analise`, `em_aprovacao_fin` or `em_execucao`;
- normalize `centrodecusto` to `centro_custo` only where the DEFINE artifact already closed that normalization.

### Input compatibility rule for `centrodecusto`

Because part of the current client surface still comes from the legacy model, 5.2 must already define an input normalization layer for open-request payloads:

- if the published version expects `centro_custo` and the incoming payload contains only `centrodecusto`, normalize it to `centro_custo` before validation and persistence;
- if both `centrodecusto` and `centro_custo` arrive together, fail fast with validation error instead of guessing precedence;
- persistence in `workflows.formData` must always use the canonical key expected by the published version;
- this compatibility layer protects the backend transition only and does not reopen the field contract closed in DEFINE.

### Pilot matrix

| Workflow | `workflowTypeId` | Allowed users | Field normalization | Canonical steps |
| --- | --- | --- | --- | --- |
| Manutencao / Solicitacoes Gerais | `facilities_manutencao_solicitacoes_gerais` | copy exact current set (`["all"]`) | normalize `centrodecusto -> centro_custo` | 3-step canonical flow |
| Solicitacao de Suprimentos | `facilities_solicitacao_suprimentos` | copy exact current set from DEFINE | normalize `centrodecusto -> centro_custo` | 3-step canonical flow |
| Solicitacao de Compras | `facilities_solicitacao_compras` | copy exact current set from DEFINE | keep current `centro_custo` | 3-step canonical flow |

### Result expected after materialization

For each workflow type:

- 1 `workflowTypes/{workflowTypeId}` document;
- 1 `workflowTypes/{workflowTypeId}/versions/1` document;
- no draft version;
- no action-enabled step in the pilot baseline.

## 5.7. `workflows/{docId}` operational contract for 5.2

The runtime instance document must persist both:

- the operational source of truth used by mutations;
- the denormalized read-model fields used later by 5.3 queries.

Minimum operational fields that must exist in `workflows/{docId}`:

- `formData`
- `stepStates`
- `history`
- `submittedAt`

### Required shape

```ts
workflows/{docId} = {
  requestId: string,
  workflowTypeId: string,
  workflowVersion: number,
  formData: Record<string, unknown>,
  stepStates: Record<string, WorkflowStepState>,
  history: WorkflowHistoryEvent[],
  submittedAt: string,
  ...denormalizedReadModelFields
}
```

### 5.2 rules for these operational fields

- `formData` is persisted only with canonical field IDs expected by the published version.
- `stepStates` is keyed by `stepId` and is the source of truth for `pending / active / completed / skipped`.
- `history` is appended on every successful mutation.
- `submittedAt` is persisted at open time and is later used by SLA derivation and requester-history queries.

---

## 6. Runtime Base to Implement in 5.2

## 6.1. Runtime modules

The 5.2 runtime should be split into:

- repository:
  - Firestore reads/writes for `workflowTypes`, `versions`, `workflows`, `counters`
- engine:
  - step navigation and flow guards
- authz:
  - requester / owner / responsible checks
- history:
  - event creation
- read-model projector:
  - denormalized field updates in `workflows`
- use cases:
  - one module per runtime operation

## 6.2. `resolvePublishedVersion`

### Responsibility

Resolve the pair `{ workflowType, version }` used by runtime operations that depend on the published definition.

### Inputs

- `workflowTypeId`

### Required behavior

- load `workflowTypes/{workflowTypeId}`;
- assert `active === true`;
- assert `latestPublishedVersion` exists and is numeric;
- load `workflowTypes/{workflowTypeId}/versions/{latestPublishedVersion}`;
- assert `state === 'published'`;
- return both documents together.

### Failure codes

- `WORKFLOW_TYPE_INACTIVE`
- `PUBLISHED_VERSION_NOT_FOUND`
- `INVALID_PUBLISHED_VERSION`

## 6.3. `open-request`

### Endpoint

- `POST /api/workflows/runtime/requests`

### Input

```ts
type OpenRequestInput = {
  workflowTypeId: string;
  formData: Record<string, unknown>;
};
```

### Required flow

1. authenticate user with Firebase ID token;
2. resolve `workflowType + published version`;
3. normalize input keys to the canonical field IDs expected by the published version;
4. validate `allowedUserIds`;
5. resolve initial step from `version.initialStepId`;
5. open a single Firestore transaction that:
   - reads/increments `counters/workflowCounter`;
   - derives `requestId`;
   - creates the `workflows/{docId}` document already with read-model fields populated;
6. commit;
7. only after successful commit, dispatch notifications.

### Atomic transaction rule

The following must happen inside the same `runTransaction`:

- counter read/update;
- `requestId` generation;
- workflow document creation.

This prevents orphan counters and partially-open requests.

### Fields that must be resolved at creation time

- `workflowVersion = resolvedPublishedVersion`
- `currentStepId = initialStepId`
- `currentStepName` from the initial step
- `currentStatusKey` from the initial step
- `statusCategory = 'open'`
- `ownerEmail` and `ownerUserId` from `workflowTypes`
- `slaDays = 5`
- `expectedCompletionAt = submittedAt + 5 days`
- `submittedMonthKey`
- `hasResponsible = false`
- `hasPendingActions = false`
- `pendingActionRecipientIds = []`
- `pendingActionTypes = []`

### Input normalization helper required in 5.2

The runtime must include a dedicated canonicalization step before field validation and persistence, for example:

```ts
function normalizePilotFormDataKeys(
  workflowTypeId: string,
  formData: Record<string, unknown>
): Record<string, unknown> {
  const normalized = { ...formData };

  const needsCentroCustoNormalization =
    workflowTypeId === 'facilities_manutencao_solicitacoes_gerais' ||
    workflowTypeId === 'facilities_solicitacao_suprimentos';

  if (!needsCentroCustoNormalization) return normalized;

  if ('centrodecusto' in normalized && 'centro_custo' in normalized) {
    throw new RuntimeError('INVALID_FORM_DATA');
  }

  if ('centrodecusto' in normalized) {
    normalized.centro_custo = normalized.centrodecusto;
    delete normalized.centrodecusto;
  }

  return normalized;
}
```

## 6.4. `assign-responsible` and `reassign-responsible`

### Endpoint

- `POST /api/workflows/runtime/requests/{id}/assign`

### Input

```ts
type AssignResponsibleInput = {
  responsibleUserId: string;
  comment?: string;
};
```

### Design decision

There is one use case module, `assign-responsible`, that handles both first assignment and reassignment.

Behavior split:

- no current responsible -> emit `responsible_assigned`;
- current responsible exists and changes -> emit `responsible_reassigned`.

### Required behavior

- only owner or authorized operational actor can execute;
- request must not be archived;
- request must not be finalized;
- request must not be in `waiting_action`;
- target responsible must exist and be valid;
- resolve the current version and the canonical work step for the request;
- update:
  - `responsibleUserId`
  - `responsibleName`
  - `hasResponsible = true`
  - `operationalParticipantIds`
  - `lastUpdatedAt`
- if the request is still at the initial step:
  - mark `Solicitacao Aberta` as completed;
  - activate the canonical `Em andamento` step;
  - update `currentStepId`, `currentStepName` and `currentStatusKey` to that work step;
  - set `statusCategory = 'in_progress'`;
- if the request was already in `Em andamento`, keep the current step and only update the responsible fields.

### Pilot-specific rule

For the simplified Facilities pilot, there is no extra runtime hop between assignment and operational execution. Assignment is the operation that materializes entry into `Em andamento`.

Because `requestAction/respondAction` is outside 5.2 scope, `waiting_action` should never be produced by the pilot runtime. Even so, `assign-responsible` must reject requests in `waiting_action` defensively instead of trying to reinterpret that state.

## 6.5. `advance-step`

### Endpoint

- `POST /api/workflows/runtime/requests/{id}/advance`

### Input

```ts
type AdvanceStepInput = {
  comment?: string;
};
```

### Required preconditions

- request is active;
- request is not archived;
- request is not finalized;
- actor is owner while in owner queue, or current responsible after assignment;
- there are no pending actions for the current step;
- current step exists in the published version;
- next step exists in `stepOrder`;
- next step is **not** `kind = 'final'`.

### Required behavior

- mark current step as `completed`;
- activate the next operational step;
- update:
  - `currentStepId`
  - `currentStepName`
  - `currentStatusKey`
  - `statusCategory = 'in_progress'`
  - `lastUpdatedAt`
- append history:
  - `step_completed`
  - `entered_step`

### Guardrail

`advance-step` must never move the request into the final step. If the next logical step is final, the caller must use `finalize-request`.

### Pilot applicability note

In the simplified 3-step Facilities pilot, first assignment already moves the request from `Solicitacao Aberta` to `Em andamento`. That means the next logical step after the active work step is the final step, so `advance-step` has no positive runtime path in these three pilot workflows.

For 5.2, `advance-step` remains part of the engine baseline as a structural capability for future workflows with more than one non-final operational step.

## 6.6. `finalize-request`

### Endpoint

- `POST /api/workflows/runtime/requests/{id}/finalize`

### Input

```ts
type FinalizeRequestInput = {
  comment?: string;
};
```

### Required preconditions

- request is active;
- request is not archived;
- request has no pending actions on the current step;
- there is a terminal step defined in the published version;
- actor is the current responsible after assignment, or the owner acting as operational exception.

### Pilot-specific ready rule

For the simplified Facilities pilot, the request is considered ready for `finalize-request` as soon as it has already entered `Em andamento` after assignment or reassignment into the active work step.

No extra non-final transition is required before finalization in these three pilot workflows.

### Authorization rule

For the Facilities pilot in 5.2:

- the current responsible can finalize the request directly once it is in `Em andamento`;
- the owner can also finalize as an operational exception path;
- no extra owner confirmation step exists in this pilot flow.

### Required behavior

- resolve the final step from the version document;
- move the request into that final step;
- mark the current operational step as completed if necessary;
- mark the final step as completed;
- update:
  - `currentStepId = finalStepId`
  - `currentStepName = 'Finalizado'`
  - `currentStatusKey = 'finalizado'`
  - `statusCategory = 'finalized'`
  - `finalizedAt = now`
  - `closedAt = now`
  - `closedMonthKey`
  - `hasPendingActions = false`
  - `pendingActionRecipientIds = []`
  - `pendingActionTypes = []`
  - `lastUpdatedAt = now`
- append `request_finalized` to history.

### Finalization rule

`finalize-request` is the only 5.2 operation that moves the request into the final step.

## 6.7. `archive-request`

### Endpoint

- `POST /api/workflows/runtime/requests/{id}/archive`

### Input

```ts
type ArchiveRequestInput = {
  comment?: string;
};
```

### Required preconditions

- request is already finalized;
- request is not already archived;
- actor is owner or authorized administrative role.

### Required behavior

- keep `currentStepId`, `currentStepName` and `currentStatusKey`;
- update:
  - `isArchived = true`
  - `statusCategory = 'archived'`
  - `archivedAt = now`
  - `lastUpdatedAt = now`
- append `request_archived` to history.

### Archive rule

- `archivedAt` is separate from `closedAt`;
- archiving is an organizational action, not a workflow transition.

---

## 7. Runtime Guardrails for 5.2

The following rules are mandatory in code and tests:

1. `open-request` is atomic.
2. `currentStepName` and `currentStatusKey` are resolved from the initial step, never from legacy arrays.
3. in the Facilities pilot, first assignment materializes entry into `Em andamento`.
4. `advance-step` cannot move to the final step.
5. in the simplified Facilities pilot, `advance-step` is structural only and has no happy-path use in the three baseline workflows.
6. `finalize-request` is the operation that moves to the final step and becomes allowed once the request is already in `Em andamento`.
7. `closedAt = finalizedAt`.
8. `archivedAt` is separate.
9. runtime never resolves live workflow behavior by legacy `name` or `statuses[0]`.
10. notifications are side effects only after successful persistence.
11. all mutations update `lastUpdatedAt` and append `history`.
12. even though 5.2 does not implement action flows, the data model keeps the invariant that action responses return control to the responsible actor rather than auto-advancing the flow.

---

## 8. Minimum Read Model Required in 5.2

The `workflows/{docId}` document must already include the minimum denormalized fields needed by the pilot baseline.

## 8.1. Required fields

| Field | Required in 5.2 | Source / note |
| --- | --- | --- |
| `requestId` | yes | sequential user-facing ID |
| `workflowTypeId` | yes | stable runtime identity |
| `workflowVersion` | yes | fixed published version |
| `submittedAt` | yes | persisted at open time; source for SLA and requester history |
| `workflowName` | yes | denormalized from `workflowTypes.name` |
| `areaId` | yes | denormalized from `workflowTypes.areaId` |
| `ownerEmail` | yes | current owner snapshot for query |
| `ownerUserId` | yes | current owner snapshot for query |
| `requesterUserId` | yes | authenticated opener |
| `requesterName` | yes | authenticated opener |
| `responsibleUserId` | yes | nullable until assignment |
| `responsibleName` | yes | nullable until assignment |
| `currentStepId` | yes | current versioned step |
| `currentStepName` | yes | denormalized from current step |
| `currentStatusKey` | yes | denormalized from current step |
| `formData` | yes | persisted with canonical field IDs only |
| `stepStates` | yes | operational step progression keyed by `stepId` |
| `history` | yes | append-only mutation trail |
| `statusCategory` | yes | `open`, `in_progress`, `finalized`, `archived`; `waiting_action` reserved |
| `hasResponsible` | yes | boolean helper |
| `hasPendingActions` | yes | stays `false` in pilot runtime, but field exists |
| `pendingActionRecipientIds` | yes | empty array in pilot runtime |
| `pendingActionTypes` | yes | empty array in pilot runtime |
| `operationalParticipantIds` | yes | owner + responsible history, future action recipients |
| `slaDays` | yes | `5` in pilot baseline |
| `expectedCompletionAt` | yes | `submittedAt + slaDays` |
| `lastUpdatedAt` | yes | every mutation |
| `finalizedAt` | yes | nullable before finalize |
| `closedAt` | yes | nullable before finalize; equals `finalizedAt` after finalize |
| `archivedAt` | yes | nullable before archive |
| `submittedMonthKey` | yes | `YYYY-MM` |
| `closedMonthKey` | yes | nullable before finalize |
| `isArchived` | yes | false before archive |

## 8.2. Fields explicitly excluded from the MVP read model

- `pendingActionCount`

Reason:

- the official synthesis already removed it from the baseline;
- 5.2 does not implement action flows;
- `hasPendingActions`, `pendingActionRecipientIds` and `pendingActionTypes` are sufficient to preserve the extensible shape.

## 8.3. Read-model update rules by use case

### `open-request`

- persist canonical `formData`;
- initialize `stepStates` with the initial step as `active` and all others as `pending`;
- append `request_opened` to `history`;
- initialize ownership fields;
- initialize current step fields from the initial step;
- set `hasResponsible = false`;
- set pending-action fields to empty values;
- initialize `operationalParticipantIds` with the current owner only;
- compute SLA and month keys.

For the pilot baseline, `requesterUserId` does not enter `operationalParticipantIds` at open time. The requester continues to recover their own history via `requesterUserId` in `Minhas solicitacoes`, not via the operational-participant query used by `Concluidas`.

### `assign-responsible` / `reassign-responsible`

- append `responsible_assigned` or `responsible_reassigned` to `history`;
- update `responsibleUserId`, `responsibleName`, `hasResponsible`;
- add responsible to `operationalParticipantIds`;
- if request was still in `Solicitacao Aberta`, move it into the canonical `Em andamento` step and set `statusCategory = 'in_progress'`;
- if request was already in `Em andamento`, keep the step unchanged and only reassign responsibility.
- if request is in `waiting_action`, reject the operation in 5.2 instead of attempting reassignment.

### `advance-step`

- append `step_completed` and `entered_step` to `history`;
- update current step fields;
- keep `statusCategory = 'in_progress'`.

In the three simplified Facilities workflows, this update rule is structurally defined but not exercised by a positive user path in 5.2.

### `finalize-request`

- mark the active work step as completed in `stepStates`;
- mark the final step as completed in `stepStates`;
- append `request_finalized` to `history`;
- update final step fields;
- set `statusCategory = 'finalized'`;
- set `finalizedAt` and `closedAt` to the same timestamp;
- derive `closedMonthKey`;
- clear pending-action helper arrays.

### `archive-request`

- append `request_archived` to `history`;
- set `isArchived = true`;
- set `statusCategory = 'archived'`;
- set `archivedAt`.

---

## 9. Queries and Indexes Required by the End of 5.2

## 9.1. Query baseline

Even with the full unified screen out of scope, the 5.2 baseline must leave the data model queryable for the official read use cases:

1. `Chamados atuais`
2. `Atribuido a mim`
3. `Acao pendente para mim`
4. `Concluidas`
5. `Minhas solicitacoes`

These queries are listed here as structural contracts and index drivers for 5.2, not as a claim that the entire read layer or unified screen is delivered in 5.2.

## 9.2. Composite indexes to provision

| # | Query | Composite index |
| --- | --- | --- |
| 1 | owner current queue | `ownerUserId asc, isArchived asc, statusCategory asc, lastUpdatedAt desc` |
| 2 | owner waiting-assignment filter | `ownerUserId asc, isArchived asc, statusCategory asc, hasResponsible asc, lastUpdatedAt desc` |
| 3 | owner waiting-action / in-progress filter | `ownerUserId asc, isArchived asc, statusCategory asc, hasPendingActions asc, lastUpdatedAt desc` |
| 4 | assigned to me | `responsibleUserId asc, isArchived asc, statusCategory asc, lastUpdatedAt desc` |
| 5 | pending action for me | `pendingActionRecipientIds array-contains, isArchived asc, statusCategory asc, lastUpdatedAt desc` |
| 6 | completed history | `operationalParticipantIds array-contains, statusCategory asc, closedAt desc` |
| 7 | requester history | `requesterUserId asc, submittedAt desc` |

### Index provisioning rule

These indexes must be provisioned manually. They do **not** appear automatically.

Accepted provisioning paths:

- update `firestore.indexes.json`;
- or provision through the Firebase / Firestore console.

### Build expectation

`firestore.indexes.json` should already be updated in the 5.2 build so the baseline is reproducible in new environments.

### Practical note for index 5

Index `#5` may stay unused during the linear Facilities pilot because `requestAction/respondAction` are outside 5.2 scope, but it belongs to the structural baseline and avoids a schema-level revisit when the action flow is introduced later.

---

## 10. API Contract Baseline

## 10.1. Authentication

The new runtime follows the same route-handler pattern already used in `src/app/api/billing/route.ts`:

- header `Authorization: Bearer <idToken>`;
- validation through Firebase Admin;
- `401` when token is missing or invalid.

## 10.2. Success response

```ts
type RuntimeSuccess<T> = {
  ok: true;
  data: T;
};
```

## 10.3. Error response

```ts
type RuntimeErrorResponse = {
  ok: false;
  code: string;
  message: string;
};
```

## 10.4. Minimum error catalog for 5.2

- `UNAUTHORIZED`
- `FORBIDDEN`
- `WORKFLOW_TYPE_INACTIVE`
- `PUBLISHED_VERSION_NOT_FOUND`
- `INVALID_PUBLISHED_VERSION`
- `INVALID_FORM_DATA`
- `REQUEST_NOT_FOUND`
- `REQUEST_ALREADY_ARCHIVED`
- `REQUEST_ALREADY_FINALIZED`
- `FINALIZATION_NOT_ALLOWED`
- `INVALID_RESPONSIBLE`
- `INVALID_STEP_TRANSITION`

Reserved for future action flow:

- `PENDING_ACTIONS_BLOCK_ADVANCE`
- `ACTION_REQUEST_NOT_FOUND`
- `ACTION_ALREADY_RESPONDED`
- `INVALID_RESPONDER`

---

## 11. ADRs for 5.2

### ADR-ET52-001: Runtime leaves the client and becomes server-side

Critical workflow writes move from context/components to `app/api/workflows/runtime/*`, using Firebase Admin and Firestore transactions where required.

### ADR-ET52-002: One assignment use case handles first assignment and reassignment

The baseline keeps one use-case module and one endpoint for assignment, branching behavior only by request state.

### ADR-ET52-003: Version `1` is seeded directly from the closed pilot contract

The build does not reinterpret legacy diagrams or invent intermediate steps. It materializes the exact 3-step canonical contract already approved in DEFINE.

### ADR-ET52-004: Action-supporting schema stays in place even without action runtime

The engine types and read-model fields reserve the future shape for `requestAction/respondAction`, but no action mutation is shipped in 5.2.

### ADR-ET52-005: Finalization and archiving remain distinct

`finalize-request` closes the operational flow. `archive-request` is a later organizational action. `closedAt` is tied to finalization and never rewritten by archiving.

---

## 12. File Manifest for Build

## 12.1. Backend / runtime files to create in 5.2

| File | Responsibility | 5.2 status |
| --- | --- | --- |
| `src/lib/workflows/runtime/types.ts` | central domain types | create |
| `src/lib/workflows/runtime/errors.ts` | runtime error catalog | create |
| `src/lib/workflows/runtime/repository.ts` | Firestore Admin access to types, versions, workflows, counters | create |
| `src/lib/workflows/runtime/engine.ts` | step navigation, final-step guards, step-state helpers | create |
| `src/lib/workflows/runtime/authz.ts` | requester / owner / responsible checks | create |
| `src/lib/workflows/runtime/history.ts` | event builders | create |
| `src/lib/workflows/runtime/read-model.ts` | denormalized field projection helpers | create |
| `src/lib/workflows/runtime/input-normalization.ts` | legacy-to-canonical payload normalization for pilot fields | create |
| `src/lib/workflows/runtime/use-cases/resolve-published-version.ts` | published version resolver | create |
| `src/lib/workflows/runtime/use-cases/open-request.ts` | atomic open flow | create |
| `src/lib/workflows/runtime/use-cases/assign-responsible.ts` | assign + reassign behavior | create |
| `src/lib/workflows/runtime/use-cases/advance-step.ts` | operational step transition | create |
| `src/lib/workflows/runtime/use-cases/finalize-request.ts` | move to final step | create |
| `src/lib/workflows/runtime/use-cases/archive-request.ts` | archive after finalization | create |
| `src/app/api/workflows/runtime/requests/route.ts` | open-request endpoint | create |
| `src/app/api/workflows/runtime/requests/[id]/assign/route.ts` | assign / reassign endpoint | create |
| `src/app/api/workflows/runtime/requests/[id]/advance/route.ts` | advance endpoint | create |
| `src/app/api/workflows/runtime/requests/[id]/finalize/route.ts` | finalize endpoint | create |
| `src/app/api/workflows/runtime/requests/[id]/archive/route.ts` | archive endpoint | create |

## 12.2. Read-model and read-layer files

| File | Responsibility | 5.2 status |
| --- | --- | --- |
| `src/lib/workflows/read/types.ts` | read DTOs shared by route handlers and consumers | ready in 5.2 |
| `src/lib/workflows/read/queries.ts` | Firestore query builders for current / assignments / completed / mine | recommended in 5.2 |
| `src/app/api/workflows/read/current/route.ts` | owner current queue read API | optional in 5.2, ready for 5.3 |
| `src/app/api/workflows/read/assignments/route.ts` | assignments read API | optional in 5.2, ready for 5.3 |
| `src/app/api/workflows/read/completed/route.ts` | completed history read API | optional in 5.2, ready for 5.3 |
| `src/app/api/workflows/read/mine/route.ts` | requester history read API | optional in 5.2, ready for 5.3 |
| `firestore.indexes.json` | composite indexes | modify in 5.2 |

## 12.3. Bootstrap / pilot materialization files

| File | Responsibility | 5.2 status |
| --- | --- | --- |
| `src/lib/workflows/bootstrap/fase1-facilities-v1.ts` | build the three pilot `workflowTypes` + `versions/1` payloads | create |
| `src/lib/workflows/bootstrap/step-id.ts` | stable `stepId` generator for publish/materialization | create |
| `src/scripts/results/workflowDefinitions.json` | legacy source used only as input | read-only reference |

### Bootstrap execution rule

In 5.2, `src/lib/workflows/bootstrap/fase1-facilities-v1.ts` is a pure payload-builder module, not a route handler.

Expected invocation pattern:

- create a dedicated manual seed script that imports this builder and writes the three pilot documents to Firestore Admin;
- run that seed script explicitly during pilot setup or local verification;
- do not expose bootstrap materialization through a public runtime route in 5.2.

## 12.4. Existing files that become adapters later

These files are not the core runtime target for 5.2, but they are the natural downstream consumers after the server-side baseline exists:

- `src/contexts/WorkflowsContext.tsx`
- `src/components/applications/WorkflowSubmissionModal.tsx`
- `src/components/requests/RequestApprovalModal.tsx`
- `src/components/requests/ManageRequests.tsx`
- `src/components/applications/MyRequests.tsx`
- `src/app/(app)/me/tasks/page.tsx`

### 5.2 expectation for adapters

- keep them untouched unless the build immediately wires the new runtime for smoke validation;
- the unified frontend rewrite remains out of scope.

---

## 13. Testing Strategy

## 13.1. Unit tests

Create runtime-focused Jest suites under `src/lib/workflows/runtime/__tests__/` for:

- `resolvePublishedVersion`;
- `buildInitialStepStates`;
- next-step resolution from `stepOrder`;
- guard that blocks `advance-step` when next step is final;
- guard that blocks `archive-request` before finalization;
- read-model projection helpers:
  - ownership
  - current step fields
  - `closedAt = finalizedAt`
  - `archivedAt` separation;
- `stepId` generator contract:
  - generated
  - stable after persistence
  - not position-derived.

## 13.2. Integration tests

Create server-side integration suites for route handlers / use cases covering:

- `open-request` creates the document with a single transaction and sequential `requestId`;
- `open-request` resolves `currentStepName/currentStatusKey` from the initial step;
- `open-request` normalizes `centrodecusto -> centro_custo` for the pilot workflows that require it;
- `assign-responsible` updates responsible fields and moves the request from `Solicitacao Aberta` into `Em andamento`;
- reassignment emits the correct history event and preserves current step;
- `advance-step` is present as an engine capability but has no happy-path execution in the simplified Facilities pilot;
- `finalize-request` is the only path to the final step;
- `finalize-request` becomes valid once the request is already in `Em andamento`;
- `archive-request` only works after finalization.

### Test double recommendation

The existing `src/lib/mock-firestore-service.ts` is browser/localStorage-oriented and does not cover the new server-side runtime. For 5.2:

- unit tests should use repository fakes or mocked `firebase-admin/firestore`;
- integration tests should exercise the runtime layer against Firestore Admin mocks or emulator-backed fixtures if introduced later.

Preferred 5.2 approach:

- use Jest manual mocks for `firebase-admin/firestore` as the default testing strategy in this stage;
- keep emulator-backed integration as an optional follow-up, not a prerequisite for the pilot build.

## 13.3. Minimum pilot flow validation

At least one golden path must be executed for each of the three pilot workflows:

1. requester opens the request;
2. owner receives it in `Solicitacao Aberta`;
3. owner assigns a responsible;
4. request is materialized in `Em andamento` as part of the assignment flow;
5. responsible finalizes;
6. owner archives afterward.

### Negative checks required

- `advance-step` from `Em andamento` into `Finalizado` must fail;
- `finalize-request` before the flow is ready must fail;
- `archive-request` before finalization must fail.

---

## 14. Rollback Plan

If the 5.2 runtime rollout fails:

1. keep legacy `workflowDefinitions` and current client-side request flows available behind a feature flag or isolated entry path;
2. disable new `app/api/workflows/runtime/*` routes;
3. stop frontend adapters from calling the new runtime;
4. preserve newly-written `workflows` documents for analysis instead of deleting them;
5. keep the pilot versioned definitions in Firestore as non-destructive seed data.

---

## 15. Build Readiness Checklist

- the three pilot workflow types are seeded with `latestPublishedVersion = 1`;
- each version document has generated `stepId`s, `initialStepId`, `stepOrder` and `stepsById`;
- server-side runtime modules exist for the five baseline mutations plus version resolution;
- the `workflows` document already carries the minimum denormalized read model;
- `firestore.indexes.json` includes the required composite indexes;
- no 5.2 code depends on resolving workflow behavior by legacy `name` or legacy status order;
- no 5.2 code implements `requestAction/respondAction`;
- the schema still leaves explicit extension points for action-enabled steps later.

---

## 16. Final Direction

This design keeps the pilot simple on purpose:

- only 3 canonical steps;
- only 5 baseline write use cases plus version resolution;
- no action runtime yet;
- no full frontend rewrite yet.

At the same time, it already enforces the architectural pivots that cannot be postponed:

- versioned type model;
- stable generated step identity;
- server-side runtime;
- denormalized read model;
- manual composite indexes;
- clear separation between `advance`, `finalize` and `archive`.

With that baseline in place, etapa 5.3 can add action-enabled workflows on top of the same structural foundation instead of reopening the engine model.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.2 | 2026-03-24 | codex | Closed `finalize-request` authorization for the Facilities pilot, added defensive rejection for `waiting_action` in assignment, made requester exclusion from `operationalParticipantIds` explicit, fixed the preferred Firestore Admin testing approach, and clarified bootstrap execution as a manual seed flow. |
| 1.1 | 2026-03-24 | codex | Added `submittedAt`, completed the operational `workflows` contract with `formData/history/stepStates`, clarified that `advance-step` is structural-only in the simplified Facilities pilot, made `finalize-request` readiness explicit from `Em andamento`, and aligned `submittedMonthKey` to `YYYY-MM`. |
| 1.0 | 2026-03-24 | design-agent | Initial technical design for Fase 1 / Facilities / etapa 5.2. |
