# DESIGN: FASE 2A.1 - Entrada Oficial e Shell da Nova Rota

> Generated: 2026-04-01
> Status: Ready for build
> Scope: Fase 2 / 2A.1 - Criacao da rota oficial, namespace novo e entrada de navegacao
> Parent artifacts:
> - `/.claude/sdd/workflow/fase2/DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md`
> - `/.claude/sdd/workflow/fase2/DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md`

## 1. Objetivo

Criar a superficie oficial `/gestao-de-chamados` com shell inicial, namespace modular proprio e entrada no dropdown do usuario, sem remover ou alterar estruturalmente as superfices legadas.

## 2. Escopo

Este build cobre:

- criar a rota `/gestao-de-chamados`;
- criar o namespace oficial:
  - `src/components/workflows/management/*`
  - `src/lib/workflows/management/*`
- montar a pagina/shell inicial da nova superficie;
- adicionar a entrada `Gestao de chamados` no dropdown do usuario;
- manter `Gestao de Solicitacoes`, `Minhas Tarefas/Acoes`, `/requests` e `/pilot/facilities` intactos.

Este build nao cobre:

- bootstrap de ownership;
- filtros oficiais;
- listas operacionais completas;
- detalhe rico do request;
- remocao de atalhos legados.

## 3. Decisoes Fechadas

- `/gestao-de-chamados` entra no dropdown do usuario, nao na sidebar;
- a sidebar continua representando apenas a superficie de abertura de chamados;
- a nova tela nasce fora de `pilot/*`;
- este build e additive: nenhum arquivo legado deve ser removido.

## 4. File Manifest

| Ordem | Caminho | Acao | Responsabilidade |
|------|---------|------|------------------|
| 1 | [src/app/(app)/gestao-de-chamados/page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/gestao-de-chamados/page.tsx) | Create | Entry point da rota oficial |
| 2 | [src/components/workflows/management/WorkflowManagementPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/WorkflowManagementPage.tsx) | Create | Container inicial da pagina |
| 3 | [src/lib/workflows/management/types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/types.ts) | Create | Tipos base da 2A |
| 4 | [src/lib/workflows/management/query-keys.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/query-keys.ts) | Create | Chaves React Query da superficie oficial |
| 5 | [src/lib/workflows/management/presentation.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/presentation.ts) | Create | Labels e helpers de apresentacao base |
| 6 | [src/components/layout/AppLayout.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/layout/AppLayout.tsx) | Update | Adicionar `/gestao-de-chamados` ao dropdown do usuario sem remover atalhos antigos |
| 7 | [src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx) | Create | Cobrir shell, render inicial e entrada da rota |

## 5. Implementacao Esperada

### 5.1. Rota e shell inicial

- `page.tsx` renderiza a nova pagina oficial;
- `WorkflowManagementPage` mostra:
  - titulo `Gestao de chamados`;
  - descricao curta;
  - placeholders claros para tabs/listas;
  - estado inicial sem quebrar com ausencia das proximas camadas.

### 5.2. Navegacao

- o dropdown do usuario ganha `Gestao de chamados`;
- `Gestao de Solicitacoes` e `Minhas Tarefas/Acoes` continuam visiveis nesta fase;
- a sidebar principal nao ganha novo item.

### 5.3. Estrutura modular

- o codigo novo nasce em `workflows/management/*`;
- nada novo deve depender semanticamente de `pilot/*`.

## 6. Testing Strategy

- render da rota `/gestao-de-chamados`;
- presenca da entrada no dropdown do usuario;
- ausencia de novo item na sidebar principal;
- convivio sem remocao dos atalhos antigos.

## 7. Regra de Fechamento

Ao concluir o build da 2A.1, registrar obrigatoriamente em:

- [implementation_progress_fase2A.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase2/2A/implementation_progress_fase2A.md)

O registro deve incluir:

- arquivos criados/alterados;
- comportamento entregue;
- validacao executada;
- riscos remanescentes para a 2A.2.
