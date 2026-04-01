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

- `planned`

### 2A.3 - Detalhe rico do request

**Status**

- `planned`

### 2A.4 - Polimento e rollout controlado

**Status**

- `planned`
