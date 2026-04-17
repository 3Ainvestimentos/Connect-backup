# DESIGN: Fase 1 - Payload enriquecido do redesign do modal de gestao de chamados (modelo de 5 zonas)

> Generated: 2026-04-17
> Version: 1.1
> Status: Ready for build
> Source: `DEFINE_REDESIGN_MODAL_GESTAO_CHAMADOS_MODELO_5_ZONAS.md`
> Scope: somente Fase 1 (`Payload Enriquecido`)
> Depends on: `DESIGN_BUILD1_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`

## 1. Requirements Summary

### Problem

O detalhe oficial de `/gestao-de-chamados` ainda entrega apenas `summary`, `progress`, `action` e `timeline` lineares. Isso deixa a Fase 2 sem dois insumos oficiais exigidos pelo DEFINE: `areaLabel` resolvido no servidor e `stepsHistory[]` agrupado por etapa, sem heuristica de frontend.

### Success Criteria

| Criterion | Target |
|-----------|--------|
| `areaLabel` oficial no detalhe | `summary.areaLabel` passa a ser retornado pelo read-side com fallback para `areaId`, sem depender do bootstrap de management |
| Historico agrupado por etapa | `stepsHistory[]` passa a existir no detalhe oficial, derivado de `progress.items`, `history.details.stepId` e `actionRequests.stepId` |
| Compatibilidade de rollout | `progress`, `timeline` e `action` permanecem inalterados e convivem com os novos campos opcionais |
| Espelho de management sincronizado | `WorkflowManagementRequestDetailData` e o normalizer do client aceitam `areaLabel` e `stepsHistory` com `Date` nas datas aninhadas |
| Sem heuristica frouxa | eventos sem `details.stepId` nao entram em `stepsHistory`; continuam visiveis apenas em `timeline` |
| Regras de visibilidade preservadas | `responseAttachmentUrl` em `stepsHistory.actionResponses` respeita a mesma regra atual de owner/responsavel |

### Constraints

- nenhum endpoint novo sera criado;
- nenhum schema de Firestore sera alterado;
- Fase 1 nao toca componentes React nem reorganiza o modal;
- Fase 1 nao enriquece `buildAdminWorkflowRequestDetail()` nem a superficie admin v2; esse alinhamento fica fora do rollout desta rodada;
- todos os novos campos adicionados ao contrato devem ser opcionais (`?`) nesta rodada;
- o detalhe oficial continua sendo a unica fonte de verdade para o modal;
- `progress`, `timeline` e `action` nao podem ser removidos, rebatizados nem enfraquecidos;
- o agrupamento por etapa deve usar apenas dados oficiais (`stepOrder`, `stepStates`, `history.details.stepId`, `actionRequests.stepId`).

## 2. Architecture

### Source of Truth

Este design foi elaborado a partir de:

- `DEFINE_REDESIGN_MODAL_GESTAO_CHAMADOS_MODELO_5_ZONAS.md`
- `src/lib/workflows/read/detail.ts`
- `src/lib/workflows/read/types.ts`
- `src/lib/workflows/read/queries.ts`
- `src/lib/workflows/read/bootstrap.ts`
- `src/lib/workflows/management/types.ts`
- `src/lib/workflows/management/api-client.ts`
- `src/components/workflows/management/RequestDetailDialog.tsx`
- `src/lib/workflows/read/__tests__/detail.test.js`
- `src/lib/workflows/read/__tests__/read-api-contract.test.js`
- `src/lib/workflows/management/__tests__/api-client.test.ts`

Em caso de divergencia:

1. prevalece o DEFINE para escopo e aceite;
2. prevalece o contrato atual do detalhe para backward compatibility;
3. prevalece este design para a introducao de `areaLabel` e `stepsHistory` sem quebrar a Fase 2.

### Current Snapshot

O snapshot atual do codigo mostra quatro limites que a Fase 1 precisa fechar:

1. `summary.areaId` e apenas espelhado de `workflows_v2`; nao existe lookup server-side de `workflowAreas` no detalhe.
2. `timeline` e linear e nao oferece agrupamento por etapa; `details.stepId` e carregado, mas nao consumido pelo contrato.
3. `action.recipients` expõe apenas o batch exibivel da etapa atual; respostas de action de etapas anteriores nao sobem para o payload oficial.
4. o espelho `management` descarta qualquer campo nao mapeado explicitamente no normalizer, entao a Fase 2 nao veria o enriquecimento sem ajuste simultaneo.

### System Diagram

```text
Authenticated actor
  |
  +--> GET /api/workflows/read/requests/{requestId}
         |
         +--> getWorkflowRequestDetail(requestId, actorUserId)
                |
                +--> runtime repository
                |      |- getWorkflowRequestByRequestId()
                |      \- getWorkflowVersion()
                |
                +--> read area lookup helper
                |      \- workflowAreas/{areaId} -> area name or fallback
                |
                \--> buildWorkflowRequestDetail(...)
                       |- summary + areaLabel
                       |- permissions
                       |- formData
                       |- attachments
                       |- progress (legacy preserved)
                       |- action (legacy preserved)
                       |- timeline (legacy preserved)
                       \- stepsHistory (new optional grouped block)
                               |
                               +--> progress.items as structural base
                               +--> history entries with details.stepId
                               \--> actionRequests scoped by stepId

Browser / management client
  |
  \--> getManagementRequestDetail()
         |
         \--> normalizeRequestDetailData()
                |- summary.areaLabel?: string
                \- stepsHistory?: Date-normalized mirror for Fase 2
```

### Data Flow

```text
LAYER 1 (Server read contract)
1. A rota GET /read/requests/{id} continua identica em URL e envelope.
2. getWorkflowRequestDetail() carrega request + version + label amigavel da area.
3. buildWorkflowRequestDetail() recebe esse enriquecimento e devolve o detalhe oficial.

LAYER 2 (Contract enrichment)
4. summary preserva todos os campos atuais e passa a aceitar areaLabel?: string.
5. progress, action e timeline seguem no payload sem alteracao semantica.
6. stepsHistory?: [] entra como bloco paralelo e opcional.

LAYER 3 (Grouping rules)
7. A base de stepsHistory nasce de version.stepOrder e request.stepStates.
8. events[] incluem apenas timeline entries cujo details.stepId === stepId.
9. actionResponses[] incluem actionRequests cujo stepId === stepId.
10. Etapas sem eventos ou action responses continuam presentes com arrays vazios.
11. Eventos sem stepId nao sao inferidos localmente nem redistribuidos artificialmente.

LAYER 4 (Frontend mirror)
12. management/types.ts espelha areaLabel?: string e stepsHistory?: ...
13. management/api-client.ts converte timestamps novos para Date.
14. Nenhum componente React passa a depender desses campos nesta fase; o objetivo e destravar a Fase 2 com contrato pronto.
```

### State Management

| State | Storage | Lifecycle |
|-------|---------|-----------|
| `summary.areaLabel` | response do read-side | calculado por request detail; descartado a cada refetch |
| `stepsHistory` | response do read-side | derivado server-side por request detail; descartado a cada refetch |
| `timeline` | response do read-side | preservado para compatibilidade e transicao |
| `action.recipients` | response do read-side | preservado como visao da etapa atual; nao substitui `stepsHistory.actionResponses` |
| `stepsHistory[].events[].timestamp` | `Date | null` no espelho de management | normalizado no client para consumo futuro da Fase 2 |
| `stepsHistory[].actionResponses[].respondedAt` | `Date | null` no espelho de management | normalizado no client; opcional quando a resposta ainda nao ocorreu |

## 3. Architecture Decisions

### ADR-5Z-F1-001: `stepsHistory` entra como extensao paralela, nao como substituicao imediata

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-17 |
| **Context** | O modal atual, os testes e o espelho de management ainda dependem diretamente de `progress`, `timeline` e `action`. |

**Choice:** adicionar `stepsHistory?: []` ao contrato do detalhe sem remover nem remodelar os blocos legados nesta fase.

**Rationale:**
1. reduz risco de regressao no modal atual;
2. permite rollout em duas fases conforme o DEFINE;
3. prepara a Fase 2 sem acoplamento forte entre build de payload e build de shell.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| substituir `timeline` por `stepsHistory` ja na Fase 1 | quebra consumidores atuais e mistura payload com refactor visual |
| substituir `progress.items` pelo novo shape | forcaria mudanca imediata em componentes React fora do escopo |

**Consequences:**
- positivo: rollout incremental e rollback simples;
- negativo: o payload ficara temporariamente redundante.

### ADR-5Z-F1-002: `areaLabel` e resolvido no servidor dentro do pipeline de detalhe

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-17 |
| **Context** | Hoje a area amigavel e resolvida no bootstrap administrativo e em superficies requester, mas nao no detalhe oficial. |

**Choice:** resolver `summary.areaLabel` no read-side do detalhe a partir de `workflowAreas`, com fallback para `areaId`.

**Rationale:**
1. o DEFINE exige que o bootstrap de management nao seja fonte de verdade para esse dado;
2. evita heuristica duplicada no frontend;
3. deixa o contrato pronto para qualquer consumidor futuro da rota de detalhe.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| resolver label no `RequestDetailDialog` via bootstrap | viola o DEFINE e nao beneficia outros consumidores da rota |
| alterar `mapWorkflowRequestToReadSummary()` para sempre adicionar label | acopla listas e detalhe ao mesmo custo de lookup e aumenta superficie de regressao |

**Consequences:**
- positivo: `summary` passa a carregar apresentacao amigavel oficial;
- negativo: `getWorkflowRequestDetail()` ganha uma leitura adicional de area.

### ADR-5Z-F1-003: o agrupamento por etapa usa apenas `details.stepId` e `actionRequests.stepId`

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-17 |
| **Context** | O historico atual contem eventos lineares e nem todo evento carrega contexto de etapa. |

**Choice:** incluir em `stepsHistory.events` apenas eventos cujo `details.stepId` seja string igual ao `stepId` da etapa. Nenhum fallback heuristico sera aplicado nesta rodada.

**Rationale:**
1. segue exatamente o DEFINE aprovado;
2. impede agrupamento incorreto de eventos historicos;
3. preserva `timeline` como camada legado durante a transicao.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| inferir etapa por `currentStepId`, `action`, `statusKey` ou ordem temporal | heuristica fraca e semanticamente instavel |
| omitir etapas sem eventos | enfraquece a leitura estrutural e viola o shape canonico aprovado |

**Consequences:**
- positivo: `stepsHistory` nasce confiavel;
- negativo: parte do historico continuara visivel apenas em `timeline` ate rodadas futuras.

### ADR-5Z-F1-004: o builder do detalhe permanece quase puro; o lookup externo acontece antes da composicao final

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-17 |
| **Context** | `buildWorkflowRequestDetail()` hoje e usado diretamente em testes unitarios e recebe apenas `docId`, `request`, `version` e `actorUserId`. |

**Choice:** manter `buildWorkflowRequestDetail()` como compositor deterministico, aceitando um enrichment opcional (`areaLabel`) e deixando o carregamento async de `workflowAreas` no wrapper `getWorkflowRequestDetail()`.

**Rationale:**
1. preserva o modelo atual de testes;
2. concentra I/O na borda async e mantem o builder simples;
3. facilita reaproveitar o mesmo builder para variantes admin/test fixtures.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| transformar o builder em async | espalha I/O para onde hoje existe apenas composicao pura |
| buscar `workflowAreas` direto no componente frontend | viola a fronteira server-side definida |

**Consequences:**
- positivo: testes de composicao continuam baratos;
- negativo: assinatura do builder cresce com um enrichment adicional opcional.

### ADR-5Z-F1-005: `buildAdminWorkflowRequestDetail()` fica explicitamente fora da Fase 1

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-17 |
| **Context** | Existe uma variante admin que tambem produz `WorkflowRequestDetailData`, mas o alvo desta fase e o pipeline principal consumido por management/requester para destravar o modal de `/gestao-de-chamados`. |

**Choice:** nao enriquecer `buildAdminWorkflowRequestDetail()` nesta fase. O rollout de `areaLabel` e `stepsHistory` vale apenas para `getWorkflowRequestDetail()` e para o espelho de management associado a esse detalhe oficial.

**Rationale:**
1. mantem a Fase 1 contida ao alvo principal da feature;
2. evita ampliar o build para a superficie admin v2 sem necessidade imediata;
3. reduz risco de regressao lateral em contratos administrativos fora do escopo desta rodada.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| enriquecer tambem a variante admin ja na Fase 1 | amplia escopo e exigiria definir uma politica especifica para o contrato enriquecido no fluxo admin |

**Consequences:**
- positivo: build mais focado e previsivel;
- negativo: durante esta rodada, dois produtores de `WorkflowRequestDetailData` coexistem com capacidades diferentes por decisao consciente de rollout.

## 4. File Manifest

### Execution Order

| Phase | Files | Agent |
|-------|-------|-------|
| 1. Read contract | `src/lib/workflows/read/types.ts` | @firebase-specialist |
| 2. Read composition | `src/lib/workflows/read/detail.ts`, `src/lib/workflows/read/queries.ts` | @firebase-specialist |
| 3. Frontend mirror | `src/lib/workflows/management/types.ts`, `src/lib/workflows/management/api-client.ts` | @react-frontend-developer |
| 4. Validation | `src/lib/workflows/read/__tests__/detail.test.js`, `src/lib/workflows/read/__tests__/read-api-contract.test.js`, `src/lib/workflows/management/__tests__/api-client.test.ts` | @react-frontend-developer |

### Detailed Manifest

| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | `src/lib/workflows/read/types.ts` | Modify | adicionar `summary.areaLabel?: string`, tipos de `stepsHistory` e `stepsHistory?: []` em `WorkflowRequestDetailData` | @firebase-specialist | - |
| 2 | `src/lib/workflows/read/detail.ts` | Modify | compor `areaLabel`, criar `buildDetailStepsHistory()` sem recomputar `progress`, manter `progress/action/timeline` intactos | @firebase-specialist | #1 |
| 3 | `src/lib/workflows/read/queries.ts` | Modify | expor helper server-side de lookup da area amigavel para o detalhe | @firebase-specialist | #1 |
| 4 | `src/lib/workflows/management/types.ts` | Modify | espelhar `areaLabel?: string` e `stepsHistory?: []` com variantes `Date` | @react-frontend-developer | #1 |
| 5 | `src/lib/workflows/management/api-client.ts` | Modify | extrair `normalizeHistoryAction`, `normalizeActionRequestStatus`, `normalizeStepKind`, `normalizeStepState` de funcoes existentes; criar `normalizeStepHistoryEvent`, `normalizeStepHistoryActionResponse`, `normalizeStepHistoryItem`; estender `normalizeRequestSummary` com `areaLabel` e `normalizeRequestDetailData` com `stepsHistory` | @react-frontend-developer | #4 |
| 6 | `src/lib/workflows/read/__tests__/detail.test.js` | Modify | cobrir `areaLabel`, agrupamento por etapa, arrays vazios e visibilidade de anexos de resposta | @firebase-specialist | #2, #3 |
| 7 | `src/lib/workflows/read/__tests__/read-api-contract.test.js` | Modify | travar o contrato enriquecido sem mudar URL/envelope da rota | @firebase-specialist | #2 |
| 8 | `src/lib/workflows/management/__tests__/api-client.test.ts` | Modify | validar normalizacao de `areaLabel`, `stepsHistory.events.timestamp` e `stepsHistory.actionResponses.respondedAt` | @react-frontend-developer | #5 |

## 5. Code Patterns

### Pattern 1: composicao do detalhe com enrichment opcional

```ts
type WorkflowRequestDetailBuildInput = {
  docId: string;
  request: WorkflowRequestV2;
  version: WorkflowVersionV2;
  actorUserId: string;
  areaLabel?: string | null;
};

function buildDetailSummary(
  docId: string,
  request: WorkflowRequestV2,
  areaLabel?: string | null,
): WorkflowReadSummary {
  const base = enrichWorkflowReadSummaryWithSlaState(
    mapWorkflowRequestToReadSummary(docId, request),
  );

  return {
    ...base,
    areaLabel: areaLabel?.trim() || base.areaId,
  };
}
```

### Pattern 2: tipos canonicos de `stepsHistory`

```ts
export type WorkflowRequestStepEvent = {
  action: HistoryAction;
  label: string;
  timestamp: TimestampLike;
  userId: string;
  userName: string;
};

export type WorkflowRequestStepActionResponse = {
  actionRequestId: string;
  recipientUserId: string;
  status: WorkflowActionRequestStatus;
  respondedAt: TimestampLike;
  respondedByUserId: string | null;
  respondedByName: string | null;
  responseComment?: string;
  responseAttachmentUrl?: string;
};

export type WorkflowRequestStepHistoryItem = {
  stepId: string;
  stepName: string;
  kind: StepKind;
  order: number;
  state: StepState;
  isCurrent: boolean;
  events: WorkflowRequestStepEvent[];
  actionResponses: WorkflowRequestStepActionResponse[];
};
```

### Pattern 3: `stepsHistory` derivado sem heuristica

```ts
function mapHistoryEntryToStepEvent(entry: HistoryEntry): WorkflowRequestStepEvent {
  return {
    action: entry.action,
    label: TIMELINE_LABELS[entry.action] ?? entry.action,
    timestamp: entry.timestamp,
    userId: entry.userId,
    userName: entry.userName,
  };
}

function mapActionRequestToStepResponse(
  entry: WorkflowActionRequest,
  actorUserId: string,
  request: WorkflowRequestV2,
): WorkflowRequestStepActionResponse {
  const canSeeResponseAttachment =
    actorUserId === request.ownerUserId ||
    (request.responsibleUserId != null && actorUserId === request.responsibleUserId);

  return {
    actionRequestId: entry.actionRequestId,
    recipientUserId: entry.recipientUserId,
    status: entry.status,
    respondedAt: entry.respondedAt ?? null,
    respondedByUserId: entry.respondedByUserId ?? null,
    respondedByName: entry.respondedByName ?? null,
    ...(typeof entry.responseComment === 'string' && entry.responseComment.trim() !== ''
      ? { responseComment: entry.responseComment }
      : {}),
    ...(canSeeResponseAttachment &&
    typeof entry.responseAttachment?.fileUrl === 'string' &&
    entry.responseAttachment.fileUrl.trim() !== ''
      ? { responseAttachmentUrl: entry.responseAttachment.fileUrl }
      : {}),
  };
}

function buildDetailStepsHistory(
  request: WorkflowRequestV2,
  progressItems: WorkflowRequestProgressItem[],
  actorUserId: string,
): WorkflowRequestStepHistoryItem[] {
  return progressItems.map((item) => ({
    stepId: item.stepId,
    stepName: item.stepName,
    kind: item.kind,
    order: item.order,
    state: item.state,
    isCurrent: item.isCurrent,
    events: (request.history ?? [])
      .filter((entry) => entry.details?.stepId === item.stepId)
      .map(mapHistoryEntryToStepEvent),
    actionResponses: (request.actionRequests ?? [])
      .filter((entry) => entry.stepId === item.stepId)
      .map((entry) => mapActionRequestToStepResponse(entry, actorUserId, request)),
  }));
}

function buildWorkflowRequestDetail(input: WorkflowRequestDetailBuildInput): WorkflowRequestDetailData {
  const progress = buildDetailProgress(input.request, input.version);

  return {
    summary: buildDetailSummary(input.docId, input.request, input.areaLabel),
    // ...
    progress,
    // ...
    stepsHistory: buildDetailStepsHistory(input.request, progress.items, input.actorUserId),
  };
}
```

### Pattern 4: tipos espelho do management com variantes `Date`

Os tres tipos abaixo devem ser adicionados a `src/lib/workflows/management/types.ts`. Sao identicos aos tipos de `read/types.ts` (Pattern 2), substituindo `TimestampLike` por `Date | null`.

```ts
export type WorkflowManagementRequestStepEvent = {
  action: WorkflowManagementRequestTimelineItem['action'];
  label: string;
  timestamp: Date | null;
  userId: string;
  userName: string;
};

export type WorkflowManagementRequestStepActionResponse = {
  actionRequestId: string;
  recipientUserId: string;
  status: WorkflowManagementRequestActionRecipient['status'];
  respondedAt: Date | null;
  respondedByUserId: string | null;
  respondedByName: string | null;
  responseComment?: string;
  responseAttachmentUrl?: string;
};

export type WorkflowManagementRequestStepHistoryItem = {
  stepId: string;
  stepName: string;
  kind: WorkflowManagementRequestProgressItem['kind'];
  order: number;
  state: WorkflowManagementRequestProgressItem['state'];
  isCurrent: boolean;
  events: WorkflowManagementRequestStepEvent[];
  actionResponses: WorkflowManagementRequestStepActionResponse[];
};
```

`WorkflowManagementRequestSummary` em `management/types.ts` deve receber `areaLabel?: string`:

```ts
// adicionar ao tipo existente WorkflowManagementRequestSummary
areaLabel?: string;
```

`WorkflowManagementRequestDetailData` em `management/types.ts` deve receber `stepsHistory`:

```ts
// adicionar ao tipo existente WorkflowManagementRequestDetailData
stepsHistory?: WorkflowManagementRequestStepHistoryItem[];
```

### Pattern 5: normalizacao do summary com `areaLabel`

```ts
function normalizeRequestSummary(input: unknown): WorkflowManagementRequestSummary {
  const item = isObject(input) ? input : {};

  return {
    // ...campos existentes
    areaId: asString(item.areaId),
    ...(typeof item.areaLabel === 'string' && item.areaLabel.trim() !== ''
      ? { areaLabel: item.areaLabel }
      : {}),
    // ...demais campos existentes
  };
}
```

### Pattern 6: extensao de `normalizeRequestDetailData` para `stepsHistory`

```ts
function normalizeRequestDetailData(input: unknown): WorkflowManagementRequestDetailData {
  const data = isObject(input) ? input : {};
  // ...desestruturacao existente (formData, progress) preservada sem alteracao...

  return {
    // ...todos os campos existentes preservados sem alteracao...
    stepsHistory: Array.isArray(data.stepsHistory)
      ? data.stepsHistory.map(normalizeStepHistoryItem)
      : undefined,
  };
}
```

### Pattern 7: normalizacao espelhada com datas aninhadas opcionais

> **Nota de implementacao (F3):** `normalizeHistoryAction`, `normalizeActionRequestStatus`, `normalizeStepKind` e `normalizeStepState` devem ser extraidos como helpers compartilhados de `normalizeTimelineItem`, `normalizeActionDetail` e `normalizeProgressItem` respectivamente — nao duplicados. Ao criar esses helpers, atualizar as funcoes existentes para usa-los.

```ts
function normalizeStepHistoryEvent(input: unknown): WorkflowManagementRequestStepEvent {
  const item = isObject(input) ? input : {};

  return {
    action: normalizeHistoryAction(item.action),
    label: asString(item.label),
    timestamp: normalizeTimestamp(item.timestamp),
    userId: asString(item.userId),
    userName: asString(item.userName),
  };
}

function normalizeStepHistoryActionResponse(
  input: unknown,
): WorkflowManagementRequestStepActionResponse {
  const item = isObject(input) ? input : {};

  return {
    actionRequestId: asString(item.actionRequestId),
    recipientUserId: asString(item.recipientUserId),
    status: normalizeActionRequestStatus(item.status),
    respondedAt: normalizeTimestamp(item.respondedAt),
    respondedByUserId: asNullableString(item.respondedByUserId),
    respondedByName: asNullableString(item.respondedByName),
    ...(typeof item.responseComment === 'string' && item.responseComment.trim() !== ''
      ? { responseComment: item.responseComment }
      : {}),
    ...(typeof item.responseAttachmentUrl === 'string' && item.responseAttachmentUrl.trim() !== ''
      ? { responseAttachmentUrl: item.responseAttachmentUrl }
      : {}),
  };
}

function normalizeStepHistoryItem(input: unknown): WorkflowManagementRequestStepHistoryItem {
  const item = isObject(input) ? input : {};

  return {
    stepId: asString(item.stepId),
    stepName: asString(item.stepName),
    kind: normalizeStepKind(item.kind),
    order: asNumber(item.order),
    state: normalizeStepState(item.state),
    isCurrent: asBoolean(item.isCurrent),
    events: Array.isArray(item.events) ? item.events.map(normalizeStepHistoryEvent) : [],
    actionResponses: Array.isArray(item.actionResponses)
      ? item.actionResponses.map(normalizeStepHistoryActionResponse)
      : [],
  };
}
```

## 6. API Contract

### `GET /api/workflows/read/requests/{requestId}` (sem mudanca de endpoint)

```http
GET /api/workflows/read/requests/812
Authorization: Bearer {token}
```

### Response (Success)

```json
{
  "ok": true,
  "data": {
    "summary": {
      "requestId": 812,
      "areaId": "facilities",
      "areaLabel": "Facilities"
    },
    "permissions": {
      "canAdvance": true
    },
    "progress": {
      "items": []
    },
    "action": {
      "available": true
    },
    "timeline": [],
    "stepsHistory": [
      {
        "stepId": "execucao",
        "stepName": "Execucao",
        "kind": "work",
        "order": 3,
        "state": "active",
        "isCurrent": true,
        "events": [],
        "actionResponses": []
      }
    ]
  }
}
```

### Contract Notes

- `summary.areaLabel` e opcional no tipo, mas quando preenchido pelo read-side nunca deve ser `undefined`; o fallback e `areaId`.
- `stepsHistory` e opcional no tipo durante a transicao, mas quando preenchido deve conter todas as etapas publicadas em `stepOrder`.
- `events[]` usa o mesmo shape semantico do `timeline`, sem o campo `details`.
- `actionResponses[]` expõe `responseAttachmentUrl` apenas sob a mesma regra atual de owner/responsavel.
- `timeline` continua retornando todos os eventos legados, inclusive os sem `stepId`.
- `buildAdminWorkflowRequestDetail()` permanece fora desta fase por decisao explicita de rollout e nao precisa expor `areaLabel` ou `stepsHistory` nesta rodada.

## 7. Database Schema

Nenhuma mudanca no schema.

Leituras adicionais:

- `workflowAreas/{areaId}` para resolver `summary.areaLabel`.

Colecoes preservadas:

- `workflows_v2`
- `workflowTypes_v2/{workflowTypeId}/versions/{version}`
- `workflowAreas`

## 8. Testing Strategy

### Unit Tests

| Component | Test |
|-----------|------|
| `detail.ts` | `summary.areaLabel` usa nome da area quando existir |
| `detail.ts` | `summary.areaLabel` cai para `areaId` quando o documento de area nao existir |
| `detail.ts` | `stepsHistory` inclui todas as etapas de `stepOrder`, inclusive com arrays vazios |
| `detail.ts` | `stepsHistory.events` inclui apenas eventos com `details.stepId` igual ao `stepId` da etapa |
| `detail.ts` | eventos sem `details.stepId` permanecem fora de `stepsHistory` e continuam em `timeline` |
| `detail.ts` | `stepsHistory.actionResponses` respeita a visibilidade atual de `responseAttachmentUrl` |
| `management/api-client.ts` | normaliza `summary.areaLabel`, `events.timestamp` e `actionResponses.respondedAt` para `Date | null` |

### Integration Tests

| Flow | Test |
|------|------|
| detalhe oficial | `GET /api/workflows/read/requests/{id}` continua retornando envelope `{ ok, data }` sem mudar status codes |
| contrato espelhado | `getManagementRequestDetail()` preserva campos legados e aceita os novos campos opcionais |

### Acceptance Tests

```gherkin
GIVEN um chamado com 4 etapas publicadas
AND apenas a etapa atual possui action historica concluida
WHEN o detalhe oficial e carregado
THEN o payload continua contendo progress, action e timeline
AND stepsHistory contem 4 itens na ordem publicada
AND apenas a etapa correspondente recebe actionResponses
AND eventos sem details.stepId nao aparecem em stepsHistory
```

```gherkin
GIVEN um chamado cuja area nao existe mais em workflowAreas
WHEN o detalhe oficial e carregado
THEN summary.areaLabel usa o proprio areaId como fallback
```

## 9. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | remover `stepsHistory` do builder e do espelho de management | detalhe volta a expor apenas o contrato legado |
| 2 | remover lookup de `areaLabel` e manter apenas `areaId` | o modal atual continua funcional como hoje |
| 3 | reverter testes de contrato/normalizacao para o shape anterior | suites voltam ao baseline pre-Fase-1 |

**Metodo rapido:** `git revert <commit-da-fase-1>`

## 10. Implementation Checklist

### Pre-Build

- [x] DEFINE aprovado e com Fase 1 delimitada
- [x] shape canonico de `stepsHistory` confirmado
- [x] restricao de rollout com campos opcionais documentada
- [x] espelho `management` incluido no escopo tecnico
- [x] exclusao explicita de `buildAdminWorkflowRequestDetail()` desta fase documentada

### Post-Build

- [ ] `WorkflowRequestDetailData` enriquecido com campos opcionais
- [ ] `WorkflowManagementRequestDetailData` espelhado com datas normalizadas
- [ ] `progress`, `action` e `timeline` continuam semanticamente identicos
- [ ] `summary.areaLabel` nasce do servidor com fallback estavel
- [ ] `stepsHistory` respeita apenas `details.stepId` / `actionRequests.stepId`
- [ ] testes de read-side e api-client passam

## 11. Specialist Instructions

### For @firebase-specialist

```markdown
Files to modify:
- src/lib/workflows/read/types.ts
- src/lib/workflows/read/detail.ts
- src/lib/workflows/read/queries.ts
- src/lib/workflows/read/__tests__/detail.test.js
- src/lib/workflows/read/__tests__/read-api-contract.test.js

Key requirements:
- nao remover nem remodelar progress/action/timeline;
- resolver areaLabel no servidor com fallback para areaId;
- montar stepsHistory sem heuristica e com arrays vazios quando aplicavel;
- preservar regra atual de visibilidade de anexos de response.
```

### For @react-frontend-developer

```markdown
Files to modify:
- src/lib/workflows/management/types.ts
- src/lib/workflows/management/api-client.ts
- src/lib/workflows/management/__tests__/api-client.test.ts

Key requirements:
- espelhar os novos campos como opcionais;
- converter todos os timestamps novos para Date | null;
- nao alterar RequestDetailDialog nem o view model nesta fase;
- manter compatibilidade total com o payload legado.
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-17 | Codex (`design` skill) | Initial technical design for Fase 1 of the 5-zone management modal redesign, covering server-side areaLabel resolution, grouped stepsHistory contract, management mirror update, tests and rollback strategy. |
| 1.1 | 2026-04-17 | iterate | F1: adicionado Pattern 4 com tipos management mirror explícitos (`WorkflowManagementRequestStepEvent/ActionResponse/HistoryItem`) e adições em `WorkflowManagementRequestSummary` e `WorkflowManagementRequestDetailData`. F2: adicionado Pattern 6 com extensao de `normalizeRequestDetailData` para `stepsHistory`. F3: Pattern 7 com nota de implementacao sobre extracao obrigatoria de helpers compartilhados (`normalizeHistoryAction`, `normalizeActionRequestStatus`, `normalizeStepKind`, `normalizeStepState`); manifesto file #5 atualizado. F4: corrigido `entry.timestamp ?? null` para `entry.timestamp` em Pattern 3. |
