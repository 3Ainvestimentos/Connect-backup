# DESIGN: Build 3 - Refatoracao do modal operacional de gestao de chamados

> Generated: 2026-04-17
> Status: Ready for /build
> Source: `DEFINE_BUILD3_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`
> Depends on: `DEFINE_BUILD1_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`, `DESIGN_BUILD1_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`, `DEFINE_BUILD2_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`, `DESIGN_BUILD2_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`, `BUILD_REPORT_BUILD2_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`

## 1. Requirements Summary

### Problem

Os Builds 1 e 2 ja fecharam o contrato funcional e a hierarquia visual do modal oficial de `/gestao-de-chamados`, mas a superficie ainda depende de um ultimo ciclo de estabilizacao. O Build 3 precisa blindar estados transitorios, consolidar copy operacional e provar por teste que o dialog continua correto nos cenarios de owner, responsavel, destinatario de action, requests finalizados e requests arquivados.

### Success Criteria

| Criterion | Target |
|-----------|--------|
| Disable states oficiais | `advance`, `finalize`, `requestAction`, `respondAction`, `archive` e atribuicao/reatribuicao ficam inequivocamente bloqueados durante mutation pendente |
| Copy operacional consistente | hero, action card e painel administrativo comunicam quem age agora, proximo passo e estados terminais sem ambiguidades |
| Estado terminal sem CTA indevido | requests `finalized` e `archived` nao reintroduzem CTA operacional primario fora do contrato do payload |
| Integracao de pagina confiavel | `WorkflowManagementPage` preserva abertura do dialog em `advance/requestAction/respondAction` e fecha apenas em `finalize/archive` |
| Cobertura automatizada dirigida | suites de unit, component e integration cobrem a matriz remanescente descrita no DEFINE |
| Smoke responsivo registrado | checklist manual de `1440x900`, `1280x720` e `390x844` fica pronto para o build report do Build 3 |

### Constraints

- nenhum endpoint, schema, permissao ou regra de runtime sera alterado neste build;
- o shell visual do Build 2 permanece baseline; o Build 3 atua apenas em copy, estados transitorios, testes e pequenos refinamentos locais;
- `RequestDetailDialog` continua sendo a entrypoint publica do detalhe operacional;
- o payload oficial de detalhe continua sendo a unica fonte de verdade para permissoes e elegibilidade;
- o build nao introduz infraestrutura nova obrigatoria de E2E browser automation.

## 2. Architecture

### Source of Truth

Este design foi elaborado a partir de:

- [DEFINE_BUILD3_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_BUILD3_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md)
- [DEFINE_BUILD2_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_BUILD2_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md)
- [DESIGN_BUILD2_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_BUILD2_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md)
- [BUILD_REPORT_BUILD2_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/reports/BUILD_REPORT_BUILD2_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md)
- [RequestDetailDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestDetailDialog.tsx)
- [RequestOperationalHero.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestOperationalHero.tsx)
- [RequestActionCard.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestActionCard.tsx)
- [RequestAdministrativePanel.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestAdministrativePanel.tsx)
- [WorkflowManagementPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/WorkflowManagementPage.tsx)
- [request-detail-view-model.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/request-detail-view-model.ts)
- [RequestDetailDialog.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx)
- [RequestActionCard.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/RequestActionCard.test.tsx)
- [WorkflowManagementPage.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx)
- [request-detail-view-model.test.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/__tests__/request-detail-view-model.test.ts)
- [detail.test.js](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/__tests__/detail.test.js)

Em caso de divergencia:

1. prevalece o `DEFINE_BUILD3` para escopo, metas e aceite;
2. prevalece o contrato funcional consolidado nos Builds 1 e 2 para permissoes, prioridade de CTA e comportamento do shell;
3. prevalece este design para organizar refinamentos de copy, disable states, fixtures e estrategia de testes do Build 3.

### Current Snapshot

O snapshot atual do codigo mostra quatro lacunas de confianca que este build precisa fechar:

1. `RequestOperationalHero.tsx`, `RequestActionCard.tsx` e `RequestAdministrativePanel.tsx` ja recebem flags de mutation pendente, mas a cobertura automatizada ainda nao prova sistematicamente labels, `disabled` e ausencia de dupla submissao para toda a matriz oficial.
2. `request-detail-view-model.ts` cobre prioridade visual basica, mas ainda nao documenta nem testa explicitamente tons/copys de cenarios terminais como `archived`, `finalized + canArchive` e `action completed + canAdvance`.
3. `WorkflowManagementPage.test.tsx` hoje valida principalmente shell, URL e retry de abas; ainda falta provar o wiring do dialog para `advance`, `finalize`, `requestAction`, `respondAction` e `archive`.
4. as fixtures de detalhe usadas nas suites de dialog, view model e action card estao duplicadas, o que aumenta risco de drift em relacao ao contrato oficial do read-side.

### Target Stabilization

O Build 3 preserva integralmente a composicao do Build 2 e adiciona uma camada de confianca sobre ela:

1. copy operacional refinada para estados de continuidade, conclusao, leitura e arquivamento;
2. labels de submissao e estados `disabled` coerentes em hero, action card e painel administrativo;
3. testes orientados por papel e estado, sem depender de inferencia visual manual;
4. fixture builders compartilhados para alinhar suites de UI ao shape oficial de detalhe.

### System Diagram

```text
Authenticated operator
  |
  +--> /gestao-de-chamados
         |
         +--> WorkflowManagementPage
         |      |
         |      +--> useWorkflowManagement(rawState, selectedRequestId)
         |      |      |
         |      |      +--> detailQuery
         |      |      +--> assignMutation / advanceMutation / finalizeMutation
         |      |      +--> archiveMutation / requestActionMutation / respondActionMutation
         |      |      \--> React Query invalidation already defined in Build 1/2
         |      |
         |      \--> RequestDetailDialog
         |             |
         |             +--> buildRequestOperationalViewModel(detail)
         |             +--> RequestOperationalHero
         |             +--> RequestActionCard
         |             +--> RequestAdministrativePanel
         |             \--> support blocks (progress, timeline, formData, attachments)
         |
         +--> Unit tests
         |      \--> request-detail-view-model.test.ts
         |
         +--> Component tests
         |      +--> RequestDetailDialog.test.tsx
         |      \--> RequestActionCard.test.tsx
         |
         \--> Integration tests
                \--> WorkflowManagementPage.test.tsx
```

### Data Flow

```text
LAYER 1 (Official contract, unchanged)
1. detailQuery continua consumindo o payload oficial de GET /api/workflows/read/requests/{id}.
2. summary, permissions, action, progress, timeline, formData e attachments seguem como unicas fontes de verdade.

LAYER 2 (Display orchestration)
3. buildRequestOperationalViewModel(detail) continua organizando tom, headline e CTA prioritario do modal.
4. Build 3 pode ampliar esse helper apenas para copy terminal/transitoria, sem criar permissao nova nem ler estado de mutation.

LAYER 3 (Mutation state propagation)
5. WorkflowManagementPage continua dono dos mutation states (`isPending`) via useWorkflowManagement.
6. RequestDetailDialog recebe essas flags por props e apenas as distribui entre hero, action card e painel administrativo.
7. Nenhum componente filho cria flag local paralela de submitting para acoes oficiais.

LAYER 4 (Testing contract)
8. Suites de dialog, hero/action/admin e page passam a consumir fixtures compartilhadas do shape oficial de detalhe.
9. Os cenarios de `loading`, `disabled`, estados terminais e close policy ficam provados por Jest/RTL.

LAYER 5 (Manual confidence)
10. O build report do Build 3 deve registrar smoke manual dos viewports 1440x900, 1280x720 e 390x844.
11. A validacao manual complementa, mas nao substitui, a matriz automatizada deste build.
```

### State Management

| State | Storage | Lifecycle |
|-------|---------|-----------|
| `selectedRequestId` | `useState` em `WorkflowManagementPage` | abre/fecha o dialog; permanece preenchido apos `advance`, `requestAction` e `respondAction`; zera apos `finalize`, `archive` ou fechamento manual |
| `detailQuery.data` | React Query | payload oficial do modal; refrescado pelas invalidacoes ja existentes do hook |
| `requestOperationalViewModel` | valor derivado local em `RequestDetailDialog` | recalculado a cada refetch do detalhe; nao persiste fora do dialog |
| `selectedResponsibleId` | `useState` em `RequestDetailDialog` | sincronizado com `detail.summary.responsibleUserId`; resetado ao trocar request |
| `assignMutation.isPending` | React Query mutation | controla estado transitorio de select/botao de atribuicao |
| `advanceMutation.isPending` | React Query mutation | controla CTA do hero quando `primaryAction.kind === 'advance'` |
| `finalizeMutation.isPending` | React Query mutation | controla CTA do hero quando `primaryAction.kind === 'finalize'` |
| `archiveMutation.isPending` | React Query mutation | controla botao administrativo de `Arquivar` |
| `requestActionMutation.isPending` | React Query mutation | controla CTA de abertura de action no `RequestActionCard` |
| `respondActionMutation.isPending` | React Query mutation | controla formulario e CTA de resposta da action |

### Planned Confidence Matrix

| Scenario | Hero | Action card | Admin panel | Page behavior |
|----------|------|-------------|-------------|---------------|
| owner/responsavel com `canAdvance` | CTA primario `Avancar etapa` | action concluida, se existir, fica secundaria | sem competir com fluxo | dialog permanece aberto apos sucesso |
| owner/responsavel com `canFinalize` | CTA primario `Finalizar chamado` | sem CTA indevido de continuidade | `Arquivar` so aparece se payload permitir depois | dialog fecha apos sucesso |
| owner/responsavel com `canRequestAction` | copy orienta abertura da action | CTA `Solicitar ...` com estado `Solicitando...` e `disabled` | painel administrativo subordinado | dialog permanece aberto apos sucesso |
| destinatario com `canRespondAction` | hero apenas contextualiza | formulario/CTA de resposta vira prioridade operacional | sem CTA administrativo concorrente | dialog permanece aberto apos sucesso |
| request `finalized` com `canArchive` | copy de conclusao/read-only | sem CTA operacional primario | `Arquivar` habilitado ou `Arquivando...` | dialog fecha apos arquivar |
| request `archived` | copy de somente leitura/arquivado | nenhuma action operacional disponivel | painel some quando `canArchive = false` | dialog so fecha manualmente |

## 3. Architecture Decisions

### ADR-B3-001: O Build 3 estabiliza o shell do Build 2 sem criar nova camada estrutural

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-17 |
| **Context** | O shell do modal e a prioridade visual ja foram aprovados no Build 2. O gap atual e de confianca operacional, nao de arquitetura visual. |

**Choice:** manter `RequestDetailDialog`, `RequestOperationalHero`, `RequestActionCard` e `RequestAdministrativePanel` como composicao oficial e restringir o Build 3 a copy, disabled states, fixtures e testes.

**Rationale:**
1. evita reabrir um redesign ja estabilizado no build anterior;
2. concentra o patch no risco real remanescente: estados transitorios e prova automatizada;
3. simplifica rollback e revisao.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| redesenhar novamente a hierarquia do modal | ampliaria escopo sem atacar a lacuna principal de confianca |
| criar novos componentes estruturais para cada estado terminal | aumentaria branching e custo de manutencao para um ganho pequeno |

**Consequences:**
- positivo: o build continua pequeno, cirurgico e aderente ao DEFINE;
- positivo: a maior parte do trabalho se concentra em comportamento testavel;
- negativo: o refinamento de copy precisa trabalhar com a estrutura atual, sem mudar grandes zonas do layout.

### ADR-B3-002: Estados de loading/disabled continuam page-owned e sao propagados por props

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-17 |
| **Context** | Hero, action card e painel administrativo ja recebem flags `isPending`, mas ainda existe o risco de um build futuro criar flags locais paralelas de submit para resolver UX pontual. |

**Choice:** formalizar que todos os estados oficiais de busy permanecem centralizados em `WorkflowManagementPage` e em `useWorkflowManagement`, sendo propagados por props para o dialog e seus filhos.

**Rationale:**
1. preserva uma fonte unica de verdade para busy state;
2. evita divergencia entre loading visual e mutation real;
3. facilita testar `disabled`, labels temporarios e policy de fechamento diretamente na pagina.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| criar `useState` locais em hero/action/admin para controlar submit | abre espaco para drift entre estado visual e mutation real |
| mover mutation ownership para dentro do dialog | quebraria o padrao existente do namespace de management |

**Consequences:**
- positivo: wiring e testes de integracao ficam mais objetivos;
- positivo: evita dupla fonte de estado para a mesma acao;
- negativo: `RequestDetailDialog` continua recebendo varias props de mutation state.

### ADR-B3-003: Fixtures compartilhadas passam a ser parte do contrato de teste do modal

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-17 |
| **Context** | As suites atuais repetem builders de detalhe muito parecidos, o que dificulta evoluir a matriz de cenarios sem drift em relacao ao contrato do read-side. |

**Choice:** criar um helper compartilhado de fixtures, localizado no namespace de testes de `src/lib/workflows/management`, e reutiliza-lo nas suites de view model, dialog, action card e, quando util, page.

**Rationale:**
1. reduz duplicacao e aumenta legibilidade da matriz de cenarios;
2. aproxima as suites de UI do shape oficial produzido pelo read-side;
3. facilita adicionar overrides para owner, responsavel, destinatario, finalizado e arquivado sem copiar objetos extensos.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| manter cada suite com seu proprio `buildDetail()` | aumenta drift e custo de manutencao |
| importar builders de `detail.test.js` diretamente nas suites de UI | mistura concerns de read-side node tests com testes de componentes |

**Consequences:**
- positivo: cenarios novos ficam mais baratos de adicionar;
- positivo: a matriz do Build 3 fica mais facil de auditar;
- negativo: introduz um arquivo utilitario de teste extra para manter.

## 4. File Manifest

### Execution Order

| Phase | Files | Agent |
|-------|-------|-------|
| 1. Fixture baseline | helper compartilhado de detalhe e suites unitarias | @react-frontend-developer |
| 2. Copy e transient states | view model, hero, action card e painel administrativo | @react-frontend-developer |
| 3. Dialog confidence | `RequestDetailDialog.tsx` e sua suite | @react-frontend-developer |
| 4. Page orchestration | `WorkflowManagementPage.tsx` e testes de integracao | @react-frontend-developer |
| 5. Build report follow-up | checklist responsivo e observacoes finais | @react-frontend-developer |

### Detailed Manifest

| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | `src/lib/workflows/management/__tests__/request-detail-test-data.ts` | Create | fornecer fixture builder compartilhado para owner, responsavel, destinatario de action, finalizado e arquivado | @react-frontend-developer | - |
| 2 | `src/lib/workflows/management/request-detail-view-model.ts` | Modify | refinar copy/tom para estados terminais e transitorios, preservando a matriz de prioridade do Build 2 | @react-frontend-developer | #1 |
| 3 | `src/lib/workflows/management/__tests__/request-detail-view-model.test.ts` | Modify | cobrir `action completed + canAdvance`, `finalized + canArchive`, `archived read-only` e mensagens refinadas | @react-frontend-developer | #1, #2 |
| 4 | `src/components/workflows/management/RequestOperationalHero.tsx` | Modify | consolidar labels de CTA, `disabled` e copy de estados `advance/finalize/read-only` | @react-frontend-developer | #2 |
| 5 | `src/components/workflows/management/RequestActionCard.tsx` | Modify | endurecer feedback de `requestAction/respondAction`, labels de submit e assertions acessiveis de disable state | @react-frontend-developer | #1 |
| 6 | `src/components/workflows/management/RequestAdministrativePanel.tsx` | Modify | explicitar estados de `Atribuir/Reatribuir` e `Arquivar` durante mutation pendente | @react-frontend-developer | #1 |
| 7 | `src/components/workflows/management/RequestDetailDialog.tsx` | Modify | ajustar copy final entre hero/action/admin e manter renderizacao condicional estavel para estados terminais | @react-frontend-developer | #2, #4, #5, #6 |
| 8 | `src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx` | Modify | provar matriz de CTA principal, estados terminais, disabled states e ausencia de CTA indevido no footer | @react-frontend-developer | #1, #7 |
| 9 | `src/components/workflows/management/__tests__/RequestActionCard.test.tsx` | Modify | provar `Solicitando...`, `Enviando...`, bloqueios de formulario e submissao por papel/tipo de action | @react-frontend-developer | #1, #5 |
| 10 | `src/components/workflows/management/WorkflowManagementPage.tsx` | Preserve or minor modify | manter ownership das mutations e, se necessario, pequenos ajustes para facilitar teste do wiring/close policy | @react-frontend-developer | #7 |
| 11 | `src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx` | Modify | validar wiring de handlers, toasts, refresh indireto e politica de fechamento do dialog para `advance/finalize/archive/requestAction/respondAction` | @react-frontend-developer | #1, #10 |
| 12 | `src/lib/workflows/read/__tests__/detail.test.js` | Preserve or minor modify | alinhar fixture oficial do read-side caso algum campo usado pelas suites de UI precise ser endurecido | @react-frontend-developer | #1 |

Notas:

- nenhum endpoint ou use case de runtime entra no manifest deste build;
- `RequestProgress`, `RequestTimeline`, `RequestFormData` e `RequestAttachments` permanecem como baseline do Build 2, sem ajuste deliberado;
- o helper compartilhado de fixture existe para testes apenas e nao deve ser importado pelo codigo de producao.

## 5. Code Patterns

### Pattern 1: View model com copy terminal/transitoria, sem absorver mutation state

```ts
// src/lib/workflows/management/request-detail-view-model.ts
export type RequestOperationalPrimaryAction =
  | { kind: 'advance'; label: 'Avancar etapa'; busyLabel: 'Avancando...' }
  | { kind: 'finalize'; label: 'Finalizar chamado'; busyLabel: 'Finalizando...' };

export type RequestOperationalViewModel = {
  tone: 'respond-action' | 'ready-to-advance' | 'ready-to-finalize' | 'request-action' | 'read-only';
  title: string;
  description: string;
  highlightLabel?: string;
  statusNote?: string;
  showActionZoneAsPrimary: boolean;
  shouldRenderActionZone: boolean;
  primaryAction: RequestOperationalPrimaryAction | null;
};

export function buildRequestOperationalViewModel(detail: WorkflowManagementRequestDetailData) {
  const { summary, permissions, action } = detail;

  if (permissions.canRespondAction && action.canRespond) {
    return {
      tone: 'respond-action',
      title: 'Aguardando sua resposta',
      description: `A etapa ${summary.currentStepName} depende da sua resposta na action atual.`,
      highlightLabel: 'Voce precisa agir agora',
      showActionZoneAsPrimary: true,
      shouldRenderActionZone: action.available || Boolean(action.configurationError),
      primaryAction: null,
    };
  }

  if (permissions.canAdvance) {
    return {
      tone: 'ready-to-advance',
      title: 'Pronto para avancar',
      description: `A etapa ${summary.currentStepName} ja pode seguir para o proximo passo oficial.`,
      statusNote:
        action.state === 'completed'
          ? 'A action atual ja foi concluida e o chamado aguarda apenas a continuidade oficial.'
          : undefined,
      highlightLabel: 'Proximo passo disponivel',
      showActionZoneAsPrimary: false,
      shouldRenderActionZone: action.available || Boolean(action.configurationError),
      primaryAction: {
        kind: 'advance',
        label: 'Avancar etapa',
        busyLabel: 'Avancando...',
      },
    };
  }

  if (permissions.canFinalize) {
    return {
      tone: 'ready-to-finalize',
      title: 'Pronto para concluir',
      description: 'O chamado ja atingiu a etapa imediatamente anterior a conclusao oficial.',
      highlightLabel: 'Conclusao disponivel',
      showActionZoneAsPrimary: false,
      shouldRenderActionZone: action.available || Boolean(action.configurationError),
      primaryAction: {
        kind: 'finalize',
        label: 'Finalizar chamado',
        busyLabel: 'Finalizando...',
      },
    };
  }

  if (permissions.canRequestAction && action.available) {
    return {
      tone: 'request-action',
      title: 'Action disponivel para esta etapa',
      description: `A etapa ${summary.currentStepName} pode abrir uma action operacional oficial.`,
      highlightLabel: 'Acao de etapa disponivel',
      showActionZoneAsPrimary: true,
      shouldRenderActionZone: true,
      primaryAction: null,
    };
  }

  if (summary.statusCategory === 'finalized' && permissions.canArchive) {
    return {
      tone: 'read-only',
      title: 'Chamado concluido',
      description: 'O fluxo operacional foi encerrado e restam apenas acoes administrativas autorizadas.',
      highlightLabel: 'Conclusao registrada',
      statusNote: 'Use o arquivamento apenas quando for necessario retirar o chamado da fila ativa.',
      showActionZoneAsPrimary: false,
      shouldRenderActionZone: action.available || Boolean(action.configurationError),
      primaryAction: null,
    };
  }

  return {
    tone: 'read-only',
    title: summary.isArchived ? 'Chamado arquivado' : 'Sem acao operacional imediata',
    description: summary.isArchived
      ? 'Este chamado permanece disponivel apenas para consulta.'
      : 'O detalhe oficial nao expoe uma proxima acao para o ator autenticado neste momento.',
    showActionZoneAsPrimary: false,
    shouldRenderActionZone: action.available || Boolean(action.configurationError),
    primaryAction: null,
  };
}
```

Regra de design:

- o snippet acima deve preservar integralmente os branches oficiais de `respond-action`, `ready-to-advance`, `ready-to-finalize`, `request-action` e `read-only`; o Build 3 apenas refina copy/tom desses caminhos, sem simplificar a maquina de estados do Build 2;
- o helper continua sem conhecer `isAdvancing`, `isFinalizing` ou qualquer flag de mutation;
- busy labels continuam sendo apenas metadado de apresentacao, consumido pelo hero;
- qualquer regra de permissao continua vindo exclusivamente de `detail.permissions`.

### Pattern 2: Componentes oficiais bloqueados por mutation state propagado por props

```tsx
// src/components/workflows/management/RequestOperationalHero.tsx
{viewModel.primaryAction?.kind === 'advance' ? (
  <Button
    type="button"
    onClick={onAdvance}
    disabled={isAdvancing}
    aria-disabled={isAdvancing}
  >
    {isAdvancing ? viewModel.primaryAction.busyLabel : viewModel.primaryAction.label}
  </Button>
) : null}

{viewModel.primaryAction?.kind === 'finalize' ? (
  <Button
    type="button"
    onClick={onFinalize}
    disabled={isFinalizing}
    aria-disabled={isFinalizing}
  >
    {isFinalizing ? viewModel.primaryAction.busyLabel : viewModel.primaryAction.label}
  </Button>
) : null}

// src/components/workflows/management/RequestAdministrativePanel.tsx
<Button
  type="button"
  onClick={onAssign}
  disabled={!selectedResponsible || selectedResponsible.id3a === detail.summary.responsibleUserId || isAssigning}
  aria-disabled={!selectedResponsible || selectedResponsible.id3a === detail.summary.responsibleUserId || isAssigning}
>
  {isAssigning ? 'Salvando...' : detail.summary.hasResponsible ? 'Reatribuir responsavel' : 'Atribuir responsavel'}
</Button>

// src/components/workflows/management/RequestActionCard.tsx
const isBusy = isRequestingAction || isRespondingAction;

<Button type="button" onClick={handleRequestAction} disabled={isBusy} aria-disabled={isBusy}>
  {isRequestingAction ? 'Solicitando...' : `Solicitar ${action.label || 'action'}`}
</Button>
```

Diretriz:

- o Build 3 nao cria spinner global novo nem overlay de bloqueio;
- a superficie oficial usa labels existentes ou refinadas e `disabled` real nos controles clicaveis;
- campos de comentario/anexo respondem ao mesmo `isBusy` do CTA correspondente.

### Pattern 3: Fixture builder compartilhado para cenarios do modal

```ts
// src/lib/workflows/management/__tests__/request-detail-test-data.ts
import type { WorkflowManagementRequestDetailData } from '../types';

type DetailFixtureOverrides = Partial<WorkflowManagementRequestDetailData> & {
  summary?: Partial<WorkflowManagementRequestDetailData['summary']>;
  permissions?: Partial<WorkflowManagementRequestDetailData['permissions']>;
  progress?: Partial<WorkflowManagementRequestDetailData['progress']>;
  action?: Partial<WorkflowManagementRequestDetailData['action']>;
};

export function buildManagementRequestDetailFixture(
  overrides: DetailFixtureOverrides = {},
): WorkflowManagementRequestDetailData {
  const base: WorkflowManagementRequestDetailData = {
    summary: {
      docId: 'doc-1',
      requestId: 812,
      workflowTypeId: 'facilities_suprimentos',
      workflowVersion: 3,
      workflowName: 'Solicitacao de Suprimentos',
      areaId: 'facilities',
      ownerEmail: 'owner@3ariva.com.br',
      ownerUserId: 'SMO2',
      requesterUserId: 'REQ1',
      requesterName: 'Requester',
      responsibleUserId: 'RESP1',
      responsibleName: 'Responsavel',
      currentStepId: 'execucao',
      currentStepName: 'Execucao',
      currentStatusKey: 'execucao',
      statusCategory: 'in_progress',
      hasResponsible: true,
      hasPendingActions: false,
      pendingActionRecipientIds: [],
      pendingActionTypes: [],
      operationalParticipantIds: ['SMO2', 'RESP1'],
      slaDays: 5,
      slaState: 'on_track',
      expectedCompletionAt: null,
      lastUpdatedAt: null,
      finalizedAt: null,
      closedAt: null,
      archivedAt: null,
      submittedAt: null,
      submittedMonthKey: '2026-04',
      closedMonthKey: null,
      isArchived: false,
    },
    permissions: {
      canAssign: false,
      canAdvance: false,
      canFinalize: false,
      canArchive: false,
      canRequestAction: false,
      canRespondAction: false,
    },
    formData: { fields: [], extraFields: [] },
    attachments: [],
    progress: {
      currentStepId: 'execucao',
      totalSteps: 4,
      completedSteps: 2,
      items: [],
    },
    action: {
      available: true,
      state: 'idle',
      batchId: null,
      type: 'approval',
      label: 'Aprovar etapa',
      commentRequired: false,
      attachmentRequired: false,
      commentPlaceholder: null,
      attachmentPlaceholder: null,
      canRequest: false,
      canRespond: false,
      requestedAt: null,
      completedAt: null,
      requestedByUserId: null,
      requestedByName: null,
      recipients: [],
      configurationError: null,
    },
    timeline: [],
  };

  return {
    ...base,
    ...overrides,
    summary: {
      ...base.summary,
      ...overrides.summary,
    },
    permissions: {
      ...base.permissions,
      ...overrides.permissions,
    },
    progress: {
      ...base.progress,
      ...overrides.progress,
    },
    action: {
      ...base.action,
      ...overrides.action,
    },
  };
}
```

Convenios para os testes do Build 3:

- expor helpers pequenos como `withAdvanceReady()`, `withFinalizeReady()`, `withPendingResponseRecipient()`, `withArchivedRequest()`;
- evitar objetos inline gigantes em cada `it(...)`;
- alinhar o shape minimo com o contrato ja exercitado em `detail.test.js`.

## 6. API Contract

Nenhum endpoint novo ou alterado.

O Build 3 reaproveita integralmente os contratos oficiais ja em producao:

- `GET /api/workflows/read/requests/{id}`
- `POST /api/workflows/runtime/requests/{id}/assign-responsible`
- `POST /api/workflows/runtime/requests/{id}/advance`
- `POST /api/workflows/runtime/requests/{id}/finalize`
- `POST /api/workflows/runtime/requests/{id}/archive`
- `POST /api/workflows/runtime/requests/{id}/request-action`
- `POST /api/workflows/runtime/requests/{id}/respond-action`

O objetivo deste build e provar wiring, labels, disable states e close policy sobre esses contratos existentes.

## 7. Database Schema

Nenhuma mudanca no schema.

Sem alteracoes em Firestore, indices, colecoes, documentos, migracoes ou read models.

## 8. Testing Strategy

### Unit Tests

| Component | Test |
|-----------|------|
| `request-detail-view-model.ts` | validar copy e prioridade para `respondAction`, `advance`, `finalize`, `requestAction`, `finalized + canArchive` e `archived read-only` |
| fixture helper compartilhado | validar que overrides nao removem campos obrigatorios usados pelas suites do modal |

### Component Tests

| Component | Test |
|-----------|------|
| `RequestDetailDialog` | owner/responsavel com `canAdvance` ve CTA no hero, action secundaria quando `action.state = completed` e footer sem CTA operacional |
| `RequestDetailDialog` | owner/responsavel com `canFinalize` ve hero de conclusao com `Finalizar chamado` e `disabled` durante `isFinalizing` |
| `RequestDetailDialog` | request `finalized` com `canArchive` comunica conclusao e isola `Arquivar` no painel administrativo |
| `RequestDetailDialog` | request `archived` permanece em leitura, sem CTA primario nem heading de action vazio |
| `RequestDetailDialog` | estados de `isAdvancing`, `isFinalizing`, `isRequestingAction`, `isRespondingAction`, `isAssigning` e `isArchiving` refletem labels e `disabled` corretos |
| `RequestActionCard` | `Solicitar ...` usa `Solicitando...` e bloqueia reenvio durante `isRequestingAction` |
| `RequestActionCard` | formularios de `approval`, `acknowledgement` e `execution` ficam bloqueados durante `isRespondingAction` |
| `RequestActionCard` | destinatario de action ve superficie primaria de resposta sem CTA administrativo concorrente no proprio card |

### Integration Tests

| Flow | Test |
|------|------|
| `WorkflowManagementPage` + `advance` | ao disparar `onAdvance`, chama `advanceMutation.mutateAsync`, mostra toast de sucesso e mantem `selectedRequestId` aberto |
| `WorkflowManagementPage` + `finalize` | chama `finalizeMutation.mutateAsync`, mostra toast de sucesso e fecha o dialog |
| `WorkflowManagementPage` + `archive` | chama `archiveMutation.mutateAsync`, mostra toast de sucesso e fecha o dialog |
| `WorkflowManagementPage` + `requestAction` | chama `requestActionMutation.mutateAsync`, mostra toast de sucesso e mantem o dialog aberto |
| `WorkflowManagementPage` + `respondAction` | chama `respondActionMutation.mutateAsync` com payload correto e mantem o dialog aberto |
| `WorkflowManagementPage` erro de mutation | mostra toast destrutivo e nao fecha o dialog indevidamente |

### Manual Responsive Validation

- viewport `1440x900`: hero, action e painel administrativo aparecem sem clipping e com CTA principal visivel;
- viewport `1280x720`: header/footer seguem acessiveis e a coluna scrollavel nao corta labels de loading nem botoes;
- viewport `390x844`: leitura sequencial do modal continua clara e os estados `disabled` permanecem perceptiveis;
- smoke funcional real: validar ao menos um caso de `advance`, `finalize`, `requestAction`, `respondAction` e `archive`.

### Acceptance Tests

```gherkin
GIVEN um responsavel atual com `canAdvance = true` e `action.state = completed`
WHEN ele abre o modal do chamado
THEN o hero mostra "Avancar etapa" como CTA principal
AND a action concluida permanece apenas como evidencia secundaria
AND o footer nao exibe CTA operacional
```

```gherkin
GIVEN um destinatario com `canRespondAction = true`
WHEN a resposta da action esta sendo enviada
THEN os campos e botoes do formulario ficam desabilitados
AND o CTA principal passa a exibir uma label de envio em andamento
```

```gherkin
GIVEN um chamado arquivado
WHEN o modal e aberto
THEN a superficie entra em modo somente leitura
AND nenhum CTA operacional primario e exibido
```

## 9. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | reverter refinamentos de copy e flags em `request-detail-view-model.ts` | hero volta ao baseline do Build 2 sem alterar permissoes |
| 2 | reverter ajustes de `RequestOperationalHero.tsx`, `RequestActionCard.tsx` e `RequestAdministrativePanel.tsx` | labels/disabled states retornam ao comportamento anterior |
| 3 | remover helper compartilhado `request-detail-test-data.ts`, se criado | suites voltam aos builders inline anteriores |
| 4 | reverter atualizacoes das suites de `RequestDetailDialog`, `RequestActionCard` e `WorkflowManagementPage` | baseline de testes volta ao estado anterior do Build 3 |
| 5 | manter `WorkflowManagementPage.tsx` no baseline do Build 2 caso qualquer ajuste de close policy/testability precise ser desfeito | abertura/fechamento do dialog volta ao fluxo previamente validado |

**Metodo rapido:** `git revert <commit-do-build-3>`

## 10. Implementation Checklist

### Pre-Build

- [x] DEFINE document approved
- [x] Baseline de Build 1 e Build 2 carregado
- [x] Arquitetura do Build 3 documentada
- [x] Manifest focado em frontend/testes definido
- [x] Estrategia de testes e smoke responsivo definidos

### Post-Build

- [ ] helper compartilhado de fixtures criado ou alternativa equivalente adotada sem duplicacao excessiva
- [ ] copy terminal/transitoria refinada no view model e nas superficies do modal
- [ ] `disabled` e labels de loading provados para `advance`, `finalize`, `requestAction`, `respondAction`, `archive` e atribuicao
- [ ] dialog continua sem CTA principal no footer
- [ ] `WorkflowManagementPage` cobre wiring e close policy das mutations oficiais
- [ ] smoke responsivo registrado no build report do Build 3

## 11. Specialist Instructions

### For @react-frontend-developer

```markdown
Files to modify:
- src/lib/workflows/management/request-detail-view-model.ts
- src/components/workflows/management/RequestOperationalHero.tsx
- src/components/workflows/management/RequestActionCard.tsx
- src/components/workflows/management/RequestAdministrativePanel.tsx
- src/components/workflows/management/RequestDetailDialog.tsx
- src/lib/workflows/management/__tests__/request-detail-test-data.ts
- src/lib/workflows/management/__tests__/request-detail-view-model.test.ts
- src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx
- src/components/workflows/management/__tests__/RequestActionCard.test.tsx

Key requirements:
- nao alterar permissoes, contratos de payload ou runtime;
- preservar a hierarquia visual do Build 2;
- centralizar refinamentos de copy no helper e nas superficies existentes, sem criar nova estrutura de modal;
- provar `disabled` real e labels de busy nos componentes clicaveis;
- cobrir explicitamente `finalized + canArchive`, `archived`, `action completed + canAdvance` e `canRespondAction` em andamento.
```

### For @react-frontend-developer (integration focus)

```markdown
Files to modify:
- src/components/workflows/management/WorkflowManagementPage.tsx
- src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx
- optionally src/lib/workflows/read/__tests__/detail.test.js

Key requirements:
- manter ownership das mutations em WorkflowManagementPage;
- provar por teste que `advance`, `requestAction` e `respondAction` nao fecham o dialog;
- provar por teste que `finalize` e `archive` fecham o dialog apos sucesso;
- validar toasts de sucesso/erro sem reexecutar toda a DOM interna do dialog;
- se ajustar fixtures do read-side, manter o contrato compativel com as suites de UI.
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-17 | Codex (`design` skill) | Initial technical design for Build 3 of the operational management modal refactor, focused on confidence tests, transient states, copy refinements and page wiring verification |
| 1.1 | 2026-04-17 | Codex (`iterate` skill) | Completed Pattern 1 to preserve all official view-model branches (`respond-action`, `advance`, `finalize`, `request-action`, `read-only`) and corrected the terminal status gate from `completed` to `finalized` to match the management contract |
