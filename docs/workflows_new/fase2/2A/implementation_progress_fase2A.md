# Implementation Progress - Fase 2A

Este arquivo deve ser atualizado **ao final de cada build concluido da 2A**.

## Regra de uso

Para cada sub-build concluido:

1. registrar o identificador do build:
   - `2A.1`
   - `2A.2`
   - `2A.3`
   - `2A.4`
2. descrever o que foi entregue;
3. listar validacoes executadas;
4. listar riscos, limites ou pendencias remanescentes;
5. registrar se o build deixou a proxima subetapa desbloqueada.

## Template recomendado

### 2A.X - Nome do build

**Status**

- `planned` | `in_progress` | `completed`

**Entregas**

- item 1
- item 2
- item 3

**Validacao**

- teste 1
- teste 2
- smoke/manual 3

**Riscos / pendencias**

- risco 1
- pendencia 2

**Proximo passo**

- build seguinte ou gate de decisao

## Builds

### 2A.1 - Entrada oficial + shell da nova rota

**Status**

- `completed`

**Entregas**

- rota oficial `/gestao-de-chamados` criada dentro do grupo autenticado `(app)`
- namespace `src/components/workflows/management/*` e `src/lib/workflows/management/*` inaugurado com shell oficial, constantes e helper de discoverability
- entrada `Gestao de chamados` adicionada ao dropdown do usuario em `Ferramentas`, sem alterar a sidebar principal
- testes adicionados para regra de discoverability, ordem das tabs e shell inicial

**Validacao**

- `npm test -- --runInBand src/lib/workflows/management/__tests__/navigation.test.ts src/lib/workflows/management/__tests__/constants.test.ts src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx`
- `npm run typecheck`

**Riscos / pendencias**

- o shell ainda nao possui bootstrap, listas reais, detalhe rico nem URL state; isso permanece para 2A.2+
- a cobertura automatizada desta subetapa nao exercita o dropdown completo do `AppLayout`; a validacao dessa convivencia segue como smoke/manual

**Proximo passo**

- 2A.2 pode acoplar bootstrap, filtros e listas oficiais sobre a mesma rota e o mesmo namespace, sem refactor estrutural

### 2A.2 - Bootstrap + listas oficiais

**Status**

- `completed`

**Entregas**

- endpoint oficial `GET /api/workflows/read/management/bootstrap` criado com `actor`, `capabilities`, `ownership` e `filterOptions`
- rotas herdadas `current`, `assignments` e `completed` evoluidas com filtros opcionais oficiais, lookup exato por `requestId` e `slaState` additive
- superficie oficial `/gestao-de-chamados` conectada a bootstrap real, URL state, toolbar oficial, tabs principais e subtabs explicitas de atribuicoes
- namespace `src/lib/workflows/management/*` ampliado com cliente HTTP, query keys, parser/serializer de URL, presentation helpers e hook oficial
- listas resumidas oficiais implementadas sem acoplamento ao namespace `pilot/*`, preservando a convivencia com o piloto
- cobertura automatizada ampliada para contratos de rota, parser/refino do read-side, discoverability e comportamento da tela oficial

**Validacao**

- `npm test -- --runInBand src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx src/lib/workflows/read/__tests__/read-api-contract.test.js src/lib/workflows/read/__tests__/queries.test.js src/lib/workflows/management/__tests__/constants.test.ts src/lib/workflows/management/__tests__/navigation.test.ts src/lib/workflows/management/__tests__/search-params.test.ts`
- `npm run typecheck`
- `zsh -lc "npm run typecheck 2>&1 | rg 'src/lib/workflows/read/(filters|bootstrap|queries)\\.ts|src/lib/workflows/management|src/components/workflows/management|src/hooks/use-workflow-management\\.ts|src/app/api/workflows/read/management/bootstrap/route\\.ts|src/app/api/workflows/read/(current|assignments|completed)/route\\.ts|src/app/\\(app\\)/gestao-de-chamados/page\\.tsx'"`

**Riscos / pendencias**

- o detalhe rico do chamado, modal completo e anexos continuam reservados para a 2A.3
- o `typecheck` global do repositório segue falhando por passivos antigos fora do escopo deste build; a checagem filtrada dos arquivos alterados ficou limpa
- o limiar exato de `slaState = at_risk` continua inferido no read-side ate decisao de produto posterior

**Proximo passo**

- 2A.3 pode focar no endpoint de detalhe rico e no modal oficial sem reabrir bootstrap, URL state ou contratos basicos das listas

### 2A.3 - Detalhe rico do request

**Status**

- `completed`

**Entregas**

- endpoint oficial `GET /api/workflows/read/requests/[requestId]` criado com envelope canonico `ok/data`, validacao de `requestId` e authz server-side de leitura
- composer `src/lib/workflows/read/detail.ts` implementado para montar `summary`, `permissions`, `formData`, `attachments`, `progress` e `timeline` a partir do request operacional e da versao publicada congelada
- `assertCanReadRequest()` adicionado ao runtime para owner, requester, responsavel, destinatario de acao pendente e participante operacional
- namespace `src/components/workflows/management/*` ampliado com modal oficial `RequestDetailDialog` e blocos dedicados de progresso, dados enviados, anexos e timeline
- listas oficiais passaram a abrir o detalhe rico sob demanda via React Query, sem inflar os contratos de `current`, `assignments` e `completed`
- mutacoes runtime de `assign`, `finalize` e `archive` foram reaproveitadas na tela oficial com invalidacao do cache de listas e do proprio detalhe
- cobertura automatizada expandida para authz, composer de detalhe, contrato da nova rota, dialog oficial e invalidacao do hook

**Validacao**

- `npm test -- --runInBand src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx src/lib/workflows/management/__tests__/constants.test.ts src/lib/workflows/management/__tests__/navigation.test.ts src/lib/workflows/management/__tests__/search-params.test.ts src/lib/workflows/read/__tests__/detail.test.js src/lib/workflows/read/__tests__/read-api-contract.test.js src/lib/workflows/runtime/__tests__/authz.test.js src/hooks/__tests__/use-workflow-management.test.tsx`
- `npm run typecheck`
- `zsh -lc "npm run typecheck 2>&1 | rg 'src/lib/workflows/read/(detail|types)\\.ts|src/lib/workflows/runtime/authz\\.ts|src/app/api/workflows/read/requests/\\[requestId\\]/route\\.ts|src/lib/workflows/management/(types|api-client|query-keys|presentation|constants)\\.ts|src/hooks/use-workflow-management\\.ts|src/hooks/__tests__/use-workflow-management.test\\.tsx|src/components/workflows/management/(WorkflowManagementPage|CurrentQueuePanel|AssignmentsPanel|CompletedPanel|ManagementRequestList|RequestDetailDialog|RequestProgress|RequestFormData|RequestAttachments|RequestTimeline)\\.tsx|src/components/workflows/management/__tests__/(WorkflowManagementPage|RequestDetailDialog)\\.test\\.tsx'"`

**Riscos / pendencias**

- o `typecheck` global do repositório continua falhando por passivos antigos fora do escopo deste build, incluindo `src/components/layout/AppLayout.tsx(253,74)` e diversos módulos legados
- o modal oficial ainda depende do conjunto de colaboradores já carregado pela sessão; não houve redesign da origem desses dados nesta etapa
- o polimento visual final, ajustes finos de affordance e rollout controlado permanecem reservados para a 2A.4

**Proximo passo**

- 2A.4 pode focar em polimento visual, rollout e convivência final com as superfícies legadas sem reabrir os contratos de detalhe rico

### 2A.4 - Polimento e rollout controlado

**Status**

- `completed`

**Entregas**

- primitives compartilhadas de `loading`, `error`, `empty` e `retry` consolidadas em `src/components/workflows/management/ManagementAsyncState.tsx`, removendo estados ad hoc entre tabs e modal
- helpers oficiais de copy e empty state adicionados em `src/lib/workflows/management/presentation.ts`, distinguindo falta de permissao/capability, filtros ativos e ausencia real de dados
- tela oficial `WorkflowManagementPage` refinada com badges de contexto, bootstrap/error state reutilizavel, retry local por aba, fechamento seguro do modal em mudanca de tab/filtro e feedback de mutacao por toast
- paineis `CurrentQueuePanel`, `AssignmentsPanel` e `CompletedPanel` padronizados no contrato `loading -> error -> empty -> data`, com `ManagementRequestList` reduzida ao papel de lista render-only
- `RequestDetailDialog` endurecido com fallback interno, retry de detalhe, erro nao bloqueante durante refresh e preservacao da tela principal em falha parcial
- dropdown do usuario em `AppLayout.tsx` reorganizado para promover `Gestao de chamados` como CTA primario, com destaque herdado de pendencias operacionais e bloco explicito `Atalhos legados durante transicao`
- cobertura automatizada ampliada para rollout do dropdown, helpers de empty state, retry local do hook, skeleton/error state da pagina oficial e retry do dialog

**Validacao**

- `npm test -- --runInBand src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx src/lib/workflows/management/__tests__/presentation.test.ts src/hooks/__tests__/use-workflow-management.test.tsx src/components/layout/__tests__/AppLayout.test.tsx src/lib/workflows/management/__tests__/navigation.test.ts src/lib/workflows/management/__tests__/search-params.test.ts src/lib/workflows/management/__tests__/constants.test.ts`
- `npm test -- --runInBand src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx src/components/layout/__tests__/AppLayout.test.tsx src/lib/workflows/management/__tests__/constants.test.ts src/lib/workflows/management/__tests__/navigation.test.ts src/lib/workflows/management/__tests__/presentation.test.ts src/lib/workflows/management/__tests__/search-params.test.ts src/lib/workflows/read/__tests__/detail.test.js src/lib/workflows/read/__tests__/read-api-contract.test.js src/lib/workflows/runtime/__tests__/authz.test.js src/hooks/__tests__/use-workflow-management.test.tsx`
- `npm run typecheck`
- `zsh -lc "npm run typecheck 2>&1 | rg 'src/components/workflows/management/(ManagementAsyncState|WorkflowManagementPage|ManagementToolbar|ManagementRequestList|CurrentQueuePanel|AssignmentsPanel|CompletedPanel|RequestDetailDialog)\\.tsx|src/components/workflows/management/__tests__/(WorkflowManagementPage|RequestDetailDialog)\\.test\\.tsx|src/components/layout/AppLayout\\.tsx|src/components/layout/__tests__/AppLayout\\.test\\.tsx|src/lib/workflows/management/(presentation)\\.ts|src/lib/workflows/management/__tests__/(presentation|navigation|constants|search-params)\\.test\\.ts|src/hooks/use-workflow-management\\.ts|src/hooks/__tests__/use-workflow-management\\.test\\.tsx'"` sem matches para os arquivos alterados nesta build

**Riscos / pendencias**

- o `typecheck` global do repositório continua falhando por passivos antigos fora do escopo da 2A.4, em módulos administrativos, dashboard e outras áreas legadas
- o smoke desta build ficou forte no eixo automatizado de dropdown, tabs, filtros, detalhe, retry e mutacoes; ainda vale um smoke manual curto de responsividade desktop/mobile antes da promocao operacional definitiva do CTA
- `/requests`, `/me/tasks` e `/pilot/facilities` seguem coexistindo por design; a remocao dos legados continua fora do escopo e depende de decisao posterior de rollout

**Proximo passo**

- a macroetapa 2A fica pronta para rollout controlado da rota oficial, condicionada apenas ao smoke manual final de responsividade e validacao operacional curta antes de rebaixar o protagonismo dos fluxos legados
