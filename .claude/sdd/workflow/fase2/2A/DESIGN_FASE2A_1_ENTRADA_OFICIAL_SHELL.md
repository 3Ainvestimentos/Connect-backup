# DESIGN: FASE 2A.1 - Entrada Oficial e Shell da Nova Rota

> Generated: 2026-04-01
> Status: Ready for build
> Scope: Fase 2 / 2A.1 - Criacao da rota oficial, namespace novo e entrada no dropdown do usuario
> Base document: `DEFINE_FASE2A_1_ENTRADA_OFICIAL_SHELL.md`

## 1. Objetivo

Construir a primeira superficie oficial de produto em `/gestao-de-chamados`, com identidade propria, entrada descoberta pelo dropdown do usuario e um shell inicial em namespace novo, sem ainda acoplar bootstrap, listas reais, detalhe rico ou URL state da 2A.2+.

Esta subetapa cobre:

- criar a rota oficial `/gestao-de-chamados` dentro do grupo autenticado `(app)`;
- inaugurar os namespaces:
  - `src/components/workflows/management/*`
  - `src/lib/workflows/management/*`
- expor `Gestao de chamados` no dropdown do usuario, na secao `Ferramentas`;
- renderizar um shell oficial com titulo, contexto de transicao e placeholders claros das abas futuras;
- manter `/pilot/facilities`, `/requests`, `/me/tasks` e `/applications` intactos;
- manter a sidebar principal sem novo item para a superficie operacional.

Esta subetapa nao cobre:

- `GET /api/workflows/read/management/bootstrap`;
- listas oficiais com dados reais;
- detalhe rico, modal oficial ou novas mutacoes;
- serializacao de tabs/filtros na URL;
- remocao de atalhos legados;
- mudancas em backend, schema, indices ou authz persistente.

---

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_FASE2A_1_ENTRADA_OFICIAL_SHELL.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/2A/DEFINE_FASE2A_1_ENTRADA_OFICIAL_SHELL.md)
- [DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md)
- [DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md)
- [ROADMAP_FASE2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase2/ROADMAP_FASE2.md)
- [src/app/(app)/layout.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/layout.tsx)
- [src/components/layout/AppLayout.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/layout/AppLayout.tsx)
- [src/components/layout/PageHeader.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/layout/PageHeader.tsx)
- [src/app/(app)/pilot/facilities/page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/pilot/facilities/page.tsx)
- [src/components/pilot/facilities/FacilitiesPilotPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/FacilitiesPilotPage.tsx)
- [src/app/(app)/requests/page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/requests/page.tsx)
- [src/app/(app)/me/tasks/page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/me/tasks/page.tsx)
- [src/contexts/AuthContext.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/contexts/AuthContext.tsx)

Em caso de divergencia:

1. prevalece o `DEFINE_FASE2A_1_ENTRADA_OFICIAL_SHELL.md` para escopo e aceite da 2A.1;
2. depois prevalecem o define e o design macro da 2A para direcao de arquitetura;
3. depois prevalece este documento para orientar o build;
4. o codigo real do App Router e do layout autenticado continua sendo a referencia final de integracao.

---

## 3. Estado Atual e Recorte da 2A.1

### 3.1. O que o repositorio ja oferece

- o grupo `(app)` ja entrega autenticacao e providers globais via [layout.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/layout.tsx);
- o dropdown do usuario em [AppLayout.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/layout/AppLayout.tsx) ja concentra as ferramentas operacionais legadas;
- a rota `/pilot/facilities` ja valida a arquitetura do frontend operacional novo, mas ainda dentro do namespace `pilot/*`;
- `/requests` e `/me/tasks` seguem como superfices legadas ativas para owner e executor;
- o repositório ainda nao possui rota nem namespace oficial de management fora de `pilot/*`.

### 3.2. Problema que a 2A.1 fecha

A macro 2A ja definiu que a experiencia oficial deve nascer em `/gestao-de-chamados`, mas o codigo atual ainda nao tem:

- entrypoint oficial de produto;
- pasta oficial para componentes/helpers da feature;
- ponto de descoberta no dropdown do usuario;
- shell inicial que permita rollout additive antes das listas reais.

### 3.3. Limites arquiteturais desta subetapa

- nao criar `useWorkflowManagement` ainda;
- nao importar `FacilitiesPilotPage` como implementacao da rota oficial;
- nao introduzir fetch, React Query ou contratos HTTP novos;
- nao mover nem remover rotas legadas;
- nao antecipar o URL state que pertence explicitamente a 2A.2.

### 3.4. Resultado esperado ao final da 2A.1

- o usuario com discoverability operacional ve `Gestao de chamados` no dropdown;
- a rota `/gestao-de-chamados` abre sem erro dentro do shell autenticado;
- a UI comunica que esta e a nova superficie oficial e que listas/detalhe chegam nas proximas subetapas;
- a base de arquivos fica pronta para receber bootstrap, listas e detalhe sem retrabalho estrutural.

---

## 4. Arquitetura da Solucao

### 4.1. Diagrama arquitetural

```text
Authenticated User
  |
  +--> AppLayout / UserNav dropdown
  |       |
  |       +--> Ferramentas
  |               |
  |               +--> /requests                  (legado preservado)
  |               +--> /me/tasks                  (legado preservado)
  |               +--> /gestao-de-chamados       (nova entrada oficial)
  |
  v
src/app/(app)/gestao-de-chamados/page.tsx
  |
  v
WorkflowManagementPage ("use client")
  |
  +--> PageHeader
  +--> management/constants.ts
  +--> management/navigation.ts
  +--> ManagementShellPlaceholder
  |
  +--> Tabs placeholder:
          - Chamados atuais
          - Atribuicoes e acoes
          - Concluidas

Rotas e superfices mantidas durante a transicao:
  - /applications
  - /pilot/facilities
  - /requests
  - /me/tasks
```

### 4.2. Fluxo por camadas

```text
LAYER 1 (Routing / Entry)
1. src/app/(app)/gestao-de-chamados/page.tsx cria o entrypoint oficial.
2. A rota herda autenticacao e providers do grupo (app).

LAYER 2 (Navigation)
3. src/components/layout/AppLayout.tsx ganha um novo item no dropdown do usuario.
4. A sidebar principal permanece inalterada.

LAYER 3 (Presentation)
5. src/components/workflows/management/WorkflowManagementPage.tsx renderiza o shell oficial.
6. Tabs e placeholders comunicam a estrutura futura sem dados reais.

LAYER 4 (Feature Base)
7. src/lib/workflows/management/constants.ts concentra ids, labels e copy base da feature.
8. src/lib/workflows/management/navigation.ts concentra a regra temporaria de discoverability do item no menu.

LAYER 5 (Future Extension)
9. 2A.2 acopla bootstrap, listas e URL state sobre o mesmo container.
10. 2A.3 acopla detalhe rico e acoes contextuais.
```

### 4.3. Estado gerenciado no frontend oficial

| Estado | Armazenamento | Lifecycle |
|-------|---------------|-----------|
| `activeTab` do shell | `useState` local | inicia em `current`; muda apenas dentro da sessao atual; nao vai para a URL na 2A.1 |
| metadata visual das tabs | `constants.ts` | estatico; carregado no import |
| discoverability do item do dropdown | helper puro em `navigation.ts` | calculado a cada render do layout, com base nas permissoes ja disponiveis |

Nao existe nesta subetapa:

- server state;
- hook de orquestracao;
- mutations;
- request selecionado;
- sincronizacao de filtros/tabs com search params.

### 4.4. Contrato visual do shell inicial

O shell oficial deve nascer com:

- `PageHeader` com titulo `Gestao de chamados`;
- descricao curta explicando que esta e a nova central oficial em construcao incremental;
- bloco de contexto informando que os atalhos legados permanecem operacionais durante a transicao;
- tabs principais da macro 2A, mesmo ainda em placeholder:
  - `Chamados atuais`
  - `Atribuicoes e acoes`
  - `Concluidas`
- um placeholder reutilizavel por tab explicando o que entra em 2A.2 e 2A.3.

O shell nao deve:

- fingir lista vazia real;
- exibir contadores operacionais falsos;
- esconder tabs por ownership antes do bootstrap existir;
- depender de qualquer componente do namespace `pilot/*`.

### 4.5. Contrato de navegacao temporario

`Gestao de chamados` entra no dropdown na secao `Ferramentas` usando a mesma janela de convivencia da transicao:

- mostrar o item quando `permissions.canManageRequests || permissions.canViewTasks`;
- manter `Gestao de Solicitacoes` e `Minhas Tarefas/Acoes` ativos ao lado da nova entrada;
- nao tocar em `navItems` da sidebar;
- manter a rota acessivel dentro de `(app)` mesmo sem gate especifico de frontend, porque a 2A.1 ainda nao fecha capability final por ownership.

---

## 5. Architecture Decisions

### ADR-2A.1.1: A rota oficial nasce em namespace proprio e nao encapsula o piloto

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-01 |
| Context | O define fecha que a experiencia oficial nao pode depender semanticamente de `pilot/*`, mesmo que o piloto siga ativo durante a transicao. |

**Choice:** criar `src/components/workflows/management/*` e `src/lib/workflows/management/*` ja na 2A.1, com um container oficial proprio para o shell da nova rota.

**Rationale:**

1. separa superficie oficial de referencia de implementacao piloto;
2. evita que a 2A.2 tenha de desmontar uma pagina oficial montada como thin wrapper do piloto;
3. permite que os proximos builds crescam sobre uma fronteira estavel.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| apontar `/gestao-de-chamados` para `FacilitiesPilotPage` | perpetua acoplamento semantico ao piloto |
| expandir `src/components/pilot/facilities/*` para virar produto final | contradiz o define e dificulta cleanup posterior |

**Consequences:**

- positivo: o namespace oficial nasce limpo e preparado para crescimento;
- positivo: o piloto continua util como fallback sem ser o centro do build;
- negativo: existe duplicacao temporaria de shell/base visual entre piloto e oficial.

### ADR-2A.1.2: A 2A.1 permanece frontend-only e nao cria abstrações de dados inertes

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-01 |
| Context | O define da 2A.1 limita o build a rota, dropdown, namespace e shell. Bootstrap, listas, URL state e detalhe sao responsabilidades da 2A.2 e 2A.3. |

**Choice:** nao criar hook de dados, client HTTP, endpoint ou query key na 2A.1; a base desta subetapa fica restrita a componentes, constantes e helpers de navegacao.

**Rationale:**

1. evita codigo morto ou contratos artificiais antes do escopo existir;
2. preserva a fronteira clara entre shell (2A.1) e listas/bootstrap (2A.2);
3. reduz risco de retrabalho quando o design detalhado da 2A.2 for aplicado.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| criar `useWorkflowManagement` vazio | introduz abstração sem responsabilidade real |
| antecipar `searchParams` e filtros oficiais | rouba escopo da 2A.2 e pode cristalizar contrato errado |

**Consequences:**

- positivo: build pequeno, additive e facil de validar;
- positivo: nenhum impacto em backend/read-side;
- negativo: a 2A.2 precisara adicionar a camada de dados do zero sobre o shell criado.

### ADR-2A.1.3: Discoverability acontece no dropdown do usuario, nao na sidebar

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-01 |
| Context | O define fecha que a nova central operacional deve aparecer em `Ferramentas`, preservando a sidebar para a superficie de abertura de chamados. |

**Choice:** adicionar `Gestao de chamados` somente no dropdown do usuario, na secao `Ferramentas`, mantendo a sidebar principal inalterada.

**Rationale:**

1. respeita a organizacao mental entre abertura e operacao;
2. reduz risco de inflar a navegacao principal antes do rollout definitivo;
3. preserva convivencia com `/requests` e `/me/tasks`.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| adicionar item novo em `navItems` | quebra decisao fechada do define |
| substituir imediatamente `/requests` ou `/me/tasks` | nao e additive e aumenta risco operacional |

**Consequences:**

- positivo: rollout gradual e reversivel;
- positivo: nenhum impacto na sidebar atual;
- negativo: durante a transicao existem tres entradas operacionais convivendo no menu.

---

## 6. File Manifest

### 6.1. Ordem de execucao

| Ordem | Caminho | Acao | Responsabilidade | Agente/Skill sugerido |
|------|---------|------|------------------|-----------------------|
| 1 | [src/lib/workflows/management/types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/types.ts) | Create | Tipos locais do shell oficial | `build` / `@react-frontend-developer` |
| 2 | [src/lib/workflows/management/constants.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/constants.ts) | Create | Ids, labels e copy base da nova superficie | `build` / `@react-frontend-developer` |
| 3 | [src/lib/workflows/management/navigation.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/navigation.ts) | Create | Regra temporaria de exibicao do item no dropdown | `build` / `@react-frontend-developer` |
| 4 | [src/components/workflows/management/ManagementShellPlaceholder.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/ManagementShellPlaceholder.tsx) | Create | Placeholder reutilizavel por tab | `build` / `@react-frontend-developer` |
| 5 | [src/components/workflows/management/WorkflowManagementPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/WorkflowManagementPage.tsx) | Create | Container client-side do shell oficial | `build` / `@react-frontend-developer` |
| 6 | [src/app/(app)/gestao-de-chamados/page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/gestao-de-chamados/page.tsx) | Create | Entry point da nova rota oficial | `build` / `@react-frontend-developer` |
| 7 | [src/components/layout/AppLayout.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/layout/AppLayout.tsx) | Update | Adicionar item `Gestao de chamados` no dropdown sem tocar na sidebar | `build` / `@react-frontend-developer` |
| 8 | [src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx) | Create | Cobertura do shell inicial e tabs placeholder | `build` |
| 9 | [src/lib/workflows/management/__tests__/navigation.test.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/__tests__/navigation.test.ts) | Create | Cobertura da regra temporaria do dropdown | `build` |

### 6.2. Manifest detalhado

| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | [src/lib/workflows/management/types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/types.ts) | Create | Definir `ManagementShellTabId` e tipos do placeholder | `@react-frontend-developer` | - |
| 2 | [src/lib/workflows/management/constants.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/constants.ts) | Create | Centralizar tabs e copy para o shell | `@react-frontend-developer` | #1 |
| 3 | [src/lib/workflows/management/navigation.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/navigation.ts) | Create | Expor helper `canAccessWorkflowManagementEntry()` | `@react-frontend-developer` | - |
| 4 | [src/components/workflows/management/ManagementShellPlaceholder.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/ManagementShellPlaceholder.tsx) | Create | Renderizar mensagem consistente por aba futura | `@react-frontend-developer` | #1, #2 |
| 5 | [src/components/workflows/management/WorkflowManagementPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/WorkflowManagementPage.tsx) | Create | Montar header, callout de transicao e tabs placeholder | `@react-frontend-developer` | #1, #2, #4 |
| 6 | [src/app/(app)/gestao-de-chamados/page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/gestao-de-chamados/page.tsx) | Create | Registrar a rota oficial no App Router | `@react-frontend-developer` | #5 |
| 7 | [src/components/layout/AppLayout.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/layout/AppLayout.tsx) | Update | Inserir novo item no dropdown usando helper de `navigation.ts` | `@react-frontend-developer` | #3 |
| 8 | [src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx) | Create | Verificar render do shell, tabs e copy de transicao | `build` | #5 |
| 9 | [src/lib/workflows/management/__tests__/navigation.test.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/__tests__/navigation.test.ts) | Create | Verificar gate temporario por `canManageRequests` e `canViewTasks` | `build` | #3 |

### 6.3. Artefatos explicitamente fora do escopo

Nao devem ser tocados na 2A.1:

- [src/hooks/use-facilities-pilot.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-facilities-pilot.ts)
- [src/components/pilot/facilities/FacilitiesPilotPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/FacilitiesPilotPage.tsx)
- [src/lib/workflows/read/queries.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/queries.ts)
- [src/app/api/workflows/read/current/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/read/current/route.ts)
- [src/app/api/workflows/read/assignments/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/read/assignments/route.ts)
- [src/app/api/workflows/read/completed/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/read/completed/route.ts)

---

## 7. Code Patterns

### 7.1. Pattern: Entry point da rota oficial

```tsx
// src/app/(app)/gestao-de-chamados/page.tsx
import { WorkflowManagementPage } from '@/components/workflows/management/WorkflowManagementPage';

export default function WorkflowManagementRoutePage() {
  return <WorkflowManagementPage />;
}
```

Notas:

- manter a rota como server component fino;
- nao receber `searchParams` na 2A.1;
- qualquer logica de URL state fica para a 2A.2.

### 7.2. Pattern: Base tipada do shell oficial

```ts
// src/lib/workflows/management/types.ts
export type ManagementShellTabId = 'current' | 'assignments' | 'completed';

export type ManagementShellPlaceholderContent = {
  tab: ManagementShellTabId;
  title: string;
  description: string;
  nextStepLabel: string;
};
```

```ts
// src/lib/workflows/management/constants.ts
import type { ManagementShellPlaceholderContent } from './types';

export const WORKFLOW_MANAGEMENT_ROUTE = '/gestao-de-chamados';

export const MANAGEMENT_SHELL_TABS: ManagementShellPlaceholderContent[] = [
  {
    tab: 'current',
    title: 'Chamados atuais',
    description: 'Ownership explicito, bootstrap e fila oficial entram na 2A.2.',
    nextStepLabel: 'Proxima entrega: bootstrap e lista do owner.',
  },
  {
    tab: 'assignments',
    title: 'Atribuicoes e acoes',
    description: 'As listas oficiais e a separacao por subtabs chegam na 2A.2.',
    nextStepLabel: 'Proxima entrega: atribuicoes e acoes pendentes oficiais.',
  },
  {
    tab: 'completed',
    title: 'Concluidas',
    description: 'O historico oficial sera conectado na 2A.2.',
    nextStepLabel: 'Proxima entrega: lista concluida oficial.',
  },
];
```

### 7.3. Pattern: Regra temporaria de discoverability

```ts
// src/lib/workflows/management/navigation.ts
type WorkflowManagementEntryPermissions = {
  canManageRequests?: boolean;
  canViewTasks?: boolean;
};

export function canAccessWorkflowManagementEntry(
  permissions: WorkflowManagementEntryPermissions,
): boolean {
  return Boolean(permissions.canManageRequests || permissions.canViewTasks);
}
```

Notas:

- nao misturar essa regra com ownership final;
- o helper existe para encapsular apenas a convivio temporario da 2A.1;
- a 2A.2 pode evolui-lo ou removelo quando o bootstrap assumir a governanca.

### 7.4. Pattern: Shell oficial client-side

```tsx
// src/components/workflows/management/WorkflowManagementPage.tsx
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MANAGEMENT_SHELL_TABS,
} from '@/lib/workflows/management/constants';
import type { ManagementShellTabId } from '@/lib/workflows/management/types';
import { ManagementShellPlaceholder } from './ManagementShellPlaceholder';

export function WorkflowManagementPage() {
  const [activeTab, setActiveTab] = React.useState<ManagementShellTabId>('current');

  return (
    <div className="space-y-6 p-6 md:p-8">
      <PageHeader
        title="Gestao de chamados"
        description="Nova central oficial da operacao, entregue de forma incremental a partir da Fase 2A."
      />

      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          A rota oficial ja esta disponivel. As superficies legadas seguem ativas durante a transicao.
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ManagementShellTabId)}>
        <TabsList>
          {MANAGEMENT_SHELL_TABS.map((tab) => (
            <TabsTrigger key={tab.tab} value={tab.tab}>
              {tab.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {MANAGEMENT_SHELL_TABS.map((tab) => (
          <TabsContent key={tab.tab} value={tab.tab}>
            <ManagementShellPlaceholder content={tab} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
```

### 7.5. Pattern: Item novo no dropdown do usuario

```tsx
// src/components/layout/AppLayout.tsx
import { ListChecks } from 'lucide-react';
import { canAccessWorkflowManagementEntry } from '@/lib/workflows/management/navigation';
import { WORKFLOW_MANAGEMENT_ROUTE } from '@/lib/workflows/management/constants';

const canSeeWorkflowManagement = canAccessWorkflowManagementEntry(permissions);

{canSeeWorkflowManagement && (
  <DropdownMenuItem asChild>
    <Link href={WORKFLOW_MANAGEMENT_ROUTE} className="cursor-pointer font-body">
      <ListChecks className="mr-2 h-4 w-4" />
      <span>Gestao de chamados</span>
    </Link>
  </DropdownMenuItem>
)}
```

Notas:

- inserir o novo item antes ou depois dos atalhos legados, mas sempre dentro de `Ferramentas`;
- nao remover `Gestao de Solicitacoes` nem `Minhas Tarefas/Acoes`;
- nao alterar `navItems`.

---

## 8. API Contract

Nenhum endpoint novo ou alterado na 2A.1.

Contratos explicitamente adiados:

- `GET /api/workflows/read/management/bootstrap` para 2A.2;
- filtros opcionais em `current`, `assignments` e `completed` para 2A.2;
- `GET /api/workflows/read/requests/[requestId]` para 2A.3.

---

## 9. Database Schema

Nenhuma mudanca de schema.

Nenhuma mudanca em:

- `workflowTypes_v2`;
- `workflowTypes_v2/{workflowTypeId}/versions/{version}`;
- `workflows_v2`;
- indices compostos;
- regras de seguranca.

---

## 10. Testing Strategy

### 10.1. Unit tests

| Componente | Cobertura |
|-----------|-----------|
| `canAccessWorkflowManagementEntry()` | mostrar item quando `canManageRequests` ou `canViewTasks`; esconder quando ambos forem falsos |
| `MANAGEMENT_SHELL_TABS` | garantir ids validos e ordem estavel das tabs |

### 10.2. Component tests

| Componente | Cobertura |
|-----------|-----------|
| `WorkflowManagementPage` | render do `PageHeader`, callout de transicao e tres tabs oficiais |
| `ManagementShellPlaceholder` | copy coerente com cada tab e ausencia de dados ficticios |

### 10.3. Integration / smoke tests

| Fluxo | Cobertura |
|------|-----------|
| dropdown do usuario | usuario com `canManageRequests` ve a nova entrada sem perder as antigas |
| dropdown do usuario | usuario com `canViewTasks` e sem `canManageRequests` tambem ve a nova entrada |
| rota oficial | `/gestao-de-chamados` abre dentro do shell autenticado sem erro |
| navegacao principal | sidebar continua sem item novo para a rota oficial |

### 10.4. Acceptance tests

```gherkin
GIVEN um usuario autenticado com permissao operacional atual
WHEN abre o dropdown do usuario
THEN encontra a entrada "Gestao de chamados" na secao "Ferramentas"
```

```gherkin
GIVEN o usuario acessa /gestao-de-chamados
WHEN a pagina carrega
THEN ele ve um shell oficial com header, contexto de transicao e tabs placeholder
```

```gherkin
GIVEN as rotas legadas continuam ativas
WHEN a 2A.1 for publicada
THEN /requests, /me/tasks, /applications e /pilot/facilities continuam funcionando sem alteracao comportamental
```

---

## 11. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | remover a entrada `Gestao de chamados` do dropdown | a nova rota deixa de ser descoberta pelo menu |
| 2 | reverter a criacao de `src/app/(app)/gestao-de-chamados/page.tsx` e `src/components/workflows/management/*` | a superficie oficial deixa de existir sem afetar legados |
| 3 | manter `/pilot/facilities`, `/requests`, `/me/tasks` e `/applications` como superfices operacionais | a operacao segue funcional pelos atalhos existentes |

Metodo rapido:

```bash
git revert <commit-da-2A-1>
```

Observacao: como a 2A.1 e estritamente additive e nao altera backend nem dados persistidos, o rollback nao exige restauracao de banco ou migracao reversa.

---

## 12. Implementation Checklist

### Pre-Build

- [x] DEFINE aprovado para design
- [x] fronteira da 2A.1 isolada da 2A.2 e 2A.3
- [x] decisao de navegacao no dropdown fechada
- [x] namespace oficial novo definido
- [x] manifest de arquivos mapeado

### Post-Build

- [ ] rota `/gestao-de-chamados` criada dentro de `(app)`
- [ ] dropdown do usuario expondo `Gestao de chamados`
- [ ] sidebar principal inalterada
- [ ] shell oficial renderizando sem fetch nem erro
- [ ] componentes novos nascidos em `workflows/management/*`
- [ ] helper de discoverability coberto por teste
- [ ] rotas legadas preservadas

---

## 13. Specialist Instructions

### Para `@react-frontend-developer`

Files to modify:

- `src/app/(app)/gestao-de-chamados/page.tsx`
- `src/components/workflows/management/*`
- `src/lib/workflows/management/*`
- `src/components/layout/AppLayout.tsx`

Key requirements:

- nao importar `FacilitiesPilotPage` nem qualquer componente do namespace `pilot/*` para compor a rota oficial;
- manter o build estritamente frontend-only;
- nao serializar tabs na URL nesta subetapa;
- usar o shell autenticado ja existente do grupo `(app)`;
- deixar a estrutura pronta para `useWorkflowManagement` nascer na 2A.2 sem refactor estrutural;
- manter a copy honesta: shell em construcao incremental, nao lista vazia simulada.

### Para `@firebase-specialist`

Nenhuma acao nesta subetapa.

Nao criar:

- endpoints novos;
- mudancas no read-side;
- mudancas de authz;
- mudancas de schema.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-01 | Codex | Initial design for Fase 2A.1, covering official route entry, dropdown discoverability, new management namespace, and shell-only frontend scope |
