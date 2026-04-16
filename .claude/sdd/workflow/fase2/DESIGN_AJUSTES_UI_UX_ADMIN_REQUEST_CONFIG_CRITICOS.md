# DESIGN: Ajustes UI/UX criticos em `/admin/request-config`

> Generated: 2026-04-16
> Status: Ready for build
> Scope: Fase 2 / patch critico de UX/UI na superficie administrativa de configuracao de chamados
> Base document: `DEFINE_AJUSTES_UI_UX_ADMIN_REQUEST_CONFIG_CRITICOS.md`
> Depends on: `DESIGN_FASE2E_1_SHELL_CATALOGO_CHAMADOS.md`, `DESIGN_FASE2E_2_EDITOR_RASCUNHO_CHAMADOS.md`, `DESIGN_AJUSTES_PONTUAIS_CONFIGURADOR_2E_MODAL_E_APPROVERS.md`, `DESIGN_FASE2E_4_HISTORICO_GERAL_CHAMADOS.md`

## 1. Objetivo

Entregar um patch de refinamento visual e ergonomico em `/admin/request-config`, sem alterar semantica operacional, contratos de API, persistencia ou regras de autorizacao.

Esta iteracao cobre:

- reorganizar a leitura da aba `Definicoes` para destacar `WorkflowType` como agrupador principal de versoes;
- remover redundancias textuais como `state=published` quando o status ja estiver comunicado por badge ou hierarquia visual;
- ajustar o shell do `WorkflowVersionEditorDialog` para fechamento canonico com `X` superior direito e rodape fixo com CTAs principais;
- reposicionar `Adicionar etapa` e `Adicionar campo` para o rodape dos blocos correspondentes;
- traduzir labels e opcoes de `Acao` para PT-BR sem alterar o valor canonico persistido;
- aplicar tratamento visual `admin-primary` aos CTAs primarios do editor;
- substituir a barra de filtros sempre aberta do `Historico Geral` por uma interacao compacta inspirada em `ManagementToolbar`.

Esta iteracao nao cobre:

- qualquer alteracao em `/api/admin/request-config/*`;
- mudanca de shape em `types.ts`, Firestore ou runtime de workflows;
- refatoracao estrutural ampla de toolbar compartilhada entre dominios;
- redesenho integral do catalogo, grid de historico ou editor alem do necessario para os requisitos do define.

---

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_AJUSTES_UI_UX_ADMIN_REQUEST_CONFIG_CRITICOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_AJUSTES_UI_UX_ADMIN_REQUEST_CONFIG_CRITICOS.md)
- [DESIGN_FASE2E_2_EDITOR_RASCUNHO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2E_2_EDITOR_RASCUNHO_CHAMADOS.md)
- [DESIGN_AJUSTES_PONTUAIS_CONFIGURADOR_2E_MODAL_E_APPROVERS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_AJUSTES_PONTUAIS_CONFIGURADOR_2E_MODAL_E_APPROVERS.md)
- [DESIGN_FASE2E_4_HISTORICO_GERAL_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2E_4_HISTORICO_GERAL_CHAMADOS.md)
- [WorkflowConfigPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/WorkflowConfigPage.tsx)
- [WorkflowConfigDefinitionsTab.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/WorkflowConfigDefinitionsTab.tsx)
- [WorkflowVersionEditorDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/WorkflowVersionEditorDialog.tsx)
- [WorkflowDraftEditorPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/WorkflowDraftEditorPage.tsx)
- [WorkflowDraftFieldsSection.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/WorkflowDraftFieldsSection.tsx)
- [WorkflowDraftStepsSection.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/WorkflowDraftStepsSection.tsx)
- [WorkflowConfigHistoryTab.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/WorkflowConfigHistoryTab.tsx)
- [HistoryFiltersBar.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/history/HistoryFiltersBar.tsx)
- [ManagementToolbar.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/ManagementToolbar.tsx)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/admin-config/types.ts)

Em caso de divergencia:

1. prevalece o `DEFINE_AJUSTES_UI_UX_ADMIN_REQUEST_CONFIG_CRITICOS.md` para escopo e aceite;
2. depois prevalecem os designs da trilha `2E` para invariantes de rota, editor, historico e guards;
3. depois prevalece este design para orientar o build;
4. o contrato funcional e persistido atual continua sendo a restricao final: esta iteracao muda apresentacao, nao semantica.

---

## 3. Estado Atual e Lacuna que esta iteracao Fecha

### 3.1. O que o repositorio ja oferece

- `/admin/request-config` ja possui shell com tabs, query params para modal e carregamento via React Query;
- a aba `Definicoes` ja lista `areas -> workflow types -> versions` com acoes de `Editar`, `Publicar` e `Ativar`;
- o editor modal ja existe e protege dirty close;
- o editor ja possui secoes separadas para geral, acesso, campos, etapas e readiness;
- a aba `Historico Geral` ja possui query propria, grid read-only e barra de filtros funcional;
- `/gestao-de-chamados` ja possui um padrao visual compacto de filtros com `Popover` e contagem de filtros ativos.

### 3.2. Problema real no codigo atual

- `WorkflowConfigDefinitionsTab` ainda comunica a hierarquia pelo bloco do tipo, mas a leitura de versoes continua visualmente achatada e pouco guiada;
- o catalogo ainda expoe metadados tecnicos demais no header do tipo, aumentando ruido para leitura administrativa;
- `WorkflowVersionEditorDialog` usa `DialogHeader` simples e delega os principais CTAs ao `PageHeader` interno rolavel, o que reduz previsibilidade do fechamento e distancia as acoes do contexto;
- `WorkflowDraftFieldsSection` e `WorkflowDraftStepsSection` ainda posicionam seus CTAs de adicao no header, em vez do rodape contextual do bloco;
- `WorkflowDraftStepsSection` renderiza opcoes de `Acao` com os valores internos em ingles (`approval`, `acknowledgement`, `execution`);
- `HistoryFiltersBar` ainda ocupa espaco fixo no header da aba e foge do canon mais enxuto ja adotado em `ManagementToolbar`.

### 3.3. Resultado esperado ao final desta iteracao

- a aba `Definicoes` passa a comunicar cada `WorkflowType` como unidade primaria, com header mais limpo e lista de versoes com melhor separacao visual;
- o modal do editor fica operacionalmente mais forte em desktop, com `X` canonico no topo e rodape fixo com `Salvar rascunho` e `Publicar versao`;
- acoes internas de `Campos` e `Etapas` ficam ancoradas ao fim do proprio bloco;
- labels de acao passam a ser amigaveis em PT-BR, preservando os enums e payloads atuais;
- o filtro do `Historico Geral` deixa de ocupar a tela por padrao e vira uma interacao compacta, com badge/contador de filtros ativos;
- o patch permanece seguro porque nao toca nas rotas, DTOs nem no storage.

---

## 4. Arquitetura da Solucao

### 4.1. Diagrama arquitetural

```text
Admin with canManageWorkflowsV2
  |
  +--> /admin/request-config
  |      |
  |      +--> WorkflowConfigPage
  |      |      |
  |      |      +--> Tab: Definicoes
  |      |      |      |
  |      |      |      +--> WorkflowConfigDefinitionsTab
  |      |      |      |      |- summary cards
  |      |      |      |      |- area accordion
  |      |      |      |      \- workflow-type cards with clearer version hierarchy
  |      |      |      |
  |      |      |      \--> WorkflowVersionEditorDialog
  |      |      |             |- fixed modal header with close X
  |      |      |             |- scrollable editor body
  |      |      |             \- fixed footer CTAs in admin-primary
  |      |      |
  |      |      \--> Tab: Historico Geral
  |      |             |
  |      |             +--> WorkflowConfigHistoryTab
  |      |             |      |- compact filter trigger
  |      |             |      |- HistoryFiltersBar inside Popover/Card shell
  |      |             |      \- HistoryGrid
  |      |             |
  |      |             \--> fetchWorkflowConfigHistory() unchanged
  |      |
  |      \--> query params, authz and React Query unchanged
  |
  \--> Existing API + Firestore
         |- /api/admin/request-config/catalog
         |- /api/admin/request-config/history
         |- /api/admin/request-config/workflow-types/[id]/versions/[version]
         \- No schema or contract changes
```

### 4.2. Fluxo por camadas

```text
LAYER 1 (Catalog shell)
1. WorkflowConfigPage continua decidindo tab ativa e abertura do modal por search params.
2. Nenhuma mudanca de navegacao ou authz e introduzida.

LAYER 2 (Definitions presentation)
3. WorkflowConfigDefinitionsTab reorganiza visualmente o card de cada workflow type.
4. O header do tipo passa a concentrar nome, descricao curta, status principal e CTA principal.
5. As versoes ficam em lista mais nitida, com status, metadata resumida e acoes por linha.

LAYER 3 (Editor modal shell)
6. WorkflowVersionEditorDialog assume responsabilidade pelo header/close e footer fixo.
7. WorkflowDraftEditorPage passa a expor o corpo do editor e um controller de shell para o dialog, sem mudar mutations, payloads ou contratos.
8. O footer fixo reaproveita os mesmos fluxos de `saveMutation` e `publishMutation` ja existentes, agora acionados pelo shell do modal.
9. O `X` superior direito continua sendo a acao canonica de fechamento tanto em modo edit quanto em modo read-only.
10. Os CTAs principais deixam de depender do scroll do conteudo.

LAYER 4 (Section ergonomics)
11. WorkflowDraftFieldsSection e WorkflowDraftStepsSection mantem a mesma estrutura de form state.
12. Apenas movem seus botões de adicao para um rodape contextual.
13. O mapeamento PT-BR das acoes ocorre somente na camada de apresentacao.

LAYER 5 (History filter shell)
14. WorkflowConfigHistoryTab calcula filtros ativos e hospeda um trigger compacto.
15. HistoryFiltersBar vira conteudo de um shell colapsado em popover/card.
16. O query object `AdminHistoryFilters` continua identico e o fluxo de `onChange` segue imediato, sem introduzir botao `Aplicar`.
```

### 4.3. Estado de frontend impactado

| Estado | Armazenamento | Mudanca |
|-------|---------------|---------|
| `tab`, `editorWorkflowTypeId`, `editorVersion` | search params | Nenhuma |
| `dirtyState` do modal | `useState` em `WorkflowVersionEditorDialog` | Mantido, mas usado tambem pelo footer fixo |
| `editorShellState` (`submitDraft`, `publishVersion`, `isSaving`, `isPublishing`, `canPublish`, `isReadOnly`) | derivado do editor e elevado ao dialog | Novo estado de orquestracao visual, sem mudar a logica funcional |
| form state do editor | `react-hook-form` | Nenhuma mudanca de shape |
| lista de versoes no catalogo | dados de `WorkflowConfigCatalogData` | Apenas nova apresentacao |
| filtros do historico | `useState<AdminHistoryFilters>` | Mantido, com shell visual compacto |
| contagem de filtros ativos | derivado no client | Novo estado derivado para badge visual |

### 4.4. Invariantes

- nenhum endpoint novo ou alterado;
- nenhum campo novo em `WorkflowDraftEditorData`, `SaveWorkflowDraftInput` ou `AdminHistoryFilters`;
- nenhuma mudanca na semantica de `draft`, `published`, `activate` ou `publish`;
- nenhum texto traduzido em PT-BR altera o valor persistido do enum de acao;
- `saveMutation` e `publishMutation` continuam sendo a fonte funcional de salvar/publicar, apenas acionadas por um shell diferente;
- o filtro compacto do historico continua oferecendo todos os criterios ja suportados hoje.

---

## 5. Architecture Decisions

### ADR-UIUX-001: O patch permanece estritamente na camada de apresentacao

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-16 |
| Context | O define delimita a iteracao como um patch critico de UX/UI com baixo risco e urgencia imediata. |

**Choice:** concentrar a entrega em componentes React/Tailwind existentes, sem tocar em rotas, serviços, tipos de API ou colecoes.

**Rationale:**

1. minimiza risco de regressao funcional;
2. acelera build e validacao;
3. mantem rollback simples por se tratar de diff puramente visual/composicional.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| reabrir DTOs do editor para carregar labels traduzidos do backend | custo alto para um problema estritamente visual |
| criar novo sistema compartilhado de toolbar/filtro antes do patch | expande escopo e risco sem necessidade imediata |

**Consequences:**

- positivo: mudanca local e reversivel;
- negativo: algum codigo de apresentacao traduzida permanece especifico do dominio admin-config.

### ADR-UIUX-002: O modal assume header e footer fixos, e o editor vira corpo reutilizavel

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-16 |
| Context | Hoje o `WorkflowVersionEditorDialog` apenas envolve o `WorkflowDraftEditorPage`, que por sua vez renderiza `PageHeader` com acoes dentro da area rolavel. |

**Choice:** mover o shell de acoes principais para o modal, deixando o componente de editor responsavel pelo conteudo, loading, erro e secoes internas, e expondo ao dialog um controller explicito com `submitDraft`, `publishVersion`, `isSaving`, `isPublishing`, `canPublish` e `isReadOnly`.

**Rationale:**

1. aproxima o comportamento do modal ao padrao esperado de operacao;
2. mantem `Salvar` e `Publicar` sempre acessiveis;
3. reduz dependencia de scroll para executar a acao principal;
4. preserva o funcionamento atual porque o footer apenas delega para as mesmas mutations ja existentes.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| manter os CTAs dentro do `PageHeader` do corpo | preserva o problema de visibilidade e ergonomia |
| duplicar CTAs no topo e no rodape | aumenta ruido e cria superficie dupla para estados pending/disabled |

**Consequences:**

- positivo: comportamento do modal fica mais previsivel;
- positivo: o funcionamento atual de salvar/publicar permanece intacto;
- negativo: exige pequeno refactor de props entre `WorkflowVersionEditorDialog` e `WorkflowDraftEditorPage`.

### ADR-UIUX-003: A traducao de `Acao` ocorre por mapa local de apresentacao

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-16 |
| Context | Os valores internos de `StepActionDef.type` sao enums em ingles e ja sao usados por payloads e regras atuais. |

**Choice:** introduzir um mapa local `actionType -> labelPTBR` na camada do editor e renderizar selects/auxiliares com textos amigaveis, sem alterar `step.action.label`, enums internos ou qualquer texto livre digitado pelo admin.

**Rationale:**

1. evita migracao de enums;
2. preserva compatibilidade com testes e persistencia;
3. resolve o problema exato do define sem abrir backend.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| traduzir o enum na fonte de dados | poderia contaminar contrato interno com texto de apresentacao |
| manter labels tecnicos e documentar melhor a tela | nao atende o requisito de UX |

**Consequences:**

- positivo: sem impacto em persistencia;
- positivo: traduz apenas a experiencia visivel;
- negativo: exige cuidado para nao confundir label visual do tipo com o rotulo editavel da acao.

### ADR-UIUX-004: O filtro do historico reaproveita a semantica de `ManagementToolbar`, nao o componente inteiro

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-16 |
| Context | `ManagementToolbar` ja resolve bem o padrao de filtro compacto, mas trabalha com tipos e semantica diferentes do historico admin-config. |

**Choice:** copiar a estrutura de interacao (`Button + Badge + Popover + actions`) para `admin-config`, mantendo `HistoryFiltersBar` como formulario do dominio.

**Rationale:**

1. reaproveita o canon visual validado;
2. evita acoplamento artificial entre `WorkflowManagementFilters` e `AdminHistoryFilters`;
3. preserva isolamento entre os dois dominios.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| importar `ManagementToolbar` e tentar generaliza-lo agora | aumento de escopo e risco de regressao em `/gestao-de-chamados` |
| manter a barra sempre aberta e apenas reduzir espacamentos | nao resolve o requisito principal de filtro compacto |

**Consequences:**

- positivo: impacto local e alinhado ao canon;
- negativo: existe duplicacao controlada do shell de filtro.

---

## 6. File Manifest

### Execution Order

| Phase | Files | Agent |
|-------|-------|-------|
| 1. Catalog UX | `src/components/workflows/admin-config/WorkflowConfigDefinitionsTab.tsx` | @react-frontend-developer |
| 2. Modal shell | `src/components/workflows/admin-config/WorkflowVersionEditorDialog.tsx`, `src/components/workflows/admin-config/editor/WorkflowDraftEditorPage.tsx` | @react-frontend-developer |
| 3. Editor sections | `src/components/workflows/admin-config/editor/WorkflowDraftFieldsSection.tsx`, `src/components/workflows/admin-config/editor/WorkflowDraftStepsSection.tsx` | @react-frontend-developer |
| 4. History filter UX | `src/components/workflows/admin-config/WorkflowConfigHistoryTab.tsx`, `src/components/workflows/admin-config/history/HistoryFiltersBar.tsx` | @react-frontend-developer |
| 5. Tests | `src/components/workflows/admin-config/__tests__/WorkflowConfigPage.test.tsx`, `src/components/workflows/admin-config/__tests__/WorkflowConfigDefinitionsTab.test.tsx`, `src/components/workflows/admin-config/__tests__/WorkflowVersionEditorDialog.test.tsx`, `src/components/workflows/admin-config/editor/__tests__/WorkflowDraftStepsSection.test.tsx`, `src/components/workflows/admin-config/editor/__tests__/WorkflowDraftFieldsSection.test.tsx`, `src/components/workflows/admin-config/__tests__/WorkflowConfigHistoryTab.test.tsx`, `src/components/workflows/admin-config/history/__tests__/HistoryFiltersBar.test.tsx` | @react-frontend-developer |

### Detailed Manifest

| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | `src/components/workflows/admin-config/WorkflowConfigDefinitionsTab.tsx` | Modify | Reestruturar card do workflow type, limpar metadados ruidosos e reforcar hierarquia de versoes | @react-frontend-developer | - |
| 2 | `src/components/workflows/admin-config/WorkflowVersionEditorDialog.tsx` | Modify | Criar shell com `X` superior direito, area rolavel e footer fixo com CTAs | @react-frontend-developer | #1 |
| 3 | `src/components/workflows/admin-config/editor/WorkflowDraftEditorPage.tsx` | Modify | Separar acoes principais do corpo, expor callbacks/estado ao dialog e ajustar densidade do header interno | @react-frontend-developer | #2 |
| 4 | `src/components/workflows/admin-config/editor/WorkflowDraftFieldsSection.tsx` | Modify | Levar `Adicionar campo` para o rodape do bloco | @react-frontend-developer | #3 |
| 5 | `src/components/workflows/admin-config/editor/WorkflowDraftStepsSection.tsx` | Modify | Levar `Adicionar etapa` para o rodape, traduzir tipos de acao e manter payloads intactos | @react-frontend-developer | #3 |
| 6 | `src/components/workflows/admin-config/WorkflowConfigHistoryTab.tsx` | Modify | Embutir shell de filtro compacto, contagem de ativos e acao de abrir/fechar | @react-frontend-developer | - |
| 7 | `src/components/workflows/admin-config/history/HistoryFiltersBar.tsx` | Modify | Adaptar o formulario para uso em popover/card compacto e alinhar controles ao canon | @react-frontend-developer | #6 |
| 8 | `src/components/workflows/admin-config/__tests__/WorkflowConfigPage.test.tsx` | Modify | Ajustar asserts da aba e possivel presenca do novo shell de filtros/modal | @react-frontend-developer | #1, #2, #6 |
| 9 | `src/components/workflows/admin-config/__tests__/WorkflowConfigDefinitionsTab.test.tsx` | Modify | Cobrir remocao da linha raw `state=*` e manutencao das badges/acoes | @react-frontend-developer | #1 |
| 10 | `src/components/workflows/admin-config/__tests__/WorkflowVersionEditorDialog.test.tsx` | Modify | Cobrir `X`, footer fixo e estados edit/read-only no novo shell | @react-frontend-developer | #2, #3 |
| 11 | `src/components/workflows/admin-config/editor/__tests__/WorkflowDraftStepsSection.test.tsx` | Add or Modify | Cobrir labels PT-BR das opcoes de acao preservando valores internos | @react-frontend-developer | #5 |
| 12 | `src/components/workflows/admin-config/editor/__tests__/WorkflowDraftFieldsSection.test.tsx` | Add or Modify | Cobrir CTA contextual no rodape e respeito ao estado `readOnly` | @react-frontend-developer | #4 |
| 13 | `src/components/workflows/admin-config/__tests__/WorkflowConfigHistoryTab.test.tsx` | Modify | Cobrir trigger compacto, badge de filtros ativos e shell colapsado | @react-frontend-developer | #6, #7 |
| 14 | `src/components/workflows/admin-config/history/__tests__/HistoryFiltersBar.test.tsx` | Add or Modify | Garantir emissao imediata de `AdminHistoryFilters` sem introduzir botao `Aplicar` | @react-frontend-developer | #7 |

---

## 7. Code Patterns

### Pattern 1: Mapa de labels PT-BR para `StepActionDef.type`

```typescript
const ACTION_TYPE_OPTIONS = [
  { value: 'none', label: 'Nenhuma acao' },
  { value: 'approval', label: 'Aprovacao' },
  { value: 'acknowledgement', label: 'Ciencia' },
  { value: 'execution', label: 'Execucao' },
] as const;

function getActionTypeLabel(value: string): string {
  return ACTION_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
```

Uso esperado:

- `SelectItem` mostra `label`;
- `setValue()` continua persistindo `value`;
- a traducao afeta apenas textos sistemicos visiveis;
- `step.action.label` continua sendo um campo livre do admin e nao deve ser auto-reescrito a partir do tipo selecionado.

### Pattern 2: Shell de modal com body rolavel e footer fixo

```typescript
<DialogContent className="flex max-h-[92vh] max-w-6xl flex-col overflow-hidden p-0">
  <div className="flex items-start justify-between border-b px-6 py-4">
    <div className="space-y-1">
      <DialogTitle>Editor de versao</DialogTitle>
      <DialogDescription>Ajuste ou consulte a configuracao sem sair da tela de definicoes.</DialogDescription>
    </div>
    <Button type="button" variant="ghost" size="icon" onClick={requestClose} aria-label="Fechar editor">
      <X className="h-4 w-4" />
    </Button>
  </div>

  <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
    <WorkflowDraftEditorPage
      embedded
      hidePrimaryActions
      onShellStateChange={setEditorShellState}
    />
  </div>

  <div className="border-t bg-background px-6 py-3">
    <div className="flex flex-wrap justify-end gap-2">
      {editorShellState.isReadOnly ? null : (
        <>
          <Button variant="outline" onClick={requestClose}>Cancelar</Button>
          <Button
            className="bg-admin-primary text-primary-foreground hover:bg-admin-primary/90"
            disabled={editorShellState.isSaving}
            onClick={editorShellState.submitDraft}
          >
            Salvar rascunho
          </Button>
          <Button
            className="bg-admin-primary text-primary-foreground hover:bg-admin-primary/90"
            disabled={!editorShellState.canPublish || editorShellState.isPublishing}
            onClick={editorShellState.publishVersion}
          >
            Publicar versao
          </Button>
        </>
      )}
    </div>
  </div>
</DialogContent>
```

Contrato esperado do shell:

- o dialog recebe do editor apenas callbacks e flags de orquestracao visual;
- o editor continua dono de `saveMutation`, `publishMutation`, refresh e regras de submit;
- em modo read-only, o modal continua fechando pelo `X` superior direito e nao exibe CTA de submit.

### Pattern 3: Trigger compacto de filtros no historico

```typescript
<Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
  <PopoverTrigger asChild>
    <Button
      type="button"
      variant="outline"
      className={cn(
        'w-full justify-between gap-3 md:w-auto',
        hasActiveFilters && 'border-admin-primary/30 bg-admin-primary/10 text-admin-primary',
      )}
    >
      <span>Filtros</span>
      {activeFilterCount > 0 ? <Badge className="bg-admin-primary text-primary-foreground">{activeFilterCount}</Badge> : null}
    </Button>
  </PopoverTrigger>

  <PopoverContent align="end" className="w-[min(92vw,28rem)] p-4">
    <HistoryFiltersBar ... />
  </PopoverContent>
</Popover>
```

Comportamento esperado:

- `HistoryFiltersBar` continua emitindo `onChange` a cada alteracao relevante;
- nao introduzir botao `Aplicar`;
- `Limpar filtros` continua resetando imediatamente o mesmo objeto `AdminHistoryFilters`.

### Pattern 4: CTA contextual no rodape da secao

```typescript
<Card>
  <CardHeader>
    <CardTitle>Campos do formulario</CardTitle>
  </CardHeader>

  <CardContent className="space-y-4">
    {renderedItems}

    <div className="flex justify-end border-t pt-4">
      <Button type="button" variant="outline" size="sm" disabled={readOnly} onClick={handleAppend}>
        Adicionar campo
      </Button>
    </div>
  </CardContent>
</Card>
```

---

## 8. API Contract

Nenhum endpoint novo ou alterado.

Rotas consumidas e invariantes:

- `GET /api/admin/request-config/catalog`: sem mudanca;
- `GET /api/admin/request-config/history`: sem mudanca;
- `GET /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]`: sem mudanca;
- `PUT /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]`: sem mudanca;
- `POST /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]/publish`: sem mudanca.

Impacto esperado:

- apenas renderizacao, organizacao visual e affordances de interacao mudam;
- payloads e responses continuam compativeis com o build atual.

---

## 9. Database Schema

Nenhuma mudanca no schema.

Sem alteracao em:

- `workflowTypes_v2/{workflowTypeId}`;
- `workflowTypes_v2/{workflowTypeId}/versions/{version}`;
- colecoes de requests legados ou `V2`;
- regras de auth ou fields persistidos.

---

## 10. Testing Strategy

### Unit / Component Tests

| Component | Test |
|-----------|------|
| `WorkflowVersionEditorDialog` | renderiza `X` superior direito, fecha via callback nos modos edit/read-only, preserva dirty guard e mostra footer fixo apenas quando a versao estiver editavel |
| `WorkflowConfigDefinitionsTab` | remove a linha raw `state=*` e preserva badges/status visuais existentes |
| `WorkflowDraftStepsSection` | exibe labels PT-BR no select mantendo o valor interno correto |
| `WorkflowDraftFieldsSection` | renderiza CTA de adicionar no rodape e respeita `readOnly` |
| `WorkflowConfigHistoryTab` | mostra trigger de filtros com badge quando ha filtros ativos |
| `HistoryFiltersBar` | continua emitindo `AdminHistoryFilters` identicos apos alteracoes/limpeza, em fluxo imediato e sem botao `Aplicar` |

### Integration Tests

| Flow | Test |
|------|------|
| Catalogo `Definicoes` | abrir editor a partir de draft e versao publicada continua funcionando com nova hierarquia visual |
| Editor modal | salvar rascunho no footer reflete `saveMutation`, estados pending e refresh corretos |
| Editor modal read-only | published abre com `X` superior direito e sem submit habilitado no footer |
| Historico Geral | aplicar filtros via popover continua atualizando query local e refletindo na grid |

### Acceptance Tests

```gherkin
GIVEN um admin autenticado em /admin/request-config?tab=definitions
WHEN abrir um workflow type com draft existente
THEN o modal deve abrir com X superior direito e o CTA "Salvar rascunho" visivel no rodape sem alterar o fluxo atual de salvamento
```

```gherkin
GIVEN um admin no editor de versao
WHEN abrir o select de Acao de uma etapa
THEN as opcoes exibidas devem estar em PT-BR sem mudar o valor persistido do form
```

```gherkin
GIVEN um admin na aba Historico Geral
WHEN carregar a pagina sem filtros ativos
THEN a tela deve exibir apenas um trigger compacto de filtros, sem a barra expandida por padrao
```

### Manual Regression

- abrir e fechar o modal por `X`, `Esc`, clique fora e callback interno;
- salvar rascunho e publicar versao a partir do novo footer;
- abrir versao published em read-only e confirmar `X` superior direito e ausencia de submit editavel;
- adicionar campo e etapa apos mover os CTAs;
- aplicar e limpar todos os filtros do historico;
- confirmar que os filtros continuam atualizando a query local sem botao `Aplicar`;
- validar responsividade basica do popover de filtros e do footer do modal em viewport menor.

---

## 11. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | Reverter os componentes de frontend listados no manifesto | `/admin/request-config` volta ao layout anterior sem erro de compilacao |
| 2 | Validar abertura de editor, save e history filters apos revert | Fluxos de draft e historico continuam funcionais |
| 3 | Reexecutar testes de componente afetados | Nenhuma regressao funcional nos comportamentos anteriores |

Metodo rapido: `git revert <commit>`

Como nao ha mudanca de schema, API ou dados, rollback nao exige migracao.

---

## 12. Implementation Checklist

### Pre-Build

- [x] DEFINE document aprovado
- [x] Decisoes arquiteturais registradas
- [x] Manifesto de arquivos fechado
- [x] Padroes do codigo atual inspecionados
- [x] Escopo confirmado como frontend-only

### Post-Build

- [ ] Aba `Definicoes` comunica melhor `WorkflowType -> versions`
- [ ] Linha raw `state=*` removida da UI das versoes, preservando badges/status existentes
- [ ] Modal possui `X` superior direito nos modos edit/read-only e footer fixo com CTAs principais apenas em modo editavel
- [ ] `Adicionar campo` e `Adicionar etapa` foram movidos para o rodape das secoes
- [ ] Labels sistemicos de `Acao` aparecem em PT-BR sem alterar enums, payloads ou textos livres
- [ ] Filtro do `Historico Geral` ficou compacto e nao expandido por padrao
- [ ] Filtro do `Historico Geral` continua com atualizacao imediata, sem botao `Aplicar`
- [ ] Testes relevantes atualizados/passando

---

## 13. Specialist Instructions

### For @react-frontend-developer

```markdown
Files to modify:
- src/components/workflows/admin-config/WorkflowConfigDefinitionsTab.tsx
- src/components/workflows/admin-config/WorkflowVersionEditorDialog.tsx
- src/components/workflows/admin-config/editor/WorkflowDraftEditorPage.tsx
- src/components/workflows/admin-config/editor/WorkflowDraftFieldsSection.tsx
- src/components/workflows/admin-config/editor/WorkflowDraftStepsSection.tsx
- src/components/workflows/admin-config/WorkflowConfigHistoryTab.tsx
- src/components/workflows/admin-config/history/HistoryFiltersBar.tsx
- related tests

Key requirements:
- Nao alterar contratos de API, hooks de dados ou tipos persistidos.
- Manter `admin-primary` como token visual dos CTAs principais do editor.
- Traduzir labels sistemicos de acao apenas na apresentacao; enums internos permanecem em ingles e `step.action.label` continua sendo texto livre.
- Preservar dirty guard do modal e comportamento read-only da versao publicada.
- O footer fixo deve apenas orquestrar o acionamento das mutations ja existentes do editor.
- Remover a linha raw `state=*` sem substituir por novo texto tecnico; badges existentes continuam sendo a fonte visual de status.
- Reaproveitar o canon de interacao do `ManagementToolbar`, mas sem criar acoplamento estrutural com o dominio de gestao.
- Preservar o fluxo de filtros com atualizacao imediata, sem botao `Aplicar`.
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-16 | Codex | Design tecnico do patch critico de UI/UX em `/admin/request-config`, cobrindo catalogo, modal/editor e filtro compacto do historico |
| 1.1 | 2026-04-16 | Codex | Refinado contrato do shell do modal para preservar o funcionamento atual, formalizada remocao da linha raw `state=*`, reforcado `X` em edit/read-only e ampliado manifesto/cobertura de testes |
