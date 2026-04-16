# DESIGN: Correcoes pos-build de UI/UX em `/admin/request-config`

> Generated: 2026-04-16
> Status: Ready for build
> Scope: Fase 2 / microetapa corretiva para fechar gaps remanescentes do patch critico de UI/UX em `/admin/request-config`
> Base document: `DEFINE_CORRECOES_POS_BUILD_UI_UX_ADMIN_REQUEST_CONFIG_CRITICOS.md`
> Parent design: `DESIGN_AJUSTES_UI_UX_ADMIN_REQUEST_CONFIG_CRITICOS.md`
> Depends on: `DESIGN_FASE2E_2_EDITOR_RASCUNHO_CHAMADOS.md`, `DESIGN_FASE2E_4_HISTORICO_GERAL_CHAMADOS.md`

## 1. Objetivo

Fechar os achados remanescentes do patch critico de UI/UX em `/admin/request-config` sem reabrir contratos de API, persistencia, regras de runtime ou autorizacao.

Esta microetapa cobre:

- tornar cada `WorkflowType` colapsavel dentro da aba `Definicoes`, com versoes ocultas por padrao;
- corrigir a copy visivel de `Acao` para PT-BR completo e remover o rotulo default tecnico `Acao`;
- impedir que o footer fixo do modal apareca como editavel antes de o editor resolver se a versao e `read-only`;
- remover o CTA redundante de `Publicar versao` acima do footer fixo;
- alinhar a hierarquia cromatica das badges de `Publicada` e `Ativa`;
- trocar o filtro do `Historico Geral` de `onChange` imediato para um fluxo compacto com `Aplicar filtros`.

Esta microetapa nao cobre:

- novos endpoints ou mudancas nos endpoints atuais de `/api/admin/request-config/*`;
- alteracoes de `workflowTypes_v2`, `versions/{version}` ou schemas de request history;
- redesenho estrutural amplo do editor, do catalogo ou do grid de historico;
- mudancas no comportamento funcional de salvar rascunho, publicar versao ou ativar versao.

---

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_CORRECOES_POS_BUILD_UI_UX_ADMIN_REQUEST_CONFIG_CRITICOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_CORRECOES_POS_BUILD_UI_UX_ADMIN_REQUEST_CONFIG_CRITICOS.md)
- [DESIGN_AJUSTES_UI_UX_ADMIN_REQUEST_CONFIG_CRITICOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_AJUSTES_UI_UX_ADMIN_REQUEST_CONFIG_CRITICOS.md)
- [BUILD_REPORT_AJUSTES_UI_UX_ADMIN_REQUEST_CONFIG_CRITICOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/reports/BUILD_REPORT_AJUSTES_UI_UX_ADMIN_REQUEST_CONFIG_CRITICOS.md)
- [DESIGN_FASE2E_2_EDITOR_RASCUNHO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2E_2_EDITOR_RASCUNHO_CHAMADOS.md)
- [DESIGN_FASE2E_4_HISTORICO_GERAL_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE2E_4_HISTORICO_GERAL_CHAMADOS.md)
- [WorkflowConfigDefinitionsTab.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/WorkflowConfigDefinitionsTab.tsx)
- [WorkflowVersionEditorDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/WorkflowVersionEditorDialog.tsx)
- [WorkflowDraftEditorPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/WorkflowDraftEditorPage.tsx)
- [WorkflowDraftReadinessPanel.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/WorkflowDraftReadinessPanel.tsx)
- [WorkflowDraftStepsSection.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/WorkflowDraftStepsSection.tsx)
- [WorkflowConfigHistoryTab.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/WorkflowConfigHistoryTab.tsx)
- [HistoryFiltersBar.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/history/HistoryFiltersBar.tsx)
- [ManagementToolbar.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/ManagementToolbar.tsx)
- [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx)
- [WorkflowConfigDefinitionsTab.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/__tests__/WorkflowConfigDefinitionsTab.test.tsx)
- [WorkflowVersionEditorDialog.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/__tests__/WorkflowVersionEditorDialog.test.tsx)
- [WorkflowDraftEditorPage.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/__tests__/WorkflowDraftEditorPage.test.tsx)
- [WorkflowDraftReadinessPanel.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/__tests__/WorkflowDraftReadinessPanel.test.tsx)
- [WorkflowDraftStepsSection.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/__tests__/WorkflowDraftStepsSection.test.tsx)
- [WorkflowConfigHistoryTab.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/__tests__/WorkflowConfigHistoryTab.test.tsx)
- [HistoryFiltersBar.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/history/__tests__/HistoryFiltersBar.test.tsx)

Referencias canonicas de UI usadas nesta correcao:

- familia visual `Admin CRUD / Gestao` de [src/app/(app)/admin/workflows/page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/admin/workflows/page.tsx)
- toolbar compacta com `draft/apply` de [ManagementToolbar.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/ManagementToolbar.tsx)
- shell de modal administrativo com header forte e footer de acao de [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx)

Em caso de divergencia:

1. prevalece o `DEFINE_CORRECOES_POS_BUILD_UI_UX_ADMIN_REQUEST_CONFIG_CRITICOS.md` para escopo e aceite;
2. depois prevalece o `DESIGN_AJUSTES_UI_UX_ADMIN_REQUEST_CONFIG_CRITICOS.md` para os invariantes do patch original;
3. depois prevalecem os designs da trilha `2E.2` e `2E.4` para contratos do editor e do historico;
4. depois prevalece a implementacao real do frontend ja entregue;
5. depois prevalece este documento para orientar o build corretivo.

---

## 3. Estado Atual e Gaps Reais

### 3.1. O que o patch anterior ja resolveu corretamente

- a aba `Definicoes` ja esta organizada por `area` e usa `Card`, `Accordion`, badges e CTAs no canon administrativo;
- o modal do editor ja tem `X` superior direito e footer fixo em `admin-primary`;
- `WorkflowDraftStepsSection` ja usa labels amigaveis para os valores do enum na UI, preservando o valor interno do payload;
- o `Historico Geral` ja usa `Popover` compacto e contador de filtros ativos;
- o editor e o historico seguem usando as mesmas queries, mutations e DTOs do patch anterior.

### 3.2. Lacunas objetivas observadas no codigo atual

- [WorkflowConfigDefinitionsTab.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/WorkflowConfigDefinitionsTab.tsx) ainda renderiza `area.types.map(...)` diretamente dentro do `AccordionContent` da area, deixando todo `WorkflowType` sempre expandido;
- o mesmo arquivo ainda usa `badgeVariantForStatus()` com `Publicada -> default` e `Ativa -> default`, o que nao atende a hierarquia pedida de `Publicada` em cinza escuro e `Ativa` em verde claro;
- [WorkflowDraftStepsSection.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/WorkflowDraftStepsSection.tsx) ainda exibe `Acao`, `Nenhuma acao`, `Aprovacao`, `Execucao` e ainda inicializa `step.action.label` com `Acao`;
- [WorkflowVersionEditorDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/WorkflowVersionEditorDialog.tsx) inicializa `shellState` com `isReadOnly: false`, e o footer e renderizado por `!shellState.isReadOnly`; isso permite o `flash` de CTAs editaveis enquanto o editor ainda carrega uma versao publicada;
- o dialog tambem nao reseta explicitamente `dirtyState` e `shellState` ao abrir outra versao, o que aumenta o risco de estado visual residual entre aberturas consecutivas;
- [WorkflowDraftReadinessPanel.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/editor/WorkflowDraftReadinessPanel.tsx) ainda renderiza um botao superior de `Publicar versao`, duplicando a acao principal do footer fixo no modo modal;
- [WorkflowConfigHistoryTab.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/WorkflowConfigHistoryTab.tsx) ainda passa `setFilters` diretamente para `HistoryFiltersBar`;
- [HistoryFiltersBar.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/admin-config/history/HistoryFiltersBar.tsx) ainda aplica cada mudanca por `onChange`, sem estado draft e sem CTA explicito de aplicar.

### 3.3. Invariantes que esta microetapa precisa preservar

- `WorkflowConfigPage` continua dirigindo tabs e abertura do editor por search params;
- `createWorkflowDraft`, `publishWorkflowVersion`, `activateWorkflowVersion`, `fetchWorkflowConfigHistory` e `fetchWorkflowDraftEditor` permanecem sem mudanca de contrato;
- `WorkflowDraftEditorPage` continua sendo a origem das mutations de salvar/publicar;
- enums internos de acao (`approval`, `acknowledgement`, `execution`) e `AdminHistoryFilters` permanecem intactos;
- o grid e o detalhe de historico continuam estritamente read-only;
- a cor primaria administrativa continua `bg-admin-primary hover:bg-admin-primary/90`.

---

## 4. Arquitetura da Solucao

### 4.1. Diagrama arquitetural

```text
Admin with canManageWorkflowsV2
  |
  +--> /admin/request-config
  |      |
  |      +--> Tab: Definicoes
  |      |      |
  |      |      +--> area Accordion (existente)
  |      |      |      |
  |      |      |      \--> workflow-type Accordion (novo)
  |      |      |             |- trigger = resumo do tipo
  |      |      |             |- sibling actions = Editar/Nova versao
  |      |      |             \--> content = lista de versoes
  |      |      |
  |      |      \--> badges locais
  |      |             |- Publicada = cinza escuro
  |      |             \- Ativa = verde claro
  |      |
  |      +--> WorkflowVersionEditorDialog
  |      |      |
  |      |      +--> WorkflowDraftEditorPage
  |      |      |      \--> emite shellState { isHydrated, isReadOnly, submitDraft, publishVersion }
  |      |      |
  |      |      +--> header fixo + close X
  |      |      +--> body rolavel
  |      |      \--> footer fixo
  |      |             \- renderiza apenas quando isHydrated && !isReadOnly
  |      |
  |      \--> Tab: Historico Geral
  |             |
  |             +--> committedFilters
  |             +--> draftFilters (novo)
  |             +--> HistoryFiltersBar
  |             |      |- edita draft local
  |             |      |- Limpar
  |             |      \- Aplicar filtros
  |             |
  |             \--> query React Query usa committedFilters
  |
  \--> Existing API + Firestore
         |- /api/admin/request-config/catalog
         |- /api/admin/request-config/history
         |- /api/admin/request-config/workflow-types/[id]/versions/[version]
         \- Sem mudancas de contrato
```

### 4.2. Fluxo fechado por camada

```text
LAYER 1 - Definicoes
1. A area continua sendo o agrupador macro.
2. Dentro de cada area, cada WorkflowType vira um AccordionItem proprio.
3. O resumo do tipo fica sempre visivel; as versoes so aparecem ao expandir o tipo.
4. Os CTAs do tipo ficam fora do trigger para evitar nested buttons.

LAYER 2 - Editor modal
5. O dialog passa a tratar "shell resolvido" como estado explicito.
6. Enquanto o editor nao hidratou, nao existe footer editavel.
7. Quando a versao resolve para read-only, o footer permanece ausente.
8. Quando a versao resolve para draft editavel, o footer aparece com Salvar/Publicar.
9. O painel de readiness permanece informativo, sem CTA superior de publish no modo modal.

LAYER 3 - Copy de Acao
10. A traducao continua local ao componente, sem alterar enum interno.
11. O rotulo default criado ao selecionar uma acao passa a ser `Ação`, e nenhuma string `Acao` sem acento permanece visivel nessa superficie.
12. Ao trocar o tipo de acao, o sistema preserva um label customizado existente quando possivel; se o label estiver vazio, usa o default amigavel.

LAYER 4 - Historico Geral
13. O estado de query passa a usar apenas filtros confirmados.
14. O popover trabalha com rascunho local de filtros.
15. Typing e selecoes nao disparam query imediatamente.
16. "Aplicar filtros" confirma o rascunho, atualiza a query e fecha o popover.

LAYER 5 - Testes
17. As suites deixam de provar comportamento imediato do filtro.
18. O dialog passa a provar ausencia de CTA editavel antes da hidratacao.
19. O catalogo passa a provar colapso por WorkflowType e nova hierarquia de badges.
```

### 4.3. Estado de frontend impactado

| Estado | Armazenamento | Mudanca |
|-------|---------------|---------|
| `open`, `workflowTypeId`, `version` | search params | Nenhuma |
| `dirtyState` | `useState` em `WorkflowVersionEditorDialog` | Mantido, mas resetado em trocas de versao/abertura |
| `shellState` | `useState` em `WorkflowVersionEditorDialog` | Ganha `isHydrated` e passa a ser resetado quando a sessao muda |
| `editorMode` | derivado de `draftQuery.data.draft.mode` | Nenhuma mudanca funcional |
| `committedFilters` | `useState<AdminHistoryFilters>` em `WorkflowConfigHistoryTab` | Mantido como fonte da query |
| `draftFilters` | `useState<AdminHistoryFilters>` em `WorkflowConfigHistoryTab` | Novo estado de edicao dentro do popover |
| `activeFilterCount` | derivado de `committedFilters` | Mantido |

### 4.4. Solucao detalhada por gap

#### 4.4.1. Accordion por `WorkflowType`

Escolha fechada:

- manter o `Accordion` externo de `areas` como esta;
- dentro de cada `AccordionContent` de area, introduzir um `Accordion` secundario para `workflow types`;
- cada `workflowType` vira um `AccordionItem` colapsado por padrao;
- o trigger mostra `name`, `description`, owner, contagem de versoes e badges de status;
- o bloco de acoes (`Editar rascunho` ou `Nova versao draft`) fica como sibling do trigger no header do item, nunca dentro do botao do trigger;
- a lista de versoes migra inteira para o `AccordionContent` do tipo.

Consequencias:

- catálogos longos deixam de abrir tudo por padrao;
- a acao principal do tipo continua acessivel mesmo com o item recolhido;
- o design reaproveita `Accordion`, `Card`, `Badge` e `Button` ja usados no dominio.

#### 4.4.2. Semantica visual das badges

Escolha fechada:

- parar de depender apenas de `variant` para `Publicada` e `Ativa`;
- usar helper local de apresentacao para classes de badge:
  - `Publicada`: `border-slate-700 bg-slate-800 text-white`
  - `publishedVersionLabel` no header do `WorkflowType`: reutiliza exatamente a mesma classe neutra escura de `Publicada`, sem manter o dourado atual
  - `Inativa`: pode continuar em `secondary`
  - `Rascunho`: pode continuar em `outline`
  - `Ativa`: `border-emerald-200 bg-emerald-100 text-emerald-800`
- nao criar variante global nova em `src/components/ui/badge.tsx`, para manter o patch local e de baixo risco.

Nota de implementacao:

- `WorkflowConfigDefinitionsTab.tsx` deve ter regra explicita tanto para a badge de status por versao quanto para a badge superior de `workflowType.publishedVersionLabel`;
- ambas as badges de publicacao precisam compartilhar a mesma semantica visual neutra escura.

#### 4.4.3. Copy final de `Acao`

Strings-alvo da microcorrecao:

- `Acao` -> `Ação`
- `Nenhuma acao` -> `Nenhuma ação`
- `Aprovacao` -> `Aprovação`
- `Execucao` -> `Execução`
- `Rotulo da acao` -> `Rótulo da ação`
- `Comentario obrigatorio` -> `Comentário obrigatório`

Regra de inicializacao do label:

- introduzir `DEFAULT_ACTION_LABEL = 'Ação'`;
- ao selecionar uma acao a partir de `none`, criar `step.action.label = 'Ação'`;
- ao trocar entre acoes nao-`none`, preservar `step.action.label` atual se ele tiver conteudo nao vazio;
- nunca sobrescrever um label que o usuario ja editou manualmente;
- continuar persistindo `type` com os enums atuais.

#### 4.4.4. Gating do footer por hidratacao

Escolha fechada:

- estender `WorkflowDraftEditorShellState` com `isHydrated: boolean`;
- o estado inicial do dialog vira:
  - `isHydrated: false`
  - `isReadOnly: false`
  - `canPublish: false`
  - handlers noop
- `WorkflowVersionEditorDialog` reseta `shellState` e `dirtyState` sempre que `open`, `workflowTypeId` ou `version` mudarem;
- `WorkflowDraftEditorPage` so emite `isHydrated: true` quando `draftQuery.data` existir e o `editorMode` estiver resolvido;
- em loading, erro ou transicao entre versoes, o dialog nao renderiza footer editavel;
- condicao final do footer: `shellState.isHydrated && !shellState.isReadOnly`.

Resultado esperado:

- versoes publicadas nao piscam com `Salvar rascunho` e `Publicar versao`;
- mudancas de versao dentro do mesmo modal nao reaproveitam shell visual da sessao anterior;
- o loading do corpo continua sendo mostrado apenas pelo editor embedded.

#### 4.4.5. Remocao do CTA redundante de `Publicar versao`

Escolha fechada:

- `WorkflowDraftReadinessPanel` deixa de ser origem primaria da acao de publicar quando usado dentro do modal;
- introduzir prop explicita `showPublishAction?: boolean`, com default conservador para manter reuso;
- `WorkflowDraftEditorPage` passa `showPublishAction={!embedded && !hidePrimaryActions}` ou equivalente;
- no caminho do modal embedded, o painel continua exibindo titulo, resumo de readiness e lista de issues, mas sem botao superior de publicar.

Resultado:

- publicar fica centralizado no footer fixo do modal;
- o painel volta a comunicar readiness, nao acao primaria;
- o editor standalone continua com possibilidade de manter CTA superior se esse fluxo voltar a ser usado.

#### 4.4.6. Filtro compacto com `Aplicar filtros`

Escolha fechada:

- `WorkflowConfigHistoryTab` passa a manter dois estados:
  - `filters`: estado confirmado que alimenta o query key
  - `draftFilters`: estado local do popover
- ao abrir o popover, `draftFilters` e sincronizado com `filters`;
- `HistoryFiltersBar` deixa de aplicar `onChange` diretamente na query;
- o popover passa a usar copy alinhada ao canon do `ManagementToolbar`: ajustar e confirmar;
- botoes finais:
  - `Limpar`: reseta apenas o draft para `INITIAL_FILTERS`
  - `Aplicar filtros`: copia `draftFilters` para `filters` e fecha o popover
- a badge de contagem continua refletindo apenas `filters`, nao o draft.

Resultado:

- a UX fica coerente com o padrao de `/gestao-de-chamados`;
- o grid nao refaz query a cada tecla digitada;
- o comportamento continua compacto e previsivel.

---

## 5. Architecture Decisions

### ADR-UIFIX-001: `WorkflowType` vira o nivel colapsavel, sem trocar o agrupamento macro por area

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-16 |
| Context | O patch anterior melhorou a composicao da aba `Definicoes`, mas ainda deixa todas as versoes abertas dentro de cada `WorkflowType`. |

**Choice:** manter `area` como agrupador macro e introduzir um accordion interno para `workflow types`, colapsado por padrao.

**Rationale:**

1. resolve o ruido visual exatamente no ponto reclamado;
2. preserva a semantica `area -> workflow type -> versions` ja usada no catalogo;
3. evita redesign amplo da aba.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| colapsar a propria area e deixar o tipo sempre aberto | o problema observado continua dentro da area expandida |
| trocar a aba por tabela flat de versoes | perde contexto do tipo e expande demais o escopo |
| usar tabs por tipo | ruim para catalogos longos e menos aderente ao padrao atual |

**Consequences:**

- positivo: leitura escalavel em catalogos maiores;
- negativo: adiciona um segundo nivel de accordion que precisa ser bem composto para nao criar nested button.

### ADR-UIFIX-002: O dialog so mostra footer editavel depois de o shell resolver `isHydrated`

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-16 |
| Context | O estado inicial do dialog assume editabilidade e gera affordance incorreta em versoes publicadas ou ainda em carregamento. |

**Choice:** tornar a hidratacao do shell um estado explicito do contrato `WorkflowDraftEditorShellState`.

**Rationale:**

1. elimina o `flash` de CTA editavel;
2. torna o comportamento previsivel ao trocar de versao no mesmo dialog;
3. nao altera nenhuma mutation nem o DTO carregado.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| inferir readiness do footer apenas por `dirtyState` | `dirtyState` nao sabe se a versao e `read-only` |
| esconder footer apenas quando `draftQuery.isLoading` no filho | o estado decisivo vive no dialog e precisa ser resetado na borda do modal |
| aceitar o flash como custo de loading | contradiz o criterio principal do define |

**Consequences:**

- positivo: shell do modal fica semanticamente correto;
- negativo: adiciona uma prop a mais no estado de orquestracao visual.

### ADR-UIFIX-003: O publish do modal fica centralizado no footer; o readiness panel vira apenas contexto

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-16 |
| Context | O build anterior deixou dois pontos de `Publicar versao`: readiness panel e footer fixo. |

**Choice:** ocultar o CTA superior no caminho embedded/modal e manter o footer como unica acao primaria de publish.

**Rationale:**

1. reduz duplicidade visual;
2. aproxima o modal do padrao administrativo de acao unica no rodape;
3. preserva o painel como suporte de contexto e diagnostico.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| manter os dois botoes e confiar na consistencia de disabled/pending | ainda cria ruido e competicao entre CTAs |
| remover o footer e deixar apenas o painel | contradiz o patch anterior e piora a ergonomia do modal |

**Consequences:**

- positivo: menor carga cognitiva no editor;
- negativo: exige atualizar testes que hoje assumem botao no panel.

### ADR-UIFIX-004: O filtro compacto do historico adota `draft/apply`, nao `onChange` imediato

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-16 |
| Context | O define corretivo relaxa a exigencia de aplicar filtros imediatamente e o canon local do projeto para popovers compactos ja usa `draft + apply`. |

**Choice:** mover o historico para o mesmo padrao do `ManagementToolbar`, com rascunho local e CTA `Aplicar filtros`.

**Rationale:**

1. reduz ruido de requisições enquanto o usuario ainda esta compondo o recorte;
2. aproxima a UX do padrao administrativo ja aprovado;
3. mantem o shell compacto.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| manter `onChange` imediato e apenas alterar copy | nao resolve o requisito comportamental |
| expandir uma barra fixa fora do popover | reabre o redesign rejeitado no define |

**Consequences:**

- positivo: interacao mais deliberada e consistente;
- negativo: adiciona um estado draft local para sincronizar.

---

## 6. File Manifest

### Ordem de execucao

| Phase | Files | Agent |
|-------|-------|-------|
| 1. Definitions | `WorkflowConfigDefinitionsTab.tsx` | @react-frontend-developer |
| 2. Editor shell | `editor/types.ts`, `WorkflowVersionEditorDialog.tsx`, `WorkflowDraftEditorPage.tsx`, `WorkflowDraftReadinessPanel.tsx`, `WorkflowDraftStepsSection.tsx` | @react-frontend-developer |
| 3. History filters | `WorkflowConfigHistoryTab.tsx`, `history/HistoryFiltersBar.tsx` | @react-frontend-developer |
| 4. Tests | test suites de `DefinitionsTab`, `VersionEditorDialog`, `DraftEditorPage`, `DraftReadinessPanel`, `DraftStepsSection`, `HistoryTab`, `HistoryFiltersBar` | @react-frontend-developer |

### Manifesto detalhado

| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | `src/components/workflows/admin-config/WorkflowConfigDefinitionsTab.tsx` | Modify | Introduzir accordion por `WorkflowType`, reorganizar resumo do tipo e aplicar nova hierarquia visual de badges | @react-frontend-developer | - |
| 2 | `src/components/workflows/admin-config/editor/types.ts` | Modify | Adicionar `isHydrated` ao shell state do editor | @react-frontend-developer | - |
| 3 | `src/components/workflows/admin-config/WorkflowVersionEditorDialog.tsx` | Modify | Resetar estado entre aberturas e gatear footer por shell hidratado | @react-frontend-developer | #2 |
| 4 | `src/components/workflows/admin-config/editor/WorkflowDraftEditorPage.tsx` | Modify | Emitir shell state hidratado apenas apos resolver query/modo e esconder publish superior no caminho embedded | @react-frontend-developer | #2, #5 |
| 5 | `src/components/workflows/admin-config/editor/WorkflowDraftReadinessPanel.tsx` | Modify | Tornar o CTA superior opcional e manter o painel informativo | @react-frontend-developer | - |
| 6 | `src/components/workflows/admin-config/editor/WorkflowDraftStepsSection.tsx` | Modify | Corrigir labels PT-BR e default label `Ação` preservando enums internos | @react-frontend-developer | - |
| 7 | `src/components/workflows/admin-config/WorkflowConfigHistoryTab.tsx` | Modify | Separar `filters` confirmados de `draftFilters` editados no popover | @react-frontend-developer | #8 |
| 8 | `src/components/workflows/admin-config/history/HistoryFiltersBar.tsx` | Modify | Converter a barra para rascunho editavel com `Limpar` e `Aplicar filtros` | @react-frontend-developer | - |
| 9 | `src/components/workflows/admin-config/__tests__/WorkflowConfigDefinitionsTab.test.tsx` | Modify | Cobrir colapso por tipo, badges e visibilidade de versoes | @react-frontend-developer | #1 |
| 10 | `src/components/workflows/admin-config/editor/__tests__/WorkflowDraftStepsSection.test.tsx` | Modify | Cobrir labels com acento, default label `Ação` e preservacao do enum interno | @react-frontend-developer | #6 |
| 11 | `src/components/workflows/admin-config/__tests__/WorkflowVersionEditorDialog.test.tsx` | Modify | Cobrir ausencia de footer antes da hidratacao e modo read-only sem flash | @react-frontend-developer | #2, #3, #4 |
| 12 | `src/components/workflows/admin-config/__tests__/WorkflowDraftEditorPage.test.tsx` | Modify | Ajustar expectativa do readiness panel e do controller embedded | @react-frontend-developer | #4, #5 |
| 13 | `src/components/workflows/admin-config/__tests__/WorkflowDraftReadinessPanel.test.tsx` | Modify | Cobrir `showPublishAction=false` e permanencia do painel informativo | @react-frontend-developer | #5 |
| 14 | `src/components/workflows/admin-config/__tests__/WorkflowConfigHistoryTab.test.tsx` | Modify | Provar que typing/select nao filtram ate `Aplicar filtros` | @react-frontend-developer | #7, #8 |
| 15 | `src/components/workflows/admin-config/history/__tests__/HistoryFiltersBar.test.tsx` | Modify | Trocar a suite de `immediate change` por `draft/apply` | @react-frontend-developer | #8 |

---

## 7. Code Patterns

### Pattern 1: shell state hidratado do editor

```typescript
// src/components/workflows/admin-config/editor/types.ts
export type WorkflowDraftEditorShellState = {
  submitDraft: () => void;
  publishVersion: () => void;
  isSaving: boolean;
  isPublishing: boolean;
  canPublish: boolean;
  isReadOnly: boolean;
  isHydrated: boolean;
};

const INITIAL_SHELL_STATE: WorkflowDraftEditorShellState = {
  submitDraft: () => {},
  publishVersion: () => {},
  isSaving: false,
  isPublishing: false,
  canPublish: false,
  isReadOnly: true,
  isHydrated: false,
};
```

```typescript
// src/components/workflows/admin-config/WorkflowVersionEditorDialog.tsx
useEffect(() => {
  if (!open) {
    return;
  }

  setDirtyState({ isDirty: false, isReadOnly: true });
  setShellState(INITIAL_SHELL_STATE);
}, [open, workflowTypeId, version]);

const showEditableFooter = shellState.isHydrated && !shellState.isReadOnly;
```

### Pattern 2: accordion por `WorkflowType` sem nested button

```tsx
// src/components/workflows/admin-config/WorkflowConfigDefinitionsTab.tsx
<Accordion type="multiple" className="space-y-3">
  {area.types.map((workflowType) => (
    <AccordionItem
      key={workflowType.workflowTypeId}
      value={workflowType.workflowTypeId}
      className="rounded-lg border border-border/70 bg-card"
    >
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <AccordionTrigger className="min-w-0 flex-1 py-0 hover:no-underline">
            <div className="min-w-0 space-y-3 text-left">
              <CardTitle className="text-lg">{workflowType.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {workflowType.description || 'Sem descricao cadastrada.'}
              </p>
            </div>
          </AccordionTrigger>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {draftVersion ? (
              <Button size="sm" className="bg-admin-primary text-primary-foreground hover:bg-admin-primary/90">
                Editar rascunho
              </Button>
            ) : (
              <Button size="sm" variant="outline">
                Nova versao draft
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <AccordionContent>
        <CardContent className="space-y-3 pt-0">
          {workflowType.versions.map(renderVersionCard)}
        </CardContent>
      </AccordionContent>
    </AccordionItem>
  ))}
</Accordion>
```

### Pattern 3: label default e traducao de `Ação`

```typescript
// src/components/workflows/admin-config/editor/WorkflowDraftStepsSection.tsx
const DEFAULT_ACTION_LABEL = 'Ação';
const actionTypeLabels = {
  none: 'Nenhuma ação',
  approval: 'Aprovação',
  acknowledgement: 'Ciência',
  execution: 'Execução',
} as const;

function buildNextAction(
  previousLabel: string | undefined,
  nextType: 'approval' | 'acknowledgement' | 'execution',
) {
  return {
    type: nextType,
    label: previousLabel?.trim() ? previousLabel : DEFAULT_ACTION_LABEL,
    approvers: [],
    unresolvedApproverIds: [],
    commentRequired: false,
    attachmentRequired: false,
    commentPlaceholder: '',
    attachmentPlaceholder: '',
  };
}
```

### Pattern 4: filtro draft/apply no `Historico Geral`

```tsx
// src/components/workflows/admin-config/WorkflowConfigHistoryTab.tsx
const [filters, setFilters] = React.useState<AdminHistoryFilters>(INITIAL_FILTERS);
const [draftFilters, setDraftFilters] = React.useState<AdminHistoryFilters>(INITIAL_FILTERS);
const [filtersOpen, setFiltersOpen] = React.useState(false);

const handleOpenChange = (nextOpen: boolean) => {
  setFiltersOpen(nextOpen);
  if (nextOpen) {
    setDraftFilters(filters);
  }
};

const handleApplyFilters = () => {
  setFilters(draftFilters);
  setFiltersOpen(false);
};

<Popover open={filtersOpen} onOpenChange={handleOpenChange}>
  <PopoverContent>
    <HistoryFiltersBar
      filters={draftFilters}
      onChange={setDraftFilters}
      onClear={() => setDraftFilters(INITIAL_FILTERS)}
      onApply={handleApplyFilters}
    />
  </PopoverContent>
</Popover>
```

---

## 8. API Contract

Nenhum endpoint novo ou alterado.

As rotas abaixo permanecem com o mesmo contrato:

- `GET /api/admin/request-config/catalog`
- `GET /api/admin/request-config/history`
- `GET /api/admin/request-config/history/[origin]/[requestKey]`
- `GET /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]`
- `PUT /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]`
- `POST /api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]/publish`

---

## 9. Database Schema

Nenhuma mudanca no schema.

Sem alteracoes em:

- `workflowTypes_v2/{workflowTypeId}`
- `workflowTypes_v2/{workflowTypeId}/versions/{version}`
- read models do `Historico Geral`

---

## 10. Testing Strategy

### Unit / component tests

| Component | Test |
|-----------|------|
| `WorkflowConfigDefinitionsTab` | provar que `WorkflowType` inicia recolhido, exibe resumo no trigger e so mostra versoes apos expandir o tipo |
| `WorkflowConfigDefinitionsTab` | provar a nova hierarquia visual das badges de `Publicada` e `Ativa`; se a assercao de classe ficar fragil, extrair helper local e testá-lo diretamente |
| `WorkflowDraftStepsSection` | provar labels com acento, `DEFAULT_ACTION_LABEL = 'Ação'` e preservacao do enum interno |
| `WorkflowVersionEditorDialog` | provar que nao ha `Salvar rascunho` nem `Publicar versao` antes de `isHydrated=true` |
| `WorkflowVersionEditorDialog` | provar que uma abertura read-only nao mostra footer editavel nem por um frame logico de teste |
| `WorkflowDraftReadinessPanel` | provar que o painel continua informativo sem CTA quando `showPublishAction=false` |
| `HistoryFiltersBar` | provar edicao de draft sem disparar `onApply` ate clicar em `Aplicar filtros` |
| `WorkflowConfigHistoryTab` | provar que a grid so refiltra apos `Aplicar filtros` e que a badge segue refletindo filtros confirmados |

### Integration-focused regression

| Flow | Test |
|------|------|
| abrir uma versao draft no modal | footer aparece apenas depois da hidratacao e aciona as mesmas mutations existentes |
| abrir uma versao publicada no modal | footer nunca aparece e o close continua sem confirmacao de dirty editavel |
| alternar entre duas versoes no mesmo shell | o estado visual anterior nao vaza para a nova abertura |
| compor filtros no historico | typing/select nao refaz query ate aplicacao explicita |

### Acceptance tests

```gherkin
GIVEN uma area expandida na aba Definicoes
WHEN a tela renderiza um WorkflowType
THEN apenas o resumo do tipo fica visivel
AND as versoes aparecem somente quando o tipo e expandido
```

```gherkin
GIVEN uma versao publicada aberta no modal
WHEN o editor ainda esta carregando e depois resolve para read-only
THEN nenhum CTA editavel aparece no footer em nenhum momento
```

```gherkin
GIVEN o popover de filtros do Historico Geral aberto
WHEN o admin digita uma busca e muda a origem
THEN a grid nao muda ate clicar em "Aplicar filtros"
```

---

## 11. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | Reverter o patch dos componentes de `admin-config` desta microetapa | O catalogo volta ao comportamento anterior e os testes corretivos falham como esperado |
| 2 | Restaurar o shell anterior do modal | O footer volta a aparecer imediatamente, confirmando que o diff foi revertido |
| 3 | Restaurar `onChange` imediato do historico | A query volta a reagir a typing/select sem `Aplicar filtros` |

Metodo rapido: `git revert <commit-da-microetapa>`

Como a entrega e estritamente frontend, nao ha rollback de dados, migracao ou compensacao server-side.

---

## 12. Implementation Checklist

### Pre-build

- [x] DEFINE corretivo lido e aderente ao escopo
- [x] Parent design e build report anterior revisados
- [x] Componentes e testes reais inspecionados
- [x] Referencia canonica minima de `Admin CRUD / Gestao` e `ManagementToolbar` consultada

### Build target

- [ ] `WorkflowType` colapsa por padrao e lista de versoes vai para `AccordionContent`
- [ ] badges `Publicada` e `Ativa` usam a hierarquia cromatica aprovada
- [ ] nenhuma string visual `Acao` sem acento permanece nessa superficie
- [ ] footer do modal so aparece com `isHydrated && !isReadOnly`
- [ ] o publish superior some no caminho modal
- [ ] o historico deixa de aplicar filtros a cada `onChange`
- [ ] suites afetadas sao atualizadas para o comportamento final

---

## 13. Specialist Instructions

### For @react-frontend-developer

```markdown
Files to modify:
- src/components/workflows/admin-config/WorkflowConfigDefinitionsTab.tsx
- src/components/workflows/admin-config/WorkflowVersionEditorDialog.tsx
- src/components/workflows/admin-config/editor/types.ts
- src/components/workflows/admin-config/editor/WorkflowDraftEditorPage.tsx
- src/components/workflows/admin-config/editor/WorkflowDraftReadinessPanel.tsx
- src/components/workflows/admin-config/editor/WorkflowDraftStepsSection.tsx
- src/components/workflows/admin-config/WorkflowConfigHistoryTab.tsx
- src/components/workflows/admin-config/history/HistoryFiltersBar.tsx
- related test files

Key requirements:
- nao tocar em api-client, DTOs ou runtime types;
- evitar criar variant global nova de Badge para um ajuste local de catalogo;
- manter CTAs principais em admin-primary;
- garantir que o dialog resete estado visual ao trocar de versao;
- seguir o padrao de draft/apply do ManagementToolbar, sem reabrir redesign do grid.
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-16 | Codex (`design`, `uiux-connect`) | Initial corrective design for the post-build UI/UX gaps in `/admin/request-config`. |
| 1.1 | 2026-04-16 | Codex (`iterate`) | Clarified shell-state reset across modal reopen/version switches and made the workflow-type header `publishedVersionLabel` badge follow the same dark-neutral rule as `Publicada`. |
