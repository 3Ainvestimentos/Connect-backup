# DESIGN: Fase 2B.2 - Minhas Solicitacoes e detalhe read-only v2

> Generated: 2026-04-10
> Status: Ready for /build
> Source: DEFINE_FASE2B_TELA_ABERTURA_CHAMADOS_V2.md
> Depends on: Build 2B.1 entregue com rota `/solicitacoes`, shell `RequestsV2Page` e fluxo de abertura funcional

## 1. Requirements Summary

### Problem
O build 2B.1 cobre apenas catalogo e abertura do chamado. Falta a superficie oficial para o solicitante acompanhar seus requests v2 e consultar o detalhe rico read-only sem depender da tela legada `/applications` nem da tela operacional `/gestao-de-chamados`.

### Success Criteria
| Criterion | Target |
|-----------|--------|
| Tabela `Minhas Solicitacoes` espelha a tela legada | Colunas `#`, `Tipo`, `Status`, `Previsao de Conclusao` e `Acoes` presentes na mesma ordem |
| Atualizacao apos nova abertura | Request aberto via 2B.1 aparece na listagem apos `invalidateQueries` em ate 1 refetch |
| Detalhe read-only completo | Dialog exibe um bloco inicial de informacoes basicas do chamado (`Solicitante`, `Data`, `Tipo`, `Ultima Atualizacao`, `Responsavel`, `Aberto em`) e, abaixo dele, `formData`,`attachments`, `progress` e `timeline` do endpoint oficial |
| Zero CTA operacional | UI nao renderiza assign/finalize/archive/requestAction/respondAction mesmo se `permissions` vierem `true` |
| Isolamento do legado | Nenhum import de `src/components/applications/`, `ApplicationsContext` ou `WorkflowsContext` |

### Constraints
- A implementacao fica dentro da rota `/solicitacoes` ja estabelecida no build 2B.1
- A listagem usa exclusivamente `GET /api/workflows/read/mine`
- O detalhe usa exclusivamente `GET /api/workflows/read/requests/[requestId]`
- O dialog e estritamente read-only para o solicitante
- Sem paginacao nesta fase; usar a ordenacao oficial existente por `submittedAt desc`
- A tabela deve preservar o papel visual da tela legada, mas sobre contratos v2

## 2. Architecture

### System Diagram

```text
┌──────────────────────────────────────────────────────────────────┐
│ /solicitacoes                                                   │
│                                                                  │
│ RequestsV2Page (client shell - build 2B.1)                      │
│ ├─ WorkflowAreaGrid / SubmissionModal                           │
│ └─ MyRequestsV2Section                 ← NOVO                   │
│    ├─ useRequesterWorkflows().myRequestsQuery                   │
│    ├─ RequesterRequestsTable                                    │
│    ├─ Empty / Loading / Error states                            │
│    └─ Eye action -> selectedRequestId                           │
│                                                                  │
│ MyRequestDetailDialog                  ← NOVO                    │
│ ├─ useRequesterWorkflows().requestDetailQuery(requestId)        │
│ ├─ summary header read-only                                     │
│ │  ├─ Solicitante                                               │
│ │  ├─ Data                                                      │
│ │  ├─ Tipo                                                      │
│ │  ├─ Ultima Atualizacao                                        │
│ │  ├─ Responsavel                                               │
│ │  └─ Aberto em                                                 │
│ ├─ RequestFormData                     ← reuse                   │
│ ├─ RequestProgress                     ← reuse                   │
│ ├─ RequestTimeline                     ← reuse                   │
│ └─ RequestAttachments                  ← reuse                   │
└───────────────────────────────┬──────────────────────────────────┘
                                │ fetch with bearer token
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│ Existing API Routes                                             │
│ ├─ GET /api/workflows/read/mine                                 │
│ └─ GET /api/workflows/read/requests/[requestId]                 │
└───────────────────────────────┬──────────────────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│ Read Model v2                                                   │
│ ├─ queryRequesterHistory(actor.actorUserId)                     │
│ └─ getWorkflowRequestDetail(requestId, actor.actorUserId)       │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow

```text
LAYER 1 (Frontend - Page)
1. src/app/(app)/solicitacoes/page.tsx
   → continua como shell autenticado do build 2B.1

LAYER 2 (Frontend - Requester UI)
2. src/components/workflows/requester/RequestsV2Page.tsx
   → adiciona a secao `Minhas Solicitacoes` abaixo do catalogo
3. src/components/workflows/requester/MyRequestsV2Section.tsx
   → renderiza card, tabela, loading, error e empty states
4. src/components/workflows/requester/MyRequestDetailDialog.tsx
   → abre por `requestId`; consome o detalhe read-only

LAYER 3 (State / Queries)
5. src/hooks/use-requester-workflows.ts
   → expande o hook do 2B.1 com:
     - `myRequestsQuery`
     - `requestDetailQuery`
     - helper `refreshAfterOpenSuccess`

LAYER 4 (API Client)
6. src/lib/workflows/requester/api-client.ts
   → `fetchMyRequests()` e `fetchRequestDetail(requestId)`

LAYER 5 (Backend existente)
7. src/app/api/workflows/read/mine/route.ts
   → autentica ator e retorna grouped read data
8. src/app/api/workflows/read/requests/[requestId]/route.ts
   → autentica ator, valida `requestId` e retorna detalhe rico
```

### State Management
| State | Storage | Lifecycle |
|-------|---------|-----------|
| Lista de requests do solicitante | TanStack Query (`['requester-workflows', 'mine']`) | Fetch no mount; staleTime curto; invalidado apos `openRequest` |
| `selectedRequestId` | `useState` em `RequestsV2Page` | Definido ao clicar no olho; limpo ao fechar dialog |
| Detalhe do request | TanStack Query (`['requester-workflows', 'detail', requestId]`) | `enabled` apenas com dialog aberto e `requestId` valido |
| Erro nao bloqueante do detalhe | Estado derivado da query | Exibe alerta no dialog sem esconder ultimo detalhe valido |

## 3. Architecture Decisions

### ADR-001: Reuso dos subcomponentes read-only de `management/`

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-10 |
| **Context** | O detalhe do solicitante precisa mostrar um resumo basico do chamado no topo do modal, seguido por `formData`, progresso, timeline e anexos. Ja existem componentes puros em `src/components/workflows/management/` que fazem a apresentacao das secoes detalhadas, mas nao do bloco inicial de resumo. |

**Choice:** Reusar `RequestFormData`, `RequestProgress`, `RequestTimeline` e `RequestAttachments`, criando um shell proprio `MyRequestDetailDialog` com um bloco inicial de resumo read-only montado a partir de `detail.summary`.

**Rationale:**
1. Esses componentes ja sao read-only e nao dependem das actions operacionais.
2. O shell de `management/RequestDetailDialog` e acoplado a callbacks de mutacao e nao serve para a experiencia do solicitante.
3. O bloco inicial de resumo precisa ser proprio para preservar a UX da tela legada com as informacoes basicas logo na abertura.
4. Reusar os blocos de apresentacao reduz duplicacao e ajuda a manter consistencia visual.

**Alternatives Rejected:**
| Alternative | Why Rejected |
|-------------|--------------|
| Reusar `RequestDetailDialog` inteiro | Props e logica de CTA operacional sao excessivas e aumentam risco de vazamento de acoes |
| Reimplementar tudo no requester | Duplicacao desnecessaria de UI ja estavel |

**Consequences:**
- Positivo: baixo custo de implementacao com forte isolamento funcional
- Negativo: requester passa a depender da estabilidade da API visual desses subcomponentes

---

### ADR-002: Invalidação explicita da query `mine` apos abertura

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-10 |
| **Context** | O sucesso da 2B exige que o novo chamado apareca rapidamente em `Minhas Solicitacoes` apos o submit do build 2B.1. O endpoint `read/mine` ja devolve a lista ordenada por `submittedAt desc`. |

**Choice:** A mutation de `openRequest` do hook compartilhado invalida `['requester-workflows', 'mine']` no `onSuccess`, sem optimistic update.

**Rationale:**
1. O servidor ja define `requestId`, datas, SLA e read model; o cliente nao deve reconstruir isso localmente.
2. Invalidação simples elimina divergencia entre item otimista e item persistido.
3. O volume esperado de requests por usuario e baixo o suficiente para um refetch completo.

**Alternatives Rejected:**
| Alternative | Why Rejected |
|-------------|--------------|
| Optimistic update | Exigiria replicar regras de SLA e shape do summary no cliente |
| Polling continuo | Custo desnecessario para um evento pontual de sucesso |

**Consequences:**
- Positivo: consistencia forte com o backend oficial
- Negativo: o item depende de um round-trip extra apos o submit

---

### ADR-003: Sem paginação no build 2B.2

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-10 |
| **Context** | O DEFINE deixou em aberto o limite de itens de `Minhas Solicitacoes`. O endpoint atual `read/mine` retorna `items` e `groups` completos do solicitante. |

**Choice:** Entregar a tabela completa sem paginação nem agrupamento visual nesta fase; manter apenas ordenação decrescente por submissão.

**Rationale:**
1. Espelha melhor a tela legada, que tambem apresenta uma tabela direta.
2. Evita alterar contrato backend em uma fase cujo escopo e essencialmente de UI.
3. O crescimento historico pode ser tratado numa fase posterior se surgirem problemas reais de volume.

**Alternatives Rejected:**
| Alternative | Why Rejected |
|-------------|--------------|
| Paginação server-side | Exigiria novo contrato e mudanca desnecessaria no read model |
| Agrupar por mes no front | Desviaria da referencia visual da tela legada |

**Consequences:**
- Positivo: implementacao mais curta e com menor risco
- Negativo: usuarios com historico muito extenso podem ter tabela longa

---

### ADR-004: Ignorar `permissions` operacionais no requester

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-10 |
| **Context** | `GET /api/workflows/read/requests/[requestId]` retorna `permissions` por compartilhar o contrato com outras superficies. A 2B.2 nao pode expor acoes operacionais ao solicitante. |

**Choice:** O requester consome `permissions` apenas de forma opaca e nao o usa para renderizar CTAs.

**Rationale:**
1. O DEFINE fecha explicitamente o dialog como read-only.
2. O contrato backend pode continuar compartilhado sem forks desnecessarios.
3. Evita criar um endpoint paralelo apenas para esconder campos que o frontend pode ignorar.

**Alternatives Rejected:**
| Alternative | Why Rejected |
|-------------|--------------|
| Novo endpoint requester-specific | Duplica logica de detalhe sem ganho material |
| Condicionar CTAs a `permissions === false` | Continua abrindo espaco para regressao visual futura |

**Consequences:**
- Positivo: UI segura e contrato backend mantido
- Negativo: existe um pequeno risco de regressao se alguem reutilizar o shell errado no futuro; isso deve ser coberto por testes

## 4. File Manifest

### Execution Order
| Phase | Files | Agent |
|-------|-------|-------|
| 1. Shared requester state | hook + api client | build |
| 2. Requester section | table/section components | build |
| 3. Read-only dialog | dialog shell + tests | build |

### Detailed Manifest
| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | `src/lib/workflows/requester/api-client.ts` | Modify | Adicionar `fetchMyRequests` e `fetchRequestDetail` | build | 2B.1 base |
| 2 | `src/hooks/use-requester-workflows.ts` | Modify | Expor queries de lista e detalhe; invalidar `mine` apos abertura | build | #1 |
| 3 | `src/components/workflows/requester/RequestsV2Page.tsx` | Modify | Encaixar `MyRequestsV2Section` e controlar `selectedRequestId` | build | #2 |
| 4 | `src/components/workflows/requester/MyRequestsV2Section.tsx` | Create | Card/tabela/empty-state de `Minhas Solicitacoes` | build | #2 |
| 5 | `src/components/workflows/requester/MyRequestDetailDialog.tsx` | Create | Shell read-only do detalhe do solicitante | build | #2 |
| 6 | `src/components/workflows/requester/__tests__/MyRequestsV2Section.test.tsx` | Create | Garantir colunas, estados e acao do olho | build | #4 |
| 7 | `src/components/workflows/requester/__tests__/MyRequestDetailDialog.test.tsx` | Create | Garantir ausencia de CTAs operacionais e render do detalhe | build | #5 |
| 8 | `src/hooks/__tests__/use-requester-workflows.test.tsx` ou equivalente | Modify/Create | Cobrir invalidacao de `mine` apos open success | build | #2 |

## 5. Code Patterns

### Pattern 1: Requester API client alinhado ao contrato oficial

```ts
// src/lib/workflows/requester/api-client.ts
export async function fetchMyRequests(user: User): Promise<WorkflowGroupedReadData> {
  const token = await user.getIdToken();
  const response = await fetch('/api/workflows/read/mine', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  return unwrapReadResponse<WorkflowGroupedReadData>(response);
}

export async function fetchRequestDetail(
  user: User,
  requestId: number,
): Promise<WorkflowRequestDetailData> {
  const token = await user.getIdToken();
  const response = await fetch(`/api/workflows/read/requests/${requestId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  return unwrapReadResponse<WorkflowRequestDetailData>(response);
}
```

### Pattern 2: Query condicional para detalhe

```ts
// src/hooks/use-requester-workflows.ts
const { user } = useAuth();

const requestDetailQuery = useQuery({
  queryKey: ['requester-workflows', 'detail', selectedRequestId],
  enabled: Boolean(user && detailDialogOpen && Number.isInteger(selectedRequestId)),
  queryFn: () => fetchRequestDetail(user!, selectedRequestId!),
});
```

### Pattern 3: Dialog read-only com composicao de blocos existentes

```tsx
// src/components/workflows/requester/MyRequestDetailDialog.tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-h-[92vh] max-w-5xl overflow-hidden p-0">
    <DialogHeader>...</DialogHeader>
    <ScrollArea className="max-h-[calc(92vh-146px)]">
      <div className="space-y-6 px-6 py-5">
        <RequesterRequestSummaryHeader
          requesterName={detail.summary.requesterName}
          submittedAt={detail.summary.submittedAt}
          workflowName={detail.summary.workflowName}
          lastUpdatedAt={detail.summary.lastUpdatedAt}
          responsibleName={detail.summary.responsibleName}
          openedInLabel={detail.summary.areaId}
        />
        <RequestFormData formData={detail.formData} />
        <RequestProgress progress={detail.progress} />
        <RequestTimeline timeline={detail.timeline} />
        <RequestAttachments attachments={detail.attachments} />
      </div>
    </ScrollArea>
  </DialogContent>
</Dialog>
```

### Pattern 4: Invalidação da lista apos abertura

```ts
// src/hooks/use-requester-workflows.ts
const openRequestMutation = useMutation({
  mutationFn: openRequest,
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['requester-workflows', 'mine'] });
  },
});
```

## 6. API Contract

Nenhum endpoint novo ou alterado.

### `GET /api/workflows/read/mine` (existente, consumido pela 2B.2)

```http
GET /api/workflows/read/mine
Authorization: Bearer {token}
```

### Response (Success)

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "requestId": 123,
        "workflowTypeId": "facilities-cleaning",
        "workflowName": "Limpeza",
        "currentStatusKey": "in_progress",
        "statusCategory": "in_progress",
        "expectedCompletionAt": "timestamp|null",
        "submittedAt": "timestamp|null"
      }
    ],
    "groups": []
  }
}
```

Uso em 2B.2:
- a UI usa `data.items`
- `groups` fica preservado no contrato, mas nao e renderizado nesta fase

### `GET /api/workflows/read/requests/{requestId}` (existente, consumido pela 2B.2)

```http
GET /api/workflows/read/requests/123
Authorization: Bearer {token}
```

### Response (Success)

```json
{
  "ok": true,
  "data": {
    "summary": {},
    "permissions": {
      "canAssign": false,
      "canFinalize": false,
      "canArchive": false,
      "canRequestAction": false,
      "canRespondAction": false
    },
    "formData": { "fields": [], "extraFields": [] },
    "attachments": [],
    "progress": { "currentStepId": "step-1", "totalSteps": 3, "completedSteps": 1, "items": [] },
    "action": { "available": false, "state": "idle", "batchId": null, "type": null, "label": null, "commentRequired": false, "attachmentRequired": false, "commentPlaceholder": null, "attachmentPlaceholder": null, "canRequest": false, "canRespond": false, "requestedAt": null, "completedAt": null, "requestedByUserId": null, "requestedByName": null, "recipients": [] },
    "timeline": []
  }
}
```

Uso em 2B.2:
- `summary` alimenta o bloco inicial de informacoes basicas:
  - `Solicitante` ← `summary.requesterName`
  - `Data` ← `summary.submittedAt`
  - `Tipo` ← `summary.workflowName`
  - `Ultima Atualizacao` ← `summary.lastUpdatedAt`
  - `Responsavel` ← `summary.responsibleName` (ou placeholder quando vazio)
  - `Aberto em` ← `summary.areaId` com label amigavel quando houver mapa de area no cliente; fallback para o proprio `areaId`
- `formData`, `attachments`, `progress` e `timeline` sao renderizados abaixo do resumo
- `permissions` e `action` nao geram nenhum CTA

## 7. Database Schema

Nenhuma mudanca no schema.

## 8. Testing Strategy

### Unit Tests
| Component | Test |
|-----------|------|
| `MyRequestsV2Section` | Renderiza loading, erro, empty state e tabela com as 5 colunas exigidas |
| `MyRequestsV2Section` | Clique no botao do olho chama `onSelectRequest(requestId)` |
| `MyRequestDetailDialog` | Renderiza bloco inicial de resumo (`Solicitante`, `Data`, `Tipo`, `Ultima Atualizacao`, `Responsavel`, `Aberto em`) antes de `RequestFormData`, `RequestProgress`, `RequestTimeline` e `RequestAttachments` |
| `MyRequestDetailDialog` | Nao renderiza botoes de assign/finalize/archive/requestAction/respondAction |
| `use-requester-workflows` | `openRequest.onSuccess` invalida a query `mine` |

### Integration Tests
| Flow | Test |
|------|------|
| Load inicial de `/solicitacoes` | Catalogo continua funcional e a secao `Minhas Solicitacoes` carrega em paralelo |
| Abrir detalhe read-only | Usuario clica no olho e o dialog busca o detalhe por `requestId` |
| Pos-submit | Abertura de novo chamado dispara refetch e o item aparece na tabela |
| Erro de detalhe | Dialog exibe estado de falha com retry sem quebrar a pagina inteira |

### Acceptance Tests

```gherkin
GIVEN um usuario autenticado com requests v2 ja abertos
WHEN ele acessa /solicitacoes
THEN a secao Minhas Solicitacoes mostra a tabela oficial com as colunas esperadas
```

```gherkin
GIVEN um item visivel em Minhas Solicitacoes
WHEN o usuario clica no botao de olho
THEN o dialog mostra dados enviados, progresso, timeline e anexos sem qualquer CTA operacional
```

```gherkin
GIVEN que o usuario acabou de abrir um novo chamado pela 2B.1
WHEN a mutation retorna sucesso
THEN a query de Minhas Solicitacoes e invalidada e o novo request passa a aparecer na tabela
```

## 9. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | Remover o encaixe de `MyRequestsV2Section` em `RequestsV2Page` | `/solicitacoes` volta a exibir apenas catalogo e abertura |
| 2 | Remover `MyRequestDetailDialog` e a query de detalhe | Nenhuma acao de olho fica acessivel |
| 3 | Reverter extensoes do hook/api client requester | Fluxo de 2B.1 continua operacional sem regressao |

**Metodo rapido:** `git revert {commit-hash}`

## 10. Implementation Checklist

### Pre-Build
- [x] DEFINE document aprovado para staged design
- [x] Dependencia de 2B.1 registrada
- [x] Contratos reais de `read/mine` e `read/detail` validados no codigo
- [x] Estrategia de invalidação apos abertura definida
- [x] Regra read-only do dialog fechada

### Post-Build
- [ ] `Minhas Solicitacoes` renderiza na rota `/solicitacoes`
- [ ] Colunas legadas preservadas no mesmo papel visual
- [ ] Dialog abre por `requestId` e mostra detalhe rico
- [ ] Nenhum CTA operacional aparece no requester
- [ ] `openRequest` invalida `mine`
- [ ] Testes de componente e hook passam

## 11. Build Instructions

### Scope do build
- Implementar apenas a secao `Minhas Solicitacoes` e o detalhe read-only
- Nao refatorar o backend de `read/mine` ou `read/detail`
- Nao introduzir paginação, filtros ou agrupamento mensal visual
- Nao tocar em `/applications`

### Guardrails
- Nunca importar `src/components/applications/*`
- Nunca reutilizar `management/RequestDetailDialog`
- Se for preciso adaptar tipos, fazer o adapter no requester em vez de mutar o contrato do backend
- Se surgir necessidade de CTA operacional, isso deve virar novo DEFINE, nao entrar neste build

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-10 | design-agent | Initial staged design for build 2B.2 based on DEFINE_FASE2B_TELA_ABERTURA_CHAMADOS_V2.md |
