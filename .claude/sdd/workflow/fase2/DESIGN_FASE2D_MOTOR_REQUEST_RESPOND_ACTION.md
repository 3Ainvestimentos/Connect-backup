# DESIGN: FASE 2D - Motor operacional de `requestAction` / `respondAction`

> Generated: 2026-04-07
> Status: Ready for build
> Scope: Fase 2 / 2D - contrato operacional auditavel de actions no runtime v2 e na tela oficial `/gestao-de-chamados`
> Base document: `DEFINE_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md`

## 1. Objetivo

Entregar o motor operacional de `requestAction` / `respondAction` no runtime v2, fechando de forma implementavel:

- shape persistido de pendencias e respostas dentro de `workflows_v2`;
- regras de autorizacao para abrir e responder action;
- projeção read-side coerente para `waiting_action`;
- extensao do detalhe oficial de `/gestao-de-chamados`;
- contratos HTTP das mutacoes novas;
- estrategia de testes e rollback para liberar os lotes `4` e `5` da `2C`.

Esta etapa cobre:

- abertura transacional de pendencias para todos os `approverIds` da etapa atual;
- resposta auditavel por destinatario para `approval`, `acknowledgement` e `execution`;
- retorno de `waiting_action` para `in_progress` somente quando a ultima pendencia fechar;
- timeline oficial com eventos explicitos de pedido e resposta;
- UI oficial minima para solicitar e responder action sem criar nova superficie.

Esta etapa nao cobre:

- reabertura manual de batches de action;
- quorum, expiracao, escalonamento ou delegacao complexa;
- nova inbox separada da gestao oficial;
- editor administrativo da `2E`;
- reescrita da UX legada de `RequestApprovalModal`.

---

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md)
- [BRAINSTORM_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/BRAINSTORM_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md)
- [ROADMAP_FASE2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase2/ROADMAP_FASE2.md)
- [DESIGN_TECNICO_RUNTIME_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/DESIGN_TECNICO_RUNTIME_WORKFLOWS.md)
- [DESIGN_READ_MODEL_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/DESIGN_READ_MODEL_WORKFLOWS.md)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/types.ts)
- [read-model.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/read-model.ts)
- [repository.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/repository.ts)
- [authz.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/authz.ts)
- [detail.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/detail.ts)
- [queries.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/queries.ts)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/types.ts)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/types.ts)
- [api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/api-client.ts)
- [use-workflow-management.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-workflow-management.ts)
- [RequestDetailDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestDetailDialog.tsx)

Em caso de divergencia:

1. prevalece o `DEFINE_FASE2D_MOTOR_REQUEST_RESPOND_ACTION.md` para escopo, aceite e invariantes;
2. depois prevalecem os contratos canonicos reais do runtime/read-side hoje materializados no codigo;
3. depois prevalecem os documentos tecnicos de runtime/read model da Fase 2;
4. depois prevalece este design para orientar o build.

---

## 3. Estado Atual e Gaps Reais

### 3.1. O que o repositorio ja oferece

- `StatusCategory` ja inclui `waiting_action`;
- `WorkflowRequestV2` ja persiste os helpers denormalizados:
  - `hasPendingActions`
  - `pendingActionRecipientIds`
  - `pendingActionTypes`
  - `operationalParticipantIds`
- `StepDef` ja aceita `action?: StepActionDef`;
- `StepActionDef` ja suporta `approval`, `acknowledgement` e `execution`;
- o read-side ja consegue:
  - montar lista owner em `waiting_action`;
  - montar inbox do destinatario com `pendingActionRecipientIds`;
  - permitir leitura do detalhe para destinatario de action pendente;
- a gestao oficial ja tem:
  - bootstrap oficial;
  - listas;
  - detalhe rico;
  - mutations de `assign`, `finalize` e `archive`;
- o runtime ja tem padrao consistente de:
  - use case server-side;
  - route handler com `authenticateRuntimeActor`;
  - envelope `ok/data`;
  - `updateWorkflowRequestWithHistory(...)`.

### 3.2. O que ainda falta

- nao existe shape persistido para a pendencia operacional em `WorkflowRequestV2`;
- nao existem `request-action.ts` nem `respond-action.ts`;
- nao existem guards de authz para abrir e responder action;
- o read model ainda nao sabe entrar/sair de `waiting_action`;
- o detalhe oficial nao expoe bloco de action nem permissoes de solicitar/responder;
- a timeline oficial nao conhece eventos de action;
- `advance-step` ainda nao protege contra pendencias abertas;
- a infraestrutura atual de upload assinado cobre campos do formulario, mas nao resposta operacional de `execution`.

### 3.3. Constraints estruturais fechadas por este design

- o runtime continua usando o proprio documento `workflows_v2/{docId}` como fonte de verdade operacional;
- nenhuma colecao paralela de pendencias sera criada na `2D`;
- `requestAction` e `respondAction` nao avancam etapa automaticamente;
- a primeira resposta operacional continua acontecendo em `/gestao-de-chamados`;
- a abertura usa os `approverIds` publicados da etapa atual, sem escolha manual de destinatarios.

---

## 4. Decisoes Fechadas da 2D

### 4.1. O write-side passa a persistir `actionRequests` no proprio request

`WorkflowRequestV2` passa a incluir um novo array operacional:

```ts
type WorkflowActionRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'acknowledged'
  | 'executed';

type WorkflowActionResponseAttachment = {
  fileName: string;
  contentType: string;
  fileUrl: string;
  storagePath: string;
  uploadId?: string;
};

type WorkflowActionRequest = {
  actionRequestId: string;
  actionBatchId: string;
  stepId: string;
  stepName: string;
  statusKey: string;
  type: 'approval' | 'acknowledgement' | 'execution';
  label: string;
  recipientUserId: string;
  requestedByUserId: string;
  requestedByName: string;
  requestedAt: Timestamp;
  status: WorkflowActionRequestStatus;
  respondedAt?: Timestamp;
  respondedByUserId?: string;
  respondedByName?: string;
  responseComment?: string;
  responseAttachment?: WorkflowActionResponseAttachment;
};
```

Regras do shape:

- ha `1` item por destinatario, nunca um array de destinatarios dentro da mesma entrada;
- `actionBatchId` agrupa todos os destinatarios abertos por um mesmo `requestAction`;
- `stepId` e `statusKey` congelam a etapa da solicitacao para auditoria e protecao contra drift;
- o campo `status` passa de `pending` para um resultado final unico;
- respostas antigas permanecem no array para auditoria; apenas a linha em `pending` governa o estado vivo.
- `approverIds` duplicados na definicao publicada da etapa sao tratados como configuracao invalida; o runtime nao deduplica silenciosamente.

### 4.2. Duplicacao nao sera silenciosa; a estrategia oficial e rejeicao explicita

Para a `2D`, o sistema aceita no maximo `1` batch pendente por etapa atual.

Politica fechada:

- se a etapa atual ja possuir qualquer `actionRequest.status === 'pending'`, um novo `requestAction` retorna `409 ACTION_REQUEST_ALREADY_OPEN`;
- `respondAction` nao cria novas entradas; apenas fecha a linha pendente do proprio destinatario;
- reabertura manual ou batch paralelo ficam fora da `2D+`.

Esta escolha reduz ambiguidade, simplifica a UI e evita comportamento "idempotente" opaco.

### 4.3. O read model continua denormalizado e derivado de `actionRequests`

Os helpers existentes deixam de ser escrita manual e passam a ser projeção canonica do estado vivo:

- `hasPendingActions = pendingEntries.length > 0`
- `pendingActionRecipientIds = pendingEntries.map((entry) => entry.recipientUserId)`
- `pendingActionTypes = unique(pendingEntries.map((entry) => entry.type))`
- `statusCategory = pendingEntries.length > 0 ? 'waiting_action' : 'in_progress'`

O calculo sempre considera apenas:

- `actionRequests` da `currentStepId`;
- entradas com `status === 'pending'`.

Quando a ultima linha pendente fecha:

- o request volta para `in_progress`;
- `currentStepId`, `currentStepName` e `currentStatusKey` permanecem iguais;
- `responsibleUserId` e `responsibleName` permanecem iguais.

### 4.4. `operationalParticipantIds` passa a incorporar os destinatarios de action

Ao abrir a action:

- todos os `approverIds` entram em `operationalParticipantIds` se ainda nao estiverem presentes;
- o requester nao ganha poder operacional novo por isso;
- a inclusao serve para visibilidade historica e filtros posteriores.

Ao responder:

- nenhum participante e removido;
- o destinatario segue participante operacional mesmo apos fechar a pendencia.

### 4.5. `StepActionDef` recebe suporte futuro para anexo obrigatorio sem abrir escopo da `2E`

`StepActionDef` passa a aceitar:

```ts
type StepActionDef = {
  type: 'approval' | 'acknowledgement' | 'execution';
  label: string;
  approverIds?: string[];
  commentRequired?: boolean;
  attachmentRequired?: boolean;
  commentPlaceholder?: string;
  attachmentPlaceholder?: string;
};
```

Decisao de rollout:

- `attachmentRequired` e opcional e default `false`;
- a `2D` nao altera a UI administrativa atual para editar esse campo;
- o runtime ja o respeita se o documento publicado o trouxer;
- seeds ja publicados continuam validos sem migracao.

### 4.6. A timeline ganha eventos explicitos de action

`HistoryAction` passa a incluir:

- `action_requested`
- `action_approved`
- `action_rejected`
- `action_acknowledged`
- `action_executed`

Padrao de payload em `details`:

- `action_requested`
  - `actionBatchId`
  - `stepId`
  - `stepName`
  - `statusKey`
  - `type`
  - `label`
  - `recipientUserIds`
- eventos de resposta
  - `actionRequestId`
  - `actionBatchId`
  - `stepId`
  - `type`
  - `recipientUserId`
  - `responseCommentPresent`
  - `responseAttachmentPresent`

`approval = rejected` ganha evento proprio na timeline via `action_rejected`, como exigido pelo DEFINE.

### 4.7. O detalhe oficial passa a expor apenas o batch pendente atual da etapa

O bloco de detalhe novo nao vira historico completo paralelo da timeline. Ele mostra apenas o estado vivo da etapa atual:

```ts
type WorkflowRequestActionDetail = {
  available: boolean;
  state: 'idle' | 'pending';
  type: 'approval' | 'acknowledgement' | 'execution' | null;
  label: string | null;
  commentRequired: boolean;
  attachmentRequired: boolean;
  commentPlaceholder: string | null;
  attachmentPlaceholder: string | null;
  canRequest: boolean;
  canRespond: boolean;
  requestedAt: TimestampLike;
  requestedByUserId: string | null;
  requestedByName: string | null;
  recipients: Array<{
    actionRequestId: string;
    recipientUserId: string;
    status: WorkflowActionRequestStatus;
    respondedAt: TimestampLike;
    respondedByUserId: string | null;
    respondedByName: string | null;
    responseComment?: string;
    responseAttachmentUrl?: string;
  }>;
};
```

Escolha fechada:

- quando nao houver batch pendente, `state = 'idle'`;
- respostas antigas continuam visiveis na timeline, nao neste bloco;
- owner e responsavel podem visualizar `responseAttachmentUrl` quando existir em respostas de `execution`, mesmo sem permissao para responder a action;
- a UI usa `CollaboratorsContext` para resolver label amigavel do `recipientUserId` quando disponivel, com fallback para o proprio `id3a`.

### 4.8. A UI oficial mostra CTA de abertura apenas para o responsavel atual

Authz de dominio:

- server-side: `requestAction` aceita owner, responsavel atual ou entrypoint interno controlado;
- UI oficial da `2D`: `canRequestAction` so fica `true` quando o ator autenticado for o responsavel atual, a etapa atual tiver `action` configurada com `approverIds` validos e nao existir batch pendente.
- se a etapa atual tiver `action` mas estiver invalida por `approverIds` ausentes, vazios ou duplicados, o detalhe oficial nao mostra o CTA e exibe estado explicito de configuracao invalida.

Isso preserva o contrato do DEFINE:

- owner observa;
- responsavel conduz a etapa;
- destinatario responde;
- owner ou responsavel so respondem se tambem forem destinatarios explicitamente.

### 4.9. `advance-step` passa a bloquear pendencias abertas na etapa atual

Antes de avancar:

- se existir `actionRequest.status === 'pending'` para `currentStepId`, `advanceStep` falha com `INVALID_STEP_TRANSITION`;
- o guard usa o payload operacional real, nao apenas `hasPendingActions`, para evitar dependencia de helper stale.

`finalizeRequest` nao ganha comportamento especial:

- ele continua exigindo `statusCategory === 'in_progress'`;
- por isso a rejeicao de `approval` so pode ser finalizada depois que a ultima pendencia fechar e o request retornar a `in_progress`.

---

## 5. Arquitetura da Solucao

### 5.1. Diagrama arquitetural

```text
WorkflowManagementPage
  |
  +--> useWorkflowManagement
          |
          +--> getManagementRequestDetail()
          +--> requestManagementAction()
          +--> respondManagementAction()
                    |
                    v
        /api/workflows/read/requests/[requestId]
        /api/workflows/runtime/requests/[id]/request-action
        /api/workflows/runtime/requests/[id]/respond-action
                    |
                    v
           authenticateRuntimeActor()
                    |
                    v
         runtime use cases (request-action / respond-action)
                    |
                    +--> authz
                    +--> version lookup
                    +--> read-model projection helpers
                    +--> history builder
                    +--> transactional repository mutation
                    |
                    v
              workflows_v2/{docId}
                |- currentStep*
                |- statusCategory
                |- actionRequests[]
                |- hasPendingActions
                |- pendingActionRecipientIds[]
                |- pendingActionTypes[]
                |- operationalParticipantIds[]
                |- history[]
```

### 5.2. Fluxo de `requestAction`

```text
1. UI oficial abre detalhe do chamado.
2. Se a etapa atual tiver action e o ator for o responsavel atual, o card mostra CTA de solicitar.
3. POST /runtime/requests/{id}/request-action.
4. Route autentica ator e chama use case.
5. Use case carrega request por requestId.
6. Use case valida estado, authz e configuracao da action na versao congelada.
7. Use case rejeita batch pendente duplicado na etapa atual.
8. Use case cria 1 WorkflowActionRequest por approverId.
9. Read-model helper recalcula waiting_action e destinatarios pendentes.
10. Repository persiste update + history na mesma transacao.
11. Queries oficiais sao invalidadas e o detalhe reabre em estado pendente.
```

### 5.3. Fluxo de `respondAction`

```text
1. Destinatario abre o detalhe oficial via lista "Atribuicoes e acoes".
2. O card de action mostra apenas o formulario compativel com o tipo da etapa.
3. POST /runtime/requests/{id}/respond-action.
4. Route autentica ator e chama use case.
5. Use case carrega request por requestId.
6. Use case valida que existe linha pendente da etapa atual para actorUserId.
7. Use case valida payload tipado por action.
8. Use case fecha apenas a linha do destinatario.
9. Read-model helper recalcula:
   - se ainda ha pendencia: waiting_action
   - se nao ha: in_progress
10. Repository persiste update + history na mesma transacao.
11. UI invalida listas e detalhe para refletir quem respondeu e quem ainda falta.
```

### 5.4. Projecao canonica do estado vivo

Helper novo sugerido em `read-model.ts`:

```ts
function projectPendingActionState(params: {
  request: WorkflowRequestV2;
  currentStepId: string;
  now: Timestamp;
}): Record<string, unknown> {
  const pendingEntries = (params.request.actionRequests ?? []).filter(
    (entry) => entry.stepId === params.currentStepId && entry.status === 'pending',
  );

  return {
    hasPendingActions: pendingEntries.length > 0,
    pendingActionRecipientIds: pendingEntries.map((entry) => entry.recipientUserId),
    pendingActionTypes: Array.from(new Set(pendingEntries.map((entry) => entry.type))),
    statusCategory: pendingEntries.length > 0 ? 'waiting_action' : 'in_progress',
    lastUpdatedAt: params.now,
  };
}
```

Helpers derivados:

- `buildRequestActionReadModelUpdate(...)`
- `buildRespondActionReadModelUpdate(...)`

Ambos devem reaproveitar a mesma projeção acima para nao duplicar regra.

---

## 6. Architecture Decision Records

### ADR-2D.1: `actionRequests` fica no documento principal do request

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-07 |
| Context | O read-side e a UI oficial precisam de consistencia transacional com o estado do request sem criar nova colecao operacional. |

**Choice:** persistir `actionRequests[]` no proprio `workflows_v2/{docId}`.

**Consequences:**

- simplifica leitura, authz e timeline da `2D`;
- mantem o mesmo padrao de `history[]` no documento principal;
- se o volume crescer muito, a migracao futura para subcolecao continua possivel porque o contrato externo ficara no read-side, nao no array bruto.

### ADR-2D.2: 1 linha por destinatario e 1 batch pendente por etapa

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-07 |
| Context | Multi-destinatario existe desde o DEFINE, mas a resposta continua individual e autorizada por ator. |

**Choice:** cada destinatario recebe sua propria linha em `actionRequests[]`, agrupada por `actionBatchId`, e a etapa atual aceita no maximo `1` batch pendente.

**Consequences:**

- `respondAction` nao precisa receber `recipientUserId` nem agir em nome de terceiros;
- a UI consegue mostrar parcial de respondidos/faltantes sem heuristica;
- a estrategia de duplicacao fica binaria e auditavel.

### ADR-2D.3: duplicacao aberta retorna erro `409`, nao idempotencia silenciosa

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-07 |
| Context | O DEFINE proibe reabrir ou duplicar a mesma pendencia sem decisao explicita. |

**Choice:** `requestAction` falha com erro explicito quando ja houver pendencia aberta na etapa atual.

**Consequences:**

- reduz ambiguidade operacional;
- evita batches sobrepostos e respostas tardias confusas;
- torna a eventual reabertura futura uma feature propria, nao efeito colateral.

### ADR-2D.4: upload assinado e reutilizado pelo mesmo endpoint oficial

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-07 |
| Context | `execution` pode anexar evidencias, mas a `2D` nao deve introduzir canal paralelo de upload. |

**Choice:** estender `POST /api/workflows/runtime/uploads` para aceitar tambem target de resposta operacional.

**Consequences:**

- o fluxo de assinatura e storage permanece centralizado;
- o frontend oficial usa o mesmo client de upload;
- `execution` com anexo nao precisa reinventar infraestrutura.

---

## 7. Manifesto de Arquivos

### 7.1. Runtime e read-side

| Arquivo | Change | Responsabilidade |
|---------|--------|------------------|
| `src/lib/workflows/runtime/types.ts` | Modify | adicionar `WorkflowActionRequest`, `WorkflowActionResponseAttachment`, `WorkflowActionRequestStatus`; adicionar `actionRequests?: WorkflowActionRequest[]` em `WorkflowRequestV2`; adicionar `attachmentRequired?` em `StepActionDef`; adicionar os 5 novos valores a `HistoryAction` |
| `src/lib/workflows/runtime/read-model.ts` | Modify | criar projeção canonica de pending actions para entrar/sair de `waiting_action` |
| `src/lib/workflows/runtime/errors.ts` | Modify | adicionar os 6 codigos especificos de action ao const `RuntimeErrorCode`; atualizar `httpStatusForCode` para mapear `ACTION_REQUEST_ALREADY_OPEN` e `ACTION_RESPONSE_ALREADY_RECORDED` para `409` e os demais para `400`/`403` conforme semantica |
| `src/lib/workflows/runtime/authz.ts` | Modify | incluir `assertCanRequestAction` e `assertCanRespondAction` |
| `src/lib/workflows/runtime/repository.ts` | Modify | criar `mutateWorkflowRequestAtomically` — ver assinatura canonica em §8.2 |
| `src/lib/workflows/runtime/use-cases/request-action.ts` | Create | abrir batch pendente da etapa atual |
| `src/lib/workflows/runtime/use-cases/respond-action.ts` | Create | fechar linha pendente do destinatario e recalcular estado |
| `src/lib/workflows/runtime/use-cases/advance-step.ts` | Modify | bloquear avanço quando houver action pendente da etapa atual |
| `src/lib/workflows/runtime/use-cases/init-file-upload.ts` | Modify | aceitar target de upload para resposta operacional |
| `src/lib/workflows/read/types.ts` | Modify | expor bloco `action` e novas permissoes no detalhe |
| `src/lib/workflows/read/detail.ts` | Modify | compor bloco `action`, permissoes e labels de timeline |

Co-changes obrigatorios deste bloco:

- `src/lib/workflows/runtime/types.ts` e `src/lib/workflows/read/detail.ts` devem ser alterados no mesmo change set, porque `TIMELINE_LABELS` em `detail.ts` e tipado como `Record<HistoryAction, string>` e quebra compilacao se `HistoryAction` ganhar os novos eventos sem os novos labels;
- `src/lib/workflows/read/types.ts` deve ser atualizado antes ou no mesmo change set de `src/lib/workflows/read/detail.ts`, porque `WorkflowRequestDetailPermissions` e `WorkflowRequestDetailData` passam a carregar `canRequestAction`, `canRespondAction` e `action`.

### 7.2. Rotas HTTP

| Arquivo | Change | Responsabilidade |
|---------|--------|------------------|
| `src/app/api/workflows/runtime/requests/[id]/request-action/route.ts` | Create | contrato oficial para abrir action |
| `src/app/api/workflows/runtime/requests/[id]/respond-action/route.ts` | Create | contrato oficial para responder action |
| `src/app/api/workflows/runtime/uploads/route.ts` | Modify | aceitar novo target de upload quando `execution` anexar evidencias |
| `src/app/api/workflows/read/requests/[requestId]/route.ts` | Modify | devolver detalhe enriquecido com bloco `action` |

### 7.3. Gestao oficial

| Arquivo | Change | Responsabilidade |
|---------|--------|------------------|
| `src/lib/workflows/management/types.ts` | Modify | espelhar novos tipos, permissoes e payloads |
| `src/lib/workflows/management/api-client.ts` | Modify | normalizar detalhe estendido e criar `requestManagementAction` / `respondManagementAction` |
| `src/hooks/use-workflow-management.ts` | Modify | adicionar mutations e invalidacao |
| `src/components/workflows/management/RequestDetailDialog.tsx` | Modify | renderizar card operacional de action |
| `src/components/workflows/management/WorkflowManagementPage.tsx` | Modify | integrar mutations novas com toasts oficiais |
| `src/components/workflows/management/ManagementRequestList.tsx` | Modify | opcional: sinalizar tipo e quantidade de pendencias |

### 7.4. Testes

| Arquivo | Change | Responsabilidade |
|---------|--------|------------------|
| `src/lib/workflows/runtime/__tests__/runtime-use-cases.test.js` | Modify | cobrir request/respond/guards de advance |
| `src/lib/workflows/read/__tests__/detail.test.js` | Modify | validar bloco `action`, permissoes e timeline |
| `src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx` | Modify | validar CTA de solicitar e formulario de resposta |
| `src/lib/workflows/runtime/__tests__/upload-route-contract.test.ts` | Modify | cobrir target de upload operacional |
| `src/lib/workflows/management/__tests__/*` | Modify/Create | normalizacao de API client e mutations novas |

### 7.5. Skills e agentes recomendados para o build

- skill `build`: para executar a implementacao diretamente a partir deste documento;
- skill `iterate`: somente se o escopo mudar durante a entrega;
- worker `runtime`: ownership em `src/lib/workflows/runtime/**` e rotas novas;
- worker `read-ui`: ownership em `src/lib/workflows/read/**`, `src/lib/workflows/management/**`, `src/hooks/**` e componentes oficiais.

---

## 8. Code Patterns Copy-Paste

### 8.1. Route handler padrao

```ts
import { NextResponse } from 'next/server';
import { authenticateRuntimeActor } from '@/lib/workflows/runtime/auth-helpers';
import { RuntimeError } from '@/lib/workflows/runtime/errors';
import { requestAction } from '@/lib/workflows/runtime/use-cases/request-action';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const requestId = Number(id);
    if (!Number.isInteger(requestId) || requestId <= 0) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_FORM_DATA', message: 'ID invalido.' },
        { status: 400 },
      );
    }

    const { actor } = await authenticateRuntimeActor(request);
    const body = await request.json().catch(() => ({}));

    const result = await requestAction({
      requestId,
      actorUserId: actor.actorUserId,
      actorName:
        typeof body.actorName === 'string' && body.actorName.trim() !== ''
          ? body.actorName.trim()
          : actor.actorName,
    });

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    if (error instanceof RuntimeError) {
      return NextResponse.json(
        { ok: false, code: error.code, message: error.message },
        { status: error.httpStatus },
      );
    }

    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
```

### 8.2. Use case padrao com mutacao transacional

```ts
type AtomicWorkflowMutationResult<T> = {
  update: Record<string, unknown>;
  historyEntries: HistoryEntry[];
  result: T;
};

function mutateWorkflowRequestAtomically<T>(
  docId: string,
  mutator: (currentRequest: WorkflowRequestV2, now: Timestamp) => AtomicWorkflowMutationResult<T>,
): Promise<T>;

const requestEntry = await repo.getWorkflowRequestByRequestId(input.requestId);
if (!requestEntry) {
  throw new RuntimeError(RuntimeErrorCode.REQUEST_NOT_FOUND, 'Chamado nao encontrado.', 404);
}

const version = await repo.getWorkflowVersion(
  requestEntry.data.workflowTypeId,
  requestEntry.data.workflowVersion,
);
if (!version) {
  throw new RuntimeError(
    RuntimeErrorCode.PUBLISHED_VERSION_NOT_FOUND,
    'Versao publicada nao encontrada.',
    404,
  );
}

return repo.mutateWorkflowRequestAtomically(requestEntry.docId, (currentRequest, now) => {
  // validar snapshot atual
  // construir actionRequests atualizados
  // projetar helpers de read model
  // retornar update + history + result
});
```

Requisito de implementacao:

- o check de `ACTION_REQUEST_ALREADY_OPEN` deve acontecer dentro do callback transacional, lendo `currentRequest.actionRequests` do snapshot atual, nunca da copia carregada antes da transacao.

### 8.3. Guard de resposta

```ts
function findPendingActionForActor(
  request: WorkflowRequestV2,
  actorUserId: string,
): WorkflowActionRequest | null {
  return (
    request.actionRequests?.find(
      (entry) =>
        entry.stepId === request.currentStepId &&
        entry.recipientUserId === actorUserId &&
        entry.status === 'pending',
    ) ?? null
  );
}
```

---

## 9. API Contract

### 9.1. `POST /api/workflows/runtime/requests/{id}/request-action`

Body:

```json
{
  "actorName": "Nome opcional para auditoria da UI"
}
```

Regras:

- o endpoint resolve o tipo e os destinatarios a partir da etapa atual publicada;
- o body nao aceita `recipientUserIds`;
- o endpoint falha se a etapa atual nao tiver `action`, tiver `approverIds` vazios ou tiver `approverIds` duplicados.

Sucesso:

```json
{
  "ok": true,
  "data": {
    "docId": "firestore-doc-id",
    "requestId": 812,
    "actionBatchId": "act_batch_20260407_001",
    "pendingRecipients": ["RHP2", "RHP7"]
  }
}
```

Erros relevantes:

- `400 ACTION_CONFIGURATION_INVALID`
- `400 INVALID_STEP_TRANSITION`
- `403 FORBIDDEN`
- `404 REQUEST_NOT_FOUND`
- `409 ACTION_REQUEST_ALREADY_OPEN`

### 9.2. `POST /api/workflows/runtime/requests/{id}/respond-action`

Body por tipo:

```ts
type RespondApprovalBody = {
  actorName?: string;
  response: 'approved' | 'rejected';
  comment?: string;
};

type RespondAcknowledgementBody = {
  actorName?: string;
  response: 'acknowledged';
  comment?: string;
};

type RespondExecutionBody = {
  actorName?: string;
  response: 'executed';
  comment?: string;
  attachment?: {
    fileName: string;
    contentType: string;
    fileUrl: string;
    storagePath: string;
    uploadId?: string;
  };
};
```

Escolhas fechadas:

- nao existe `recipientUserId` no payload; o destinatario e o ator autenticado;
- nao existe `actionRequestId` no payload da `2D` porque so pode existir `1` linha pendente da etapa atual para aquele ator;
- `comment` e opcional para todos os tipos, salvo quando `commentRequired === true`;
- `attachment` so e aceito para `execution` e permanece opcional, salvo quando `attachmentRequired === true`.

Sucesso:

```json
{
  "ok": true,
  "data": {
    "docId": "firestore-doc-id",
    "requestId": 812,
    "actionRequestId": "act_req_002",
    "actionBatchId": "act_batch_20260407_001",
    "remainingPendingCount": 1,
    "statusCategory": "waiting_action"
  }
}
```

Erros relevantes:

- `400 ACTION_RESPONSE_INVALID`
- `400 ACTION_REQUEST_NOT_PENDING`
- `403 ACTION_RESPONSE_NOT_ALLOWED`
- `404 REQUEST_NOT_FOUND`
- `409 ACTION_RESPONSE_ALREADY_RECORDED`

### 9.3. `GET /api/workflows/read/requests/{requestId}`

O contrato atual ganha:

```ts
type WorkflowRequestDetailPermissions = {
  canAssign: boolean;
  canFinalize: boolean;
  canArchive: boolean;
  canRequestAction: boolean;
  canRespondAction: boolean;
};

type WorkflowRequestDetailData = {
  summary: WorkflowReadSummary;
  permissions: WorkflowRequestDetailPermissions;
  formData: ...;
  attachments: ...;
  progress: ...;
  action: WorkflowRequestActionDetail;
  timeline: WorkflowRequestTimelineItem[];
};
```

Labels oficiais de timeline:

- `action_requested` -> `Action solicitada`
- `action_approved` -> `Action aprovada`
- `action_rejected` -> `Action rejeitada`
- `action_acknowledged` -> `Action registrada`
- `action_executed` -> `Action executada`

### 9.4. `POST /api/workflows/runtime/uploads`

Contrato novo por discriminador:

```ts
type UploadBody =
  | {
      target: 'form_field';
      workflowTypeId: string;
      fieldId: string;
      fileName: string;
      contentType: string;
    }
  | {
      target: 'action_response';
      requestId: number;
      fileName: string;
      contentType: string;
    };
```

Politica:

- `form_field` preserva o comportamento atual;
- `action_response` valida:
  - request existente;
  - ator autorizado a responder a action atual;
  - etapa atual do tipo `execution`;
- o upload assinado retorna o mesmo shape ja usado hoje.

---

## 10. Testing Strategy

### 10.1. Runtime use cases

Cobrir `requestAction`:

- abre batch para todos os `approverIds` e entra em `waiting_action`;
- falha se `approverIds` estiver vazio;
- falha se `approverIds` tiver ids duplicados;
- falha se ja houver batch pendente na etapa atual;
- falha para outsider;
- inclui destinatarios em `operationalParticipantIds`;
- registra `action_requested` no historico.

Cobrir `respondAction`:

- `approval` com `approved`;
- `approval` com `rejected`;
- `acknowledgement` com `acknowledged`;
- `execution` com comentario opcional;
- `execution` com `commentRequired = true`;
- `execution` com `attachmentRequired = true`;
- mantem `waiting_action` quando ainda houver destinatarios pendentes;
- retorna para `in_progress` ao fechar a ultima linha;
- falha para ator que nao e destinatario pendente;
- falha para resposta duplicada ou tardia.

### 10.2. Runtime guards e rotas

- `advance-step` falha quando existir action pendente;
- `request-action` route retorna `400/403/404/409` corretamente;
- `respond-action` route retorna `400/403/404/409` corretamente;
- upload route aceita `target: 'action_response'` e rejeita tipos invalidos.

### 10.3. Read detail

- o bloco `action` sai em `idle` quando a etapa tem action configurada mas nenhuma pendencia aberta;
- o bloco `action` sai em `pending` com destinatarios e status por linha;
- `canRequestAction` so fica `true` para responsavel atual elegivel com configuracao valida de `approverIds`;
- o detalhe mostra estado explicito de configuracao invalida quando a etapa tiver `action` sem `approverIds` validos;
- `canRespondAction` so fica `true` para destinatario com linha pendente;
- timeline inclui labels novos de action.

### 10.4. Gestao oficial

- `RequestDetailDialog` mostra CTA de solicitar action quando permitido;
- `RequestDetailDialog` mostra formulario correto por tipo de action;
- destinatario ve CTA de resposta e owner nao ve CTA indevido;
- owner e responsavel conseguem visualizar o anexo/upload da resposta de `execution` quando existir;
- toasts de sucesso e erro das novas mutations aparecem corretamente;
- invalidacao de listas e detalhe ocorre apos request/respond;
- lista oficial opcionalmente mostra badge de tipo/contagem sem regredir o comportamento atual.

### 10.5. Matriz minima por papel

| Papel | requestAction | respondAction | leitura detalhe |
|------|---------------|---------------|-----------------|
| Owner | server-side permitido, UI oficial nao exposta por padrao | so se tambem for destinatario | sim |
| Responsavel atual | sim | so se tambem for destinatario | sim |
| Destinatario pendente | nao | sim | sim |
| Requester comum | nao | nao | sim apenas se ja tiver permissao pelo fluxo atual |
| Outsider | nao | nao | nao |

---

## 11. Rollback Plan

### 11.1. Gate operacional principal

O rollback mais seguro continua sendo nao habilitar os lotes `4` e `5` da `2C` ate:

- testes automatizados passarem;
- smoke da gestao oficial validar request/respond nos tres tipos.

### 11.2. Rollback de codigo

Se a `2D` precisar ser revertida:

- remover CTA e mutations novas da gestao oficial;
- remover as rotas `request-action` e `respond-action`;
- preservar os contratos existentes de `assign`, `finalize` e `archive`.

Como `actionRequests` e um campo aditivo, o rollback nao exige migracao de schema para requests sem uso de action.

### 11.3. Rollback de dados

Se houver requests presos em `waiting_action` por regressao:

1. executar script administrativo controlado;
2. localizar `workflows_v2` com `statusCategory = 'waiting_action'`;
3. marcar linhas `pending` da etapa atual como fechadas com motivo tecnico auditavel ou mover o request de volta para `in_progress`;
4. recalcular:
   - `hasPendingActions = false`
   - `pendingActionRecipientIds = []`
   - `pendingActionTypes = []`
   - `statusCategory = 'in_progress'`
5. nunca apagar `history[]`.

O script de rollback nao faz parte do build da `2D`, mas deve ser simples porque o estado vivo esta todo no documento principal.

---

## 12. Sequencia Recomendada de Build

1. Runtime core: tipos, erros, authz, read-model e helper transacional.
   - `types.ts`, `read/types.ts` e `read/detail.ts` entram como co-change quando os novos `HistoryAction` e tipos de detalhe forem adicionados.
   - `errors.ts` precisa incluir o mapeamento HTTP correto de `ACTION_REQUEST_ALREADY_OPEN` e `ACTION_RESPONSE_ALREADY_RECORDED` para `409`, nao apenas os novos codigos no enum/const.
2. Use cases e rotas: `request-action`, `respond-action`, ajuste de upload e guard de `advance-step`.
3. Read detail: bloco `action`, permissoes e timeline.
4. Gestao oficial: api-client, hook, dialog e toasts.
5. Testes automatizados e smoke funcional com um workflow `approval`, um `acknowledgement` e um `execution`.

---

## 13. Resultado Esperado do Build

Ao final da implementacao guiada por este design:

- o runtime v2 passa a suportar actions de ponta a ponta;
- a tela oficial `/gestao-de-chamados` vira a primeira frente oficial de resposta;
- `waiting_action` deixa de ser apenas estado nominal e passa a ser estado operacional auditavel;
- respostas de `execution` podem carregar upload/anexo opcional visivel no detalhe oficial para responsavel e owner;
- os lotes `4` e `5` da `2C` podem seguir para smoke de enablement sem depender de workaround legado.

---

## 14. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.3 | 2026-04-07 | codex | Formalizou a assinatura de `mutateWorkflowRequestAtomically`, registrou co-changes obrigatorios de tipos/timeline e reforcou o mapeamento HTTP `409` em `errors.ts` |
| 1.2 | 2026-04-07 | codex | Fechou validacao de `approverIds` ausentes/duplicados, removeu CTA de `requestAction` em etapa invalida e adicionou cobertura de teste correspondente |
| 1.1 | 2026-04-07 | codex | Alinhado ao DEFINE para explicitar upload opcional em `execution` e visibilidade do anexo no detalhe oficial para responsavel e owner |
| 1.0 | 2026-04-07 | design-agent | Initial technical design for Fase 2D action runtime and management flow |
