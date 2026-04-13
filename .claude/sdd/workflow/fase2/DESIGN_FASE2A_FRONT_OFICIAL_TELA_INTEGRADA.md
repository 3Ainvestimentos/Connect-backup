# DESIGN: FASE2A_FRONT_OFICIAL_TELA_INTEGRADA

> Generated: 2026-04-01
> Status: Ready for build
> Scope: Fase 2 / 2A - Front oficial da tela integrada de gestao de chamados
> Base document: `DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md`

## 1. Objetivo

Construir a superficie oficial `/gestao-de-chamados` como a nova central operacional do motor v2, substituindo funcionalmente a navegacao hoje fragmentada entre `/pilot/facilities` e `/me/tasks`, sem reabrir a fundacao backend validada na Fase 1 e preservando `/requests` como superficie complementar do solicitante.

Esta etapa cobre:

- nova rota oficial integrada;
- filtros e busca estruturantes executados no servidor;
- tab de ownership governada por sinal explicito, nao por fila vazia;
- modal oficial de detalhe com `formData`, timeline, progresso e anexos;
- construcao de componentes oficiais novos e modularizados para a superficie de management;
- reaproveitamento seletivo de contratos e padroes do piloto fora do namespace `pilot/*`;
- transicao segura com convivencia temporaria entre superfices antiga e nova.

Esta etapa nao cobre:

- migracao dos demais workflows da Fase 2B;
- tela administrativa/versionamento da Fase 2C;
- redesign do runtime base de abertura/atribuicao/finalizacao;
- full-text search avancado;
- paginacao/virtualizacao como compromisso inicial da 2A, salvo necessidade validada durante o build;
- remocao imediata de `/pilot/facilities`, `/requests` ou `/me/tasks`;
- exclusao de arquivos, componentes ou rotas legadas durante o primeiro rollout da 2A.

---

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md)
- [ROADMAP_FASE2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase2/ROADMAP_FASE2.md)
- [REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/REQUISITOS_FRONTEND_GESTAO_CHAMADOS.md)
- [DESIGN_READ_MODEL_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/DESIGN_READ_MODEL_WORKFLOWS.md)
- [ARQUITETURA_WORKFLOWS_VERSIONADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/docs_step2/ARQUITETURA_WORKFLOWS_VERSIONADOS.md)
- [FacilitiesPilotPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/FacilitiesPilotPage.tsx)
- [RequestSummaryList.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/RequestSummaryList.tsx)
- [RequestDetailsDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/RequestDetailsDialog.tsx)
- [use-facilities-pilot.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-facilities-pilot.ts)
- [queries.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/queries.ts)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/types.ts)
- [repository.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/repository.ts)
- [authz.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/authz.ts)
- [AppLayout.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/layout/AppLayout.tsx)

Em caso de divergencia:

1. prevalece o `DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md` para escopo e aceite;
2. depois prevalecem os contratos canonicos do read-side e runtime v2;
3. depois prevalece este `DESIGN` para orientar o build;
4. roadmaps e progresso seguem como contexto de sequenciamento.

---

## 3. Estado Atual Herdado da Fase 1

### 3.1. O que ja esta validado

- `GET /api/workflows/read/current`, `assignments`, `completed` e `mine` ja existem e usam envelopes consistentes;
- o read-side v2 ja entrega `WorkflowReadSummary` com identidade operacional, ownership, step/status, SLA base e timestamps;
- `FacilitiesPilotPage` ja provou uma superficie unica com tabs, loading/error/empty states e deep-link por `?workflow=...`;
- `AssignmentsTab` ja separa semanticamente `Atribuido a mim` e `Acao pendente para mim`;
- as mutacoes operacionais continuam estaveis nos endpoints runtime existentes.

### 3.2. Gaps que a 2A precisa fechar

- `RequestDetailsDialog` do piloto nao renderiza `formData`, timeline, progresso nem anexos;
- a visibilidade da aba `Chamados atuais` ainda depende de permissao generica (`canManageRequests`) no frontend;
- busca e filtros estruturantes ainda nao existem no servidor alem do filtro canonico de `current`;
- a operacao ainda vive fragmentada entre `/pilot/facilities`, `/requests` e `/me/tasks`;
- o frontend oficial ainda nao existe fora do namespace `pilot/*`.

### 3.3. Direcao de transicao

- `/gestao-de-chamados` nasce como rota oficial principal;
- a entrada da nova rota acontece no dropdown do usuario, na secao de ferramentas;
- a sidebar continua apontando apenas para a superficie de abertura de chamados;
- `/pilot/facilities` permanece temporariamente disponivel como fallback operacional;
- `/me/tasks` permanece disponivel durante estabilizacao, mas deixa de ser a navegacao principal da experiencia operacional;
- `/requests` permanece como superficie complementar do solicitante e nao faz parte da substituicao central da 2A.
- arquivos, componentes e rotas legadas permanecem ativos durante a transicao e so podem ser substituidos definitivamente apos testes end-to-end.

---

## 4. Decisoes Fechadas da 2A

### 4.1. Rota oficial dedicada

- a experiencia oficial nasce em `/gestao-de-chamados`;
- a pagina usa o `PageHeader` e o shell padrao do app;
- o item de navegacao da nova experiencia entra no dropdown do usuario, na secao de ferramentas;
- a sidebar principal nao recebe um novo item para `/gestao-de-chamados`.

### 4.2. Namespace oficial proprio

- a 2A nao expande `src/components/pilot/*` como namespace final;
- o build oficial nasce em `src/components/workflows/management/*` e `src/lib/workflows/management/*`;
- helpers realmente reutilizaveis podem ser promovidos do piloto, mas sem fazer o front oficial depender semanticamente de `pilot/*`;
- a superficie oficial sera reescrita de forma modular, podendo aproveitar a estrutura mental das paginas atuais, mas sem evoluir a pagina legada como base principal.

### 4.3. Endpoints resumidos sao preservados e evoluidos

- `current`, `assignments` e `completed` continuam sendo os endpoints canonicos das listas;
- eles recebem filtros oficiais opcionais, sem quebrar o contrato consumido pelo piloto;
- `mine` permanece fora da rota oficial da 2A.

### 4.4. Ownership explicito via bootstrap

- a aba `Chamados atuais` passa a depender de um contrato explicito de bootstrap;
- esse bootstrap consulta ownership em `workflowTypes_v2`, nao o resultado da fila;
- a query da fila continua protegida por authz, mas visibilidade da tab nao depende de “deu vazio”.

### 4.5. Detalhe rico em endpoint separado

- o modal oficial consome `GET /api/workflows/read/requests/[requestId]`;
- o endpoint compoe request + versao publicada + regras de authz de leitura;
- `formData`, timeline, progresso e anexos permanecem fora do contrato de lista.

### 4.6. Busca e filtros estruturantes ficam no servidor

- `requestId`, workflow, solicitante, area, SLA e periodo sao aplicados na camada `read/*`;
- filtros cosmeticos locais permanecem permitidos apenas sobre o resultado ja retornado;
- o frontend oficial usa query params sincronizados com a URL para tornar o estado compartilhavel.

### 4.7. Segmentacao operacional continua dentro da aba

- `Atribuicoes e acoes` continua uma aba unica;
- a tela oficial preserva a separacao visual entre `Atribuidos a mim` e `Acoes pendentes para mim`;
- essa separacao sera implementada com **subtabs explicitas** dentro da aba;
- a separacao deixa de depender da leitura manual do card.

### 4.8. Nivel de acabamento visual da 2A

- a 2A nao sera apenas uma translacao funcional do piloto com novo styling;
- a superficie oficial deve nascer com acabamento mais polido e linguagem visual de produto;
- isso nao autoriza recriar a arquitetura da tela sem reaproveitar os contratos ja validados na Fase 1;
- o build deve equilibrar:
  - reescrita modular da experiencia oficial;
  - reaproveitamento pragmatico dos contratos e patterns corretos;
  - preservacao das superfices antigas durante a transicao.

---

## 5. Arquitetura da Solucao

### 5.1. Diagrama arquitetural

```text
src/app/(app)/gestao-de-chamados/page.tsx
  |
  v
WorkflowManagementPage
  |
  +--> useWorkflowManagement(searchParams state)
  |       |
  |       +--> GET /api/workflows/read/management/bootstrap
  |       +--> GET /api/workflows/read/current?...filters
  |       +--> GET /api/workflows/read/assignments?...filters
  |       +--> GET /api/workflows/read/completed?...filters
  |       +--> GET /api/workflows/read/requests/[requestId]
  |       +--> POST /api/workflows/runtime/requests/[id]/assign
  |       +--> POST /api/workflows/runtime/requests/[id]/finalize
  |       +--> POST /api/workflows/runtime/requests/[id]/archive
  |
  +--> ManagementToolbar
  +--> CurrentQueuePanel
  +--> AssignmentsPanel
  +--> CompletedPanel
  +--> RequestDetailDialog
            |
            v
  getWorkflowRequestByRequestId()
  getWorkflowVersion()
  assertCanReadRequest()
            |
            v
  Firestore
    - workflowTypes_v2
    - workflowTypes_v2/{workflowTypeId}/versions/{version}
    - workflows_v2
```

### 5.2. Fluxo por camadas

```text
LAYER 1 (Route / shell)
1. /gestao-de-chamados vira o entrypoint oficial da operacao.
2. O dropdown do usuario aponta para a nova rota, sem remover as rotas antigas.

LAYER 2 (Frontend orchestration)
3. useWorkflowManagement centraliza bootstrap, listas, detalhe e mutacoes.
4. O estado de tab + filtros e serializado na URL para deep-link e refresh seguro.

LAYER 3 (Read API)
5. current / assignments / completed recebem filtros oficiais opcionais.
6. management/bootstrap informa ownership explicito e opcoes de filtros.
7. requests/[requestId] entrega detalhe rico pronto para o modal.

LAYER 4 (Domain services)
8. query services continuam consultando workflows_v2 por escopo do ator.
9. filtros adicionais sao aplicados no servidor sobre o dataset do escopo.
10. detail service compoe request + version + timeline + anexos.

LAYER 5 (Runtime / persistence)
11. mutacoes runtime continuam usando os endpoints existentes.
12. nenhuma reescrita do motor ou da persistencia base faz parte da 2A.
```

### 5.3. Estado gerenciado no frontend oficial

| Estado | Armazenamento | Lifecycle |
|-------|---------------|-----------|
| `activeTab` | URL search params + state derivado | inicializa pela URL; persiste em navegacao |
| `filters` | URL search params | compartilhavel por link e restore em refresh |
| `bootstrap` | React Query | carregado no mount; invalida raramente |
| listas por aba | React Query | recarregadas quando tab/filtros mudam ou apos mutacoes |
| `selectedRequestId` | `useState` local | abre/fecha o modal oficial |
| detalhe do request | React Query | so consulta quando existe `selectedRequestId` |
| estado de mutacoes | React Query mutation | feedback otimista controlado e invalidacao de listas + detalhe |

### 5.4. Estrutura visual oficial

- cabecalho com titulo `Gestao de chamados` e descricao curta;
- barra superior unica com busca, filtros e indicadores resumidos;
- tabs principais:
  - `Chamados atuais`
  - `Atribuicoes e acoes`
  - `Concluidas`
- subtabs internas persistentes em `Atribuicoes e acoes`:
  - `Atribuidos a mim`
  - `Acoes pendentes para mim`
- listagem em cards operacionais evoluindo o padrao de `RequestSummaryList`;
- modal responsivo de detalhe rico, com foco operacional centralizado.
- componentes oficiais novos e modularizados em `workflows/management/*`, sem alteracao estrutural da pagina legada como base da nova experiencia.

---

## 6. ADRs

### ADR-2A.1: A rota oficial nasce fora de `pilot/*`

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-01 |
| Context | O piloto validou a arquitetura, mas a 2A precisa se tornar superficie oficial de produto. |

**Choice:** criar a nova UI em `src/components/workflows/management/*` e `src/lib/workflows/management/*`, preservando o piloto apenas como referencia e fallback.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| evoluir `src/components/pilot/facilities/*` ate virar oficial | cristaliza semantica de piloto no codigo principal |
| reconstruir a partir de `/requests` e `/me/tasks` | reaproveita superfices legadas menos alinhadas ao motor v2 |

**Consequences:**

- positivo: separacao clara entre legado validatorio e produto oficial;
- positivo: promocao seletiva de patterns do piloto;
- negativo: cria trabalho inicial de extração/duplicacao controlada.

### ADR-2A.2: Listas resumidas permanecem nos endpoints existentes

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-01 |
| Context | A Fase 1 ja publicou contratos de lista estaveis consumidos pelo piloto. |

**Choice:** manter `current`, `assignments` e `completed` como endpoints canonicos, adicionando filtros opcionais e metadados oficiais sem quebrar o payload base.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| criar um endpoint monolitico unico para toda a tela | aumenta acoplamento, payload e custo de invalidação |
| manter filtros apenas client-side | conflita com o DEFINE da 2A |

**Consequences:**

- positivo: reaproveita read-side ja validado;
- positivo: o piloto continua funcional sem retrabalho;
- negativo: exige cuidado para manter compatibilidade retroativa.

### ADR-2A.3: Ownership explicito vem de bootstrap, nao de permissao generica

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-01 |
| Context | `canManageRequests` hoje e amplo demais para representar ownership real por workflow/area. |

**Choice:** criar `GET /api/workflows/read/management/bootstrap` como bootstrap da tela oficial, separando:

- `ownership`, derivado dos scopes de ownership do ator em `workflowTypes_v2`, para governar a visibilidade da aba `Chamados atuais`;
- `filterOptions`, derivados do escopo operacional visivel do ator, para alimentar filtros da tela oficial sem depender apenas de ownership.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| usar fila vazia para esconder a aba | contradiz decisao funcional fechada |
| continuar usando apenas `canManageRequests` | mistura permissao administrativa com ownership operacional |

**Consequences:**

- positivo: UI mais governavel e previsivel;
- positivo: tab `Chamados atuais` fica semanticamente correta;
- positivo: executores sem ownership continuam recebendo filtros uteis para `Atribuicoes e acoes` e `Concluidas`;
- negativo: adiciona uma consulta bootstrap nova no mount da pagina.

### ADR-2A.4: Detalhe rico e um contrato separado e composto no servidor

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-01 |
| Context | Listas resumidas nao devem carregar `formData`, `history`, steps completos e anexos. |

**Choice:** criar `GET /api/workflows/read/requests/[requestId]` que compoe request operacional + versao publicada + authz de leitura.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| inflar `WorkflowReadSummary` com detalhe rico | degrada performance e acopla lista a detalhe |
| ler `workflows_v2` direto do cliente | rompe seguranca e contradiz a arquitetura validada |

**Consequences:**

- positivo: lista continua leve e detalhe fica completo;
- positivo: timeline/progresso/anexos passam a ter contrato canonico;
- negativo: novo service backend precisa mapear tipos e labels de campos.

### ADR-2A.5: Filtros oficiais sao server-side, mas sem reabrir o schema do runtime

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-01 |
| Context | A 2A precisa de busca/filtros oficiais, mas o roadmap explicita que a fundacao do modelo nao deve ser redesenhada. |

**Choice:** aplicar filtros oficiais na camada `read/*` usando:

- short-circuit por `requestId` quando a busca for exata;
- queries-base Firestore por ownership/participacao ja existentes;
- refinamento server-side por workflow, area, solicitante, SLA e periodo sobre o dataset do escopo do ator.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| criar um novo read model e novas colecoes | escopo excessivo para a 2A |
| manter tudo local no navegador | nao atende o DEFINE |
| introduzir full-text search | explicitamente fora de escopo |

**Consequences:**

- positivo: entrega os filtros da 2A com impacto baixo no runtime;
- positivo: evita migracao/backfill na primeira iteracao oficial;
- negativo: se o volume por ator crescer alem do baseline da Fase 1, sera preciso iterar com enriquecimentos de busca.

---

## 7. File Manifest

### 7.1. Ordem de execucao

| Ordem | Caminho | Acao | Responsabilidade | Agente/Skill sugerido |
|------|---------|------|------------------|-----------------------|
| 1 | [src/lib/workflows/read/types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/types.ts) | Update | Tipos de filtros oficiais, bootstrap e detalhe rico | `build` / `@firebase-specialist` |
| 2 | [src/lib/workflows/read/queries.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/queries.ts) | Update | Filtros server-side opcionais nas listas existentes | `build` / `@firebase-specialist` |
| 3 | [src/lib/workflows/read/detail.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/detail.ts) | Create | Compor request + version + timeline + anexos + progresso | `build` / `@firebase-specialist` |
| 4 | [src/lib/workflows/runtime/authz.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/authz.ts) | Update | Adicionar `assertCanReadRequest()` | `build` / `@firebase-specialist` |
| 5 | [src/app/api/workflows/read/management/bootstrap/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/read/management/bootstrap/route.ts) | Create | Bootstrap de ownership e filtros | `build` / `@firebase-specialist` |
| 6 | [src/app/api/workflows/read/current/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/read/current/route.ts) | Update | Aceitar filtros oficiais opcionais | `build` / `@firebase-specialist` |
| 7 | [src/app/api/workflows/read/assignments/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/read/assignments/route.ts) | Update | Aceitar filtros oficiais opcionais | `build` / `@firebase-specialist` |
| 8 | [src/app/api/workflows/read/completed/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/read/completed/route.ts) | Update | Aceitar filtros oficiais opcionais | `build` / `@firebase-specialist` |
| 9 | [src/app/api/workflows/read/requests/[requestId]/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/read/requests/[requestId]/route.ts) | Create | Endpoint de detalhe rico | `build` / `@firebase-specialist` |
| 10 | [src/lib/workflows/management/types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/types.ts) | Create | DTOs oficiais de frontend | `build` / `@react-frontend-developer` |
| 11 | [src/lib/workflows/management/api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/api-client.ts) | Create | Client HTTP oficial da tela | `build` / `@react-frontend-developer` |
| 12 | [src/lib/workflows/management/query-keys.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/query-keys.ts) | Create | Chaves React Query da 2A | `build` / `@react-frontend-developer` |
| 13 | [src/lib/workflows/management/presentation.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/presentation.ts) | Create | Labels, badges e formatacao oficial | `build` / `@react-frontend-developer` |
| 14 | [src/hooks/use-workflow-management.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-workflow-management.ts) | Create | Orquestracao de bootstrap, listas, detalhe e mutacoes | `build` / `@react-frontend-developer` |
| 15 | [src/components/workflows/management/WorkflowManagementPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/WorkflowManagementPage.tsx) | Create | Container principal da superficie oficial | `build` / `@react-frontend-developer` |
| 16 | [src/components/workflows/management/ManagementToolbar.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/ManagementToolbar.tsx) | Create | Busca, filtros e indicadores | `build` / `@react-frontend-developer` |
| 17 | [src/components/workflows/management/RequestList.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestList.tsx) | Create | Evolucao oficial de `RequestSummaryList` | `build` / `@react-frontend-developer` |
| 18 | [src/components/workflows/management/CurrentQueuePanel.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/CurrentQueuePanel.tsx) | Create | Aba `Chamados atuais` | `build` / `@react-frontend-developer` |
| 19 | [src/components/workflows/management/AssignmentsPanel.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/AssignmentsPanel.tsx) | Create | Aba `Atribuicoes e acoes` com segmentacao | `build` / `@react-frontend-developer` |
| 20 | [src/components/workflows/management/CompletedPanel.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/CompletedPanel.tsx) | Create | Aba `Concluidas` | `build` / `@react-frontend-developer` |
| 21 | [src/components/workflows/management/RequestDetailDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestDetailDialog.tsx) | Create | Modal oficial com detalhe rico | `build` / `@react-frontend-developer` |
| 22 | [src/components/workflows/management/RequestTimeline.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestTimeline.tsx) | Create | Timeline de eventos | `build` / `@react-frontend-developer` |
| 23 | [src/components/workflows/management/RequestProgress.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestProgress.tsx) | Create | Progresso de etapas | `build` / `@react-frontend-developer` |
| 24 | [src/components/workflows/management/RequestFormData.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestFormData.tsx) | Create | Renderizacao oficial de `formData` e anexos | `build` / `@react-frontend-developer` |
| 25 | [src/app/(app)/gestao-de-chamados/page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/gestao-de-chamados/page.tsx) | Create | Entry point da rota oficial | `build` / `@react-frontend-developer` |
| 26 | [src/components/layout/AppLayout.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/layout/AppLayout.tsx) | Update | Atualizar o dropdown do usuario para expor a nova rota sem remover os atalhos legados | `build` / `@react-frontend-developer` |
| 27 | [src/lib/workflows/read/__tests__/read-api-contract.test.js](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/__tests__/read-api-contract.test.js) | Update | Cobrir bootstrap, filtros e detalhe rico | `build` |
| 28 | [src/lib/workflows/read/__tests__/queries.test.js](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/__tests__/queries.test.js) | Update | Cobrir filtros oficiais server-side | `build` |
| 29 | [src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx) | Create | Cobrir tab visibility, filtros e detalhe | `build` |

### 7.2. Promocoes do piloto para a superficie oficial

Podem ser promovidos como referencia, mas nao copiados cegamente:

- envelope HTTP e `authenticatedWorkflowFetch()` de [api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/api-client.ts);
- padrao visual de card + CTA unico de [RequestSummaryList.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/RequestSummaryList.tsx);
- semantica de badges e acoes de [presentation.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/pilot/presentation.ts);
- orquestracao React Query de [use-facilities-pilot.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-facilities-pilot.ts).

Nao devem ser promovidos como produto final:

- namespace `pilot/*`;
- regra de visibilidade por `canManageRequests`;
- modal resumido atual;
- dependencia de filtro local por workflow como estrategia principal.

---

## 8. Contratos e Patterns

### 8.1. Bootstrap oficial

`GET /api/workflows/read/management/bootstrap`

Responsabilidades:

- informar se o usuario possui ownership explicito;
- entregar workflows e areas disponiveis para filtros a partir do escopo operacional visivel do ator, sem scan irrestrito da colecao inteira;
- definir se a aba `Chamados atuais` deve aparecer;
- manter a tela oficial desacoplada de permissoes administrativas genericas.

Response:

```json
{
  "ok": true,
  "data": {
    "actor": {
      "actorUserId": "12345",
      "actorName": "Maria Silva"
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
        "facilities_solicitacao_suprimentos"
      ],
      "areaIds": ["facilities"]
    },
    "filterOptions": {
      "workflows": [
        {
          "workflowTypeId": "facilities_manutencao_solicitacoes_gerais",
          "workflowName": "Manutencao / Solicitacoes Gerais",
          "areaId": "facilities"
        },
        {
          "workflowTypeId": "facilities_solicitacao_compras",
          "workflowName": "Solicitacao de Compras",
          "areaId": "facilities"
        }
      ],
      "areas": [
        {
          "areaId": "facilities",
          "label": "Facilities e Suprimentos"
        }
      ]
    }
  }
}
```

### 8.2. Filtros oficiais nas listas

Filtros opcionais compartilhados por `current`, `assignments` e `completed`:

```ts
type WorkflowManagementFilters = {
  requestId?: number;
  workflowTypeId?: string;
  areaId?: string;
  requesterQuery?: string;
  slaState?: 'on_track' | 'at_risk' | 'overdue';
  periodFrom?: string; // ISO date
  periodTo?: string;   // ISO date
};
```

Regras:

- `requestId` tem precedencia e executa lookup direto por `getWorkflowRequestByRequestId()`;
- `workflowTypeId` e `areaId` usam os campos ja existentes no read model;
- `requesterQuery` e refinamento server-side em memoria sobre o dataset ja restrito ao ator; nao e query nativa do Firestore;
- `slaState` e periodo sao aplicados no servidor apos a query-base do escopo do ator;
- o frontend serializa apenas filtros ativos na URL;
- o piloto continua operando porque todos os params sao opcionais.

### 8.3. Endpoint de detalhe rico

`GET /api/workflows/read/requests/[requestId]`

Responsabilidades:

- validar authz de leitura no servidor;
- entregar `formData` rotulado conforme a versao publicada;
- mapear timeline e progresso de etapas;
- extrair anexos de campos `type: 'file'` a partir da versao + `formData`;
- informar permissoes operacionais do ator para o modal.

Response:

```json
{
  "ok": true,
  "data": {
    "summary": {
      "requestId": 1042,
      "workflowTypeId": "facilities_solicitacao_suprimentos",
      "workflowVersion": 1,
      "workflowName": "Solicitacao de Suprimentos",
      "currentStepId": "triage",
      "currentStepName": "Triagem",
      "currentStatusKey": "waiting_action"
    },
    "permissions": {
      "canAssign": false,
      "canFinalize": true,
      "canArchive": false
    },
    "formData": [
      {
        "fieldId": "descricao",
        "label": "Descricao",
        "type": "textarea",
        "value": "Solicitacao urgente"
      },
      {
        "fieldId": "anexo_planilha",
        "label": "Planilha",
        "type": "file",
        "value": "https://firebasestorage.googleapis.com/..."
      }
    ],
    "attachments": [
      {
        "fieldId": "anexo_planilha",
        "label": "Planilha",
        "url": "https://firebasestorage.googleapis.com/..."
      }
    ],
    "progress": {
      "currentStepId": "triage",
      "steps": [
        { "stepId": "open", "stepName": "Abertura", "kind": "start", "state": "completed" },
        { "stepId": "triage", "stepName": "Triagem", "kind": "work", "state": "active" },
        { "stepId": "done", "stepName": "Concluido", "kind": "final", "state": "pending" }
      ]
    },
    "timeline": [
      {
        "action": "request_opened",
        "timestamp": "2026-04-01T10:00:00.000Z",
        "userName": "Maria Silva",
        "details": {}
      }
    ]
  }
}
```

### 8.4. Authz de leitura do detalhe

`assertCanReadRequest()` deve permitir leitura quando o ator for:

- owner vigente do request;
- requester do request;
- responsavel atual;
- destinatario de acao pendente;
- participante operacional registrado em `operationalParticipantIds`.

Isso garante que o detalhe respeite o request e nao apenas o filtro da tela.

### 8.5. Pattern 1: Hook oficial com URL state

```ts
// src/hooks/use-workflow-management.ts
'use client';

import { useDeferredValue, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { managementKeys } from '@/lib/workflows/management/query-keys';
import { getManagementBootstrap, getOfficialCurrentQueue } from '@/lib/workflows/management/api-client';

export function useWorkflowManagement(filters: WorkflowManagementFilters, activeTab: ManagementTab) {
  const deferredFilters = {
    ...filters,
    requesterQuery: useDeferredValue(filters.requesterQuery ?? ''),
  };

  const bootstrapQuery = useQuery({
    queryKey: managementKeys.bootstrap(),
    queryFn: getManagementBootstrap,
  });

  const currentQuery = useQuery({
    queryKey: managementKeys.current(deferredFilters),
    queryFn: () => getOfficialCurrentQueue(deferredFilters),
    enabled: activeTab === 'current' && bootstrapQuery.data?.capabilities.canViewCurrentQueue === true,
  });

  return { bootstrapQuery, currentQuery };
}
```

### 8.6. Pattern 2: Filtros oficiais sem quebrar o endpoint herdado

```ts
// src/lib/workflows/read/queries.ts
export async function queryOfficialCurrentQueue(
  actorUserId: string,
  currentFilter: CurrentQueueFilter,
  filters: WorkflowManagementFilters,
) {
  if (filters.requestId) {
    return queryScopedExactRequest(actorUserId, filters.requestId, 'current');
  }

  const items = await queryOwnerCurrentQueue(actorUserId, currentFilter);
  return applyOfficialReadFilters(items, filters, { monthField: null });
}
```

### 8.7. Pattern 3: Composer de detalhe rico

```ts
// src/lib/workflows/read/detail.ts
export async function getWorkflowRequestDetail(requestId: number, actorUserId: string) {
  const requestEntry = await getWorkflowRequestByRequestId(requestId);
  if (!requestEntry) throw new RuntimeError(RuntimeErrorCode.NOT_FOUND, 'Chamado nao encontrado.', 404);

  assertCanReadRequest(requestEntry.data, actorUserId);

  const version = await getWorkflowVersion(
    requestEntry.data.workflowTypeId,
    requestEntry.data.workflowVersion,
  );

  return {
    summary: mapWorkflowReadSummaryFromRequest(requestEntry),
    formData: buildRequestFormDataView(requestEntry.data, version),
    attachments: buildRequestAttachmentsView(requestEntry.data, version),
    progress: buildRequestProgressView(requestEntry.data, version),
    timeline: buildRequestTimelineView(requestEntry.data.history),
  };
}
```

### 8.8. Pattern 4: Renderizacao de anexos sem depender do Firestore manual

```ts
// src/components/workflows/management/RequestFormData.tsx
export function RequestFormData({ fields, attachments }: RequestFormDataProps) {
  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.fieldId} className="rounded-md border p-4">
          <p className="text-sm font-medium">{field.label}</p>
          {field.type === 'file' ? (
            <a href={field.value as string} target="_blank" rel="noreferrer" className="text-sm underline">
              Abrir anexo
            </a>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">{String(field.value ?? '-')}</p>
          )}
        </div>
      ))}
    </div>
  );
}
```

Observacao: na Fase 1 os uploads gravam `fileUrl` em `formData`. O detalhe oficial consegue renderizar anexos com qualidade suficiente a partir desse valor, mesmo sem metadado adicional.

---

## 9. API Contract

### 9.1. `GET /api/workflows/read/management/bootstrap` (novo)

- autentica o ator via `authenticateRuntimeActor()`;
- consulta ownership em `workflowTypes_v2`;
- retorna capacidades e opcoes de filtros.

### 9.2. `GET /api/workflows/read/current` (evolucao sem quebra)

Query params opcionais:

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

Query params opcionais iguais ao contrato acima, exceto `filter`.

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

Query params opcionais:

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

### 9.5. `GET /api/workflows/read/requests/[requestId]` (novo)

- entrega detalhe rico do request;
- nenhum endpoint runtime de mutacao e alterado pela 2A.

### 9.6. Mutacoes existentes preservadas

Continuam sendo usadas sem mudanca de contrato:

- `POST /api/workflows/runtime/requests/[id]/assign`
- `POST /api/workflows/runtime/requests/[id]/finalize`
- `POST /api/workflows/runtime/requests/[id]/archive`

---

## 10. Database Schema

### 10.1. Mudancas obrigatorias de schema

Nenhuma mudanca obrigatoria no schema base de `workflows_v2`, `workflowTypes_v2` ou `versions/*` faz parte da 2A.

### 10.2. Leitura enriquecida

Os enriquecimentos da 2A sao obtidos por composicao de leitura:

- `formData` vem do proprio `WorkflowRequestV2`;
- timeline vem de `history`;
- progresso vem de `stepStates` + `stepOrder` + `stepsById` da versao publicada;
- anexos sao derivados de campos `type: 'file'` na versao e valores correspondentes em `formData`;
- ownership explicito vem de `workflowTypes_v2.ownerUserId`.

### 10.3. Indices

Nao ha novo conjunto obrigatorio de indices no primeiro build da 2A se as listas continuarem usando as queries-base ja validadas da Fase 1.

Se o build optar por pushdown adicional de filtros no Firestore durante a implementacao, os indices novos devem ser adicionados apenas de forma aditiva e documentados no report de build.

---

## 11. Testing Strategy

### 11.1. Unit tests

| Componente | Cobertura |
|-----------|-----------|
| `applyOfficialReadFilters()` | requestId, workflow, area, solicitante, SLA e periodo |
| `assertCanReadRequest()` | owner, requester, responsavel, action recipient, outsider |
| `buildRequestFormDataView()` | scalar, vazio, campo ausente, campo `file` |
| `buildRequestProgressView()` | current step, completed steps, final step |
| `buildRequestTimelineView()` | ordem cronologica e mapeamento de labels |

### 11.2. Integration tests

| Fluxo | Cobertura |
|------|-----------|
| `GET /api/workflows/read/management/bootstrap` | actor autenticado com e sem ownership |
| `GET /api/workflows/read/current` | filtro canonico + filtros oficiais opcionais |
| `GET /api/workflows/read/assignments` | separacao `assignedItems` vs `pendingActionItems` com filtros |
| `GET /api/workflows/read/completed` | agrupamento mensal apos filtro |
| `GET /api/workflows/read/requests/[requestId]` | authz, formData, timeline, progress e anexos |

### 11.3. Component tests

| Componente | Cobertura |
|-----------|-----------|
| `WorkflowManagementPage` | render por capability, URL sync, loading/error/empty |
| `ManagementToolbar` | serializacao de filtros na URL |
| `AssignmentsPanel` | troca entre subvisoes |
| `RequestDetailDialog` | render de `formData`, timeline, anexos e acoes operacionais |

### 11.4. Acceptance tests

```gherkin
GIVEN um usuario com ownership explicito em pelo menos um workflow
WHEN acessa /gestao-de-chamados
THEN a aba "Chamados atuais" aparece mesmo antes da primeira query da fila responder
```

```gherkin
GIVEN um executor sem ownership, mas com itens atribuidos
WHEN acessa /gestao-de-chamados
THEN ele ve apenas "Atribuicoes e acoes" e "Concluidas"
```

```gherkin
GIVEN um request com formData, timeline e anexo
WHEN o usuario autorizado abre o detalhe oficial
THEN o modal mostra campos submetidos, progresso de etapas, historico e link do anexo
```

```gherkin
GIVEN que /pilot/facilities continua ativa durante a transicao
WHEN a nova rota apresentar problema operacional
THEN a equipe ainda consegue operar pelo fallback sem rollback de dados
```

---

## 12. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | remover o item de navegacao para `/gestao-de-chamados` | usuarios deixam de entrar pela rota oficial |
| 2 | manter `/pilot/facilities`, `/requests` e `/me/tasks` como superfices operacionais ativas | operacao continua funcional |
| 3 | reverter apenas os novos endpoints `bootstrap` e `requests/[requestId]` se houver regressao isolada | piloto e rotas legadas continuam consumindo contratos antigos |
| 4 | reverter ajustes opcionais em `current`, `assignments` e `completed` preservando o contrato base | o cliente do piloto continua estavel |

Metodo rapido:

```bash
git revert <commit-da-2A>
```

Observacao: como a 2A e additive e nao exige migracao destrutiva, o rollback nao depende de restaurar dados.

Observacao adicional: a 2A nao remove arquivos ou rotas legadas neste primeiro rollout; a substituicao definitiva fica condicionada a uma etapa posterior de testes end-to-end e estabilizacao.

---

## 13. Implementation Checklist

### Pre-Build

- [x] DEFINE aprovado para design
- [x] arquitetura da superficie oficial fechada
- [x] estrategia de detalhe rico definida
- [x] regra de ownership explicito definida
- [x] manifest de arquivos mapeado
- [x] estrategia de transicao sem corte brusco documentada

### Post-Build

- [ ] rota `/gestao-de-chamados` operacional
- [ ] menu principal apontando para a nova rota
- [ ] bootstrap de ownership funcionando sem inferir por fila vazia
- [ ] modal oficial exibindo `formData`, timeline, progresso e anexos
- [ ] filtros oficiais executados no servidor
- [ ] piloto e rotas legadas preservados durante a transicao
- [ ] testes de contrato e UI passando

---

## 14. Specialist Instructions

### Para `@firebase-specialist`

Files to modify:

- `src/lib/workflows/read/types.ts`
- `src/lib/workflows/read/queries.ts`
- `src/lib/workflows/read/detail.ts`
- `src/lib/workflows/runtime/authz.ts`
- `src/app/api/workflows/read/management/bootstrap/route.ts`
- `src/app/api/workflows/read/current/route.ts`
- `src/app/api/workflows/read/assignments/route.ts`
- `src/app/api/workflows/read/completed/route.ts`
- `src/app/api/workflows/read/requests/[requestId]/route.ts`

Key requirements:

- manter compatibilidade do piloto com os endpoints herdados;
- nao introduzir leitura direta do cliente no Firestore;
- validar authz do detalhe no servidor;
- manter o runtime de mutacao intocado;
- evitar migracoes de schema sem necessidade.

### Para `@react-frontend-developer`

Files to modify:

- `src/app/(app)/gestao-de-chamados/page.tsx`
- `src/hooks/use-workflow-management.ts`
- `src/lib/workflows/management/*`
- `src/components/workflows/management/*`
- `src/components/layout/AppLayout.tsx`

Key requirements:

- construir a nova tela a partir dos patterns corretos do piloto, nao das tabelas legadas;
- expor `/gestao-de-chamados` no dropdown do usuario, nao na sidebar principal;
- preservar os atalhos e arquivos legados durante a transicao inicial;
- manter estados de loading/erro/vazio com boa leitura;
- sincronizar filtros e tab na URL;
- preservar segmentacao `Atribuidos a mim` vs `Acoes pendentes para mim`;
- centralizar toda acao operacional no detalhe oficial.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-01 | Codex | Initial design for the official integrated requests frontend (Fase 2A) |
