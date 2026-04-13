# DESIGN: Fase 2E.4 - Historico Geral unificado de chamados

> Generated: 2026-04-08
> Status: Ready for build
> Scope: Fase 2 / 2E.4 - grid read-only unificado `Legado + V2` para consulta administrativa e auditoria dentro da nova tela `/admin/request-config`
> Base document: `DEFINE_FASE2E_4_HISTORICO_GERAL_CHAMADOS.md`
> Depends on: `DESIGN_FASE2E_1_SHELL_CATALOGO_CHAMADOS.md`, `DESIGN_FASE2E_3_PUBLICACAO_ATIVACAO_CHAMADOS.md`

## 1. Objetivo

Entregar a subaba `Historico Geral` da nova superficie admin de configuracao de chamados como uma visao de consulta e auditoria, sem qualquer capacidade mutativa, capaz de listar em um unico grid itens vindos do legado (`workflows`) e do runtime v2 (`workflows_v2`).

Esta subetapa cobre:

- criar um read model administrativo proprio para historico global;
- unificar colunas basicas de `Legado + V2` em um DTO comum;
- expor filtros read-only por origem, area, workflow type, status, owner e periodo;
- permitir abrir detalhe somente leitura;
- garantir cobertura completa de leitura para `V2` desde o primeiro corte;
- tratar leitura legada como compatibilidade progressiva, sem bloquear a entrega de `V2`.

Esta subetapa nao cobre:

- editar, publicar, ativar, excluir ou reprocessar chamados;
- trocar o contrato da tela operacional `/gestao-de-chamados`;
- migrar requests legados para `workflows_v2`;
- reescrever o detalhe legado com feature parity total do detalhe v2;
- exportacao CSV no primeiro corte.

---

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_FASE2E_4_HISTORICO_GERAL_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_FASE2E_4_HISTORICO_GERAL_CHAMADOS.md)
- [DESIGN_FASE2E_1_SHELL_CATALOGO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2E_1_SHELL_CATALOGO_CHAMADOS.md)
- [DESIGN_FASE2E_3_PUBLICACAO_ATIVACAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2E_3_PUBLICACAO_ATIVACAO_CHAMADOS.md)
- [BRAINSTORM_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/BRAINSTORM_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md)
- [WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx)
- [AllRequestsView.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/admin/AllRequestsView.tsx)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/types.ts)
- [queries.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/queries.ts)
- [detail.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/detail.ts)
- [route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/read/management/bootstrap/route.ts)
- [route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/read/requests/[requestId]/route.ts)
- [api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/api-client.ts)
- [presentation.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/presentation.ts)

Em caso de divergencia:

1. prevalece o `DEFINE_FASE2E_4_HISTORICO_GERAL_CHAMADOS.md` para escopo e aceite;
2. depois prevalecem os designs da `2E.1` e `2E.3` para shell, permissao e namespace da superficie admin;
3. depois prevalece este design para orientar o build;
4. o detalhe v2 existente em `src/lib/workflows/read/detail.ts` segue como referencia final de profundidade para requests `V2`.

---

## 3. Estado Atual e Lacuna que a 2E.4 Fecha

### 3.1. O que o repositorio ja oferece

- existe um historico admin legado em [AllRequestsView.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/admin/AllRequestsView.tsx), apoiado em leitura client-side direta da colecao `workflows`;
- o runtime v2 ja possui read-side tipado para summaries e detalhe rico em `workflows_v2`;
- o detalhe v2 ja implementa timeline, form data, progresso e anexos por `requestId`;
- a `2E.1` ja separou a nova superficie admin por permissao `canManageWorkflowsV2`, com aba `Historico Geral` reservada para este corte.

### 3.2. Problema real no codigo atual

- o historico legado atual nao serve como contrato para a nova tela, porque mistura leitura, filtros e possiveis acoes do modelo antigo;
- o v2 tem leitura por escopo operacional e ownership, nao uma visao administrativa global;
- nao existe DTO unificado que deixe clara a origem de cada linha;
- detalhes de `Legado` e `V2` ainda vivem em superfices distintas, sem uma experiencia unica de auditoria read-only;
- se a tela nova reaproveitar `WorkflowsContext`, ela herda a colecao antiga como fonte principal e enfraquece a exigencia de suporte completo a `V2`.

### 3.3. Resultado esperado ao final da 2E.4

- a aba `Historico Geral` carrega um grid unificado, read-only, com badge de origem por linha;
- requests `V2` entram por API server-side canonica e com cobertura completa;
- requests `Legado` entram por adaptador de compatibilidade isolado;
- filtros e ordenacao operam sobre um shape comum;
- o detalhe abre em modo leitura, sem qualquer CTA de escrita, com renderer distinto por origem quando necessario.

---

## 4. Arquitetura da Solucao

### 4.1. Diagrama arquitetural

```text
Admin with canManageWorkflowsV2
  |
  +--> /admin/request-config
  |      |
  |      \--> Tab: Historico Geral
  |             |
  |             +--> useAdminRequestHistory()
  |             |      |
  |             |      +--> GET /api/admin/request-config/history
  |             |      \--> GET /api/admin/request-config/history/[origin]/[requestKey]
  |             |
  |             +--> Unified History Grid
  |             |      |- origem
  |             |      |- area
  |             |      |- workflow
  |             |      |- status
  |             |      |- owner
  |             |      \- periodo
  |             |
  |             \--> Read-only detail drawer/dialog
  |
  v
Admin authz layer
  |
  +--> verifyBearerToken
  +--> resolve collaborator
  \--> assert canManageWorkflowsV2
        |
        v
Admin history service
  |
  +--> V2 source adapter
  |      \--> query admin-wide summaries from workflows_v2
  |
  +--> Legacy source adapter
  |      \--> map workflows collection to unified admin summary
  |
  \--> merge + filter + sort + paginate in memory for first cut
        |
        v
Response DTO for grid/detail
```

### 4.2. Fluxo por camadas

```text
LAYER 1 (Authz)
1. Todas as rotas da aba usam o mesmo gate server-side `canManageWorkflowsV2`.

LAYER 2 (Read adapters)
2. O adapter V2 le `workflows_v2` e preserva o contrato canonico de summary/detail.
3. O adapter legado le `workflows` e converte para o DTO unificado minimo.

LAYER 3 (Admin aggregation)
4. O service concatena resultados, aplica filtros comuns e ordena por data mais recente.
5. Cada linha recebe `origin = 'legacy' | 'v2'` e `requestKey` estavel para navegacao.

LAYER 4 (Presentation)
6. A tab renderiza grid read-only, filtros, empty states e badge de origem.
7. O detalhe abre renderer especifico por origem:
   - `V2`: usa o detalhe canonico existente, com permissoes forcadas para `false`.
   - `Legado`: mostra resumo seguro com campos/historico disponiveis, sem inventar semantica nova.
```

### 4.3. Estrategia de agregacao do primeiro corte

Escolha do corte:

- `V2` e fonte primaria, obrigatoria e completa;
- `Legado` entra por compatibilidade progressiva;
- o merge inicial pode ser feito server-side em memoria, desde que o response limite a pagina a um numero controlado de itens;
- para requests `V2`, o sistema usa `submittedAt` e `closedAt` reais do runtime novo;
- para requests `Legado`, o sistema usa `submittedAt` como data principal do grid e tolera ausencia de `closedAt`.

Consequencia direta:

- o design privilegia corretude e isolamento de contratos sobre indexacao perfeita no primeiro corte;
- caso o legado falhe, a rota continua respondendo com itens `V2` e metadata de degradacao parcial.

### 4.4. Colunas canonicas do grid

Todas as linhas do grid devem expor:

- `origin`: `legacy | v2`
- `requestKey`: string estavel, sem prefixo redundante na URL:
  - `String(requestId)` para `V2`
  - `docId` para `Legado`
- `requestIdLabel`: string exibida ao usuario
- `areaLabel`
- `workflowLabel`
- `statusLabel`
- `statusCategory`
- `ownerLabel`
- `requesterLabel`
- `responsibleLabel`
- `submittedAt`
- `lastUpdatedAt`
- `periodReferenceAt`
- `isArchived`
- `compatibilityWarnings[]`

`periodReferenceAt` sera:

- `closedAt ?? submittedAt` para `V2` quando o status for concluido;
- `submittedAt` para `Legado`, exceto se houver `closedAt` confiavel no adaptador.

---

## 5. Architecture Decisions

### ADR-2E4-001: A aba usa um read model administrativo proprio, nao `WorkflowsContext`

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-08 |
| Context | O contexto legado le direto da colecao `workflows` no client e mistura historico antigo com regras da tela admin legada. |

**Choice:** criar rotas `/api/admin/request-config/history*` e hooks/client proprio para a nova aba.

**Rationale:**

1. preserva o gate `canManageWorkflowsV2` tambem no backend;
2. permite tratar `V2` como fonte primaria e `Legado` como adaptador isolado;
3. evita acoplamento da superficie nova ao estado global do legado.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| reaproveitar `WorkflowsContext` | empurra a nova tela para leitura legacy-first |
| chamar duas fontes direto no client | duplica authz e complica merge/fallback |

**Consequences:**

- positivo: contrato administrativo fica estavel;
- negativo: cria nova camada de API/read model.

### ADR-2E4-002: `V2` reaproveita o shape canonico existente e o `Legado` se adapta a ele

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-08 |
| Context | O v2 ja possui summaries/detalhe tipados; o legado nao. |

**Choice:** manter `V2` como baseline do DTO e mapear o legado para o menor subconjunto comum necessario ao grid.

**Rationale:**

1. reduz risco de empobrecer o contrato de `V2`;
2. garante que a nova tela nasce pronta para o runtime novo;
3. limita a superficie de compatibilidade legada ao estritamente necessario.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| definir DTO minimo neutro e degradar V2 para caber nele | joga fora sinal importante do runtime novo |
| criar duas tabelas separadas por origem | viola o requisito de grid unificado |

**Consequences:**

- positivo: suporte completo a `V2` no primeiro corte;
- negativo: algumas linhas legadas terao campos vazios ou warnings de compatibilidade.

### ADR-2E4-003: O detalhe usa renderer por origem, mas com shell visual unica

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-08 |
| Context | `V2` ja possui detalhe rico; o legado nao tem contrato equivalente pronto. |

**Choice:** abrir um drawer/dialog unico com header comum e corpo especializado por origem.

**Rationale:**

1. preserva experiencia unica para o usuario;
2. evita reimplementar o detalhe v2 existente;
3. impede invencao de semantica falsa para o legado.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| forcar detalhe identico entre legado e v2 | requer mapeamentos arriscados no legado |
| navegar para telas separadas | quebra a ideia de consulta unificada na mesma subaba |

**Consequences:**

- positivo: detalhe v2 continua fiel ao runtime;
- negativo: havera assimetria controlada entre detalhes de origens diferentes.

### ADR-2E4-004: Falha do adaptador legado nao derruba o historico `V2`

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-08 |
| Context | O define permite compatibilidade legada progressiva, nao bloqueante. |

**Choice:** a rota agrega as duas fontes com tolerancia a falhas e devolve `partialSources` quando o legado falhar.

**Rationale:**

1. protege o requisito de suporte pleno a `V2`;
2. evita indisponibilidade total por fragilidade de shape legado;
3. deixa a degradacao auditavel e testavel.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| falhar a rota inteira quando qualquer fonte falhar | contraria o define |
| esconder silenciosamente a falha do legado | dificulta auditoria e suporte |

**Consequences:**

- positivo: `V2` continua funcional isoladamente;
- negativo: a UI precisa comunicar degradacao parcial de forma discreta.

---

## 6. Contratos de Dados e API

### 6.1. DTO de summary unificado

```ts
export type AdminHistoryOrigin = 'legacy' | 'v2';

export type AdminHistorySummary = {
  origin: AdminHistoryOrigin;
  requestKey: string;
  requestIdLabel: string;
  sourceRequestId?: number | string | null;
  areaId?: string | null;
  areaLabel: string;
  workflowTypeId?: string | null;
  workflowLabel: string;
  statusKey?: string | null;
  statusLabel: string;
  statusCategory:
    | 'open'
    | 'in_progress'
    | 'waiting_action'
    | 'finalized'
    | 'archived'
    | 'unknown';
  ownerUserId?: string | null;
  ownerLabel: string;
  requesterLabel: string;
  responsibleLabel: string | null;
  submittedAt: string | null;
  lastUpdatedAt: string | null;
  periodReferenceAt: string | null;
  isArchived: boolean;
  compatibilityWarnings: string[];
};
```

### 6.2. Filtros do grid

```ts
export type AdminHistoryFilters = {
  origin?: 'legacy' | 'v2';
  areaId?: string;
  workflowTypeId?: string;
  statusCategory?: 'open' | 'in_progress' | 'waiting_action' | 'finalized' | 'archived';
  ownerUserId?: string;
  periodFrom?: string; // yyyy-MM-dd
  periodTo?: string;   // yyyy-MM-dd
  query?: string;      // requestId, requester, workflow, owner
  limit?: number;      // default 50, max 200
};
```

### 6.3. GET `/api/admin/request-config/history`

Objetivo: retornar lista unificada para a tab `Historico Geral`.

Query params aceitos:

- `origin`
- `areaId`
- `workflowTypeId`
- `statusCategory`
- `ownerUserId`
- `periodFrom`
- `periodTo`
- `query`
- `limit`

Response:

```json
{
  "ok": true,
  "data": {
    "items": [],
    "filterOptions": {
      "origins": ["legacy", "v2"],
      "areas": [],
      "workflows": [],
      "owners": [],
      "statusCategories": [
        "open",
        "in_progress",
        "waiting_action",
        "finalized",
        "archived"
      ]
    },
    "partialSources": [],
    "totalVisible": 0
  }
}
```

Regras:

- `401` sem token;
- `403` sem `canManageWorkflowsV2`;
- `200` mesmo com degradacao parcial, desde que ao menos uma fonte responda;
- `500` apenas quando nenhuma fonte puder responder.

### 6.4. GET `/api/admin/request-config/history/[origin]/[requestKey]`

Objetivo: abrir detalhe read-only.

Contratos:

- `origin='v2'` resolve o `requestId` e reaproveita `getWorkflowRequestDetail`, com output adaptado para modo admin read-only;
- `origin='v2'` resolve o `requestId` e usa um helper administrativo dedicado que monta o detalhe read-only sem passar por `assertCanReadRequest`;
- `origin='legacy'` le o documento da colecao `workflows` pelo `docId` e devolve summary, formData basico e history raw normalizado;
- ambos retornam envelope `{ ok: true, data }`.

Payload sugerido:

```ts
export type AdminHistoryDetailData =
  | {
      origin: 'v2';
      summary: AdminHistorySummary;
      detail: WorkflowRequestDetailData;
      permissions: {
        canAssign: false;
        canFinalize: false;
        canArchive: false;
        canRequestAction: false;
        canRespondAction: false;
      };
    }
  | {
      origin: 'legacy';
      summary: AdminHistorySummary;
      detail: {
        formEntries: Array<{ key: string; label: string; value: unknown }>;
        history: Array<{ timestamp: string | null; status: string; userName: string; notes?: string }>;
        attachments: Array<{ label: string; url: string }>;
      };
    };
```

### 6.5. Auth contract

- todas as rotas usam o mesmo helper server-side dedicado da `2E.1`;
- o detalhe administrativo nao herda regras de ownership do painel operacional;
- o gate e exclusivamente `canManageWorkflowsV2`, nao `canManageRequests`.
- para `V2`, a rota admin nao reutiliza `getWorkflowRequestDetail(requestId, actorUserId)` diretamente; ela usa um helper proprio de leitura administrativa com gate server-side ja satisfeito.

---

## 7. Regras de Negocio

1. A aba `Historico Geral` nunca renderiza CTA de mutacao, independentemente da origem.
2. Toda linha mostra badge textual explicita de origem: `Legado` ou `V2`.
3. `V2` deve entrar no grid mesmo quando o adaptador legado falhar.
4. O adaptador legado pode retornar `compatibilityWarnings` quando um campo nao puder ser mapeado com confianca.
5. Filtros por `workflowTypeId` e `areaId` aplicam correspondencia exata; `query` aplica busca textual leve.
6. Ordenacao default do grid: `periodReferenceAt desc`, depois `lastUpdatedAt desc`.
7. O detalhe `V2` usa o contrato canonico existente, mas com permissoes zeradas na apresentacao.
8. O detalhe legado nao tenta reproduzir `progress` ou `action` do v2 se esses conceitos nao existirem com confianca no documento antigo.
9. O estado vazio deve distinguir:
   - nenhum item global;
   - nenhum item para os filtros;
   - degradacao parcial com apenas `V2` disponivel.

---

## 8. File Manifest

### 8.1. Ordem de execucao

| Phase | Files | Agent |
|-------|-------|-------|
| 1. Shared contracts | `src/lib/workflows/admin-config/history-types.ts`, `src/lib/workflows/admin-config/auth.ts` | @firebase-specialist |
| 2. Read adapters | `src/lib/workflows/admin-config/history-v2.ts`, `src/lib/workflows/admin-config/history-legacy.ts`, `src/lib/workflows/admin-config/history-service.ts` | @firebase-specialist |
| 3. API routes | `src/app/api/admin/request-config/history/route.ts`, `src/app/api/admin/request-config/history/[origin]/[requestKey]/route.ts` | @firebase-specialist |
| 4. Frontend tab | `src/lib/workflows/admin-config/api-client.ts`, `src/components/workflows/admin-config/WorkflowConfigHistoryTab.tsx`, `src/components/workflows/admin-config/history/*` | @react-frontend-developer |
| 5. Tests | `src/lib/workflows/admin-config/__tests__/*`, `src/app/api/admin/request-config/__tests__/*`, `src/components/workflows/admin-config/__tests__/*` | @firebase-specialist + @react-frontend-developer |

### 8.2. Manifesto detalhado

| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | `src/lib/workflows/admin-config/history-types.ts` | Create | DTOs de summary/detail/filter/options da aba | @firebase-specialist | - |
| 2 | `src/lib/workflows/admin-config/auth.ts` | Reuse/Modify | gate server-side `canManageWorkflowsV2` | @firebase-specialist | - |
| 3 | `src/lib/workflows/admin-config/history-v2.ts` | Create | queries admin-wide de `workflows_v2` e adaptacao para DTO unificado | @firebase-specialist | #1 |
| 4 | `src/lib/workflows/admin-config/history-legacy.ts` | Create | leitura de `workflows` e mapeamento legacy -> unified summary/detail | @firebase-specialist | #1 |
| 5 | `src/lib/workflows/admin-config/history-service.ts` | Create | merge, filtros, ordenacao, fallback parcial e filter options | @firebase-specialist | #1, #3, #4 |
| 6 | `src/app/api/admin/request-config/history/route.ts` | Create | endpoint de lista unificada | @firebase-specialist | #2, #5 |
| 7 | `src/app/api/admin/request-config/history/[origin]/[requestKey]/route.ts` | Create | endpoint de detalhe read-only por origem | @firebase-specialist | #2, #3, #4 |
| 8 | `src/lib/workflows/admin-config/api-client.ts` | Modify | adicionar `getHistory()` e `getHistoryDetail()` | @react-frontend-developer | #6, #7 |
| 9 | `src/components/workflows/admin-config/WorkflowConfigPage.tsx` | Modify | substituir placeholder da tab `Historico Geral` pelo componente real | @react-frontend-developer | #10 |
| 10 | `src/components/workflows/admin-config/WorkflowConfigHistoryTab.tsx` | Create | container da aba, fetch, filtros, tabela e empty/error states | @react-frontend-developer | #8 |
| 11 | `src/components/workflows/admin-config/history/HistoryFiltersBar.tsx` | Create | filtros read-only da aba | @react-frontend-developer | #10 |
| 12 | `src/components/workflows/admin-config/history/HistoryGrid.tsx` | Create | grid unificado com badges e CTA `Ver detalhe` | @react-frontend-developer | #10 |
| 13 | `src/components/workflows/admin-config/history/HistoryDetailDialog.tsx` | Create | shell comum do detalhe | @react-frontend-developer | #10 |
| 14 | `src/components/workflows/admin-config/history/V2HistoryDetailView.tsx` | Create | renderer read-only do detalhe v2 | @react-frontend-developer | #13 |
| 15 | `src/components/workflows/admin-config/history/LegacyHistoryDetailView.tsx` | Create | renderer read-only do detalhe legado | @react-frontend-developer | #13 |
| 16 | `src/lib/workflows/admin-config/__tests__/history-service.test.ts` | Create | merge, filtros, sort e degradacao parcial | @firebase-specialist | #5 |
| 17 | `src/lib/workflows/admin-config/__tests__/history-legacy.test.ts` | Create | mapeamento do legado e warnings de compatibilidade | @firebase-specialist | #4 |
| 18 | `src/app/api/admin/request-config/__tests__/history-routes.test.ts` | Create | contratos HTTP 401/403/200/500 e detalhe por origem | @firebase-specialist | #6, #7 |
| 19 | `src/components/workflows/admin-config/__tests__/WorkflowConfigHistoryTab.test.tsx` | Create | filtros, grid misto, degradacao parcial e ausencia de CTAs de escrita | @react-frontend-developer | #10-#15 |

---

## 9. Code Patterns

### 9.1. Pattern de summary unificado

```ts
function buildV2HistorySummary(item: WorkflowReadSummary): AdminHistorySummary {
  return {
    origin: 'v2',
    requestKey: String(item.requestId),
    requestIdLabel: String(item.requestId).padStart(4, '0'),
    sourceRequestId: item.requestId,
    areaId: item.areaId,
    areaLabel: item.areaId,
    workflowTypeId: item.workflowTypeId,
    workflowLabel: item.workflowName,
    statusKey: item.currentStatusKey,
    statusLabel: item.currentStepName,
    statusCategory: item.statusCategory,
    ownerUserId: item.ownerUserId,
    ownerLabel: item.ownerEmail,
    requesterLabel: item.requesterName,
    responsibleLabel: item.responsibleName,
    submittedAt: item.submittedAt?.toISOString() ?? null,
    lastUpdatedAt: item.lastUpdatedAt?.toISOString() ?? null,
    periodReferenceAt: (item.closedAt ?? item.submittedAt)?.toISOString() ?? null,
    isArchived: item.isArchived,
    compatibilityWarnings: [],
  };
}
```

### 9.2. Pattern de adaptador legado tolerante

```ts
function buildLegacyHistorySummary(docId: string, data: WorkflowRequest): AdminHistorySummary {
  return {
    origin: 'legacy',
    requestKey: docId,
    requestIdLabel: data.requestId || docId,
    sourceRequestId: data.requestId ?? null,
    areaId: null,
    areaLabel: 'Legado',
    workflowTypeId: data.type || null,
    workflowLabel: data.type || 'Workflow legado',
    statusKey: data.status || null,
    statusLabel: data.status || 'Status legado',
    statusCategory: inferLegacyStatusCategory(data),
    ownerUserId: null,
    ownerLabel: data.ownerEmail || '-',
    requesterLabel: data.submittedBy?.userName || '-',
    responsibleLabel: data.assignee?.name || null,
    submittedAt: data.submittedAt || null,
    lastUpdatedAt: data.lastUpdatedAt || data.submittedAt || null,
    periodReferenceAt: data.lastUpdatedAt || data.submittedAt || null,
    isArchived: Boolean(data.isArchived),
    compatibilityWarnings: [],
  };
}
```

### 9.3. Pattern de agregacao com degradacao parcial

```ts
export async function getAdminHistory(filters: AdminHistoryFilters) {
  const results = await Promise.allSettled([
    loadV2HistoryItems(filters),
    loadLegacyHistoryItems(filters),
  ]);

  const partialSources: AdminHistoryOrigin[] = [];
  const items: AdminHistorySummary[] = [];

  if (results[0].status === 'fulfilled') items.push(...results[0].value);
  else partialSources.push('v2');

  if (results[1].status === 'fulfilled') items.push(...results[1].value);
  else partialSources.push('legacy');

  if (partialSources.length === 2) {
    throw new Error('No history source available.');
  }

  return {
    items: sortAdminHistoryItems(applyAdminHistoryFilters(items, filters)),
    partialSources,
  };
}
```

### 9.4. Pattern de detalhe v2 em modo estritamente read-only

```ts
export async function getAdminV2HistoryDetail(requestId: number): Promise<AdminHistoryDetailData> {
  const detail = await getWorkflowRequestAdminDetail(requestId);

  return {
    origin: 'v2',
    summary: buildV2HistorySummary(detail.summary),
    detail: {
      ...detail,
      permissions: {
        canAssign: false,
        canFinalize: false,
        canArchive: false,
        canRequestAction: false,
        canRespondAction: false,
      },
    },
    permissions: {
      canAssign: false,
      canFinalize: false,
      canArchive: false,
      canRequestAction: false,
      canRespondAction: false,
    },
  };
}
```

### 9.5. Pattern de badge de origem no grid

```tsx
<Badge variant={item.origin === 'v2' ? 'default' : 'outline'}>
  {item.origin === 'v2' ? 'V2' : 'Legado'}
</Badge>
```

---

## 10. Testing Strategy

### 10.1. Unit

- inferencia de `statusCategory` para requests legados;
- mapeamento `V2 -> AdminHistorySummary`;
- mapeamento `Legado -> AdminHistorySummary`;
- ordenacao por `periodReferenceAt desc`;
- filtros por origem, owner, workflow, status e periodo.

### 10.2. Integration

- lista unificada com mistura de itens `legacy` e `v2`;
- degradacao parcial quando o legado falha mas `V2` continua disponivel;
- degradacao parcial quando o legado esta vazio;
- detalhe `v2` preserva timeline/progress/formData e zera permissoes;
- detalhe legado abre somente leitura com campos/historico disponiveis.

### 10.3. API contract

Seguir envelope canonico do projeto:

- `401` sem token;
- `403` sem `canManageWorkflowsV2`;
- `200` com `partialSources=['legacy']` quando apenas o legado falhar;
- `200` com `items=[]` quando filtros nao encontram nada;
- `404` para detalhe inexistente por origem;
- `500` apenas quando nenhuma fonte puder responder.

### 10.4. Component tests

- a tab renderiza badge `Legado` e `V2`;
- nenhum botao de editar/publicar/ativar aparece no grid nem no detalhe;
- filtro por origem reduz corretamente a lista;
- aviso de degradacao parcial aparece sem bloquear a tabela;
- empty state muda quando ha filtros ativos.

### 10.5. Regressao funcional obrigatoria

- `Historico Geral` nao usa `WorkflowsContext` como fonte principal;
- requests `V2` aparecem mesmo sem qualquer documento legado;
- abrir detalhe `V2` nao habilita nenhum comando operacional;
- rotas da aba continuam protegidas exclusivamente por `canManageWorkflowsV2`.

---

## 11. Rollback Plan

### 11.1. Rollback de codigo

1. remover as rotas `/api/admin/request-config/history*`;
2. voltar a tab `Historico Geral` para placeholder da `2E.1`;
3. manter intactos o catalogo da `2E.1` e os fluxos de publicacao/ativacao da `2E.3`.

### 11.2. Rollback de dados

Nao ha migracao de schema nem escrita nova obrigatoria:

- rollback e apenas de codigo;
- colecoes `workflows` e `workflows_v2` permanecem inalteradas;
- indices adicionais, se criados, podem permanecer sem impacto funcional.

### 11.3. Risco conhecido no rollback

- se a UI for revertida mas as rotas permanecerem publicadas, a superficie admin fica com endpoints ociosos;
- se os adaptadores assumirem campos legados nao estaveis, o risco principal e apenas erro de leitura, nao corrupcao.

---

## 12. Checklist de Build

- [ ] criar DTOs unificados de history summary/detail/filter;
- [ ] implementar adapter admin-wide para `workflows_v2`;
- [ ] implementar adapter legacy-only para `workflows`;
- [ ] implementar merge server-side com degradacao parcial auditavel;
- [ ] criar rota de lista e rota de detalhe no namespace `/api/admin/request-config/history`;
- [ ] substituir placeholder da tab `Historico Geral` por grid real;
- [ ] implementar detalhe read-only com renderer por origem;
- [ ] cobrir ausencia total de CTAs mutativos e degradacao parcial do legado.

---

## 13. Revision History

| Date | Author | Summary |
|------|--------|---------|
| 2026-04-08 | Codex | Design tecnico da 2E.4 cobrindo read model administrativo unificado `Legado + V2`, contratos de grid/detalhe, adapters de compatibilidade e estrategia de testes |
