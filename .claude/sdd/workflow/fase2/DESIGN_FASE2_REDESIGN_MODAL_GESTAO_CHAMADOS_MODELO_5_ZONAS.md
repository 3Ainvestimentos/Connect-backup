# DESIGN: Fase 2 - Shell de 5 zonas do modal de gestao de chamados

> Generated: 2026-04-17
> Version: 1.2
> Status: Ready for build
> Source: `DEFINE_REDESIGN_MODAL_GESTAO_CHAMADOS_MODELO_5_ZONAS.md`
> Scope: somente Fase 2 (`Shell de 5 Zonas`)
> Depends on: `DESIGN_FASE1_REDESIGN_MODAL_GESTAO_CHAMADOS_MODELO_5_ZONAS.md`

## 1. Requirements Summary

### Problem

O modal oficial de `/gestao-de-chamados` ja usa contrato e permissoes consolidados, mas ainda materializa o detalhe em blocos paralelos (`resumo`, `hero`, `action`, `administracao`, `progress`, `timeline`, `dados`, `anexos`) que nao correspondem ao modelo de produto aprovado de 5 zonas. A Fase 2 precisa transformar esse shell em uma leitura unica e hierarquizada, consumindo `summary.areaLabel` e `stepsHistory[]` como fonte oficial do cabecalho, do resumo amigavel e do historico por etapa.

### Success Criteria

| Criterion | Target |
|-----------|--------|
| Cabecalho executivo oficial | o topo do modal sempre mostra `requestId`, workflow/tipo, status macro e etapa atual sem depender apenas do `DialogDescription` |
| Cinco zonas explicitas | o corpo passa a expor, nesta ordem, `cabecalho do chamado`, `resumo do chamado`, `acao atual`, `historico por etapa` e `dados enviados` |
| Acao atual unificada | `advance`, `finalize`, `requestAction`, `respondAction`, atribuicao e `archive` passam a ser lidos dentro de uma unica macrozona perceptiva, sem competir com cards informativos |
| Historico por etapa oficial | `stepsHistory[]` vira a superficie principal do historico; `progress` e `timeline` deixam de ser a leitura primaria do modal |
| Dados enviados consolidados | `formData` e `attachments` do formulario original passam a ser renderizados numa mesma zona de leitura |
| Footer rebaixado | o footer passa a conter apenas `Fechar` e acoes globais nao operacionais, sem depender dele para o CTA principal |
| Canon do Connect preservado | o dialog continua usando a familia admin/gestao do app e o modal canonico de `/requests` como referencia de densidade, scroll e separadores |

### Constraints

- a entrypoint publica continua sendo `RequestDetailDialog`;
- nenhum endpoint, permissao, regra de runtime ou semantica de transicao sera alterado nesta fase;
- a prioridade visual continua 100% dirigida pelo payload oficial (`permissions`, `action`, `summary`, `stepsHistory`);
- a Fase 2 depende da Fase 1 ter entregue `summary.areaLabel` e `stepsHistory` no read-side e no espelho de management;
- `canArchive` continua existente, mas visualmente rebaixado em relacao ao proximo passo do fluxo;
- `respondAction` nao move etapa sozinho e continua subordinado ao runtime atual;
- o design deve reaproveitar primitives existentes (`Dialog`, `ScrollArea`, `Card`, `Badge`, `Button`, `Separator`) antes de criar variantes novas;
- o modal precisa continuar legivel em desktop e mobile sem clipping de CTA ou perda de scroll.

## 2. Architecture

### Source of Truth

Este design foi elaborado a partir de:

- [DEFINE_REDESIGN_MODAL_GESTAO_CHAMADOS_MODELO_5_ZONAS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_REDESIGN_MODAL_GESTAO_CHAMADOS_MODELO_5_ZONAS.md)
- [DESIGN_FASE1_REDESIGN_MODAL_GESTAO_CHAMADOS_MODELO_5_ZONAS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_FASE1_REDESIGN_MODAL_GESTAO_CHAMADOS_MODELO_5_ZONAS.md)
- [BRAINSTORM_REDESIGN_MODAL_GESTAO_CHAMADOS_MODELO_5_ZONAS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/BRAINSTORM_REDESIGN_MODAL_GESTAO_CHAMADOS_MODELO_5_ZONAS.md)
- [RequestDetailDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestDetailDialog.tsx)
- [RequestOperationalHero.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestOperationalHero.tsx)
- [RequestActionCard.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestActionCard.tsx)
- [RequestAdministrativePanel.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestAdministrativePanel.tsx)
- [request-detail-view-model.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/request-detail-view-model.ts)
- [RequestDetailDialog.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx)
- [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx)
- `uiux-connect` canon: familia `Admin CRUD / Gestao`, com modal de referencia em `/requests`

Em caso de divergencia:

1. prevalece o DEFINE para escopo e aceite;
2. prevalece o contrato enriquecido da Fase 1 para `areaLabel` e `stepsHistory`;
3. prevalece este design para a composicao do shell, fallback transitorio e estrategia de testes do modal.

### Current Snapshot

O snapshot atual do codigo revela cinco gaps que a Fase 2 precisa fechar:

1. o `DialogHeader` ainda e minimalista e nao opera como zona executiva do chamado;
2. `summary.areaId` ainda ocupa a UI de resumo, mesmo que o contrato enriquecido da Fase 1 preveja `areaLabel`;
3. a leitura de "acao atual" continua repartida entre `RequestOperationalHero`, `RequestActionCard` e `RequestAdministrativePanel` como blocos independentes;
4. `RequestProgress` e `RequestTimeline` ainda sao superficies primarias, apesar de o desenho aprovado exigir historico por etapa;
5. `RequestFormData` e `RequestAttachments` ainda vivem separados, enfraquecendo a zona `dados enviados`.

### Canon Alignment

Familia visual escolhida: `Admin CRUD / Gestao`.

Referencias canonicas aplicadas:

- shell de modal detalhado/revisao: [RequestApprovalModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/requests/RequestApprovalModal.tsx)
- densidade administrativa: `/requests` e `/admin/workflows`
- primitives obrigatorias: `DialogContent` com scroll interno, `DialogHeader` contextual, secoes internas separadas e CTA primario no token `bg-admin-primary hover:bg-admin-primary/90`

Implicacoes visuais:

- o modal continua administrativo, nao "landing page";
- a estrutura interna usa secoes verticais claras, nao mosaico de cards sem hierarquia;
- badges, hover e botoes seguem a linguagem existente do Connect;
- qualquer nova subcomponente deve nascer como combinacao de primitives atuais, nao como sistema visual paralelo.

### System Diagram

```text
Authenticated operator
  |
  \--> RequestDetailDialog
         |
         +--> buildRequestOperationalViewModel(detail)
         |      |- header chips and executive labels
         |      |- current action priority
         |      \- administrative demotion rules
         |
         +--> Zone 1: RequestDetailHeader
         |      \- summary + status/papel badges
         |
         +--> Zone 2: RequestSummarySection
         |      \- requester / responsible / areaLabel / owner / dates
         |
         +--> Zone 3: RequestCurrentActionSection
         |      |- RequestOperationalHero (refined)
         |      |- RequestActionCard (embedded as current-step surface)
         |      \- RequestAdministrativePanel (demoted, same contract)
         |
         +--> Zone 4: RequestStepHistorySection
         |      |- stepsHistory[] (preferred source)
         |      |- step accordion/cards
         |      \- legacy fallback: progress + timeline only if payload is absent during rollout
         |
         +--> Zone 5: RequestSubmittedDataSection
         |      |- formData.fields
         |      |- formData.extraFields
         |      \- attachments[] from original submission
         |
         \--> DialogFooter
                \- close-only / low-priority globals
```

### Data Flow

```text
LAYER 1 (Dialog shell)
1. `RequestDetailDialog` continua recebendo `detail`, mutacoes e loading/error do hook atual.
2. O componente deixa de ser uma grade de cards e passa a ser um orquestrador de cinco zonas ordenadas.

LAYER 2 (Executive interpretation)
3. `buildRequestOperationalViewModel()` cresce para derivar:
   - estado operacional atual;
   - copy executiva do cabecalho;
   - prioridade visual entre CTA principal, action e administracao;
   - labels amigaveis do resumo usando `summary.areaLabel ?? summary.areaId`.
4. `buildRequestDetailShellViewModel()` compoe o resultado de `buildRequestOperationalViewModel(detail)`; ele nao substitui o contrato operacional atual usado por `RequestOperationalHero`.

LAYER 3 (Current action zone)
5. `RequestOperationalHero` continua exibindo o proximo passo, mas deixa de competir com action/admin.
6. `RequestActionCard` continua sendo a superficie oficial de `requestAction/respondAction`, agora encaixada como subzona da etapa atual.
7. `RequestAdministrativePanel` continua usando o mesmo contrato funcional, mas renderizado como subzona secundaria dentro da macrozona `acao atual`.

LAYER 4 (Step history zone)
8. `stepsHistory[]` vira a fonte primaria do historico.
9. Cada etapa renderiza:
   - nome, ordem, kind, state e flag `isCurrent`;
   - eventos da etapa;
   - respostas de action da etapa;
   - estado vazio explicito quando nao houver eventos ou respostas.
10. `progress` e `timeline` permanecem apenas como fallback tecnico de rollout e nao como shell final.

LAYER 5 (Submitted data zone)
11. `formData` e `attachments` passam a ser compostos por um unico componente de leitura.
12. A zona deixa claro que anexos ali pertencem a abertura do chamado, nao ao historico operacional da etapa.
```

### State Management

| State | Storage | Lifecycle |
|-------|---------|-----------|
| `detail` | React Query / prop do dialog | permanece vindo do hook atual, sem mudanca de fetch |
| `selectedResponsibleId` | `useState` em `RequestDetailDialog` | preservado; continua resetando quando o detalhe muda |
| `operationalViewModel` | derivado em memoria | recalculado a cada render do detalhe; permanece sendo o contrato consumido por `RequestOperationalHero` |
| `shellViewModel` | derivado em memoria | composto a partir de `buildRequestOperationalViewModel(detail)` + dados do shell de 5 zonas |
| `expandedStepIds` | `useState` local da nova zona de historico | inicia com etapa atual expandida; mantido enquanto o dialog estiver aberto |
| `respondAction` form state | `useState` interno de `RequestActionCard` | preservado |
| `legacyHistoryFallbackEnabled` | derivado em memoria no shellViewModel | `true` apenas quando `stepsHistory` nao estiver presente no detalhe recebido; a zona de historico nao recalcula esse criterio por conta propria |

### Planned UI Composition

#### Zone 1. Cabecalho do chamado

- substitui o header minimalista atual por um bloco executivo com:
  - titulo `Chamado #<requestId>`;
  - subtitulo com workflow/tipo;
  - badges de status macro, etapa atual, SLA e papel relevante;
  - descricao curta do proximo estado do chamado;
- permanece dentro de `DialogHeader`, sem criar header paralelo fora do dialog;
- usa `summary.currentStepName`, apresentacao derivada e `viewModel.title/description`.

#### Zone 2. Resumo do chamado

- permanece logo abaixo do header;
- deixa de mostrar `areaId` cru como valor principal quando `areaLabel` existir;
- concentra:
  - solicitante;
  - responsavel;
  - area amigavel;
  - owner;
  - datas relevantes (`submittedAt`, `lastUpdatedAt`, `finalizedAt`, `archivedAt`);
- mantem densidade administrativa e grid responsivo, sem virar um hero secundario.

#### Zone 3. Acao atual

- torna-se uma macrozona com tres subblocos ordenados:
  1. `RequestOperationalHero` refinado como leitura do proximo passo;
  2. `RequestActionCard` quando a etapa suportar request/respond;
  3. `RequestAdministrativePanel` como bloco secundario;
- ordem e destaque por perfil:
  - destinatario com action pendente: `RequestActionCard` recebe estilo primario e hero contextualiza que a resposta e a prioridade;
  - responsavel/owner com `canAdvance` ou `canFinalize`: hero recebe CTA primario e action/admin ficam abaixo;
  - etapa elegivel para solicitar action: `RequestActionCard` sobe como leitura principal da macrozona, mesmo sem action pendente;
  - owner sem responsavel: bloco administrativo sobe no fluxo visual da zona, mas continua identificado como administracao;
  - leitor autorizado: a zona existe com copy explicativa e sem CTA mutavel.

#### Zone 4. Historico por etapa

- substitui a dupla `RequestProgress` + `RequestTimeline` como leitura principal;
- adota acordeao/grupos expansivos por etapa, com a etapa atual aberta por padrao;
- cada grupo mostra:
  - cabecalho da etapa com nome, ordem, `kind`, badge de estado e tag `Etapa atual` quando aplicavel;
  - lista de `events` em ordem cronologica;
  - bloco de `actionResponses` com status, respondedAt, respondedBy, comentario e anexo quando houver;
  - empty state local quando a etapa nao tiver interacoes;
- fallback tecnico durante rollout:
  - se `detail.stepsHistory` estiver ausente por branch desatualizada ou rollout parcial, renderizar um bloco de compatibilidade com `RequestProgress` seguido de `RequestTimeline`;
  - esse fallback nao define a UX final e deve ser marcado como caminho transitorio no codigo.

#### Zone 5. Dados enviados

- consolida `RequestFormData` e `RequestAttachments` em uma mesma secao;
- separa visualmente:
  - campos enviados;
  - campos extras;
  - anexos da submissao inicial;
- cada anexo da submissao inicial deve expor duas affordances distintas quando aplicavel:
  - `Ver anexo`;
  - `Baixar anexo`;
- copy explicita que esses anexos pertencem a abertura, nao a respostas de action;
- pode reutilizar subblocos internos atuais, mas sem cards irmaos separados no layout final.

## 3. Architecture Decisions

### ADR-5Z-F2-001: `RequestDetailDialog` permanece a entrypoint unica; a mudanca e interna ao shell

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-17 |
| **Context** | O DEFINE proibe rota paralela e exige que a experiencia oficial continue em `/gestao-de-chamados`. |

**Choice:** manter `RequestDetailDialog` como componente publico do detalhe e reorganizar sua composicao interna em cinco zonas oficiais.

**Rationale:**
1. preserva wiring, fetch, mutacoes e pontos de integracao ja estabilizados;
2. reduz risco de regressao de navegacao e estados de abertura/fechamento;
3. concentra a refatoracao no shell, exatamente como delimitado pelo build.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| criar um segundo dialog para o modelo de 5 zonas | duplica entrypoint e conflita com o DEFINE |
| mover parte do detalhe para uma rota dedicada | amplia escopo e altera a experiencia oficial |

**Consequences:**
- positivo: rollout simples e reversivel;
- negativo: o componente orquestrador fica maior ate a extracao das subzonas.

### ADR-5Z-F2-002: `acao atual` vira uma macrozona com subzonas, nao um unico card monolitico

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-17 |
| **Context** | O desenho aprovado exige leitura unificada do proximo passo, mas `requestAction/respondAction` e administracao continuam sendo responsabilidades distintas. |

**Choice:** compor a zona `acao atual` como um shell unificado que agrupa hero, action e administracao em ordem controlada pelo view model.

**Rationale:**
1. preserva contratos e componentes com pouca reescrita funcional;
2. evita um componente gigante com logica de formularios, atribuicao e CTA principal misturados;
3. entrega a percepcao de uma unica macrozona sem apagar as fronteiras semanticas entre subacoes.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| fundir hero, action e admin num unico componente | aumenta acoplamento e piora testabilidade |
| manter os tres cards soltos como hoje | nao atende ao modelo de 5 zonas |

**Consequences:**
- positivo: hierarquia visual melhora sem reabrir contratos;
- negativo: o view model precisa carregar mais semantica de ordenacao/prioridade.

### ADR-5Z-F2-003: `stepsHistory` e a fonte primaria do historico; `progress/timeline` ficam apenas como fallback transitorio

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-17 |
| **Context** | O DEFINE da Fase 2 depende da Fase 1 ter oficializado historico por etapa e explicitamente rebaixa o shell legado. |

**Choice:** renderizar uma nova secao `RequestStepHistorySection` dirigida por `stepsHistory[]`, mantendo fallback tecnico para `progress + timeline` apenas quando o detalhe recebido ainda nao vier enriquecido.

**Rationale:**
1. alinha a UI ao contrato alvo sem exigir corte abrupto durante branch integration;
2. protege o dialog contra estados intermediarios de rollout;
3. torna o caminho final explicito e mede regressao com clareza.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| continuar usando `RequestProgress` e `RequestTimeline` como UI final | nao atende ao requisito de historico por etapa |
| falhar silenciosamente quando `stepsHistory` faltar | cria modal vazio ou inconsistente em integracoes parciais |

**Consequences:**
- positivo: historico oficial vira protagonista;
- negativo: existe uma trilha de compatibilidade temporaria a ser removida em rodada posterior.

### ADR-5Z-F2-004: `dados enviados` consolida formulario e anexos de abertura no mesmo contenedor

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-17 |
| **Context** | O desenho aprovado exige uma zona unica para dados enviados e explicita a separacao em relacao a comentarios/anexos de etapa. |

**Choice:** criar uma nova secao composta que recebe `formData` e `attachments` e reaproveita a renderizacao atual como subblocos internos.

**Rationale:**
1. melhora a leitura da submissao original;
2. reduz o salto visual entre campo e arquivo correspondente;
3. cumpre o requisito de distinguir anexos da abertura versus anexos operacionais.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| manter dois cards irmaos | perpetua o gap do shell atual |
| mover anexos da abertura para o historico por etapa | mistura submissao inicial com interacao operacional |

**Consequences:**
- positivo: zona mais coerente e previsivel;
- negativo: exige uma pequena camada nova de composicao para nao duplicar markup.

### ADR-5Z-F2-005: o footer deixa de carregar CTA operacional

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-17 |
| **Context** | O Build 2 ja tinha como diretriz tirar `advance/finalize/requestAction/respondAction` da dependencia do footer. A Fase 2 do redesign reforca isso. |

**Choice:** manter o footer com `Fechar` e, no maximo, globais de baixo risco; CTAs operacionais ficam exclusivamente no corpo, dentro da zona `acao atual`.

**Rationale:**
1. elimina competicao entre fechar, arquivar e operar etapa;
2. melhora mobile/desktop ao manter contexto e CTA no mesmo bloco visual;
3. aproxima o dialog do modelo de 5 zonas.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| reintroduzir CTA primario no footer para consistencia com modais simples | conflita com a prioridade operacional do detalhe |
| duplicar CTA no corpo e no footer | cria redundancia e maior risco de divergencia de estado |

**Consequences:**
- positivo: a zona operacional fica autossuficiente;
- negativo: alguns testes antigos de footer precisam ser reescritos.

### ADR-5Z-F2-006: a linguagem visual segue o modal canonico de `/requests`, sem criar uma nova familia

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-17 |
| **Context** | A skill `uiux-connect` exige ancoragem em referencia real do app, e o modal canonico para revisao/detalhe administrativo esta em `RequestApprovalModal`. |

**Choice:** manter `DialogHeader`, `ScrollArea`, separacao vertical de secoes, densidade administrativa e token de CTA primario coerentes com `RequestApprovalModal`, adaptando apenas o tamanho e a complexidade necessarios ao detalhe de management.

**Rationale:**
1. reduz variacao visual dentro da familia admin/gestao;
2. evita inventar padrao local desconectado do app;
3. facilita revisao de consistencia futura.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| criar visual completamente novo so para o modal de management | viola o canon do Connect |
| copiar integralmente o modal antigo de `/requests` | ignora as necessidades especificas do contrato operacional atual |

**Consequences:**
- positivo: consistencia visual com o restante do produto;
- negativo: exige disciplina para nao exagerar em componentes customizados.

## 4. File Manifest

### Execution Order

| Phase | Files | Agent |
|-------|-------|-------|
| 1. View model | `request-detail-view-model.ts` | @react-frontend-developer |
| 2. Shell / zones | `RequestDetailDialog.tsx` + novos componentes de zona | @react-frontend-developer |
| 3. Existing blocks refinement | `RequestOperationalHero.tsx`, `RequestActionCard.tsx`, `RequestAdministrativePanel.tsx` | @react-frontend-developer |
| 4. Tests | `__tests__/RequestDetailDialog.test.tsx` + testes das novas zonas | @react-frontend-developer |
| 5. Canon review | validacao visual contra `RequestApprovalModal` e familia admin/gestao | `uiux-connect` |

### Detailed Manifest

| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | `src/lib/workflows/management/request-detail-view-model.ts` | Modify | expandir o view model para descrever cabecalho, prioridade da zona `acao atual`, labels de resumo e fallback de historico | @react-frontend-developer | - |
| 2 | `src/components/workflows/management/RequestDetailDialog.tsx` | Modify | reorquestrar o dialog nas 5 zonas oficiais e reduzir o footer a papel secundario | @react-frontend-developer | #1 |
| 3 | `src/components/workflows/management/RequestDetailHeader.tsx` | Create | encapsular o cabecalho executivo do chamado | @react-frontend-developer | #1 |
| 4 | `src/components/workflows/management/RequestSummarySection.tsx` | Create | renderizar o resumo institucional/operacional com `areaLabel` amigavel | @react-frontend-developer | #1 |
| 5 | `src/components/workflows/management/RequestStepHistorySection.tsx` | Create | renderizar o historico por etapa com acordeao e fallback legado controlado | @react-frontend-developer | #1 |
| 6 | `src/components/workflows/management/RequestStepHistoryItem.tsx` | Create | encapsular uma etapa do historico com trigger expansivel, eventos, respostas e empty state | @react-frontend-developer | #5 |
| 7 | `src/components/workflows/management/RequestSubmittedDataSection.tsx` | Create | consolidar `formData` e anexos da abertura em uma unica zona | @react-frontend-developer | #2 |
| 8 | `src/components/workflows/management/RequestAttachments.tsx` | Modify | suportar affordances explicitas de `Ver anexo` e `Baixar anexo` dentro da zona `dados enviados` | @react-frontend-developer | #7 |
| 9 | `src/components/workflows/management/RequestOperationalHero.tsx` | Modify | continuar consumindo `RequestOperationalViewModel`, ajustando copy, estrutura e CTA para funcionar como subzona do shell `acao atual` | @react-frontend-developer | #1 |
| 10 | `src/components/workflows/management/RequestActionCard.tsx` | Modify | encaixar a action da etapa como subzona oficial da macrozona `acao atual` e harmonizar estilo primario/secondary | @react-frontend-developer | #1, #2 |
| 11 | `src/components/workflows/management/RequestAdministrativePanel.tsx` | Modify | rebaixar visualmente atribuicao/arquivamento sem perder visibilidade quando forem a unica acao disponivel | @react-frontend-developer | #1, #2 |
| 12 | `src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx` | Modify | cobrir as 5 zonas, prioridade por perfil/estado e footer rebaixado | @react-frontend-developer | #2-#11 |
| 13 | `src/components/workflows/management/__tests__/RequestStepHistorySection.test.tsx` | Create | validar historico por etapa, acordeao com etapa atual expandida e fallback legado com marcador transitorio | @react-frontend-developer | #5, #6 |
| 14 | `src/components/workflows/management/__tests__/RequestSubmittedDataSection.test.tsx` | Create | validar consolidacao entre campos e anexos da abertura, incluindo `Ver` e `Baixar` | @react-frontend-developer | #7, #8 |

### Dependency Gate

Antes de iniciar o build, confirmar que a branch ja recebeu os artefatos da Fase 1:

- `summary.areaLabel?: string` no espelho de management;
- `stepsHistory?: WorkflowManagementRequestStepHistoryItem[]` em `WorkflowManagementRequestDetailData`;
- normalizacao correspondente em `src/lib/workflows/management/api-client.ts`.

Se essa dependencia ainda nao estiver mergeada, o build deve comecar pela sincronizacao da Fase 1, e nao por workaround local no dialog.

## 5. Code Patterns

### Pattern 1: view model de shell por composicao com o contrato operacional atual

```ts
export type RequestDetailShellViewModel = {
  operational: RequestOperationalViewModel;
  header: {
    title: string;
    subtitle: string;
    badges: Array<{ label: string; variant: 'default' | 'outline' | 'secondary' }>;
  };
  summary: {
    areaLabel: string;
    metaItems: Array<{ label: string; value: string }>;
  };
  currentAction: {
    primaryMode: 'hero' | 'action-card' | 'admin';
    shouldRenderActionCard: boolean;
    shouldRenderAdminPanel: boolean;
  };
  history: {
    hasLegacyFallback: boolean;
  };
};
```

```ts
export function buildRequestDetailShellViewModel(
  detail: WorkflowManagementRequestDetailData,
): RequestDetailShellViewModel {
  const operational = buildRequestOperationalViewModel(detail);

  return {
    operational,
    header: {
      title: `Chamado #${detail.summary.requestId}`,
      subtitle: detail.summary.workflowName || detail.summary.workflowTypeId || '-',
      badges: buildHeaderBadges(detail, operational),
    },
    summary: {
      areaLabel: getSummaryAreaLabel(detail.summary),
      metaItems: buildSummaryMetaItems(detail.summary),
    },
    currentAction: {
      primaryMode: resolveCurrentActionPrimaryMode(detail, operational),
      shouldRenderActionCard: operational.shouldRenderActionZone,
      shouldRenderAdminPanel: detail.permissions.canAssign || detail.permissions.canArchive,
    },
    history: {
      hasLegacyFallback: !Array.isArray(detail.stepsHistory),
    },
  };
}
```

> Nota de implementacao: `RequestOperationalHero` continua recebendo `shellViewModel.operational`. O shell novo compoe o view model existente; nao o substitui.

### Pattern 2: historico por etapa com fallback tecnico explicito

```tsx
type RequestStepHistorySectionProps = {
  stepsHistory?: WorkflowManagementRequestStepHistoryItem[];
  progress: WorkflowManagementRequestDetailData['progress'];
  timeline: WorkflowManagementRequestDetailData['timeline'];
  hasLegacyFallback: boolean;
};

export function RequestStepHistorySection(props: RequestStepHistorySectionProps) {
  const [expandedStepIds, setExpandedStepIds] = React.useState<string[]>(
    () => props.stepsHistory?.filter((step) => step.isCurrent).map((step) => step.stepId) ?? [],
  );

  if (props.hasLegacyFallback) {
    return (
      <section aria-labelledby="request-step-history-title" className="space-y-4">
        <header className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="request-step-history-title" className="text-sm font-semibold">
              Historico por etapa
            </h2>
            <Badge variant="outline">Compatibilidade temporaria</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            O detalhe ainda nao trouxe `stepsHistory`; exibindo progresso e timeline legados dentro da zona oficial de historico.
          </p>
        </header>

        <div className="space-y-4 rounded-xl border bg-background p-4">
          <RequestProgress progress={props.progress} />
          <RequestTimeline timeline={props.timeline} />
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="request-step-history-title" className="space-y-4">
      <header className="space-y-1">
        <h2 id="request-step-history-title" className="text-sm font-semibold">
          Historico por etapa
        </h2>
        <p className="text-sm text-muted-foreground">
          Eventos e respostas operacionais agrupados pela etapa oficial do fluxo.
        </p>
      </header>

      {props.stepsHistory!.map((step) => (
        <RequestStepHistoryItem
          key={step.stepId}
          step={step}
          expanded={expandedStepIds.includes(step.stepId)}
          onToggle={() =>
            setExpandedStepIds((current) =>
              current.includes(step.stepId)
                ? current.filter((id) => id !== step.stepId)
                : [...current, step.stepId],
            )
          }
        />
      ))}
    </section>
  );
}
```

> Nota de implementacao: `RequestStepHistoryItem` sera um componente dedicado do manifest, e nao um helper implcito inline. A etapa atual deve iniciar expandida por padrao; as demais iniciam recolhidas.

### Pattern 3: `dados enviados` compostos sem duplicar regras de apresentacao

```tsx
export function RequestSubmittedDataSection({
  formData,
  attachments,
}: {
  formData: WorkflowManagementRequestDetailData['formData'];
  attachments: WorkflowManagementRequestAttachment[];
}) {
  return (
    <section aria-labelledby="request-submitted-data-title" className="space-y-4">
      <header className="space-y-1">
        <h2 id="request-submitted-data-title" className="text-sm font-semibold">
          Dados enviados
        </h2>
        <p className="text-sm text-muted-foreground">
          Campos e anexos da abertura oficial do chamado.
        </p>
      </header>

      <div className="space-y-4 rounded-xl border bg-background p-4">
        <RequestFormData formData={formData} />
        <Separator />
        <RequestAttachments attachments={attachments} />
      </div>
    </section>
  );
}
```

```tsx
function RequestSubmittedAttachmentItem({ attachment }: { attachment: WorkflowManagementRequestAttachment }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{attachment.label}</p>
        <p className="text-xs text-muted-foreground">{getAttachmentFileName(attachment.url)}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild type="button" variant="outline" size="sm">
          <a href={attachment.url} target="_blank" rel="noopener noreferrer">
            Ver anexo
          </a>
        </Button>
        <Button asChild type="button" variant="outline" size="sm">
          <a href={attachment.url} download>
            Baixar anexo
          </a>
        </Button>
      </div>
    </div>
  );
}
```

### Pattern 4: resumo amigavel com fallback estavel de area

```ts
function getSummaryAreaLabel(summary: WorkflowManagementRequestSummary): string {
  return summary.areaLabel?.trim() || summary.areaId || '-';
}

function buildSummaryMetaItems(
  summary: WorkflowManagementRequestSummary,
): Array<{ label: string; value: string }> {
  return [
    { label: 'Solicitante', value: summary.requesterName || '-' },
    { label: 'Responsavel', value: summary.responsibleName || 'Nao atribuido' },
    { label: 'Aberto em', value: formatManagementDate(summary.submittedAt) },
    { label: 'Ultima atualizacao', value: formatManagementDate(summary.lastUpdatedAt) },
    { label: 'Finalizado em', value: formatManagementDate(summary.finalizedAt) },
    { label: 'Arquivado em', value: formatManagementDate(summary.archivedAt) },
    { label: 'Area', value: getSummaryAreaLabel(summary) },
    { label: 'Owner', value: summary.ownerEmail || '-' },
  ];
}

function buildHeaderBadges(
  detail: WorkflowManagementRequestDetailData,
  operational: RequestOperationalViewModel,
): Array<{ label: string; variant: 'default' | 'outline' | 'secondary' }> {
  const badges: Array<{ label: string; variant: 'default' | 'outline' | 'secondary' }> = [
    { label: deriveManagementRequestPresentation(detail.summary).label, variant: 'default' },
    { label: detail.summary.currentStepName || 'Sem etapa atual', variant: 'outline' },
  ];

  if (detail.summary.hasPendingActions) {
    badges.push({ label: 'Ha acoes pendentes', variant: 'outline' });
  }

  if (operational.highlightLabel) {
    badges.push({ label: operational.highlightLabel, variant: 'secondary' });
  }

  return badges;
}
```

### Pattern 5: prioridade operacional sem inferencia local nova

```ts
function resolveCurrentActionPrimaryMode(
  detail: WorkflowManagementRequestDetailData,
  operational: RequestOperationalViewModel,
): 'hero' | 'action-card' | 'admin' {
  const { permissions, action, summary } = detail;

  if (permissions.canRespondAction && action.canRespond) {
    return 'action-card';
  }

  if (permissions.canAdvance || permissions.canFinalize) {
    return 'hero';
  }

  if (permissions.canRequestAction && action.available) {
    return 'action-card';
  }

  if (permissions.canAssign) {
    return 'admin';
  }

  if (summary.statusCategory === 'finalized' || summary.isArchived) {
    return 'hero';
  }

  return operational.showActionZoneAsPrimary ? 'action-card' : 'hero';
}
```

```ts
export type RequestOperationalTone =
  | 'respond-action'
  | 'ready-to-advance'
  | 'ready-to-finalize'
  | 'request-action'
  | 'assign-responsible'
  | 'read-only';

if (permissions.canRespondAction && action.canRespond) {
  return { tone: 'respond-action', showActionZoneAsPrimary: true };
}

if (permissions.canAdvance || permissions.canFinalize) {
  return {
    tone: permissions.canFinalize ? 'ready-to-finalize' : 'ready-to-advance',
    showActionZoneAsPrimary: false,
  };
}

if (permissions.canRequestAction && action.available) {
  return { tone: 'request-action', showActionZoneAsPrimary: true };
}

if (permissions.canAssign) {
  return { tone: 'assign-responsible', showActionZoneAsPrimary: false };
}

if (summary.statusCategory === 'finalized') {
  return { tone: 'read-only', showActionZoneAsPrimary: false };
}

if (summary.isArchived) {
  return { tone: 'read-only', showActionZoneAsPrimary: false };
}

return { tone: 'read-only', showActionZoneAsPrimary: false };
```

> Nota de implementacao: o branch de `canAssign` representa explicitamente o cenario de owner sem responsavel atribuido. Nessa leitura, a administracao continua semanticamente distinta da operacao da etapa, mas sobe como prioridade visual da macrozona `acao atual`.

## 6. API Contract

Nenhum endpoint novo ou alterado nesta fase.

Build 2 apenas consome o contrato enriquecido da Fase 1. O shell assume a disponibilidade dos seguintes campos no detalhe:

```ts
type WorkflowManagementRequestSummary = {
  areaLabel?: string;
  // ...campos existentes preservados
};

type WorkflowManagementRequestDetailData = {
  summary: WorkflowManagementRequestSummary;
  stepsHistory?: WorkflowManagementRequestStepHistoryItem[];
  progress: { /* legado preservado */ };
  timeline: WorkflowManagementRequestTimelineItem[];
  // ...campos existentes preservados
};
```

Garantias consumidas pelo frontend nesta fase:

- `summary.areaLabel`, quando presente, ja vem resolvido no servidor com fallback para `areaId`;
- `stepsHistory`, quando presente, ja contem todas as etapas publicadas e arrays vazios sem heuristica local;
- `progress` e `timeline` continuam existindo para compatibilidade e fallback transitorio.

## 7. Database Schema

Nenhuma mudanca de schema.

## 8. Testing Strategy

### Unit Tests

| Component | Test |
|-----------|------|
| `request-detail-view-model.ts` | compatibilidade entre `RequestOperationalViewModel` e o novo `RequestDetailShellViewModel` por composicao |
| `request-detail-view-model.ts` | prioridade por perfil/estado (`respondAction`, `advance`, `finalize`, `assign`, `requestAction`, read-only) |
| `request-detail-view-model.ts` | ramos de `finalized` e `isArchived` preservados na refatoracao |
| `request-detail-view-model.ts` | prioridade por `requestAction` quando a etapa permitir abrir action oficial e nao houver CTA superior |
| `request-detail-view-model.ts` | fallback de `areaLabel` para `areaId` |
| `RequestStepHistorySection.tsx` | renderizacao de etapas com arrays vazios, fallback legado dentro da mesma zona e etapa atual expandida por padrao |
| `RequestStepHistoryItem.tsx` | trigger expansivel, estados visuais, eventos, respostas e empty state por etapa |
| `RequestSubmittedDataSection.tsx` | consolidacao de campos, campos extras e anexos da abertura |
| `RequestAttachments.tsx` | renderizacao de dois CTAs distintos (`Ver anexo` e `Baixar anexo`) quando aplicavel |

### Integration / Component Tests

| Flow | Test |
|------|------|
| Cabecalho executivo | renderiza `Chamado #`, workflow/tipo, status macro e etapa atual |
| Resumo amigavel | mostra `areaLabel` quando existir e cai para `areaId` quando nao existir |
| Action pendente para destinatario | `RequestActionCard` recebe prioridade visual e CTA de resposta fica no corpo |
| Action solicitavel na etapa atual | `RequestActionCard` recebe prioridade quando `canRequestAction && action.available` e nao houver CTA superior |
| Responsavel pronto para avancar/finalizar | CTA primario aparece no hero, admin fica secundario e footer nao recebe CTA operacional |
| Owner sem responsavel | painel administrativo aparece na macrozona `acao atual` como principal necessidade do momento |
| Chamado finalizado ou arquivado | hero/read-only preserva a leitura contextual sem reintroduzir CTA operacional primario |
| Historico por etapa | mostra grupos por etapa, eventos, respostas de action e estados vazios |
| Rollout transitorio | quando `stepsHistory` faltar, a zona de historico continua unica e renderiza compatibilidade com `RequestProgress` + `RequestTimeline` sob copy explicativa |
| Acordeao do historico | etapa atual inicia expandida e toggles adicionais funcionam sem perder a zona unica |
| Dados enviados | campos e anexos da abertura aparecem na mesma zona |
| Anexos da abertura | cada item oferece `Ver anexo` e `Baixar anexo` como affordances distintas quando aplicavel |

### Acceptance Tests

```gherkin
GIVEN um destinatario de action pendente abre o chamado
WHEN o detalhe oficial expoe canRespondAction e action.canRespond
THEN a zona "acao atual" destaca a resposta da action como prioridade
AND o footer nao vira a superficie primaria da operacao
```

```gherkin
GIVEN um owner abre um chamado sem responsavel atribuido
WHEN permissions.canAssign e true e nao ha action pendente
THEN a macrozona "acao atual" comunica atribuicao como proxima necessidade
AND a administracao continua visualmente separada do historico e dos dados enviados
```

```gherkin
GIVEN um detalhe enriquecido com stepsHistory e areaLabel
WHEN o dialog e renderizado
THEN o historico aparece agrupado por etapa
AND o resumo mostra a area amigavel
AND os anexos da abertura aparecem apenas na zona "dados enviados"
```

## 9. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | reverter a nova composicao de `RequestDetailDialog` para o shell anterior | o dialog volta a exibir resumo, hero, action, admin, progress, timeline, formData e attachments como antes |
| 2 | remover os novos componentes de zona (`RequestDetailHeader`, `RequestStepHistorySection`, `RequestSubmittedDataSection`, etc.) | o build volta a depender apenas dos componentes antigos |
| 3 | manter intacto o contrato enriquecido da Fase 1 | o payload continua compativel para um rollout futuro da Fase 2 |
| 4 | restaurar os testes antigos do dialog e desativar as suites novas | a CI volta ao baseline anterior do modal |

**Metodo rapido:** `git revert <commit-da-fase-2>`

## 10. Implementation Checklist

### Pre-Build

- [x] DEFINE aprovado
- [x] dependencia na Fase 1 identificada
- [x] canon visual do Connect identificado via `uiux-connect`
- [x] zonas oficiais e fallback transitorio definidos
- [x] file manifest fechado

### Post-Build

- [ ] `RequestDetailDialog` renderiza as 5 zonas na ordem oficial
- [ ] cabecalho executivo usa dados oficiais do detalhe
- [ ] `areaLabel` aparece na zona de resumo quando presente
- [ ] `stepsHistory` e a superficie principal do historico
- [ ] fallback legado so aparece quando `stepsHistory` estiver ausente
- [ ] `formData` e anexos da abertura aparecem na mesma zona
- [ ] footer nao contem CTA operacional primario
- [ ] testes de componente cobrindo perfis e estados passam

## 11. Specialist Instructions

### For @react-frontend-developer

```markdown
Files to modify:
- src/lib/workflows/management/request-detail-view-model.ts
- src/components/workflows/management/RequestDetailDialog.tsx
- src/components/workflows/management/RequestOperationalHero.tsx
- src/components/workflows/management/RequestActionCard.tsx
- src/components/workflows/management/RequestAdministrativePanel.tsx
- src/components/workflows/management/RequestStepHistoryItem.tsx
- src/components/workflows/management/RequestAttachments.tsx
- novos componentes de zona do modal em src/components/workflows/management/
- testes em src/components/workflows/management/__tests__/

Key requirements:
- preservar integralmente contratos e mutacoes existentes;
- compor `RequestDetailShellViewModel` a partir de `RequestOperationalViewModel`, sem quebrar o contrato do hero;
- organizar o dialog nas 5 zonas oficiais;
- tratar `stepsHistory` como fonte primaria do historico;
- manter fallback legado controlado apenas para rollout tecnico;
- preservar a zona de historico como superficie unica mesmo quando cair no fallback legado;
- centralizar o criterio de fallback legado no shell view model;
- implementar acordeao com etapa atual expandida por padrao;
- dar prioridade explicita a `requestAction` e `assign` na matriz operacional;
- expor `Ver anexo` e `Baixar anexo` na zona `dados enviados`;
- nao reintroduzir CTA operacional no footer.
```

### For `uiux-connect`

```markdown
Canon to apply:
- familia Admin CRUD / Gestao
- modal de referencia: src/components/requests/RequestApprovalModal.tsx

Review focus:
- DialogHeader com leitura executiva, nao minimalista;
- ScrollArea interna sem clipping em desktop/mobile;
- separacao clara entre resumo, acao atual, historico e dados enviados;
- CTA primario no token admin do app;
- ausencia de linguagem visual paralela ao canon existente.
```

## 12. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-17 | Codex (`design` + `uiux-connect`) | Initial technical design for Fase 2 of the 5-zone management modal redesign, covering shell composition, view-model expansion, step-history fallback, Connect canon alignment, tests and rollback strategy. |
| 1.1 | 2026-04-17 | Codex (`iterate`) | Tightened the Fase 2 design after review findings: made `requestAction` and `assign` explicit in the operational priority matrix, required dual `Ver/Baixar` affordances for submission attachments, and updated the step-history fallback to remain a single official zone with transitional copy and marker. |
| 1.2 | 2026-04-17 | Codex (`iterate`) | Resolved the shell view-model ambiguity by composing on top of `RequestOperationalViewModel`, documented derivation for header/summary/current-action flags, specified the dedicated `RequestStepHistoryItem` component, unified the legacy-history fallback source, and made the accordion behavior explicit with current-step auto-expansion. |
