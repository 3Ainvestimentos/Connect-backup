# DESIGN: Correcoes Pos-Analise Etapa 2 - Fase 1 Facilities

> Generated: 2026-03-26
> Status: Ready for /build
> Source: Requisitos inline (sem DEFINE formal)

## 1. Objetivo e Escopo

### Problema

Apos analise da implementacao da Etapa 2 do motor de workflows v2, foram identificados 4 pontos que comprometem a confiabilidade do piloto para usuarios reais: (1) erros de infraestrutura mascarados como 401, (2) filtros de abas usando flags derivadas em vez de `statusCategory` como eixo canonico, (3) risco de indice composto ausente em runtime, e (4) helper de autenticacao composto exportado mas nao adotado nas rotas.

### O que muda

| Ponto | Resumo |
|-------|--------|
| P1 | `verifyBearerToken` distingue erro de auth vs erro de infra |
| P2 | Queries de aba usam `statusCategory` como filtro primario |
| P3 | Consolidacao de indices apos P2 (remocao de indices desnecessarios) |
| P4 | Todas as rotas adotam `authenticateRuntimeActor` |

### O que NAO muda

- Schema de `workflows_v2` (nenhum campo novo ou removido)
- Logica de negocios dos use cases (open, assign, advance, finalize, archive)
- Helpers de `read-model.ts`
- Collections ou subcollections do Firestore
- Runtime write-side (use cases)

### Restricoes

- Nao redesenhar o runtime write-side
- Nao alterar o schema de `workflows_v2` nem os helpers de `read-model.ts`
- Nao criar novas collections ou novos campos no Firestore
- Nao alterar a logica de negocio dos use cases
- Escopo restrito: auth-helpers, queries, rotas HTTP e testes correspondentes

## 2. Architecture

### Diagrama da Cadeia de Auth (apos correcao)

```text
Request HTTP
    |
    v
+---------------------------+
| Route Handler (POST/GET)  |
|   authenticateRuntimeActor|  <-- P4: ponto unico de auth
+---------------------------+
    |
    v
+---------------------------+
| verifyBearerToken         |  <-- P1: distingue erro
|   extractBearerToken()    |
|   verifyIdToken()         |
|     |                     |
|     +-- auth error -----> RuntimeError(UNAUTHORIZED, 401)
|     |   (code: auth/*)    |   - token expirado
|     |                     |   - assinatura invalida
|     |                     |   - token revogado
|     |                     |
|     +-- infra error ----> re-throw (nao capturado)
|         (ECONNREFUSED,    |   - cai no catch generico da rota
|          app not init,    |   - retorna 500 INTERNAL_ERROR
|          network, etc.)   |
+---------------------------+
    |
    v
+---------------------------+
| resolveRuntimeActor       |
|   query collaborators     |
|     |                     |
|     +-- not found ------> RuntimeError(FORBIDDEN, 403)
|     +-- no id3a --------> RuntimeError(FORBIDDEN, 403)
+---------------------------+
    |
    v
+---------------------------+
| { decodedToken, actor }   |
| Use Case executa          |
+---------------------------+
    |
    v
+---------------------------+
| Catch no Route Handler    |
|   RuntimeError? -> json   |
|   outro? -> 500           |  <-- erros de infra de P1 caem aqui
+---------------------------+
```

### Data Flow das Queries de Aba (apos P2)

```text
GET /api/workflows/read/current?filter={filter}
    |
    v
queryOwnerCurrentQueue(ownerUserId, filter)
    |
    +-- filter='all'
    |     buildOwnerCurrentQueueQuery
    |       ownerUserId + isArchived=false + statusCategory in [open, in_progress, waiting_action]
    |       orderBy lastUpdatedAt desc
    |       INDICE 1: (ownerUserId, isArchived, statusCategory, lastUpdatedAt)
    |
    +-- filter='waiting_assignment'
    |     buildOwnerWaitingAssignmentQuery
    |       ownerUserId + isArchived=false + statusCategory='open'
    |       orderBy lastUpdatedAt desc
    |       INDICE 1: (ownerUserId, isArchived, statusCategory, lastUpdatedAt)
    |
    +-- filter='in_progress'
    |     buildOwnerInProgressQueueQuery
    |       ownerUserId + isArchived=false + statusCategory='in_progress'
    |       orderBy lastUpdatedAt desc
    |       INDICE 1: (ownerUserId, isArchived, statusCategory, lastUpdatedAt)
    |
    +-- filter='waiting_action'
          buildOwnerWaitingActionQuery
            ownerUserId + isArchived=false + statusCategory='waiting_action'
            orderBy lastUpdatedAt desc
            INDICE 1: (ownerUserId, isArchived, statusCategory, lastUpdatedAt)
```

## 3. Decisoes Fechadas por Ponto

### P1: verifyBearerToken distingue erro de auth vs infra

**Situacao atual:** O catch bare em `verifyBearerToken` (linhas 24-28) transforma qualquer excecao de `verifyIdToken()` em `RuntimeError(UNAUTHORIZED, 401)`, incluindo falhas de infraestrutura como Admin nao inicializado, ECONNREFUSED, projeto Firebase errado.

**Contrato apos correcao:**
- Erros cujo `code` comeca com `auth/` (ex: `auth/id-token-expired`, `auth/argument-error`, `auth/id-token-revoked`) sao erros de autenticacao do usuario e retornam `RuntimeError(UNAUTHORIZED, 'Token invalido.', 401)`.
- Qualquer outra excecao (ECONNREFUSED, `app/no-app`, erro de rede, etc.) e re-lancada sem captura, propagando ate o catch generico do route handler que retorna 500.
- A deteccao usa `error.code` (string) que o Firebase Admin SDK popula em `FirebaseAuthError`.

### P2: statusCategory como discriminador canonico de aba

**Situacao atual:** As tres queries de aba usam flags booleanas (`hasResponsible`, `hasPendingActions`) como discriminador principal, e herdam `statusCategory in [...]` da base query. Isso significa que a query `in_progress` nao filtra por `statusCategory == 'in_progress'` diretamente -- ela depende de combinacoes de flags.

**Contrato apos correcao:**
- `buildOwnerWaitingAssignmentQuery`: substitui base query + `hasResponsible == false` por query direta com `statusCategory == 'open'`. A semantica se mantem porque documentos com `statusCategory == 'open'` sao exatamente os que ainda nao tem responsavel atribuido.
- `buildOwnerInProgressQueueQuery`: substitui base query + `hasResponsible == true` + `hasPendingActions == false` por query direta com `statusCategory == 'in_progress'`. A semantica se mantem porque o runtime so define `statusCategory = 'in_progress'` quando ha responsavel e nao ha acoes pendentes.
- `buildOwnerWaitingActionQuery`: substitui base query + `hasPendingActions == true` por query direta com `statusCategory == 'waiting_action'`. A semantica se mantem porque o runtime so define `statusCategory = 'waiting_action'` quando ha acoes pendentes.
- Cada query de aba deixa de usar a base query `buildOwnerActiveBaseQuery` e constroi diretamente com `ownerUserId`, `isArchived == false`, `statusCategory == '{valor}'`, `orderBy lastUpdatedAt desc`.
- A base query `buildOwnerActiveBaseQuery` e `buildOwnerCurrentQueueQuery` permanecem inalteradas (usadas pelo filtro `all`).

### P3: Consolidacao de indices

**Situacao atual:** `firestore.indexes.json` contem 3 indices para owner queries:
- Indice 1: `ownerUserId, isArchived, statusCategory, lastUpdatedAt` -- cobre `all` e agora tambem `waiting_assignment`, `in_progress`, `waiting_action` (apos P2)
- Indice 2: `ownerUserId, isArchived, statusCategory, hasResponsible, lastUpdatedAt` -- era necessario para a antiga query de `waiting_assignment`
- Indice 3: `ownerUserId, isArchived, statusCategory, hasPendingActions, lastUpdatedAt` -- era necessario para a antiga query de `in_progress` / `waiting_action`

**Contrato apos correcao:**
- Indice 2 e Indice 3 podem ser removidos de `firestore.indexes.json` porque nenhuma query mais combina `statusCategory` com flags booleanas.
- Manter Indice 1 (cobre todas as 4 variantes de owner queries).
- Demais indices (4-7 no JSON) permanecem inalterados.

### P4: Adocao de authenticateRuntimeActor nas rotas

**Situacao atual:** Todas as 9 rotas (4 read-side + 5 write-side) importam `verifyBearerToken` e `resolveRuntimeActor` separadamente e os chamam em sequencia. O helper composto `authenticateRuntimeActor` existe em `auth-helpers.ts` mas nao e usado.

**Contrato apos correcao:**
- Todas as 9 rotas substituem o par `verifyBearerToken + resolveRuntimeActor` por uma unica chamada a `authenticateRuntimeActor`.
- O import de `resolveRuntimeActor` e removido de cada rota.
- O import de `verifyBearerToken` e removido de cada rota.
- O import de `authenticateRuntimeActor` e adicionado a cada rota (vindo de `@/lib/workflows/runtime/auth-helpers`).
- A variavel `decodedToken` deixa de ser usada diretamente nas rotas (todas usam apenas `actor`), exceto se alguma rota precisar do token decodificado -- nesse caso, usa destructuring do retorno de `authenticateRuntimeActor`.
- A rota `POST /api/workflows/runtime/requests` (open) usa `decodedToken` implicitamente via `actor`, portanto nao precisa mais de acesso direto ao token.

## 4. Architecture Decisions

### ADR-001: Distinguir erros de autenticacao vs infraestrutura no catch de verifyBearerToken

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-03-26 |
| **Context** | O catch bare transforma ECONNREFUSED, app-not-initialized e outros erros de infra em 401, mascarando falhas de plataforma como erro de usuario. Em producao, operadores veriam "Token invalido" quando o problema real e Firebase Admin SDK fora do ar. |

**Choice:** Inspecionar `error.code` (propriedade padrao de `FirebaseAuthError`) e tratar como 401 apenas erros com prefixo `auth/`. Todos os demais sao re-lancados.

**Rationale:**
1. O Firebase Admin SDK sempre popula `error.code` com string `auth/*` para erros de verificacao de token. Isso e documentado e estavel.
2. Re-lancar erros de infra faz com que caiam no catch generico da rota, que ja retorna 500 com `INTERNAL_ERROR` e loga o erro completo via `console.error`.
3. Nao e necessario criar um novo `RuntimeErrorCode` para infra -- o catch generico ja cobre esse caso.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| Criar `RuntimeErrorCode.INTERNAL_ERROR` e lancar de dentro do catch | Adiciona complexidade desnecessaria; o catch generico da rota ja retorna 500 com a mesma informacao. Alem disso, `RuntimeErrorCode` e para erros de dominio, nao de infra. |
| Listar codigos de infra conhecidos para mapear a 500 | Fragil; novos codigos de erro do SDK seriam tratados como 401 por default. Inverter a logica (401 apenas para `auth/*`) e mais seguro. |
| Manter catch bare e logar o erro original antes de lancar 401 | Ainda mascararia o erro para o chamador (retornaria 401 em vez de 500), impedindo retry automatico ou alerta de infra. |

**Consequences:**
- Positivo: Operadores recebem 500 para falhas de infra, habilitando alertas e dashboards corretos.
- Positivo: Clientes podem distinguir "preciso re-autenticar" (401) de "o servidor tem um problema" (500).
- Negativo: Se um novo codigo de erro do SDK nao comecar com `auth/` mas for semanticamente um erro de autenticacao, sera tratado como 500. Risco baixo dado que o padrao `auth/*` e estavel ha anos.

---

### ADR-002: statusCategory como discriminador canonico de aba

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-03-26 |
| **Context** | As queries de aba usam flags derivadas (`hasResponsible`, `hasPendingActions`) como discriminador principal. Isso cria dependencia entre a semantica da aba e a logica de derivacao de flags, alem de exigir indices compostos adicionais. O campo `statusCategory` ja e o discriminador semantico correto e e mantido consistente pelo runtime write-side. |

**Choice:** Reconstruir as 3 queries de aba usando `statusCategory == '{valor}'` como filtro primario, eliminando flags dos filtros de aba. Cada query de aba faz equality filter em `statusCategory` em vez de herdar o `in` da base query.

**Rationale:**
1. `statusCategory` e a fonte de verdade para o estado logico do request. Usar flags derivadas como proxy duplica a semantica e abre margem para inconsistencia.
2. Equality filter (`==`) em `statusCategory` e mais eficiente que `in` com 3 valores, e e coberto pelo mesmo indice composto (Indice 1).
3. Permite remover 2 indices compostos (Indice 2 e 3) que existiam apenas para suportar as combinacoes de flags.
4. A semantica das abas continua identica porque o runtime write-side garante a invariante: `open` <-> `hasResponsible=false`, `in_progress` <-> `hasResponsible=true, hasPendingActions=false`, `waiting_action` <-> `hasPendingActions=true`.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| Manter flags como primario e adicionar statusCategory como secundario | Nao resolve o problema de indices extras nem a inversao semantica. |
| Usar statusCategory apenas para `waiting_assignment` (o caso mais simples) | Inconsistencia entre queries; melhor aplicar o mesmo padrao a todas as 3 abas. |

**Consequences:**
- Positivo: Reduz de 3 para 1 indice necessario para owner queries. Economia de storage e tempo de construcao de indice.
- Positivo: Queries de aba sao auto-explicativas (`statusCategory == 'open'` vs `hasResponsible == false`).
- Negativo: Se a invariante entre `statusCategory` e flags for quebrada por um bug no write-side, as abas podem mostrar dados incorretos. Mitiga-se com testes unitarios do write-side que ja existem.

---

### ADR-003: Adotar authenticateRuntimeActor em todas as rotas

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-03-26 |
| **Context** | O helper `authenticateRuntimeActor` combina `verifyBearerToken` + `resolveRuntimeActor` em uma chamada. Todas as 9 rotas fazem esse par manualmente. Alem de duplicacao, a correcao de P1 precisa ser aplicada em um unico ponto. |

**Choice:** Substituir o par manual `verifyBearerToken` + `resolveRuntimeActor` por `authenticateRuntimeActor` em todas as 9 rotas. Remover imports desnecessarios.

**Rationale:**
1. Centraliza o tratamento de autenticacao. A correcao P1 e aplicada em `verifyBearerToken`, que e chamado por `authenticateRuntimeActor` -- todas as rotas se beneficiam automaticamente.
2. Reduz boilerplate: de 2 linhas + 2 imports para 1 linha + 1 import por rota.
3. O helper ja existe e esta exportado; nao ha custo de criacao.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| Manter o par separado e apenas corrigir P1 em verifyBearerToken | Funciona tecnicamente, mas mantem a duplicacao e o risco de futuras inconsistencias (ex: se um middleware for adicionado entre verify e resolve). |
| Criar um middleware Next.js para auth | Over-engineering para o escopo atual; as rotas sao API routes simples e o helper composto resolve o problema adequadamente. |

**Consequences:**
- Positivo: Unico ponto de autenticacao para todas as rotas.
- Positivo: Rotas ficam mais limpas e focadas no use case.
- Negativo: A rota `open` (POST /requests) faz parse do body entre verify e resolve atualmente; apos a mudanca, resolve sempre executa antes do parse. Impacto nulo porque `resolveRuntimeActor` nao depende do body.

## 5. File Manifest

### Execution Order

| Phase | Files | Agent |
|-------|-------|-------|
| 1. Auth fix (P1) | `auth-helpers.ts`, `errors.ts` | @firebase-specialist |
| 2. Query fix (P2) | `queries.ts` | @firebase-specialist |
| 3. Index cleanup (P3) | `firestore.indexes.json` | @firebase-specialist |
| 4. Route refactor (P4) | 9 route files | @firebase-specialist |
| 5. Tests | 2 test files | @firebase-specialist |

### Detailed Manifest

| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | `src/lib/workflows/runtime/errors.ts` | Modify | Adicionar `INTERNAL_ERROR` ao `RuntimeErrorCode` (opcional, para uso futuro; P1 nao exige) | @firebase-specialist | - |
| 2 | `src/lib/workflows/runtime/auth-helpers.ts` | Modify | P1: distinguir auth vs infra no catch de `verifyBearerToken` | @firebase-specialist | - |
| 3 | `src/lib/workflows/read/queries.ts` | Modify | P2: reconstruir queries de aba com `statusCategory` como eixo | @firebase-specialist | - |
| 4 | `firestore.indexes.json` | Modify | P3: remover indices 2 e 3 (hasResponsible, hasPendingActions) | @firebase-specialist | #3 |
| 5 | `src/app/api/workflows/runtime/requests/route.ts` | Modify | P4: adotar `authenticateRuntimeActor` | @firebase-specialist | #2 |
| 6 | `src/app/api/workflows/runtime/requests/[id]/assign/route.ts` | Modify | P4: adotar `authenticateRuntimeActor` | @firebase-specialist | #2 |
| 7 | `src/app/api/workflows/runtime/requests/[id]/finalize/route.ts` | Modify | P4: adotar `authenticateRuntimeActor` | @firebase-specialist | #2 |
| 8 | `src/app/api/workflows/runtime/requests/[id]/archive/route.ts` | Modify | P4: adotar `authenticateRuntimeActor` | @firebase-specialist | #2 |
| 9 | `src/app/api/workflows/runtime/requests/[id]/advance/route.ts` | Modify | P4: adotar `authenticateRuntimeActor` | @firebase-specialist | #2 |
| 10 | `src/app/api/workflows/read/current/route.ts` | Modify | P4: adotar `authenticateRuntimeActor` | @firebase-specialist | #2 |
| 11 | `src/app/api/workflows/read/assignments/route.ts` | Modify | P4: adotar `authenticateRuntimeActor` | @firebase-specialist | #2 |
| 12 | `src/app/api/workflows/read/completed/route.ts` | Modify | P4: adotar `authenticateRuntimeActor` | @firebase-specialist | #2 |
| 13 | `src/app/api/workflows/read/mine/route.ts` | Modify | P4: adotar `authenticateRuntimeActor` | @firebase-specialist | #2 |
| 14 | `src/lib/workflows/read/__tests__/queries.test.js` | Modify | Atualizar assertions das queries de aba (P2) | @firebase-specialist | #3 |
| 15 | `src/lib/workflows/read/__tests__/read-api-contract.test.js` | Modify | Atualizar mocks para usar `authenticateRuntimeActor` (P4); adicionar caso de erro 500 (P1) | @firebase-specialist | #2, #5-#13 |
| 16 | `src/lib/workflows/runtime/__tests__/auth-helpers.test.js` | Create | Testes unitarios para `verifyBearerToken` com distincao auth/infra (P1) | @firebase-specialist | #2 |

**Nota sobre #1 (errors.ts):** A adicao de `INTERNAL_ERROR` ao `RuntimeErrorCode` e **opcional** nesta iteracao. O P1 funciona sem ela porque erros de infra sao re-lancados e caem no catch generico da rota. Se no futuro se desejar lancar `RuntimeError(INTERNAL_ERROR, ..., 500)` de dentro do helper, o codigo ja estara preparado. A decisao de implementar ou nao fica a criterio do agente de build, mas o design **nao exige** essa mudanca.

## 6. Code Patterns

### Pattern 1: verifyBearerToken apos correcao (P1)

```typescript
// src/lib/workflows/runtime/auth-helpers.ts

import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { resolveRuntimeActor, type RuntimeActor } from './actor-resolution';
import { RuntimeError, RuntimeErrorCode } from './errors';

function extractBearerToken(request: Request): string {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    throw new RuntimeError(RuntimeErrorCode.UNAUTHORIZED, 'Token nao fornecido.', 401);
  }

  const idToken = authHeader.slice('Bearer '.length).trim();
  if (idToken === '') {
    throw new RuntimeError(RuntimeErrorCode.UNAUTHORIZED, 'Token nao fornecido.', 401);
  }

  return idToken;
}

/**
 * Verifies the Bearer token from the request.
 *
 * - Authentication errors (token expired, invalid signature, revoked)
 *   throw RuntimeError with UNAUTHORIZED / 401.
 * - Infrastructure errors (Admin not initialized, network, wrong project)
 *   are re-thrown as-is so the route's generic catch returns 500.
 */
export async function verifyBearerToken(request: Request): Promise<DecodedIdToken> {
  const idToken = extractBearerToken(request);

  try {
    return await getAuth(getFirebaseAdminApp()).verifyIdToken(idToken);
  } catch (error: unknown) {
    const code = error instanceof Error && 'code' in error
      ? (error as { code: string }).code
      : '';

    if (typeof code === 'string' && code.startsWith('auth/')) {
      throw new RuntimeError(RuntimeErrorCode.UNAUTHORIZED, 'Token invalido.', 401);
    }

    // Infrastructure error -- re-throw so the route handler returns 500
    throw error;
  }
}

export async function authenticateRuntimeActor(
  request: Request,
): Promise<{ decodedToken: DecodedIdToken; actor: RuntimeActor }> {
  const decodedToken = await verifyBearerToken(request);
  const actor = await resolveRuntimeActor(decodedToken);
  return { decodedToken, actor };
}
```

### Pattern 2: Queries de aba apos correcao (P2)

```typescript
// src/lib/workflows/read/queries.ts (apenas as funcoes que mudam)

// buildOwnerActiveBaseQuery e buildOwnerCurrentQueueQuery permanecem inalteradas.

export function buildOwnerWaitingAssignmentQuery(db: Firestore, ownerUserId: string): Query {
  return db
    .collection(WORKFLOWS_COLLECTION)
    .where('ownerUserId', '==', ownerUserId)
    .where('isArchived', '==', false)
    .where('statusCategory', '==', 'open')
    .orderBy('lastUpdatedAt', 'desc');
}

export function buildOwnerInProgressQueueQuery(db: Firestore, ownerUserId: string): Query {
  return db
    .collection(WORKFLOWS_COLLECTION)
    .where('ownerUserId', '==', ownerUserId)
    .where('isArchived', '==', false)
    .where('statusCategory', '==', 'in_progress')
    .orderBy('lastUpdatedAt', 'desc');
}

export function buildOwnerWaitingActionQuery(db: Firestore, ownerUserId: string): Query {
  return db
    .collection(WORKFLOWS_COLLECTION)
    .where('ownerUserId', '==', ownerUserId)
    .where('isArchived', '==', false)
    .where('statusCategory', '==', 'waiting_action')
    .orderBy('lastUpdatedAt', 'desc');
}
```

### Pattern 3: Rota apos adocao de authenticateRuntimeActor (P4)

```typescript
// Exemplo: src/app/api/workflows/runtime/requests/[id]/finalize/route.ts
// O mesmo padrao se aplica a todas as 9 rotas.

import { NextResponse } from 'next/server';
import { authenticateRuntimeActor } from '@/lib/workflows/runtime/auth-helpers';
import { finalizeRequest } from '@/lib/workflows/runtime/use-cases/finalize-request';
import { RuntimeError } from '@/lib/workflows/runtime/errors';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const requestId = Number(id);
    if (isNaN(requestId)) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_FORM_DATA', message: 'ID invalido.' },
        { status: 400 },
      );
    }

    const { actor } = await authenticateRuntimeActor(request);

    // --- Parse body ---
    const body = await request.json();
    const { actorName } = body;

    // --- Execute use case ---
    const result = await finalizeRequest({
      requestId,
      actorUserId: actor.actorUserId,
      actorName:
        typeof actorName === 'string' && actorName.trim() !== ''
          ? actorName.trim()
          : actor.actorName,
    });

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    if (error instanceof RuntimeError) {
      return NextResponse.json(
        { ok: false, code: error.code, message: error.message },
        { status: error.httpStatus },
      );
    }

    console.error('[POST /api/workflows/runtime/requests/[id]/finalize] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
```

### Pattern 4: Rota read-side apos P4

```typescript
// Exemplo: src/app/api/workflows/read/assignments/route.ts

import { NextResponse } from 'next/server';
import { queryAssignmentsForActor } from '@/lib/workflows/read/queries';
import type { ReadError, ReadSuccess, WorkflowAssignmentsReadData } from '@/lib/workflows/read/types';
import { authenticateRuntimeActor } from '@/lib/workflows/runtime/auth-helpers';
import { RuntimeError } from '@/lib/workflows/runtime/errors';

export async function GET(request: Request) {
  try {
    const { actor } = await authenticateRuntimeActor(request);
    const data = await queryAssignmentsForActor(actor.actorUserId);

    const response: ReadSuccess<WorkflowAssignmentsReadData> = {
      ok: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof RuntimeError) {
      const response: ReadError = {
        ok: false,
        code: error.code,
        message: error.message,
      };
      return NextResponse.json(response, { status: error.httpStatus });
    }

    console.error('[GET /api/workflows/read/assignments] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
```

## 7. Firestore Indexes

### Estado final de `firestore.indexes.json` (apos P3)

Os indices **removidos** sao os de numero 2 e 3 do array original (os que contem `hasResponsible` e `hasPendingActions`).

| # | Campos | Status | Justificativa |
|---|--------|--------|---------------|
| 1 | `ownerUserId, isArchived, statusCategory, lastUpdatedAt` | MANTER | Cobre `all`, `waiting_assignment`, `in_progress`, `waiting_action` |
| 2 | `ownerUserId, isArchived, statusCategory, hasResponsible, lastUpdatedAt` | REMOVER | Nenhuma query usa `hasResponsible` como filtro apos P2 |
| 3 | `ownerUserId, isArchived, statusCategory, hasPendingActions, lastUpdatedAt` | REMOVER | Nenhuma query usa `hasPendingActions` como filtro apos P2 |
| 4 | `responsibleUserId, isArchived, statusCategory, lastUpdatedAt` | MANTER | Cobre `buildAssignedToMeQuery` |
| 5 | `pendingActionRecipientIds(array), isArchived, statusCategory, lastUpdatedAt` | MANTER | Cobre `buildPendingActionForMeQuery` |
| 6 | `operationalParticipantIds(array), statusCategory, closedAt` | MANTER | Cobre `buildCompletedHistoryQuery` |
| 7 | `requesterUserId, submittedAt` | MANTER | Cobre `buildRequesterHistoryQuery` |
| 8 | `audit_logs: eventType, timestamp` | MANTER | Nao relacionado a esta feature |

```json
{
  "indexes": [
    {
      "collectionGroup": "workflows_v2",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ownerUserId", "order": "ASCENDING" },
        { "fieldPath": "isArchived", "order": "ASCENDING" },
        { "fieldPath": "statusCategory", "order": "ASCENDING" },
        { "fieldPath": "lastUpdatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "workflows_v2",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "responsibleUserId", "order": "ASCENDING" },
        { "fieldPath": "isArchived", "order": "ASCENDING" },
        { "fieldPath": "statusCategory", "order": "ASCENDING" },
        { "fieldPath": "lastUpdatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "workflows_v2",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "pendingActionRecipientIds", "arrayConfig": "CONTAINS" },
        { "fieldPath": "isArchived", "order": "ASCENDING" },
        { "fieldPath": "statusCategory", "order": "ASCENDING" },
        { "fieldPath": "lastUpdatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "workflows_v2",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "operationalParticipantIds", "arrayConfig": "CONTAINS" },
        { "fieldPath": "statusCategory", "order": "ASCENDING" },
        { "fieldPath": "closedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "workflows_v2",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "requesterUserId", "order": "ASCENDING" },
        { "fieldPath": "submittedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "audit_logs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "eventType", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

## 8. Testing Strategy

### Testes a Atualizar

| Arquivo | O que muda | Tipo |
|---------|-----------|------|
| `queries.test.js` | Assertions das 3 queries de aba devem refletir `statusCategory == 'valor'` em vez de flags booleanas | Unit |
| `read-api-contract.test.js` | Mocks devem usar `authenticateRuntimeActor` em vez do par `verifyBearerToken` + `resolveRuntimeActor` | Integration |

### Testes Novos

| Arquivo | Caso de teste | Tipo |
|---------|--------------|------|
| `auth-helpers.test.js` (criar) | `verifyBearerToken` retorna 401 para erro `auth/id-token-expired` | Unit |
| `auth-helpers.test.js` (criar) | `verifyBearerToken` retorna 401 para erro `auth/argument-error` | Unit |
| `auth-helpers.test.js` (criar) | `verifyBearerToken` re-lanca erro sem prefixo `auth/` (ex: `app/no-app`) | Unit |
| `auth-helpers.test.js` (criar) | `verifyBearerToken` re-lanca erro generico sem propriedade `code` | Unit |
| `auth-helpers.test.js` (criar) | `authenticateRuntimeActor` retorna `{ decodedToken, actor }` no caso feliz | Unit |
| `read-api-contract.test.js` | Rota read-side retorna 500 quando `authenticateRuntimeActor` lanca erro de infra (nao-RuntimeError) | Integration |

### Detalhes das Assertions Atualizadas em `queries.test.js`

O teste `materializa os filtros internos de Chamados atuais para atribuicao, andamento e waiting_action` deve ser atualizado para:

```javascript
// waiting_assignment
expect(waitingAssignment.queries[0].operations).toEqual([
  { type: 'where', field: 'ownerUserId', operator: '==', value: 'SMO2' },
  { type: 'where', field: 'isArchived', operator: '==', value: false },
  { type: 'where', field: 'statusCategory', operator: '==', value: 'open' },
  { type: 'orderBy', field: 'lastUpdatedAt', direction: 'desc' },
]);

// in_progress
expect(inProgress.queries[0].operations).toEqual([
  { type: 'where', field: 'ownerUserId', operator: '==', value: 'SMO2' },
  { type: 'where', field: 'isArchived', operator: '==', value: false },
  { type: 'where', field: 'statusCategory', operator: '==', value: 'in_progress' },
  { type: 'orderBy', field: 'lastUpdatedAt', direction: 'desc' },
]);

// waiting_action
expect(waitingAction.queries[0].operations).toEqual([
  { type: 'where', field: 'ownerUserId', operator: '==', value: 'SMO2' },
  { type: 'where', field: 'isArchived', operator: '==', value: false },
  { type: 'where', field: 'statusCategory', operator: '==', value: 'waiting_action' },
  { type: 'orderBy', field: 'lastUpdatedAt', direction: 'desc' },
]);
```

### Detalhes do Mock Atualizado em `read-api-contract.test.js`

```javascript
// Substituir mocks separados:
jest.mock('@/lib/workflows/runtime/auth-helpers', () => ({
  authenticateRuntimeActor: jest.fn(),
}));

// Remover mock de actor-resolution (nao mais importado pelas rotas)

// No beforeEach:
authenticateRuntimeActor.mockResolvedValue({
  decodedToken: { uid: 'firebase-uid-1' },
  actor: buildActor(),
});

// Teste de erro 500 por infra:
it('retorna 500 quando authenticateRuntimeActor lanca erro de infraestrutura', async () => {
  authenticateRuntimeActor.mockRejectedValue(new Error('ECONNREFUSED'));

  const response = await getAssignments(
    new Request('http://localhost/api/workflows/read/assignments', {
      headers: { Authorization: 'Bearer token' },
    }),
  );

  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    ok: false,
    code: 'INTERNAL_ERROR',
    message: 'Erro interno do servidor.',
  });
});
```

### Acceptance Tests

```gherkin
GIVEN um token Bearer expirado na requisicao
WHEN a rota processa a requisicao
THEN retorna 401 com code UNAUTHORIZED

GIVEN Firebase Admin SDK indisponivel (ECONNREFUSED)
WHEN a rota processa a requisicao com token valido
THEN retorna 500 com code INTERNAL_ERROR

GIVEN um owner com chamados em statusCategory 'open', 'in_progress' e 'waiting_action'
WHEN GET /read/current?filter=waiting_assignment
THEN retorna apenas chamados com statusCategory == 'open'

GIVEN um owner com chamados em statusCategory 'open', 'in_progress' e 'waiting_action'
WHEN GET /read/current?filter=in_progress
THEN retorna apenas chamados com statusCategory == 'in_progress'

GIVEN um owner com chamados em statusCategory 'open', 'in_progress' e 'waiting_action'
WHEN GET /read/current?filter=waiting_action
THEN retorna apenas chamados com statusCategory == 'waiting_action'
```

## 9. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | `git revert {commit-hash}` do commit de correcoes | `npm run build` passa |
| 2 | Re-deploy `firestore.indexes.json` com indices originais (indices 2 e 3 restaurados) | Console Firebase mostra indices READY |
| 3 | Verificar que rotas retornam 401 para token invalido | `curl` com token expirado retorna 401 |

**Nota sobre indices:** A remocao de indices (P3) e a unica mudanca que nao e instantaneamente reversivel via `git revert`. Se o revert for necessario, os indices 2 e 3 precisarao ser recriados via `firebase deploy --only firestore:indexes`, o que pode levar alguns minutos. Durante esse periodo, as queries de aba antigas (que usam flags) retornariam `FAILED_PRECONDITION`. Por isso, recomenda-se **primeiro** fazer deploy dos indices restaurados e **depois** reverter o codigo.

**Metodo rapido:** `git revert {commit-hash}` seguido de `firebase deploy --only firestore:indexes`

## 10. Implementation Checklist

### Pre-Build

- [x] Requisitos documentados (inline neste DESIGN)
- [x] Architecture decisions documentadas (ADR-001, ADR-002, ADR-003)
- [x] File manifest completo com 16 arquivos
- [x] Code patterns validados contra codebase existente
- [x] Indices Firestore analisados e plano de consolidacao definido

### Post-Build

- [ ] `verifyBearerToken` distingue `auth/*` de outros erros (P1)
- [ ] Todas as 3 queries de aba usam `statusCategory == 'valor'` como filtro primario (P2)
- [ ] `firestore.indexes.json` nao contem indices com `hasResponsible` ou `hasPendingActions` (P3)
- [ ] Todas as 9 rotas usam `authenticateRuntimeActor` (P4)
- [ ] Nenhuma rota importa `verifyBearerToken` ou `resolveRuntimeActor` diretamente (P4)
- [ ] `npm test` passa (todos os testes)
- [ ] `npm run build` passa sem erros
- [ ] `npm run typecheck` passa sem erros
- [ ] Teste manual: token expirado retorna 401
- [ ] Teste manual: Firebase Admin indisponivel retorna 500

## 11. Specialist Instructions

### For @firebase-specialist

```markdown
Files to modify (in order):
1. src/lib/workflows/runtime/auth-helpers.ts (P1 + P4 -- source of truth)
2. src/lib/workflows/read/queries.ts (P2)
3. firestore.indexes.json (P3)
4. src/app/api/workflows/runtime/requests/route.ts (P4)
5. src/app/api/workflows/runtime/requests/[id]/assign/route.ts (P4)
6. src/app/api/workflows/runtime/requests/[id]/finalize/route.ts (P4)
7. src/app/api/workflows/runtime/requests/[id]/archive/route.ts (P4)
8. src/app/api/workflows/runtime/requests/[id]/advance/route.ts (P4)
9. src/app/api/workflows/read/current/route.ts (P4)
10. src/app/api/workflows/read/assignments/route.ts (P4)
11. src/app/api/workflows/read/completed/route.ts (P4)
12. src/app/api/workflows/read/mine/route.ts (P4)
13. src/lib/workflows/runtime/__tests__/auth-helpers.test.js (P1 -- criar)
14. src/lib/workflows/read/__tests__/queries.test.js (P2 -- atualizar)
15. src/lib/workflows/read/__tests__/read-api-contract.test.js (P4 -- atualizar)

Key requirements:
- P1: A deteccao de erro de auth usa `error.code.startsWith('auth/')`. NAO capturar erros que nao tenham esse prefixo.
- P2: Cada query de aba constroi sua propria chain (nao usa buildOwnerActiveBaseQuery). Usa `statusCategory == 'valor'` com equality, nao `in`.
- P3: Remover APENAS indices 2 e 3 do array. Nao alterar os demais.
- P4: Nas rotas write-side (assign, finalize, archive, advance), a chamada a `authenticateRuntimeActor` deve ocorrer ANTES do parse do body. Na rota open, a chamada pode ocorrer antes ou apos o parse do body (atual ordem e apos validacao basica de campos, manter se preferir).
- P4: Nas rotas read-side, substituir os 2 imports + 2 chamadas por 1 import + 1 chamada.
- Testes: usar `toEqual` com array exata de operations para queries de aba (nao `toContainEqual`).
- NAO modificar errors.ts a menos que decida adicionar INTERNAL_ERROR (opcional).
- NAO modificar actor-resolution.ts.
- NAO modificar read-model.ts ou tipos de runtime.
- NAO adicionar campos novos ao schema.

Restricao de escopo:
- Se encontrar outros problemas durante a implementacao, documente-os mas NAO corrija nesta iteracao.
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-26 | design-agent | Especificacao inicial baseada em analise pos-implementacao Etapa 2 |
