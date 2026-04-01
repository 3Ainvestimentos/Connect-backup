# DESIGN: FASE 2A.2 - Bootstrap e Listas Oficiais

> Generated: 2026-04-01
> Status: Ready for build
> Scope: Fase 2 / 2A.2 - Bootstrap oficial, filtros server-side e listas operacionais
> Base document: `DEFINE_FASE2A_2_BOOTSTRAP_LISTAS.md`

## 1. Objetivo

Entregar o primeiro build funcional da superficie oficial `/gestao-de-chamados`, saindo do shell previsto na 2A.1 para uma tela que:

- conhece ownership real do ator;
- separa capability de ownership de disponibilidade de filtros;
- consulta filas reais via `read/*`;
- aplica filtros estruturantes no servidor;
- sincroniza tab e filtros pela URL;
- preserva compatibilidade com o piloto e deixa o detalhe rico para a 2A.3.

Esta subetapa cobre:

- `GET /api/workflows/read/management/bootstrap`;
- evolucao additive de `GET /api/workflows/read/current`;
- evolucao additive de `GET /api/workflows/read/assignments`;
- evolucao additive de `GET /api/workflows/read/completed`;
- toolbar oficial com busca e filtros;
- listas oficiais `Chamados atuais`, `Atribuicoes e acoes` e `Concluidas`;
- subtabs explicitas de `Atribuicoes e acoes`.

Esta subetapa nao cobre:

- `GET /api/workflows/read/requests/[requestId]`;
- modal rico com `formData`, anexos, progresso e timeline;
- remocao de legados;
- mudanca estrutural do runtime de mutacoes;
- full-text search e paginacao.

---

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_FASE2A_2_BOOTSTRAP_LISTAS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/2A/DEFINE_FASE2A_2_BOOTSTRAP_LISTAS.md)
- [DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md)
- [DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md)
- [queries.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/queries.ts)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/types.ts)
- [current/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/read/current/route.ts)
- [assignments/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/read/assignments/route.ts)
- [completed/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/read/completed/route.ts)
- [repository.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/repository.ts)
- [WorkflowAreasContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowAreasContext.tsx)
- [use-facilities-pilot.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-facilities-pilot.ts)
- [FacilitiesPilotPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/FacilitiesPilotPage.tsx)
- [AssignmentsTab.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/AssignmentsTab.tsx)
- [CurrentQueueTab.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/CurrentQueueTab.tsx)
- [CompletedTab.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/CompletedTab.tsx)
- [RESOLUCAO_PENDENCIAS_READ_MODEL_RUNTIME.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/RESOLUCAO_PENDENCIAS_READ_MODEL_RUNTIME.md)

Em caso de divergencia:

1. prevalece o `DEFINE_FASE2A_2_BOOTSTRAP_LISTAS.md` para escopo e aceite;
2. depois prevalecem os contratos canonicos do read-side e runtime v2;
3. depois prevalece este `DESIGN` para orientar o build incremental;
4. o design macro da 2A permanece como direcao global, nao como autorizacao para puxar escopo da 2A.3.

---

## 3. Estado Atual e Premissas

### 3.1. Estado real observado no repositorio

- `current`, `assignments` e `completed` ja existem e devolvem envelopes canonicos;
- `current` aceita apenas o filtro canonico `all | waiting_assignment | in_progress | waiting_action`;
- as queries base do read-side ja existem para owner, responsavel, pendencia e concluidos;
- o piloto usa `useFacilitiesPilot()` com React Query e invalida listas apos mutacoes;
- a visibilidade da aba `Chamados atuais` ainda depende de `permissions.canManageRequests || isAdmin`;
- o namespace oficial `src/lib/workflows/management` existe, mas esta vazio;
- `src/components/workflows/management` existe apenas com `__tests__`;
- a rota oficial `/gestao-de-chamados` ainda nao existe no codigo desta branch.

### 3.2. Implicacao para o build

A 2A.2 depende logicamente da 2A.1. Como a scaffold da 2A.1 ainda nao esta materializada no codigo atual, o build da 2A.2 deve:

- aplicar primeiro o shell da 2A.1 na mesma branch;
- ou cherry-pickar a entrega da 2A.1 antes de iniciar os arquivos desta subetapa.

Este design assume que o shell oficial ja estara disponivel quando a integracao de dados comecar.

### 3.3. Premissas fechadas

- nenhuma nova colecao ou migracao de schema sera criada;
- `workflowTypes_v2`, `workflows_v2` e `workflowAreas` sao suficientes para o bootstrap;
- os filtros oficiais serao additive e opcionais para nao quebrar o piloto;
- `slaState` continua calculado em read time;
- a 2A.2 nao abre o endpoint de detalhe rico da 2A.3.

---

## 4. Decisoes Fechadas da 2A.2

### 4.1. O bootstrap separa ownership de opcoes de filtro

`GET /api/workflows/read/management/bootstrap` retorna dois blocos independentes:

- `ownership`: representa escopo de ownership explicito do ator;
- `filterOptions`: representa o universo operacional visivel do ator para toolbar.

Consequencia: executor sem ownership continua recebendo filtros uteis para `Atribuicoes e acoes` e `Concluidas`, enquanto a aba `Chamados atuais` continua governada por capability explicita.

### 4.2. `filterOptions` nasce do escopo visivel do ator, nao de scan irrestrito

O bootstrap agrega opcoes a partir de:

- ownerships encontrados em `workflowTypes_v2` para o ator;
- workflows presentes nas listas do proprio ator;
- labels de area buscados em `workflowAreas`, com fallback para `areaId` quando o documento nao existir.

Consequencia: nao ha necessidade de varrer todos os workflows ativos do sistema para montar a toolbar.

### 4.3. Os endpoints herdados evoluem com filtros opcionais

`current`, `assignments` e `completed` permanecem canonicos e recebem query params opcionais:

- `requestId`
- `workflowTypeId`
- `areaId`
- `requesterQuery`
- `slaState`
- `periodFrom`
- `periodTo`

`current` preserva adicionalmente o parametro `filter`.

Consequencia: o piloto continua funcionando sem qualquer alteracao porque continua chamando os mesmos endpoints sem os novos params.

### 4.4. `requestId` tem precedencia e faz lookup exato

Quando `requestId` vier na URL:

- o backend usa `getWorkflowRequestByRequestId()` para localizar o request;
- aplica uma validacao de escopo especifica por endpoint;
- so depois refina o item pelos demais filtros opcionais.

Consequencia: a busca por numero do chamado nao depende de varrer a query-base inteira do ator.

### 4.5. `Assignments` continua um endpoint unico e a segmentacao fica na UI

`GET /api/workflows/read/assignments` continua devolvendo:

- `assignedItems`
- `pendingActionItems`

A tela oficial renderiza isso em subtabs explicitas:

- `Atribuidos a mim`
- `Acoes pendentes para mim`

Consequencia: o contrato atual continua valido e a experiencia oficial ganha segmentacao mais clara sem multiplicar rotas.

### 4.6. URL state oficial vira contrato de navegacao da tela

Os search params oficiais passam a governar:

- tab principal;
- subtab de atribuicoes;
- filtro interno da fila atual;
- filtros da toolbar.

Consequencia: a tela passa a suportar refresh seguro, deep-link e compartilhamento de contexto operacional.

### 4.7. `slaState` publico canonicamente usa `on_track`

Para a tela oficial, o enum publico de filtro sera:

- `on_track`
- `at_risk`
- `overdue`

Como os documentos antigos tambem usam `on_time`, o parser server-side pode aceitar esse alias apenas como compatibilidade de entrada, mas o frontend oficial deve serializar apenas `on_track`.

### 4.8. A 2A.2 para nas listas resumidas

Cards oficiais seguem trabalhando apenas com `WorkflowReadSummary` enriquecido com `slaState`, sem `formData`, timeline ou anexos. Abertura de detalhe rico fica reservada para a 2A.3.

---

## 5. Arquitetura da Solucao

### 5.1. Diagrama arquitetural

```text
src/app/(app)/gestao-de-chamados/page.tsx    (2A.1 shell)
  |
  v
WorkflowManagementPage
  |
  +--> parseManagementSearchParams()
  |
  +--> useWorkflowManagement(url state)
  |       |
  |       +--> GET /api/workflows/read/management/bootstrap
  |       +--> GET /api/workflows/read/current?filter&...
  |       +--> GET /api/workflows/read/assignments?...
  |       +--> GET /api/workflows/read/completed?...
  |
  +--> ManagementToolbar
  +--> CurrentQueuePanel
  +--> AssignmentsPanel
  +--> CompletedPanel
              |
              v
        summary cards only

Backend read layer
  |
  +--> bootstrap.ts
  |       +--> workflowTypes_v2
  |       +--> workflows_v2 (queries do proprio ator)
  |       +--> workflowAreas
  |
  +--> queries.ts
  |       +--> owner current base query
  |       +--> assignments base query
  |       +--> completed base query
  |
  +--> filters.ts
          +--> parse official filters
          +--> exact requestId lookup
          +--> compute slaState
          +--> apply in-memory refinements
```

### 5.2. Fluxo por camadas

```text
LAYER 1 - Route / page
1. A rota oficial recebe `searchParams`.
2. Os params sao normalizados para o contrato da tela.

LAYER 2 - Frontend orchestration
3. `useWorkflowManagement()` consulta o bootstrap no mount.
4. A query da aba ativa e habilitada de forma condicional.
5. Mudancas de toolbar e tabs atualizam a URL.

LAYER 3 - Read API
6. `management/bootstrap` calcula capabilities, ownership e filterOptions.
7. `current`, `assignments` e `completed` parseiam filtros opcionais.
8. Cada rota reutiliza a query-base existente do escopo do ator.

LAYER 4 - Server-side refinement
9. `requestId` usa lookup exato + predicate de escopo.
10. `workflowTypeId`, `areaId`, `requesterQuery`, `slaState` e periodo refinam o resultado.
11. `slaState` e derivado em leitura e pode ser devolvido junto de cada item.

LAYER 5 - Persistence
12. Nenhuma mutacao ou colecao nova e criada nesta subetapa.
13. A compatibilidade do piloto e preservada porque as rotas herdadas nao mudam de path.
```

### 5.3. Capabilities do bootstrap

As capacidades da tela oficial ficam:

- `canViewCurrentQueue = ownership.hasOwnedScopes`
- `canViewAssignments = true`
- `canViewCompleted = true`

Observacao: `Assignments` e `Completed` continuam baseadas no escopo operacional do ator. Nao dependem de ownership.

---

## 6. ADRs

### ADR-2A.2.1: Bootstrap dedicado para capability e filtros

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-01 |
| Context | `canManageRequests` nao representa ownership operacional real e nao entrega opcoes de filtros oficiais. |

**Choice:** criar `GET /api/workflows/read/management/bootstrap` como bootstrap unico da tela oficial.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| continuar usando `permissions.canManageRequests` no frontend | mistura permissao administrativa com ownership operacional |
| inferir ownership a partir do resultado de `current` | tab some quando a fila estiver vazia, o que viola o define |
| derivar filtros apenas de ownership | executores sem ownership ficam sem filtros uteis |

**Consequences:**

- positivo: separa governanca de aba de disponibilidade de filtros;
- positivo: concentra a decisao de capability no backend;
- negativo: adiciona mais uma chamada de leitura na tela oficial.

### ADR-2A.2.2: Filtros ficam additive nos endpoints herdados

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-01 |
| Context | O piloto ja valida envelopes e chamadas para `current`, `assignments` e `completed`. |

**Choice:** evoluir as rotas existentes com query params opcionais e manter as respostas base.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| criar rotas oficiais paralelas para cada lista | duplica contrato e aumenta custo de transicao |
| quebrar os endpoints herdados para acomodar os filtros | arrisca regressao imediata do piloto |

**Consequences:**

- positivo: reduz custo de rollout;
- positivo: permite build incremental com cobertura de testes reaproveitada;
- negativo: exige disciplina na validacao de params para nao gerar semanticas implicitas.

### ADR-2A.2.3: `requestId` usa lookup exato e predicate de escopo

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-01 |
| Context | Busca por numero do chamado precisa ser precisa e nao pode depender do volume da query-base. |

**Choice:** usar `getWorkflowRequestByRequestId()` e validar o item contra um predicate especifico do endpoint antes de retornalo.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| filtrar `requestId` apenas em memoria depois da query-base | piora a latencia e falha quando a query-base for muito ampla |
| criar um endpoint exclusivo de busca por requestId | adiciona superficie desnecessaria para uma variacao do mesmo escopo |

**Consequences:**

- positivo: lookup previsivel;
- positivo: mantem authz ligada ao escopo de cada lista;
- negativo: exige helper compartilhado para nao duplicar predicates nas tres rotas.

---

## 7. File Manifest

### 7.1. Ordem de execucao

| Ordem | Caminho | Acao | Responsabilidade | Agente/Skill sugerido |
|------|---------|------|------------------|-----------------------|
| 1 | [src/lib/workflows/read/types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/types.ts) | Update | Tipos de filtros oficiais, `slaState`, bootstrap e capabilities | `build` / `@firebase-specialist` |
| 2 | [src/lib/workflows/read/filters.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/filters.ts) | Create | Parsing de query params, `slaState`, predicates de escopo e refinamento server-side | `build` / `@firebase-specialist` |
| 3 | [src/lib/workflows/read/bootstrap.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/bootstrap.ts) | Create | Agregacao de ownership, capabilities e `filterOptions` | `build` / `@firebase-specialist` |
| 4 | [src/lib/workflows/read/queries.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/queries.ts) | Update | Expor hooks de query reutilizaveis para listas oficiais e lookup por escopo | `build` / `@firebase-specialist` |
| 5 | [src/app/api/workflows/read/management/bootstrap/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/read/management/bootstrap/route.ts) | Create | Endpoint de bootstrap oficial | `build` / `@firebase-specialist` |
| 6 | [src/app/api/workflows/read/current/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/read/current/route.ts) | Update | Aceitar filtros oficiais opcionais preservando `filter` canonico | `build` / `@firebase-specialist` |
| 7 | [src/app/api/workflows/read/assignments/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/read/assignments/route.ts) | Update | Aceitar filtros oficiais opcionais e preservar secoes | `build` / `@firebase-specialist` |
| 8 | [src/app/api/workflows/read/completed/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/read/completed/route.ts) | Update | Aceitar filtros oficiais opcionais e preservar agrupamento mensal | `build` / `@firebase-specialist` |
| 9 | [src/lib/workflows/management/types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/types.ts) | Create | DTOs de frontend da tela oficial | `build` / `@react-frontend-developer` |
| 10 | [src/lib/workflows/management/api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/api-client.ts) | Create | Cliente HTTP oficial com envelopes canonicos | `build` / `@react-frontend-developer` |
| 11 | [src/lib/workflows/management/query-keys.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/query-keys.ts) | Create | Chaves React Query da superficie oficial | `build` / `@react-frontend-developer` |
| 12 | [src/lib/workflows/management/search-params.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/search-params.ts) | Create | Parser/serializer canonico da URL | `build` / `@react-frontend-developer` |
| 13 | [src/hooks/use-workflow-management.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-workflow-management.ts) | Create | Orquestracao de bootstrap, listas e invalidacoes oficiais | `build` / `@react-frontend-developer` |
| 14 | [src/components/workflows/management/WorkflowManagementPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/WorkflowManagementPage.tsx) | Create or Update | Container principal da rota oficial | `build` / `@react-frontend-developer` |
| 15 | [src/components/workflows/management/ManagementToolbar.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/ManagementToolbar.tsx) | Create | Busca, filtros e resumo operacional | `build` / `@react-frontend-developer` |
| 16 | [src/components/workflows/management/CurrentQueuePanel.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/CurrentQueuePanel.tsx) | Create | Aba `Chamados atuais` oficial | `build` / `@react-frontend-developer` |
| 17 | [src/components/workflows/management/AssignmentsPanel.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/AssignmentsPanel.tsx) | Create | Aba `Atribuicoes e acoes` com subtabs | `build` / `@react-frontend-developer` |
| 18 | [src/components/workflows/management/CompletedPanel.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/CompletedPanel.tsx) | Create | Aba `Concluidas` oficial | `build` / `@react-frontend-developer` |
| 19 | [src/app/(app)/gestao-de-chamados/page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/gestao-de-chamados/page.tsx) | Create or Update | Aplicar o shell da 2A.1 e conectar o container oficial | `build` / `@react-frontend-developer` |
| 20 | [src/lib/workflows/read/__tests__/read-api-contract.test.js](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/__tests__/read-api-contract.test.js) | Update | Cobrir bootstrap e filtros opcionais | `build` |
| 21 | [src/lib/workflows/read/__tests__/queries.test.js](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/__tests__/queries.test.js) | Update | Cobrir parsing, predicates, SLA e refinamento | `build` |
| 22 | [src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx) | Create | Cobrir tab gating, subtabs e URL state | `build` |

### 7.2. Reaproveitamentos do piloto

Podem ser reaproveitados como referencia:

- `authenticatedWorkflowFetch()` e normalizacao de envelopes de [api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/api-client.ts);
- estrategia de React Query de [use-facilities-pilot.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-facilities-pilot.ts);
- segmentacao visual do piloto em [AssignmentsTab.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/AssignmentsTab.tsx), [CurrentQueueTab.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/CurrentQueueTab.tsx) e [CompletedTab.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/CompletedTab.tsx).

Nao devem ser promovidos como contrato final:

- gate de `Chamados atuais` por `permissions.canManageRequests`;
- dependencia de `pilot/*` no namespace oficial;
- filtro local por workflow como solucao principal;
- semantica de shell sem URL state completo.

---

## 8. Contratos e Patterns

### 8.1. Bootstrap oficial

`GET /api/workflows/read/management/bootstrap`

Responsabilidades:

- autenticar o ator;
- resolver ownership explicito em `workflowTypes_v2`;
- consolidar `filterOptions` a partir do escopo operacional do ator;
- devolver capabilities que governam a UI oficial.

Response:

```json
{
  "ok": true,
  "data": {
    "actor": {
      "actorUserId": "SMO2",
      "actorName": "Owner"
    },
    "capabilities": {
      "canViewCurrentQueue": true,
      "canViewAssignments": true,
      "canViewCompleted": true
    },
    "ownership": {
      "hasOwnedScopes": true,
      "workflowTypeIds": [
        "facilities_manutencao_solicitacoes_gerais",
        "facilities_solicitacao_compras"
      ],
      "areaIds": ["u3entfMNB17iklBOdq5H"]
    },
    "filterOptions": {
      "workflows": [
        {
          "workflowTypeId": "facilities_manutencao_solicitacoes_gerais",
          "workflowName": "Manutencao / Solicitacoes Gerais",
          "areaId": "u3entfMNB17iklBOdq5H"
        }
      ],
      "areas": [
        {
          "areaId": "u3entfMNB17iklBOdq5H",
          "label": "Facilities e Suprimentos"
        }
      ]
    }
  }
}
```

### 8.2. Filtros oficiais

```ts
type WorkflowManagementFilters = {
  requestId?: number;
  workflowTypeId?: string;
  areaId?: string;
  requesterQuery?: string;
  slaState?: 'on_track' | 'at_risk' | 'overdue';
  periodFrom?: string; // YYYY-MM-DD
  periodTo?: string;   // YYYY-MM-DD
};
```

Regras:

- `requestId` tem precedencia;
- `workflowTypeId` e `areaId` usam campos do read model;
- `requesterQuery` e comparacao case-insensitive em memoria sobre o dataset ja restrito;
- `slaState` e calculado em leitura;
- `periodFrom` e `periodTo` usam `submittedAt` para `current` e `assignments`, e `closedAt` para `completed`;
- `periodTo` e inclusivo ate o final do dia;
- o frontend serializa apenas filtros ativos.

### 8.3. Query params oficiais da URL

```ts
type ManagementSearchParams = {
  tab?: 'current' | 'assignments' | 'completed';
  subtab?: 'assigned' | 'pending';
  queue?: 'all' | 'waiting_assignment' | 'in_progress' | 'waiting_action';
  requestId?: string;
  workflow?: string;
  area?: string;
  requester?: string;
  sla?: 'on_track' | 'at_risk' | 'overdue';
  from?: string;
  to?: string;
};
```

Mapeamento:

- `queue -> filter` da API de `current`;
- `workflow -> workflowTypeId`;
- `area -> areaId`;
- `requester -> requesterQuery`;
- `sla -> slaState`.

### 8.4. Pattern 1: Parse e serialize da URL

```ts
// src/lib/workflows/management/search-params.ts
export function parseManagementSearchParams(params: URLSearchParams) {
  return {
    activeTab: parseTab(params.get('tab')),
    assignmentsSubtab: parseAssignmentsSubtab(params.get('subtab')),
    currentFilter: parseCurrentQueueFilter(params.get('queue')),
    filters: {
      requestId: parsePositiveInteger(params.get('requestId')),
      workflowTypeId: params.get('workflow') ?? undefined,
      areaId: params.get('area') ?? undefined,
      requesterQuery: params.get('requester') ?? undefined,
      slaState: parseSlaState(params.get('sla')),
      periodFrom: params.get('from') ?? undefined,
      periodTo: params.get('to') ?? undefined,
    },
  };
}
```

### 8.5. Pattern 2: Hook oficial com queries condicionais

```ts
// src/hooks/use-workflow-management.ts
export function useWorkflowManagement(state: WorkflowManagementViewState) {
  const bootstrapQuery = useQuery({
    queryKey: managementKeys.bootstrap(),
    queryFn: getManagementBootstrap,
  });

  const currentQuery = useQuery({
    queryKey: managementKeys.current(state.currentFilter, state.filters),
    queryFn: () => getOfficialCurrentQueue(state.currentFilter, state.filters),
    enabled: bootstrapQuery.data?.capabilities.canViewCurrentQueue === true && state.activeTab === 'current',
  });

  const assignmentsQuery = useQuery({
    queryKey: managementKeys.assignments(state.filters),
    queryFn: () => getOfficialAssignments(state.filters),
    enabled: state.activeTab === 'assignments',
  });

  const completedQuery = useQuery({
    queryKey: managementKeys.completed(state.filters),
    queryFn: () => getOfficialCompleted(state.filters),
    enabled: state.activeTab === 'completed',
  });

  return { bootstrapQuery, currentQuery, assignmentsQuery, completedQuery };
}
```

### 8.6. Pattern 3: Refino server-side por escopo

```ts
// src/lib/workflows/read/filters.ts
export async function queryScopedCurrentQueue(
  actorUserId: string,
  currentFilter: CurrentQueueFilter,
  filters: WorkflowManagementFilters,
) {
  if (filters.requestId) {
    return queryExactScopedRequest(actorUserId, filters.requestId, 'current', currentFilter);
  }

  const items = await queryOwnerCurrentQueue(actorUserId, currentFilter);
  return applyOfficialReadFilters(items, filters, { periodField: 'submittedAt' });
}
```

### 8.7. Pattern 4: Bootstrap agregando opcoes sem scan global

```ts
// src/lib/workflows/read/bootstrap.ts
export async function buildWorkflowManagementBootstrap(actor: RuntimeActor) {
  const [ownedScopes, assignments, completed] = await Promise.all([
    queryOwnedWorkflowScopes(actor.actorUserId),
    queryAssignmentsForActor(actor.actorUserId),
    queryCompletedHistory(actor.actorUserId),
  ]);

  const filterOptions = deriveFilterOptionsFromVisibleItems({
    ownedScopes,
    assignedItems: assignments.assignedItems,
    pendingActionItems: assignments.pendingActionItems,
    completedItems: completed,
  });

  return {
    actor: { actorUserId: actor.actorUserId, actorName: actor.actorName },
    capabilities: {
      canViewCurrentQueue: ownedScopes.workflowTypeIds.length > 0,
      canViewAssignments: true,
      canViewCompleted: true,
    },
    ownership: ownedScopes,
    filterOptions,
  };
}
```

### 8.8. Response shape das listas

Os envelopes permanecem os mesmos. Cada item pode ganhar `slaState` de forma additive:

```json
{
  "requestId": 801,
  "workflowTypeId": "facilities_manutencao_solicitacoes_gerais",
  "statusCategory": "in_progress",
  "requesterName": "Requester",
  "slaState": "at_risk"
}
```

O piloto continua compativel porque seu normalizer ignora campos extras.

---

## 9. API Contract

### 9.1. `GET /api/workflows/read/management/bootstrap` (novo)

- autentica via `authenticateRuntimeActor()`;
- retorna `actor`, `capabilities`, `ownership` e `filterOptions`;
- erro segue o envelope canonico de `ReadError`.

### 9.2. `GET /api/workflows/read/current` (evolucao sem quebra)

Query params:

- `filter`
- `requestId`
- `workflowTypeId`
- `areaId`
- `requesterQuery`
- `slaState`
- `periodFrom`
- `periodTo`

Response base preservada:

```json
{
  "ok": true,
  "data": {
    "filter": "waiting_assignment",
    "items": []
  }
}
```

### 9.3. `GET /api/workflows/read/assignments` (evolucao sem quebra)

Query params:

- `requestId`
- `workflowTypeId`
- `areaId`
- `requesterQuery`
- `slaState`
- `periodFrom`
- `periodTo`

Response base preservada:

```json
{
  "ok": true,
  "data": {
    "assignedItems": [],
    "pendingActionItems": []
  }
}
```

### 9.4. `GET /api/workflows/read/completed` (evolucao sem quebra)

Query params:

- `requestId`
- `workflowTypeId`
- `areaId`
- `requesterQuery`
- `slaState`
- `periodFrom`
- `periodTo`

Response base preservada:

```json
{
  "ok": true,
  "data": {
    "items": [],
    "groups": []
  }
}
```

### 9.5. Validacoes de erro

Devem retornar `400` com `ReadError` quando:

- `filter` for invalido em `current`;
- `requestId` nao for inteiro positivo;
- `slaState` nao pertencer ao enum aceito;
- `periodFrom` ou `periodTo` nao forem datas `YYYY-MM-DD` validas;
- `periodFrom > periodTo`.

---

## 10. Testing Strategy

### 10.1. Unitario backend

- parsing dos filtros oficiais;
- alias `on_time -> on_track`;
- calculo de `slaState`;
- predicates de escopo por endpoint;
- agregacao de `filterOptions` e deduplicacao de workflows/areas.

### 10.2. Contract tests das rotas

Atualizar [read-api-contract.test.js](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/__tests__/read-api-contract.test.js) para cobrir:

- sucesso em `management/bootstrap`;
- `current` com `filter` canonico + filtros oficiais;
- `assignments` preservando secoes apos filtragem;
- `completed` preservando `groups` apos filtragem;
- `400` para filtros invalidos;
- ausencia de quebra no envelope antigo.

### 10.3. Unitario read-side

Atualizar [queries.test.js](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/__tests__/queries.test.js) para cobrir:

- periodo em `submittedAt` vs `closedAt`;
- `requestId` com match e mismatch de escopo;
- `requesterQuery` case-insensitive;
- `slaState` em itens ativos vs concluidos.

### 10.4. Component tests frontend

Criar [WorkflowManagementPage.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx) cobrindo:

- ocultacao da aba `Chamados atuais` quando `canViewCurrentQueue = false`;
- subtabs de `Atribuicoes e acoes`;
- sync de URL ao trocar tab e filtros;
- restauracao da UI a partir da URL;
- empty state de capability vs empty state operacional.

### 10.5. Validacao manual minima

Testar ao menos tres perfis:

- owner com ownership explicito;
- executor sem ownership e com atribuicoes;
- ator sem itens operacionais.

Verificar:

- filtros compartilhados por link;
- piloto `/pilot/facilities` intacto;
- envelopes das rotas herdadas sem regressao;
- `Chamados atuais` governado por capability, nao por vazio.

---

## 11. Rollback Plan

- rollback de frontend: voltar a rota oficial para o shell da 2A.1 sem conectar bootstrap/listas;
- rollback de backend: manter os novos params ignorados ou remover a rota `management/bootstrap` sem tocar schema;
- rollback de rollout: manter `/pilot/facilities` como superficie operacional fallback;
- rollback de dados: nao ha migracao, backfill nem escrita estrutural a desfazer.

Sinal de falha que justifica rollback:

- regressao no piloto ao consumir `current`, `assignments` ou `completed`;
- capability de `Chamados atuais` incorreta para usuarios sem ownership;
- filtros retornando itens fora do escopo operacional do ator.

---

## 12. Resultado Esperado do Build

Ao final da 2A.2, a superficie oficial deve:

- abrir com bootstrap real;
- mostrar a aba `Chamados atuais` apenas para quem possui ownership explicito;
- permitir filtros por URL em `current`, `assignments` e `completed`;
- diferenciar `Atribuidos a mim` de `Acoes pendentes para mim`;
- manter contratos herdados estaveis para o piloto;
- deixar a 2A.3 livre para atacar apenas o detalhe rico.
