# DESIGN: Fase 2E.1 - Permissao, rota, shell e catalogo read-only de chamados

> Generated: 2026-04-08
> Status: Ready for build
> Scope: Fase 2 / 2E.1 - fundacao de authz, navegacao admin, shell com tabs e catalogo hierarquico read-only do configurador v2
> Base document: `DEFINE_FASE2E_1_SHELL_CATALOGO_CHAMADOS.md`

## 1. Objetivo

Entregar a primeira superficie administrativa oficial do configurador v2 de chamados, separada da tela legada em `/admin/workflows` e da gestao operacional em `/gestao-de-chamados`, com gate proprio, rota propria, shell navegavel e catalogo read-only por `area > workflow type > versao`.

Esta subetapa cobre:

- criar a permissao `canManageWorkflowsV2` no contrato de colaboradores;
- expor essa permissao na tela de administracao de colaboradores;
- criar nova entrada no menu admin para a superficie v2;
- criar a nova rota admin `/admin/request-config`;
- proteger a nova rota com guard dedicado a `canManageWorkflowsV2`;
- implementar a tab `Definicoes` como catalogo hierarquico read-only;
- implementar a tab `Historico Geral` apenas como placeholder navegavel;
- consumir `workflowAreas`, `workflowTypes_v2` e `versions/{version}` sem alterar schema persistido do runtime.

Esta subetapa nao cobre:

- criacao de area;
- criacao de workflow type;
- edicao de rascunho;
- publicacao ou ativacao de versoes;
- historico geral funcional;
- retrofit da tela legada `/admin/workflows`.

---

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_FASE2E_1_SHELL_CATALOGO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_FASE2E_1_SHELL_CATALOGO_CHAMADOS.md)
- [DEFINE_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md)
- [BRAINSTORM_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/BRAINSTORM_FASE2E_TELA_CONFIGURACAO_CHAMADOS.md)
- [AppLayout.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/layout/AppLayout.tsx)
- [AuthContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/AuthContext.tsx)
- [CollaboratorsContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/CollaboratorsContext.tsx)
- [PermissionsPageContent.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/admin/PermissionsPageContent.tsx)
- [page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/admin/workflows/page.tsx)
- [bootstrap.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/bootstrap.ts)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/types.ts)
- [WorkflowAreasContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/WorkflowAreasContext.tsx)

Em caso de divergencia:

1. prevalece o `DEFINE_FASE2E_1_SHELL_CATALOGO_CHAMADOS.md` para escopo e aceite;
2. depois prevalece o define macro da `2E` para direcao de produto;
3. depois prevalece este design para orientar o build;
4. o codigo real do App Router, AuthContext e runtime v2 segue como referencia final de integracao.

---

## 3. Estado Atual e Lacuna que a 2E.1 Fecha

### 3.1. O que o repositorio ja oferece

- o menu do usuario ja distingue ferramentas operacionais de paineis administrativos em [AppLayout.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/layout/AppLayout.tsx);
- a tela legada `/admin/workflows` ja possui shell com tabs `Definicoes` e `Historico Geral`, mas usa componentes do modelo antigo;
- o runtime novo ja persiste `workflowTypes_v2/{workflowTypeId}` e `versions/{version}`;
- o read-side operacional ja consulta `workflowAreas` e `workflowTypes_v2` via camada server-side com `firebase-admin`;
- o contrato de permissao atual ainda nao contem `canManageWorkflowsV2`.

### 3.2. Problema real no codigo atual

- `AdminGuard` aceita qualquer permissao administrativa e nao serve para isolar a nova superficie;
- o menu admin atual so conhece `/admin/workflows`, protegido por `canManageWorkflows`;
- a tela de permissao de colaboradores nao possui toggle para a nova capability;
- nao existe catalogo administrativo v2 para leitura hierarquica por area/tipo/versao;
- a colecao `workflowAreas` contem `storageFolderPath`, mas esse campo nao deve vazar na UX da 2E.

### 3.3. Resultado esperado ao final da 2E.1

- usuarios com `canManageWorkflowsV2` enxergam e acessam `/admin/request-config`;
- usuarios apenas com `canManageWorkflows` continuam vendo e acessando somente `/admin/workflows`;
- o shell da nova tela comunica claramente as tabs `Definicoes` e `Historico Geral`;
- a tab `Definicoes` renderiza uma arvore read-only com contadores, owner, versao ativa e estados derivados;
- tipos sem versao publicada aparecem como caso valido de `Rascunho inicial`;
- `storageFolderPath` permanece persistido, mas invisivel na UI e no contrato exposto ao frontend.

---

## 4. Arquitetura da Solucao

### 4.1. Diagrama arquitetural

```text
Authenticated Admin User
  |
  +--> AppLayout / dropdown "Paineis de controle"
  |       |
  |       +--> /admin/workflows        (legado, gate canManageWorkflows)
  |       +--> /admin/request-config   (novo, gate canManageWorkflowsV2)
  |
  v
src/app/(app)/admin/request-config/page.tsx
  |
  v
WorkflowConfigAdminGuard
  |
  v
WorkflowConfigPage
  |
  +--> PageHeader
  +--> Tabs
  |      |- Definicoes
  |      \- Historico Geral (placeholder)
  |
  \--> WorkflowConfigDefinitionsTab
          |
          +--> useWorkflowConfigCatalog()
                  |
                  +--> GET /api/admin/request-config/catalog
                          |
                          +--> verifyBearerToken + resolve collaborator permissions
                          +--> firebase-admin reads:
                                  - workflowAreas
                                  - workflowTypes_v2
                                  - workflowTypes_v2/{workflowTypeId}/versions/*
```

### 4.2. Fluxo por camadas

```text
LAYER 1 (Auth / Navigation)
1. AuthContext passa a incluir canManageWorkflowsV2 no merge de permissoes default.
2. PermissionsPageContent passa a exibir o toggle "Workflows V2".
3. AppLayout passa a mostrar o item "Config. de chamados v2" apenas quando a nova permissao existir.

LAYER 2 (Routing / Guard)
4. src/app/(app)/admin/request-config/page.tsx cria o novo entrypoint.
5. WorkflowConfigAdminGuard bloqueia acesso de usuarios sem canManageWorkflowsV2.

LAYER 3 (Presentation)
6. WorkflowConfigPage renderiza header, tabs e async states.
7. WorkflowConfigDefinitionsTab renderiza catalogo read-only por area, tipo e versao.
8. WorkflowConfigHistoryPlaceholder renderiza placeholder navegavel e explicitamente fora de escopo.

LAYER 4 (Client Data)
9. useWorkflowConfigCatalog usa React Query e api-client proprio.
10. O frontend consome um DTO sanitizado sem storageFolderPath.

LAYER 5 (Server Data)
11. GET /api/admin/request-config/catalog autentica Bearer token.
12. O handler valida canManageWorkflowsV2.
13. O service agrega workflowAreas + workflowTypes_v2 + versions.
14. O response devolve arvore pronta para UI com estados derivados.
```

### 4.3. Estado gerenciado no frontend

| Estado | Armazenamento | Lifecycle |
|-------|---------------|-----------|
| `activeTab` do shell admin | `useState` local | inicia em `definitions`; reset a cada page load |
| catalogo read-only | React Query | carregado ao abrir a tab `Definicoes`; reuso por cache |
| expansao de areas/tipos | `useState` local | controlado apenas na sessao atual |
| placeholder de historico | estatico | nao faz fetch na 2E.1 |
| permissao do usuario | `AuthContext` | derivada do colaborador autenticado |

### 4.4. Slug final da rota

Slug escolhido: `/admin/request-config`

Justificativa:

- segue o padrao english-first dos slugs administrativos existentes;
- comunica que se trata de configuracao administrativa, nao da tela operacional `/gestao-de-chamados`;
- evita colisao semantica com `/admin/workflows`;
- permanece estavel mesmo que o modelo interno continue se chamando `workflowTypes_v2`.

---

## 5. Architecture Decisions

### ADR-2E1-001: A nova superficie admin usa rota nova e nao reaproveita `/admin/workflows`

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-08 |
| Context | O define exige convivencia segura entre tela legada e nova tela v2, com gates independentes. |

**Choice:** criar a nova pagina em `/admin/request-config`, mantendo `/admin/workflows` intacta.

**Rationale:**

1. elimina ambiguidade entre modelo legado e v2;
2. permite rollout gradual por permissao sem retrofit arriscado da tela antiga;
3. reduz risco de regressao visual e funcional no painel legado.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| estender `/admin/workflows` com mais uma tab v2 | mistura gates, contratos e modelos distintos |
| substituir `/admin/workflows` pela nova tela | viola o define e aumenta risco de regressao |

**Consequences:**

- positivo: rollout controlado e convivencia clara;
- positivo: build da 2E.2+ pode crescer sem tocar na tela antiga;
- negativo: haverá duas entradas relacionadas a workflows no menu admin durante a transicao.

### ADR-2E1-002: O gate de frontend e backend sera dedicado a `canManageWorkflowsV2`

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-08 |
| Context | `AdminGuard` atual usa `isAdmin`, que sobe para `true` com qualquer permissao administrativa. Isso e mais amplo do que o define permite. |

**Choice:** criar um guard dedicado para a pagina e uma verificacao server-side dedicada nos endpoints admin da 2E.

**Rationale:**

1. o gate precisa refletir a nova capability e nao o conceito generico de admin;
2. a protecao nao pode depender apenas de esconder item de menu;
3. a mesma regra precisa valer para leitura administrativa via API.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| reutilizar `AdminGuard` e esconder apenas o menu | permite acesso direto por URL para admins nao autorizados |
| mapear `canManageWorkflowsV2` para `isAdmin` sem guard especifico | nao isola a superficie v2 |

**Consequences:**

- positivo: authz coerente entre UI e API;
- positivo: legado continua no gate antigo;
- negativo: adiciona pequena duplicacao de guard.
- observacao de compatibilidade: a resolucao server-side do colaborador deve seguir a base da refatorizacao de workflows (`verifyBearerToken` + `firebase-admin`), mas com tolerancia adicional para a superficie admin da `2E.1`:
  - primeiro tenta `authUid`
  - se nao encontrar, tenta e-mail normalizado
  - se encontrar exatamente 1 colaborador, usa esse
  - nao faz backfill sincrono dentro da rota

### ADR-2E1-003: O catalogo read-only sera montado no servidor e entregue como arvore pronta

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-08 |
| Context | A UI precisa combinar `workflowAreas`, `workflowTypes_v2` e subcolecoes `versions`, alem de esconder campos internos e derivar estados de negocio. |

**Choice:** expor um endpoint server-side que retorna a arvore administrativa pronta para renderizacao.

**Rationale:**

1. centraliza derivacao de `Rascunho`, `Publicada`, `Inativa` e `Sem publicada`;
2. evita leituras diretas complexas de subcolecoes no client;
3. protege melhor campos que nao devem sair no payload da UI, como `storageFolderPath`.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| montar a arvore inteiramente no client a partir de listeners diretos | acopla UI a detalhes internos e amplia superficie de dados |
| ler apenas tipos e buscar versoes sob demanda por expansao | aumenta latencia e complexidade do shell inicial |

**Consequences:**

- positivo: contrato read-only pequeno, estavel e testavel;
- positivo: facilita 2E.2 e 2E.3 reaproveitarem o mesmo bootstrap hierarquico;
- negativo: exige service novo no servidor.

### ADR-2E1-004: `Historico Geral` nasce como placeholder sem endpoint proprio

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-08 |
| Context | O define exige a tab navegavel, mas proibe assumir escopo funcional da subetapa 2E.4. |

**Choice:** renderizar apenas placeholder informativo na segunda tab, sem consulta nem grid.

**Rationale:**

1. cumpre o shell navegavel pedido na 2E.1;
2. evita contaminar o design com o escopo futuro do historico;
3. reduz risco de contrair um contrato errado cedo demais.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| implementar grid parcial de historico agora | puxa escopo da 2E.4 |
| esconder a tab ate a fase futura | contradiz o define |

**Consequences:**

- positivo: shell completo e honesto;
- negativo: a tab ainda nao entrega valor funcional nessa subetapa.

---

## 6. Contrato de Dados e UI

### 6.1. Regra de derivacao de status de versao

Persistencia atual:

- `WorkflowVersionV2.state`: `draft | published`
- `WorkflowTypeV2.latestPublishedVersion`: numero da versao ativa/publicada
- `WorkflowTypeV2.active`: flag de disponibilidade do tipo

Classificacao visual da 2E.1:

| Condicao | Status de UI |
|----------|--------------|
| `version.state === "draft"` | `Rascunho` |
| `version.state === "published"` e `version.version === latestPublishedVersion` e `workflowType.active === true` | `Publicada` |
| `version.state === "published"` e `version.version !== latestPublishedVersion` | `Inativa` |
| `version.state === "published"` e `workflowType.active === false` | `Inativa` |

Estado derivado do tipo:

| Condicao do tipo | Status secundario do card do tipo |
|------------------|-----------------------------------|
| `latestPublishedVersion` ausente, nulo ou invalido | `Rascunho inicial / sem publicada` |
| `latestPublishedVersion` presente | `Publicada v{n}` |

### 6.2. Campos expostos na arvore

#### Area

- `areaId`
- `name`
- `icon`
- `typeCount`
- `publishedTypeCount`
- `draftOnlyTypeCount`
- `types[]`

Nao expor:

- `storageFolderPath`
- qualquer detalhe de ordenacao interna nao necessario para a UI

#### Workflow type

- `workflowTypeId`
- `name`
- `description`
- `areaId`
- `ownerEmail`
- `ownerUserId`
- `active`
- `latestPublishedVersion`
- `versionCount`
- `publishedVersionLabel`
- `hasPublishedVersion`
- `versions[]`

#### Version

- `version`
- `state`
- `uiStatus`
- `isActivePublished`
- `stepCount`
- `fieldCount`
- `publishedAt`

### 6.3. Comportamentos obrigatorios do shell

- a tela abre por padrao na tab `Definicoes`;
- estados de carregamento, erro e vazio existem para o catalogo;
- `Historico Geral` exibe copy de indisponibilidade planejada;
- CTAs futuros podem aparecer desabilitados, sem navegar ou mutar estado;
- `workflowTypeId` e `versionId` podem aparecer apenas como metadado tecnico auxiliar, nunca como input editavel;
- a versao ativa precisa estar visualmente destacada;
- tipos sem publicada nao devem ser tratados como erro.

---

## 7. API Contract

### 7.1. `GET /api/admin/request-config/catalog` (novo)

```http
GET /api/admin/request-config/catalog
Authorization: Bearer <firebase-id-token>
```

Sem request body.

#### Auth

1. validar Bearer token com helper derivado de `verifyBearerToken`;
2. resolver colaborador autenticado;
3. rejeitar com `403` quando `canManageWorkflowsV2 !== true`.

#### Response `200`

```json
{
  "ok": true,
  "data": {
    "areas": [
      {
        "areaId": "facilities",
        "name": "Facilities",
        "icon": "building-2",
        "typeCount": 3,
        "publishedTypeCount": 2,
        "draftOnlyTypeCount": 1,
        "types": [
          {
            "workflowTypeId": "facilities_manutencao",
            "name": "Manutencao",
            "description": "Chamados de manutencao predial.",
            "areaId": "facilities",
            "ownerEmail": "owner@3ariva.com.br",
            "ownerUserId": "SMO2",
            "active": true,
            "latestPublishedVersion": 2,
            "versionCount": 3,
            "publishedVersionLabel": "v2 publicada",
            "hasPublishedVersion": true,
            "versions": [
              {
                "version": 1,
                "state": "published",
                "uiStatus": "Inativa",
                "isActivePublished": false,
                "stepCount": 5,
                "fieldCount": 8,
                "publishedAt": "2026-04-01T10:00:00.000Z"
              },
              {
                "version": 2,
                "state": "published",
                "uiStatus": "Publicada",
                "isActivePublished": true,
                "stepCount": 6,
                "fieldCount": 9,
                "publishedAt": "2026-04-03T15:30:00.000Z"
              },
              {
                "version": 3,
                "state": "draft",
                "uiStatus": "Rascunho",
                "isActivePublished": false,
                "stepCount": 6,
                "fieldCount": 10,
                "publishedAt": null
              }
            ]
          }
        ]
      }
    ],
    "summary": {
      "areaCount": 8,
      "workflowTypeCount": 30,
      "versionCount": 32
    }
  }
}
```

#### Response `403`

```json
{
  "ok": false,
  "code": "FORBIDDEN",
  "message": "Usuario sem permissao para configurar workflows v2."
}
```

#### Response `500`

```json
{
  "ok": false,
  "code": "INTERNAL_ERROR",
  "message": "Erro interno do servidor."
}
```

### 7.2. Endpoint de historico

Nenhum endpoint novo para `Historico Geral` na 2E.1.

O placeholder deve ser puramente visual e nao pode inventar contrato provisiorio que contamine a `2E.4`.

---

## 8. Database / Auth Contract

### 8.1. Firestore

Nenhuma colecao nova e nenhum backfill obrigatorio.

Colecoes lidas:

- `workflowAreas`
- `workflowTypes_v2`
- `workflowTypes_v2/{workflowTypeId}/versions/{version}`

### 8.2. Contrato de permissao do colaborador

Adicionar a chave abaixo ao contrato TypeScript:

```ts
canManageWorkflowsV2: boolean;
```

Regras de compatibilidade:

- documentos antigos sem a chave continuam validos;
- ausencia da chave deve ser interpretada como `false`;
- super admin continua recebendo todas as permissoes em `true` por derivacao do `AuthContext`.

### 8.3. Security rules

Nenhuma alteracao obrigatoria em `firestore.rules` nesta subetapa.

Motivo:

- a leitura do catalogo admin acontecera pelo servidor com `firebase-admin`;
- a nova permissao vive em documento de colaborador e e aplicada na camada de authz do app;
- a edicao de permissao de colaborador segue o mecanismo atual da plataforma.

---

## 9. File Manifest

### 9.1. Ordem de execucao

| Phase | Files | Agent |
|-------|-------|-------|
| 1. Auth contract | `src/contexts/AuthContext.tsx`, `src/contexts/CollaboratorsContext.tsx`, `src/components/admin/PermissionsPageContent.tsx` | @react-frontend-developer |
| 2. Navigation + route guard | `src/components/layout/AppLayout.tsx`, `src/components/auth/*`, `src/app/(app)/admin/request-config/page.tsx` | @react-frontend-developer |
| 3. Server read API | `src/app/api/admin/request-config/catalog/route.ts`, `src/lib/workflows/admin-config/*` | @firebase-specialist |
| 4. Admin UI | `src/components/workflows/admin-config/*`, `src/hooks/*` ou `src/lib/workflows/admin-config/api-client.ts` | @react-frontend-developer |
| 5. Tests | `src/components/layout/__tests__/*`, `src/lib/workflows/admin-config/__tests__/*`, `src/app/api/admin/request-config/__tests__/*` | @react-frontend-developer + @firebase-specialist |

### 9.2. Manifesto detalhado

| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | `src/contexts/CollaboratorsContext.tsx` | Modify | adicionar `canManageWorkflowsV2` ao tipo e `defaultPermissions` | @react-frontend-developer | - |
| 2 | `src/contexts/AuthContext.tsx` | Modify | incluir `canManageWorkflowsV2` no `defaultPermissions` e merge de super admin | @react-frontend-developer | #1 |
| 3 | `src/components/admin/PermissionsPageContent.tsx` | Modify | expor toggle `Workflows V2` | @react-frontend-developer | #1 |
| 4 | `src/components/layout/AppLayout.tsx` | Modify | inserir item do novo painel admin condicionado a `canManageWorkflowsV2` | @react-frontend-developer | #2 |
| 5 | `src/components/auth/WorkflowConfigAdminGuard.tsx` | Create | guard especifico da rota v2 | @react-frontend-developer | #2 |
| 6 | `src/app/(app)/admin/request-config/page.tsx` | Create | entrypoint da nova rota admin | @react-frontend-developer | #5 |
| 7 | `src/lib/workflows/admin-config/types.ts` | Create | DTOs do catalogo e envelopes da API | @firebase-specialist | - |
| 8 | `src/lib/workflows/admin-config/auth.ts` | Create | resolver permissao `canManageWorkflowsV2` no servidor | @firebase-specialist | #1, #2 |
| 9 | `src/lib/workflows/admin-config/catalog.ts` | Create | agregacao server-side de areas, tipos e versoes | @firebase-specialist | #7, #8 |
| 10 | `src/app/api/admin/request-config/catalog/route.ts` | Create | endpoint read-only do catalogo | @firebase-specialist | #8, #9 |
| 11 | `src/lib/workflows/admin-config/api-client.ts` | Create | cliente fetch do frontend | @react-frontend-developer | #7, #10 |
| 12 | `src/components/workflows/admin-config/WorkflowConfigPage.tsx` | Create | shell principal com tabs e estados async | @react-frontend-developer | #11 |
| 13 | `src/components/workflows/admin-config/WorkflowConfigDefinitionsTab.tsx` | Create | arvore hierarquica read-only | @react-frontend-developer | #11, #12 |
| 14 | `src/components/workflows/admin-config/WorkflowConfigHistoryPlaceholder.tsx` | Create | placeholder da tab futura | @react-frontend-developer | #12 |
| 15 | `src/lib/workflows/admin-config/__tests__/catalog.test.ts` | Create | cobertura da agregacao e derivacao de estados | @firebase-specialist | #9 |
| 16 | `src/app/api/admin/request-config/__tests__/catalog-route.test.ts` | Create | contrato HTTP, 401/403/500/200 | @firebase-specialist | #10 |
| 17 | `src/components/workflows/admin-config/__tests__/WorkflowConfigPage.test.tsx` | Create | tabs, loading, erro, vazio e renderizacao do catalogo | @react-frontend-developer | #12, #13, #14 |
| 18 | `src/components/layout/__tests__/AppLayout.test.tsx` | Modify | validar exibicao isolada do item de menu | @react-frontend-developer | #4 |

---

## 10. Code Patterns

### 10.1. Pattern de guard dedicado

```tsx
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function WorkflowConfigAdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, permissions } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!permissions.canManageWorkflowsV2) {
      router.replace('/dashboard');
      return;
    }

    setIsAuthorized(true);
  }, [loading, permissions.canManageWorkflowsV2, router, user]);

  if (loading || !isAuthorized) {
    return (
      <div className="flex h-[calc(100vh-var(--header-height))] w-full items-center justify-center bg-background">
        <LoadingSpinner message="Carregando configurador de chamados v2" />
      </div>
    );
  }

  return <>{children}</>;
}
```

### 10.2. Pattern de authz server-side

```ts
import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { normalizeEmail } from '@/lib/email-utils';
import { verifyBearerToken } from '@/lib/workflows/runtime/auth-helpers';
import { RuntimeError } from '@/lib/workflows/runtime/errors';
import type { Collaborator } from '@/contexts/CollaboratorsContext';

export async function authenticateWorkflowConfigAdmin(request: Request) {
  const decodedToken = await verifyBearerToken(request);
  const db = getFirestore(getFirebaseAdminApp());
  const byAuthUid = await db.collection('collaborators').where('authUid', '==', decodedToken.uid).get();

  if (byAuthUid.size > 1) {
    throw new RuntimeError('FORBIDDEN' as never, `Usuario autenticado possui ${byAuthUid.size} colaboradores associados ao mesmo authUid.`, 403);
  }

  let collaboratorDoc = byAuthUid.docs[0] ?? null;

  if (!collaboratorDoc) {
    const normalizedEmail = normalizeEmail(decodedToken.email);

    if (!normalizedEmail) {
      throw new RuntimeError('FORBIDDEN' as never, 'Usuario autenticado nao possui colaborador operacional associado.', 403);
    }

    const byEmail = await db.collection('collaborators').where('email', '==', normalizedEmail).get();

    if (byEmail.size > 1) {
      throw new RuntimeError('FORBIDDEN' as never, `Usuario autenticado possui ${byEmail.size} colaboradores associados ao mesmo email normalizado.`, 403);
    }

    collaboratorDoc = byEmail.docs[0] ?? null;
  }

  if (!collaboratorDoc) {
    throw new RuntimeError('FORBIDDEN' as never, 'Usuario autenticado nao possui colaborador operacional associado.', 403);
  }

  const collaborator = { id: collaboratorDoc.id, ...collaboratorDoc.data() } as Collaborator;

  if (!collaborator?.permissions?.canManageWorkflowsV2) {
    throw new RuntimeError('FORBIDDEN' as never, 'Usuario sem permissao para configurar workflows v2.', 403);
  }

  return {
    decodedToken,
    collaborator,
  };
}
```

Observacoes:

- no build, preferir um erro tipado proprio da camada admin em vez de forcar `RuntimeError`;
- a autenticacao admin da `2E.1` deve seguir o mesmo padrao server-side da refatorizacao de workflows:
  - `verifyBearerToken(request)`
  - leitura via `firebase-admin`
  - resolucao do colaborador com fallback controlado:
    - `authUid`
    - depois e-mail normalizado
- a tolerancia por e-mail existe apenas para nao bloquear a superficie admin durante estados transitorios de reconciliacao;
- qualquer backfill de `authUid` continua fora da rota e deve acontecer em fluxo proprio de login/reconciliacao, nao neste endpoint de leitura.

### 10.3. Pattern de agregacao do catalogo

```ts
function mapVersionToListItem(
  workflowType: WorkflowTypeV2,
  version: WorkflowVersionV2,
): WorkflowConfigVersionListItem {
  const isActivePublished =
    version.state === 'published' &&
    workflowType.active === true &&
    workflowType.latestPublishedVersion === version.version;

  const uiStatus =
    version.state === 'draft'
      ? 'Rascunho'
      : isActivePublished
        ? 'Publicada'
        : 'Inativa';

  return {
    version: version.version,
    state: version.state,
    uiStatus,
    isActivePublished,
    stepCount: version.stepOrder.length,
    fieldCount: version.fields.length,
    publishedAt: version.state === 'published' ? version.publishedAt.toDate().toISOString() : null,
  };
}
```

### 10.4. Pattern de menu admin

```tsx
{permissions.canManageWorkflows && (
  <DropdownMenuItem asChild>
    <Link href="/admin/workflows" className="cursor-pointer font-body">
      <Workflow className="mr-2 h-4 w-4" />
      <span>Workflows</span>
    </Link>
  </DropdownMenuItem>
)}

{permissions.canManageWorkflowsV2 && (
  <DropdownMenuItem asChild>
    <Link href="/admin/request-config" className="cursor-pointer font-body">
      <Settings className="mr-2 h-4 w-4" />
      <span>Config. de chamados v2</span>
    </Link>
  </DropdownMenuItem>
)}
```

---

## 11. Testing Strategy

### 11.1. Unit tests

| Target | Cases |
|--------|-------|
| `mapVersionToListItem` | `draft`, `published ativa`, `published inativa`, tipo sem publicada |
| agregador de area/tipo | area sem tipos, tipo sem versoes, ordenacao estavel |
| helper de permissao | `canManageWorkflowsV2` verdadeiro/falso/ausente |

### 11.2. Integration tests

| Flow | Cases |
|------|------|
| route handler `/api/admin/request-config/catalog` | `401` sem token, `403` sem permissao, `200` com payload canonico, `500` inesperado |
| menu admin | exibe item novo apenas com `canManageWorkflowsV2`, preserva item legado com `canManageWorkflows` |
| page shell | loading, erro, vazio, aba `Historico Geral` placeholder |

### 11.3. Acceptance tests

```gherkin
Scenario: usuario apenas com permissao legada nao acessa a superficie v2
  GIVEN um colaborador com canManageWorkflows=true e canManageWorkflowsV2=false
  WHEN ele tenta abrir /admin/request-config
  THEN ele e redirecionado para /dashboard
  AND continua vendo /admin/workflows no menu admin
```

```gherkin
Scenario: catalogo exibe tipo sem versao publicada como estado valido
  GIVEN um workflowType_v2 sem latestPublishedVersion e com apenas version 1 draft
  WHEN a tela Definicoes carrega
  THEN o tipo aparece na area correspondente
  AND a versao 1 aparece com badge Rascunho
  AND o tipo aparece com resumo "Rascunho inicial / sem publicada"
```

```gherkin
Scenario: storageFolderPath nao vaza para a UI
  GIVEN uma area persistida com storageFolderPath
  WHEN o endpoint do catalogo responde
  THEN o campo storageFolderPath nao existe no payload
  AND nenhuma coluna ou texto da tela o exibe
```

---

## 12. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | remover item do menu admin da nova tela | usuarios deixam de ver o atalho v2 |
| 2 | remover rota `/admin/request-config` e guard dedicado | acesso direto passa a retornar 404 do app |
| 3 | reverter endpoint `/api/admin/request-config/catalog` e services associados | chamadas do cliente falham como esperado por ausencia da feature |
| 4 | manter a chave `canManageWorkflowsV2` como inerte ou revertela do frontend | tabela de permissoes volta ao estado anterior |

Metodo rapido:

- `git revert <commit-do-build>`

Observacao:

- como nao ha migracao de schema nem backfill, o rollback e puramente de codigo;
- documentos de colaboradores que eventualmente ja tiverem `canManageWorkflowsV2` podem permanecer sem efeito funcional.

---

## 13. Checklist de Implementacao

### Pre-build

- [x] DEFINE aprovado para design
- [x] rota final definida como `/admin/request-config`
- [x] decisao de guard dedicado documentada
- [x] contrato read-only do catalogo definido
- [x] manifesto de arquivos mapeado

### Post-build

- [ ] `canManageWorkflowsV2` presente em todos os `defaultPermissions`
- [ ] menu admin exibe `Config. de chamados v2` somente para autorizados
- [ ] rota nova responde com shell e tabs corretas
- [ ] catalogo renderiza area, tipo e versao sem `storageFolderPath`
- [ ] `Historico Geral` permanece placeholder navegavel
- [ ] testes novos e alterados passam

---

## 14. Instrucoes para Build

### Para @firebase-specialist

Files to modify:

- `src/app/api/admin/request-config/catalog/route.ts`
- `src/lib/workflows/admin-config/types.ts`
- `src/lib/workflows/admin-config/auth.ts`
- `src/lib/workflows/admin-config/catalog.ts`

Key requirements:

- autenticar via Bearer token;
- validar `canManageWorkflowsV2` no servidor;
- nao expor `storageFolderPath`;
- devolver arvore pronta com status derivados;
- cobrir `401`, `403`, `500` e `200`.

### Para @react-frontend-developer

Files to modify:

- `src/contexts/AuthContext.tsx`
- `src/contexts/CollaboratorsContext.tsx`
- `src/components/admin/PermissionsPageContent.tsx`
- `src/components/layout/AppLayout.tsx`
- `src/components/auth/WorkflowConfigAdminGuard.tsx`
- `src/app/(app)/admin/request-config/page.tsx`
- `src/components/workflows/admin-config/*`
- `src/lib/workflows/admin-config/api-client.ts`

Key requirements:

- nao reutilizar `AdminGuard`;
- manter `/admin/workflows` intacta;
- entregar tabs `Definicoes` e `Historico Geral`;
- tratar loading, erro e vazio de forma explicita;
- destacar versao publicada atual e caso valido sem publicada;
- nao introduzir acao mutavel nesta subetapa.

---

## 15. Revision History

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | 2026-04-08 | Codex (`design` skill) | Initial technical design for Fase 2E.1 covering dedicated permission, route namespace, shell admin and read-only hierarchical catalog for workflowTypes_v2 |
