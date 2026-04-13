# DESIGN: FASE 2B - Nova Tela Oficial de Abertura de Chamados v2

> Generated: 2026-04-10
> Status: Ready for /build
> Source: DEFINE_FASE2B_TELA_ABERTURA_CHAMADOS_V2.md

## 1. Requirements Summary

### Problem
O usuario final comum nao possui superficie oficial para abrir chamados conectada ao backend `workflowTypes_v2` / runtime v2. A unica tela disponivel (`/applications`) opera sobre o motor legado, impedindo o uso dos workflows ja publicados e ativos no motor novo.

### Success Criteria
| Criterion | Target |
|-----------|--------|
| Catalogo reflete estado real | 100% dos workflows v2 ativos e publicados aparecem para usuarios permitidos |
| Abertura funcional ponta a ponta | Chamado aberto via 2B aparece em `/gestao-de-chamados` como request v2 valido |
| Upload funcional | Campos `file` submetidos via signed URL persistem corretamente |
| `Minhas Solicitacoes` atualiza apos abertura | Novo chamado aparece na listagem em ate 5s apos abertura |
| Isolamento do legado | Zero regressoes em `/applications` |
| Restricao de acesso respeitada | Usuario sem permissao nao ve workflow restrito |
| Detalhe do solicitante | Dialog exibe formData, progresso, timeline e anexos |

### Constraints
- Implementacao nova e separada; nao evolui sobre componentes legados
- Convivencia com `/applications` mantida durante rollout
- Escopo exclusivo do usuario final comum; admin nao entra nesta iteracao
- Nenhum componente importa `ApplicationsContext`, `WorkflowsContext` ou `src/components/applications/`
- Toda comunicacao via API routes do runtime/read v2

---

## 2. Architecture

### System Diagram

```text
┌─────────────────────────────────────────────────────────────────────┐
│  BROWSER                                                            │
│                                                                     │
│  /solicitacoes (page.tsx)                                           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  RequestsV2Page (client shell)                               │   │
│  │  ┌────────────────────┐  ┌───────────────────────────────┐   │   │
│  │  │  WorkflowAreaGrid  │  │  MyRequestsV2Section          │   │   │
│  │  │  ┌──────────────┐  │  │  ┌────────────────────────┐   │   │   │
│  │  │  │AreaCard x N  │  │  │  │ Table (grouped/flat)   │   │   │   │
│  │  │  └──────────────┘  │  │  └────────────────────────┘   │   │   │
│  │  └────────────────────┘  └───────────────────────────────┘   │   │
│  │  ┌────────────────────┐  ┌───────────────────────────────┐   │   │
│  │  │WorkflowSelection   │  │  MyRequestDetailDialog        │   │   │
│  │  │Modal (multi-wf)    │  │  (read-only)                  │   │   │
│  │  └────────────────────┘  └───────────────────────────────┘   │   │
│  │  ┌────────────────────────────────────────────────────────┐  │   │
│  │  │  WorkflowSubmissionModal (dynamic form + upload)       │  │   │
│  │  │  ┌─────────────────────┐                               │  │   │
│  │  │  │DynamicFieldRenderer │                               │  │   │
│  │  │  │(v2 - per field)     │                               │  │   │
│  │  │  └─────────────────────┘                               │  │   │
│  │  └────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  useRequesterWorkflows (TanStack Query hook)                        │
│  requester-api-client.ts                                            │
└─────────────────────┬───────────────────────────────────────────────┘
                      │ fetch (Bearer token)
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│  NEXT.JS API ROUTES (server-side)                                   │
│                                                                     │
│  GET  /api/workflows/requester/catalog    ← NOVO                    │
│  GET  /api/workflows/catalog/[typeId]     ← existente (lazy fields) │
│  POST /api/workflows/runtime/requests     ← existente (openRequest) │
│  POST /api/workflows/runtime/uploads      ← existente (signed URL)  │
│  GET  /api/workflows/read/mine            ← existente (my requests) │
│  GET  /api/workflows/read/requests/[id]   ← existente (detail)      │
└─────────────────────┬───────────────────────────────────────────────┘
                      │ Firebase Admin SDK
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│  FIRESTORE                                                          │
│                                                                     │
│  workflowAreas                     ← leitura (agrupamento visual)   │
│  workflowTypes_v2                  ← leitura filtrada (catalogo)    │
│  workflowTypes_v2/{id}/versions/{v}← leitura (fields - lazy)       │
│  workflows_v2                      ← escrita (openRequest) + leitura│
│  counters/workflowCounter_v2       ← incremento atomico            │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```text
LAYER 1 (Frontend - Page):
1. src/app/(app)/solicitacoes/page.tsx
   → Server component shell; importa RequestsV2Page (client)

LAYER 2 (Frontend - Client Shell + Components):
2. src/components/workflows/requester/RequestsV2Page.tsx
   → Orquestra estado de modais; renderiza grid + Minhas Solicitacoes
3. src/components/workflows/requester/WorkflowAreaGrid.tsx
   → Grid de cards por area
4. src/components/workflows/requester/WorkflowSelectionModal.tsx
   → Modal de selecao (area com multiplos workflows)
5. src/components/workflows/requester/WorkflowSubmissionModal.tsx
   → Formulario dinamico, upload, submit
6. src/components/workflows/requester/MyRequestsV2Section.tsx
   → Tabela Minhas Solicitacoes
7. src/components/workflows/requester/MyRequestDetailDialog.tsx
   → Detalhe read-only do request do solicitante

LAYER 3 (State / Data Fetching):
8. src/hooks/use-requester-workflows.ts
   → TanStack Query: catalog query, my-requests query, open mutation, detail query

LAYER 4 (API Client):
9. src/lib/workflows/requester/api-client.ts
   → fetchCatalog, fetchWorkflowFields, openRequest, uploadFile,
     fetchMyRequests, fetchRequestDetail

LAYER 5 (Server - API Routes):
10. src/app/api/workflows/requester/catalog/route.ts
    → Agrega areas + types filtrados; retorna catalogo completo
11. Rotas existentes (runtime/requests, runtime/uploads, read/mine, read/requests/[id])

LAYER 6 (Server - Lib):
12. src/lib/workflows/requester/build-catalog.ts
    → Query areas, query types (active + published + allowedUserIds), agrupa
```

### State Management
| State | Storage | Lifecycle |
|-------|---------|-----------|
| Catalogo (areas + workflows) | TanStack Query cache | Fetch no mount; staleTime 5min; invalidate nunca (dados estáveis) |
| Campos do workflow selecionado | TanStack Query cache (por workflowTypeId) | Fetch on-demand ao abrir modal; staleTime 5min |
| Form data do submission | react-hook-form local state | Criado ao abrir modal; destruido ao fechar |
| Upload files em progresso | useState local no SubmissionModal | Gerencia upload state por campo file |
| Minhas Solicitacoes | TanStack Query cache | Fetch no mount; invalidate apos openRequest |
| Request detail | TanStack Query cache (por requestId) | Fetch on-demand ao clicar no olho |
| Modal aberto (area/submission/detail) | useState no RequestsV2Page | Efemero; reseta ao fechar |

---

## 3. Architecture Decisions

### ADR-001: Rota `/solicitacoes`

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-10 |
| **Context** | A DEFINE sugere `/solicitacoes` como rota. Precisa-se de uma rota dentro de `(app)` que nao colida com a legada `/applications`. |

**Choice:** `/solicitacoes` como rota definitiva.

**Rationale:**
1. Nome em portugues, consistente com a nomenclatura da plataforma (a tela legada se chama "Solicitacoes" no header)
2. Semanticamente distinta de `/applications` (legado) e `/gestao-de-chamados` (management)
3. Dentro do grupo `(app)` — autenticacao garantida pelo layout existente

**Alternatives Rejected:**
| Alternative | Why Rejected |
|-------------|--------------|
| `/chamados` | Colide semanticamente com `/gestao-de-chamados`; pode confundir |
| `/requests-v2` | Sufixo tecnico exposto ao usuario final; nao e user-friendly |
| `/applications/v2` | Acoplamento com rota legada; risco de confusao no routing |

**Consequences:**
- Positivo: URL limpa, memoravel, convive pacificamente com o legado
- Negativo: Nenhum significativo

---

### ADR-002: Endpoint dedicado de catalogo (`GET /api/workflows/requester/catalog`)

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-10 |
| **Context** | O cliente precisa montar o grid de areas com workflows acessiveis. Hoje existe `GET /api/workflows/catalog/[workflowTypeId]` que retorna metadados de UM workflow (incluindo fields). O cliente precisaria de N+1 chamadas para montar o catalogo completo. |

**Choice:** Novo endpoint `GET /api/workflows/requester/catalog` que retorna o catalogo agregado SEM fields (lazy load).

**Rationale:**
1. Uma unica chamada monta todo o grid de areas + lista de workflows
2. Fields sao carregados sob demanda ao abrir o modal de submissao (via `GET /api/workflows/catalog/[workflowTypeId]` existente)
3. Evita payload pesado: 30+ workflows com fields serializados de uma vez seria desnecessario
4. Pattern de "catalogo leve + detalhe lazy" e standard em e-commerce e portais de servico

**Alternatives Rejected:**
| Alternative | Why Rejected |
|-------------|--------------|
| Catalogo com fields inline | Payload pesado para 30+ workflows; maioria nao sera aberta |
| N chamadas paralelas do cliente | Latencia ruim; pressao desnecessaria no backend |
| Usar `workflowAreas` + `workflowTypes_v2` direto via Firestore client SDK | Expoe regras de negocio no cliente; `allowedUserIds` filtering deve ser server-side |

**Consequences:**
- Positivo: Payload leve (~2-5KB); unica chamada; fields lazy
- Negativo: Duas chamadas sequenciais ao abrir submission (catalog + fields); UX mitigada por loading state no modal

---

### ADR-003: DynamicFieldRenderer v2 reimplementado (nao importado do piloto)

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-10 |
| **Context** | Existe `src/components/pilot/facilities/DynamicFieldRenderer.tsx` que renderiza campos dinamicos. O tipo base e `PilotWorkflowField`. O runtime v2 usa `VersionFieldDef` com campos adicionais (`order`) e tipos extras (`date`, `date-range`). |

**Choice:** Criar `DynamicFieldRendererV2` em `src/components/workflows/requester/` baseado no piloto mas tipado com `WorkflowPublishedField` do catalogo e adicionando suporte a `date` e `date-range`.

**Rationale:**
1. O piloto nao suporta `date` nem `date-range` (aparece "nao suportado")
2. Types sao diferentes: `PilotWorkflowField` vs `WorkflowPublishedField` (from catalog response)
3. O piloto e experimental; a 2B e a superficie oficial — coupling indesejado
4. Refatorar para shared module e scope de refatoracao posterior (W5 no DEFINE)

**Alternatives Rejected:**
| Alternative | Why Rejected |
|-------------|--------------|
| Importar direto do piloto | Types incompativeis; falta suporte a `date`/`date-range`; coupling |
| Extrair para shared | Escopo de W5 (out of scope); prematuro sem consolidar ambos |

**Consequences:**
- Positivo: Tipagem correta; suporte completo a todos os field types do runtime v2
- Negativo: Duplicacao temporaria com o piloto; aceitavel ate W5

---

### ADR-004: Detalhe do solicitante via componentes proprios (nao reusa management/RequestDetailDialog)

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-10 |
| **Context** | Existe `RequestDetailDialog` em `management/` com props extensas para actions operacionais (assign, finalize, archive, requestAction, respondAction). A 2B precisa de um dialog estritamente read-only sem nenhum CTA operacional. |

**Choice:** Criar `MyRequestDetailDialog` em `requester/` que reutiliza os sub-componentes de apresentacao (`RequestFormData`, `RequestProgress`, `RequestTimeline`, `RequestAttachments`) da pasta `management/`, mas com dialog shell proprio sem CTAs.

**Rationale:**
1. Os sub-componentes de apresentacao (`RequestFormData`, `RequestProgress`, `RequestTimeline`, `RequestAttachments`) sao puros e aceitam props simples — perfeitos para reuso
2. O dialog shell do management tem 10+ props de callbacks e estados de mutacao que a 2B nao precisa
3. Composicao granular: reusa o que e util, descarta o que e irrelevante

**Alternatives Rejected:**
| Alternative | Why Rejected |
|-------------|--------------|
| Reuso total do `RequestDetailDialog` com props vazias | Interface confusa; props obrigatorias de callback; manutencao acoplada |
| Reimplementar tudo do zero | Duplicacao desnecessaria de `RequestFormData`, `RequestTimeline`, etc. |

**Consequences:**
- Positivo: Dialog limpo e focado; sem risk de CTAs operacionais vazarem; reuso eficiente dos sub-componentes
- Negativo: Se management refatorar sub-componentes, a 2B precisa acompanhar (baixo risco: sub-componentes sao estaveis)

---

### ADR-005: Comportamento de `allowedUserIds` vazio e tratamento de areas sem workflows

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-10 |
| **Context** | A DEFINE levanta duvidas sobre: (1) `allowedUserIds` como array vazio; (2) areas que ficam sem nenhum workflow acessivel apos filtragem. |

**Choice:**
- `allowedUserIds === []` (vazio) = ninguem tem acesso (workflow restrito sem usuarios configurados)
- Areas sem nenhum workflow acessivel = card da area oculto (nao renderizado)

**Rationale:**
1. `assertCanOpen` ja trata: `!allowed.includes('all') && !allowed.includes(userId)` → array vazio rejeita todos. O catalogo deve ser consistente com o gate de abertura.
2. Exibir area com empty state nao agrega valor ao usuario final; apenas polui a tela.

**Consequences:**
- Positivo: Catalogo limpo e previsivel; sem areas "fantasma"
- Negativo: Se admin configurar `allowedUserIds: []` por engano, o workflow fica invisivel ate correcao (comportamento esperado e seguro)

---

### ADR-006: Formulario longo — scroll interno no modal

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-10 |
| **Context** | Workflows podem ter muitos campos. O modal de submissao precisa acomodar formularios longos. |

**Choice:** Modal com `max-h-[92vh]` e `ScrollArea` interna (mesmo pattern do `RequestDetailDialog` de management).

**Rationale:**
1. Pattern ja validado no management dialog: `max-h-[92vh] max-w-5xl overflow-hidden p-0` + `ScrollArea`
2. Mantém contexto do modal (header com nome do workflow, footer com botoes de acao)
3. Alternativa full-screen e overkill para a maioria dos workflows (3-8 campos tipicamente)

**Consequences:**
- Positivo: Consistente com patterns existentes; funciona bem para 3-20 campos
- Negativo: Se um workflow tiver 50+ campos, o scroll fica longo (caso extremo; nao previsto para workflows v2)

---

### ADR-007: Invalidacao de cache apos abertura

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-10 |
| **Context** | Apos abrir um chamado, `Minhas Solicitacoes` precisa refletir o novo item. |

**Choice:** `invalidateQueries(['requester-my-requests'])` no `onSuccess` da mutation de `openRequest`.

**Rationale:**
1. Simples e confiavel: TanStack Query refaz o fetch de `/api/workflows/read/mine`
2. Optimistic update seria complexo (precisa gerar `WorkflowReadSummary` fake) e fragil
3. A latencia do refetch (~200-400ms) e imperceptivel apos o toast de sucesso

**Consequences:**
- Positivo: Dados sempre frescos; zero risco de estado inconsistente
- Negativo: Um fetch extra apos abertura (aceitavel)

---

## 4. File Manifest

### Execution Order
| Phase | Files | Agent |
|-------|-------|-------|
| 1. Backend (catalog endpoint + lib) | #1, #2, #3 | @firebase-specialist |
| 2. Frontend (api client + hook) | #4, #5 | @react-frontend-developer |
| 3. Frontend (page + components) | #6, #7, #8, #9, #10, #11, #12, #13, #14 | @react-frontend-developer |

### Detailed Manifest

| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | `src/lib/workflows/requester/catalog-types.ts` | Create | Types do catalogo de abertura (response shapes) | @firebase-specialist | - |
| 2 | `src/lib/workflows/requester/build-catalog.ts` | Create | Logica server-side: query areas + types filtrados, agrupa por area | @firebase-specialist | #1 |
| 3 | `src/app/api/workflows/requester/catalog/route.ts` | Create | `GET /api/workflows/requester/catalog` — endpoint de catalogo | @firebase-specialist | #2 |
| 4 | `src/lib/workflows/requester/api-client.ts` | Create | Client-side API functions: `fetchCatalog`, `fetchWorkflowFields`, `openRequest`, `uploadFile`, `fetchMyRequests`, `fetchRequestDetail` | @react-frontend-developer | #3 |
| 5 | `src/hooks/use-requester-workflows.ts` | Create | TanStack Query hook: catalog query, my-requests query, open mutation, fields query, detail query | @react-frontend-developer | #4 |
| 6 | `src/app/(app)/solicitacoes/page.tsx` | Create | Server component shell da pagina | @react-frontend-developer | - |
| 7 | `src/components/workflows/requester/RequestsV2Page.tsx` | Create | Client shell: estado de modais, layout grid + Minhas Solicitacoes | @react-frontend-developer | #5 |
| 8 | `src/components/workflows/requester/WorkflowAreaGrid.tsx` | Create | Grid responsivo de cards por area | @react-frontend-developer | #7 |
| 9 | `src/components/workflows/requester/WorkflowAreaCard.tsx` | Create | Card individual: icone, nome da area, badge de contagem | @react-frontend-developer | #8 |
| 10 | `src/components/workflows/requester/WorkflowSelectionModal.tsx` | Create | Modal de selecao quando area tem multiplos workflows | @react-frontend-developer | #7 |
| 11 | `src/components/workflows/requester/DynamicFieldRendererV2.tsx` | Create | Renderer de campo: text, textarea, select, date, date-range, file | @react-frontend-developer | - |
| 12 | `src/components/workflows/requester/WorkflowSubmissionModal.tsx` | Create | Modal de submissao: formulario dinamico + upload + validacao + submit | @react-frontend-developer | #5, #11 |
| 13 | `src/components/workflows/requester/MyRequestsV2Section.tsx` | Create | Secao Minhas Solicitacoes: tabela com colunas legadas | @react-frontend-developer | #5 |
| 14 | `src/components/workflows/requester/MyRequestDetailDialog.tsx` | Create | Dialog read-only: reusa sub-componentes de management | @react-frontend-developer | #5 |

---

## 5. Code Patterns

### Pattern 1: Catalog Endpoint (Server-side aggregation)

```typescript
// src/lib/workflows/requester/build-catalog.ts
import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import type { RequesterCatalogArea, RequesterCatalogWorkflow } from './catalog-types';

export async function buildRequesterCatalog(actorUserId: string): Promise<RequesterCatalogArea[]> {
  const db = getFirestore(getFirebaseAdminApp());

  // 1. Query all active workflow types with published version
  const typesSnap = await db
    .collection('workflowTypes_v2')
    .where('active', '==', true)
    .where('latestPublishedVersion', '!=', null)
    .get();

  // 2. Filter by allowedUserIds (server-side gate)
  const accessibleTypes = typesSnap.docs
    .map((doc) => ({ docId: doc.id, ...doc.data() }))
    .filter((wt) => {
      const allowed = wt.allowedUserIds as string[];
      return allowed.includes('all') || allowed.includes(actorUserId);
    });

  // 3. Query workflow areas
  const areasSnap = await db.collection('workflowAreas').get();
  const areasMap = new Map(areasSnap.docs.map((doc) => [doc.id, doc.data()]));

  // 4. Group by area, skip empty areas
  const areaGroups = new Map<string, RequesterCatalogWorkflow[]>();
  for (const wt of accessibleTypes) {
    const areaId = wt.areaId as string;
    if (!areaGroups.has(areaId)) areaGroups.set(areaId, []);
    areaGroups.get(areaId)!.push({
      workflowTypeId: wt.workflowTypeId as string,
      name: wt.name as string,
      description: wt.description as string,
      icon: wt.icon as string,
    });
  }

  // 5. Build response sorted alphabetically
  const result: RequesterCatalogArea[] = [];
  for (const [areaId, workflows] of areaGroups) {
    const areaDoc = areasMap.get(areaId);
    if (!areaDoc) continue;
    workflows.sort((a, b) => a.name.localeCompare(b.name));
    result.push({
      areaId,
      areaName: areaDoc.name as string,
      areaIcon: areaDoc.icon as string ?? 'FolderOpen',
      workflows,
    });
  }
  result.sort((a, b) => a.areaName.localeCompare(b.areaName));

  return result;
}
```

### Pattern 2: Catalog Types

```typescript
// src/lib/workflows/requester/catalog-types.ts
export type RequesterCatalogWorkflow = {
  workflowTypeId: string;
  name: string;
  description: string;
  icon: string;
};

export type RequesterCatalogArea = {
  areaId: string;
  areaName: string;
  areaIcon: string;
  workflows: RequesterCatalogWorkflow[];
};

export type RequesterCatalogResponse = {
  ok: true;
  data: RequesterCatalogArea[];
};

export type RequesterCatalogError = {
  ok: false;
  code: string;
  message: string;
};
```

### Pattern 3: API Client (Client-side)

```typescript
// src/lib/workflows/requester/api-client.ts
import type { RequesterCatalogArea } from './catalog-types';
import type { WorkflowPublishedMetadata } from '@/lib/workflows/catalog/types';
import type {
  WorkflowGroupedReadData,
  WorkflowRequestDetailData,
} from '@/lib/workflows/read/types';

async function authedFetch(url: string, options?: RequestInit) {
  const [{ getAuth }, { app }] = await Promise.all([
    import('firebase/auth'),
    import('@/lib/firebase'),
  ]);
  const token = await getAuth(app).currentUser?.getIdToken();

  if (!token) {
    throw new Error('Usuario nao autenticado');
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

export async function fetchCatalog(): Promise<RequesterCatalogArea[]> {
  const res = await authedFetch('/api/workflows/requester/catalog');
  const json = await res.json();
  if (!json.ok) throw new Error(json.message ?? 'Erro ao carregar catalogo');
  return json.data;
}

export async function fetchWorkflowFields(
  workflowTypeId: string,
): Promise<WorkflowPublishedMetadata> {
  const res = await authedFetch(`/api/workflows/catalog/${workflowTypeId}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.message ?? 'Erro ao carregar campos');
  return json.data;
}

export async function openRequest(params: {
  workflowTypeId: string;
  formData: Record<string, unknown>;
  requesterName: string;
}): Promise<{ requestId: number; docId: string }> {
  const res = await authedFetch('/api/workflows/runtime/requests', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.message ?? 'Erro ao abrir chamado');
  return json.data;
}

export async function uploadFile(params: {
  workflowTypeId: string;
  fieldId: string;
  fileName: string;
  contentType: string;
}): Promise<{
  uploadUrl: string;
  uploadMethod: 'PUT';
  uploadHeaders: Record<string, string>;
  fileUrl: string;
  storagePath: string;
  uploadId: string;
  expiresAt: string;
}> {
  const res = await authedFetch('/api/workflows/runtime/uploads', {
    method: 'POST',
    body: JSON.stringify({
      target: 'form_field',
      ...params,
    }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.message ?? 'Erro ao iniciar upload');
  return json.data;
}

export async function fetchMyRequests(): Promise<WorkflowGroupedReadData> {
  const res = await authedFetch('/api/workflows/read/mine');
  const json = await res.json();
  if (!json.ok) throw new Error(json.message ?? 'Erro ao carregar solicitacoes');
  return json.data;
}

export async function fetchRequestDetail(
  requestId: number,
): Promise<WorkflowRequestDetailData> {
  const res = await authedFetch(`/api/workflows/read/requests/${requestId}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.message ?? 'Erro ao carregar detalhe');
  return json.data;
}
```

### Pattern 4: TanStack Query Hook

```typescript
// src/hooks/use-requester-workflows.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCatalog,
  fetchWorkflowFields,
  openRequest,
  fetchMyRequests,
  fetchRequestDetail,
} from '@/lib/workflows/requester/api-client';
import { useAuth } from '@/contexts/AuthContext';

export function useRequesterCatalog() {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ['requester-catalog'],
    queryFn: fetchCatalog,
    enabled: Boolean(accessToken),
    staleTime: 5 * 60 * 1000,
  });
}

export function useWorkflowFields(workflowTypeId: string | null) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ['requester-workflow-fields', workflowTypeId],
    queryFn: () => fetchWorkflowFields(workflowTypeId!),
    enabled: Boolean(accessToken && workflowTypeId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useOpenRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: openRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requester-my-requests'] });
    },
  });
}

export function useMyRequests() {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ['requester-my-requests'],
    queryFn: fetchMyRequests,
    enabled: Boolean(accessToken),
    staleTime: 30 * 1000,
  });
}

export function useRequestDetail(requestId: number | null) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ['requester-request-detail', requestId],
    queryFn: () => fetchRequestDetail(requestId!),
    enabled: Boolean(accessToken && requestId),
  });
}
```

### Pattern 5: Client Shell (RequestsV2Page)

```typescript
// src/components/workflows/requester/RequestsV2Page.tsx
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Separator } from '@/components/ui/separator';
import { useRequesterCatalog, useOpenRequest } from '@/hooks/use-requester-workflows';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { RequesterCatalogArea, RequesterCatalogWorkflow } from '@/lib/workflows/requester/catalog-types';
import { WorkflowAreaGrid } from './WorkflowAreaGrid';
import { WorkflowSelectionModal } from './WorkflowSelectionModal';
import { WorkflowSubmissionModal } from './WorkflowSubmissionModal';
import { MyRequestsV2Section } from './MyRequestsV2Section';

export function RequestsV2Page() {
  const { currentUserCollab } = useAuth();
  const { data: catalog, isLoading: catalogLoading, error: catalogError } = useRequesterCatalog();
  const openMutation = useOpenRequest();
  const { toast } = useToast();

  // Modal state
  const [selectionArea, setSelectionArea] = React.useState<RequesterCatalogArea | null>(null);
  const [submissionWorkflow, setSubmissionWorkflow] = React.useState<RequesterCatalogWorkflow | null>(null);

  const handleAreaClick = (area: RequesterCatalogArea) => {
    if (area.workflows.length === 1) {
      setSubmissionWorkflow(area.workflows[0]);
    } else {
      setSelectionArea(area);
    }
  };

  const handleWorkflowSelect = (workflow: RequesterCatalogWorkflow) => {
    setSelectionArea(null);
    setSubmissionWorkflow(workflow);
  };

  const handleSubmit = async (params: {
    workflowTypeId: string;
    formData: Record<string, unknown>;
  }) => {
    const result = await openMutation.mutateAsync({
      ...params,
      requesterName: currentUserCollab?.name ?? '',
    });
    setSubmissionWorkflow(null);
    toast({
      title: 'Chamado aberto com sucesso',
      description: `Solicitacao #${result.requestId} registrada.`,
    });
  };

  return (
    <div className="space-y-8 p-6 md:p-8">
      <PageHeader
        title="Solicitacoes"
        description="Inicie processos e acesse as ferramentas da empresa."
      />

      <WorkflowAreaGrid
        areas={catalog ?? []}
        isLoading={catalogLoading}
        error={catalogError}
        onAreaClick={handleAreaClick}
      />

      <Separator />

      <MyRequestsV2Section />

      {selectionArea ? (
        <WorkflowSelectionModal
          open
          area={selectionArea}
          onOpenChange={() => setSelectionArea(null)}
          onWorkflowSelect={handleWorkflowSelect}
        />
      ) : null}

      {submissionWorkflow ? (
        <WorkflowSubmissionModal
          open
          workflow={submissionWorkflow}
          onOpenChange={() => setSubmissionWorkflow(null)}
          onSubmit={handleSubmit}
          isSubmitting={openMutation.isPending}
        />
      ) : null}
    </div>
  );
}
```

### Pattern 6: DynamicFieldRendererV2

```typescript
// src/components/workflows/requester/DynamicFieldRendererV2.tsx
'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { WorkflowPublishedField } from '@/lib/workflows/catalog/types';

export type FieldValue = string | File | null;

type DynamicFieldRendererV2Props = {
  field: WorkflowPublishedField;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  disabled?: boolean;
  error?: string;
};

export function DynamicFieldRendererV2({
  field,
  value,
  onChange,
  disabled = false,
  error,
}: DynamicFieldRendererV2Props) {
  const inputId = `field-v2-${field.id}`;
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const selectedFile = value instanceof File ? value : null;

  React.useEffect(() => {
    if (field.type === 'file' && !selectedFile && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [field.type, selectedFile]);

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>
        {field.label}
        {field.required ? ' *' : ''}
      </Label>

      {field.type === 'text' ? (
        <Input
          id={inputId}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
        />
      ) : null}

      {field.type === 'textarea' ? (
        <Textarea
          id={inputId}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
        />
      ) : null}

      {field.type === 'select' ? (
        <Select
          value={typeof value === 'string' ? value : ''}
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger id={inputId} aria-label={field.label}>
            <SelectValue placeholder={field.placeholder ?? 'Selecione uma opcao'} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      {field.type === 'date' ? (
        <Input
          id={inputId}
          type="date"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-invalid={Boolean(error)}
        />
      ) : null}

      {field.type === 'date-range' ? (
        <div className="flex gap-2">
          <Input
            id={`${inputId}-start`}
            type="date"
            value={typeof value === 'string' ? value.split('|')[0] ?? '' : ''}
            onChange={(e) => {
              const end = typeof value === 'string' ? value.split('|')[1] ?? '' : '';
              onChange(`${e.target.value}|${end}`);
            }}
            placeholder="Inicio"
            disabled={disabled}
            aria-invalid={Boolean(error)}
          />
          <Input
            id={`${inputId}-end`}
            type="date"
            value={typeof value === 'string' ? value.split('|')[1] ?? '' : ''}
            onChange={(e) => {
              const start = typeof value === 'string' ? value.split('|')[0] ?? '' : '';
              onChange(`${start}|${e.target.value}`);
            }}
            placeholder="Fim"
            disabled={disabled}
            aria-invalid={Boolean(error)}
          />
        </div>
      ) : null}

      {field.type === 'file' ? (
        <div className="space-y-2">
          <Input
            ref={fileInputRef}
            id={inputId}
            type="file"
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
            disabled={disabled}
            aria-invalid={Boolean(error)}
          />
          <p className="text-sm text-muted-foreground">
            {selectedFile
              ? `Arquivo selecionado: ${selectedFile.name}`
              : 'Nenhum arquivo selecionado.'}
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
```

### Pattern 7: MyRequestsV2Section (espelha layout legado)

```typescript
// src/components/workflows/requester/MyRequestsV2Section.tsx
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileClock, Inbox, Eye, Timer } from 'lucide-react';
import { useMyRequests, useRequestDetail } from '@/hooks/use-requester-workflows';
import { MyRequestDetailDialog } from './MyRequestDetailDialog';
import type { WorkflowReadSummary } from '@/lib/workflows/read/types';
import { format } from 'date-fns';

function formatTimestamp(ts: unknown): string {
  if (!ts) return '-';
  if (typeof ts === 'object' && '_seconds' in (ts as Record<string, unknown>)) {
    const seconds = (ts as { _seconds: number })._seconds;
    return format(new Date(seconds * 1000), 'dd/MM/yyyy');
  }
  return '-';
}

export function MyRequestsV2Section() {
  const { data, isLoading, error } = useMyRequests();
  const [selectedRequestId, setSelectedRequestId] = React.useState<number | null>(null);
  const { data: detail, isLoading: detailLoading } = useRequestDetail(selectedRequestId);

  const items = data?.items ?? [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Minhas Solicitacoes</CardTitle>
          <CardDescription>Acompanhe o status das suas solicitacoes aqui.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileClock className="h-6 w-6" />
            Minhas Solicitacoes
          </CardTitle>
          <CardDescription>
            Acompanhe o status das suas solicitacoes aqui.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-destructive">Erro ao carregar solicitacoes.</p>
          ) : items.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Previsao de Conclusao</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((req) => (
                    <TableRow key={req.docId}>
                      <TableCell className="font-mono text-muted-foreground text-xs">
                        {req.requestId}
                      </TableCell>
                      <TableCell className="font-medium">{req.workflowName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-semibold">
                          {req.currentStepName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {req.expectedCompletionAt ? (
                          <span className="flex items-center gap-1.5 text-sm">
                            <Timer className="h-4 w-4 text-muted-foreground" />
                            {formatTimestamp(req.expectedCompletionAt)}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedRequestId(req.requestId)}
                          className="hover:bg-muted"
                        >
                          <Eye className="h-5 w-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 px-6 border-2 border-dashed rounded-lg">
              <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium text-foreground">
                Nenhuma solicitacao encontrada
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Voce ainda nao fez nenhuma solicitacao. Inicie uma nos cards acima.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <MyRequestDetailDialog
        open={selectedRequestId !== null}
        requestId={selectedRequestId}
        detail={detail}
        isLoading={detailLoading}
        onOpenChange={() => setSelectedRequestId(null)}
      />
    </>
  );
}
```

---

## 6. API Contract

### GET /api/workflows/requester/catalog (NOVO)

```http
GET /api/workflows/requester/catalog
Authorization: Bearer {firebase-id-token}
```

**Response (Success)**
```json
{
  "ok": true,
  "data": [
    {
      "areaId": "area_financeiro",
      "areaName": "Governanca Financeira",
      "areaIcon": "DollarSign",
      "workflows": [
        {
          "workflowTypeId": "wt_reembolso",
          "name": "Reembolso de Despesas",
          "description": "Solicite reembolso de despesas corporativas",
          "icon": "Receipt"
        },
        {
          "workflowTypeId": "wt_pagamento",
          "name": "Solicitacao de Pagamento",
          "description": "Solicite pagamento a fornecedor",
          "icon": "CreditCard"
        }
      ]
    }
  ]
}
```

**Response (Error)**
```json
{
  "ok": false,
  "code": "AUTH_REQUIRED",
  "message": "Token de autenticacao ausente ou invalido."
}
```

**Filtros aplicados server-side:**
- `active === true`
- `latestPublishedVersion !== null`
- `allowedUserIds.includes('all') || allowedUserIds.includes(actorUserId)`
- Areas sem workflows acessiveis sao omitidas

---

### GET /api/workflows/catalog/[workflowTypeId] (existente — sem mudanca)

Usado para lazy-load dos `fields` ao abrir o modal de submissao.

Response shape: `WorkflowPublishedMetadata` (ja documentado em `src/lib/workflows/catalog/types.ts`).

---

### POST /api/workflows/runtime/requests (existente — sem mudanca)

```json
{
  "workflowTypeId": "wt_reembolso",
  "formData": { "campo1": "valor1", "campo_file": "https://storage.../file.pdf" },
  "requesterName": "Lucas Nogueira"
}
```

Response: `{ "ok": true, "data": { "requestId": 42, "docId": "abc123" } }`

---

### POST /api/workflows/runtime/uploads (existente — sem mudanca)

```json
{
  "target": "form_field",
  "workflowTypeId": "wt_reembolso",
  "fieldId": "comprovante",
  "fileName": "nota.pdf",
  "contentType": "application/pdf"
}
```

Response: `{ "ok": true, "data": { "uploadUrl": "https://...", "uploadMethod": "PUT", "uploadHeaders": { "Content-Type": "application/pdf" }, "fileUrl": "https://firebasestorage.googleapis.com/...", "storagePath": "Workflows/workflows_v2/uploads/2026-04/upl_123-nota.pdf", "uploadId": "upl_123", "expiresAt": "2026-04-10T12:00:00.000Z" } }`

---

### GET /api/workflows/read/mine (existente — sem mudanca)

Response: `{ "ok": true, "data": { "items": WorkflowReadSummary[], "groups": WorkflowReadMonthGroup[] } }`

---

### GET /api/workflows/read/requests/[requestId] (existente — sem mudanca)

Response: `{ "ok": true, "data": WorkflowRequestDetailData }`

A UI da 2B ignora `data.permissions` e `data.action` — consome apenas `summary`, `formData`, `progress`, `timeline`, `attachments`.

---

## 7. Database Schema (mudancas)

Nenhuma mudanca no schema. Todas as colecoes usadas ja existem:

| Collection | Usage | Change |
|-----------|-------|--------|
| `workflowAreas` | Leitura para agrupamento visual | None |
| `workflowTypes_v2` | Leitura filtrada para catalogo | None |
| `workflowTypes_v2/{id}/versions/{v}` | Leitura lazy para fields | None |
| `workflows_v2` | Escrita (openRequest) + leitura (read model) | None |
| `counters/workflowCounter_v2` | Incremento atomico (requestId) | None |

---

## 8. Testing Strategy

### Unit Tests

| Component | Test File | What to Test |
|-----------|-----------|-------------|
| `build-catalog.ts` | `__tests__/build-catalog.test.js` | Filtragem por `active`, `latestPublishedVersion`, `allowedUserIds`; agrupamento por area; areas vazias omitidas; ordenacao alfabetica |
| `api-client.ts` | `__tests__/api-client.test.js` | Cada funcao retorna dados corretos em happy path; lanca erro em `ok: false` |
| `DynamicFieldRendererV2` | `__tests__/DynamicFieldRendererV2.test.tsx` | Renderiza cada tipo de campo; onChange dispara; error exibido; file reset |

### Integration Tests

| Flow | Test File | What to Test |
|------|-----------|-------------|
| Catalog endpoint | `__tests__/catalog-route.test.js` | Auth required; filtragem correta; response shape |
| Open request E2E | `__tests__/open-request-e2e.test.js` | Catalogo → selecao → submissao → request criado em `workflows_v2` → aparece em `read/mine` |

### Acceptance Tests

```gherkin
GIVEN um usuario autenticado com acesso a workflows v2 ativos
WHEN acessa /solicitacoes
THEN ve o grid de areas com workflows acessiveis agrupados

GIVEN uma area com exatamente 1 workflow
WHEN clica no card da area
THEN abre direto o modal de submissao com campos do workflow

GIVEN uma area com 3 workflows
WHEN clica no card da area
THEN abre modal de selecao listando os 3 workflows
AND ao selecionar um, abre o modal de submissao

GIVEN o modal de submissao aberto
WHEN preenche todos os campos obrigatorios e submete
THEN o chamado e criado com sucesso
AND um toast exibe o requestId
AND o novo chamado aparece em Minhas Solicitacoes

GIVEN um campo do tipo file no formulario
WHEN seleciona um arquivo
THEN o upload via signed URL e executado
AND a URL do arquivo e persistida no formData

GIVEN a secao Minhas Solicitacoes com items
WHEN clica no botao do olho em um item
THEN abre o dialog read-only com formData, progresso, timeline e anexos
AND nenhum CTA operacional (assign, finalize, archive) e exibido

GIVEN um usuario sem acesso a nenhum workflow v2
WHEN acessa /solicitacoes
THEN o grid de areas aparece vazio (empty state)
AND Minhas Solicitacoes mostra lista vazia

GIVEN um workflowType com allowedUserIds: []
WHEN qualquer usuario acessa /solicitacoes
THEN o workflow nao aparece no catalogo
```

---

## 9. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | Remover pagina `src/app/(app)/solicitacoes/` | Rota nao resolve mais |
| 2 | Remover `src/components/workflows/requester/` | Nenhum import quebrado (componentes isolados) |
| 3 | Remover `src/lib/workflows/requester/` | Nenhum import quebrado |
| 4 | Remover `src/hooks/use-requester-workflows.ts` | Nenhum import quebrado |
| 5 | Remover `src/app/api/workflows/requester/catalog/` | Nenhuma outra rota depende |
| 6 | Verificar que `/applications` continua funcionando | Build + smoke test |

**Metodo rapido:** `git revert {commit-hash}` — toda a feature e aditiva e isolada; revert seguro.

**Impacto no banco:** Zero — nenhuma colecao nova criada; requests abertos via 2B sao requests v2 normais que continuam visiveis em `/gestao-de-chamados`.

---

## 10. Implementation Checklist

### Pre-Build
- [x] DEFINE document approved (Clarity 13/15)
- [x] Architecture decisions documented (7 ADRs)
- [x] File manifest complete (14 files)
- [x] Code patterns validated against codebase
- [x] Pontos de fechamento do DEFINE resolvidos (Secao 10 → ADRs)

### Post-Build
- [ ] Todos os 14 arquivos do manifest criados
- [ ] `npm run build` passa sem erros
- [ ] `npm run typecheck` passa sem erros
- [ ] `npm run lint` passa sem erros
- [ ] Testes unitarios do catalogo passam
- [ ] Testes do DynamicFieldRendererV2 passam
- [ ] Smoke manual: abrir chamado via /solicitacoes → verificar em /gestao-de-chamados
- [ ] Smoke manual: upload de arquivo funciona
- [ ] Smoke manual: Minhas Solicitacoes mostra chamado recem-aberto
- [ ] Smoke manual: detalhe read-only exibe formData, progresso, timeline
- [ ] Zero regressoes em /applications (build + navegacao)

---

## 11. Specialist Instructions

### For @firebase-specialist

```markdown
Files to create:
- src/lib/workflows/requester/catalog-types.ts (#1)
- src/lib/workflows/requester/build-catalog.ts (#2)
- src/app/api/workflows/requester/catalog/route.ts (#3)

Key requirements:
- Use `getFirestore(getFirebaseAdminApp())` (pattern real do server-side atual)
- Auth via `authenticateRuntimeActor(request)` (pattern de todas as rotas v2)
- Filtragem de `allowedUserIds` DEVE ser server-side (nunca confie no cliente)
- `allowedUserIds: []` = ninguem tem acesso
- `allowedUserIds: ['all']` = todos os autenticados
- Apenas workflows com `active: true` e `latestPublishedVersion != null`
- Areas sem workflows acessiveis sao OMITIDAS do response
- Ordenacao alfabetica (areas e workflows)
- Error handling: `RuntimeError` → JSON response com status code; unexpected → 500
- Response shape: `{ ok: true, data: RequesterCatalogArea[] }`

Reference implementations:
- src/app/api/workflows/catalog/[workflowTypeId]/route.ts (pattern de rota)
- src/lib/workflows/catalog/published-metadata.ts (pattern de query + authz)
- src/lib/workflows/runtime/authz.ts (assertCanOpen — logica de allowedUserIds)
```

### For @react-frontend-developer

```markdown
Files to create:
- src/lib/workflows/requester/api-client.ts (#4)
- src/hooks/use-requester-workflows.ts (#5)
- src/app/(app)/solicitacoes/page.tsx (#6)
- src/components/workflows/requester/RequestsV2Page.tsx (#7)
- src/components/workflows/requester/WorkflowAreaGrid.tsx (#8)
- src/components/workflows/requester/WorkflowAreaCard.tsx (#9)
- src/components/workflows/requester/WorkflowSelectionModal.tsx (#10)
- src/components/workflows/requester/DynamicFieldRendererV2.tsx (#11)
- src/components/workflows/requester/WorkflowSubmissionModal.tsx (#12)
- src/components/workflows/requester/MyRequestsV2Section.tsx (#13)
- src/components/workflows/requester/MyRequestDetailDialog.tsx (#14)

Key requirements:
- ZERO imports de ApplicationsContext, WorkflowsContext, ou src/components/applications/
- Use AuthContext para obter currentUserCollab.name (requesterName)
- Use TanStack Query (useQuery/useMutation) para todas as chamadas — NAO use contexts para fetch
- Auth client: obter token via `getAuth(app).currentUser?.getIdToken()` (pattern atual dos API clients)
- Upload de arquivos: initFileUpload → `uploadUrl` + `uploadHeaders` → PUT file → usar `fileUrl`, `storagePath` e `uploadId` no formData
- DynamicFieldRendererV2 DEVE suportar: text, textarea, select, date, date-range, file
- Modal de submissao: react-hook-form + zod para validacao (pattern do projeto)
- MyRequestDetailDialog: REUTILIZAR sub-componentes de management/ (RequestFormData, RequestProgress, RequestTimeline, RequestAttachments) — NAO reimplementar
- MyRequestDetailDialog: IGNORAR permissions e action do response — somente leitura
- Tabela de Minhas Solicitacoes: colunas #, Tipo, Status, Previsao de Conclusao, Acoes (botao Eye)
- Area card: w-48 h-32, icone via getIcon() de @/lib/icons, hover bg-muted/50
- Loading states: Skeleton para grid e tabela; Spinner para modais
- Empty state: border-dashed + icone Inbox (mesmo pattern legado)
- Toast apos abertura com requestId
- getIcon() from @/lib/icons.ts para icones dinamicos de areas

Reference implementations:
- src/app/(app)/applications/page.tsx (layout legado a espelhar)
- src/components/applications/MyRequests.tsx (tabela legada a espelhar)
- src/components/workflows/management/RequestDetailDialog.tsx (dialog de referencia)
- src/components/workflows/management/RequestFormData.tsx (reusavel)
- src/components/workflows/management/RequestProgress.tsx (reusavel)
- src/components/workflows/management/RequestTimeline.tsx (reusavel)
- src/components/workflows/management/RequestAttachments.tsx (reusavel)
- src/components/pilot/facilities/DynamicFieldRenderer.tsx (referencia para v2)
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-10 | design-agent | Initial design based on DEFINE_FASE2B_TELA_ABERTURA_CHAMADOS_V2.md |
