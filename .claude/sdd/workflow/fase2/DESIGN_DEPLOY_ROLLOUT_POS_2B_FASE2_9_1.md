# DESIGN: Navegacao e Guards de Pagina das 3 Superficies V2 (Fase 9.1)

> Generated: 2026-04-11
> Status: Ready for /build
> Source: DEFINE_DEPLOY_ROLLOUT_POS_2B_FASE2.md (secao 9.1)

## 1. Requirements Summary

### Problem

As tres superficies v2 de workflows (abertura em `/solicitacoes`, gestao em `/gestao-de-chamados`, configuracao em `/admin/request-config`) precisam ser controladas exclusivamente por permissoes dedicadas (`canOpenRequestsV2`, `canManageRequestsV2`, `canManageWorkflowsV2`), com gates consistentes em sidebar, menu do usuario e guards de pagina. Usuarios sem permissao nao devem ver itens de navegacao nem acessar rotas v2 por URL direta. A superficie de configuracao (`/admin/request-config`) ja possui gate funcional via `WorkflowConfigAdminGuard` e `canManageWorkflowsV2`; as demais precisam de gates equivalentes.

### Success Criteria

| Criterion | Target |
|-----------|--------|
| Visibilidade controlada | 0 usuarios sem permissao v2 veem menu ou rota v2 |
| Preservacao do legado | 0 regressao nas rotas legadas `/applications`, `/requests`, `/me/tasks`, `/admin/workflows` |
| Gates consistentes | Sidebar, dropdown do usuario e guard de pagina usam a mesma permissao para cada superficie |
| Kill-switch operacional | Desligar a permissao remove imediatamente visibilidade e acesso a superficie correspondente |
| Piloto funcional | 4 usuarios piloto acessam as 3 superficies v2 apos habilitacao de permissoes |

### Constraints

- As permissoes legadas (`canManageRequests`, `canViewTasks`, `canManageWorkflows`) nao devem ter sua semantica alterada.
- O menu legado de `/applications` continua visivel para todos os usuarios autenticados.
- A entrada `Gestao de chamados` no dropdown de ferramentas ja existe e depende de `canManageRequests || canViewTasks` via `canAccessWorkflowManagementEntry()`. Esta fase adiciona gate por `canManageRequestsV2` para que a entrada so apareca para usuarios com a permissao v2.
- A permissao `canManageWorkflowsV2` ja existe no contrato de `CollaboratorPermissions` e no `defaultPermissions` de `AuthContext` e `CollaboratorsContext`. As duas novas permissoes (`canOpenRequestsV2`, `canManageRequestsV2`) seguirao o mesmo padrao.
- Nenhuma colecao nova no Firestore e necessaria. As permissoes vivem dentro do campo `permissions` do documento `collaborators/{id}`.

## 2. Architecture

### System Diagram

```text
+---------------------------+
|   Browser (Usuario)       |
+---------------------------+
         |
         v
+---------------------------+
|  Next.js App Router       |
|  src/app/(app)/           |
|                           |
|  /solicitacoes            |---> RequesterV2Guard -----> canOpenRequestsV2
|  /gestao-de-chamados      |---> ManagementV2Guard ----> canManageRequestsV2
|  /admin/request-config    |---> WorkflowConfigAdminGuard -> canManageWorkflowsV2 (existente)
|                           |
+---------------------------+
         |
         v
+---------------------------+
|  AppLayout / Sidebar      |
|  + UserNav Dropdown       |
|                           |
|  navItems[] -----> canOpenRequestsV2   (sidebar: "Solicitacoes V2")
|  UserNav   -----> canManageRequestsV2  (dropdown: "Gestao de chamados")
|  UserNav   -----> canManageWorkflowsV2 (dropdown: "Config. de chamados v2", existente)
+---------------------------+
         |
         v
+---------------------------+
|  AuthContext               |
|  permissions: {            |
|    canOpenRequestsV2,      |  <-- novo, default false
|    canManageRequestsV2,    |  <-- novo, default false
|    canManageWorkflowsV2,   |  <-- existente, default false
|    ...legados              |
|  }                         |
+---------------------------+
         |
         v
+---------------------------+
|  Firestore                 |
|  collaborators/{id}        |
|    .permissions: {         |
|      canOpenRequestsV2,    |
|      canManageRequestsV2,  |
|      canManageWorkflowsV2, |
|      ...                   |
|    }                       |
+---------------------------+
```

### Data Flow

```text
LAYER 1 (Frontend - Navegacao):
1. src/components/layout/AppLayout.tsx: renderiza sidebar com navItems[]; filtra por permission.
   - Novo item "Solicitacoes V2" gated por canOpenRequestsV2.
   - Entrada "Gestao de chamados" no dropdown gated por canManageRequestsV2.
   - Entrada "Config. de chamados v2" no dropdown sem mudanca (ja gated por canManageWorkflowsV2).

LAYER 1 (Frontend - Guards de pagina):
2. src/app/(app)/solicitacoes/page.tsx: envolve RequestsV2Page com RequesterV2Guard.
3. src/app/(app)/gestao-de-chamados/page.tsx: envolve WorkflowManagementPage com ManagementV2Guard.
4. src/app/(app)/admin/request-config/page.tsx: sem mudanca (WorkflowConfigAdminGuard existente).

LAYER 2 (State / Orchestration):
5. src/contexts/AuthContext.tsx: defaultPermissions inclui canOpenRequestsV2 e canManageRequestsV2 com default false.
6. src/contexts/CollaboratorsContext.tsx: CollaboratorPermissions inclui canOpenRequestsV2 e canManageRequestsV2.
   Merge de defaultPermissions garante que documentos antigos sem os campos recebam false.

LAYER 3 (Data):
7. Firestore collaborators/{id}.permissions: campo persistido com os novos flags.
   Nenhuma migracao necessaria; o merge de defaultPermissions cuida de documentos sem o campo.
```

### State Management

| State | Storage | Lifecycle |
|-------|---------|-----------|
| `permissions.canOpenRequestsV2` | Firestore `collaborators/{id}.permissions` -> AuthContext via merge | Nasce `false`, persiste apos toggle do super admin, realtime sync via onSnapshot |
| `permissions.canManageRequestsV2` | Idem | Idem |
| `permissions.canManageWorkflowsV2` | Ja existente, mesmo padrao | Idem |

## 3. Architecture Decisions

### ADR-9.1-001: Usar permissoes dedicadas em vez de reutilizar permissoes legadas

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-11 |
| **Context** | As superficies v2 coexistem com as legadas durante o rollout. Se as permissoes legadas (`canManageRequests`, `canViewTasks`) fossem reutilizadas, usuarios com acesso legado veriam automaticamente as telas v2, quebrando o deploy escuro. |

**Choice:** Criar `canOpenRequestsV2` e `canManageRequestsV2` como flags independentes, seguindo o mesmo padrao de `canManageWorkflowsV2` ja existente.

**Rationale:**
1. Isola completamente o rollout v2 das permissoes legadas.
2. O kill-switch e simplesmente desligar os toggles v2 sem afetar o legado.
3. Consistencia com o padrao ja estabelecido para `canManageWorkflowsV2`.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| Reutilizar `canManageRequests` para `/gestao-de-chamados` | Exporia tela v2 a todos que ja tem a permissao legada, inviabilizando deploy escuro |
| Feature flag global unico para todas as superficies v2 | Nao permite controle granular; ligar uma superficie obrigaria a ligar todas |
| Middleware Next.js para protecao de rotas | O projeto nao usa middleware para authz; toda a logica de permissao vive no AuthContext client-side + guards de componente |

**Consequences:**
- Positivo: controle granular por superficie, kill-switch independente, rollout em ondas possivel.
- Negativo: duas novas chaves no contrato de permissoes; a tela de permissoes ganha mais colunas.

---

### ADR-9.1-002: Guards de pagina como componentes wrapper em vez de middleware

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-11 |
| **Context** | Precisa-se de gate client-side que redirecione usuarios sem permissao quando acessam URL direta. O projeto ja tem esse padrao com `WorkflowConfigAdminGuard` e `SuperAdminGuard`. |

**Choice:** Criar dois novos componentes guard (`RequesterV2Guard`, `ManagementV2Guard`) seguindo o mesmo padrao de `WorkflowConfigAdminGuard`.

**Rationale:**
1. Padrao ja existente e testado no codebase.
2. Componentes guard usam o `useAuth()` hook que ja faz merge com `defaultPermissions`.
3. Simples de testar unitariamente.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| HOC wrapper generico parametrizado por permissao | Embora elegante, introduz abstracao desnecessaria para apenas 2 guards novos; o padrao existente e explicitamente simple |
| Logica inline no `page.tsx` | Viola separacao de concerns; o `page.tsx` deve ser thin wrapper |

**Consequences:**
- Positivo: cada guard e autocontido, testavel e tem redirect explicito.
- Negativo: 2 novos arquivos de componente (custo baixo).

---

### ADR-9.1-003: Entrada de Solicitacoes V2 na sidebar em vez de apenas no dropdown

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-11 |
| **Context** | O DEFINE M9 exige entrada dedicada na sidebar para `/solicitacoes`. A tela legada `/applications` ja esta na sidebar como "Solicitacoes" visivel a todos. |

**Choice:** Adicionar item condicional `Solicitacoes V2` no array `navItems[]` com `permission: 'canOpenRequestsV2'`, posicionado logo apos o item legado de `/applications`, usando o mesmo icone `Workflow`.

**Rationale:**
1. Atende o requisito M9 literalmente.
2. A sidebar ja suporta filtragem por permissao via `item.permission`.
3. O item legado continua intocado; a coexistencia e explicita.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| Substituir o item legado condicionalmente | Quebraria a preservacao do legado (M4) |
| Colocar apenas no dropdown do usuario | Nao atende M9 que pede sidebar |
| Renomear item legado para "Solicitacoes (Legado)" | Escopo W2 - nao alterar semantica legada nesta iteracao |

**Consequences:**
- Positivo: usuarios piloto veem claramente a entrada v2 na sidebar.
- Negativo: durante convivencia, usuarios piloto veem "Solicitacoes" (legado) e "Solicitacoes V2" lado a lado. Aceitavel conforme DEFINE.

---

### ADR-9.1-004: Gestao de chamados gated por canManageRequestsV2 em vez da logica atual

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-11 |
| **Context** | A entrada "Gestao de chamados" no dropdown de ferramentas atualmente usa `canAccessWorkflowManagementEntry()` que depende de `canManageRequests || canViewTasks`. Para o deploy escuro, esta visibilidade precisa ser controlada pela nova permissao v2. |

**Choice:** Alterar a condicao de exibicao da entrada "Gestao de chamados" no `UserNav` para depender exclusivamente de `canManageRequestsV2`. Atualizar `canAccessWorkflowManagementEntry()` em `navigation.ts` para aceitar o novo campo.

**Rationale:**
1. Isola a visibilidade da superficie v2 de gestao da permissao legada.
2. O helper `canAccessWorkflowManagementEntry` continua encapsulando a logica de visibilidade.
3. Os atalhos legados (`/requests`, `/me/tasks`) no dropdown continuam condicionados a `canManageRequests` e `canViewTasks` separadamente, sem alteracao.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| Manter visibilidade legada e apenas adicionar guard na pagina | Usuario veria o link mas seria redirecionado, experiencia confusa |
| Criar entrada separada no dropdown para v2 | Redundante; a entrada ja existe e aponta para a rota v2 |

**Consequences:**
- Positivo: link e pagina ficam coerentes; sem permissao, nenhuma pista visual da superficie v2.
- Negativo: usuarios que antes viam "Gestao de chamados" por `canManageRequests || canViewTasks` deixarao de ver ate receberem `canManageRequestsV2`. Efeito desejado.

## 4. File Manifest

### Execution Order

| Phase | Files | Agent |
|-------|-------|-------|
| 1. Contrato de permissoes | `CollaboratorsContext.tsx`, `AuthContext.tsx` | @react-frontend-developer |
| 2. Helpers de navegacao | `navigation.ts` | @react-frontend-developer |
| 3. Guards de pagina | `RequesterV2Guard.tsx`, `ManagementV2Guard.tsx` | @react-frontend-developer |
| 4. Navegacao (sidebar + dropdown) | `AppLayout.tsx` | @react-frontend-developer |
| 5. Pages (wrapping com guards) | `solicitacoes/page.tsx`, `gestao-de-chamados/page.tsx` | @react-frontend-developer |
| 6. Testes | `*.test.tsx`, `*.test.ts` | @react-frontend-developer |

### Detailed Manifest

| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | `src/contexts/CollaboratorsContext.tsx` | Modify | Adicionar `canOpenRequestsV2` e `canManageRequestsV2` ao tipo `CollaboratorPermissions` e ao `defaultPermissions` | @react-frontend-developer | - |
| 2 | `src/contexts/AuthContext.tsx` | Modify | Adicionar `canOpenRequestsV2` e `canManageRequestsV2` ao `defaultPermissions` local | @react-frontend-developer | #1 |
| 3 | `src/lib/workflows/management/navigation.ts` | Modify | Atualizar `canAccessWorkflowManagementEntry` para aceitar `canManageRequestsV2` | @react-frontend-developer | #1 |
| 4 | `src/components/auth/RequesterV2Guard.tsx` | Create | Guard de pagina para `/solicitacoes` baseado em `canOpenRequestsV2` | @react-frontend-developer | #2 |
| 5 | `src/components/auth/ManagementV2Guard.tsx` | Create | Guard de pagina para `/gestao-de-chamados` baseado em `canManageRequestsV2` | @react-frontend-developer | #2 |
| 6 | `src/components/layout/AppLayout.tsx` | Modify | Adicionar item "Solicitacoes V2" na sidebar gated por `canOpenRequestsV2`; ajustar dropdown de ferramentas para usar `canManageRequestsV2` | @react-frontend-developer | #2, #3 |
| 7 | `src/app/(app)/solicitacoes/page.tsx` | Modify | Envolver `RequestsV2Page` com `RequesterV2Guard` | @react-frontend-developer | #4 |
| 8 | `src/app/(app)/gestao-de-chamados/page.tsx` | Modify | Envolver `WorkflowManagementPage` com `ManagementV2Guard` | @react-frontend-developer | #5 |
| 9 | `src/lib/workflows/management/__tests__/navigation.test.ts` | Modify | Atualizar testes de `canAccessWorkflowManagementEntry` para novo campo | @react-frontend-developer | #3 |
| 10 | `src/components/auth/__tests__/RequesterV2Guard.test.tsx` | Create | Testes do guard RequesterV2Guard | @react-frontend-developer | #4 |
| 11 | `src/components/auth/__tests__/ManagementV2Guard.test.tsx` | Create | Testes do guard ManagementV2Guard | @react-frontend-developer | #5 |
| 12 | `src/components/layout/__tests__/AppLayout.test.tsx` | Modify | Atualizar testes para cobrir novos itens de sidebar e dropdown | @react-frontend-developer | #6 |

## 5. Code Patterns

### Pattern 1: Extensao de CollaboratorPermissions (CollaboratorsContext.tsx)

```typescript
// src/contexts/CollaboratorsContext.tsx — diff conceitual

export interface CollaboratorPermissions {
  canManageWorkflows: boolean;
  canManageWorkflowsV2?: boolean;
  canManageRequests: boolean;
  canManageRequestsV2?: boolean;   // NOVO
  canOpenRequestsV2?: boolean;     // NOVO
  canManageContent: boolean;
  canManageTripsBirthdays: boolean;
  canViewTasks: boolean;
  canViewBI: boolean;
  canViewRankings: boolean;
  canViewCRM: boolean;
  canViewStrategicPanel: boolean;
  canViewOpportunityMap: boolean;
  canViewMeetAnalyses: boolean;
  canViewDirectoria: boolean;
  canViewBILeaders: boolean;
}

const defaultPermissions: CollaboratorPermissions = {
  canManageWorkflows: false,
  canManageWorkflowsV2: false,
  canManageRequests: false,
  canManageRequestsV2: false,   // NOVO
  canOpenRequestsV2: false,     // NOVO
  canManageContent: false,
  canManageTripsBirthdays: false,
  canViewTasks: false,
  canViewBI: false,
  canViewRankings: false,
  canViewCRM: false,
  canViewStrategicPanel: false,
  canViewOpportunityMap: false,
  canViewMeetAnalyses: false,
  canViewDirectoria: false,
  canViewBILeaders: false,
};
```

### Pattern 2: Extensao de defaultPermissions em AuthContext.tsx

```typescript
// src/contexts/AuthContext.tsx — mesmo diff

const defaultPermissions: CollaboratorPermissions = {
  canManageWorkflows: false,
  canManageWorkflowsV2: false,
  canManageRequests: false,
  canManageRequestsV2: false,   // NOVO
  canOpenRequestsV2: false,     // NOVO
  canManageContent: false,
  canManageTripsBirthdays: false,
  canViewTasks: false,
  canViewBI: false,
  canViewRankings: false,
  canViewCRM: false,
  canViewStrategicPanel: false,
  canViewOpportunityMap: false,
  canViewMeetAnalyses: false,
  canViewDirectoria: false,
  canViewBILeaders: false,
};
```

### Pattern 3: RequesterV2Guard (novo componente)

```typescript
// src/components/auth/RequesterV2Guard.tsx
"use client";

import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function RequesterV2Guard({ children }: { children: React.ReactNode }) {
  const { user, loading, permissions } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!permissions.canOpenRequestsV2) {
      router.replace('/dashboard');
      return;
    }

    setIsAuthorized(true);
  }, [loading, permissions.canOpenRequestsV2, router, user]);

  if (loading || !isAuthorized) {
    return (
      <div className="flex h-[calc(100vh-var(--header-height))] w-full items-center justify-center bg-background">
        <LoadingSpinner message="Carregando solicitacoes v2" />
      </div>
    );
  }

  return <>{children}</>;
}
```

### Pattern 4: ManagementV2Guard (novo componente)

```typescript
// src/components/auth/ManagementV2Guard.tsx
"use client";

import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function ManagementV2Guard({ children }: { children: React.ReactNode }) {
  const { user, loading, permissions } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!permissions.canManageRequestsV2) {
      router.replace('/dashboard');
      return;
    }

    setIsAuthorized(true);
  }, [loading, permissions.canManageRequestsV2, router, user]);

  if (loading || !isAuthorized) {
    return (
      <div className="flex h-[calc(100vh-var(--header-height))] w-full items-center justify-center bg-background">
        <LoadingSpinner message="Carregando gestao de chamados v2" />
      </div>
    );
  }

  return <>{children}</>;
}
```

### Pattern 5: Atualizacao de navigation.ts

```typescript
// src/lib/workflows/management/navigation.ts
type WorkflowManagementEntryPermissions = {
  canManageRequests?: boolean;
  canManageRequestsV2?: boolean;
  canViewTasks?: boolean;
};

export function canAccessWorkflowManagementEntry(
  permissions: WorkflowManagementEntryPermissions = {},
): boolean {
  return Boolean(permissions.canManageRequestsV2);
}
```

### Pattern 6: Sidebar navItems e dropdown (AppLayout.tsx)

```typescript
// src/components/layout/AppLayout.tsx — navItems[] (adicionar apos o item /applications)

export const navItems = [
  { href: '/dashboard', label: 'Painel Inicial', icon: Home, external: false, permission: null },
  { href: '/news', label: 'Feed de Noticias', icon: Newspaper, external: false, permission: null },
  { href: '/applications', label: 'Solicitacoes', icon: Workflow, external: false, permission: null },
  { href: '/solicitacoes', label: 'Solicitacoes V2', icon: Workflow, external: false, permission: 'canOpenRequestsV2' },
  // ... restante permanece inalterado
];

// No UserNav, a condicao do hasTools precisa incluir canManageRequestsV2:
const hasTools =
  permissions.canManageRequestsV2 ||
  permissions.canManageRequests ||
  permissions.canViewTasks ||
  permissions.canViewCRM ||
  permissions.canViewStrategicPanel ||
  permissions.canViewDirectoria;
```

### Pattern 7: Page wrapping com guard (solicitacoes/page.tsx)

```typescript
// src/app/(app)/solicitacoes/page.tsx
import { RequesterV2Guard } from '@/components/auth/RequesterV2Guard';
import { RequestsV2Page } from '@/components/workflows/requester/RequestsV2Page';

export default function SolicitacoesPage() {
  return (
    <RequesterV2Guard>
      <RequestsV2Page />
    </RequesterV2Guard>
  );
}
```

### Pattern 8: Page wrapping com guard (gestao-de-chamados/page.tsx)

```typescript
// src/app/(app)/gestao-de-chamados/page.tsx
import { ManagementV2Guard } from '@/components/auth/ManagementV2Guard';
import { WorkflowManagementPage } from '@/components/workflows/management/WorkflowManagementPage';

export default function WorkflowManagementRoutePage() {
  return (
    <ManagementV2Guard>
      <WorkflowManagementPage />
    </ManagementV2Guard>
  );
}
```

## 6. Explicit Non-Goals for 9.1

- Esta fase nao altera `src/components/admin/PermissionsPageContent.tsx`
- A criacao/exibicao dos labels administrativos `Solicitacoes V2`, `Gestao Chamados V2` e `Config Chamados V2` fica exclusivamente para o design/build da secao 9.3
- A 9.1 cobre somente contrato de permissao, navegacao, guards de pagina e testes correspondentes

## 7. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-11 | Codex | Initial design for section 9.1 |
| 1.1 | 2026-04-11 | Codex (`iterate`) | Removed permission admin UI from 9.1 scope; kept 9.1 focused on navigation and page guards only |

## 6. API Contract

Nenhum endpoint novo ou alterado nesta fase 9.1. Os endpoints server-side serao tratados na fase 9.2.

Nota: `authenticateRuntimeActor()` em `src/lib/workflows/runtime/auth-helpers.ts` atualmente valida apenas que o usuario e um colaborador autenticado. Nao verifica permissoes v2 especificas. A fase 9.2 adicionara validacao de `canOpenRequestsV2` e `canManageRequestsV2` nas rotas de API correspondentes.

## 7. Database Schema (mudancas)

### Colecao: `collaborators`

Nenhuma migracao de schema necessaria. Os novos campos sao adicionados ao subdocumento `permissions` e o merge com `defaultPermissions` no frontend garante retrocompatibilidade.

| Field path | Type | Default | Details |
|-----------|------|---------|---------|
| `permissions.canOpenRequestsV2` | `boolean` | `false` (via merge) | Controla acesso a `/solicitacoes` |
| `permissions.canManageRequestsV2` | `boolean` | `false` (via merge) | Controla acesso a `/gestao-de-chamados` |
| `permissions.canManageWorkflowsV2` | `boolean` | `false` (via merge) | Ja existente, controla `/admin/request-config` |

**Comportamento para documentos existentes:** documentos que nao possuem `canOpenRequestsV2` ou `canManageRequestsV2` no Firestore receberao `false` apos o merge com `defaultPermissions` no `CollaboratorsProvider` (via `select`) e no `AuthProvider` (via `applyCollaboratorState`). Nenhuma migracao de dados e necessaria.

## 8. Testing Strategy

### Unit Tests

| Component | Test | File |
|-----------|------|------|
| `canAccessWorkflowManagementEntry` | Retorna `true` somente quando `canManageRequestsV2` e verdadeiro; retorna `false` para legado sem v2 | `src/lib/workflows/management/__tests__/navigation.test.ts` |
| `RequesterV2Guard` | Redireciona para `/dashboard` quando `canOpenRequestsV2` e false; renderiza children quando true; redireciona para `/login` quando nao autenticado | `src/components/auth/__tests__/RequesterV2Guard.test.tsx` |
| `ManagementV2Guard` | Redireciona para `/dashboard` quando `canManageRequestsV2` e false; renderiza children quando true; redireciona para `/login` quando nao autenticado | `src/components/auth/__tests__/ManagementV2Guard.test.tsx` |

### Integration Tests

| Flow | Test | File |
|------|------|------|
| Sidebar filtra item v2 | Com `canOpenRequestsV2=false`, o item "Solicitacoes V2" nao aparece; com `true`, aparece | `src/components/layout/__tests__/AppLayout.test.tsx` |
| Dropdown filtra gestao v2 | Com `canManageRequestsV2=false`, "Gestao de chamados" nao aparece; com `true`, aparece | `src/components/layout/__tests__/AppLayout.test.tsx` |

### Acceptance Tests

```gherkin
GIVEN um colaborador autenticado com canOpenRequestsV2=false
WHEN acessa /solicitacoes por URL direta
THEN e redirecionado para /dashboard

GIVEN um colaborador autenticado com canOpenRequestsV2=true
WHEN acessa /solicitacoes
THEN ve a pagina RequestsV2Page normalmente

GIVEN um colaborador autenticado com canManageRequestsV2=false
WHEN acessa /gestao-de-chamados por URL direta
THEN e redirecionado para /dashboard

GIVEN um colaborador autenticado com canManageRequestsV2=true
WHEN acessa /gestao-de-chamados
THEN ve a pagina WorkflowManagementPage normalmente

GIVEN um colaborador com canManageRequests=true e canManageRequestsV2=false
WHEN olha a sidebar e o dropdown do usuario
THEN ve "Solicitacoes" (legado) na sidebar e "Gestao de Solicitacoes" no dropdown legado
AND nao ve "Solicitacoes V2" na sidebar
AND nao ve "Gestao de chamados" no dropdown de ferramentas

GIVEN um colaborador com canOpenRequestsV2=true e canManageRequestsV2=true
WHEN olha a sidebar e o dropdown do usuario
THEN ve "Solicitacoes V2" na sidebar e "Gestao de chamados" no dropdown de ferramentas

GIVEN um super admin
WHEN abre a tela de permissoes
THEN ve as colunas "Solicitacoes V2", "Gestao Chamados V2" e "Config Chamados V2"
AND todos os toggles novos estao desligados por default
```

## 9. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | Desligar `canOpenRequestsV2`, `canManageRequestsV2` e `canManageWorkflowsV2` na tela de permissoes para todos os usuarios | Nenhum usuario ve itens v2 na sidebar nem no dropdown |
| 2 | Se necessario revert de codigo: `git revert {commit-hash}` do commit desta fase | Build passa, rotas v2 ficam acessiveis sem guard (mesmo estado pre-merge) |
| 3 | Remover entradas novas de `navItems[]` e guards dos `page.tsx` | Sidebar volta ao estado original |
| 4 | Manter as chaves `canOpenRequestsV2` e `canManageRequestsV2` como inertes no `defaultPermissions` ou remove-las | Documentos de colaboradores que ja tiverem os campos podem permanecer sem efeito funcional |

**Kill-switch rapido (sem deploy):** O step 1 e suficiente para um rollback operacional. Desligar os toggles de permissao v2 na tela de admin remove imediatamente a visibilidade e o acesso. Nenhum script, nenhum deploy.

**Nota:** As rotas `/solicitacoes` e `/gestao-de-chamados` ja existem no codebase antes desta fase. O rollback de codigo apenas removeria os guards e as entradas de navegacao gated, revertendo ao estado em que as rotas existem mas nao sao linkadas no menu (acessiveis apenas por URL direta sem guard).

## 10. Implementation Checklist

### Pre-Build
- [x] DEFINE document approved (Clarity Score 14/15)
- [x] Architecture decisions documented (4 ADRs)
- [x] File manifest complete (13 files)
- [x] Code patterns validated against codebase
- [x] Nenhuma colecao nova necessaria no Firestore

### Post-Build
- [ ] `canOpenRequestsV2` e `canManageRequestsV2` presentes em `CollaboratorPermissions` e ambos `defaultPermissions`
- [ ] `RequesterV2Guard` e `ManagementV2Guard` criados e testados
- [ ] `/solicitacoes/page.tsx` envolvido com `RequesterV2Guard`
- [ ] `/gestao-de-chamados/page.tsx` envolvido com `ManagementV2Guard`
- [ ] Item "Solicitacoes V2" na sidebar gated por `canOpenRequestsV2`
- [ ] Entrada "Gestao de chamados" no dropdown gated por `canManageRequestsV2`
- [ ] `canAccessWorkflowManagementEntry()` atualizado
- [ ] Labels v2 presentes na tela de permissoes: "Solicitacoes V2", "Gestao Chamados V2", "Config Chamados V2"
- [ ] Rotas legadas `/applications`, `/requests`, `/me/tasks`, `/admin/workflows` inalteradas
- [ ] Testes passaram (`npm test`)
- [ ] Build passou (`npm run build`)

## 11. Specialist Instructions

### For @react-frontend-developer

```markdown
Files to modify/create (in order):
1. src/contexts/CollaboratorsContext.tsx
2. src/contexts/AuthContext.tsx
3. src/lib/workflows/management/navigation.ts
4. src/components/auth/RequesterV2Guard.tsx (Create)
5. src/components/auth/ManagementV2Guard.tsx (Create)
6. src/components/layout/AppLayout.tsx
7. src/app/(app)/solicitacoes/page.tsx
8. src/app/(app)/gestao-de-chamados/page.tsx
9. src/components/admin/PermissionsPageContent.tsx
10. src/lib/workflows/management/__tests__/navigation.test.ts
11. src/components/auth/__tests__/RequesterV2Guard.test.tsx (Create)
12. src/components/auth/__tests__/ManagementV2Guard.test.tsx (Create)
13. src/components/layout/__tests__/AppLayout.test.tsx

Key requirements:
- Seguir exatamente o padrao de `WorkflowConfigAdminGuard` para os novos guards.
- Os novos campos em `CollaboratorPermissions` DEVEM ser opcionais (`?`) como `canManageWorkflowsV2`.
- Os novos campos em `defaultPermissions` DEVEM ser `false`.
- Nao alterar nenhuma logica dos menus ou rotas legadas.
- Nao adicionar logica server-side nesta fase (sera fase 9.2).
- A label de `canManageWorkflowsV2` em `permissionLabels` muda de "Workflows V2" para "Config Chamados V2" para clareza administrativa conforme DEFINE S1.
- O item de sidebar "Solicitacoes V2" usa o icone `Workflow` (mesmo da legada `/applications`).
- No dropdown `UserNav`, a entrada "Gestao de chamados" passa a depender de `canManageRequestsV2` em vez de `canAccessWorkflowManagementEntry(permissions)` baseado em legado.
- O bloco de "Atalhos legados durante transicao" no dropdown continua condicionado a `permissions.canManageRequests || permissions.canViewTasks`, sem alteracao.
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-11 | design-agent | Initial design for fase 9.1 based on DEFINE_DEPLOY_ROLLOUT_POS_2B_FASE2.md |
