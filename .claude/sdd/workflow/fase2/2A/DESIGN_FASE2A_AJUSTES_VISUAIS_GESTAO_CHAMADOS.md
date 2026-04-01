# DESIGN: FASE 2A - Ajustes Visuais da Tela de Gestao de Chamados

> Generated: 2026-04-01
> Status: Ready for build
> Scope: Fase 2 / 2A - rodada de ajustes visuais e refinamentos leves de UX na tela oficial `/gestao-de-chamados`
> Base document: `DEFINE_FASE2A_AJUSTES_VISUAIS_GESTAO_CHAMADOS.md`

## 1. Objetivo

Aplicar uma rodada curta de polish na tela oficial `/gestao-de-chamados`, removendo ruido visual herdado da transicao da 2A, aproximando tabs e filtros em uma unica zona de navegacao e reorganizando a aba `Concluidas` para leitura mensal em sanfona.

Esta etapa cobre:

- limpeza do shell visual da `WorkflowManagementPage`;
- substituicao da toolbar inline por um trigger minimalista com painel de filtros e confirmacao explicita;
- exibicao discreta de filtros ativos;
- reestruturacao da aba `Concluidas` em accordion mensal;
- uso consistente do token `admin-primary` nos highlights e CTAs internos desta rodada;
- atualizacao de testes do frontend oficial para cobrir o novo contrato visual.

Esta etapa nao cobre:

- novos endpoints, filtros ou contratos de backend;
- alteracao de auth, ownership ou gates de capability;
- redesign estrutural da pagina, das tabs principais ou do modal de detalhe;
- mudancas de schema em Firestore;
- remocao de rotas legadas ou rollout do dropdown fora do que ja esta no codigo.

---

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_FASE2A_AJUSTES_VISUAIS_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/2A/DEFINE_FASE2A_AJUSTES_VISUAIS_GESTAO_CHAMADOS.md)
- [BRAINSTORM_FASE2A_AJUSTES_VISUAIS_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/2A/BRAINSTORM_FASE2A_AJUSTES_VISUAIS_GESTAO_CHAMADOS.md)
- [DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2A_FRONT_OFICIAL_TELA_INTEGRADA.md)
- [WorkflowManagementPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/WorkflowManagementPage.tsx)
- [ManagementToolbar.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/ManagementToolbar.tsx)
- [CompletedPanel.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/CompletedPanel.tsx)
- [ManagementRequestList.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/ManagementRequestList.tsx)
- [presentation.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/presentation.ts)
- [constants.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/constants.ts)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/types.ts)
- [popover.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/ui/popover.tsx)
- [accordion.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/ui/accordion.tsx)
- [globals.css](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/globals.css)

Em caso de divergencia:

1. prevalece o `DEFINE_FASE2A_AJUSTES_VISUAIS_GESTAO_CHAMADOS.md` para escopo e aceite;
2. depois prevalece o design macro da 2A para contratos, namespace e limites estruturais;
3. depois prevalece este documento para orientar o build desta rodada visual;
4. o codigo real do repositorio prevalece sobre premissas nao materializadas.

---

## 3. Estado Atual Relevante

### 3.1. O que existe hoje no codigo

- [WorkflowManagementPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/WorkflowManagementPage.tsx) ja controla URL state, gating da aba `Chamados atuais`, tabs principais, dialog de detalhe e mutacoes;
- o shell ainda renderiza um `Card` de transicao com badges de fase, status de URL e copy de convivencia com legados;
- [ManagementToolbar.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/ManagementToolbar.tsx) ainda ocupa um card inteiro acima das tabs, com inputs sempre expostos;
- [CompletedPanel.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/CompletedPanel.tsx) ja recebe `groups`, mas renderiza cada mes como card expandido;
- [presentation.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/presentation.ts) ja possui helpers de mes, SLA, empty state e deteccao de filtros ativos;
- o token `--admin-primary` ja existe em [globals.css](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/globals.css) e ja e usado em outras superficies do produto;
- o projeto ja possui primitives compartilhadas para `Popover` e `Accordion`.

### 3.2. O que esta desalinhado com o DEFINE

- o shell comunica rollout e telemetria visual em vez de foco operacional;
- tabs e filtros ainda parecem blocos independentes;
- filtros ativos aparecem como badge generica no header, sem detalhe util e sem discricao adequada;
- a aba `Concluidas` cresce em altura linear, mesmo com agrupamento mensal disponivel no payload;
- a cor de destaque ainda depende mais do variant default do que do token `admin-primary` explicitamente pedido nesta rodada.

### 3.3. Restricao de escopo tecnico

- [use-workflow-management.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-workflow-management.ts) nao precisa mudar de contrato;
- nenhuma mudanca e necessaria em `api-client`, query keys, read-side ou runtime;
- o build deve ser resolvido dentro do namespace `src/components/workflows/management/*` e de helpers de apresentacao associados.

---

## 4. Decisoes Fechadas da Rodada

### 4.1. O shell deixa de expor o callout de transicao

- o `Card` de transicao com `Fase 2A.4`, status de URL e copy sobre legados sai da experiencia principal;
- o `PageHeader` permanece como cabecalho oficial e, nesta rodada, deixa de exibir badges de ator/filtros/ownership;
- o aviso de gate para quem nao ve `Chamados atuais` continua existindo, porem como aviso contextual discreto perto da area de tabs, nao como telemetria do shell.

### 4.2. Tabs e filtros passam a compartilhar a mesma zona visual

- [WorkflowManagementPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/WorkflowManagementPage.tsx) passa a renderizar um bloco unico de navegacao/controle;
- `TabsList` fica alinhada ao trigger de filtros na mesma faixa visual;
- em mobile, a composicao empilha verticalmente, mantendo tabs primeiro e trigger logo abaixo;
- `ManagementToolbar` deixa de ser um card de largura total e passa a ser o controle de filtro dessa faixa.

### 4.3. O filtro usa trigger minimalista + painel com confirmacao explicita

- [ManagementToolbar.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/ManagementToolbar.tsx) passa a usar [popover.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/ui/popover.tsx) como primitive principal;
- o trigger exibe label curta, contador de filtros ativos e estado visual destacado em `admin-primary` quando houver filtro aplicado;
- o formulario continua operando com `draft state` local e so propaga para URL/query quando o usuario confirmar;
- o CTA de confirmacao continua obrigatorio;
- `Limpar` permanece disponivel dentro do painel e, quando houver filtros ativos, tambem pode existir como acao secundaria discreta ao lado dos chips.

### 4.4. Filtros ativos passam a ser discretos, legiveis e uteis

- o header deixa de exibir apenas `Filtros ativos`/`Sem filtros ativos`;
- o controle passa a mostrar chips compactos com o resumo dos filtros ativos logo abaixo ou ao lado do trigger, na mesma zona das tabs;
- cada chip mostra label curta de negocio, por exemplo `Solicitante: Alice`, `SLA: Em risco`, `De: 01/03/2026`;
- chips nao devem competir com tabs nem virar um segundo painel de busca permanente;
- o payload de filtros continua o mesmo; muda apenas a apresentacao.

### 4.5. `Concluidas` vira accordion mensal com mes mais recente aberto

- [CompletedPanel.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/CompletedPanel.tsx) passa a usar [accordion.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/ui/accordion.tsx);
- os grupos sao ordenados localmente do mes mais recente para o mais antigo;
- `unknown` ou chaves invalidas ficam por ultimo;
- o accordion abre por padrao o primeiro grupo ordenado;
- o trigger de cada mes mostra nome formatado e contagem de itens;
- o conteudo reaproveita [ManagementRequestList.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/ManagementRequestList.tsx), sem reescrever a listagem base.

### 4.6. Nenhum contrato funcional muda

- `parseManagementSearchParams` e `serializeManagementSearchParams` permanecem canonicos;
- `useWorkflowManagement` continua sendo o unico orquestrador de bootstrap, listas, detalhe e mutacoes;
- auth, capabilities, invalidacao de query, modal de detalhe e runtime nao mudam nesta rodada.

---

## 5. Arquitetura da Solucao

### 5.1. Diagrama arquitetural

```text
src/app/(app)/gestao-de-chamados/page.tsx
  |
  v
WorkflowManagementPage
  |
  +--> PageHeader
  |
  +--> ManagementControlsShell (zona inline em WorkflowManagementPage, nao novo arquivo)
  |       |
  |       +--> TabsList (tabs principais)
  |       +--> ManagementToolbar (trigger + popover)
  |       +--> ActiveFilterChips (render inline em WorkflowManagementPage, nao novo arquivo)
  |
  +--> CurrentQueuePanel / AssignmentsPanel / CompletedPanel
  |                                      |
  |                                      +--> Accordion mensal
  |                                              |
  |                                              +--> ManagementRequestList
  |
  +--> RequestDetailDialog
  |
  +--> useWorkflowManagement(viewState, selectedRequestId)
          |
          +--> bootstrap / current / assignments / completed / detail
          +--> mutations assign / finalize / archive
```

### 5.2. Fluxo por camadas

```text
LAYER 1 (Shell / visual hierarchy)
1. WorkflowManagementPage remove o card de transicao.
2. Header fica mais limpo e passa o foco para navegacao e estado operacional util.

LAYER 2 (Controls zone)
3. Tabs e trigger de filtro convivem no mesmo bloco visual.
4. O trigger abre um popover com draft state local.
5. Somente "Aplicar filtros" serializa o estado na URL.

LAYER 3 (Presentation helpers)
6. presentation.ts deriva resumo legivel dos filtros ativos.
7. CompletedPanel ordena e formata grupos mensais para accordion.

LAYER 4 (Data / orchestration)
8. useWorkflowManagement continua recebendo o mesmo viewState.
9. React Query continua sendo invalidado pelas mutacoes sem mudanca de contrato.
```

Nota de implementacao:

- `ManagementControlsShell` e `ActiveFilterChips` sao nomes conceituais para a zona visual de controles;
- esta rodada nao deve criar `ManagementControlsShell.tsx` nem `ActiveFilterChips.tsx`;
- tabs, trigger e chips permanecem renderizados inline em [WorkflowManagementPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/WorkflowManagementPage.tsx).

### 5.3. Estado gerenciado

| Estado | Armazenamento | Lifecycle |
|-------|---------------|-----------|
| `activeTab` | URL search params | persiste em refresh e deep-link |
| `assignmentsSubtab` | URL search params | preservado ao trocar para `completed` e voltar |
| `currentFilter` | URL search params | muda apenas na aba `current` |
| `filters` aplicados | URL search params | alterados somente em confirmacao explicita |
| `draft` de filtros | `useState` local em `ManagementToolbar` | sincroniza com `filters` aplicados quando URL muda |
| `selectedRequestId` | `useState` local em `WorkflowManagementPage` | abre/fecha dialog sem resetar tabs |
| `open accordion item` | `defaultValue` local do `Accordion` | inicializa no mes mais recente; usuario pode colapsar |

### 5.4. Contrato visual por componente

- [WorkflowManagementPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/WorkflowManagementPage.tsx)
  - remove o bloco de rollout;
  - remove os badges de ator/filtros/ownership do header nesta rodada;
  - cria a faixa compartilhada entre tabs, trigger e chips;
  - preserva callout de gate apenas quando `canViewCurrentQueue` for falso.

- [ManagementToolbar.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/ManagementToolbar.tsx)
  - deixa de renderizar `Card`, `CardHeader` e `CardContent`;
  - passa a renderizar trigger, `PopoverContent`, formulario e acoes;
  - usa `bg-admin-primary`, `text-admin-primary` ou derivados aprovados como destaque do CTA/estado ativo;
  - continua convertendo `draft` para `WorkflowManagementFilters` sem alterar shape.

- [CompletedPanel.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/CompletedPanel.tsx)
  - troca cards sempre abertos por accordion `single` e `collapsible`;
  - mostra mes + contador no trigger;
  - preserva `ManagementAsyncState` como wrapper de loading/erro/vazio.

---

## 6. ADRs

### ADR-2A-AJUSTES-01: Limpeza visual acontece no shell existente, sem nova camada de container

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-01 |
| Context | A rodada pede polish de UX, mas o estado funcional da pagina ja esta consolidado em `WorkflowManagementPage`. |

**Choice:** aplicar a limpeza visual diretamente no shell atual, reorganizando a hierarquia de layout sem introduzir um novo container de orquestracao.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| Criar um novo componente de pagina so para o redesign | adiciona acoplamento e custo sem ganho funcional |
| Tratar a rodada como CSS-only sem revisar markup | nao resolve a aproximacao real entre tabs, trigger e chips |

**Consequences:**

- mantem o delta de build pequeno;
- reduz risco de regressao em URL state e dialog;
- exige cuidado para nao misturar logica visual com mutacoes ja existentes.

### ADR-2A-AJUSTES-02: O painel de filtros usa `Popover`, nao modal, drawer nem dropdown menu

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-01 |
| Context | O filtro precisa sair do estado always-on, mas continuar leve, contextual e com confirmacao explicita. |

**Choice:** usar a primitive de `Popover` ja existente para ancorar o formulario de filtros ao trigger.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| `DropdownMenu` com itens customizados | piora acessibilidade e ergonomia para formulario com inputs |
| `Dialog` modal | pesado demais para um filtro contextual e frequente |
| Manter card inline | preserva o ruído visual que o DEFINE quer remover |

**Consequences:**

- reaproveita primitive existente no repositorio;
- preserva draft local e CTA explicito;
- requer ajuste responsivo de largura e alinhamento para viewport menor.

### ADR-2A-AJUSTES-03: O agrupamento mensal de `Concluidas` sera ordenado e aberto localmente no frontend

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-01 |
| Context | O endpoint ja entrega `groups`, mas a UX pedida depende de ordem previsivel e mes mais recente aberto por padrao. |

**Choice:** ordenar localmente os grupos validos em ordem decrescente por `monthKey` e usar o primeiro como `defaultValue` do accordion.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| Exigir nova ordenacao do backend | escopo desnecessario para rodada visual |
| Abrir todos os grupos | nao resolve o problema de altura e ruido |
| Usar tabs por mes | pior para lista longa e mobilidade |

**Consequences:**

- entrega a UX pedida sem tocar contratos;
- mantem `unknown` como fallback seguro;
- adiciona pequena logica de ordenacao/apresentacao no panel.

---

## 7. File Manifest

### 7.1. Ordem de execucao

| Phase | Files | Agent |
|-------|-------|-------|
| 1. Shell + helpers | `WorkflowManagementPage.tsx`, `presentation.ts`, `constants.ts` | `build` / `@react-frontend-developer` |
| 2. Filtro contextual | `ManagementToolbar.tsx` | `build` / `@react-frontend-developer` |
| 3. Historico mensal | `CompletedPanel.tsx` | `build` / `@react-frontend-developer` |
| 4. Verificacao | `WorkflowManagementPage.test.tsx`, `CompletedPanel.test.tsx` | `build` |

### 7.2. Manifest detalhado

| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | [src/components/workflows/management/WorkflowManagementPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/WorkflowManagementPage.tsx) | Modify | Remover card de transicao, limpar imports de copy/constantes antigas e criar faixa unificada de tabs + filtro + chips | `build` / `@react-frontend-developer` | - |
| 2 | [src/components/workflows/management/ManagementToolbar.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/ManagementToolbar.tsx) | Modify | Trocar card inline por trigger + popover + acoes de aplicar/limpar | `build` / `@react-frontend-developer` | #1 |
| 3 | [src/components/workflows/management/CompletedPanel.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/CompletedPanel.tsx) | Modify | Renderizar accordion mensal com mes recente aberto | `build` / `@react-frontend-developer` | #1 |
| 4 | [src/lib/workflows/management/presentation.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/presentation.ts) | Modify | Derivar labels/chips de filtros ativos com fallback seguro e helper de ordenacao/resumo mensal se necessario | `build` / `@react-frontend-developer` | - |
| 5 | [src/lib/workflows/management/constants.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/constants.ts) | Modify | Remover ou despromover copy de transicao nao mais usada somente apos o shell e os imports serem limpos em `WorkflowManagementPage.tsx` | `build` / `@react-frontend-developer` | #1 |
| 6 | [src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx) | Modify | Cobrir novo contrato visual da zona de tabs/filtro e persistencia de URL | `build` | #1, #2 |
| 7 | [src/components/workflows/management/__tests__/CompletedPanel.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/CompletedPanel.test.tsx) | Create | Validar ordenacao mensal e accordion com mes mais recente aberto | `build` | #3 |
| 8 | [src/components/workflows/management/__tests__/ManagementToolbar.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/ManagementToolbar.test.tsx) | Create | Validar abrir popover, editar draft, aplicar, limpar e reidratar filtros recebidos | `build` | #2, #4 |

### 7.3. Arquivos explicitamente fora do delta esperado

- [src/hooks/use-workflow-management.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-workflow-management.ts)
- [src/lib/workflows/management/api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/api-client.ts)
- endpoints `read/*` e `runtime/*`
- auth contexts e regras de navegacao fora da superficie da pagina

---

## 8. Code Patterns

### Pattern 1: Trigger de filtro contextual minimalista com estado ativo sutil

```tsx
// src/components/workflows/management/ManagementToolbar.tsx

<Popover>
  <PopoverTrigger asChild>
    <Button
      type="button"
      variant="outline"
      className={cn(
        'gap-2 border-border/70 bg-background text-foreground',
        hasActiveFilters && 'border-admin-primary/30 bg-admin-primary/10 text-admin-primary hover:bg-admin-primary/15',
      )}
    >
      <SlidersHorizontal className="h-4 w-4" />
      <span>Filtros</span>
      {activeFilterCount > 0 ? <span className="text-xs font-medium">{activeFilterCount}</span> : null}
    </Button>
  </PopoverTrigger>

  <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] space-y-4 p-4">
    {formFields}
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={handleReset}>Limpar</Button>
      <Button className="bg-admin-primary hover:bg-admin-primary/90" onClick={handleApply}>
        Aplicar filtros
      </Button>
    </div>
  </PopoverContent>
</Popover>
```

### Pattern 2: Chips discretos para filtros ativos

```ts
// src/lib/workflows/management/presentation.ts

type ActiveFilterDescriptor = {
  key: keyof WorkflowManagementFilters;
  label: string;
  value: string;
};

export function getManagementActiveFilterDescriptors(
  filters: WorkflowManagementFilters,
  bootstrap?: WorkflowManagementBootstrapData,
): ActiveFilterDescriptor[] {
  // requestId -> "Chamado: #801"
  // workflowTypeId -> label resolvido nas opcoes do bootstrap; se bootstrap estiver undefined, usar o proprio ID
  // areaId -> label resolvida nas opcoes do bootstrap; se bootstrap estiver undefined, usar o proprio ID
  // requesterQuery -> "Solicitante: Alice"
  // slaState -> label canonica
  // periodFrom / periodTo -> datas curtas
}
```

### Pattern 3: Accordion mensal com ordenacao local segura

```tsx
// src/components/workflows/management/CompletedPanel.tsx

const groupsToRender = sortManagementMonthGroups(data?.groups ?? fallbackGroups);
const defaultGroup = groupsToRender[0]?.monthKey;

<Accordion type="single" collapsible defaultValue={defaultGroup} className="space-y-3">
  {groupsToRender.map((group) => (
    <AccordionItem key={group.monthKey} value={group.monthKey} className="rounded-lg border">
      <AccordionTrigger className="px-4 py-3 hover:no-underline">
        <div className="flex items-center gap-2">
          <span>{formatManagementMonthKey(group.monthKey)}</span>
          <Badge variant="outline">{group.items.length}</Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <ManagementRequestList items={group.items} onOpenRequest={onOpenRequest} />
      </AccordionContent>
    </AccordionItem>
  ))}
</Accordion>
```

---

## 9. API Contract

Nenhum endpoint novo ou alterado.

Continuam valendo sem mudanca:

- `GET /api/workflows/read/management/bootstrap`
- `GET /api/workflows/read/current`
- `GET /api/workflows/read/assignments`
- `GET /api/workflows/read/completed`
- `GET /api/workflows/read/requests/[requestId]`
- mutacoes runtime de `assign`, `finalize` e `archive`

---

## 10. Database Schema

Nenhuma mudanca no schema.

---

## 11. Testing Strategy

### 11.1. Unit / component tests

| Component | Test |
|-----------|------|
| `WorkflowManagementPage` | nao renderiza mais o card/copy de transicao; exibe tabs e trigger de filtro na zona principal |
| `WorkflowManagementPage` | aplicar filtros pelo popover continua serializando a URL corretamente |
| `WorkflowManagementPage` | gate de `Chamados atuais` continua funcionando sem quebrar o novo layout |
| `ManagementToolbar` | abre popover, preserva draft local, aplica, limpa e reidrata filtros recebidos |
| `CompletedPanel` | ordena meses decrescentemente e abre o mais recente por padrao |
| `CompletedPanel` | mantem empty/error/loading sob `ManagementAsyncState` |

### 11.2. Integration tests

| Flow | Test |
|------|------|
| `URL -> UI -> URL` | abrir com search params existentes, refletir no draft e reaplicar novo filtro |
| `toolbar draft lifecycle` | abrir popover, editar sem aplicar, confirmar, limpar e reidratar draft a partir dos filtros da URL |
| `Completed data -> accordion` | payload com `groups` fora de ordem e `unknown` continua renderizando ordem correta |
| `current gate` | usuario sem ownership nao ve a tab `Chamados atuais`, mas continua operando tabs restantes |

### 11.3. Acceptance tests

```gherkin
GIVEN um usuario com acesso a /gestao-de-chamados
WHEN a pagina carrega com bootstrap valido
THEN o shell nao exibe mais o card de transicao da fase
AND tabs e filtro aparecem na mesma zona visual
```

```gherkin
GIVEN filtros ativos serializados na URL
WHEN o usuario abre o painel de filtros e confirma uma alteracao
THEN a URL continua sendo a fonte de verdade do filtro aplicado
AND o resumo de filtros ativos aparece de forma discreta ao lado das tabs
```

```gherkin
GIVEN a aba Concluidas com historico de mais de um mes
WHEN a aba e aberta
THEN apenas o mes mais recente inicia expandido
AND os meses anteriores permanecem recolhidos ate interacao do usuario
```

### 11.4. Validacao manual minima

- desktop: alinhamento entre tabs, trigger, chips e callout de gate;
- mobile: popover continua utilizavel sem overflow horizontal;
- refresh com query params aplicados;
- troca de tab com filtro ativo;
- abrir detalhe a partir de item de mes recolhido/expandido.

---

## 12. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | Reverter alteracoes de `WorkflowManagementPage.tsx`, `ManagementToolbar.tsx` e `CompletedPanel.tsx` | a tela volta a exibir card de transicao, toolbar inline e cards mensais |
| 2 | Reverter helpers adicionados em `presentation.ts` e ajustes em `constants.ts` | compilacao volta a depender apenas dos helpers originais |
| 3 | Reverter testes ajustados/criados | suite reflete novamente o contrato visual anterior |

**Metodo rapido:** `git revert <commit>`

---

## 13. Implementation Checklist

### Pre-Build

- [x] DEFINE aprovado
- [x] decisoes de UX fechadas no brainstorm
- [x] primitives compartilhadas (`Popover`, `Accordion`) validadas no repositorio
- [x] escopo fechado em frontend leve, sem backend

### Post-Build

- [ ] card de transicao removido do shell principal
- [ ] trigger de filtro usa confirmacao explicita e destaque em `admin-primary`
- [ ] filtros ativos aparecem como resumo discreto e legivel
- [ ] `Concluidas` abre o mes mais recente por padrao
- [ ] URL state continua sendo a fonte de verdade dos filtros aplicados
- [ ] testes atualizados passam

---

## 14. Specialist Instructions

### For `build` / `@react-frontend-developer`

```markdown
Files to modify:
- src/components/workflows/management/WorkflowManagementPage.tsx
- src/components/workflows/management/ManagementToolbar.tsx
- src/components/workflows/management/CompletedPanel.tsx
- src/lib/workflows/management/presentation.ts
- src/lib/workflows/management/constants.ts
- src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx
- src/components/workflows/management/__tests__/CompletedPanel.test.tsx

Key requirements:
- Nao alterar search params canonicos nem contratos de hook/api.
- Reaproveitar Popover e Accordion existentes; nao criar primitive nova.
- Usar `admin-primary` como destaque do trigger/CTA quando houver highlight.
- Remover copy de rollout/transicao da experiencia principal.
- Garantir responsividade da zona tabs + filtro no mobile.
- Nao reverter nem tocar mutacoes/runtime fora do necessario para compilar.
```

### Backend / auth

```markdown
Nenhuma entrega backend, schema ou auth faz parte deste design.
Se o build demandar mudanca nesses contratos, tratar como desvio de escopo e reabrir iteracao.
```

---

## 15. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-01 | design-agent | Initial design for the visual adjustments round of `/gestao-de-chamados` |
