# DESIGN: Ajustes UI/UX operacionais em `/gestao-de-chamados`

> Generated: 2026-04-16
> Status: Ready for build
> Source: `DEFINE_AJUSTES_UI_UX_GESTAO_DE_CHAMADOS_OPERACIONAL.md`
> Depends on: `DESIGN_AJUSTES_UI_UX_ADMIN_REQUEST_CONFIG_CRITICOS.md`

## 1. Requirements Summary

### Problem

A superficie `/gestao-de-chamados` ja funciona como painel operacional oficial, mas o topo da pagina ainda mistura navegacao e filtro na mesma hierarquia visual e o painel `Atribuicoes e acoes` ainda exige subtabs para comparar duas filas que operam melhor lado a lado na mesma leitura.

### Success Criteria

| Criterion | Target |
|-----------|--------|
| Tabs principais com leitura canonica | `TabsList` ocupa a largura util da pagina e distribui igualmente as tabs visiveis |
| Filtro fora da navegacao | `ManagementToolbar` deixa de compartilhar a mesma linha das tabs principais |
| Aviso de ownership removido | zero renderizacoes da caixa textual antiga |
| Duas filas simultaneas em assignments | `Atribuidos a mim` e `Acoes pendentes para mim` aparecem juntas na mesma tela |
| Contrato de URL preservado | `tab`, `subtab`, `queue` e filtros continuam parseados/serializados sem regressao |
| Empty/loading/error por secao | cada fila comunica seu proprio estado, sem ambiguidade operacional |

### Constraints

- escopo estritamente frontend/UI, sem mudar hooks, queries, authz ou contratos de API;
- `subtab` permanece no search param por compatibilidade, mesmo sem dirigir mais a UI visivel;
- `ManagementToolbar` continua sendo o filtro global da rota;
- `CurrentQueuePanel`, `CompletedPanel` e `RequestDetailDialog` permanecem funcionalmente intactos;
- o design deve reaproveitar primitives existentes (`Card`, `Tabs`, `ManagementAsyncState`, `ManagementRequestList`) e o canon visual observado em `/me/tasks`.

## 2. Architecture

### Source of Truth

Este design foi elaborado a partir de:

- [DEFINE_AJUSTES_UI_UX_GESTAO_DE_CHAMADOS_OPERACIONAL.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_AJUSTES_UI_UX_GESTAO_DE_CHAMADOS_OPERACIONAL.md)
- [WorkflowManagementPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/WorkflowManagementPage.tsx)
- [AssignmentsPanel.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/AssignmentsPanel.tsx)
- [ManagementToolbar.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/ManagementToolbar.tsx)
- [ManagementAsyncState.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/ManagementAsyncState.tsx)
- [ManagementRequestList.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/ManagementRequestList.tsx)
- [search-params.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/search-params.ts)
- [page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/me/tasks/page.tsx)
- [WorkflowManagementPage.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx)

Em caso de divergencia:

1. prevalece o `DEFINE` para escopo e aceite;
2. prevalece o contrato atual de `search-params.ts` para compatibilidade de URL;
3. prevalece este design para orientar a implementacao do patch visual.

### System Diagram

```text
Authenticated operator
  |
  +--> /gestao-de-chamados
         |
         +--> WorkflowManagementPage
         |      |
         |      +--> PageHeader
         |      +--> Navigation shell
         |      |      \--> TabsList (full-width, equal distribution)
         |      +--> Content toolbar row
         |      |      \--> ManagementToolbar (same filter contract)
         |      +--> Active filter chips
         |      +--> CurrentQueuePanel (unchanged)
         |      +--> AssignmentsPanel (new dual-section composition)
         |      |      +--> AssignmentSection: pendingActionItems
         |      |      |      \--> ManagementAsyncState -> ManagementRequestList
         |      |      \--> AssignmentSection: assignedItems
         |      |             \--> ManagementAsyncState -> ManagementRequestList
         |      +--> CompletedPanel (unchanged)
         |      \--> RequestDetailDialog (unchanged)
         |
         \--> search-params.ts
                |- parse tab/subtab/queue/filters
                \- serialize same keys back to URL
```

### Data Flow

```text
LAYER 1 (Page shell)
1. WorkflowManagementPage continua lendo `rawState` de `parseManagementSearchParams(searchParams)`.
2. `visibleTabs` continua sendo derivado de `bootstrapQuery.data?.capabilities.canViewCurrentQueue`.
3. O topo da pagina passa a ter duas camadas: navegacao principal e toolbar/filtros.

LAYER 2 (Assignments composition)
4. AssignmentsPanel deixa de consumir `activeSubtab` como fonte de renderizacao exclusiva.
5. O componente passa a renderizar duas secoes independentes na mesma tela.
6. Cada secao recebe seu proprio slice de dados, copy de empty state e fallback de erro/loading.

LAYER 3 (URL compatibility)
7. `subtab` continua sendo parseado e serializado por `search-params.ts`.
8. A UI deixa de esconder secoes com base em `subtab`; no maximo usa o valor para ordernar, destacar ou manter compatibilidade com links antigos.
9. O handler de troca de tab principal segue usando `router.replace(..., { scroll: false })`.

LAYER 4 (Reusable presentation)
10. `ManagementAsyncState` continua sendo o wrapper oficial para loading/error/empty.
11. `ManagementRequestList` continua renderizando os cards/listas operacionais dentro de cada secao.
12. Nenhuma mudanca de shape e exigida em `WorkflowManagementAssignmentsData`.
```

### State Management

| State | Storage | Lifecycle |
|-------|---------|-----------|
| `activeTab` | search params | criado em `parseManagementSearchParams`; atualizado por `updateViewState`; preservado em reload/share link |
| `assignmentsSubtab` | search params | mantido por compatibilidade; deixa de controlar ocultacao das secoes |
| `currentFilter` | search params | inalterado; ainda usado apenas pela aba `current` |
| `filters` | search params + draft local do popover | continuam sendo aplicados globalmente a toda a rota |
| `selectedRequestId` | `useState` em `WorkflowManagementPage` | inalterado; abre/fecha `RequestDetailDialog` |
| `bootstrap/current/assignments/completed/detail` | React Query via `useWorkflowManagement` | inalterado; sem troca de contratos ou chaves |

### Planned UI Composition

#### 2.1. Shell superior

- manter `PageHeader` como abertura da rota;
- transformar o bloco superior em duas linhas claras:
  - linha 1: `TabsList` ocupando largura total com distribuicao uniforme entre tabs visiveis;
  - linha 2: `ManagementToolbar` alinhada como toolbar de conteudo, seguida dos chips ativos;
- remover completamente o aviso textual de ownership quando `canViewCurrentQueue === false`;
- continuar escondendo a tab `Chamados atuais` quando a capability nao existir.

#### 2.2. Assignments sem subtabs visiveis

- remover `Tabs`, `TabsList` e `TabsTrigger` internos de `AssignmentsPanel`;
- renderizar duas secoes sequenciais no mesmo `Card` ou em dois `Card`s empilhados, com padrao proximo ao `TasksTable` de `/me/tasks`;
- cada secao deve conter:
  - titulo;
  - descricao operacional curta;
  - estado `loading/error/empty` proprio;
  - lista via `ManagementRequestList` quando houver itens;
- ordem recomendada:
  - `Acoes pendentes para mim`;
  - `Atribuidos a mim`;
- se `assignmentsSubtab === 'assigned'`, a implementacao pode optar por inverter a ordem para preservar expectativa de links antigos. Se essa inversao aumentar complexidade, manter ordem fixa tambem atende ao define porque o parametro deve ser apenas compativel, nao controlador.

#### 2.3. Empty states

- com filtros ativos, cada secao usa copy coerente com o recorte filtrado, sem texto generico da tela inteira;
- sem filtros:
  - `Acoes pendentes para mim`: foco em aprovacoes/ciencias/execucoes aguardando resposta;
  - `Atribuidos a mim`: foco em itens atribuidos ao usuario para processamento;
- `errorMessage` pode continuar compartilhado entre as duas secoes no primeiro patch, pois o hook retorna um unico estado para assignments. O importante e a apresentacao ficar localizada por secao.

## 3. Architecture Decisions

### ADR-001: Preservar `subtab` na URL, mas remover subtabs da UI

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-16 |
| **Context** | O define exige comparacao simultanea das duas filas e, ao mesmo tempo, proibe regressao no contrato de URL atual. |

**Choice:** manter `assignmentsSubtab` em `WorkflowManagementViewState` e em `search-params.ts`, mas parar de usalo como chave de renderizacao exclusiva do painel.

**Rationale:**
1. elimina a friccao operacional de alternar subtabs;
2. preserva bookmarks, links compartilhados e parsing existente;
3. evita mexer no hook de dados e em codigo fora da camada visual.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| remover `subtab` de `search-params.ts` | quebra compatibilidade sem necessidade funcional |
| manter subtabs e apenas duplicar resumo da outra fila | conserva a principal friccao da tela |

**Consequences:**
- positivo: build menor e rollback simples;
- negativo: `subtab` passa a ser um parametro legado/comportamentalmente fraco.

### ADR-002: Separar shell de navegacao e toolbar de filtro

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-16 |
| **Context** | Hoje `TabsList` e `ManagementToolbar` competem na mesma linha e fazem a navegacao principal parecer toolbar compacta. |

**Choice:** mover `ManagementToolbar` para uma linha de conteudo abaixo da navegacao principal e expandir `TabsList` para largura total com distribuicao igualitaria.

**Rationale:**
1. restabelece hierarquia visual canonica de pagina;
2. melhora leitura em desktop e responsividade sem mudar o componente de filtro;
3. reduz risco porque o popover e callbacks permanecem identicos.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| manter tudo na mesma linha com ajustes cosmeticos menores | nao resolve a ambiguidade entre navegacao e acao/filtro |
| substituir tabs por botoes simples | quebra o padrao canônico ja adotado na superficie |

**Consequences:**
- positivo: melhor legibilidade do topo da tela;
- positivo: testes ficam mais objetivos por estrutura;
- negativo: demanda pequenos ajustes de classes responsivas.

### ADR-003: Reusar `ManagementAsyncState` por secao em vez de criar runtime novo

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-16 |
| **Context** | O painel de assignments passara a mostrar duas filas independentes, mas o hook ainda fornece um unico envelope de `isLoading` e `error`. |

**Choice:** manter o hook como esta e reutilizar `ManagementAsyncState` duas vezes, uma para cada secao, com copy e lista proprias.

**Rationale:**
1. resolve a UX sem abrir refactor de dados;
2. reaproveita o wrapper oficial de estados assincronos;
3. mantem a iteracao estritamente visual.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| dividir `assignmentsQuery` em duas queries independentes | amplia escopo para hook, cache e testes de dados |
| criar um novo wrapper assíncrono especifico para assignments | duplicaria padrao ja presente no dominio |

**Consequences:**
- positivo: menor custo de implementacao;
- negativo: loading e erro ainda nascem de uma unica query, nao de duas fontes realmente independentes.

## 4. File Manifest

### Execution Order

| Phase | Files | Agent |
|-------|-------|-------|
| 1. Page shell | `WorkflowManagementPage.tsx` | @react-frontend-developer |
| 2. Assignments layout | `AssignmentsPanel.tsx`, possivel novo helper visual | @react-frontend-developer |
| 3. Contract safety | `search-params.ts`, possivel extensao de testes | @react-frontend-developer |
| 4. Validation | `WorkflowManagementPage.test.tsx`, novo `AssignmentsPanel.test.tsx` | @react-frontend-developer |

### Detailed Manifest

| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | `src/components/workflows/management/WorkflowManagementPage.tsx` | Modify | separar tabs e toolbar em camadas distintas, remover aviso de ownership e preservar wiring de URL/query | @react-frontend-developer | - |
| 2 | `src/components/workflows/management/AssignmentsPanel.tsx` | Modify | trocar subtabs por duas secoes simultaneas com estados independentes de apresentacao | @react-frontend-developer | #1 |
| 3 | `src/components/workflows/management/ManagementToolbar.tsx` | Reuse or minor modify | manter contrato do filtro global e ajustar apenas encaixe visual se necessario | @react-frontend-developer | #1 |
| 4 | `src/components/workflows/management/ManagementAsyncState.tsx` | Reuse | prover loading/error/empty por secao sem novo runtime | @react-frontend-developer | #2 |
| 5 | `src/components/workflows/management/ManagementRequestList.tsx` | Reuse | continuar renderizando as filas operacionais | @react-frontend-developer | #2 |
| 6 | `src/lib/workflows/management/search-params.ts` | Preserve or minor test-only touch | manter `subtab` parseado/serializado por compatibilidade | @react-frontend-developer | - |
| 7 | `src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx` | Modify | validar tabs full-width, toolbar fora da navegacao e ausencia do aviso textual | @react-frontend-developer | #1 |
| 8 | `src/components/workflows/management/__tests__/AssignmentsPanel.test.tsx` | Create | validar renderizacao simultanea, empty states separados e compatibilidade basica com `subtab` legado via props | @react-frontend-developer | #2 |
| 9 | `src/lib/workflows/management/__tests__/search-params.test.ts` | Create or Modify | garantir que `subtab` continua sendo aceito/serializado | @react-frontend-developer | #6 |

## 5. Code Patterns

### Pattern 1: Full-width page tabs with content toolbar below

```tsx
const tabsGridClassName =
  visibleTabs.length === 2 ? 'grid-cols-2' : 'grid-cols-3';

<section className="space-y-4 rounded-2xl border border-border/70 bg-background/95 p-4 shadow-sm">
  <Tabs
    value={viewState.activeTab}
    onValueChange={(value) => updateViewState({ activeTab: value as ManagementTabId })}
    className="space-y-0"
  >
    <TabsList
      className={cn(
        'grid h-auto w-full rounded-xl bg-muted/70 p-1',
        tabsGridClassName,
      )}
    >
      {visibleTabs.map((tab) => (
        <TabsTrigger key={tab.tab} value={tab.tab} className="min-w-0 px-4 py-2 text-center">
          {tab.title}
        </TabsTrigger>
      ))}
    </TabsList>
  </Tabs>

  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <p className="text-sm text-muted-foreground">
      Filtre o recorte operacional sem competir com a navegacao principal.
    </p>
    <ManagementToolbar
      bootstrap={bootstrapQuery.data}
      filters={viewState.filters}
      onApplyFilters={(filters) => updateViewState({ filters })}
      onResetFilters={() => updateViewState({ filters: {} })}
    />
  </div>

  {activeFilterChips.length > 0 ? <ActiveFilterChips ... /> : null}
</section>
```

Notas:

- a quantidade de colunas deve ser obrigatoriamente derivada de `visibleTabs.length`;
- quando houver apenas duas tabs visiveis, a grade deve ser `grid-cols-2` em todos os breakpoints relevantes;
- quando houver tres tabs visiveis, a grade deve ser `grid-cols-3`;
- nao e aceitavel deixar coluna vazia em desktop por uso literal de `md:grid-cols-3` quando `Chamados atuais` estiver oculto;
- o texto auxiliar acima do filtro e opcional. O requisito principal e a separacao hierarquica.

### Pattern 2: Assignment section wrapper

```tsx
type AssignmentSectionProps = {
  title: string;
  description: string;
  items: WorkflowManagementRequestSummary[];
  isLoading: boolean;
  errorMessage?: string;
  emptyTitle: string;
  emptyDescription: string;
  onRetry?: () => void;
  onOpenRequest: (requestId: number) => void;
};

function AssignmentSection({
  title,
  description,
  items,
  isLoading,
  errorMessage,
  emptyTitle,
  emptyDescription,
  onRetry,
  onOpenRequest,
}: AssignmentSectionProps) {
  return (
    <section className="space-y-4 rounded-xl border border-border/70 bg-background p-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <ManagementAsyncState
        isLoading={isLoading}
        errorMessage={errorMessage}
        errorTitle={`Falha em ${title.toLowerCase()}`}
        isEmpty={items.length === 0}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        onRetry={onRetry}
      >
        <ManagementRequestList items={items} onOpenRequest={onOpenRequest} />
      </ManagementAsyncState>
    </section>
  );
}
```

### Pattern 3: Legacy-compatible assignments panel

```tsx
const orderedSections =
  activeSubtab === 'assigned'
    ? [assignedSection, pendingSection]
    : [pendingSection, assignedSection];

return (
  <Card className="border-border/70">
    <CardHeader className="space-y-1">
      <CardTitle>Atribuicoes e acoes</CardTitle>
      <p className="text-sm text-muted-foreground">
        Leitura simultanea das filas operacionais mais consultadas pelo ator.
      </p>
    </CardHeader>

    <CardContent className="space-y-4">
      {orderedSections.map((section) => (
        <AssignmentSection key={section.key} {...section} />
      ))}
    </CardContent>
  </Card>
);
```

## 6. API Contract

Nenhum endpoint novo ou alterado.

Continuam inalterados:

- hooks e queries internas de `useWorkflowManagement`;
- callbacks de mutacao do `RequestDetailDialog`;
- shape de `WorkflowManagementAssignmentsData`;
- parametros de URL `tab`, `subtab`, `queue`, `requestId`, `workflow`, `area`, `requester`, `sla`, `from`, `to`.

## 7. Database Schema

Nenhuma mudanca no schema.

## 8. Testing Strategy

### Unit / Component Tests

| Component | Test |
|-----------|------|
| `WorkflowManagementPage` | renderiza `TabsList` sem o aviso textual de ownership e com `ManagementToolbar` fora do container da navegacao principal |
| `WorkflowManagementPage` | ao trocar de tab principal, continua serializando `tab` na URL com `router.replace(..., { scroll: false })` |
| `WorkflowManagementPage` | ao iniciar com `subtab=pending`, a tela nao quebra e continua aceitando filtros/URL legacy |
| `AssignmentsPanel` | renderiza simultaneamente `Acoes pendentes para mim` e `Atribuidos a mim` |
| `AssignmentsPanel` | mostra empty state especifico para cada secao sem filtros |
| `AssignmentsPanel` | mostra copy coerente quando ha filtros ativos e a lista da secao esta vazia |
| `search-params.ts` | continua parseando e serializando `subtab` mesmo sem ele dirigir a UI |

### Integration Tests

| Flow | Test |
|------|------|
| bootstrap sem ownership | `Chamados atuais` continua oculto, mas a tela nao exibe mais o aviso textual antigo |
| filtro global + assignments | filtro aplicado continua afetando a rota inteira e os chips seguem sincronizados com a URL |
| assignments com erro | retry local continua acionando `refetchActiveTab` |

### Acceptance Tests

```gherkin
GIVEN um usuario com acesso a `/gestao-de-chamados`
WHEN a pagina abre na aba `Atribuicoes e acoes`
THEN ele ve as filas `Acoes pendentes para mim` e `Atribuidos a mim` simultaneamente

GIVEN um link legado com `?tab=assignments&subtab=pending`
WHEN a rota e carregada
THEN a pagina continua funcional e o contrato de URL permanece valido

GIVEN um usuario sem capability para `Chamados atuais`
WHEN a tela e renderizada
THEN a tab `Chamados atuais` nao aparece e nenhum aviso textual de ownership e mostrado
```

## 9. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | reverter o patch dos componentes `WorkflowManagementPage.tsx` e `AssignmentsPanel.tsx` | tabs e subtabs voltam ao layout anterior |
| 2 | reverter os testes adicionados/alterados | suite volta a refletir o comportamento antigo |
| 3 | validar manualmente `/gestao-de-chamados` com e sem ownership | pagina volta a exibir o shell previo sem quebrar URL |

**Metodo rapido:** `git revert <commit-do-build>`

## 10. Implementation Checklist

### Pre-Build

- [x] DEFINE aprovado para /design
- [x] decisoes arquiteturais registradas
- [x] file manifest fechado
- [x] contrato de URL revisado no codigo real
- [x] referencias visuais existentes (`/me/tasks` e `ManagementToolbar`) inspecionadas

### Post-Build

- [ ] tabs principais ocupam largura total e deixam de competir com o filtro
- [ ] aviso textual de ownership removido
- [ ] subtabs visiveis de assignments removidas
- [ ] duas filas renderizadas simultaneamente com estados proprios
- [ ] `subtab` continua parseado/serializado em testes
- [ ] testes do dominio passam

## 11. Specialist Instructions

### For @react-frontend-developer

```markdown
Files to modify:
- src/components/workflows/management/WorkflowManagementPage.tsx
- src/components/workflows/management/AssignmentsPanel.tsx
- src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx
- src/components/workflows/management/__tests__/AssignmentsPanel.test.tsx
- src/lib/workflows/management/__tests__/search-params.test.ts

Key requirements:
- preservar integralmente o contrato atual de URL
- nao alterar `useWorkflowManagement` nem queries
- remover subtabs visiveis sem perder compatibilidade com `subtab`
- manter `ManagementToolbar` como filtro global, apenas reposicionado
- seguir primitives e tokens visuais ja existentes no dominio
```

### For @firebase-specialist

```markdown
No action.

Reason:
- nao ha mudancas de backend, schema, regras ou persistencia nesta iteracao
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-16 | Codex (`design` skill) | Especificacao tecnica para patch UI/UX operacional de `/gestao-de-chamados`, com tabs full-width, toolbar desacoplada e assignments simultaneos |
