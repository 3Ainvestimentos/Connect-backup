# DESIGN: FASE 2A.2 - Bootstrap e Listas Oficiais

> Generated: 2026-04-01
> Status: Ready for build
> Scope: Fase 2 / 2A.2 - Bootstrap da tela oficial, filtros server-side e listas operacionais
> Parent artifacts:
> - `/.claude/sdd/workflow/fase2/DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md`
> - `/.claude/sdd/workflow/fase2/DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md`

## 1. Objetivo

Adicionar o bootstrap oficial da tela, filtros estruturantes executados no servidor e as listas oficiais de `Chamados atuais`, `Atribuicoes e acoes` e `Concluidas`, incluindo subtabs na fila operacional.

## 2. Escopo

Este build cobre:

- `GET /api/workflows/read/management/bootstrap`;
- filtros oficiais opcionais em `current`, `assignments` e `completed`;
- `useWorkflowManagement` com URL state;
- toolbar com busca/filtros;
- aba `Chamados atuais`;
- aba `Atribuicoes e acoes` com subtabs:
  - `Atribuidos a mim`
  - `Acoes pendentes para mim`
- aba `Concluidas`.

Este build nao cobre:

- detalhe rico do request;
- `GET /api/workflows/read/requests/[requestId]`;
- timeline, progresso e anexos no modal;
- remocao das telas legadas.

## 3. Decisoes Fechadas

- `ownership` e `filterOptions` sao conceitos separados no bootstrap;
- `requesterQuery` e refinamento server-side em memoria sobre o dataset ja restrito ao ator;
- filtros estruturantes entram na URL;
- a aba `Chamados atuais` depende de ownership explicito, nao de fila vazia.

## 4. File Manifest

| Ordem | Caminho | Acao | Responsabilidade |
|------|---------|------|------------------|
| 1 | [src/lib/workflows/read/types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/types.ts) | Update | Tipos de bootstrap e filtros oficiais |
| 2 | [src/lib/workflows/read/queries.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/queries.ts) | Update | Aplicar filtros oficiais opcionais |
| 3 | [src/app/api/workflows/read/management/bootstrap/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/read/management/bootstrap/route.ts) | Create | Bootstrap de ownership e filterOptions |
| 4 | [src/app/api/workflows/read/current/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/read/current/route.ts) | Update | Aceitar filtros oficiais |
| 5 | [src/app/api/workflows/read/assignments/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/read/assignments/route.ts) | Update | Aceitar filtros oficiais |
| 6 | [src/app/api/workflows/read/completed/route.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/api/workflows/read/completed/route.ts) | Update | Aceitar filtros oficiais |
| 7 | [src/lib/workflows/management/api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/api-client.ts) | Create | Client HTTP da 2A para bootstrap e listas |
| 8 | [src/hooks/use-workflow-management.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-workflow-management.ts) | Create | Orquestracao de bootstrap, listas e filtros |
| 9 | [src/components/workflows/management/ManagementToolbar.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/ManagementToolbar.tsx) | Create | Busca, filtros e URL state |
| 10 | [src/components/workflows/management/RequestList.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestList.tsx) | Create | Lista oficial de requests |
| 11 | [src/components/workflows/management/CurrentQueuePanel.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/CurrentQueuePanel.tsx) | Create | Aba `Chamados atuais` |
| 12 | [src/components/workflows/management/AssignmentsPanel.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/AssignmentsPanel.tsx) | Create | Aba `Atribuicoes e acoes` com subtabs |
| 13 | [src/components/workflows/management/CompletedPanel.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/CompletedPanel.tsx) | Create | Aba `Concluidas` |
| 14 | [src/components/workflows/management/WorkflowManagementPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/WorkflowManagementPage.tsx) | Update | Integrar toolbar e abas reais |
| 15 | [src/lib/workflows/read/__tests__/read-api-contract.test.js](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/__tests__/read-api-contract.test.js) | Update | Cobrir bootstrap e contratos filtrados |
| 16 | [src/lib/workflows/read/__tests__/queries.test.js](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/__tests__/queries.test.js) | Update | Cobrir filtros server-side |
| 17 | [src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx) | Update | Cobrir tabs, subtabs, URL state e visibilidade |

## 5. Implementacao Esperada

### 5.1. Bootstrap

O endpoint deve retornar:

- `capabilities`;
- bloco `ownership`;
- bloco `filterOptions`.

Regra:

- `filterOptions` nao podem depender exclusivamente de ownership.

### 5.2. Filtros

Filtros estruturantes:

- `requestId`
- `workflowTypeId`
- `areaId`
- `requesterQuery`
- `slaState`
- `periodFrom`
- `periodTo`

### 5.3. UX das listas

- `Chamados atuais` aparece apenas com `canViewCurrentQueue`;
- `Atribuicoes e acoes` usa subtabs explicitas;
- `Concluidas` preserva agrupamento mensal do endpoint.

## 6. Testing Strategy

- bootstrap com e sem ownership;
- filtros opcionais sem quebrar contrato do piloto;
- render correto das abas pela capability;
- subtabs de `Atribuicoes e acoes`;
- URL refletindo busca/filtros.

## 7. Regra de Fechamento

Ao concluir o build da 2A.2, registrar obrigatoriamente em:

- [implementation_progress_fase2A.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase2/2A/implementation_progress_fase2A.md)

O registro deve incluir:

- endpoints novos/evoluidos;
- filtros entregues;
- comportamento das abas e subtabs;
- validacoes executadas;
- riscos remanescentes para a 2A.3.
