# DESIGN: FASE1_FACILITIES_ETAPA4

> Generated: 2026-03-27
> Status: Ready for build
> Scope: Fase 1 / Facilities / Etapa 4 - Workflow 1 com frontend minimo em rota nova
> Base document: `DEFINE_FASE1_FACILITIES_ETAPA4.md`

## 1. Objetivo

Construir a primeira UI real do piloto de Facilities em uma rota nova e autenticada, permitindo operar ponta a ponta o workflow `facilities_manutencao_solicitacoes_gerais` sem depender do frontend legado, sem `WorkflowsContext` e sem leitura direta de Firestore nos arquivos novos da etapa.

Esta etapa cobre:

- rota nova do piloto em `/pilot/facilities`;
- abertura dinamica do workflow 1 via catalogo publicado;
- fila minima do owner com filtros canonicos;
- fila do responsavel em `Atribuicoes e acoes`;
- visao `Minhas solicitacoes` do solicitante;
- detalhe do chamado com `assign`, `finalize` e `archive`;
- camada cliente tipada para consumir apenas as APIs do motor v2.

Esta etapa nao cobre:

- migracao das telas legadas de `/applications`, `/requests` e `/me/tasks`;
- frontend consolidado final da area;
- suporte oficial aos workflows 2 e 3 na mesma release;
- qualquer nova API backend, schema ou indice;
- `requestAction` / `respondAction`.

### Convivencia com producao

O piloto nasce isolado em uma superficie nova do App Router e reaproveita somente:

- autenticacao global do app;
- `ReactQueryProvider`;
- componentes visuais `shadcn/ui`;
- `CollaboratorsContext` como diretorio ja provido pelo shell autenticado.

Nao ha alteracao de comportamento nas telas legadas nem no armazenamento `_v2`.

---

## 2. Fonte de Verdade

Este documento e derivado de:

- [DEFINE_FASE1_FACILITIES_ETAPA4.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DEFINE_FASE1_FACILITIES_ETAPA4.md)
- [DESIGN_FASE1_FACILITIES_ETAPA1.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DESIGN_FASE1_FACILITIES_ETAPA1.md)
- [DESIGN_FASE1_FACILITIES_ETAPA2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DESIGN_FASE1_FACILITIES_ETAPA2.md)
- [DESIGN_FASE1_FACILITIES_ETAPA3.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflows/DESIGN_FASE1_FACILITIES_ETAPA3.md)
- [ROADMAP_FASE1_FACILITIES.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase1_facilities/ROADMAP_FASE1_FACILITIES.md)
- [ROADMAP_ETAPAS_FASE1_FACILITIES.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase1_facilities/ROADMAP_ETAPAS_FASE1_FACILITIES.md)
- [REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md)
- [MAPEAMENTO_ESTADOS_UI_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/MAPEAMENTO_ESTADOS_UI_WORKFLOWS.md)
- [src/app/(app)/layout.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/layout.tsx)
- [src/components/providers/AppProviders.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/providers/AppProviders.tsx)
- [src/contexts/AuthContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/AuthContext.tsx)
- [src/contexts/CollaboratorsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/CollaboratorsContext.tsx)
- [src/app/api/workflows/catalog/[workflowTypeId]/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/catalog/[workflowTypeId]/route.ts)
- [src/app/api/workflows/runtime/requests/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/runtime/requests/route.ts)
- [src/app/api/workflows/runtime/requests/[id]/assign/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/runtime/requests/[id]/assign/route.ts)
- [src/app/api/workflows/runtime/requests/[id]/finalize/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/runtime/requests/[id]/finalize/route.ts)
- [src/app/api/workflows/runtime/requests/[id]/archive/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/runtime/requests/[id]/archive/route.ts)
- [src/app/api/workflows/read/current/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/read/current/route.ts)
- [src/app/api/workflows/read/assignments/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/read/assignments/route.ts)
- [src/app/api/workflows/read/mine/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/read/mine/route.ts)

Em caso de divergencia:

1. prevalece o `DEFINE_FASE1_FACILITIES_ETAPA4.md` para escopo e aceite;
2. depois os contratos reais das APIs ja implementadas nas Etapas 1, 2 e 3;
3. depois este documento para a execucao da Etapa 4;
4. depois os roadmaps da Fase 1 como direcao de sequenciamento.

---

## 3. Decisoes Fechadas da Etapa 4

- a rota nova ficara em `src/app/(app)/pilot/facilities/page.tsx`, herdando a autenticacao do grupo `(app)`;
- a pagina sera composta por um shell client-side proprio, sem criar novo `Context`;
- o server state sera gerenciado com `@tanstack/react-query`, reaproveitando o provider global do app;
- a feature tera uma camada HTTP propria e tipada, com bearer token obtido por `user.getIdToken()`;
- a camada HTTP cliente deve preservar `code`, `message` e `httpStatus` das APIs do motor por meio de um erro tipado proprio;
- os arquivos novos da etapa nao podem importar `WorkflowsContext`, `RequestsContext` nem `firestore-service`;
- os arquivos novos da etapa nao devem importar os tipos server-side de `catalog/types.ts` e `read/types.ts` diretamente em Client Components, para nao acoplar o bundle a `firebase-admin`;
- `CollaboratorsContext` pode ser lido apenas como diretorio de usuarios para o seletor de responsavel e enriquecimento visual;
- a unidade principal de operacao sera um dialog de detalhes, e nao a linha da lista;
- a etapa nasce fixa em `workflowTypeId = facilities_manutencao_solicitacoes_gerais`, mas a camada cliente interna aceitara `workflowTypeId` como parametro para facilitar as Etapas 5 e 6;
- as query keys da feature devem incluir `user.uid` para isolar cache por sessao autenticada;
- a query de catalogo deve usar `staleTime` mais alto por se tratar de metadado publicado e nao deve ser invalidada por `open`, `assign`, `finalize` ou `archive`;
- `actorName` deve ser resolvido de forma centralizada no hook da feature usando `currentUserCollab?.name ?? user?.displayName ?? ''`, mantendo o fallback do backend se o valor vier vazio;
- `Minhas solicitacoes` permanece como tab na pagina principal, sem sub-rota dedicada em `/pilot/facilities/my-requests`;
- `DynamicFieldRenderer` precisa suportar funcionalmente apenas os tipos usados pelo workflow 1 (`text`, `textarea`, `select`); suporte funcional a `file`, `date` e `date-range` fica explicitamente para etapas futuras;
- a aba `Concluidas` e o endpoint `GET /api/workflows/read/completed` ficam fora do build desta etapa.

### 3.1. Workflow alvo inicial

- `workflowTypeId`:
  - `facilities_manutencao_solicitacoes_gerais`
- nome funcional:
  - `Manutenção / Solicitações Gerais`
- fluxo canonico:
  - `Solicitação Aberta` -> `Em andamento` -> `Finalizado`

### 3.2. Regra de visibilidade da UI

- `Nova solicitacao`:
  - visivel para usuario autenticado que conseguir ler o catalogo publicado;
- `Chamados atuais`:
  - visivel por ergonomia para perfis com `permissions.canManageRequests` ou `isAdmin`;
  - o backend continua sendo a fonte de verdade, entao vazio ou `403` nao devem quebrar a pagina;
- `Atribuicoes e acoes`:
  - visivel para qualquer usuario autenticado;
- `Minhas solicitacoes`:
  - visivel para qualquer usuario autenticado.

### 3.3. Fechamento de UX minima

A rota `/pilot/facilities` tera quatro blocos funcionais:

1. cabecalho do piloto;
2. card de abertura dinamica do workflow;
3. tabs operacionais:
   - `Chamados atuais`
   - `Atribuicoes e acoes`
   - `Minhas solicitacoes`
4. dialog de detalhes do chamado com acoes contextuais.

O CTA principal das listas sera sempre `Abrir`.

---

## 4. Arquitetura da Solucao

### 4.1. Diagrama arquitetural

```text
Authenticated User
  |
  | /pilot/facilities
  v
Next.js App Router
  |
  +--> src/app/(app)/pilot/facilities/page.tsx
          |
          v
  FacilitiesPilotPage ("use client")
          |
          +--> useAuth() ---------------------> Firebase Auth user
          +--> useCollaborators() -----------> collaborator directory already loaded by app shell
          +--> React Query hooks
                    |
                    v
            workflow-pilot api-client
                    |
                    +--> GET /api/workflows/catalog/{workflowTypeId}
                    +--> POST /api/workflows/runtime/requests
                    +--> GET /api/workflows/read/current?filter={filter}
                    +--> GET /api/workflows/read/assignments
                    +--> GET /api/workflows/read/mine
                    +--> POST /api/workflows/runtime/requests/{id}/assign
                    +--> POST /api/workflows/runtime/requests/{id}/finalize
                    +--> POST /api/workflows/runtime/requests/{id}/archive
                    |
                    v
            Existing runtime/read/catalog handlers
                    |
                    v
         workflows_v2 + workflowTypes_v2 + versions/{version}
```

### 4.2. Data flow por camada

```text
LAYER 1 (Routing / Shell)
1. src/app/(app)/pilot/facilities/page.tsx
2. src/components/pilot/facilities/FacilitiesPilotPage.tsx

LAYER 2 (Presentation / Local State)
3. tabs, cards, dialog e formulario dinamico
4. filtro da fila atual
5. request selecionado

LAYER 3 (Server State)
6. useFacilitiesPilotData()
7. useFacilitiesPilotActions()
8. React Query cache + invalidation

LAYER 4 (HTTP Client)
9. authenticatedWorkflowFetch()
10. client-safe DTO adapters
11. timestamp normalization helpers

LAYER 5 (Backend existente)
12. catalog route
13. runtime write-side
14. read-side do owner / assignments / mine
```

### 4.3. Estado gerenciado no frontend

| Estado | Armazenamento | Lifecycle |
|-------|---------------|-----------|
| catalogo publicado | React Query | carrega ao abrir a rota, usa `staleTime` alto (ex: 5 min) e nao participa das invalidacoes operacionais |
| filtro da fila atual | `useState` local | inicia em `all` e vive enquanto o usuario permanece na rota |
| request selecionado | `useState` local | abre ao clicar em `Abrir` e limpa ao fechar o dialog |
| formulario dinamico | React Hook Form | reinicia quando o catalogo muda ou apos abertura bem-sucedida |
| mutations de `assign/finalize/archive/open` | React Query `useMutation` | mostram loading local e invalidam as queries impactadas |
| diretorio de responsaveis | `CollaboratorsContext` | apenas leitura, herdada do shell autenticado |

### 4.4. Fronteira com o legado

O build da Etapa 4 deve ignorar:

- [src/contexts/WorkflowsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowsContext.tsx)
- [src/contexts/RequestsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/RequestsContext.tsx)
- [src/components/applications/WorkflowSubmissionModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/applications/WorkflowSubmissionModal.tsx)
- [src/components/requests/ManageRequests.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/ManageRequests.tsx)
- [src/app/(app)/applications/page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/applications/page.tsx)
- [src/app/(app)/requests/page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/requests/page.tsx)
- [src/app/(app)/me/tasks/page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/me/tasks/page.tsx)

A nova feature pode reaproveitar estilos e primitives, mas nao a logica operacional desses artefatos.

---

## 5. Contrato Funcional do Frontend

### 5.1. Nova rota

- metodo:
  - `GET`
- path:
  - `/pilot/facilities`
- auth:
  - herdada de `(app)` + token Firebase para chamadas internas

### 5.2. Fluxos suportados

#### Abrir chamado

1. carregar `GET /api/workflows/catalog/[workflowTypeId]`;
2. renderizar campos dinamicos por `fields[]`;
3. coletar `formData` em shape `{ [field.id]: value }`;
4. enviar `POST /api/workflows/runtime/requests`;
5. invalidar `mine`, `current` e `assignments`;
6. abrir feedback de sucesso com `requestId`.

#### Atribuir responsavel

1. abrir dialog a partir de item da fila;
2. listar responsaveis selecionaveis usando o diretorio do app;
3. enviar `POST /api/workflows/runtime/requests/{id}/assign`;
4. invalidar `current`, `assignments` e `mine`.

#### Finalizar

1. abrir dialog a partir de item atribuido ou em andamento;
2. enviar `POST /api/workflows/runtime/requests/{id}/finalize`;
3. invalidar `current`, `assignments` e `mine`.

#### Arquivar

1. abrir dialog de item finalizado;
2. enviar `POST /api/workflows/runtime/requests/{id}/archive`;
3. invalidar `current`, `assignments` e `mine`.

### 5.3. Endpoints consumidos

Nao ha endpoint novo ou alterado nesta etapa. O frontend passa a consumir, sem mudar contrato:

- `GET /api/workflows/catalog/[workflowTypeId]`
- `POST /api/workflows/runtime/requests`
- `POST /api/workflows/runtime/requests/{id}/assign`
- `POST /api/workflows/runtime/requests/{id}/finalize`
- `POST /api/workflows/runtime/requests/{id}/archive`
- `GET /api/workflows/read/current?filter={all|waiting_assignment|in_progress|waiting_action}`
- `GET /api/workflows/read/assignments`
- `GET /api/workflows/read/mine`

### 5.4. Request bodies usados pelo cliente

#### `POST /api/workflows/runtime/requests`

```json
{
  "workflowTypeId": "facilities_manutencao_solicitacoes_gerais",
  "requesterName": "Nome do usuario autenticado",
  "formData": {
    "nome_sobrenome": "Lucas",
    "impacto": "Alto"
  }
}
```

#### `POST /api/workflows/runtime/requests/{id}/assign`

```json
{
  "responsibleUserId": "ID3A123",
  "responsibleName": "Maria",
  "actorName": "Owner atual"
}
```

#### `POST /api/workflows/runtime/requests/{id}/finalize`

```json
{
  "actorName": "Responsavel atual"
}
```

#### `POST /api/workflows/runtime/requests/{id}/archive`

```json
{
  "actorName": "Owner atual"
}
```

### 5.5. Adaptacao client-safe obrigatoria

As respostas das APIs existentes usam tipos server-side e timestamps vindos do backend. A Etapa 4 deve criar adapters client-safe para:

- envelopes `{ ok, data }` / `{ ok, code, message }`;
- payload de catalogo;
- payloads read-side;
- timestamps serializados do Firebase Admin.

Regra fechada:

- nenhum Client Component da Etapa 4 deve depender diretamente de `firebase-admin/firestore`;
- todos os campos temporais devem ser normalizados antes de formatacao ou comparacao.
- a camada cliente deve expor um erro tipado proprio, preservando `code` e `httpStatus` do backend.

---

## 6. Estrutura Tecnica Recomendada

### 6.1. Pastas

```text
src/
  app/
    (app)/
      pilot/
        facilities/
          page.tsx
  components/
    pilot/
      facilities/
        FacilitiesPilotPage.tsx
        OpenWorkflowCard.tsx
        CurrentQueueTab.tsx
        AssignmentsTab.tsx
        MyRequestsTab.tsx
        RequestSummaryList.tsx
        RequestDetailsDialog.tsx
        DynamicFieldRenderer.tsx
  hooks/
    use-facilities-pilot.ts
  lib/
    workflows/
      pilot/
        api-client.ts
        types.ts
        presentation.ts
        timestamps.ts
        query-keys.ts
        __tests__/
          presentation.test.ts
          timestamps.test.ts
  components/
    pilot/
      facilities/
        __tests__/
          OpenWorkflowCard.test.tsx
          RequestDetailsDialog.test.tsx
```

### 6.2. File Manifest

| # | Arquivo | Acao | Objetivo | Skill/Agente relevante |
|---|---------|------|----------|------------------------|
| 1 | `src/app/(app)/pilot/facilities/page.tsx` | Create | Entry point autenticado da nova rota do piloto | `build`, `@react-frontend-developer` |
| 2 | `src/components/pilot/facilities/FacilitiesPilotPage.tsx` | Create | Shell principal da tela, orquestrando tabs, estados e dialog | `build`, `@react-frontend-developer` |
| 3 | `src/components/pilot/facilities/OpenWorkflowCard.tsx` | Create | Formulario dinamico de abertura com base no catalogo publicado | `build`, `@react-frontend-developer` |
| 4 | `src/components/pilot/facilities/DynamicFieldRenderer.tsx` | Create | Renderizar funcionalmente os tipos do workflow 1 (`text`, `textarea`, `select`) e sinalizar tipos futuros sem degradacao silenciosa | `build`, `@react-frontend-developer` |
| 5 | `src/components/pilot/facilities/CurrentQueueTab.tsx` | Create | Fila do owner com filtros canonicos e CTA `Abrir` | `build`, `@react-frontend-developer` |
| 6 | `src/components/pilot/facilities/AssignmentsTab.tsx` | Create | Secoes `Atribuido a mim` e `Acao pendente para mim` | `build`, `@react-frontend-developer` |
| 7 | `src/components/pilot/facilities/MyRequestsTab.tsx` | Create | Historico do solicitante agrupado por mes usando `groups[]` do backend | `build`, `@react-frontend-developer` |
| 8 | `src/components/pilot/facilities/RequestSummaryList.tsx` | Create | Lista compartilhada de cards/linhas com badges, empty state e loading | `build`, `@react-frontend-developer` |
| 9 | `src/components/pilot/facilities/RequestDetailsDialog.tsx` | Create | Unidade principal de operacao com `assign`, `finalize` e `archive` | `build`, `@react-frontend-developer` |
| 10 | `src/hooks/use-facilities-pilot.ts` | Create | React Query hooks, composicao dos dados e invalidacoes canonicas | `build`, `@react-frontend-developer` |
| 11 | `src/lib/workflows/pilot/api-client.ts` | Create | Fetch autenticado, parse de envelope e chamadas a catalog/runtime/read | `build` |
| 12 | `src/lib/workflows/pilot/query-keys.ts` | Create | Chaves de cache da feature, sempre incluindo identidade do usuario para isolar sessao | `build` |
| 13 | `src/lib/workflows/pilot/types.ts` | Create | DTOs client-safe do piloto, sem dependencia de `firebase-admin` | `build` |
| 14 | `src/lib/workflows/pilot/timestamps.ts` | Create | Normalizacao de timestamps vindos do backend para `Date | null` | `build` |
| 15 | `src/lib/workflows/pilot/presentation.ts` | Create | Derivacao de labels, badges, CTAs e guardas da UI | `build` |
| 16 | `src/lib/workflows/pilot/__tests__/presentation.test.ts` | Create | Cobrir mapeamento visual e visibilidade de acoes | `build` |
| 17 | `src/lib/workflows/pilot/__tests__/timestamps.test.ts` | Create | Cobrir normalizacao de timestamps serializados | `build` |
| 18 | `src/components/pilot/facilities/__tests__/OpenWorkflowCard.test.tsx` | Create | Validar render dinamico e submit de abertura | `build` |
| 19 | `src/components/pilot/facilities/__tests__/RequestDetailsDialog.test.tsx` | Create | Validar CTAs contextuais e disparo das mutations | `build` |

### 6.2A. Arquivos que NAO devem ser criados

| Arquivo | Razao |
|---------|-------|
| `src/app/(app)/pilot/facilities/my-requests/page.tsx` | Nao criar. `Minhas solicitacoes` fica incorporado como tab na pagina principal da rota `/pilot/facilities`. |

### 6.3. Reaproveitamento obrigatorio

O build da Etapa 4 deve reaproveitar:

- `useAuth` para usuario autenticado e nome do ator;
- `useCollaborators` apenas como diretorio;
- `PageHeader`, `Card`, `Tabs`, `Dialog`, `Badge`, `Button`, `Skeleton`, `Input`, `Textarea`, `Select`, `Calendar`;
- `useToast` para feedback de erro e sucesso;
- `ReactQueryProvider` global ja configurado no app.

Nao deve haver:

- nova dependencia de Firestore client dentro da feature;
- leitura direta de `workflows_v2` no browser;
- importacao de `WorkflowsContext` ou `RequestsContext`;
- duplicacao das regras de authz do backend no cliente.

---

## 7. Code Patterns

### 7.1. Fetch autenticado com envelope canonico

```ts
import type { User } from 'firebase/auth';

export class PilotApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly httpStatus: number,
  ) {
    super(message);
    this.name = 'PilotApiError';
  }
}

type ApiError = {
  ok: false;
  code: string;
  message: string;
};

export async function authenticatedWorkflowFetch<T>(
  user: User,
  input: string,
  init?: RequestInit,
): Promise<T> {
  const token = await user.getIdToken();

  const response = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  const json = await response.json();

  if (!response.ok || !json?.ok) {
    const error = json as ApiError;
    throw new PilotApiError(
      error.code || 'UNKNOWN_ERROR',
      error.message || 'Falha ao consumir API de workflows.',
      response.status,
    );
  }

  return json.data as T;
}
```

### 7.2. Hook da feature com React Query

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { pilotKeys } from '@/lib/workflows/pilot/query-keys';
import {
  getPilotCatalog,
  getPilotCurrentQueue,
  getPilotAssignments,
  getPilotMine,
  openPilotRequest,
  assignPilotResponsible,
  finalizePilotRequest,
  archivePilotRequest,
} from '@/lib/workflows/pilot/api-client';

export function useFacilitiesPilot(workflowTypeId: string, currentFilter: CurrentQueueFilter) {
  const { user, currentUserCollab } = useAuth();
  const queryClient = useQueryClient();

  const enabled = !!user;
  const uid = user?.uid ?? 'anonymous';
  const actorName = currentUserCollab?.name ?? user?.displayName ?? '';

  const catalogQuery = useQuery({
    queryKey: pilotKeys.catalog(uid, workflowTypeId),
    queryFn: () => getPilotCatalog(user!, workflowTypeId),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const currentQuery = useQuery({
    queryKey: pilotKeys.current(uid, currentFilter),
    queryFn: () => getPilotCurrentQueue(user!, currentFilter),
    enabled,
  });

  const assignmentsQuery = useQuery({
    queryKey: pilotKeys.assignments(uid),
    queryFn: () => getPilotAssignments(user!),
    enabled,
  });

  const mineQuery = useQuery({
    queryKey: pilotKeys.mine(uid),
    queryFn: () => getPilotMine(user!),
    enabled,
  });

  const invalidateOperationalQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: pilotKeys.currentRoot(uid) }),
      queryClient.invalidateQueries({ queryKey: pilotKeys.assignments(uid) }),
      queryClient.invalidateQueries({ queryKey: pilotKeys.mine(uid) }),
    ]);
  };

  const openMutation = useMutation({
    mutationFn: (payload: OpenPilotRequestInput) => openPilotRequest(user!, payload),
    onSuccess: invalidateOperationalQueries,
  });

  const assignMutation = useMutation({
    mutationFn: (payload: AssignPilotResponsibleInput) =>
      assignPilotResponsible(user!, {
        ...payload,
        actorName,
      }),
    onSuccess: invalidateOperationalQueries,
  });

  const finalizeMutation = useMutation({
    mutationFn: (payload: FinalizePilotRequestInput) =>
      finalizePilotRequest(user!, {
        ...payload,
        actorName,
      }),
    onSuccess: invalidateOperationalQueries,
  });

  const archiveMutation = useMutation({
    mutationFn: (payload: ArchivePilotRequestInput) =>
      archivePilotRequest(user!, {
        ...payload,
        actorName,
      }),
    onSuccess: invalidateOperationalQueries,
  });

  return {
    catalogQuery,
    currentQuery,
    assignmentsQuery,
    mineQuery,
    openMutation,
    assignMutation,
    finalizeMutation,
    archiveMutation,
  };
}
```

### 7.3. Derivacao visual de cards e CTAs

```ts
export function derivePilotRequestPresentation(
  item: PilotRequestSummary,
  actorUserId: string,
): PilotRequestPresentation {
  const isOwner = item.ownerUserId === actorUserId;
  const isResponsible = item.responsibleUserId === actorUserId;

  if (item.statusCategory === 'archived') {
    return {
      situationKey: 'archived',
      label: 'Arquivado',
      badgeVariant: 'outline',
      canAssign: false,
      canFinalize: false,
      canArchive: false,
    };
  }

  if (item.statusCategory === 'finalized') {
    return {
      situationKey: 'finalized',
      label: 'Concluido',
      badgeVariant: 'secondary',
      canAssign: false,
      canFinalize: false,
      canArchive: isOwner,
    };
  }

  if (item.statusCategory === 'waiting_action') {
    return {
      situationKey: 'waiting_action',
      label: 'Aguardando acao',
      badgeVariant: 'outline',
      canAssign: false,
      canFinalize: isOwner || isResponsible,
      canArchive: false,
    };
  }

  if (item.statusCategory === 'open' && !item.hasResponsible) {
    return {
      situationKey: 'awaiting_assignment',
      label: 'Aguardando atribuicao',
      badgeVariant: 'destructive',
      canAssign: isOwner,
      canFinalize: false,
      canArchive: false,
    };
  }

  return {
    situationKey: 'in_progress',
    label: 'Em andamento',
    badgeVariant: 'default',
    canAssign: isOwner,
    canFinalize: isOwner || isResponsible,
    canArchive: false,
  };
}
```

### 7.4. Renderizacao dinamica do formulario

```tsx
<Controller
  control={control}
  name={field.id}
  rules={{ required: field.required ? 'Campo obrigatorio.' : false }}
  render={({ field: rhfField }) => (
    <DynamicFieldRenderer
      definition={field}
      value={rhfField.value}
      onChange={rhfField.onChange}
      disabled={isSubmitting}
      error={errors[field.id]?.message}
    />
  )}
/>
```

---

## 8. Testing Strategy

Deve haver cobertura para:

- parse de envelope HTTP e erros canonicos;
- normalizacao de timestamps do backend;
- renderizacao do formulario a partir de `fields[]`;
- preservacao de `code` e `httpStatus` no erro cliente;
- filtros da fila do owner;
- separacao entre `assignedItems` e `pendingActionItems`;
- agrupamento mensal de `mine.groups`;
- visibilidade dos CTAs `Atribuir`, `Finalizar` e `Arquivar`;
- invalidacao das queries apos mutations;
- `catalog` nao e invalidado por mutations operacionais e pode permanecer em cache fresco por alguns minutos;
- isolamento das query keys por usuario autenticado;
- tratamento de estados `loading`, `error` e `empty`.

### 8.1. Casos minimos obrigatorios

- rota carrega o catalogo do `workflowTypeId` alvo e renderiza os campos na ordem do backend;
- submit de abertura envia `workflowTypeId`, `requesterName` e `formData`;
- filtro `waiting_assignment` consulta `GET /read/current?filter=waiting_assignment`;
- `Atribuicoes e acoes` distingue `Atribuido a mim` e `Acao pendente para mim`;
- `Minhas solicitacoes` usa `groups[]` quando presente e nao reagrupa por heuristica propria;
- item `open` sem responsavel mostra badge `Aguardando atribuicao`;
- item `in_progress` atribuido ao usuario permite `Finalizar`;
- item `finalized` e owner permite `Arquivar`;
- erro `403` no catalogo vira mensagem de acesso negado, sem quebrar o restante da rota;
- erro client-side preserva `code` e `httpStatus` para permitir tratamento contextual;
- query keys variam quando `user.uid` muda;
- `actorName` e resolvido no hook a partir de `currentUserCollab?.name ?? user?.displayName ?? ''`;
- `waiting_action` segue a mesma permissao de finalizacao do backend para owner ou responsavel;
- erro em mutation nao deixa cache inconsistente nem fecha dialog silenciosamente.

### 8.2. Artefatos de teste

- `presentation.test.ts`
  - cobre mapeamento de situacao, badges e CTAs;
- `timestamps.test.ts`
  - cobre entradas string, objeto serializado e nulo;
- `OpenWorkflowCard.test.tsx`
  - cobre formulario dinamico e submit;
- `RequestDetailsDialog.test.tsx`
  - cobre acoes contextuais e estados de loading/erro.

### 8.3. Acceptance tests

```gherkin
GIVEN um solicitante autenticado com acesso ao workflow 1
WHEN ele abre /pilot/facilities, preenche o formulario dinamico e envia
THEN o chamado e criado via POST /api/workflows/runtime/requests e aparece em Minhas solicitacoes
```

```gherkin
GIVEN o owner autenticado visualiza um chamado em Aguardando atribuicao
WHEN ele abre o dialog e atribui um responsavel
THEN o item sai da fila waiting_assignment, entra em andamento e passa a aparecer em Atribuicoes e acoes do responsavel
```

```gherkin
GIVEN um responsavel autenticado com item em andamento
WHEN ele finaliza o chamado no dialog
THEN o status passa a finalizado e o owner pode arquivar o item
```

```gherkin
GIVEN o owner autenticado visualiza um chamado finalizado
WHEN ele arquiva o item
THEN o item deixa as filas ativas e continua acessivel apenas pela visao historica futura
```

### 8.4. Fora do escopo de teste desta etapa

- E2E browser real com Firebase Auth;
- testes das telas legadas;
- fluxo `requestAction` / `respondAction`;
- query de concluidos via endpoint novo.

---

## 9. ADRs da Etapa 4

### ADR-ET4-001: A rota nasce dentro de `(app)` em `/pilot/facilities`

Isso preserva a autenticacao existente, evita criar fluxo paralelo de login e mantem o piloto isolado das paginas legadas.

### ADR-ET4-002: Nao havera novo `Context` para a feature

O projeto ja possui `ReactQueryProvider` global. Para esta etapa, um hook local e uma camada HTTP tipada resolvem melhor o problema e evitam expandir a arvore de providers com mais estado global.

### ADR-ET4-003: O cliente usa DTOs proprios, nao importa tipos server-side

Os tipos das APIs atuais referenciam `firebase-admin` e timestamps do backend. A UI do piloto precisa de DTOs client-safe para manter o bundle limpo e controlar a normalizacao temporal explicitamente.

### ADR-ET4-003B: O cliente preserva `code` e `httpStatus` em erro tipado proprio

Como a UX da etapa depende de diferenciar `403`, `WORKFLOW_TYPE_INACTIVE` e falhas genericas, a camada HTTP nao pode reduzir tudo a `Error(message)`. O frontend precisa de um erro tipado com `code`, `message` e `httpStatus`.

### ADR-ET4-004: `CollaboratorsContext` e permitido apenas como diretorio

Nao existe endpoint dedicado de pessoas no escopo da etapa, mas o shell autenticado ja fornece esse diretorio. A feature pode reaproveita-lo para o seletor de responsavel, sem herdar a logica operacional do legado.

### ADR-ET4-005: O dialog de detalhes e a unidade principal de operacao

Isso alinha a UX minima da etapa com os requisitos do frontend e evita espalhar mutacoes de runtime por varias linhas de lista, reduzindo acoplamento visual e estados inconsistentes.

### ADR-ET4-006: A estrutura interna nasce preparada para multiplos workflows, mas a rota entrega apenas o workflow 1

Isso permite chegar rapido no aceite da Etapa 4 sem hardcodes estruturais que inviabilizem o reuso nas Etapas 5 e 6.

### ADR-ET4-007: Query keys da feature sao segregadas por usuario

Como o `ReactQueryProvider` e global no app, a feature deve incluir `user.uid` nas query keys para evitar reaproveitamento de cache entre sessoes diferentes.

### ADR-ET4-008: O catalogo publicado nao participa da invalidacao operacional

Mutations de abertura e operacao alteram instancias em `workflows_v2`, nao a definicao publicada do workflow. Por isso, a query de catalogo usa `staleTime` mais alto e nao e invalidada junto com `current`, `assignments` e `mine`.

### ADR-ET4-009: `actorName` e resolvido uma unica vez no hook da feature

Isso evita duplicar fallback em componentes diferentes e mantem a semantica consistente entre `assign`, `finalize` e `archive`, preservando o fallback do backend quando o nome nao vier preenchido.

---

## 10. Rollback Plan

Se a Etapa 4 falhar:

1. remover a rota `src/app/(app)/pilot/facilities/page.tsx`;
2. reverter apenas o modulo frontend do piloto:
   - `src/components/pilot/facilities/*`
   - `src/hooks/use-facilities-pilot.ts`
   - `src/lib/workflows/pilot/*`
   - testes associados
3. manter intactos:
   - Etapa 1, 2 e 3
   - APIs `catalog`, `runtime` e `read`
   - colecoes `_v2`
   - telas legadas
4. nao reverter seeds nem modificar dados operacionais;
5. se necessario, manter o acesso manual aos endpoints backend para validacao enquanto a UI e retirada.

---

## 11. Pronto para Build

A Etapa 4 fica pronta para build quando:

- a rota `/pilot/facilities` estiver fechada;
- a camada cliente tipada estiver fechada;
- o manifesto de arquivos estiver fechado;
- os adapters client-safe de timestamp estiverem fechados;
- as regras de visibilidade e CTA estiverem fechadas;
- a estrategia de invalidacao de cache estiver fechada;
- nao houver dependencia remanescente de `WorkflowsContext` ou `RequestsContext`.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-27 | codex | Criado o design da Etapa 4 para a nova rota `/pilot/facilities`, com camada cliente tipada, formulario dinamico via catalogo publicado, tabs operacionais, dialog de detalhes, manifest de arquivos, ADRs e estrategia de testes/rollback. |
