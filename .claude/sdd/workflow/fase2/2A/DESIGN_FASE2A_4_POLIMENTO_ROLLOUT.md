# DESIGN: FASE2A_4_POLIMENTO_ROLLOUT

> Generated: 2026-04-01
> Status: Ready for build
> Scope: Fase 2 / 2A.4 - Polimento e rollout controlado
> Base document: `DEFINE_FASE2A_4_POLIMENTO_ROLLOUT.md`

## 1. Objetivo

Concluir a macroetapa 2A com um build estritamente focado em acabamento, hardening e readiness de transicao da experiencia oficial de gestao de chamados, sem reabrir backlog estrutural das subetapas 2A.1, 2A.2 e 2A.3.

Esta etapa cobre:

- refinamento visual da superficie oficial;
- tratamento consistente de loading, erro e estados vazios;
- hardening da navegacao, filtros, modal e mutacoes;
- decisao final de convivencia no dropdown do usuario;
- smoke final da 2A e checklist de readiness para rollout controlado.

Esta etapa nao cobre:

- remocao definitiva de `/requests`, `/me/tasks` ou `/pilot/facilities`;
- novos contratos obrigatorios de backend;
- mudancas de schema em Firestore;
- absorcao de backlog estrutural de listas, bootstrap ou detalhe rico;
- expansao da cobertura para 2B ou 2C.

### 1.1. Premissa de baseline

A 2A.4 depende da existencia funcional do baseline desenhado nas subetapas anteriores:

- rota oficial `/gestao-de-chamados`;
- namespace oficial `src/components/workflows/management/*`;
- bootstrap oficial de capabilities e ownership;
- listas oficiais de `current`, `assignments` e `completed`;
- detalhe rico por `GET /api/workflows/read/requests/[requestId]`.

No snapshot atual do repositorio em 2026-04-01, esses artefatos ainda nao estao materializados no codigo: o namespace `workflows/management` esta vazio, a rota `/gestao-de-chamados` nao existe e o dropdown continua apontando para `/requests` e `/me/tasks`.

Implicacao pratica:

- este design descreve o delta da 2A.4 sobre o target architecture da 2A;
- se o branch de build ainda nao contiver o baseline de 2A.1 a 2A.3, a implementacao da 2A.4 deve parar e tratar isso como bloqueio, nao como escopo implicito.

---

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_FASE2A_4_POLIMENTO_ROLLOUT.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/2A/DEFINE_FASE2A_4_POLIMENTO_ROLLOUT.md)
- [DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md)
- [DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md)
- [ROADMAP_FASE2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase2/ROADMAP_FASE2.md)
- [AppLayout.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/layout/AppLayout.tsx)
- [FacilitiesPilotPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/FacilitiesPilotPage.tsx)
- [RequestDetailsDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/pilot/facilities/RequestDetailsDialog.tsx)
- [use-facilities-pilot.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-facilities-pilot.ts)
- [queries.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/queries.ts)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/types.ts)
- [page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/pilot/facilities/page.tsx)
- [page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/requests/page.tsx)
- [page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/me/tasks/page.tsx)

Em caso de divergencia:

1. prevalece o `DEFINE_FASE2A_4_POLIMENTO_ROLLOUT.md` para escopo e aceite;
2. depois prevalece o `DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md` para baseline de arquitetura da 2A;
3. depois prevalece este documento para orientar acabamento, hardening e rollout;
4. o codigo real do repositorio prevalece sobre qualquer premissa nao materializada, devendo as lacunas ser tratadas como bloqueio ou registradas no build report.

---

## 3. Estado Atual Relevante

### 3.1. O que existe hoje no repositorio

- a experiencia operacional ativa continua concentrada em `/pilot/facilities`, com tabs, mutacoes e dialog resumido;
- o dropdown do usuario ainda expoe `Gestao de Solicitacoes` (`/requests`) e `Minhas Tarefas/Acoes` (`/me/tasks`) como atalhos primarios;
- o read-side resumido ja existe via `GET /api/workflows/read/current`, `assignments`, `completed` e `mine`;
- o dialog atual do piloto ainda exibe apenas metadados resumidos e acoes operacionais basicas;
- nao ha novo schema nem dependencia backend obrigatoria para um build de polimento.

### 3.2. O que o design macro da 2A ja fechou

O design pai da 2A ja decidiu que:

- a superficie oficial nasce em `/gestao-de-chamados`;
- o namespace oficial fica em `src/components/workflows/management/*` e `src/lib/workflows/management/*`;
- o dropdown do usuario e o ponto de entrada oficial;
- as listas continuam em `current`, `assignments` e `completed`;
- o detalhe rico usa `GET /api/workflows/read/requests/[requestId]`;
- os legados convivem temporariamente durante a transicao.

### 3.3. Gaps especificos que a 2A.4 precisa fechar

- polir a hierarquia visual, copy e feedbacks da superficie oficial;
- eliminar estados ad hoc de loading, erro e vazio entre tabs e modal;
- reduzir ambiguidade no dropdown, que nao pode continuar com multiplos CTAs concorrendo como superficie principal;
- garantir que filtros, navegacao por URL, dialog e mutacoes se comportem de forma segura em refresh, deep-link e falha parcial;
- formalizar smoke final e readiness para substituicao controlada.

---

## 4. Decisoes Fechadas da 2A.4

### 4.1. A rota oficial vira o CTA primario no dropdown

- `/gestao-de-chamados` passa a ser o primeiro item operacional do grupo `Ferramentas`;
- o link oficial herda o destaque visual de pendencias operacionais;
- `/requests` e `/me/tasks` permanecem acessiveis, mas descem para um bloco explicitamente marcado como legado temporario;
- `/pilot/facilities` continua fora do dropdown principal e permanece apenas como fallback conhecido de engenharia/operacao.

### 4.2. Convivencia no dropdown sera explicita, nao implicita

- o bloco legado recebe rotulo textual claro, por exemplo `Atalhos legados durante transicao`;
- os links legados perdem o papel de CTA primario e deixam de competir visualmente com a rota oficial;
- a estrategia de rollout nao remove os legados, apenas muda ordem, rotulacao e enfase.

### 4.3. Hardening sera centralizado em primitives compartilhadas da surface oficial

- loading, erro e estado vazio devem usar componentes/padroes compartilhados dentro de `workflows/management/*`;
- cada tab oficial recebe o mesmo contrato de rendering: `loading -> error -> empty -> data`;
- o modal oficial segue o mesmo principio, incluindo fallback para falha de detalhe sem travar a tela inteira.

### 4.4. A 2A.4 nao reabre contratos de dados sem necessidade comprovada

- nenhum endpoint novo e obrigatorio nesta subetapa;
- additive backend changes so entram se forem necessarios para corrigir problema real encontrado no hardening;
- o default e resolver copy, hierarquia visual, estados e fallback no frontend oficial.

### 4.5. Rollout controlado depende de smoke final formal

- a 2A so e considerada pronta para substituicao controlada se passar no smoke definido neste documento;
- o smoke cobre desktop, mobile, dropdown, tabs, filtros, detalhe e mutacoes principais;
- falha de smoke nao cancela o baseline da 2A, mas bloqueia a promocao da rota oficial como fluxo principal.

---

## 5. Arquitetura da Solucao

### 5.1. Diagrama arquitetural

```text
User dropdown (Ferramentas)
  |
  +--> /gestao-de-chamados        [CTA primario da operacao]
  |
  +--> Atalhos legados temporarios
        +--> /requests
        +--> /me/tasks
        +--> /pilot/facilities (fora do dropdown, fallback operacional)

src/app/(app)/gestao-de-chamados/page.tsx
  |
  v
WorkflowManagementPage
  |
  +--> ManagementPageHeader
  +--> ManagementToolbar
  +--> ManagementAsyncState
  |       |
  |       +--> loading skeleton
  |       +--> error panel + retry
  |       +--> empty state contextual
  |
  +--> CurrentQueuePanel
  +--> AssignmentsPanel
  +--> CompletedPanel
  +--> RequestDetailDialog
  |
  +--> useWorkflowManagement()
          |
          +--> GET /api/workflows/read/management/bootstrap
          +--> GET /api/workflows/read/current
          +--> GET /api/workflows/read/assignments
          +--> GET /api/workflows/read/completed
          +--> GET /api/workflows/read/requests/[requestId]
          +--> POST runtime assign/finalize/archive

Read-side / runtime
  |
  +--> queries.ts + detail service + authz
  |
  v
Firestore
  - workflows_v2
  - workflowTypes_v2
  - workflowTypes_v2/{workflowTypeId}/versions/{version}
```

### 5.2. Fluxo por camadas

```text
LAYER 1 (Navigation / rollout)
1. O dropdown passa a promover /gestao-de-chamados como entrada oficial.
2. Os atalhos legados permanecem visiveis com rotulo de transicao.

LAYER 2 (Frontend hardening)
3. A pagina oficial padroniza loading, error, empty state e success state.
4. Filtros, tab ativa e request selecionado continuam serializados de forma segura na URL ou state local.
5. Mutacoes invalidam queries relevantes e preservam feedback claro de sucesso/falha.

LAYER 3 (Official read contracts)
6. Bootstrap e listas oficiais seguem os contratos herdados de 2A.1 a 2A.3.
7. Nenhum contrato novo e exigido para polimento, salvo ajuste aditivo justificado.

LAYER 4 (Verification / readiness)
8. Smoke final valida navegacao, filtros, dialog e fallback.
9. So apos smoke verde o dropdown troca a enfase para a rota oficial.
```

### 5.3. Estado gerenciado no frontend oficial

| Estado | Armazenamento | Lifecycle |
|-------|---------------|-----------|
| `activeTab` | URL search params | persiste em refresh e deep-link |
| `filters` | URL search params + parser canonico | muda por toolbar; reexecuta query da tab |
| `selectedRequestId` | `useState` local + query condicional | abre/fecha modal sem resetar a tela |
| `bootstrap` | React Query | carregado no mount; invalida raramente |
| `tab query state` | React Query | recarrega por tab/filtro/retry |
| `mutation pending state` | React Query mutation | controla botoes, toasts e re-fetch |
| `dropdown rollout state` | markup estatico + regras de permissao no shell | muda apenas quando o build da 2A.4 for promovido |

### 5.4. Diretrizes de acabamento visual

- header oficial com titulo, descricao curta e badges de contexto sem excesso de ruido;
- toolbar com agrupamento previsivel entre busca, filtros e acoes de limpar;
- skeletons coerentes com o layout final, nao blocos genericos desconectados da tela;
- empty states com diferenca clara entre `sem dados ainda`, `nenhum resultado para filtro` e `sem permissao/capability`;
- mensagens de erro com acao de retry e copy operacional curta;
- badges e labels dos cards alinhados com a linguagem do produto, sem misturar semantica do piloto no namespace oficial;
- modal de detalhe com hierarquia clara entre resumo, progresso, timeline, dados submetidos e acoes.

---

## 6. ADRs

### ADR-2A.4.1: O dropdown passa a ter uma unica entrada principal para a operacao

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-01 |
| Context | O estado atual expande varios atalhos concorrentes e prolonga a ambiguidade da transicao. |

**Choice:** promover `/gestao-de-chamados` como CTA principal e rebaixar `/requests` e `/me/tasks` para bloco legado temporario.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| Manter os tres links no mesmo nivel | preserva a confusao sobre qual e a superficie principal |
| Remover os legados imediatamente | aumenta risco operacional antes do smoke e do rollout controlado |

**Consequences:**

- cria um entrypoint oficial inequivoco;
- reduz disputa visual entre superficies;
- preserva fallback rapido se algum problema aparecer apos rollout.

### ADR-2A.4.2: Hardening usa primitives compartilhadas, nao regras espalhadas por tab

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-01 |
| Context | A 2A.4 precisa fechar arestas de UX sem virar uma colecao de condicionais ad hoc. |

**Choice:** concentrar loading, erro, vazio e retry em componentes/helpers reutilizaveis do namespace oficial.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| Ajustar cada tab manualmente | aumenta divergencia visual e custo de manutencao |
| Empurrar estados de UI para o backend | adiciona complexidade sem necessidade para um build de polimento |

**Consequences:**

- reduz regressao visual entre tabs e modal;
- facilita testes de rendering;
- mantem o polimento no frontend, onde o problema existe.

### ADR-2A.4.3: A 2A.4 e bloqueada se o baseline da 2A nao estiver materializado

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-01 |
| Context | O define da 2A.4 assume 2A.1 a 2A.3 entregues, mas o snapshot atual do repositorio ainda nao mostra esses artefatos. |

**Choice:** tratar a ausencia do baseline como bloqueio explicito de implementacao, nao como permissao para expandir escopo da 2A.4.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| Reimplementar 2A.1 a 2A.3 dentro da 2A.4 | mistura backlog estrutural com polimento e invalida o recorte da subetapa |
| Ignorar a divergencia entre docs e codigo | produz design irreal e rollout inseguro |

**Consequences:**

- mantem a fronteira de escopo defensavel;
- forca alinhamento entre branch, docs e build report;
- evita que a 2A.4 vire um build amorfo.

### ADR-2A.4.4: Readiness e um gate operacional, nao apenas uma impressao subjetiva

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-01 |
| Context | A 2A.4 precisa encerrar a macroetapa com criterio objetivo para rollout controlado. |

**Choice:** definir smoke final obrigatorio e checklist de readiness antes de promover a rota oficial no dropdown.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| Promover a rota oficial assim que o visual parecer pronto | nao protege contra falhas de navegacao, filtros ou modal |
| Exigir remocao dos legados antes da troca | conflita com o escopo deliberado de convivencia temporaria |

**Consequences:**

- torna a decisao de rollout auditavel;
- preserva fallback rapido;
- fecha a 2A com criterio claro para produto e engenharia.

---

## 7. File Manifest

### 7.1. Ordem de execucao

| Ordem | Escopo | Arquivos principais | Skill/Agente sugerido |
|------|--------|---------------------|-----------------------|
| 1 | Baseline check | [page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/gestao-de-chamados/page.tsx), [WorkflowManagementPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/WorkflowManagementPage.tsx), [api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/api-client.ts) | `build` |
| 2 | Navigation rollout | [AppLayout.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/layout/AppLayout.tsx) | `build` |
| 3 | Front polish | `src/components/workflows/management/*` | `build` |
| 4 | Test hardening | `src/components/workflows/management/__tests__/*`, `src/lib/workflows/management/__tests__/*` | `build` |
| 5 | Smoke and readiness | build report / checklist do rollout | `ship` |

### 7.2. Manifest detalhado

| # | Caminho | Acao | Responsabilidade | Skill/Agente sugerido | Depends On |
|---|---------|------|------------------|-----------------------|------------|
| 1 | [page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/gestao-de-chamados/page.tsx) | Update or Create | Garantir o shell final da rota oficial e hooks de URL/state coerentes com o polimento | `build` | baseline |
| 2 | [WorkflowManagementPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/WorkflowManagementPage.tsx) | Update or Create | Aplicar acabamento visual final, tab orchestration e estados compartilhados | `build` | #1 |
| 3 | [ManagementToolbar.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/ManagementToolbar.tsx) | Update or Create | Consolidar busca, filtros, copy e reset actions | `build` | #2 |
| 4 | [ManagementAsyncState.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/ManagementAsyncState.tsx) | Create | Reutilizar loading/error/empty state entre tabs e detalhe | `build` | #2 |
| 5 | [RequestDetailDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestDetailDialog.tsx) | Update or Create | Refinar modal oficial, falha de detalhe e feedbacks de mutacao | `build` | #2 |
| 6 | [AppLayout.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/layout/AppLayout.tsx) | Update | Promover a rota oficial e reorganizar o bloco legado no dropdown | `build` | #1 |
| 7 | [presentation.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/presentation.ts) | Update or Create | Encapsular labels de empty/error state, badges e copy operacional | `build` | #2 |
| 8 | [use-workflow-management.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-workflow-management.ts) | Update or Create | Garantir retry, invalidacao e estados derivados consistentes | `build` | #2 |
| 9 | [WorkflowManagementPage.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx) | Create | Cobrir loading, erro, vazio, dados e troca de tabs | `build` | #2 |
| 10 | [RequestDetailDialog.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx) | Create | Cobrir estados do modal, retry e acoes operacionais | `build` | #5 |
| 11 | [AppLayout.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/layout/__tests__/AppLayout.test.tsx) | Update or Create | Validar CTA oficial e agrupamento legado no dropdown | `build` | #6 |

Observacao:

- os arquivos marcados como `Update or Create` existem no baseline esperado da 2A, mas nao aparecem no snapshot atual do repositorio;
- se continuarem ausentes no branch de build, a 2A.4 deve registrar bloqueio antes de qualquer implementacao parcial.

---

## 8. Contratos e Patterns

### 8.1. Nenhum contrato novo obrigatorio

A 2A.4 consome os contratos definidos na 2A:

- `GET /api/workflows/read/management/bootstrap`
- `GET /api/workflows/read/current`
- `GET /api/workflows/read/assignments`
- `GET /api/workflows/read/completed`
- `GET /api/workflows/read/requests/[requestId]`
- `POST /api/workflows/runtime/requests/[id]/assign`
- `POST /api/workflows/runtime/requests/[id]/finalize`
- `POST /api/workflows/runtime/requests/[id]/archive`

Qualquer ajuste backend nesta subetapa deve obedecer a tres regras:

- ser aditivo;
- nao quebrar o piloto nem os contratos do baseline;
- nascer de problema concreto encontrado durante o hardening.

### 8.2. Pattern 1: Primitive compartilhada de async state

```tsx
// src/components/workflows/management/ManagementAsyncState.tsx
'use client';

type ManagementAsyncStateProps = {
  isLoading: boolean;
  errorMessage?: string;
  isEmpty: boolean;
  emptyTitle: string;
  emptyDescription: string;
  onRetry?: () => void;
  children: React.ReactNode;
};

export function ManagementAsyncState({
  isLoading,
  errorMessage,
  isEmpty,
  emptyTitle,
  emptyDescription,
  onRetry,
  children,
}: ManagementAsyncStateProps) {
  if (isLoading) {
    return <ManagementPanelSkeleton />;
  }

  if (errorMessage) {
    return <ManagementErrorState message={errorMessage} onRetry={onRetry} />;
  }

  if (isEmpty) {
    return <ManagementEmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return <>{children}</>;
}
```

### 8.3. Pattern 2: CTA oficial + legado temporario no dropdown

```tsx
// src/components/layout/AppLayout.tsx
const canAccessOfficialManagement = permissions.canManageRequests || permissions.canViewTasks;

{canAccessOfficialManagement ? (
  <DropdownMenuItem asChild>
    <Link
      href="/gestao-de-chamados"
      className={cn(
        "cursor-pointer font-body",
        hasPendingRequestsOrTasks && "bg-admin-primary/10 text-admin-primary font-bold hover:!bg-admin-primary/20",
      )}
    >
      <ListTodo className="mr-2 h-4 w-4" />
      <span>Gestao de chamados</span>
    </Link>
  </DropdownMenuItem>
) : null}

{showLegacyWorkflowLinks ? (
  <>
    <DropdownMenuSeparator />
    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
      Atalhos legados durante transicao
    </DropdownMenuLabel>
    {/* /requests e /me/tasks permanecem acessiveis, sem competir como CTA primario */}
  </>
) : null}
```

### 8.4. Pattern 3: Empty state contextual por causa real

```ts
// src/lib/workflows/management/presentation.ts
export function getManagementEmptyStateCopy(input: {
  activeTab: 'current' | 'assignments' | 'completed';
  hasActiveFilters: boolean;
  canViewTab: boolean;
}) {
  if (!input.canViewTab) {
    return {
      title: 'Aba indisponivel para este usuario',
      description: 'Esta visao nao aparece para o seu escopo operacional atual.',
    };
  }

  if (input.hasActiveFilters) {
    return {
      title: 'Nenhum resultado para os filtros aplicados',
      description: 'Ajuste ou limpe os filtros para ampliar a busca.',
    };
  }

  return {
    title: 'Nenhum chamado nesta visao',
    description: 'Quando surgirem itens neste escopo, eles aparecerao aqui.',
  };
}
```

### 8.5. Pattern 4: Retry local sem resetar a pagina inteira

```ts
// src/hooks/use-workflow-management.ts
function refetchActiveTab(activeTab: ManagementTab) {
  if (activeTab === 'current') return currentQuery.refetch();
  if (activeTab === 'assignments') return assignmentsQuery.refetch();
  if (activeTab === 'completed') return completedQuery.refetch();
  return Promise.resolve();
}
```

---

## 9. API Contract

### 9.1. Contratos obrigatorios preservados

Nenhum endpoint novo ou alteracao breaking e exigido pela 2A.4.

Os contratos herdados de 2A.1 a 2A.3 continuam validos e suficientes para:

- renderizacao das tabs oficiais;
- carregamento do detalhe rico;
- execucao de assign/finalize/archive;
- suporte ao smoke final.

### 9.2. Ajustes aditivos opcionais

Se a implementacao encontrar problema real que nao possa ser resolvido no frontend, sao permitidos ajustes aditivos em contratos existentes, desde que:

- nao alterem envelopes `ok/data`;
- nao removam campos esperados pelo piloto;
- sejam documentados no build report com antes/depois.

---

## 10. Database Schema

### 10.1. Mudancas obrigatorias de schema

Nenhuma.

### 10.2. Persistencia e rollout

- a 2A.4 nao cria colecoes novas;
- a 2A.4 nao exige migracao de `workflows_v2`;
- o rollout e puramente de frontend/navegacao e, por isso, reversivel sem rollback de dados.

---

## 11. Testing Strategy

### 11.1. Unit tests

| Alvo | Teste |
|------|-------|
| `presentation.ts` | diferenciar empty states por permissao, filtro ativo e ausencia real de dados |
| helpers de dropdown | promover CTA oficial apenas para usuarios com permissao minima |
| hook oficial | refetch da aba ativa e invalidacao apos mutacoes |

### 11.2. Component tests

| Componente | Teste |
|-----------|-------|
| `WorkflowManagementPage` | renderiza skeleton, erro, vazio e dados sem divergencia entre tabs |
| `ManagementToolbar` | aplica e limpa filtros preservando URL state |
| `RequestDetailDialog` | lida com loading, falha de detalhe, sucesso e disable states de mutacao |
| `AppLayout` | mostra `Gestao de chamados` como CTA primario e agrupa legados sob rotulo de transicao |

### 11.3. Integration tests

| Fluxo | Teste |
|------|------|
| dropdown -> rota oficial | usuario com permissao operacional navega para `/gestao-de-chamados` |
| filtros + tab | mudar filtro recarrega apenas a query relevante e preserva shareable URL |
| mutacao + invalidate | assign/finalize/archive atualizam listas e detalhe sem stale UI |
| fallback | erro no detalhe nao desmonta a tela inteira nem perde tab/filtro ativo |

### 11.4. Smoke final da 2A

O smoke de readiness deve validar no minimo:

1. entrada por dropdown abre `/gestao-de-chamados` com o item oficial destacado;
2. tabs oficiais carregam com loading, sucesso e empty state coerentes;
3. filtros e busca atualizam URL e sobrevivem a refresh;
4. abrir um request mostra detalhe rico sem quebrar quando a query falha e reexecuta com retry;
5. assign, finalize e archive mostram feedback e atualizam a UI;
6. links legados continuam acessiveis durante a transicao;
7. layout funciona em desktop e mobile sem overflow critico.

### 11.5. Acceptance checks

```gherkin
GIVEN um usuario com acesso operacional
WHEN ele abre o menu de ferramentas
THEN Gestao de chamados aparece como entrada principal

GIVEN um usuario na tela oficial com filtros ativos
WHEN ele atualiza a pagina
THEN a aba e os filtros continuam restaurados pela URL

GIVEN falha temporaria ao carregar o detalhe de um chamado
WHEN o usuario usa retry
THEN o restante da pagina continua funcional e o detalhe pode ser carregado novamente
```

---

## 12. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | Rebaixar ou remover o link `/gestao-de-chamados` do dropdown | menu volta a priorizar `/requests` e `/me/tasks` |
| 2 | Restaurar destaque visual das entradas legadas | operacao volta ao fluxo anterior sem perda de dados |
| 3 | Manter a rota oficial acessivel apenas por URL direta, se necessario para diagnostico | engenharia consegue reproduzir o problema sem expor o CTA principal |
| 4 | Reverter o commit de polimento/hardening | smoke dos fluxos legados volta a passar |

Metodo rapido:

- `git revert <commit-da-2A4>`

Como nao ha mudanca de schema:

- nao existe rollback de banco;
- nao existe migracao reversa;
- o risco esta concentrado em UX, navegacao e renderizacao.

---

## 13. Implementation Checklist

### Pre-Build

- [ ] `DEFINE_FASE2A_4_POLIMENTO_ROLLOUT.md` aprovado
- [ ] baseline de 2A.1 a 2A.3 presente no branch alvo
- [ ] decisao de convivencia no dropdown aceita por produto/operacao
- [ ] manifesto de arquivos revisado
- [ ] smoke checklist combinado antes do build

### Post-Build

- [ ] rota oficial renderiza com estados compartilhados de loading/error/empty
- [ ] dropdown promove `Gestao de chamados` e mantem legados como transicao
- [ ] tabs, filtros e modal resistem a refresh e falha parcial
- [ ] smoke final da 2A executado e registrado
- [ ] riscos remanescentes documentados no report

---

## 14. Specialist Instructions

### Para `build`

Arquivos focais:

- `src/app/(app)/gestao-de-chamados/page.tsx`
- `src/components/workflows/management/*`
- `src/lib/workflows/management/*`
- `src/hooks/use-workflow-management.ts`
- `src/components/layout/AppLayout.tsx`

Requisitos chave:

- nao reabrir backlog estrutural da 2A;
- usar primitives compartilhadas para estados async;
- manter legados acessiveis durante a transicao;
- registrar bloqueio se o baseline oficial ainda nao existir.

### Para `ship`

Artefatos focais:

- report de build da 2A.4
- checklist de smoke final
- registro de riscos remanescentes e recomendacao de rollout

Requisitos chave:

- declarar explicitamente se a 2A esta pronta para substituicao controlada;
- listar qualquer gap que impeça promover o CTA oficial;
- separar bug residual de backlog estrutural.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-01 | Codex (`design` skill) | Initial design for Fase 2A.4 based on DEFINE and current repository snapshot |
