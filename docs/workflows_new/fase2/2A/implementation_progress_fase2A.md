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

- `planned`

### 2A.4 - Polimento e rollout controlado

**Status**

- `planned`
