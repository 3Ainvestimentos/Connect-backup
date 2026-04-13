# DESIGN: FASE2A_3_DETALHE_RICO

> Generated: 2026-04-01
> Status: Ready for build
> Scope: Fase 2 / 2A.3 - Contrato de detalhe rico e modal oficial do request
> Base document: `DEFINE_FASE2A_3_DETALHE_RICO.md`

## 1. Objetivo

Construir o detalhe rico oficial do request para a tela `/gestao-de-chamados`, sem inflar os contratos de lista e sem reintroduzir leitura manual de Firestore no cliente.

Esta etapa cobre:

- `GET /api/workflows/read/requests/[requestId]` como endpoint dedicado de detalhe;
- composer server-side de `summary`, `permissions`, `formData`, `attachments`, `progress` e `timeline`;
- authz de leitura no servidor para owner, requester, responsavel, destinatario de acao e participante operacional;
- modal oficial responsivo para o namespace `workflows/management/*`;
- componentes oficiais de `formData`, anexos, progresso e timeline;
- invalidacao do detalhe apos `assign`, `finalize` e `archive`, reaproveitando as mutacoes runtime existentes.

Esta etapa nao cobre:

- mudanca no contrato das listas `current`, `assignments` e `completed`;
- leitura direta do cliente em `workflows_v2` ou `workflowTypes_v2`;
- novo endpoint runtime de mutacao;
- redesign do storage de anexos;
- polimento visual final da 2A.4.

### Dependencia de sequencia

A 2A.3 depende da 2A.2 estar concluida. O namespace `src/components/workflows/management/*` e o bootstrap oficial precisam existir antes de o detalhe rico ser integrado. Nao ha caminho de entrega fora de ordem: se a 2A.2 ainda nao estiver materializada no codigo, a implementacao da 2A.3 deve parar e tratar isso como bloqueio.

---

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_FASE2A_3_DETALHE_RICO.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/2A/DEFINE_FASE2A_3_DETALHE_RICO.md)
- [DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md)
- [DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md)
- [REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md)
- [DESIGN_READ_MODEL_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/DESIGN_READ_MODEL_WORKFLOWS.md)
- [RequestDetailsDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/RequestDetailsDialog.tsx)
- [RequestSummaryList.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/RequestSummaryList.tsx)
- [OpenWorkflowCard.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/OpenWorkflowCard.tsx)
- [queries.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/queries.ts)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/types.ts)
- [repository.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/repository.ts)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/types.ts)
- [authz.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/authz.ts)
- [api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/api-client.ts)
- [use-facilities-pilot.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-facilities-pilot.ts)

Em caso de divergencia:

1. prevalece o `DEFINE_FASE2A_3_DETALHE_RICO.md` para escopo e aceite;
2. depois prevalecem os contratos canonicos do runtime e do read-side v2;
3. depois prevalece o `DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md` como desenho macro da 2A;
4. depois prevalece este documento para orientar o build especifico da 2A.3.

---

## 3. Estado Atual e Gaps Reais

### 3.1. O que o codigo ja oferece

- `workflows_v2` ja persiste `formData`, `stepStates` e `history` no `WorkflowRequestV2`;
- o read-side resumido ja expoe `WorkflowReadSummary` para listas leves;
- [repository.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/repository.ts) ja tem `getWorkflowRequestByRequestId()` e `getWorkflowVersion()`;
- o piloto ja validou o padrao de envelope `ok/data` nas rotas `read/*`;
- o cliente do piloto ja tem padrao de normalizacao de timestamps e erro tipado em [api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/api-client.ts);
- o modal legado ja concentra as mutacoes operacionais em um unico dialog.

### 3.2. O que ainda falta

- [RequestDetailsDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/RequestDetailsDialog.tsx) consome apenas `PilotRequestSummary` e nao tem acesso a `formData`, `history` nem `stepStates`;
- [authz.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/authz.ts) ainda nao possui `assertCanReadRequest()`;
- nao existe `src/lib/workflows/read/detail.ts` para compor o payload do modal;
- nao existe `GET /api/workflows/read/requests/[requestId]`;
- nao existe DTO client-safe oficial para detalhe rico em `workflows/management/*`.

### 3.3. Constraint estrutural

O request deve ser renderizado contra a versao publicada congelada no proprio chamado (`workflowVersion` do request), e nao contra `latestPublishedVersion`. Esse ponto e obrigatorio para manter labels, passos e campos coerentes com o momento da abertura.

---

## 4. Decisoes Fechadas da 2A.3

### 4.1. Detalhe rico nasce em endpoint separado

- o modal oficial consome `GET /api/workflows/read/requests/[requestId]`;
- o payload usa o mesmo envelope canonico `ok/data` das demais rotas `read/*`;
- listas continuam retornando apenas `WorkflowReadSummary`;
- nenhum campo de detalhe rico sera copiado para `current`, `assignments` ou `completed`.

### 4.2. Authz de leitura e server-side e explicita

- a permissao minima de leitura e concedida a:
  - owner vigente;
  - requester;
  - responsavel atual;
  - destinatario de acao pendente;
  - participante operacional registrado;
- a validacao vive em `src/lib/workflows/runtime/authz.ts`;
- o frontend nunca decide acesso ao detalhe por heuristica de lista.

### 4.3. O payload do detalhe e composto, nao persistido em schema novo

- `summary` vem do proprio request mapeado para o DTO do read-side;
- `formData` e `attachments` vem de `request.formData` cruzado com `version.fields`;
- `progress` vem de `request.stepStates` + `version.stepOrder` + `version.stepsById`;
- `timeline` vem de `request.history`;
- `permissions` sao calculadas no servidor a partir do request e do ator autenticado.

### 4.4. Labels de campos seguem a versao publicada do request

- o backend usa `version.fields` ordenado por `order`;
- `formData.fields` inclui apenas campos efetivamente submetidos e nao vazios;
- campos `type: 'file'` nao aparecem duplicados em `formData.fields`; eles entram no bloco `attachments`;
- chaves tecnicas internas iniciadas por `_` ficam fora da renderizacao oficial.

### 4.5. Anexos sao derivados de campos `file`, nao de scan cego em URLs

- um anexo oficial so existe quando:
  - o campo esta declarado na versao publicada com `type: 'file'`;
  - o valor correspondente no `formData` e uma string nao vazia;
- isso impede que URLs soltas ou metadados tecnicos virem anexo oficial por acidente;
- campos `file` obrigatorios e opcionais seguem a mesma regra de exposicao.

### 4.6. Timeline e cronologica em ordem crescente

- o contrato retorna `timeline` do evento mais antigo para o mais recente;
- cada item ja sai do backend com `label` pronto para UI;
- a UI pode estilizar destaque visual sem reordenar semanticamente o historico.

### 4.7. O modal oficial continua sendo a superficie de acao

- `permissions` governa a exibicao de `assign`, `finalize` e `archive`;
- a 2A.3 reaproveita os endpoints runtime atuais;
- o detalhe invalida a propria query apos mutacoes para atualizar header, timeline, progresso e permissoes.

---

## 5. Arquitetura da Solucao

### 5.1. Diagrama arquitetural

```text
WorkflowManagementPage / RequestList
  |
  +--> onOpen(requestId)
          |
          v
    useWorkflowManagementDetail(requestId)
          |
          +--> GET /api/workflows/read/requests/[requestId]
                    |
                    v
            authenticateRuntimeActor()
                    |
                    v
            getWorkflowRequestByRequestId(requestId)
                    |
                    +--> getWorkflowVersion(workflowTypeId, workflowVersion)
                    +--> assertCanReadRequest(request, actorUserId)
                    +--> buildRequestDetail(request, version, actorUserId)
                    |
                    v
            {
              summary,
              permissions,
              formData,
              attachments,
              progress,
              timeline
            }
                    |
                    v
          RequestDetailDialog
            +--> RequestHeader
            +--> RequestProgress
            +--> RequestFormData
            +--> RequestAttachments
            +--> RequestTimeline
            +--> runtime actions (assign/finalize/archive)
```

### 5.2. Fluxo por camadas

```text
LAYER 1 (Route / list)
1. A lista continua operando com summary leve.
2. O CTA "Abrir" envia apenas `requestId`.

LAYER 2 (Detail query)
3. O hook oficial habilita a query de detalhe somente quando existe request selecionado.
4. O cache do detalhe e chaveado por usuario autenticado + requestId.

LAYER 3 (Read API)
5. A rota valida token e resolve o ator operacional.
6. A rota busca request e versao congelada do chamado.
7. A rota aplica authz de leitura e monta o payload pronto para o modal.

LAYER 4 (Presentation)
8. O modal renderiza resumo, acoes, progresso, campos, anexos e timeline.
9. O frontend nao faz lookup adicional da versao nem do documento bruto.
```

### 5.3. Estado gerenciado no frontend

| Estado | Armazenamento | Lifecycle |
|-------|---------------|-----------|
| `selectedRequestId` | `useState` local do shell oficial | abre/fecha modal |
| detalhe rico | React Query | carrega sob demanda quando existe `selectedRequestId` |
| loading do detalhe | React Query | exibido dentro do modal |
| erro do detalhe | React Query | exibido em fallback no modal |
| mutacoes operacionais | React Query mutation | invalidam listas e detalhe apos sucesso |

---

## 6. Architecture Decision Records

### ADR-2A.3.1: detalhe rico e composto em `read/detail.ts`

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-01 |
| Context | O request ja persiste os dados brutos necessarios, mas o frontend oficial nao pode fazer composicao manual no cliente. |

**Choice:** criar `src/lib/workflows/read/detail.ts` como composer server-side do payload do modal.

**Consequences:**

- evita duplicacao de composicao em route e cliente;
- mantem o frontend oficial client-safe;
- reduz risco de divergencia entre lista, modal e futuras superfices.

### ADR-2A.3.2: leitura usa `workflowVersion` do request, nunca a ultima versao publicada

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-01 |
| Context | Labels de campo, ordem das etapas e definicoes de anexo precisam refletir o snapshot real do chamado. |

**Choice:** o detalhe sempre chama `getWorkflowVersion(request.workflowTypeId, request.workflowVersion)`.

**Consequences:**

- o modal preserva fidelidade historica;
- evita mismatch quando o tipo recebe nova publicacao;
- qualquer ausencia dessa versao passa a ser tratada como inconsistencia operacional.

### ADR-2A.3.3: anexos oficiais derivam da definicao publicada do campo

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-01 |
| Context | O `formData` pode conter URLs e metadados tecnicos que nao devem virar anexo visual de produto por heuristica. |

**Choice:** somente campos `type: 'file'` da versao publicada podem gerar itens em `attachments`.

**Consequences:**

- o bloco de anexos vira parte canonicamente suportada da UX;
- reduz ruído de chaves tecnicas;
- preserva compatibilidade com uploads obrigatorios e opcionais ja existentes.

---

## 7. File Manifest

### 7.1. Ordem de execucao

| Ordem | Caminho | Acao | Responsabilidade | Skill/Agente sugerido |
|------|---------|------|------------------|-----------------------|
| 1 | [src/lib/workflows/read/types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/types.ts) | Update | Adicionar tipos server-side de detalhe rico | `build` |
| 2 | [src/lib/workflows/read/detail.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/detail.ts) | Create | Composer de `summary`, `permissions`, `formData`, `attachments`, `progress` e `timeline` | `build` |
| 3 | [src/lib/workflows/runtime/authz.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/authz.ts) | Update | Adicionar `assertCanReadRequest()` | `build` |
| 4 | [src/app/api/workflows/read/requests/[requestId]/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/read/requests/[requestId]/route.ts) | Create | Publicar endpoint canonico de detalhe rico | `build` |
| 5 | [src/lib/workflows/management/types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/types.ts) | Create ou Update | DTOs client-safe do detalhe oficial | `build` |
| 6 | [src/lib/workflows/management/api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/api-client.ts) | Create ou Update | Consumir e normalizar `GET /read/requests/[requestId]` | `build` |
| 7 | [src/lib/workflows/management/query-keys.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/query-keys.ts) | Create ou Update | Chave `detail(uid, requestId)` | `build` |
| 8 | [src/hooks/use-workflow-management.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-workflow-management.ts) | Create ou Update | Orquestrar query de detalhe e invalidacao apos mutacoes | `build` |
| 9 | [src/components/workflows/management/RequestDetailDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestDetailDialog.tsx) | Create ou Update | Modal oficial e estados de loading/error | `build` |
| 10 | [src/components/workflows/management/RequestProgress.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestProgress.tsx) | Create | Renderizacao de etapas e status atual | `build` |
| 11 | [src/components/workflows/management/RequestFormData.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestFormData.tsx) | Create | Renderizacao ordenada de campos submetidos | `build` |
| 12 | [src/components/workflows/management/RequestAttachments.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestAttachments.tsx) | Create | Lista oficial de anexos | `build` |
| 13 | [src/components/workflows/management/RequestTimeline.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestTimeline.tsx) | Create | Timeline oficial do request | `build` |
| 14 | [src/lib/workflows/read/__tests__/read-api-contract.test.js](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/__tests__/read-api-contract.test.js) | Update | Cobrir a nova rota e seus envelopes | `build` |
| 15 | [src/lib/workflows/read/__tests__/queries.test.js](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/__tests__/queries.test.js) | Update ou Split | Cobrir helpers do composer de detalhe | `build` |
| 16 | [src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx) | Create | Cobrir render de detalhe rico e acoes coerentes com `permissions` | `build` |

### 7.2. Arquivos que nao devem ser criados

| Arquivo | Razao |
|---------|-------|
| novo endpoint runtime para detalhe | o detalhe pertence ao namespace `read/*`, nao ao runtime |
| cliente com acesso direto a Firestore | viola a fronteira da 2A e reabre o problema do piloto |
| lookup client-side da versao publicada | o backend deve entregar payload pronto para o modal |

---

## 8. Contratos e Patterns

### 8.1. Contrato HTTP

`GET /api/workflows/read/requests/[requestId]`

Response de sucesso:

```json
{
  "ok": true,
  "data": {
    "summary": {
      "docId": "doc-1",
      "requestId": 812,
      "workflowTypeId": "facilities_solicitacao_suprimentos",
      "workflowVersion": 1,
      "workflowName": "Solicitacao de Suprimentos",
      "areaId": "facilities",
      "ownerEmail": "owner@3ariva.com.br",
      "ownerUserId": "SMO2",
      "requesterUserId": "REQ1",
      "requesterName": "Requester",
      "responsibleUserId": "RESP1",
      "responsibleName": "Responsavel",
      "currentStepId": "em_andamento",
      "currentStepName": "Em andamento",
      "currentStatusKey": "em_andamento",
      "statusCategory": "in_progress",
      "hasResponsible": true,
      "hasPendingActions": false,
      "pendingActionRecipientIds": [],
      "pendingActionTypes": [],
      "operationalParticipantIds": [
        "SMO2",
        "RESP1"
      ],
      "slaDays": 5,
      "expectedCompletionAt": {
        "seconds": 1,
        "nanoseconds": 0
      },
      "lastUpdatedAt": {
        "seconds": 1,
        "nanoseconds": 0
      },
      "finalizedAt": null,
      "closedAt": null,
      "archivedAt": null,
      "submittedAt": {
        "seconds": 1,
        "nanoseconds": 0
      },
      "submittedMonthKey": "2026-04",
      "closedMonthKey": null,
      "isArchived": false
    },
    "permissions": {
      "canAssign": false,
      "canFinalize": true,
      "canArchive": false
    },
    "formData": {
      "fields": [
        {
          "fieldId": "nome_sobrenome",
          "label": "Nome e Sobrenome",
          "type": "text",
          "value": "Lucas Nogueira"
        },
        {
          "fieldId": "setor_area",
          "label": "Setor/Area",
          "type": "text",
          "value": "Operacoes"
        }
      ],
      "extraFields": []
    },
    "attachments": [
      {
        "fieldId": "anexo_planilha",
        "label": "Anexo da planilha de suprimentos",
        "url": "https://storage.googleapis.com/example"
      }
    ],
    "progress": {
      "currentStepId": "em_andamento",
      "totalSteps": 4,
      "completedSteps": 2,
      "items": [
        {
          "stepId": "solicitacao_aberta",
          "stepName": "Solicitacao Aberta",
          "statusKey": "solicitacao_aberta",
          "kind": "start",
          "order": 1,
          "state": "completed",
          "isCurrent": false
        },
        {
          "stepId": "em_analise",
          "stepName": "Em analise",
          "statusKey": "em_analise",
          "kind": "work",
          "order": 2,
          "state": "completed",
          "isCurrent": false
        },
        {
          "stepId": "em_andamento",
          "stepName": "Em andamento",
          "statusKey": "em_andamento",
          "kind": "work",
          "order": 3,
          "state": "active",
          "isCurrent": true
        }
      ]
    },
    "timeline": [
      {
        "action": "request_opened",
        "label": "Solicitacao aberta",
        "timestamp": {
          "seconds": 1,
          "nanoseconds": 0
        },
        "userId": "REQ1",
        "userName": "Requester",
        "details": {}
      }
    ]
  }
}
```

Erros esperados:

- `400 INVALID_REQUEST_ID` quando `[requestId]` nao for inteiro positivo;
- `401 UNAUTHORIZED` quando o token faltar ou for invalido;
- `403 FORBIDDEN` quando o ator nao puder ler o request;
- `404 REQUEST_NOT_FOUND` quando o request nao existir;
- `500 INVALID_PUBLISHED_VERSION` quando o request apontar para versao inconsistente.

### 8.2. Tipos server-side recomendados

```ts
type WorkflowRequestDetailPermissions = {
  canAssign: boolean;
  canFinalize: boolean;
  canArchive: boolean;
};

type WorkflowRequestDetailField = {
  fieldId: string;
  label: string;
  type: VersionFieldType;
  value: unknown;
};

type WorkflowRequestAttachment = {
  fieldId: string;
  label: string;
  url: string;
};

type WorkflowRequestProgressItem = {
  stepId: string;
  stepName: string;
  statusKey: string;
  kind: StepKind;
  order: number;
  state: StepState;
  isCurrent: boolean;
};

type WorkflowRequestTimelineItem = {
  action: HistoryAction;
  label: string;
  timestamp: TimestampLike;
  userId: string;
  userName: string;
  details?: Record<string, unknown>;
};

type WorkflowRequestDetailData = {
  summary: WorkflowReadSummary;
  permissions: WorkflowRequestDetailPermissions;
  formData: {
    fields: WorkflowRequestDetailField[];
    extraFields: Array<{ key: string; value: unknown }>;
  };
  attachments: WorkflowRequestAttachment[];
  progress: {
    currentStepId: string;
    totalSteps: number;
    completedSteps: number;
    items: WorkflowRequestProgressItem[];
  };
  timeline: WorkflowRequestTimelineItem[];
};
```

### 8.3. Pattern do route handler

```ts
export async function GET(
  request: Request,
  context: { params: Promise<{ requestId: string }> },
) {
  try {
    const { actor } = await authenticateRuntimeActor(request);
    const { requestId } = await context.params;
    const parsedRequestId = Number(requestId);

    if (!Number.isInteger(parsedRequestId) || parsedRequestId <= 0) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_REQUEST_ID', message: 'RequestId invalido.' },
        { status: 400 },
      );
    }

    const data = await getWorkflowRequestDetail(parsedRequestId, actor.actorUserId);

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (error) {
    // mesmo padrao das rotas read/* existentes
  }
}
```

### 8.4. Pattern do composer de detalhe

```ts
export async function getWorkflowRequestDetail(requestId: number, actorUserId: string) {
  const requestEntry = await getWorkflowRequestByRequestId(requestId);
  if (!requestEntry) {
    throw new RuntimeError(RuntimeErrorCode.REQUEST_NOT_FOUND, 'Request nao encontrado.', 404);
  }

  const request = requestEntry.data;
  assertCanReadRequest(request, actorUserId);

  const version = await getWorkflowVersion(request.workflowTypeId, request.workflowVersion);
  if (!version) {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_PUBLISHED_VERSION,
      'Versao publicada do request nao encontrada.',
      500,
    );
  }

  return buildWorkflowRequestDetail({
    docId: requestEntry.docId,
    request,
    version,
    actorUserId,
  });
}
```

### 8.5. Regras de composicao

#### `summary`

- reutiliza o shape de `WorkflowReadSummary`;
- e derivado diretamente do request;
- preserva compatibilidade visual com badges, header e acoes existentes.

#### `permissions`

- `canAssign` segue a mesma regra de owner atual;
- `canFinalize` segue owner ou responsavel atual;
- `canArchive` segue owner;
- o frontend usa apenas esse bloco para mostrar acoes do modal.

#### `formData`

- ordena pelos `fields` da versao publicada;
- inclui apenas campos nao vazios e nao `file`;
- preserva `value` bruto para formatacao futura;
- chaves presentes no `formData` mas ausentes da versao entram em `extraFields`, exceto chaves iniciadas por `_`.

#### `attachments`

- mapeia cada `field.type === 'file'` com URL valida;
- usa `field.label` como texto principal;
- mantem a ordem declarada na versao.

#### `progress`

- percorre `version.stepOrder` do inicio ao fim;
- usa `request.stepStates[stepId]` como fonte primaria do estado;
- preenche `isCurrent` por comparacao com `request.currentStepId`;
- `completedSteps` conta apenas itens com `state === 'completed'`.

#### `timeline`

- usa `request.history` em ordem crescente por `timestamp`;
- transforma `action` em label humano:
  - `request_opened` -> `Solicitacao aberta`
  - `responsible_assigned` -> `Responsavel atribuido`
  - `responsible_reassigned` -> `Responsavel reatribuido`
  - `step_completed` -> `Etapa concluida`
  - `entered_step` -> `Entrada em etapa`
  - `request_finalized` -> `Chamado finalizado`
  - `request_archived` -> `Chamado arquivado`

### 8.6. Pattern do cliente oficial

O cliente oficial deve espelhar o padrao de [api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/api-client.ts):

- `authenticatedWorkflowFetch()` com bearer token do Firebase;
- normalizacao client-safe de timestamps;
- erro tipado com `code`, `message` e `httpStatus`;
- `queryKey` contendo `user.uid` e `requestId`.

Pattern recomendado:

```ts
const detailQuery = useQuery({
  queryKey: managementKeys.detail(uid, selectedRequestId),
  queryFn: () => getWorkflowRequestDetail(user!, selectedRequestId!),
  enabled: enabled && Boolean(selectedRequestId),
});
```

---

## 9. Database Schema

### 9.1. Mudancas obrigatorias

Nenhuma.

### 9.2. Fontes de leitura usadas pelo composer

- `workflows_v2`
  - `formData`
  - `stepStates`
  - `history`
  - campos denormalizados do read model
- `workflowTypes_v2/{workflowTypeId}/versions/{version}`
  - `fields`
  - `stepOrder`
  - `stepsById`

### 9.3. Indices

Nenhum indice novo e obrigatorio para a 2A.3, porque o endpoint busca um unico request por `requestId` usando helper ja existente e compoe o restante em memoria.

---

## 10. Testing Strategy

### 10.1. Unit tests

| Componente | Cobertura |
|-----------|-----------|
| `assertCanReadRequest()` | owner, requester, responsavel, action recipient, participante, outsider |
| `buildWorkflowRequestFormData()` | scalar, vazio, campo ausente, `file`, chave tecnica `_uploadErrors` |
| `buildWorkflowRequestAttachments()` | arquivo obrigatorio, arquivo opcional, URL vazia |
| `buildWorkflowRequestProgress()` | request em aberto, em andamento, finalizado, arquivado |
| `buildWorkflowRequestTimeline()` | ordem cronologica, labels e details |

### 10.2. Integration tests

| Fluxo | Cobertura |
|------|-----------|
| `GET /api/workflows/read/requests/[requestId]` | sucesso para ator autorizado |
| `GET /api/workflows/read/requests/[requestId]` | `403` para outsider |
| `GET /api/workflows/read/requests/[requestId]` | `404` para request inexistente |
| `GET /api/workflows/read/requests/[requestId]` | `400` para `requestId` invalido |
| invalidacao apos `assign/finalize/archive` | detalhe reflete novo summary, timeline e permissions |

### 10.3. Component tests

| Componente | Cobertura |
|-----------|-----------|
| `RequestDetailDialog` | loading, erro, sucesso e footer por permissao |
| `RequestFormData` | campos ordenados e supressao de chaves tecnicas |
| `RequestAttachments` | lista vazia vs. links visiveis |
| `RequestProgress` | etapa atual, concluida e pendente |
| `RequestTimeline` | render cronologico com labels humanas |

### 10.4. Acceptance tests

```gherkin
GIVEN um owner autorizado com item sem responsavel
WHEN abre o detalhe oficial do request
THEN o modal mostra formData, progresso, timeline e acao de atribuir
```

```gherkin
GIVEN um solicitante autorizado sem permissao operacional
WHEN abre o detalhe oficial do proprio request
THEN ele consegue ler o detalhe rico, mas nao ve botoes de assign, finalize ou archive
```

```gherkin
GIVEN um request com campo file persistido no formData
WHEN o detalhe oficial e carregado
THEN o anexo aparece no bloco oficial de attachments com label da versao publicada
```

---

## 11. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | esconder o acionamento do detalhe rico na UI oficial se o problema estiver no modal | listas continuam operando com summary |
| 2 | reverter `src/app/api/workflows/read/requests/[requestId]/route.ts` se a regressao estiver isolada no endpoint | rotas `current`, `assignments` e `completed` permanecem intactas |
| 3 | reverter `src/lib/workflows/read/detail.ts` e `assertCanReadRequest()` se a inconsistência estiver na composicao | backend volta ao baseline sem tocar em dados |
| 4 | manter `/pilot/facilities` e as rotas legadas como fallback operacional | operacao nao fica bloqueada durante a reversao |

Metodo rapido:

```bash
git revert <commit-da-2A.3>
```

Observacao: como a 2A.3 e additive e nao altera schema nem dados persistidos, o rollback nao exige restauracao de banco.

---

## 12. Implementation Checklist

### Pre-Build

- [x] DEFINE aprovado para design
- [x] fonte de verdade mapeada
- [x] contrato de detalhe separado das listas fechado
- [x] authz de leitura definida
- [x] manifesto de arquivos fechado

### Build Readiness

- [x] payload de `summary`, `permissions`, `formData`, `attachments`, `progress` e `timeline` definido
- [x] pattern de route handler alinhado ao restante de `read/*`
- [x] strategy de frontend oficial alinhada ao padrao de React Query do projeto
- [x] plano de testes definido
- [x] rollback additive definido
