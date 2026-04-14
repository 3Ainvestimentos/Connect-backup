# DESIGN: COMPATIBILIDADE_LEGADO_MINHAS_SOLICITACOES_SOLICITACOES_V2

> Generated: 2026-04-14
> Status: Ready for /build
> Source: DEFINE_COMPATIBILIDADE_LEGADO_MINHAS_SOLICITACOES_SOLICITACOES_V2.md

## 1. Requirements Summary

### Problem
A seção "Minhas Solicitações" de `/solicitacoes` exibe apenas chamados v2. O solicitante precisa navegar para `/applications` para acompanhar chamados legados, fragmentando a experiência e impedindo a limpeza do código morto em `src/components/applications/*`.

### Success Criteria
| Criterion | Target |
|-----------|--------|
| Visão unificada | 100% dos chamados do usuário (legado + v2) aparecem em `/solicitacoes` |
| Paridade de status/SLA para legado | Zero divergências de label/previsão entre `/solicitacoes` e `/applications` |
| Detalhe visualmente unificado | Um único shell de detalhe renderiza legado e v2 |
| Independência do legado | Zero imports de `src/components/applications/*` dentro de `src/components/workflows/requester/*` |
| Filtragem por usuário | 0% de vazamento de chamados de outros usuários |
| Loading/error unificados | Nunca exibe lista parcial silenciosa |

### Constraints
- Iteração somente leitura (nenhuma ação sobre chamados).
- Sem alterações em backend/Cloud Functions/Firestore Rules.
- Sem endpoint server-side unificado (YAGNI).
- Sem remoção efetiva dos arquivos legados nesta iteração.
- Sem reaproveitamento de componentes visuais de `src/components/applications/*`.
- Sem persistência nova (`cleanDataForFirestore` e `buildStorageFilePath` não se aplicam — feature é apenas composição de dados cliente-side).

## 2. Architecture

### System Diagram

```text
                       +-----------------------------------------+
                       |  /solicitacoes  (RequestsV2Page.tsx)    |
                       +-----------------------------------------+
                                         |
                                         v
                       +-----------------------------------------+
                       |   MyRequestsV2Section (UI unificada)    |
                       +-----------------------------------------+
                                         |
                                         v
                       +-----------------------------------------+
                       |  useRequesterUnifiedRequests (NOVO)     |
                       |  (hooks/use-requester-unified-requests) |
                       +-----------------------------------------+
                          |             |             |               |
                          v             v             v               v
              +----------------+ +-----------+ +----------------+ +----------------+
              | useMyRequests  | |useWorkflows| | useApplications| | useWorkflowAreas|
              | (v2 via API)   | | (legado)  | | (definicoes)   | | (areas/labels) |
              +----------------+ +-----------+ +----------------+ +----------------+
                          |             |             |               |
                          v             v             v               v
              +-----------------+ +-------------------------------+
              | /api/workflows/ | |   Firestore (workflows,       |
              | read/mine (v2)  | | workflowDefinitions, workflowAreas) |
              +-----------------+ +-------------------------------+

Adapters / Helpers (puros, sob src/lib/workflows/requester/):
  +-----------------------------------------------+
  |  legacy/derive-legacy-workflow-name.ts        |
  |  legacy/derive-legacy-status-label.ts         |
  |  legacy/derive-legacy-area.ts                 |
  |  legacy/derive-legacy-expected-completion.ts  |
  |  legacy/derive-legacy-attachments.ts          |
  |  legacy/derive-legacy-timeline.ts             |
  |  adapters/legacy-to-unified-list-item.ts      |
  |  adapters/legacy-to-unified-detail.ts         |
  |  adapters/v2-to-unified-list-item.ts          |
  |  adapters/v2-to-unified-detail.ts             |
  |  unified-types.ts                             |
  +-----------------------------------------------+

Detalhe unificado:
  [MyRequestsV2Section] -- onSelect --> [RequesterUnifiedRequestDetailDialog]
                                                 |
                                                 v
                               +----------------------------------+
                               | RequesterUnifiedRequestDetail    |
                               | (origin = 'legacy' | 'v2')       |
                               +----------------------------------+
                                  |              |
                                  v              v
                         (v2 fetch via     (legado: lookup
                          useRequestDetail  sincrono a partir
                          - permanece)      de useWorkflows +
                                            useApplications +
                                            useWorkflowAreas +
                                            helpers legacy/*)
```

### Data Flow

```text
LAYER 1 (Page/Presentation):
1. src/app/(app)/solicitacoes/page.tsx: host, mantem layout atual.
2. src/components/workflows/requester/RequestsV2Page.tsx: continua orquestrando
   catalogo e selecao. Injeta handler unico de selecao que aceita (origin, key).
3. src/components/workflows/requester/MyRequestsV2Section.tsx: consome
   useRequesterUnifiedRequests e renderiza lista unificada (legado + v2) em uma
   unica tabela. Expoe estados unificados de loading e erro.

LAYER 2 (State / Composition):
4. src/hooks/use-requester-unified-requests.ts (NOVO): combina useMyRequests (v2)
   + useWorkflows (legado) + useApplications (legado) + useWorkflowAreas +
   useCollaborators + useAuth. Resolve identidade legada, filtra, normaliza,
   resolve labels amigaveis de area, ordena, expoe
   { items, isLoading, isError, error, legacyIdentityResolved }.

LAYER 3 (Pure Logic / Adapters):
5. src/lib/workflows/requester/unified-types.ts (NOVO): tipos
   RequesterUnifiedRequestListItem / Detail com discriminante origin.
6. src/lib/workflows/requester/legacy/*.ts (NOVO): helpers puros de derivacao.
7. src/lib/workflows/requester/adapters/*.ts (NOVO): adapters legado -> unified,
   v2 -> unified.

LAYER 4 (Data - inalterado):
8. src/hooks/use-requester-workflows.ts: continua provendo dados v2 (hook
   useMyRequests + useRequestDetail).
9. src/contexts/WorkflowsContext.tsx: continua provendo dados legados.
10. src/contexts/ApplicationsContext.tsx: continua provendo workflowDefinitions.
11. src/contexts/WorkflowAreasContext.tsx: continua provendo labels
    amigaveis de area, inclusive para itens apenas legados.
12. src/contexts/CollaboratorsContext.tsx: resolve colaborador atual.

LAYER 5 (Backend - inalterado):
13. GET /api/workflows/read/mine: continua servindo v2 (sem mudancas).
14. Firestore workflows / workflowDefinitions / workflowAreas: continua lido via Contexts legados.
15. Firestore Rules / Storage Rules: sem mudancas.
```

### State Management
| State | Storage | Lifecycle |
|-------|---------|-----------|
| Lista v2 (WorkflowGroupedReadData) | React Query (`['workflows','requester','mine']`) | Fetch via `useMyRequests`; invalidado ao abrir nova solicitacao |
| Lista legada (WorkflowRequest[]) | React Query (`['workflows']`) via `useWorkflows` | Fetch continuo; compartilhado com `/applications` |
| workflowDefinitions (legado) | React Query (`['workflowDefinitions']`) via `useApplications` | Longa duracao (staleTime Infinity) |
| Colaborador atual (legado identity) | Derivado em memoria de `useCollaborators() + useAuth()` | Recalculado ao mudar usuario/colaboradores |
| Lista unificada (RequesterUnifiedRequestListItem[]) | `useMemo` em `useRequesterUnifiedRequests` | Recalculado quando qualquer origem muda |
| Item selecionado (detail) | `useState` local em `RequestsV2Page` (`selectedKey`, `selectedOrigin`) | Limpo ao fechar dialog |
| Detalhe v2 | React Query (`['workflows','requester','detail',requestId]`) via `useRequestDetail` (inalterado) | Ativo quando dialog aberto com origin=v2 |
| Detalhe legado | Derivado sincronamente no cliente a partir da lista ja carregada + `adapters/legacy-to-unified-detail` | Recalculado ao abrir dialog |

## 3. Architecture Decisions

### ADR-001: Composicao cliente-side em vez de endpoint unificado

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-14 |
| **Context** | Precisamos exibir chamados legados + v2 na mesma tabela de `/solicitacoes`, mas o legado e v2 tem fontes totalmente distintas (Firestore direto vs endpoint `read/mine`). |

**Choice:** Compor a lista no cliente dentro de um hook novo (`useRequesterUnifiedRequests`), reaproveitando os hooks/contextos existentes como fontes de dados, sem criar endpoint server-side unificado.

**Rationale:**
1. Corte YAGNI explicito do brainstorm/DEFINE: esta iteracao mira limpar o frontend, nao reabrir backend.
2. Os dados ja estao cacheados pelos contextos legados + React Query do v2; agregar cliente-side e barato e determinista.
3. Permite substituir a fonte legada por um endpoint futuro sem alterar o contrato de UI (`RequesterUnifiedRequestListItem`).

**Alternatives Rejected:**
| Alternative | Why Rejected |
|-------------|--------------|
| Estender `/api/workflows/read/mine` para incluir legado | Reabre backend, aumenta escopo, sem ganho para esta iteracao |
| Migrar legado para v2 antes da unificacao | Esforco desproporcional; existe corte W3 no DEFINE |

**Consequences:**
- Positivo: entrega incremental, menor risco, sem mudancas em Cloud Functions/Rules.
- Positivo: contrato `RequesterUnifiedRequestListItem` fica como ponto de extensao para o futuro endpoint.
- Negativo: mantem dependencia transitoria de `useWorkflows()` / `useApplications()` enquanto nao ha unificacao server-side.

---

### ADR-002: Dono da UI e o modulo novo — helpers legados reconstruidos

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-14 |
| **Context** | Hoje a logica de derivacao (status label, SLA, anexos, timeline) do legado vive dentro dos componentes visuais `MyRequests.tsx` e `RequestDetailsModal.tsx`. Importar esses componentes manteria `/solicitacoes` acoplada ao desenho antigo e impediria limpeza futura. |

**Choice:** Reconstruir helpers puros no modulo novo (`src/lib/workflows/requester/legacy/`) e adapters (`src/lib/workflows/requester/adapters/`). Zero imports de `src/components/applications/*` dentro de `src/components/workflows/requester/*`.

**Rationale:**
1. Atende o criterio mensuravel do DEFINE ("grep estatico: nenhum import do legado no modulo novo").
2. Transforma logica hoje embutida em JSX em funcoes puras testaveis por fixture.
3. Desbloqueia remocao futura de `MyRequests.tsx` e `RequestDetailsModal.tsx` (Could C2).

**Alternatives Rejected:**
| Alternative | Why Rejected |
|-------------|--------------|
| Importar `RequestDetailsModal` como subcomponente | Aumenta acoplamento e dificulta limpeza |
| Extrair helpers para `src/components/applications/` e importar de la | Ainda cria dependencia inversa modulo novo -> legado |

**Consequences:**
- Positivo: modulo novo e 100% autossuficiente para a superficie do solicitante.
- Positivo: helpers testaveis isoladamente.
- Negativo: duplicacao temporaria ate o legado ser removido (aceito explicitamente).

---

### ADR-003: Discriminante `origin` + view-model unificado

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-14 |
| **Context** | Legado e v2 tem contratos diferentes (`WorkflowRequest` vs `WorkflowReadSummary` / `WorkflowRequestDetailData`). A UI precisa de um unico shape para renderizar lista e detalhe. |

**Choice:** Criar `RequesterUnifiedRequestListItem` e `RequesterUnifiedRequestDetail` como union discriminada por `origin: 'legacy' | 'v2'`. Campos comuns ficam no topo; campos especificos ficam em `raw` tipado por origem.

**Rationale:**
1. Discriminante explicito permite degradacao elegante sem quebrar TypeScript (S1 do DEFINE).
2. `raw` tipado deixa cada componente pedir apenas o que precisa, sem casts amplos.
3. Chave composta `detailKey = \`${origin}:${id}\`` evita colisao entre `requestId` numerico do v2 e `requestId` string do legado.

**Alternatives Rejected:**
| Alternative | Why Rejected |
|-------------|--------------|
| Normalizar tudo em um shape plano sem discriminante | Perde informacao, dificulta detalhe e degradacao elegante |
| Manter duas listas separadas na UI | Viola o requisito M1 de tabela unica |

**Consequences:**
- Positivo: o JSX pode ramificar pontualmente (`if origin === 'legacy' ...`) sem duplicar layout.
- Negativo: consumidores precisam lembrar de checar o discriminante.

---

### ADR-004: Detalhe legado sincrono (sem fetch novo); detalhe v2 continua usando `useRequestDetail`

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-14 |
| **Context** | `useRequestDetail` (v2) busca detalhe em um endpoint server-side quando o dialog abre. Ja o legado tem todos os dados do request (`formData`, `history`, `assignee`) embutidos na lista carregada por `useWorkflows()`. |

**Choice:** O dialog unificado (`RequesterUnifiedRequestDetailDialog`) recebe o item selecionado. Quando `origin === 'v2'`, chama `useRequestDetail(numericRequestId, open)` como hoje. Quando `origin === 'legacy'`, monta `RequesterUnifiedRequestDetail` de forma sincrona a partir do item ja cacheado em `useWorkflows()` + `useApplications()` + `useWorkflowAreas()`, aplicando `legacyRequestToUnifiedDetail`.

**Rationale:**
1. Elimina round-trip desnecessario para o legado (tudo ja foi carregado para montar a lista).
2. Mantem o contrato do v2 intacto (sem alterar hook/endpoint existentes).
3. Torna o componente `RequesterUnifiedRequestDetailDialog` puro sobre um `RequesterUnifiedRequestDetail` ja montado — facil de testar com fixture.

**Alternatives Rejected:**
| Alternative | Why Rejected |
|-------------|--------------|
| Criar endpoint legado `/api/workflows/legacy/detail` | Reabre backend desnecessariamente |
| Mover o fetch v2 tambem para sincrono | V2 nao tem os mesmos campos no read model da lista (progress, attachments, timeline) |

**Consequences:**
- Positivo: dialog legado abre instantaneo.
- Negativo: o adapter legado precisa lidar com `formData`/`history` potencialmente corrompidos (tratado com degradacao elegante).

---

### ADR-005: Loading/error unificado em 4 estados explicitos, baseado em disponibilidade real

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-14 |
| **Context** | M7 exige que a secao nao mostre lista parcial silenciosa. Como temos 2 fontes (legado sincrono via context + v2 assincrono via React Query), precisamos de uma maquina de estados clara. O legado nao expoe `error` estruturado hoje, entao a decisao precisa se basear no que o hook realmente consegue observar: loading, erro do v2, identidade legada resolvida e disponibilidade real de itens legados. |

**Choice:** `useRequesterUnifiedRequests` expoe `status: 'loading' | 'error' | 'partial' | 'success'`. A decisao do status usa disponibilidade real:

- `loading`: ainda nao ha snapshot suficiente para decidir a lista final.
- `success`: v2 OK e legado resolvido com sucesso (com itens ou vazio legitimo), sem erro no v2.
- `partial`: v2 falhou, mas existe ao menos um item legado disponivel para exibicao.
- `error`: v2 falhou e nao existe nenhum item legado disponivel para sustentar a tabela.

**Rationale:**
1. Explicita no contrato do hook o comportamento esperado pela UI (testavel).
2. Reflete a realidade atual: o legado nao expoe `error`, entao nao faz sentido modelar um `partial` apenas por flags abstratas.
3. Permite degradacao elegante para S5 (identidade legada nao resolvida = origem legada vira `[]`, o que nao sustenta `partial` sozinha).
4. Separa "erro tecnico do v2" de "usuario simplesmente nao tem item legado".

**Alternatives Rejected:**
| Alternative | Why Rejected |
|-------------|--------------|
| Retornar apenas `isLoading / error` booleanos | Perde o caso `partial` e forca UI a decidir heuristicamente |

**Consequences:**
- Positivo: testes do hook cobrem todos os estados deterministicamente.
- Positivo: elimina falso `partial` em cenarios sem nenhum item disponivel para renderizar.
- Negativo: a definicao de `partial` depende de disponibilidade material de itens legados.

---

### ADR-006: Ordenacao deterministica por `lastUpdatedAt` desc com tiebreakers

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-14 |
| **Context** | Legado usa ISO strings; v2 usa Firestore `Timestamp` / `TimestampLike`. Ordenacao naive pode ser instavel quando dois itens tem o mesmo instante. |

**Choice:** Normalizar todos os timestamps em `Date` (via `normalizeReadTimestamp`) e ordenar por: (1) `lastUpdatedAtMs desc`, (2) `submittedAtMs desc`, (3) `origin` (v2 antes de legacy), (4) `detailKey` ascendente.

**Rationale:**
1. Cobre M6 (determinismo mesmo com timestamps iguais).
2. `origin` como tiebreaker preserva preferencia visual do v2 em empates.
3. `detailKey` como ultimo criterio garante total ordering estavel.

**Alternatives Rejected:**
| Alternative | Why Rejected |
|-------------|--------------|
| Ordenar so por `lastUpdatedAt` | Nao-deterministico em empates |

**Consequences:**
- Positivo: snapshots de teste estaveis.
- Negativo: comparator um pouco mais verboso (trivial).

## 4. File Manifest

### Execution Order
| Phase | Files | Agent |
|-------|-------|-------|
| 1. Types | `unified-types.ts` | @react-frontend-developer |
| 2. Pure helpers (legacy) | `legacy/*.ts` | @react-frontend-developer |
| 3. Adapters | `adapters/*.ts` | @react-frontend-developer |
| 4. Hook composto | `use-requester-unified-requests.ts` | @react-frontend-developer |
| 5. UI (secao + dialog unificado) | `MyRequestsV2Section.tsx`, `RequesterUnifiedRequestDetailDialog.tsx`, `RequestsV2Page.tsx` | @react-frontend-developer |
| 6. Testes | fixtures, unit tests de helpers/adapters/hook/UI | @react-frontend-developer |
| 7. Firestore/Backend | N/A (inalterado) | @firebase-specialist (validacao leve: confirmar que `firestore.rules` nao precisa mudar) |

### Detailed Manifest

| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | `src/lib/workflows/requester/unified-types.ts` | Create | Tipos `RequesterUnifiedRequestListItem` e `RequesterUnifiedRequestDetail` com discriminante `origin` | @react-frontend-developer | - |
| 2 | `src/lib/workflows/requester/legacy/derive-legacy-workflow-name.ts` | Create | Resolve `workflowName` a partir de `request.type` + `workflowDefinitions` | @react-frontend-developer | #1 |
| 3 | `src/lib/workflows/requester/legacy/derive-legacy-status-label.ts` | Create | Label de status legado via `definition.statuses` | @react-frontend-developer | #1 |
| 4 | `src/lib/workflows/requester/legacy/derive-legacy-area.ts` | Create | Resolve `areaId` via `definition.areaId` e `areaLabel` via lookup oficial de `workflowAreas` | @react-frontend-developer | #1 |
| 5 | `src/lib/workflows/requester/legacy/derive-legacy-expected-completion.ts` | Create | Calcula previsao SLA legado (`defaultSlaDays` + `slaRules`) — logica portada de `MyRequests.getSlaDate` | @react-frontend-developer | #1 |
| 6 | `src/lib/workflows/requester/legacy/derive-legacy-attachments.ts` | Create | Extrai anexos a partir de campos tipo `file` no `formData` | @react-frontend-developer | #1 |
| 7 | `src/lib/workflows/requester/legacy/derive-legacy-timeline.ts` | Create | Converte `request.history` + definicao em timeline unificada | @react-frontend-developer | #1 |
| 8 | `src/lib/workflows/requester/legacy/resolve-legacy-identity.ts` | Create | Dado `user` + `collaborators`, retorna `{ id3a \| null, resolved: boolean }` | @react-frontend-developer | - |
| 9 | `src/lib/workflows/requester/adapters/legacy-to-unified-list-item.ts` | Create | `legacyRequestToUnifiedListItem(request, definition, workflowArea)` | @react-frontend-developer | #1-#7 |
| 10 | `src/lib/workflows/requester/adapters/legacy-to-unified-detail.ts` | Create | `legacyRequestToUnifiedDetail(request, definition, workflowArea)` | @react-frontend-developer | #1-#7 |
| 11 | `src/lib/workflows/requester/adapters/v2-to-unified-list-item.ts` | Create | `v2ReadSummaryToUnifiedListItem(summary)` | @react-frontend-developer | #1 |
| 12 | `src/lib/workflows/requester/adapters/v2-to-unified-detail.ts` | Create | `v2ReadDetailToUnifiedDetail(detail)` (wrapper fino que embala `WorkflowRequestDetailData` em `RequesterUnifiedRequestDetail` com `origin='v2'`) | @react-frontend-developer | #1 |
| 13 | `src/lib/workflows/requester/unified-sort.ts` | Create | Comparator deterministico por `lastUpdatedAt desc -> submittedAt desc -> origin -> detailKey` | @react-frontend-developer | #1 |
| 14 | `src/hooks/use-requester-unified-requests.ts` | Create | Hook que combina v2 + legado, resolve identidade, consulta `workflowAreas`, ordena, expoe estados baseados em disponibilidade real | @react-frontend-developer | #9, #11, #13 |
| 15 | `src/components/workflows/requester/MyRequestsV2Section.tsx` | Modify | Consumir `useRequesterUnifiedRequests`; tabela unificada; handler `(origin, key) => void` | @react-frontend-developer | #14 |
| 16 | `src/components/workflows/requester/RequesterUnifiedRequestDetailDialog.tsx` | Create | Dialog unificado que renderiza `RequesterUnifiedRequestDetail` de ambas origens. Para v2 usa `useRequestDetail`; para legacy usa adapter sincrono | @react-frontend-developer | #10, #12 |
| 17 | `src/components/workflows/requester/RequestsV2Page.tsx` | Modify | Ajustar wiring: `selectedKey`/`selectedOrigin`; trocar `MyRequestDetailDialog` por `RequesterUnifiedRequestDetailDialog` | @react-frontend-developer | #15, #16 |
| 18 | `src/components/workflows/requester/MyRequestDetailDialog.tsx` | Keep (no import from outside) | Mantido como referencia de estilo — mas `RequesterUnifiedRequestDetailDialog` deve reutilizar os mesmos subcomponentes (`RequestFormData`, `RequestProgress`, `RequestTimeline`, `RequestAttachments`, `RequesterRequestSummaryHeader`). Candidato a remocao futura | @react-frontend-developer | - |
| 19 | `src/lib/workflows/requester/legacy/__tests__/fixtures.ts` | Create | Fixtures reais de `WorkflowRequest` + `WorkflowDefinition` para tests | @react-frontend-developer | - |
| 20 | `src/lib/workflows/requester/legacy/__tests__/derive-legacy-*.test.ts` | Create | Testes unitarios dos 6 helpers | @react-frontend-developer | #2-#7, #19 |
| 21 | `src/lib/workflows/requester/adapters/__tests__/legacy-to-unified-list-item.test.ts` | Create | Testes do adapter list-item | @react-frontend-developer | #9, #19 |
| 22 | `src/lib/workflows/requester/adapters/__tests__/legacy-to-unified-detail.test.ts` | Create | Testes do adapter detail | @react-frontend-developer | #10, #19 |
| 23 | `src/lib/workflows/requester/__tests__/unified-sort.test.ts` | Create | Testes do comparator (empates, timestamps nulos) | @react-frontend-developer | #13 |
| 24 | `src/hooks/__tests__/use-requester-unified-requests.test.ts` | Create | Testes do hook (loading / error / partial / success / identidade nao resolvida) | @react-frontend-developer | #14, #19 |
| 25 | `src/components/workflows/requester/__tests__/MyRequestsV2Section.test.tsx` | Modify | Cobrir cenario unificado: legado + v2 na mesma tabela; ordenacao; estado partial | @react-frontend-developer | #15, #24 |
| 26 | `src/components/workflows/requester/__tests__/RequesterUnifiedRequestDetailDialog.test.tsx` | Create | Renderiza detalhe legado e detalhe v2 | @react-frontend-developer | #16 |
| 27 | `src/components/applications/MyRequests.tsx` | Keep | Intacto nesta iteracao (limpeza futura) | - | - |
| 28 | `src/components/applications/RequestDetailsModal.tsx` | Keep | Intacto nesta iteracao (limpeza futura) | - | - |

## 5. Code Patterns

### Pattern 1: Unified Types (`src/lib/workflows/requester/unified-types.ts`)

```typescript
import type { WorkflowReadSummary, WorkflowRequestDetailData } from '@/lib/workflows/read/types';
import type { WorkflowRequest } from '@/contexts/WorkflowsContext';
import type { WorkflowDefinition } from '@/contexts/ApplicationsContext';
import type { WorkflowArea } from '@/contexts/WorkflowAreasContext';

/** Discriminante que diferencia origens do mesmo shape unificado. */
export type RequesterUnifiedOrigin = 'legacy' | 'v2';

/**
 * Chave estavel de selecao. Sempre `${origin}:${id}` para evitar colisao
 * entre requestId numerico v2 e requestId string legado.
 */
export type RequesterUnifiedDetailKey = `legacy:${string}` | `v2:${number}`;

/**
 * View-model minimo da tabela "Minhas Solicitacoes" unificada.
 * Campos `*Label` sao sempre strings prontas para exibicao (degradacao
 * elegante: `'-'` em vez de undefined).
 */
export interface RequesterUnifiedRequestListItemBase {
  origin: RequesterUnifiedOrigin;
  detailKey: RequesterUnifiedDetailKey;
  /** Id exibido em `#`. Para v2 e numero; para legado e string. */
  displayRequestId: string;
  workflowName: string;
  statusLabel: string;
  statusVariant: 'default' | 'secondary' | 'destructive' | 'outline';
  expectedCompletionLabel: string;
  /** Date normalizada para ordenacao / formatacao na UI. Pode ser `null`. */
  expectedCompletionAt: Date | null;
  submittedAt: Date | null;
  lastUpdatedAt: Date | null;
}

export interface RequesterUnifiedV2ListItem extends RequesterUnifiedRequestListItemBase {
  origin: 'v2';
  detailKey: `v2:${number}`;
  requestId: number;
  raw: WorkflowReadSummary;
}

export interface RequesterUnifiedLegacyListItem extends RequesterUnifiedRequestListItemBase {
  origin: 'legacy';
  detailKey: `legacy:${string}`;
  requestDocId: string;
  raw: {
    request: WorkflowRequest;
    definition: WorkflowDefinition | null;
    workflowArea: WorkflowArea | null;
  };
}

export type RequesterUnifiedRequestListItem =
  | RequesterUnifiedV2ListItem
  | RequesterUnifiedLegacyListItem;

/** Detalhe unificado para o dialog. */
export interface RequesterUnifiedRequestDetailSummary {
  requesterName: string;
  workflowName: string;
  displayRequestId: string;
  submittedAt: Date | null;
  lastUpdatedAt: Date | null;
  responsibleName: string | null;
  openedInLabel: string;
  statusLabel: string;
  currentStepName: string | null;
}

export interface RequesterUnifiedRequestDetailField {
  fieldId: string;
  label: string;
  value: unknown;
  type: string; // 'text' | 'textarea' | 'select' | 'date' | 'date-range' | 'file' | outros
}

export interface RequesterUnifiedRequestDetailAttachment {
  fieldId: string;
  label: string;
  url: string;
}

export interface RequesterUnifiedRequestDetailTimelineItem {
  label: string;
  timestamp: Date | null;
  userName: string;
  notes?: string;
}

export interface RequesterUnifiedRequestDetailBase {
  origin: RequesterUnifiedOrigin;
  detailKey: RequesterUnifiedDetailKey;
  summary: RequesterUnifiedRequestDetailSummary;
  fields: RequesterUnifiedRequestDetailField[];
  attachments: RequesterUnifiedRequestDetailAttachment[];
  timeline: RequesterUnifiedRequestDetailTimelineItem[];
  /** Para v2 existe; para legado e `null` (degradacao elegante). */
  progress: WorkflowRequestDetailData['progress'] | null;
}

export interface RequesterUnifiedV2Detail extends RequesterUnifiedRequestDetailBase {
  origin: 'v2';
  raw: WorkflowRequestDetailData;
}

export interface RequesterUnifiedLegacyDetail extends RequesterUnifiedRequestDetailBase {
  origin: 'legacy';
  raw: {
    request: WorkflowRequest;
    definition: WorkflowDefinition | null;
    workflowArea: WorkflowArea | null;
  };
}

export type RequesterUnifiedRequestDetail =
  | RequesterUnifiedV2Detail
  | RequesterUnifiedLegacyDetail;
```

---

### Pattern 2: Pure helpers — `deriveLegacyStatusLabel` + `deriveLegacyExpectedCompletion`

```typescript
// src/lib/workflows/requester/legacy/derive-legacy-status-label.ts
import type { WorkflowRequest } from '@/contexts/WorkflowsContext';
import type { WorkflowDefinition } from '@/contexts/ApplicationsContext';

/**
 * Resolve o label humano do status de um request legado a partir da
 * definicao do workflow. Usa `request.status` como fallback quando a
 * definicao nao estiver disponivel.
 *
 * Espelha a logica que hoje vive inline em `src/components/applications/MyRequests.tsx`
 * (funcao `getStatusLabel`) e em `RequestDetailsModal.tsx` (render do historico).
 */
export function deriveLegacyStatusLabel(
  request: Pick<WorkflowRequest, 'status'>,
  definition: Pick<WorkflowDefinition, 'statuses'> | null | undefined,
): string {
  if (!definition) return request.status ?? '-';
  const match = definition.statuses?.find((s) => s.id === request.status);
  return match?.label ?? request.status ?? '-';
}
```

```typescript
// src/lib/workflows/requester/legacy/derive-legacy-expected-completion.ts
import { addBusinessDays, format, parseISO, isValid } from 'date-fns';
import type { WorkflowRequest } from '@/contexts/WorkflowsContext';
import type { WorkflowDefinition, SlaRule } from '@/contexts/ApplicationsContext';

export interface DeriveLegacyExpectedCompletionResult {
  expectedCompletionAt: Date | null;
  expectedCompletionLabel: string;
}

/**
 * Porta direta da funcao `getSlaDate` de `MyRequests.tsx` para um helper puro.
 * Retorna sempre `{ expectedCompletionAt, expectedCompletionLabel }`, com
 * degradacao elegante (`null` / `'-'`) quando nao e possivel calcular.
 */
export function deriveLegacyExpectedCompletion(
  request: Pick<WorkflowRequest, 'submittedAt' | 'formData'>,
  definition: Pick<WorkflowDefinition, 'defaultSlaDays' | 'slaRules'> | null | undefined,
): DeriveLegacyExpectedCompletionResult {
  if (!definition) return { expectedCompletionAt: null, expectedCompletionLabel: '-' };

  let slaDays: number | undefined = definition.defaultSlaDays;
  const rules: SlaRule[] = definition.slaRules ?? [];

  for (const rule of rules) {
    const value = request.formData?.[rule.field];
    if (value != null && String(value) === rule.value) {
      slaDays = rule.days;
      break;
    }
  }

  if (typeof slaDays !== 'number') {
    return { expectedCompletionAt: null, expectedCompletionLabel: '-' };
  }

  const submissionDate = typeof request.submittedAt === 'string'
    ? parseISO(request.submittedAt)
    : null;

  if (!submissionDate || !isValid(submissionDate)) {
    return { expectedCompletionAt: null, expectedCompletionLabel: '-' };
  }

  const slaDate = addBusinessDays(submissionDate, slaDays);
  return {
    expectedCompletionAt: slaDate,
    expectedCompletionLabel: format(slaDate, 'dd/MM/yyyy'),
  };
}
```

---

### Pattern 3: Attachments helper (extrai campos `file` do `formData`)

```typescript
// src/lib/workflows/requester/legacy/derive-legacy-attachments.ts
import type { WorkflowRequest } from '@/contexts/WorkflowsContext';
import type { WorkflowDefinition } from '@/contexts/ApplicationsContext';
import type { RequesterUnifiedRequestDetailAttachment } from '../unified-types';

/**
 * Extrai anexos de um request legado. O legado guarda o URL diretamente
 * em `formData[fieldId]` quando o campo e do tipo `'file'`.
 *
 * Degradacao elegante: quando a definicao nao esta disponivel, varre
 * `formData` procurando strings que se pareçam com URL e usa `fieldId`
 * como label.
 */
export function deriveLegacyAttachments(
  request: Pick<WorkflowRequest, 'formData'>,
  definition: Pick<WorkflowDefinition, 'fields'> | null | undefined,
): RequesterUnifiedRequestDetailAttachment[] {
  const formData = request.formData ?? {};
  const attachments: RequesterUnifiedRequestDetailAttachment[] = [];

  if (definition?.fields?.length) {
    for (const field of definition.fields) {
      if (field.type !== 'file') continue;
      const url = formData[field.id];
      if (typeof url !== 'string' || !url.trim()) continue;
      attachments.push({ fieldId: field.id, label: field.label, url });
    }
    return attachments;
  }

  // Fallback sem definicao
  for (const [key, value] of Object.entries(formData)) {
    if (typeof value !== 'string') continue;
    if (!/^https?:\/\//i.test(value)) continue;
    attachments.push({ fieldId: key, label: key, url: value });
  }
  return attachments;
}
```

---

### Pattern 4: Adapter legacy -> unified list item

```typescript
// src/lib/workflows/requester/adapters/legacy-to-unified-list-item.ts
import type { WorkflowRequest } from '@/contexts/WorkflowsContext';
import type { WorkflowDefinition } from '@/contexts/ApplicationsContext';
import { deriveLegacyWorkflowName } from '../legacy/derive-legacy-workflow-name';
import { deriveLegacyStatusLabel } from '../legacy/derive-legacy-status-label';
import { deriveLegacyExpectedCompletion } from '../legacy/derive-legacy-expected-completion';
import type { RequesterUnifiedLegacyListItem } from '../unified-types';

function parseIsoSafe(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function legacyRequestToUnifiedListItem(
  request: WorkflowRequest,
  definition: WorkflowDefinition | null,
): RequesterUnifiedLegacyListItem {
  const { expectedCompletionAt, expectedCompletionLabel } =
    deriveLegacyExpectedCompletion(request, definition);

  return {
    origin: 'legacy',
    detailKey: `legacy:${request.id}`,
    requestDocId: request.id,
    displayRequestId: request.requestId ?? request.id,
    workflowName: deriveLegacyWorkflowName(request, definition),
    statusLabel: deriveLegacyStatusLabel(request, definition),
    statusVariant: 'secondary',
    expectedCompletionAt,
    expectedCompletionLabel,
    submittedAt: parseIsoSafe(request.submittedAt),
    lastUpdatedAt: parseIsoSafe(request.lastUpdatedAt),
    raw: { request, definition },
  };
}
```

---

### Pattern 5: Hook unificado (`src/hooks/use-requester-unified-requests.ts`)

```typescript
'use client';

import * as React from 'react';
import { useMyRequests } from '@/hooks/use-requester-workflows';
import { useWorkflows } from '@/contexts/WorkflowsContext';
import { useApplications } from '@/contexts/ApplicationsContext';
import { useWorkflowAreas } from '@/contexts/WorkflowAreasContext';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { useAuth } from '@/contexts/AuthContext';
import { resolveLegacyIdentity } from '@/lib/workflows/requester/legacy/resolve-legacy-identity';
import { legacyRequestToUnifiedListItem } from '@/lib/workflows/requester/adapters/legacy-to-unified-list-item';
import { v2ReadSummaryToUnifiedListItem } from '@/lib/workflows/requester/adapters/v2-to-unified-list-item';
import { compareUnifiedListItems } from '@/lib/workflows/requester/unified-sort';
import type { RequesterUnifiedRequestListItem } from '@/lib/workflows/requester/unified-types';

export type RequesterUnifiedRequestsStatus = 'loading' | 'error' | 'partial' | 'success';

export interface RequesterUnifiedRequestsResult {
  items: RequesterUnifiedRequestListItem[];
  status: RequesterUnifiedRequestsStatus;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  legacyIdentityResolved: boolean;
}

/**
 * Combina chamados v2 (via useMyRequests) e chamados legados (via
 * useWorkflows + useApplications), filtra legado pelo usuario corrente
 * (useAuth + useCollaborators), normaliza para RequesterUnifiedRequestListItem
 * e ordena deterministicamente.
 *
 * Estados:
 * - loading: ainda nao ha snapshot suficiente para decidir a lista final.
 * - error: v2 falhou e nao existe nenhum item legado disponivel.
 * - partial: v2 falhou, mas existe ao menos um item legado para exibir.
 * - success: v2 OK; legado pode ter itens, estar vazio legitimamente, ou
 *   estar indisponivel por identidade nao resolvida.
 */
export function useRequesterUnifiedRequests(): RequesterUnifiedRequestsResult {
  const { user } = useAuth();
  const { collaborators } = useCollaborators();
  const { workflowDefinitions, loading: defsLoading } = useApplications();
  const { workflowAreas, loading: areasLoading } = useWorkflowAreas();
  const { requests: legacyRequests, loading: legacyLoading } = useWorkflows();

  const v2Query = useMyRequests();

  const legacyIdentity = React.useMemo(
    () => resolveLegacyIdentity(user, collaborators),
    [user, collaborators],
  );

  const legacyItems = React.useMemo<RequesterUnifiedRequestListItem[]>(() => {
    if (legacyLoading || defsLoading || areasLoading) return [];
    if (!legacyIdentity.resolved || !legacyIdentity.id3a) return [];

    const mine = legacyRequests.filter(
      (req) => req.submittedBy?.userId === legacyIdentity.id3a,
    );
    return mine.map((req) => {
      const definition =
        workflowDefinitions.find((d) => d.name === req.type) ?? null;
      const workflowArea =
        definition ? workflowAreas.find((area) => area.id === definition.areaId) ?? null : null;
      return legacyRequestToUnifiedListItem(req, definition, workflowArea);
    });
  }, [legacyLoading, defsLoading, areasLoading, legacyIdentity, legacyRequests, workflowDefinitions, workflowAreas]);

  const v2Items = React.useMemo<RequesterUnifiedRequestListItem[]>(() => {
    const summaries = v2Query.data?.items ?? [];
    return summaries.map((s) => v2ReadSummaryToUnifiedListItem(s));
  }, [v2Query.data]);

  const legacyStillLoading = legacyLoading || defsLoading || areasLoading;
  const v2StillLoading = v2Query.isLoading;
  const v2Errored = v2Query.isError;
  const hasLegacyItems = legacyItems.length > 0;

  let status: RequesterUnifiedRequestsStatus;
  if (legacyStillLoading || v2StillLoading) {
    status = 'loading';
  } else if (v2Errored && hasLegacyItems) {
    status = 'partial';
  } else if (v2Errored) {
    status = 'error';
  } else {
    status = 'success';
  }

  const items = React.useMemo(() => {
    const merged = [...v2Items, ...legacyItems];
    merged.sort(compareUnifiedListItems);
    return merged;
  }, [v2Items, legacyItems]);

  return {
    items,
    status,
    isLoading: status === 'loading',
    isError: status === 'error',
    error: v2Query.error ?? null,
    legacyIdentityResolved: legacyIdentity.resolved,
  };
}
```

---

### Pattern 6: Comparator deterministico

```typescript
// src/lib/workflows/requester/unified-sort.ts
import type { RequesterUnifiedRequestListItem } from './unified-types';

function toMs(date: Date | null): number {
  return date ? date.getTime() : 0;
}

/**
 * Ordenacao deterministica:
 *  1. lastUpdatedAt desc
 *  2. submittedAt desc
 *  3. origin (v2 antes de legacy)
 *  4. detailKey ascendente
 */
export function compareUnifiedListItems(
  a: RequesterUnifiedRequestListItem,
  b: RequesterUnifiedRequestListItem,
): number {
  const byUpdated = toMs(b.lastUpdatedAt) - toMs(a.lastUpdatedAt);
  if (byUpdated !== 0) return byUpdated;

  const bySubmitted = toMs(b.submittedAt) - toMs(a.submittedAt);
  if (bySubmitted !== 0) return bySubmitted;

  const originRank = (o: 'legacy' | 'v2') => (o === 'v2' ? 0 : 1);
  const byOrigin = originRank(a.origin) - originRank(b.origin);
  if (byOrigin !== 0) return byOrigin;

  return a.detailKey.localeCompare(b.detailKey);
}
```

---

### Pattern 7: Dialog unificado — decisao por `origin`

```typescript
// src/components/workflows/requester/RequesterUnifiedRequestDetailDialog.tsx
'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useRequestDetail } from '@/hooks/use-requester-workflows';
import { RequesterRequestSummaryHeader } from './RequesterRequestSummaryHeader';
import { RequestFormData } from '@/components/workflows/management/RequestFormData';
import { RequestProgress } from '@/components/workflows/management/RequestProgress';
import { RequestTimeline } from '@/components/workflows/management/RequestTimeline';
import { RequestAttachments } from '@/components/workflows/management/RequestAttachments';
import { legacyRequestToUnifiedDetail } from '@/lib/workflows/requester/adapters/legacy-to-unified-detail';
import { v2ReadDetailToUnifiedDetail } from '@/lib/workflows/requester/adapters/v2-to-unified-detail';
import type {
  RequesterUnifiedLegacyListItem,
  RequesterUnifiedV2ListItem,
  RequesterUnifiedRequestDetail,
} from '@/lib/workflows/requester/unified-types';

type Props =
  | {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      selected: null;
      areaLabelById?: Map<string, string>;
    }
  | {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      selected: RequesterUnifiedV2ListItem | RequesterUnifiedLegacyListItem;
      areaLabelById?: Map<string, string>;
    };

export function RequesterUnifiedRequestDetailDialog(props: Props) {
  const { open, onOpenChange, selected, areaLabelById } = props;

  // `areaLabelById` deve vir de `workflowAreas`, nao do catalogo requester v2.
  // Isso garante cobertura de labels amigaveis mesmo para areas apenas legadas.
  // V2 precisa de fetch; legacy e sincrono
  const v2RequestId =
    selected && selected.origin === 'v2' ? selected.requestId : null;
  const v2Query = useRequestDetail(v2RequestId, open && selected?.origin === 'v2');

  const unifiedDetail = React.useMemo<RequesterUnifiedRequestDetail | null>(() => {
    if (!selected) return null;

    if (selected.origin === 'legacy') {
      return legacyRequestToUnifiedDetail(
        selected.raw.request,
        selected.raw.definition,
        selected.raw.workflowArea ?? null,
      );
    }

    const source = v2Query.stableData ?? v2Query.data;
    if (!source) return null;
    return v2ReadDetailToUnifiedDetail(source, areaLabelById);
  }, [selected, v2Query.data, v2Query.stableData, areaLabelById]);

  const isV2Loading =
    selected?.origin === 'v2' && v2Query.isLoading && !unifiedDetail;
  const isV2BlockingError =
    selected?.origin === 'v2' && v2Query.isError && !v2Query.hasStableData;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onOpenChange(false)}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>
            {unifiedDetail
              ? `Solicitacao #${unifiedDetail.summary.displayRequestId} - ${unifiedDetail.summary.workflowName}`
              : 'Detalhe da solicitacao'}
          </DialogTitle>
          <DialogDescription>
            {unifiedDetail
              ? `${unifiedDetail.summary.workflowName} - status ${unifiedDetail.summary.statusLabel}.`
              : 'Visualizacao read-only do chamado do solicitante.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(92vh-146px)]">
          <div className="space-y-6 px-6 py-5">
            {isV2Loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-sm text-muted-foreground">Carregando detalhe...</span>
              </div>
            ) : null}

            {isV2BlockingError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nao foi possivel carregar os detalhes desta solicitacao.
                </AlertDescription>
              </Alert>
            ) : null}

            {unifiedDetail ? (
              <>
                <RequesterRequestSummaryHeader
                  requesterName={unifiedDetail.summary.requesterName}
                  submittedAt={unifiedDetail.summary.submittedAt}
                  workflowName={unifiedDetail.summary.workflowName}
                  lastUpdatedAt={unifiedDetail.summary.lastUpdatedAt}
                  responsibleName={unifiedDetail.summary.responsibleName}
                  openedInLabel={unifiedDetail.summary.openedInLabel}
                />
                <RequestFormData formData={{ fields: unifiedDetail.fields, extraFields: [] } as any} />
                {unifiedDetail.progress ? (
                  <RequestProgress progress={unifiedDetail.progress as any} />
                ) : null}
                <RequestTimeline timeline={unifiedDetail.timeline as any} />
                <RequestAttachments attachments={unifiedDetail.attachments as any} />
              </>
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
```

> **Nota:** O dialog reutiliza os mesmos subcomponentes de apresentacao do v2 (`RequestFormData`, `RequestProgress`, `RequestTimeline`, `RequestAttachments`). Os casts `as any` (ja existentes no `MyRequestDetailDialog` atual) permanecem como ponte de tipagem temporaria. Quando houver divergencia estrutural de campos, os adapters normalizam para `fields[]` / `attachments[]` / `timeline[]` ja compativeis com esses componentes.

---

### Pattern 8: Secao unificada usando o hook

```typescript
// src/components/workflows/requester/MyRequestsV2Section.tsx  (modificado)
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileClock, Inbox, Eye, Timer, AlertCircle } from 'lucide-react';
import { useRequesterUnifiedRequests } from '@/hooks/use-requester-unified-requests';
import type { RequesterUnifiedRequestListItem } from '@/lib/workflows/requester/unified-types';

type Props = {
  onSelectRequest: (item: RequesterUnifiedRequestListItem) => void;
};

export function MyRequestsV2Section({ onSelectRequest }: Props) {
  const { items, status } = useRequesterUnifiedRequests();

  const header = (
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <FileClock className="h-6 w-6" />
        Minhas Solicitacoes
      </CardTitle>
      <CardDescription>Acompanhe o status das suas solicitacoes aqui.</CardDescription>
    </CardHeader>
  );

  if (status === 'loading') {
    return (
      <Card>
        {header}
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

  if (status === 'error') {
    return (
      <Card>
        {header}
        <CardContent>
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="text-sm text-destructive">
              Nao foi possivel carregar suas solicitacoes.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {header}
      <CardContent className="space-y-3">
        {status === 'partial' ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Algumas solicitacoes podem estar desatualizadas. Exibindo dados disponiveis.
            </AlertDescription>
          </Alert>
        ) : null}

        {items.length === 0 ? (
          <div className="text-center py-10 px-6 border-2 border-dashed rounded-lg">
            <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-foreground">Nenhuma solicitacao encontrada</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Voce ainda nao fez nenhuma solicitacao. Inicie uma nos cards acima.
            </p>
          </div>
        ) : (
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
                {items.map((item) => (
                  <TableRow key={item.detailKey}>
                    <TableCell className="font-mono text-muted-foreground text-xs">
                      {item.displayRequestId}
                    </TableCell>
                    <TableCell className="font-medium">{item.workflowName}</TableCell>
                    <TableCell>
                      <Badge variant={item.statusVariant} className="font-semibold">
                        {item.statusLabel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.expectedCompletionAt ? (
                        <span className="flex items-center gap-1.5 text-sm">
                          <Timer className="h-4 w-4 text-muted-foreground" />
                          {item.expectedCompletionLabel}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onSelectRequest(item)}
                        aria-label={`Ver detalhes da solicitacao ${item.displayRequestId}`}
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
        )}
      </CardContent>
    </Card>
  );
}
```

---

### Pattern 9: Wiring em `RequestsV2Page.tsx`

```typescript
// src/components/workflows/requester/RequestsV2Page.tsx (trecho modificado)
const [selectedItem, setSelectedItem] =
  React.useState<RequesterUnifiedRequestListItem | null>(null);
const [showDetailDialog, setShowDetailDialog] = React.useState(false);

const handleSelectRequest = (item: RequesterUnifiedRequestListItem) => {
  setSelectedItem(item);
  setShowDetailDialog(true);
};

// ...

// `areaLabelById` aqui deve ser derivado de `useWorkflowAreas()`, e nao do
// catalogo requester v2. O catalogo pode nao conter todas as areas legadas.

<div className="mt-10">
  <MyRequestsV2Section onSelectRequest={handleSelectRequest} />
</div>

<RequesterUnifiedRequestDetailDialog
  open={showDetailDialog}
  onOpenChange={(isOpen) => {
    if (!isOpen) {
      setShowDetailDialog(false);
      setSelectedItem(null);
    }
  }}
  selected={selectedItem}
  areaLabelById={areaLabelById}
/>
```

---

### Pattern 10: Resolucao de identidade legada (com degradacao S5)

```typescript
// src/lib/workflows/requester/legacy/resolve-legacy-identity.ts
import type { User } from 'firebase/auth';
import type { Collaborator } from '@/contexts/CollaboratorsContext';
import { findCollaboratorByEmail } from '@/lib/email-utils';

export interface LegacyIdentityResolution {
  id3a: string | null;
  resolved: boolean;
}

/**
 * Resolve o id3a do usuario corrente a partir da lista de colaboradores,
 * usando email normalizado (cobre @3ariva <-> @3ainvestimentos).
 *
 * Retorna { resolved: false } quando a identidade nao puder ser resolvida
 * — nesse caso a origem legada contribui com lista vazia, sem quebrar a
 * experiencia do v2.
 */
export function resolveLegacyIdentity(
  user: User | null | undefined,
  collaborators: Collaborator[] | null | undefined,
): LegacyIdentityResolution {
  if (!user || !collaborators?.length) {
    return { id3a: null, resolved: false };
  }
  const match = findCollaboratorByEmail(collaborators, user.email);
  if (!match) return { id3a: null, resolved: false };
  return { id3a: match.id3a, resolved: true };
}
```

## 6. API Contract

Nenhum endpoint novo ou alterado. `GET /api/workflows/read/mine` permanece com o contrato atual. Leitura legada continua via `useWorkflows()` (Firestore client SDK, sem mudanca).

## 7. Database Schema (mudancas)

Nenhuma mudanca no schema. Sem novas colecoes, sem novos campos, sem novos indices, sem alteracao em `firestore.rules` ou `storage.rules`. `cleanDataForFirestore` e `buildStorageFilePath` nao se aplicam (feature read-only cliente-side).

## 8. Testing Strategy

### Unit Tests

| Component | Test |
|-----------|------|
| `deriveLegacyWorkflowName` | Retorna `definition.name` quando existe; fallback em `request.type`; fallback em `'-'` |
| `deriveLegacyStatusLabel` | Label via `definition.statuses`; fallback em `request.status`; `'-'` quando tudo ausente |
| `deriveLegacyArea` | Resolve `areaId` via `definition.areaId`; label via `workflowArea.name`; fallback `'-'` |
| `deriveLegacyExpectedCompletion` | `defaultSlaDays` aplicado; `slaRules` com primeira regra que bate vence; data invalida -> `{ null, '-' }`; sem definicao -> `{ null, '-' }` |
| `deriveLegacyAttachments` | Campos `file` no `formData` viram attachments; fallback sem definicao detecta strings tipo URL; campos vazios ignorados |
| `deriveLegacyTimeline` | `request.history` ordenado desc; label via `definition.statuses`; timestamps normalizados |
| `resolveLegacyIdentity` | `user` null -> `{ null, false }`; email normalizado cruza dominios; nao encontrado -> `{ null, false }` |
| `legacyRequestToUnifiedListItem` | Snapshot contra fixture real; `detailKey = \`legacy:${id}\``; campos `*Label` sempre preenchidos |
| `v2ReadSummaryToUnifiedListItem` | `detailKey = \`v2:${requestId}\``; label/variant derivados do `statusCategory` e `currentStepName` (paridade com `getStatusPresentation` atual) |
| `legacyRequestToUnifiedDetail` | Detalhe legado com `progress: null`; `fields` populados pela definicao; `attachments` extraidos; `timeline` convertida |
| `v2ReadDetailToUnifiedDetail` | Wrapper preserva `progress`, `attachments`, `timeline`; `summary.displayRequestId` em string |
| `compareUnifiedListItems` | Desempate por `submittedAt`; depois por `origin`; depois por `detailKey`; timestamps nulos vao para o fim |

### Integration Tests

| Flow | Test |
|------|------|
| `useRequesterUnifiedRequests` loading | Ambas origens sem dados -> `status === 'loading'`, `items === []` |
| `useRequesterUnifiedRequests` success | v2 OK + legado OK -> `status === 'success'`, itens ordenados por `lastUpdatedAt desc` |
| `useRequesterUnifiedRequests` partial | v2 erro + pelo menos um item legado disponivel -> `status === 'partial'`, itens legados exibidos |
| `useRequesterUnifiedRequests` error | v2 erro + nenhum item legado disponivel (inclusive identidade nao resolvida) -> `status === 'error'` |
| `useRequesterUnifiedRequests` identidade nao resolvida | `legacyIdentityResolved === false`, origem legada vira `[]`, v2 continua renderizando |
| `useRequesterUnifiedRequests` isolamento | Itens legados de outro `submittedBy.userId` nao aparecem na lista do usuario atual |
| `MyRequestsV2Section` | Renderiza linhas de ambas origens; click no botao chama `onSelectRequest` com o item unificado correto |
| `RequesterUnifiedRequestDetailDialog` legacy | Abre sincrono sem chamar `useRequestDetail`; renderiza `RequestFormData`/`RequestTimeline`/`RequestAttachments` a partir do adapter legado |
| `RequesterUnifiedRequestDetailDialog` v2 | Usa `useRequestDetail`; renderiza `RequestProgress` (legado tem `progress: null`, entao nao renderiza) |
| Grep estatico | Script/lint check garante zero imports de `@/components/applications/*` dentro de `src/components/workflows/requester/**` |

Todos os testes usam Jest + Testing Library, seguindo o padrao ja existente em `src/components/workflows/requester/__tests__/`. Mocks de hooks seguem o padrao de `jest.mock('@/hooks/use-requester-workflows', ...)`. Fixtures legadas ficam em `src/lib/workflows/requester/legacy/__tests__/fixtures.ts` e sao derivadas de dados reais capturados durante implementacao.

### Acceptance Tests

```gherkin
Feature: Minhas Solicitacoes unificada em /solicitacoes

Scenario: Solicitante ve chamados legado + v2 na mesma tabela
  GIVEN um solicitante autenticado que tem 2 chamados legados e 3 chamados v2 abertos
  WHEN ele abre /solicitacoes
  THEN a secao "Minhas Solicitacoes" exibe 5 linhas
  AND as linhas estao ordenadas por ultima atualizacao desc
  AND nenhum chamado de outro usuario aparece na lista

Scenario: Detalhe unificado para chamado legado
  GIVEN um solicitante com um chamado legado que contem anexos no formData
  WHEN ele clica no olho de um chamado legado
  THEN abre o mesmo dialog visual usado para chamados v2
  AND o dialog exibe solicitante, tipo, data, status, dados enviados, historico e anexos
  AND o dialog NAO exibe a secao de progress (degradacao elegante)

Scenario: Detalhe unificado para chamado v2
  GIVEN um solicitante com um chamado v2
  WHEN ele clica no olho de um chamado v2
  THEN abre o mesmo dialog visual usado para chamados legados
  AND o dialog exibe summary, formData, progress, timeline e attachments (todas as secoes)

Scenario: Identidade legada nao resolvida
  GIVEN um solicitante cujo email nao casa com nenhum colaborador legado
  WHEN ele abre /solicitacoes
  THEN a secao "Minhas Solicitacoes" exibe apenas os chamados v2
  AND nenhum erro destrutivo e mostrado ao usuario
  AND o hook unificado expoe legacyIdentityResolved === false para diagnostico

Scenario: V2 com erro de rede
  GIVEN que /api/workflows/read/mine retorna 500 para o usuario
  AND o usuario tem 2 chamados legados
  WHEN ele abre /solicitacoes
  THEN a tabela mostra os 2 chamados legados
  AND um alerta avisa que algumas solicitacoes podem estar desatualizadas

Scenario: Independencia do legado (grep estatico)
  GIVEN o codigo do modulo novo de workflows/requester
  WHEN um grep busca imports de src/components/applications/*
  THEN nenhum resultado e encontrado em src/components/workflows/requester/**
```

## 9. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | `git revert` dos commits da feature (lista unificada + dialog unificado + hook + helpers + adapters + tipos) | `git log` confirma revert; `/solicitacoes` volta a mostrar apenas v2 |
| 2 | Verificar que `/applications` continua funcionando | Acessar `/applications`, conferir que `MyRequests.tsx` e `RequestDetailsModal.tsx` renderizam normalmente (eles nao foram tocados) |
| 3 | Verificar build/typecheck | `npm run typecheck && npm run lint && npm run build` |
| 4 | Rodar suite de testes | `npm test` passa |
| 5 | Validar que nenhum dado Firestore foi afetado | Sem mudancas em `workflows` / `workflowDefinitions` / Rules; nenhuma migracao para reverter |

**Metodo rapido:** `git revert {commit-hash}` — como nao ha mudancas de schema nem de backend, o revert e idempotente e seguro. Nenhum feature flag adicional necessario.

## 10. Implementation Checklist

### Pre-Build
- [x] DEFINE document approved (Clarity 15/15)
- [x] Architecture decisions documented (ADR-001..006)
- [x] File manifest complete (28 entradas)
- [x] Code patterns validated against codebase (estilos de `MyRequestsV2Section`, `MyRequestDetailDialog`, `use-requester-workflows`)
- [ ] PM approved scope

### Post-Build
- [ ] Todos os arquivos do manifest criados/modificados
- [ ] `npm run typecheck` passa
- [ ] `npm run lint` passa
- [ ] `npm test` passa (com cobertura dos helpers, adapters, hook e componentes)
- [ ] Grep estatico: `grep -R "from '@/components/applications" src/components/workflows/requester/` retorna vazio
- [ ] Grep estatico: `grep -R "from '@/components/applications" src/lib/workflows/requester/` retorna vazio
- [ ] Validacao manual em `/solicitacoes`: lista mistura legado + v2, ordenacao correta, detalhe abre para ambas origens
- [ ] Validacao manual de paridade de status/SLA contra `/applications` em 3+ chamados legados
- [ ] Teste manual: usuario com identidade legada nao resolvida ainda ve itens v2 normalmente
- [ ] `src/components/applications/MyRequests.tsx` e `RequestDetailsModal.tsx` permanecem intactos (candidato a iteracao futura de limpeza)
- [ ] CLAUDE.md nao precisa de atualizacao (nenhuma nova decisao arquitetural global)

## 11. Specialist Instructions

### For @firebase-specialist
```markdown
Files to modify:
- Nenhum arquivo de backend, Cloud Functions, Firestore Rules ou Storage Rules.

Responsabilidade nesta feature:
- Validar que a leitura legada via `useWorkflows()` / `useApplications()` nao precisa de ajuste em `firestore.rules` (continua amparada pelas regras atuais).
- Confirmar que o endpoint `GET /api/workflows/read/mine` nao precisa de mudancas.
- Sem persistencia nova: `cleanDataForFirestore` e `buildStorageFilePath` nao se aplicam nesta feature.
- Caso o code review identifique necessidade de indice composto no Firestore (nao esperado), escalar.
```

### For @react-frontend-developer
```markdown
Files to create:
- src/lib/workflows/requester/unified-types.ts
- src/lib/workflows/requester/unified-sort.ts
- src/lib/workflows/requester/legacy/derive-legacy-workflow-name.ts
- src/lib/workflows/requester/legacy/derive-legacy-status-label.ts
- src/lib/workflows/requester/legacy/derive-legacy-area.ts
- src/lib/workflows/requester/legacy/derive-legacy-expected-completion.ts
- src/lib/workflows/requester/legacy/derive-legacy-attachments.ts
- src/lib/workflows/requester/legacy/derive-legacy-timeline.ts
- src/lib/workflows/requester/legacy/resolve-legacy-identity.ts
- src/lib/workflows/requester/adapters/legacy-to-unified-list-item.ts
- src/lib/workflows/requester/adapters/legacy-to-unified-detail.ts
- src/lib/workflows/requester/adapters/v2-to-unified-list-item.ts
- src/lib/workflows/requester/adapters/v2-to-unified-detail.ts
- src/hooks/use-requester-unified-requests.ts
- src/components/workflows/requester/RequesterUnifiedRequestDetailDialog.tsx
- Tests: src/lib/workflows/requester/legacy/__tests__/*, src/lib/workflows/requester/adapters/__tests__/*, src/hooks/__tests__/use-requester-unified-requests.test.ts, src/components/workflows/requester/__tests__/RequesterUnifiedRequestDetailDialog.test.tsx

Files to modify:
- src/components/workflows/requester/MyRequestsV2Section.tsx
- src/components/workflows/requester/RequestsV2Page.tsx
- src/components/workflows/requester/__tests__/MyRequestsV2Section.test.tsx

Key requirements:
- Helpers devem ser puros, sem side effects, e seguros para valores `undefined`/`null` do legado.
- Discriminante `origin` obrigatorio no topo dos tipos unificados.
- `detailKey` deve sempre ser `${origin}:${id}` para evitar colisao entre legado/v2.
- Usar `findCollaboratorByEmail` (de `src/lib/email-utils`) para resolver identidade legada — cobre normalizacao @3ariva <-> @3ainvestimentos.
- Ordenacao: NUNCA ordenar somente por `lastUpdatedAt`; sempre aplicar o comparator completo para determinismo.
- Reutilizar os componentes `RequestFormData`, `RequestProgress`, `RequestTimeline`, `RequestAttachments`, `RequesterRequestSummaryHeader` (mesmo shell visual do v2 atual). NAO importar NADA de `src/components/applications/*`.
- `RequesterUnifiedRequestDetailDialog` decide por `origin`: v2 usa `useRequestDetail`; legacy monta sincrono a partir do `selected.raw`.
- Legado nao tem `progress` estruturado: o dialog deve pular o bloco de progress quando `unifiedDetail.progress === null` (degradacao elegante).
- Nunca lancar excecao nos adapters; campos ausentes viram `'-'` / `null`.
- Testes devem cobrir: helpers puros (cada um), adapters (snapshot contra fixtures), hook (4 estados + identidade nao resolvida + isolamento por usuario), componentes (lista unificada e dialog renderizando ambas origens).
- NAO remover `src/components/applications/MyRequests.tsx` nem `RequestDetailsModal.tsx` nesta iteracao (corte explicito do DEFINE).
- NAO adicionar paginacao, filtros ou busca textual (W2).
- Verificar com grep estatico que o modulo novo nao importa nada de `@/components/applications`.
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-14 | design-agent | Initial design based on DEFINE_COMPATIBILIDADE_LEGADO_MINHAS_SOLICITACOES_SOLICITACOES_V2.md |
