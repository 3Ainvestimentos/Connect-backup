# DESIGN: Gates Server-side das 3 Superfícies V2 (Fase 9.2)

> Generated: 2026-04-12
> Status: Ready for /build
> Source: DEFINE_DEPLOY_ROLLOUT_POS_2B_FASE2.md (seção 9.2)

## 1. Requirements Summary

### Problem

As três superfícies v2 possuem guards client-side (fase 9.1), mas as rotas de API correspondentes usam apenas `authenticateRuntimeActor`, que verifica identidade mas não permissões. Um usuário sem `canOpenRequestsV2` poderia chamar `POST /api/workflows/runtime/requests` diretamente e abrir um request v2. A ocultação visual não é suficiente: o backend precisa impor as mesmas permissões.

A superfície de configuração já está protegida por `authenticateWorkflowConfigAdmin` (verifica `canManageWorkflowsV2`). As superfícies de abertura e gestão precisam de proteção equivalente.

### Success Criteria

| Critério | Alvo |
|----------|------|
| Abertura sem permissão bloqueada | `POST /api/workflows/runtime/requests` retorna 403 para usuário sem `canOpenRequestsV2` |
| Catálogo sem permissão bloqueado | `GET /api/workflows/requester/catalog` retorna 403 para usuário sem `canOpenRequestsV2` |
| Gestão sem permissão bloqueada | Rotas de gestão retornam 403 para usuário sem `canManageRequestsV2` |
| Configuração inalterada | Nenhuma mudança em `/api/admin/request-config/*` (já protegido) |
| Rotas de participação preservadas | `respond-action`, `request-action`, `uploads` permanecem com auth básica |
| Testes cobrindo os 3 cenários | 401 (sem token), 403 (sem permissão), 2xx (autorizado) |

### Constraints

- `authenticateWorkflowConfigAdmin` em `src/lib/workflows/admin-config/auth.ts` é o padrão de referência: verificar token → resolver colaborador → checar permissão → lançar `RuntimeError(FORBIDDEN, ..., 403)`.
- As rotas de participação (`respond-action`, `request-action`, `uploads`, `read/current`, `read/completed`, `read/requests/[requestId]`) permanecem com `authenticateRuntimeActor` para não quebrar fluxos de delegação onde o participante não é um gestor v2.
- `authenticateRuntimeActor` em `auth-helpers.ts` não muda de assinatura.
- Nenhuma migração de Firestore necessária (permissões já vivem em `collaborators/{id}.permissions`).

## 2. Architecture

### System Diagram

```text
+---------------------------------------------+
|  Browser / cliente API                      |
+---------------------------------------------+
                    |
                    v
+---------------------------------------------+
|  Next.js Route Handlers (App Router API)    |
|                                             |
|  REQUESTER SURFACE (canOpenRequestsV2)      |
|  GET  /api/workflows/requester/catalog      |---> authenticateRequesterV2Actor()
|  POST /api/workflows/runtime/requests       |---> authenticateRequesterV2Actor()
|  GET  /api/workflows/read/mine              |---> authenticateRequesterV2Actor()
|                                             |
|  MANAGEMENT SURFACE (canManageRequestsV2)   |
|  GET  /api/workflows/read/management/bootstrap|-> authenticateManagementV2Actor()
|  GET  /api/workflows/read/assignments       |---> authenticateManagementV2Actor()
|  POST /api/workflows/runtime/requests/[id]/advance  |-> authenticateManagementV2Actor()
|  POST /api/workflows/runtime/requests/[id]/archive  |-> authenticateManagementV2Actor()
|  POST /api/workflows/runtime/requests/[id]/assign   |-> authenticateManagementV2Actor()
|  POST /api/workflows/runtime/requests/[id]/finalize |-> authenticateManagementV2Actor()
|                                             |
|  CONFIG SURFACE (canManageWorkflowsV2)      |
|  /api/admin/request-config/*               |---> authenticateWorkflowConfigAdmin() [EXISTENTE]
|                                             |
|  PARTICIPAÇÃO (auth básica — sem mudança)   |
|  POST .../[id]/request-action              |---> authenticateRuntimeActor() [INALTERADO]
|  POST .../[id]/respond-action              |---> authenticateRuntimeActor() [INALTERADO]
|  POST /api/workflows/runtime/uploads       |---> authenticateRuntimeActor() [INALTERADO]
|  GET  /api/workflows/read/current          |---> authenticateRuntimeActor() [INALTERADO]
|  GET  /api/workflows/read/completed        |---> authenticateRuntimeActor() [INALTERADO]
|  GET  /api/workflows/read/requests/[id]    |---> authenticateRuntimeActor() [INALTERADO]
+---------------------------------------------+
                    |
                    v
+---------------------------------------------+
|  src/lib/workflows/runtime/permission-auth.ts |
|                                             |
|  authenticateRequesterV2Actor(request)      |
|    → verifyBearerToken()                    |
|    → Firestore: collaborators where authUid |
|    → check permissions.canOpenRequestsV2    |
|    → throw FORBIDDEN 403 se false           |
|    → return { decodedToken, actor }         |
|                                             |
|  authenticateManagementV2Actor(request)     |
|    → verifyBearerToken()                    |
|    → Firestore: collaborators where authUid |
|    → check permissions.canManageRequestsV2  |
|    → throw FORBIDDEN 403 se false           |
|    → return { decodedToken, actor }         |
+---------------------------------------------+
                    |
                    v
+---------------------------------------------+
|  Firebase Admin / Firestore                 |
|  collaborators/{id}                         |
|    .authUid                                 |
|    .id3a                                    |
|    .name                                    |
|    .email                                   |
|    .permissions: {                          |
|      canOpenRequestsV2: boolean,            |
|      canManageRequestsV2: boolean,          |
|      canManageWorkflowsV2: boolean,         |
|      ...                                    |
|    }                                        |
+---------------------------------------------+
```

### Data Flow

```text
LAYER 1 — Auth de permissão server-side:
  permission-auth.ts
    authenticateRequesterV2Actor / authenticateManagementV2Actor
    → Mesmo fluxo de authenticateWorkflowConfigAdmin em admin-config/auth.ts
    → verifyBearerToken
    → resolveCollaborator por authUid; se não encontrar, fallback por email reconciliado
    → checar flag de permissão → RuntimeError(FORBIDDEN) ou return {decodedToken, actor}

LAYER 2 — Route Handlers:
  Cada route substitui authenticateRuntimeActor() pelo novo helper correspondente.
  O restante do handler não muda: actor.actorUserId / actorName continuam disponíveis.

LAYER 3 — Firestore:
  Mesma coleção collaborators, mesmos campos de permissions adicionados na fase 9.1.
  Nenhuma leitura/escrita adicional além da query de autenticação.
```

### State Management

Nenhum estado novo no frontend. Esta fase é exclusivamente server-side.

| Estado | Storage | Lifecycle |
|--------|---------|-----------|
| `permissions.canOpenRequestsV2` | Firestore `collaborators/{id}.permissions` | Lido a cada request de API durante autenticação |
| `permissions.canManageRequestsV2` | Idem | Idem |

## 3. Architecture Decisions

### ADR-9.2-001: Criar permission-auth.ts espelhando admin-config/auth.ts

| Atributo | Valor |
|----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-12 |
| **Context** | O projeto já tem um padrão estabelecido em `admin-config/auth.ts` para autenticação + verificação de permissão server-side. As novas funções seguem exatamente o mesmo contrato. |

**Choice:** Criar `src/lib/workflows/runtime/permission-auth.ts` com `authenticateRequesterV2Actor` e `authenticateManagementV2Actor`, copiando o padrão de `admin-config/auth.ts`.

**Rationale:**
1. Coerência com o padrão existente e revisado pelo time.
2. Separação de concerns: `auth-helpers.ts` continua focado em identity resolution; `permission-auth.ts` adiciona a camada de autorização.
3. Cada função é autocontida e diretamente testável por mocking do Firestore admin.
4. O fallback por email reconciliado preserva compatibilidade com colaboradores antigos ou ainda não associados por `authUid`.

**Alternatives Rejected:**

| Alternativa | Por que rejeitada |
|-------------|------------------|
| Adicionar funções em `auth-helpers.ts` | Mistura identity resolution com permission enforcement no mesmo arquivo; dificulta testes isolados |
| Parâmetro de permissão em `authenticateRuntimeActor` | Muda a assinatura de uma função já usada em 12+ routes; alto risco de regressão |
| HOC genérico `withPermission(perm, handler)` | Abstração prematura para apenas 2 superfícies; o padrão explícito é mais legível |

**Consequences:**
- Positivo: novos handlers de rota ficam com uma linha de mudança (trocar a função de auth).
- Negativo: um arquivo novo no diretório runtime (custo baixo).

---

### ADR-9.2-002: Escopo conservador — rotas de participação ficam com auth básica

| Atributo | Valor |
|----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-12 |
| **Context** | Rotas como `respond-action` e `request-action` são chamadas por colaboradores que recebem ações delegadas (ex: diretor que aprova), sem necessariamente ter permissão de superfície v2. Bloquear essas rotas por permissão v2 quebraria fluxos de participação em workflows abertos antes do rollout. |

**Choice:** `respond-action`, `request-action`, `uploads`, `read/current`, `read/completed` e `read/requests/[requestId]` permanecem com `authenticateRuntimeActor` (auth básica, sem verificação de permissão v2).

**Rationale:**
1. Participantes de workflow são designados no runtime, não necessariamente são usuários com permissão v2.
2. O guard client-side (fase 9.1) já impede que esses endpoints sejam chamados pelas superfícies v2 sem permissão.
3. A segurança de "quem pode responder" é enforced no próprio use case de negócio (`respondAction`), não no gate de permissão.

**Alternatives Rejected:**

| Alternativa | Por que rejeitada |
|-------------|------------------|
| Proteger `respond-action` por `canManageRequestsV2` | Quebraria participação de colaboradores designados que não são gestores v2 |
| Proteger `uploads` por permissão de surface | `action_response` target serve qualquer participante; split por target complica o handler |

**Consequences:**
- Positivo: zero risco de quebrar flows de participação durante rollout.
- Negativo: endpoint `read/current` continua acessível por qualquer colaborador autenticado (aceitável — retorna apenas dados do próprio ator).
- Risco aceito: como `read/current`, `read/completed` e `read/requests/[requestId]` também são consumidos pela gestão v2, um colaborador autenticado sem `canManageRequestsV2` ainda pode consultar esses endpoints por chamada direta. Nesta fase, o time aceita esse risco para preservar o corte conservador e evitar endurecimento prematuro de rotas compartilhadas entre gestão, requester e participação.

---

### ADR-9.2-003: Retornar RuntimeActor completo (não só token) para manter compatibilidade com use cases

| Atributo | Valor |
|----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-12 |
| **Context** | Os route handlers usam `actor.actorUserId`, `actor.actorName` após a autenticação. As novas funções precisam retornar o mesmo `RuntimeActor` para que o restante do handler não mude. |

**Choice:** `authenticateRequesterV2Actor` e `authenticateManagementV2Actor` retornam `{ decodedToken: DecodedIdToken; actor: RuntimeActor }`, idêntico ao retorno de `authenticateRuntimeActor`.

**Rationale:**
1. Trocar `authenticateRuntimeActor(request)` por `authenticateRequesterV2Actor(request)` nos handlers é uma mudança de uma linha.
2. Nenhum refactor nos use cases ou nas queries downstream.

**Consequences:**
- Positivo: diff mínimo por arquivo de rota.
- Negativo: a query Firestore busca tanto dados de identidade quanto permissões na mesma leitura; nenhuma query extra.

## 4. File Manifest

### Execution Order

| Fase | Arquivos | Agente |
|------|----------|--------|
| 1. Helper de auth com permissão | `permission-auth.ts` | @firebase-specialist |
| 2. Rotas requester | 3 route files | @react-frontend-developer |
| 3. Rotas management | 6 route files | @react-frontend-developer |
| 4. Testes | `permission-auth.test.ts` + route tests | @firebase-specialist |

### Detailed Manifest

| # | Arquivo | Ação | Propósito | Agente | Depende De |
|---|---------|------|-----------|--------|------------|
| 1 | `src/lib/workflows/runtime/permission-auth.ts` | Create | Exporta `authenticateRequesterV2Actor` e `authenticateManagementV2Actor` com verificação de `canOpenRequestsV2` e `canManageRequestsV2` respectivamente | @firebase-specialist | — |
| 2 | `src/app/api/workflows/requester/catalog/route.ts` | Modify | Substituir `authenticateRuntimeActor` por `authenticateRequesterV2Actor` | @react-frontend-developer | #1 |
| 3 | `src/app/api/workflows/runtime/requests/route.ts` | Modify | Substituir `authenticateRuntimeActor` por `authenticateRequesterV2Actor` | @react-frontend-developer | #1 |
| 4 | `src/app/api/workflows/read/mine/route.ts` | Modify | Substituir `authenticateRuntimeActor` por `authenticateRequesterV2Actor` | @react-frontend-developer | #1 |
| 5 | `src/app/api/workflows/read/management/bootstrap/route.ts` | Modify | Substituir `authenticateRuntimeActor` por `authenticateManagementV2Actor` | @react-frontend-developer | #1 |
| 6 | `src/app/api/workflows/read/assignments/route.ts` | Modify | Substituir `authenticateRuntimeActor` por `authenticateManagementV2Actor` | @react-frontend-developer | #1 |
| 7 | `src/app/api/workflows/runtime/requests/[id]/advance/route.ts` | Modify | Substituir `authenticateRuntimeActor` por `authenticateManagementV2Actor` | @react-frontend-developer | #1 |
| 8 | `src/app/api/workflows/runtime/requests/[id]/archive/route.ts` | Modify | Substituir `authenticateRuntimeActor` por `authenticateManagementV2Actor` | @react-frontend-developer | #1 |
| 9 | `src/app/api/workflows/runtime/requests/[id]/assign/route.ts` | Modify | Substituir `authenticateRuntimeActor` por `authenticateManagementV2Actor` | @react-frontend-developer | #1 |
| 10 | `src/app/api/workflows/runtime/requests/[id]/finalize/route.ts` | Modify | Substituir `authenticateRuntimeActor` por `authenticateManagementV2Actor` | @react-frontend-developer | #1 |
| 11 | `src/lib/workflows/runtime/__tests__/permission-auth.test.ts` | Create | Testes unitários de `authenticateRequesterV2Actor` e `authenticateManagementV2Actor` (401, 403, 200) | @firebase-specialist | #1 |
| 12 | `src/app/api/workflows/requester/__tests__/catalog-route.test.ts` | Create | Testes de rota: 401, 403 (sem canOpenRequestsV2), 200 | @firebase-specialist | #2 |
| 13 | `src/app/api/workflows/runtime/requests/__tests__/open-request-route.test.ts` | Create | Testes de rota: 401, 403 (sem canOpenRequestsV2), 201 | @firebase-specialist | #3 |
| 14 | `src/app/api/workflows/read/__tests__/mine-route.test.ts` | Create | Testes de rota: 401, 403 (sem canOpenRequestsV2), 200 | @firebase-specialist | #4 |
| 15 | `src/app/api/workflows/read/__tests__/management-bootstrap-route.test.ts` | Create | Testes de rota: 401, 403 (sem canManageRequestsV2), 200 | @firebase-specialist | #5 |

> **Nota:** Os testes dos arquivos #6–#10 (advance, archive, assign, finalize, assignments) seguem o mesmo padrão dos arquivos #12–#15. O agente pode criar arquivos `__tests__` adjacentes seguindo o modelo `catalog-route.test.ts` de `admin-config`.

## 5. Code Patterns

### Pattern 1: permission-auth.ts (novo arquivo)

```typescript
// src/lib/workflows/runtime/permission-auth.ts
/**
 * @fileOverview Permission-aware authentication for the v2 workflow surfaces.
 *
 * Follows the same pattern as src/lib/workflows/admin-config/auth.ts.
 * Each exported function verifies the bearer token, resolves the collaborator,
 * and checks the surface-specific permission flag.
 */

import type { DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { RuntimeError, RuntimeErrorCode } from '@/lib/workflows/runtime/errors';
import { verifyBearerToken } from '@/lib/workflows/runtime/auth-helpers';
import { normalizeEmail } from '@/lib/email-utils';
import type { RuntimeActor } from '@/lib/workflows/runtime/actor-resolution';

type CollaboratorRecord = {
  id3a?: string;
  name?: string;
  email?: string;
  authUid?: string;
  permissions?: {
    canOpenRequestsV2?: boolean;
    canManageRequestsV2?: boolean;
  };
};

function getDb() {
  return getFirestore(getFirebaseAdminApp());
}

async function resolveCollaboratorWithPermissions(
  decodedToken: DecodedIdToken,
): Promise<{ collaboratorDocId: string; collaborator: CollaboratorRecord }> {
  const authUidSnapshot = await getDb()
    .collection('collaborators')
    .where('authUid', '==', decodedToken.uid)
    .get();

  if (authUidSnapshot.size > 1) {
    throw new RuntimeError(
      RuntimeErrorCode.FORBIDDEN,
      `Usuario autenticado possui ${authUidSnapshot.size} colaboradores associados ao mesmo authUid.`,
      403,
    );
  }

  if (authUidSnapshot.size === 1) {
    const doc = authUidSnapshot.docs[0];
    return { collaboratorDocId: doc.id, collaborator: doc.data() as CollaboratorRecord };
  }

  const emailCandidates = Array.from(
    new Set(
      [decodedToken.email, normalizeEmail(decodedToken.email)].filter(
        (email): email is string => typeof email === 'string' && email.trim() !== '',
      ),
    ),
  );

  if (emailCandidates.length === 0) {
    throw new RuntimeError(
      RuntimeErrorCode.FORBIDDEN,
      'Usuario autenticado nao possui colaborador operacional associado.',
      403,
    );
  }

  const emailSnapshot = await getDb()
    .collection('collaborators')
    .where('email', 'in', emailCandidates)
    .get();

  if (emailSnapshot.empty) {
    throw new RuntimeError(
      RuntimeErrorCode.FORBIDDEN,
      'Usuario autenticado nao possui colaborador operacional associado.',
      403,
    );
  }

  if (emailSnapshot.size > 1) {
    throw new RuntimeError(
      RuntimeErrorCode.FORBIDDEN,
      `Usuario autenticado possui ${emailSnapshot.size} colaboradores associados ao mesmo email reconciliado.`,
      403,
    );
  }

  const doc = emailSnapshot.docs[0];
  return { collaboratorDocId: doc.id, collaborator: doc.data() as CollaboratorRecord };
}

function buildActor(
  collaboratorDocId: string,
  collaborator: CollaboratorRecord,
  decodedToken: DecodedIdToken,
): RuntimeActor {
  if (!collaborator.id3a || collaborator.id3a.trim() === '') {
    throw new RuntimeError(
      RuntimeErrorCode.FORBIDDEN,
      'Colaborador autenticado nao possui id3a operacional configurado.',
      403,
    );
  }

  const actorEmail =
    normalizeEmail(collaborator.email) ?? normalizeEmail(decodedToken.email) ?? '';
  const actorName =
    collaborator.name?.trim() ||
    decodedToken.name?.trim() ||
    actorEmail ||
    collaborator.id3a;

  return {
    actorUserId: collaborator.id3a,
    actorName,
    actorEmail,
    collaboratorDocId,
  };
}

/**
 * Authenticates a request for the v2 requester surface.
 * Requires `permissions.canOpenRequestsV2 === true` in the collaborator document.
 */
export async function authenticateRequesterV2Actor(
  request: Request,
): Promise<{ decodedToken: DecodedIdToken; actor: RuntimeActor }> {
  const decodedToken = await verifyBearerToken(request);
  const { collaboratorDocId, collaborator } =
    await resolveCollaboratorWithPermissions(decodedToken);

  if (!collaborator.permissions?.canOpenRequestsV2) {
    throw new RuntimeError(
      RuntimeErrorCode.FORBIDDEN,
      'Usuario sem permissao para abertura de solicitacoes v2.',
      403,
    );
  }

  return { decodedToken, actor: buildActor(collaboratorDocId, collaborator, decodedToken) };
}

/**
 * Authenticates a request for the v2 management surface.
 * Requires `permissions.canManageRequestsV2 === true` in the collaborator document.
 */
export async function authenticateManagementV2Actor(
  request: Request,
): Promise<{ decodedToken: DecodedIdToken; actor: RuntimeActor }> {
  const decodedToken = await verifyBearerToken(request);
  const { collaboratorDocId, collaborator } =
    await resolveCollaboratorWithPermissions(decodedToken);

  if (!collaborator.permissions?.canManageRequestsV2) {
    throw new RuntimeError(
      RuntimeErrorCode.FORBIDDEN,
      'Usuario sem permissao para gestao de chamados v2.',
      403,
    );
  }

  return { decodedToken, actor: buildActor(collaboratorDocId, collaborator, decodedToken) };
}
```

### Pattern 2: Modificação de route handler (exemplo — catalog)

```typescript
// src/app/api/workflows/requester/catalog/route.ts
// Mudança: trocar authenticateRuntimeActor → authenticateRequesterV2Actor
// ANTES:
import { authenticateRuntimeActor } from '@/lib/workflows/runtime/auth-helpers';
// DEPOIS:
import { authenticateRequesterV2Actor } from '@/lib/workflows/runtime/permission-auth';

// No handler:
// ANTES:
const { actor } = await authenticateRuntimeActor(request);
// DEPOIS:
const { actor } = await authenticateRequesterV2Actor(request);
```

### Pattern 3: Modificação de route handler de gestão (exemplo — advance)

```typescript
// src/app/api/workflows/runtime/requests/[id]/advance/route.ts
// ANTES:
import { authenticateRuntimeActor } from '@/lib/workflows/runtime/auth-helpers';
// DEPOIS:
import { authenticateManagementV2Actor } from '@/lib/workflows/runtime/permission-auth';

// No handler:
// ANTES:
const { actor } = await authenticateRuntimeActor(request);
// DEPOIS:
const { actor } = await authenticateManagementV2Actor(request);
```

### Pattern 4: Teste de rota com permissão (modelo seguindo catalog-route.test.ts)

```typescript
// src/app/api/workflows/requester/__tests__/catalog-route.test.ts
/** @jest-environment node */
export {};

jest.mock('@/lib/workflows/runtime/permission-auth', () => ({
  authenticateRequesterV2Actor: jest.fn(),
}));

jest.mock('@/lib/workflows/requester/build-catalog', () => ({
  buildRequesterCatalog: jest.fn(),
}));

const { RuntimeError, RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
const { authenticateRequesterV2Actor } = require('@/lib/workflows/runtime/permission-auth');
const { buildRequesterCatalog } = require('@/lib/workflows/requester/build-catalog');
const { GET } = require('@/app/api/workflows/requester/catalog/route');

describe('requester catalog route', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    authenticateRequesterV2Actor.mockResolvedValue({
      decodedToken: { uid: 'firebase-uid-1' },
      actor: { actorUserId: 'id3a-1', actorName: 'Test User', actorEmail: 'test@3a.com', collaboratorDocId: 'collab-1' },
    });
  });

  afterEach(() => consoleErrorSpy.mockRestore());

  it('returns 200 with catalog data when authorized', async () => {
    buildRequesterCatalog.mockResolvedValue([]);

    const response = await GET(
      new Request('http://localhost/api/workflows/requester/catalog', {
        headers: { Authorization: 'Bearer valid-token' },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, data: [] });
    expect(authenticateRequesterV2Actor).toHaveBeenCalledTimes(1);
  });

  it('returns 401 when no token provided', async () => {
    authenticateRequesterV2Actor.mockRejectedValue(
      new RuntimeError(RuntimeErrorCode.UNAUTHORIZED, 'Token nao fornecido.', 401),
    );

    const response = await GET(new Request('http://localhost/api/workflows/requester/catalog'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: RuntimeErrorCode.UNAUTHORIZED,
    });
  });

  it('returns 403 when collaborator lacks canOpenRequestsV2', async () => {
    authenticateRequesterV2Actor.mockRejectedValue(
      new RuntimeError(
        RuntimeErrorCode.FORBIDDEN,
        'Usuario sem permissao para abertura de solicitacoes v2.',
        403,
      ),
    );

    const response = await GET(
      new Request('http://localhost/api/workflows/requester/catalog', {
        headers: { Authorization: 'Bearer token-no-perm' },
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: RuntimeErrorCode.FORBIDDEN,
    });
    expect(buildRequesterCatalog).not.toHaveBeenCalled();
  });

  it('returns 500 for unexpected errors', async () => {
    buildRequesterCatalog.mockRejectedValue(new Error('boom'));

    const response = await GET(
      new Request('http://localhost/api/workflows/requester/catalog', {
        headers: { Authorization: 'Bearer valid-token' },
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: 'INTERNAL_ERROR',
    });
  });
});
```

### Pattern 5: Teste unitário de permission-auth.ts

```typescript
// src/lib/workflows/runtime/__tests__/permission-auth.test.ts
/** @jest-environment node */
export {};

jest.mock('@/lib/workflows/runtime/auth-helpers', () => ({
  verifyBearerToken: jest.fn(),
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(),
}));

jest.mock('@/lib/firebase-admin', () => ({
  getFirebaseAdminApp: jest.fn(),
}));

const { RuntimeError, RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
const { verifyBearerToken } = require('@/lib/workflows/runtime/auth-helpers');
const { getFirestore } = require('firebase-admin/firestore');
const {
  authenticateRequesterV2Actor,
  authenticateManagementV2Actor,
} = require('@/lib/workflows/runtime/permission-auth');

const DECODED_TOKEN = { uid: 'firebase-uid-1', email: 'user@3a.com', name: 'Test User' };
const ACTOR_COLLAB = {
  id3a: 'id3a-1',
  name: 'Test User',
  email: 'user@3a.com',
  authUid: 'firebase-uid-1',
};

function makeFirestoreSnap(docs: Array<{ id: string; data: object }>) {
  return {
    empty: docs.length === 0,
    size: docs.length,
    docs: docs.map((d) => ({ id: d.id, data: () => d.data })),
  };
}

function setupFirestore(snap: object) {
  const getMock = jest.fn().mockResolvedValue(snap);
  const whereMock = jest.fn().mockReturnValue({ get: getMock });
  const collectionMock = jest.fn().mockReturnValue({ where: whereMock });
  getFirestore.mockReturnValue({ collection: collectionMock });
}

describe('authenticateRequesterV2Actor', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns actor when canOpenRequestsV2 is true', async () => {
    verifyBearerToken.mockResolvedValue(DECODED_TOKEN);
    setupFirestore(
      makeFirestoreSnap([
        { id: 'collab-1', data: { ...ACTOR_COLLAB, permissions: { canOpenRequestsV2: true } } },
      ]),
    );

    const result = await authenticateRequesterV2Actor(new Request('http://x', { headers: { Authorization: 'Bearer t' } }));
    expect(result.actor.actorUserId).toBe('id3a-1');
  });

  it('throws FORBIDDEN when canOpenRequestsV2 is false', async () => {
    verifyBearerToken.mockResolvedValue(DECODED_TOKEN);
    setupFirestore(
      makeFirestoreSnap([
        { id: 'collab-1', data: { ...ACTOR_COLLAB, permissions: { canOpenRequestsV2: false } } },
      ]),
    );

    await expect(
      authenticateRequesterV2Actor(new Request('http://x', { headers: { Authorization: 'Bearer t' } })),
    ).rejects.toMatchObject({ code: RuntimeErrorCode.FORBIDDEN, httpStatus: 403 });
  });

  it('throws FORBIDDEN when permissions field is absent', async () => {
    verifyBearerToken.mockResolvedValue(DECODED_TOKEN);
    setupFirestore(makeFirestoreSnap([{ id: 'collab-1', data: ACTOR_COLLAB }]));

    await expect(
      authenticateRequesterV2Actor(new Request('http://x', { headers: { Authorization: 'Bearer t' } })),
    ).rejects.toMatchObject({ code: RuntimeErrorCode.FORBIDDEN });
  });

  it('throws FORBIDDEN when collaborator is not found', async () => {
    verifyBearerToken.mockResolvedValue(DECODED_TOKEN);
    setupFirestore(makeFirestoreSnap([]));

    await expect(
      authenticateRequesterV2Actor(new Request('http://x', { headers: { Authorization: 'Bearer t' } })),
    ).rejects.toMatchObject({ code: RuntimeErrorCode.FORBIDDEN, httpStatus: 403 });
  });

  it('propagates UNAUTHORIZED from verifyBearerToken', async () => {
    verifyBearerToken.mockRejectedValue(
      new RuntimeError(RuntimeErrorCode.UNAUTHORIZED, 'Token nao fornecido.', 401),
    );

    await expect(
      authenticateRequesterV2Actor(new Request('http://x')),
    ).rejects.toMatchObject({ code: RuntimeErrorCode.UNAUTHORIZED, httpStatus: 401 });
  });
});

describe('authenticateManagementV2Actor', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns actor when canManageRequestsV2 is true', async () => {
    verifyBearerToken.mockResolvedValue(DECODED_TOKEN);
    setupFirestore(
      makeFirestoreSnap([
        { id: 'collab-1', data: { ...ACTOR_COLLAB, permissions: { canManageRequestsV2: true } } },
      ]),
    );

    const result = await authenticateManagementV2Actor(new Request('http://x', { headers: { Authorization: 'Bearer t' } }));
    expect(result.actor.actorUserId).toBe('id3a-1');
  });

  it('throws FORBIDDEN when canManageRequestsV2 is false', async () => {
    verifyBearerToken.mockResolvedValue(DECODED_TOKEN);
    setupFirestore(
      makeFirestoreSnap([
        { id: 'collab-1', data: { ...ACTOR_COLLAB, permissions: { canManageRequestsV2: false } } },
      ]),
    );

    await expect(
      authenticateManagementV2Actor(new Request('http://x', { headers: { Authorization: 'Bearer t' } })),
    ).rejects.toMatchObject({ code: RuntimeErrorCode.FORBIDDEN, httpStatus: 403 });
  });
});
```

## 6. Non-Goals para 9.2

- Nenhuma mudança nos routes `/api/admin/request-config/*` (já protegidos por `authenticateWorkflowConfigAdmin`).
- Nenhuma mudança nos routes de participação: `respond-action`, `request-action`, `uploads`, `read/current`, `read/completed`, `read/requests/[requestId]`.
- Nenhum middleware Next.js; toda a lógica de authz continua server-side nos route handlers.
- Nenhuma mudança no client-side ou em Contexts (isso foi fase 9.1).
- A tela administrativa de permissões (`PermissionsPageContent`) é escopo da fase 9.3.

### Risco Aceito nesta Fase

- `read/current`, `read/completed` e `read/requests/[requestId]` continuam com `authenticateRuntimeActor`, mesmo sendo consumidos pela gestão v2.
- Isso significa que o backend da gestão v2 não ficará 100% fechado por permissão nesta fase.
- O time aceita esse risco temporariamente porque:
  - a navegação e os guards client-side da 9.1 já reduzem fortemente o caminho normal de acesso
  - essas rotas são compartilhadas com fluxos de requester/participação
  - endurecer esse corte agora aumentaria o risco de regressão funcional no rollout inicial
- Esse ponto pode ser revisitado em iteração futura se o rollout exigir fechamento server-side mais rígido da superfície de gestão.

## 7. API Contract

### Novos comportamentos de resposta

| Rota | Antes | Depois (sem permissão) |
|------|-------|----------------------|
| `GET /api/workflows/requester/catalog` | 200 para qualquer colaborador autenticado | 403 `{ ok: false, code: "FORBIDDEN", message: "Usuario sem permissao para abertura de solicitacoes v2." }` |
| `POST /api/workflows/runtime/requests` | 201 para qualquer colaborador autenticado | 403 idem |
| `GET /api/workflows/read/mine` | 200 para qualquer colaborador autenticado | 403 idem |
| `GET /api/workflows/read/management/bootstrap` | 200 para qualquer colaborador autenticado | 403 `{ ok: false, code: "FORBIDDEN", message: "Usuario sem permissao para gestao de chamados v2." }` |
| `GET /api/workflows/read/assignments` | 200 para qualquer colaborador autenticado | 403 idem |
| `POST /api/workflows/runtime/requests/[id]/advance` | 200 para qualquer colaborador autenticado | 403 idem |
| `POST /api/workflows/runtime/requests/[id]/archive` | 200 para qualquer colaborador autenticado | 403 idem |
| `POST /api/workflows/runtime/requests/[id]/assign` | 200 para qualquer colaborador autenticado | 403 idem |
| `POST /api/workflows/runtime/requests/[id]/finalize` | 200 para qualquer colaborador autenticado | 403 idem |

### Rotas inalteradas (por design)

| Rota | Auth | Justificativa |
|------|------|---------------|
| `POST /api/workflows/runtime/requests/[id]/respond-action` | `authenticateRuntimeActor` | Participante designado, não necessariamente gestor v2 |
| `POST /api/workflows/runtime/requests/[id]/request-action` | `authenticateRuntimeActor` | Idem |
| `POST /api/workflows/runtime/uploads` | `authenticateRuntimeActor` | Serve requester (form_field) e participante (action_response) |
| `GET /api/workflows/read/current` | `authenticateRuntimeActor` | Scoped por actorUserId; dados do próprio ator |
| `GET /api/workflows/read/completed` | `authenticateRuntimeActor` | Idem |
| `GET /api/workflows/read/requests/[requestId]` | `authenticateRuntimeActor` | Acessado por ambas superfícies e participantes |
| `GET /api/workflows/catalog/[workflowTypeId]` | `authenticateRuntimeActor` | Leitura de configuração pública do workflow |
| `/api/admin/request-config/*` | `authenticateWorkflowConfigAdmin` | Já protegido por `canManageWorkflowsV2` |

## 8. Database Schema

Nenhuma mudança de schema. Os campos `canOpenRequestsV2` e `canManageRequestsV2` em `collaborators/{id}.permissions` foram adicionados na fase 9.1.

## 9. Testing Strategy

### Unit Tests

| Componente | Cenários | Arquivo |
|------------|----------|---------|
| `authenticateRequesterV2Actor` | (1) canOpenRequestsV2=true → retorna actor; (2) canOpenRequestsV2=false → FORBIDDEN 403; (3) permissions ausente → FORBIDDEN 403; (4) token inválido → UNAUTHORIZED 401; (5) colaborador não encontrado → FORBIDDEN 403 | `src/lib/workflows/runtime/__tests__/permission-auth.test.ts` |
| `authenticateManagementV2Actor` | Mesmos 5 cenários com `canManageRequestsV2` | Mesmo arquivo |

### Route Tests

| Rota | Cenários | Arquivo |
|------|----------|---------|
| `GET /api/workflows/requester/catalog` | 401, 403, 200 | `src/app/api/workflows/requester/__tests__/catalog-route.test.ts` |
| `POST /api/workflows/runtime/requests` | 401, 403, 201, 400 (campos ausentes) | `src/app/api/workflows/runtime/requests/__tests__/open-request-route.test.ts` |
| `GET /api/workflows/read/mine` | 401, 403, 200 | `src/app/api/workflows/read/__tests__/mine-route.test.ts` |
| `GET /api/workflows/read/management/bootstrap` | 401, 403, 200 | `src/app/api/workflows/read/__tests__/management-bootstrap-route.test.ts` |
| `GET /api/workflows/read/assignments` | 401, 403, 200 | `src/app/api/workflows/read/__tests__/assignments-route.test.ts` |
| `POST .../advance` | 401, 403, 200 | `src/app/api/workflows/runtime/requests/__tests__/advance-route.test.ts` |
| `POST .../archive` | 401, 403, 200 | `src/app/api/workflows/runtime/requests/__tests__/archive-route.test.ts` |
| `POST .../assign` | 401, 403, 200 | `src/app/api/workflows/runtime/requests/__tests__/assign-route.test.ts` |
| `POST .../finalize` | 401, 403, 200 | `src/app/api/workflows/runtime/requests/__tests__/finalize-route.test.ts` |

### Acceptance Tests

```gherkin
GIVEN um colaborador autenticado com canOpenRequestsV2=false
WHEN faz GET /api/workflows/requester/catalog com Bearer token válido
THEN recebe 403 { ok: false, code: "FORBIDDEN", message: "Usuario sem permissao para abertura de solicitacoes v2." }

GIVEN um colaborador autenticado com canOpenRequestsV2=true
WHEN faz GET /api/workflows/requester/catalog
THEN recebe 200 com a lista de workflows disponíveis

GIVEN um colaborador autenticado com canManageRequestsV2=false
WHEN faz POST /api/workflows/runtime/requests/1/advance com Bearer token válido
THEN recebe 403 { ok: false, code: "FORBIDDEN", message: "Usuario sem permissao para gestao de chamados v2." }

GIVEN um colaborador autenticado com canManageRequestsV2=true
WHEN faz POST /api/workflows/runtime/requests/1/advance
THEN recebe 200 com dados do request avançado

GIVEN um colaborador autenticado (qualquer) com Bearer token válido
WHEN faz POST /api/workflows/runtime/requests/1/respond-action
THEN não é bloqueado por permissão de superfície v2 (continua com auth básica)

GIVEN uma requisição sem token
WHEN faz GET /api/workflows/requester/catalog ou qualquer rota protegida
THEN recebe 401 { ok: false, code: "UNAUTHORIZED" }
```

## 10. Rollback Plan

| Passo | Ação | Verificação |
|-------|------|-------------|
| 1 | Kill-switch operacional: desligar `canOpenRequestsV2` e `canManageRequestsV2` na tela de permissões para todos os usuários piloto | Calls às rotas passam a retornar 403 para todos (exceto rotas de participação) |
| 2 | Revert de código se necessário: `git revert {commit-hash}` desta fase | `permission-auth.ts` removido; routes voltam a usar `authenticateRuntimeActor`; build passa |
| 3 | As rotas de configuração permanecem protegidas (não foram alteradas nesta fase) | `/api/admin/request-config/*` continua retornando 403 sem `canManageWorkflowsV2` |

**Kill-switch rápido (sem deploy):** O step 1 é suficiente. Desligar os toggles v2 na tela de admin faz os novos `permission-auth` helpers retornarem 403 para todos, revertendo o comportamento ao estado pré-9.2 sem nenhum deploy.

**Nota:** As rotas de participação (`respond-action`, `request-action`, `uploads`) nunca foram alteradas e continuam funcionando independentemente do rollback.

## 11. Implementation Checklist

### Pre-Build
- [x] DEFINE document (seção 9.2) aprovado
- [x] Fase 9.1 concluída: `canOpenRequestsV2` e `canManageRequestsV2` existem em `CollaboratorPermissions` e `defaultPermissions`
- [x] Padrão de referência identificado: `src/lib/workflows/admin-config/auth.ts`
- [x] Escopo conservador validado (rotas de participação excluídas)
- [x] File manifest completo (1 novo arquivo + 9 modificações + testes)

### Post-Build
- [ ] `src/lib/workflows/runtime/permission-auth.ts` criado com `authenticateRequesterV2Actor` e `authenticateManagementV2Actor`
- [ ] 3 rotas requester usando `authenticateRequesterV2Actor`
- [ ] 6 rotas management usando `authenticateManagementV2Actor`
- [ ] Rotas de participação (`respond-action`, `request-action`, `uploads`, `read/current`, `read/completed`, `read/requests/[requestId]`) inalteradas
- [ ] `/api/admin/request-config/*` inalterado
- [ ] Testes passaram (`npm test`)
- [ ] Build passou (`npm run build`)
- [ ] Typecheck passou (`npm run typecheck`)

## 12. Specialist Instructions

### For @firebase-specialist

```markdown
Files to create/focus (auth layer):
1. src/lib/workflows/runtime/permission-auth.ts (CREATE — código completo no Pattern 1)
2. src/lib/workflows/runtime/__tests__/permission-auth.test.ts (CREATE — Pattern 5)
3. src/app/api/workflows/requester/__tests__/catalog-route.test.ts (CREATE — Pattern 4)
4. src/app/api/workflows/read/__tests__/mine-route.test.ts (CREATE — adaptar Pattern 4)
5. src/app/api/workflows/read/__tests__/management-bootstrap-route.test.ts (CREATE — adaptar Pattern 4 para canManageRequestsV2)
6. Demais __tests__ de route (advance, archive, assign, finalize, assignments) seguindo o mesmo padrão

Key requirements:
- Seguir EXATAMENTE o padrão de src/lib/workflows/admin-config/auth.ts
- Usar `verifyBearerToken` de auth-helpers (não reimplementar token verification)
- Lançar RuntimeError(FORBIDDEN, ..., 403) quando a permissão estiver ausente
- Retornar { decodedToken, actor: RuntimeActor } para manter compatibilidade com use cases
- Testes: mockar verifyBearerToken e firebase-admin/firestore; nunca usar Firestore real
- O pattern de mock Firestore está no Pattern 5 acima
```

### For @react-frontend-developer

```markdown
Files to modify (route handlers):
1. src/app/api/workflows/requester/catalog/route.ts
2. src/app/api/workflows/runtime/requests/route.ts
3. src/app/api/workflows/read/mine/route.ts
4. src/app/api/workflows/read/management/bootstrap/route.ts
5. src/app/api/workflows/read/assignments/route.ts
6. src/app/api/workflows/runtime/requests/[id]/advance/route.ts
7. src/app/api/workflows/runtime/requests/[id]/archive/route.ts
8. src/app/api/workflows/runtime/requests/[id]/assign/route.ts
9. src/app/api/workflows/runtime/requests/[id]/finalize/route.ts

Key requirements:
- Em cada arquivo: trocar o import de authenticateRuntimeActor para o helper correto de permission-auth.ts
- Para rotas requester (1, 2, 3): usar authenticateRequesterV2Actor
- Para rotas management (4–9): usar authenticateManagementV2Actor
- O const { actor } = await ... não muda — só o nome da função importada
- NÃO alterar a lógica downstream (use cases, queries, response shapes)
- NÃO alterar os arquivos: respond-action, request-action, uploads, read/current, read/completed, read/requests/[requestId], admin-config/*
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-12 | design-agent | Initial design for fase 9.2 based on DEFINE seção 9.2 e padrão admin-config/auth.ts |
| 1.1 | 2026-04-12 | Codex (`iterate`) | Added explicit accepted risk for shared management read endpoints; completed Pattern 5 with collaborator-not-found scenario |
