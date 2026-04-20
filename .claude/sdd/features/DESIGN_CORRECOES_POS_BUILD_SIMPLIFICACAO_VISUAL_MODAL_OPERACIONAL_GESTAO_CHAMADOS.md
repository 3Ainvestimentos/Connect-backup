# DESIGN: Correcoes pos-build da simplificacao visual do modal operacional de `gestao-de-chamados`

> Generated: 2026-04-20
> Status: Ready for /build
> Scope: fechamento corretivo da rodada de simplificacao visual, sem reabrir runtime operacional
> Base document: `DEFINE_CORRECOES_POS_BUILD_SIMPLIFICACAO_VISUAL_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`
> Parent design: `DESIGN_SIMPLIFICACAO_VISUAL_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`

## 1. Objetivo

Corrigir a rodada de simplificacao visual ja entregue no modal operacional de `/gestao-de-chamados`, fechando de forma implementavel dois desvios reais:

- a copy de `Solicitar action` usa `action.recipients` para prometer destinatarios antes da abertura do batch, embora esse array represente apenas recipients de batch ja existente;
- os fallbacks de identidade colapsam usuarios distintos em `Colaborador configurado`, ocultando quem esta realmente pendente quando o nome amigavel nao e resolvido.

Esta microetapa cobre:

- enrich aditivo no detalhe oficial para separar `destinatarios configurados da etapa` de `recipients do batch atual`;
- helper unico de identidade para preservar nome humano quando existir e `recipientUserId` quando nao existir nome;
- atualizacao focal de `request-detail-view-model.ts`, `RequestActionCard.tsx` e suites de teste;
- manutencao integral dos gates atuais de `canRequestAction`, `canRespondAction`, `canAdvance`, `canFinalize`, atribuicao e arquivamento.

Observacao de escopo:

- o DEFINE desta microetapa admite duas saidas validas para corrigir o bug pre-request: copy generica correta no frontend ou enrich aditivo no read-side;
- este DESIGN escolhe explicitamente a trilha estrutural completa com `configuredRecipients`, por reduzir drift futuro e fechar a semantica do contrato na origem.

Esta microetapa nao cobre:

- mudanca de runtime em `requestAction`, `respondAction`, `advance` ou `finalize`;
- nova busca remota de colaboradores no backend ou novo endpoint para resolver nomes;
- redesign adicional do modal fora da fidelidade da action;
- alteracoes de authz, roles ou ampliacao de leitura para fora do detalhe oficial.

---

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_CORRECOES_POS_BUILD_SIMPLIFICACAO_VISUAL_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/features/DEFINE_CORRECOES_POS_BUILD_SIMPLIFICACAO_VISUAL_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md)
- [DESIGN_SIMPLIFICACAO_VISUAL_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/features/DESIGN_SIMPLIFICACAO_VISUAL_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md)
- [detail.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/detail.ts)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/types.ts)
- [action-helpers.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/action-helpers.ts)
- [request-detail-view-model.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/request-detail-view-model.ts)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/types.ts)
- [api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/api-client.ts)
- [RequestActionCard.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestActionCard.tsx)
- [RequestDetailDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestDetailDialog.tsx)
- [request-detail-view-model.test.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/__tests__/request-detail-view-model.test.ts)
- [RequestActionCard.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/RequestActionCard.test.tsx)
- [RequestDetailDialog.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx)
- [detail.test.js](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/__tests__/detail.test.js)

Em caso de divergencia:

1. prevalece o DEFINE desta microetapa para escopo, aceite e limites;
2. depois prevalece o design pai da simplificacao visual para arquitetura macro do modal;
3. depois prevalece o contrato real hoje implementado no repositorio;
4. depois prevalece este design para orientar o build corretivo.

---

## 3. Estado Atual e Gaps Reais

### 3.1. O que o codigo faz hoje

- `buildDetailAction()` em `src/lib/workflows/read/detail.ts` ja chama `describeCurrentStepAction(version, request)`, mas devolve apenas:
  - metadados da action;
  - `recipients` do batch exibido;
  - nenhum campo proprio para destinatarios configurados antes do batch.
- `buildRequestTargetRecipients()` em `src/lib/workflows/management/request-detail-view-model.ts` deriva a copy pre-request a partir de `detail.action.recipients`.
- no estado `canRequestAction`, `action.recipients` normalmente esta vazio porque ainda nao existe batch aberto.
- `resolveFriendlyCollaboratorLabel()` no view-model retorna `Colaborador configurado` quando nao resolve nome localmente.
- `resolveRecipientLabel()` em `RequestActionCard.tsx` repete a mesma estrategia e tambem cai em `Colaborador configurado`.
- a deduplicacao de pendencias com terceiros usa `new Set(labels)`, portanto dois `recipientUserId` distintos podem colapsar se ambos virarem o mesmo label generico.

### 3.2. Lacunas objetivas em relacao ao DEFINE aprovado

- o detalhe oficial nao distingue `configuredRecipients` de `recipients`;
- a copy de `Solicitar action` pode parecer correta em fixture enriquecida artificialmente, mas nao e fiel ao payload real pre-batch;
- o fallback atual esconde `recipientUserId` valido quando o colaborador nao e resolvido no cliente;
- o resumo read-only de action pendente com terceiros pode condensar usuarios distintos em uma unica identidade generica;
- a logica de labels esta duplicada entre view-model e componente, sem helper unico e sem testes diretos de identidade.

### 3.3. Limites nao negociaveis desta microetapa

- `GET /api/workflows/read/requests/{requestId}` continua sendo a unica fonte de verdade da superficie;
- nenhum endpoint novo sera criado;
- `requestAction` continua podendo abrir batch apenas quando o contrato atual permitir;
- `action.recipients` continua significando recipients do batch exibido, nao configuracao da etapa;
- o frontend nao pode inferir permissao nova nem reabrir CTAs fora de `detail.permissions`;
- o enrich corretivo deve ser aditivo e compativel: consumidores antigos podem ignorar o novo campo sem quebrar.

---

## 4. Arquitetura da Solucao

### 4.1. Diagrama arquitetural

```text
operator in /gestao-de-chamados
  |
  +--> GET /api/workflows/read/requests/{requestId}
          |
          +--> buildWorkflowRequestDetail()
                  |
                  +--> buildDetailAction()
                          |
                          +--> describeCurrentStepAction(version, request)
                          |      \--> approverIds da etapa atual
                          |
                          +--> getDisplayActionBatchEntriesForCurrentStep(request)
                          |      \--> recipients do batch pendente/encerrado
                          |
                          \--> action detail final
                                 |- recipients
                                 \- configuredRecipients   (novo; pre-batch)
  |
  +--> management api client
          \--> normaliza action.recipients + action.configuredRecipients
  |
  +--> buildRequestDetailShellViewModel(detail, collaborators)
          |
          +--> resolveOperationalIdentity(...)            (novo helper unico)
          +--> buildConfiguredRecipientLabels(...)
          \--> informationalState / requestTargetRecipients
  |
  \--> RequestDetailDialog
          |
          +--> RequestOperationalHero
          \--> RequestActionCard
                 |- mostra copy nominal quando configuredRecipients existir
                 |- mostra copy generica quando nao existir
                 \- preserva recipientUserId quando nome amigavel nao existir
```

### 4.2. Fluxo fechado por camada

```text
LAYER 1 - Read-side oficial
1. detail.ts continua sendo a origem do shape do detalhe.
2. buildDetailAction() passa a incluir `configuredRecipients` apenas quando a
   action estiver disponivel e sem `configurationError`.
3. `recipients` permanece reservado ao batch atual ou ao ultimo batch exibido.

LAYER 2 - Contrato tipado
4. read/types.ts e management/types.ts passam a tipar `configuredRecipients`.
5. api-client.ts passa a normalizar o novo campo sem alterar `recipients`.
6. O delta e apenas aditivo; nenhum campo existente muda de semantica.

LAYER 3 - Derivacao de apresentacao
7. request-detail-view-model.ts deixa de usar `action.recipients` para copy de
   `canRequestAction`.
8. O view-model passa a consumir `action.configuredRecipients`.
9. Se o novo campo vier vazio por compatibilidade, a copy cai para modo generico.

LAYER 4 - Resolucao de identidade
10. Um helper unico retorna:
    - `identityKey`: id estavel para deduplicacao
    - `displayLabel`: nome amigavel, ou userId, ou label generico final
11. Pendencias com terceiros passam a deduplicar por `identityKey`, nunca por
    label final renderizado.
12. RequestActionCard reaproveita o mesmo helper para recipients do batch.

LAYER 5 - Garantia de nao regressao
13. Nenhuma decisao de gate muda.
14. Testes passam a cobrir:
    - pre-request com recipients do batch vazios
    - fallback para userId
    - ausencia de colapso de identidades distintas
```

### 4.3. Shape fechado para o detalhe da action

Nao ha novo schema persistido em Firestore. O delta e no contrato read-side/management do detalhe.

Shape alvo:

```ts
type WorkflowRequestConfiguredRecipient = {
  recipientUserId: string;
};

type WorkflowRequestActionDetail = {
  available: boolean;
  state: 'idle' | 'pending' | 'completed';
  batchId: string | null;
  type: 'approval' | 'acknowledgement' | 'execution' | null;
  label: string | null;
  commentRequired: boolean;
  attachmentRequired: boolean;
  commentPlaceholder: string | null;
  attachmentPlaceholder: string | null;
  canRequest: boolean;
  canRespond: boolean;
  requestedAt: TimestampLike;
  completedAt: TimestampLike;
  requestedByUserId: string | null;
  requestedByName: string | null;
  recipients: WorkflowRequestActionRecipientDetail[];
  configuredRecipients: WorkflowRequestConfiguredRecipient[];
  configurationError?: string | null;
};
```

Semantica fechada:

| Campo | Semantica |
|-------|-----------|
| `recipients` | recipients do batch pendente ou do ultimo batch exibido para a etapa atual |
| `configuredRecipients` | destinatarios configurados estruturalmente na etapa atual, independentes da existencia de batch |
| `requestedBy*`, `requestedAt`, `completedAt` | continuam vinculados ao batch exibido |
| `canRequest` | permanece regido por `permissions.canRequestAction` |

Regras:

- `configuredRecipients` deve refletir `approverIds` da etapa atual, na ordem configurada, apenas quando a action estiver valida;
- `configuredRecipients` nao depende de historico;
- `configuredRecipients` pode coexistir com `recipients` vazios em `state = 'idle'`;
- se a action nao estiver disponivel, `configuredRecipients` deve ser `[]`;
- se a configuracao da etapa estiver invalida, `configuredRecipients` tambem fica `[]` e a UI continua apoiada em `configurationError` ou copy generica.

---

## 5. Architecture Decisions

### ADR-SIMP-FIX-001: o read-side passa a expor `configuredRecipients` explicitamente

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-20 |
| **Context** | O frontend hoje infere destinatarios pre-batch a partir de `action.recipients`, mas esse array pertence ao batch e nao a configuracao estrutural da etapa. |

**Choice:** adicionar `action.configuredRecipients` no detalhe oficial, derivado de `describeCurrentStepAction(version, request).approverIds` apenas quando a configuracao da action estiver valida, preservando `action.recipients` com a semantica atual de batch.

**Rationale:**
1. fecha o bug na origem contratual, nao apenas na copy;
2. evita inferencia local a partir de historico ou fixtures;
3. aproveita dados ja disponiveis no read-side sem abrir endpoint novo.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| Manter apenas copy generica no frontend | corrige o bug imediato e continua aderente ao DEFINE, mas foi descartada nesta microetapa porque manteria a semantica pre-request implicita e sujeita a drift futuro |
| Reusar `action.recipients` para batch e pre-batch | mistura duas semanticas diferentes no mesmo campo e perpetua o drift |
| Resolver nomes no backend nesta rodada | ampliaria escopo e dependencias sem necessidade para o fix funcional |

**Consequences:**

- Positivo: o modal passa a distinguir claramente configuracao da etapa e batch atual.
- Negativo: read/types, management/types, api-client e fixtures precisam refletir o campo aditivo.

### ADR-SIMP-FIX-002: a identidade operacional vira helper unico com fallback visivel para userId

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-20 |
| **Context** | View-model e card repetem regras de nome/fallback e ambos escondem `recipientUserId` valido atras de `Colaborador configurado`. |

**Choice:** extrair helper local de management que receba `userId`, `fallbackName` e `collaborators`, devolvendo `identityKey` e `displayLabel`.

**Rationale:**
1. garante a preferencia por nome humano quando existir;
2. preserva `recipientUserId` visivel quando nome amigavel nao existir;
3. permite deduplicacao por chave estavel em vez de por label final.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| Manter funcoes separadas em view-model e componente | repete bug e dificulta blindagem por testes |
| Mostrar sempre `Colaborador configurado` quando nao resolver nome | viola o MUST M3 e impede identificar quem esta pendente |
| Mostrar sempre id cru mesmo com nome disponivel | viola o MUST M5 e piora UX |

**Consequences:**

- Positivo: a mesma regra governa summary read-only, card da action e lista pre-request.
- Negativo: entra um helper novo e mais uma suite unitaria focada em identidade.

### ADR-SIMP-FIX-003: o build corretivo permanece permission-neutral e additive-first

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-20 |
| **Context** | O problema atual e de fidelidade de contrato/copy/fallback, nao de elegibilidade operacional. |

**Choice:** limitar a correcao a enrich read-side, normalizacao de contrato, derivacao de apresentacao e testes, sem tocar em `buildDetailPermissions()`, `requestAction`, `respondAction` ou handlers do dialog.

**Rationale:**
1. reduz risco de regressao funcional;
2. mantem a microetapa alinhada ao DEFINE;
3. torna o rollback simples porque nao ha mudanca persistida nem mutacional.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| Reabrir as regras de `canRequestAction` e `canRespondAction` | fora de escopo e alto risco |
| Empurrar toda a correcao para UI local sem contrato novo | resolve parcialmente e deixa a semantica fragil |

**Consequences:**

- Positivo: mudanca pequena, isolada e verificavel.
- Negativo: o backend nao entrega nome amigavel pronto; o frontend continua dependendo de `collaborators` para humanizar labels.

---

## 6. Contratos Tecnicos Fechados

### 6.1. Delta oficial do `GET /api/workflows/read/requests/{requestId}`

Bloco `action` apos a correcao:

```ts
{
  available: true,
  state: 'idle' | 'pending' | 'completed',
  batchId: string | null,
  type: 'approval' | 'acknowledgement' | 'execution' | null,
  label: string | null,
  commentRequired: boolean,
  attachmentRequired: boolean,
  commentPlaceholder: string | null,
  attachmentPlaceholder: string | null,
  canRequest: boolean,
  canRespond: boolean,
  requestedAt: TimestampLike,
  completedAt: TimestampLike,
  requestedByUserId: string | null,
  requestedByName: string | null,
  recipients: [
    {
      actionRequestId: string,
      recipientUserId: string,
      status: 'pending' | 'approved' | 'rejected' | 'acknowledged' | 'executed',
      respondedAt: TimestampLike,
      respondedByUserId: string | null,
      respondedByName: string | null,
      responseComment?: string,
      responseAttachmentUrl?: string,
    }
  ],
  configuredRecipients: [
    {
      recipientUserId: string,
    }
  ],
  configurationError: string | null,
}
```

Implementacao fechada no read-side:

1. chamar `describeCurrentStepAction(version, request)` uma unica vez dentro de `buildDetailAction()`;
2. se `actionDescription.available === false`, retornar `configuredRecipients: []`;
3. se `actionDescription.available === true` e `actionDescription.configurationError === null`, mapear `actionDescription.approverIds` para `configuredRecipients`;
4. se `actionDescription.configurationError !== null`, retornar `configuredRecipients: []`;
5. manter `recipients` vindo apenas de `buildActionRecipients(batchEntries, actorUserId, request)`.

### 6.2. Contrato do helper de identidade

Novo helper recomendado em `src/lib/workflows/management/request-identity.ts`:

```ts
type OperationalIdentity = {
  identityKey: string;
  displayLabel: string;
};
```

Regras obrigatorias:

1. se `fallbackName` nao vazio existir, ele vira `displayLabel`;
2. senao, se `collaborators` resolver `userId`, usar o nome do colaborador;
3. senao, se `userId` existir, usar o proprio `userId` como `displayLabel`;
4. somente quando nao houver nome nem `userId`, cair para `Colaborador configurado`;
5. `identityKey` deve priorizar `userId`; na ausencia dele, usar `fallbackName`; no ultimo caso, usar um sentinel fixo.

Consequencia direta:

- deduplicacao de pendencias e de recipients configurados passa a usar `identityKey`;
- renderizacao final continua usando `displayLabel`.

### 6.3. Regras de copy fechadas

Para `canRequestAction`:

- se houver `configuredRecipients` e pelo menos um label resolvido, usar copy nominal:
  - `A solicitacao desta etapa sera enviada para X.`
- se `configuredRecipients` vier vazio, usar copy generica:
  - `A etapa {currentStepName} permite abrir uma action operacional oficial para os destinatarios configurados da etapa.`

Para pendencia com terceiros:

- `informationalState.value` deve listar `displayLabel` deduplicado por `identityKey`;
- se dois usuarios distintos nao resolverem nome, o resultado deve manter dois ids distintos, nao um unico label generico.

Para o card:

- recipients do batch usam o mesmo helper;
- `requestedByName` e `respondedByName` continuam tendo precedencia sobre `requestedByUserId` / `respondedByUserId`;
- `recipientUserId` aparece apenas quando nao houver nome humano correspondente.

---

## 7. Manifesto de Arquivos

### 7.1. Ordem de execucao recomendada

| Phase | Files | Agent |
|-------|-------|-------|
| 1. Read-side contract | `src/lib/workflows/read/types.ts`, `src/lib/workflows/read/detail.ts` | @firebase-specialist |
| 2. Management contract | `src/lib/workflows/management/types.ts`, `src/lib/workflows/management/api-client.ts`, fixtures | @react-frontend-developer |
| 3. Presentation logic | `src/lib/workflows/management/request-identity.ts`, `src/lib/workflows/management/request-detail-view-model.ts` | @react-frontend-developer |
| 4. UI surface | `src/components/workflows/management/RequestActionCard.tsx`, `RequestDetailDialog.tsx` | @react-frontend-developer |
| 5. Verification | testes read-side, management e componentes | @react-frontend-developer |

### 7.2. Manifesto detalhado

| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | `src/lib/workflows/read/types.ts` | Modify | adicionar `WorkflowRequestConfiguredRecipient` e `action.configuredRecipients` | @firebase-specialist | - |
| 2 | `src/lib/workflows/read/detail.ts` | Modify | popular `configuredRecipients` a partir de `approverIds` da etapa atual | @firebase-specialist | #1 |
| 3 | `src/lib/workflows/management/types.ts` | Modify | espelhar o novo campo no contrato da gestao | @react-frontend-developer | #1 |
| 4 | `src/lib/workflows/management/api-client.ts` | Modify | normalizar `configuredRecipients` do payload oficial | @react-frontend-developer | #3 |
| 5 | `src/lib/workflows/management/request-identity.ts` | Create | centralizar resolucao de nome humano, userId e dedupe key | @react-frontend-developer | #3 |
| 6 | `src/lib/workflows/management/request-detail-view-model.ts` | Modify | usar `configuredRecipients` no pre-request e helper unico nas pendencias read-only | @react-frontend-developer | #4, #5 |
| 7 | `src/components/workflows/management/RequestActionCard.tsx` | Modify | aplicar helper unico aos recipients do batch e copy de solicitacao | @react-frontend-developer | #5, #6 |
| 8 | `src/components/workflows/management/RequestDetailDialog.tsx` | Minor modify | apenas wiring se props ou copy derivada mudarem | @react-frontend-developer | #6, #7 |
| 9 | `src/lib/workflows/read/__tests__/detail.test.js` | Modify | validar `configuredRecipients` no detalhe oficial e garantir `[]` quando houver `configurationError` | @firebase-specialist | #2 |
| 10 | `src/lib/workflows/management/__tests__/api-client.test.ts` | Modify | validar normalizacao do novo campo | @react-frontend-developer | #4 |
| 11 | `src/lib/workflows/management/__tests__/request-detail-test-data.ts` | Modify | enriquecer fixture com `configuredRecipients` e cenarios de fallback | @react-frontend-developer | #3 |
| 12 | `src/lib/workflows/management/__tests__/request-detail-view-model.test.ts` | Modify | blindar copy generica/nominal e dedupe por identidade | @react-frontend-developer | #6, #11 |
| 13 | `src/lib/workflows/management/__tests__/request-identity.test.ts` | Create | blindar a regra unica de identidade e a chave estavel de deduplicacao | @react-frontend-developer | #5 |
| 14 | `src/components/workflows/management/__tests__/RequestActionCard.test.tsx` | Modify | blindar fallback para `recipientUserId` e nao colapso de labels | @react-frontend-developer | #7, #11, #13 |
| 15 | `src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx` | Optional modify | ajustar asserts do shell se a copy renderizada mudar | @react-frontend-developer | #8, #11 |

### 7.3. Skills e ownership recomendados para o build

- skill `build`: implementacao direta a partir deste design;
- skill `iterate`: somente se o shape de `configuredRecipients` mudar durante o build;
- worker `read-contract`: ownership em `src/lib/workflows/read/**`;
- worker `management-ui`: ownership em `src/lib/workflows/management/**` e `src/components/workflows/management/**`.

---

## 8. Code Patterns Copy-Paste

### 8.1. Enriquecimento de `configuredRecipients` no read-side

```ts
function buildConfiguredRecipients(
  actionDescription: ReturnType<typeof describeCurrentStepAction>,
): WorkflowRequestConfiguredRecipient[] {
  if (!actionDescription.available || actionDescription.configurationError) {
    return [];
  }

  return actionDescription.approverIds.map((recipientUserId) => ({
    recipientUserId,
  }));
}

function buildDetailAction(
  request: WorkflowRequestV2,
  version: WorkflowVersionV2,
  permissions: WorkflowRequestDetailPermissions,
  actorUserId: string,
): WorkflowRequestActionDetail {
  const actionDescription = describeCurrentStepAction(version, request);
  const batchEntries = getDisplayActionBatchEntriesForCurrentStep(request);

  if (!actionDescription.available) {
    return {
      available: false,
      state: 'idle',
      batchId: null,
      type: null,
      label: null,
      commentRequired: false,
      attachmentRequired: false,
      commentPlaceholder: null,
      attachmentPlaceholder: null,
      canRequest: false,
      canRespond: false,
      requestedAt: null,
      completedAt: null,
      requestedByUserId: null,
      requestedByName: null,
      recipients: [],
      configuredRecipients: [],
      configurationError: null,
    };
  }

  return {
    available: true,
    state: batchEntries.some((entry) => entry.status === 'pending')
      ? 'pending'
      : batchEntries.length > 0
        ? 'completed'
        : 'idle',
    batchId: batchEntries[0]?.actionBatchId ?? null,
    type: actionDescription.action.type,
    label: actionDescription.action.label,
    commentRequired: actionDescription.commentRequired,
    attachmentRequired: actionDescription.attachmentRequired,
    commentPlaceholder: actionDescription.commentPlaceholder,
    attachmentPlaceholder: actionDescription.attachmentPlaceholder,
    canRequest: permissions.canRequestAction,
    canRespond: permissions.canRespondAction,
    requestedAt: batchEntries[0]?.requestedAt ?? null,
    completedAt: resolveCompletedAt(batchEntries),
    requestedByUserId: batchEntries[0]?.requestedByUserId ?? null,
    requestedByName: batchEntries[0]?.requestedByName ?? null,
    recipients: buildActionRecipients(batchEntries, actorUserId, request),
    configuredRecipients: buildConfiguredRecipients(actionDescription),
    configurationError: actionDescription.configurationError,
  };
}
```

### 8.2. Helper unico de identidade operacional

```ts
type CollaboratorLike = {
  id3a?: string | null;
  name: string;
};

type OperationalIdentity = {
  identityKey: string;
  displayLabel: string;
};

export function resolveOperationalIdentity(params: {
  collaborators: CollaboratorLike[];
  userId?: string | null;
  fallbackName?: string | null;
}): OperationalIdentity {
  const normalizedFallback = params.fallbackName?.trim() || null;
  const normalizedUserId = params.userId?.trim() || null;

  if (normalizedFallback) {
    return {
      identityKey: normalizedUserId || normalizedFallback,
      displayLabel: normalizedFallback,
    };
  }

  if (normalizedUserId) {
    const collaborator = params.collaborators.find(
      (item) => item.id3a === normalizedUserId,
    );

    if (collaborator?.name.trim()) {
      return {
        identityKey: normalizedUserId,
        displayLabel: collaborator.name.trim(),
      };
    }

    return {
      identityKey: normalizedUserId,
      displayLabel: normalizedUserId,
    };
  }

  return {
    identityKey: 'unknown-configured-collaborator',
    displayLabel: 'Colaborador configurado',
  };
}
```

### 8.3. Derivacao canonica dos labels pre-request

```ts
function buildConfiguredRecipientLabels(
  detail: WorkflowManagementRequestDetailData,
  collaborators: CollaboratorLike[],
): string[] {
  const identities = detail.action.configuredRecipients.map((recipient) =>
    resolveOperationalIdentity({
      collaborators,
      userId: recipient.recipientUserId,
    }),
  );

  const uniqueByKey = new Map<string, string>();
  identities.forEach((identity) => {
    if (!uniqueByKey.has(identity.identityKey)) {
      uniqueByKey.set(identity.identityKey, identity.displayLabel);
    }
  });

  return Array.from(uniqueByKey.values());
}

if (permissions.canRequestAction && action.available && action.canRequest) {
  const configuredRecipients = buildConfiguredRecipientLabels(detail, collaborators);

  return {
    tone: 'request-action',
    title: 'Solicitacao de action disponivel',
    contextLine:
      configuredRecipients.length > 0
        ? `A solicitacao desta etapa sera enviada para ${formatNameList(configuredRecipients)}.`
        : `A etapa ${summary.currentStepName} permite abrir uma action operacional oficial para os destinatarios configurados da etapa.`,
    primaryAction: null,
    requestTargetRecipients: configuredRecipients,
    shouldRenderOperationalSummary: true,
  };
}
```

---

## 9. API Contract

### 9.1. `GET /api/workflows/read/requests/{requestId}` (alteracao aditiva)

Nenhum endpoint novo ou alterado semanticamente. O delta e apenas no corpo do detalhe:

```json
{
  "action": {
    "available": true,
    "state": "idle",
    "batchId": null,
    "type": "approval",
    "label": "Aprovar etapa",
    "canRequest": true,
    "canRespond": false,
    "requestedAt": null,
    "completedAt": null,
    "requestedByUserId": null,
    "requestedByName": null,
    "recipients": [],
    "configuredRecipients": [
      { "recipientUserId": "RESP1" },
      { "recipientUserId": "RESP2" }
    ],
    "configurationError": null
  }
}
```

Compatibilidade:

- consumidores antigos podem ignorar `configuredRecipients`;
- `recipients` continua podendo vir vazio em `state = 'idle'`;
- o meaning de `state`, `batchId` e `completedAt` permanece o do design pai.

### 9.2. Endpoints mutacionais

- `POST /api/workflows/runtime/requests/{id}/request-action`: sem mudanca;
- `POST /api/workflows/runtime/requests/{id}/respond-action`: sem mudanca;
- `POST /api/workflows/runtime/requests/{id}/advance`: sem mudanca;
- `POST /api/workflows/runtime/requests/{id}/finalize`: sem mudanca.

---

## 10. Database Schema

Nenhuma mudanca de schema, colecao, documento, indice ou storage path.

---

## 11. Testing Strategy

### 11.1. Unit tests

| Component | Test |
|-----------|------|
| `src/lib/workflows/read/__tests__/detail.test.js` | `configuredRecipients` e exposto a partir de `approverIds` mesmo sem batch aberto |
| `src/lib/workflows/read/__tests__/detail.test.js` | quando houver `configurationError`, `configuredRecipients` permanece `[]` mesmo com `approverIds` retornados pelo helper |
| `src/lib/workflows/management/__tests__/request-detail-view-model.test.ts` | `canRequestAction` usa `configuredRecipients`, nao `recipients` |
| `src/lib/workflows/management/__tests__/request-detail-view-model.test.ts` | quando `configuredRecipients = []`, a copy fica generica e correta |
| `src/lib/workflows/management/__tests__/request-detail-view-model.test.ts` | duas pendencias com ids distintos e sem nome nao colapsam em um unico label |
| `src/lib/workflows/management/__tests__/request-identity.test.ts` (novo) | helper prioriza `fallbackName`, depois nome de collaborator, depois `userId`, depois label generico |

### 11.2. Integration / component tests

| Flow | Test |
|------|------|
| `api-client` | normaliza `configuredRecipients` do payload oficial |
| `RequestActionCard` | mostra nome amigavel quando houver collaborator |
| `RequestActionCard` | mostra `recipientUserId` quando nao houver nome amigavel |
| `RequestActionCard` | nao exibe `RESP1` cru quando `Fernanda Lima` estiver disponivel |
| `RequestActionCard` | lista dois ids distintos quando ambos nao resolverem nome |
| `RequestDetailDialog` | mantem shell operacional inalterado e apenas atualiza a copy derivada |

### 11.3. Acceptance tests

```gherkin
GIVEN um chamado com action disponivel e sem batch aberto
AND a etapa atual possui approverIds ["RESP1", "RESP2"]
WHEN o detalhe oficial e carregado
THEN action.recipients deve permanecer vazio
AND action.configuredRecipients deve conter RESP1 e RESP2
AND a UI deve informar para quem a solicitacao sera enviada
```

```gherkin
GIVEN uma etapa com action disponivel mas `approverIds` invalidos ou duplicados
WHEN o detalhe oficial e carregado
THEN action.configurationError deve permanecer preenchido
AND action.configuredRecipients deve permanecer vazio
AND a UI deve cair para `configurationError` ou copy generica, sem listar destinatarios inconsistentes
```

```gherkin
GIVEN uma action pendente com dois recipients sem nome amigavel resolvido
WHEN o modal monta o estado read-only
THEN a pendencia deve listar duas identidades distintas
AND o modal nao deve reduzir ambas a "Colaborador configurado"
```

```gherkin
GIVEN uma response de action com requestedByName ou respondedByName preenchido
WHEN o card renderiza o batch
THEN a UI deve preferir o nome humano
AND nao deve expor o id tecnico correspondente
```

---

## 12. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | Reverter o change set do read-side, management e UI deste fix | `configuredRecipients` some do payload e a suite volta ao baseline anterior |
| 2 | Validar que `GET /api/workflows/read/requests/{requestId}` segue respondendo sem erro | smoke manual ou teste de `api-client` |
| 3 | Confirmar que `requestAction`, `respondAction`, `advance` e `finalize` nao foram afetados | reexecutar suite focal do modal operacional |

**Metodo rapido:** `git revert <commit-do-build-corretivo>`

Observacao:

- como o delta e aditivo e nao ha schema persistido novo, o rollback nao exige migracao.

---

## 13. Implementation Checklist

### Pre-Build

- [x] DEFINE document aprovado para /design
- [x] Parent design identificado
- [x] Contrato atual e codigo real inspecionados
- [x] Decisao sobre enrich read-side vs copy generica isolada fechada
- [x] Estrategia de fallback de identidade centralizada

### Post-Build

- [ ] `configuredRecipients` presente em read/types, detail builder, management/types e api-client
- [ ] `configuredRecipients` permanece `[]` quando houver `configurationError` na action atual
- [ ] view-model nao depende mais de `action.recipients` para `canRequestAction`
- [ ] helper de identidade cobre nome, id e generic fallback
- [ ] teste dedicado de `request-identity` criado e verde
- [ ] RequestActionCard preserva `recipientUserId` quando nao houver nome amigavel
- [ ] deduplicacao de terceiros usa chave estavel
- [ ] suite focal do modal operacional executada

---

## 14. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.1 | 2026-04-20 | iterate-agent | Clarified that this design explicitly chooses the structural enrich path allowed by the DEFINE, fixed the `configuredRecipients` rule to stay empty when `configurationError` exists, expanded read-side/testing guidance for invalid action configuration, and added the dedicated `request-identity` test file to the manifest |
| 1.0 | 2026-04-20 | Codex (`design` skill) | Initial corrective design for post-build fixes of the visual simplification of the operational management modal, closing the explicit pre-batch recipient contract and stable identity fallback strategy |
