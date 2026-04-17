# DESIGN: Build 2 - Refatoracao do modal operacional de gestao de chamados

> Generated: 2026-04-16
> Status: Ready for /build
> Source: `DEFINE_BUILD2_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`
> Depends on: `DEFINE_BUILD1_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`, `DESIGN_BUILD1_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`, `DESIGN_AJUSTES_UI_UX_GESTAO_DE_CHAMADOS_OPERACIONAL.md`

## 1. Requirements Summary

### Problem

O Build 1 corrigiu o contrato funcional do detalhe operacional, mas o modal oficial de `/gestao-de-chamados` ainda distribui contexto, CTA principal, action da etapa e administracao do chamado em uma composicao sem hierarquia dominante. Na pratica, o operador continua abrindo o dialog sem enxergar imediatamente quem deve agir agora, qual e o proximo passo do fluxo e quais comandos sao secundarios.

### Success Criteria

| Criterion | Target |
|-----------|--------|
| Zona operacional dominante | o modal abre com resumo + estado atual/proximo passo acima dos blocos de apoio |
| CTA principal no corpo | `advance`, `finalize`, `requestAction` e `respondAction` deixam de depender do `DialogFooter` como superficie primaria |
| Action tratada como parte do fluxo atual | `RequestActionCard` permanece oficial, mas entra em uma zona explicita e coerente com o passo atual |
| Administracao separada | atribuicao e arquivamento ficam em bloco proprio, sem competir com o CTA de continuidade |
| Footer estavel | o footer deixa de concentrar acoes essenciais e passa a servir como fechamento/global secondary |
| Responsividade operacional | desktop e mobile mostram contexto, prioridade e comandos sem clipping estrutural |
| Contrato Build 1 preservado | nenhuma inferencia local nova de permissao; a UI continua obedecendo ao payload oficial |

### Constraints

- `RequestDetailDialog` continua sendo a entrypoint publica do detalhe operacional;
- o build e predominantemente frontend e nao reabre regras de runtime do Build 1;
- `permissions`, `action`, `progress`, `summary` e `timeline` continuam como fontes oficiais de verdade;
- `respondAction` continua sem mover etapa sozinho;
- `DialogContent`, `ScrollArea` e `DialogFooter` podem ser ajustados apenas no grau necessario para estabilidade do modal;
- nao ha nova rota, novo endpoint, novo schema ou nova categoria de workflow.

## 2. Architecture

### Source of Truth

Este design foi elaborado a partir de:

- [DEFINE_BUILD2_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_BUILD2_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md)
- [DEFINE_BUILD1_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_BUILD1_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md)
- [DESIGN_BUILD1_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_BUILD1_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md)
- [DESIGN_AJUSTES_UI_UX_GESTAO_DE_CHAMADOS_OPERACIONAL.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_AJUSTES_UI_UX_GESTAO_DE_CHAMADOS_OPERACIONAL.md)
- [BRAINSTORM_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/BRAINSTORM_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md)
- [RequestDetailDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestDetailDialog.tsx)
- [RequestActionCard.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestActionCard.tsx)
- [WorkflowManagementPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/WorkflowManagementPage.tsx)
- [RequestProgress.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestProgress.tsx)
- [RequestTimeline.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestTimeline.tsx)
- [RequestFormData.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestFormData.tsx)
- [RequestAttachments.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestAttachments.tsx)
- [use-workflow-management.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/hooks/use-workflow-management.ts)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/types.ts)
- [api-client.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/api-client.ts)
- [dialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/ui/dialog.tsx)
- [scroll-area.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/ui/scroll-area.tsx)
- [RequestDetailDialog.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx)

Em caso de divergencia:

1. prevalece o `DEFINE_BUILD2` para escopo, metas e aceite;
2. prevalece o contrato funcional fechado no Build 1 para permissoes e semantica de `advance/finalize/requestAction/respondAction`;
3. prevalece este design para ordenar zonas visuais, responsabilidades de componente e estrategia de testes.

### Current Snapshot

O snapshot atual do codigo revela cinco limitacoes que este build precisa resolver:

1. `RequestDetailDialog.tsx` ainda usa um bloco de resumo generico seguido por cards de mesmo peso visual, sem uma zona dominante de "o que fazer agora".
2. `RequestActionCard.tsx` e renderizado como mais um bloco do corpo, sem diferenca clara entre action da etapa, progresso e timeline.
3. `advance`, `finalize` e `archive` continuam presos ao `DialogFooter`, o que faz o footer competir com o corpo do modal.
4. a combinacao `DialogContent` em grid + `ScrollArea` com `max-h` fixo dificulta o encaixe consistente do footer em viewports menores.
5. os testes atuais validam presenca de botoes, mas ainda nao verificam ordem operacional, dominancia do CTA principal nem isolamento da administracao.

### Target Composition

O Build 2 reorganiza o modal em cinco zonas explicitas:

1. `Resumo do chamado`: badges, metadados principais e identificacao do contexto operacional.
2. `Estado atual e proximo passo`: card dominante com copy orientada ao ator autenticado e CTA principal do fluxo quando aplicavel.
3. `Action da etapa`: superficie oficial da action atual, priorizada quando o payload indicar resposta pendente ou quando a etapa trabalha com action.
4. `Administracao do chamado`: atribuicao/reatribuicao e arquivamento em bloco proprio, sem competir com o proximo passo do fluxo.
5. `Blocos de apoio`: progresso, timeline, dados enviados e anexos, com leitura secundaria e progressiva.

### System Diagram

```text
Authenticated operator
  |
  +--> /gestao-de-chamados
         |
         +--> WorkflowManagementPage
         |      |
         |      +--> useWorkflowManagement
         |      |      |
         |      |      \--> GET /api/workflows/read/requests/{id}
         |      |
         |      \--> RequestDetailDialog (same public entrypoint)
         |             |
         |             +--> buildRequestOperationalViewModel(detail)  [display-only helper]
         |             |
         |             +--> Zone 1: Request summary strip
         |             +--> Zone 2: Current step / next step hero
         |             +--> Zone 3: RequestActionCard (official action surface)
         |             +--> Zone 4: Administrative actions panel
         |             +--> Zone 5: Support information grid
         |             \--> DialogFooter (close-only or global secondary)
         |
         \--> Existing mutations
                +--> assignMutation
                +--> advanceMutation
                +--> finalizeMutation
                +--> archiveMutation
                +--> requestActionMutation
                \--> respondActionMutation
```

### Data Flow

```text
LAYER 1 (Official contract)
1. `detailQuery` continua consumindo o payload oficial de detalhe sem alteracao de endpoint.
2. `summary`, `permissions`, `action`, `progress`, `timeline` e `attachments` seguem como unicas fontes de verdade.

LAYER 2 (Display orchestration)
3. `RequestDetailDialog` constroi um view model puramente visual a partir do payload oficial.
4. Esse helper nao cria elegibilidade nova; ele apenas traduz o payload em:
   - headline operacional;
   - copy contextual;
   - CTA principal no corpo;
   - destaque visual da zona de action;
   - visibilidade do bloco administrativo.
   - regra explicita de que `action completed` nao volta a dominar o modal quando o payload ja expuser `canAdvance` ou `canFinalize`.

LAYER 3 (Modal shell)
5. O corpo do dialog passa a ser uma coluna flexivel com `min-h-0` e `ScrollArea` ocupando a area central.
6. Header e footer ficam fora da regiao scrollavel.
7. O footer deixa de ser a superficie primaria de `advance/finalize/requestAction/respondAction`.
8. O footer passa a conter apenas `Fechar`, sem duplicacao de CTA operacional ou administrativo entre body e footer.

LAYER 4 (Action and admin separation)
8. `RequestActionCard` continua executando `onRequestAction` e `onRespondAction` diretamente.
9. `advance` e `finalize` passam a viver no card de proximo passo.
10. atribuicao/reatribuicao e `archive` passam a viver em um painel administrativo independente.

LAYER 5 (Support reading)
11. `RequestProgress`, `RequestTimeline`, `RequestFormData` e `RequestAttachments` continuam consumindo o mesmo shape.
12. Eles deixam de disputar a primeira dobra e passam a compor a leitura secundaria do modal.
```

### State Management

| State | Storage | Lifecycle |
|-------|---------|-----------|
| `selectedRequestId` | `useState` em `WorkflowManagementPage` | continua abrindo/fechando o dialog; permanece aberto apos `advance` e `respondAction`; fecha apos `finalize/archive` |
| `detailQuery.data` | React Query | fonte oficial do modal; refetch apos mutacoes existentes |
| `selectedResponsibleId` | `useState` em `RequestDetailDialog` ou em painel extraido | sincroniza com `detail.summary.responsibleUserId`; resetado ao trocar request |
| `requestOperationalViewModel` | valor derivado local | recalculado a cada mudanca de `detail`; nao persiste fora do dialog |
| formulario de resposta da action | estado local em `RequestActionCard` | permanece restrito ao componente da action |
| `isAssigning/isAdvancing/isFinalizing/isArchiving/isRequestingAction/isRespondingAction` | estados de mutation | continuam vindo de `useWorkflowManagement` |
| loading/error shell state | props do dialog (`isLoading`, `errorMessage`, `detail`) | preserva header/footer fixos; estados assíncronos vivem apenas no corpo scrollavel |

### Planned Operational Priority Matrix

| Scenario | Dominant Zone | Primary CTA | Secondary Surface |
|----------|---------------|-------------|-------------------|
| destinatario com `canRespondAction` | action da etapa | formulario/resposta em `RequestActionCard` | hero apenas contextualiza o papel atual |
| owner/responsavel com `canAdvance` | estado atual / proximo passo | `Avancar etapa` no corpo | action concluida aparece como evidencia secundaria |
| owner/responsavel com `canFinalize` | estado atual / conclusao | `Finalizar chamado` no corpo | administracao fica separada |
| owner/responsavel com `canRequestAction` | estado atual + action da etapa | CTA de solicitar action em zona de action | sem CTA de continuidade no footer |
| request sem acao operacional | estado atual / leitura | nenhum CTA primario, apenas copy explicativa | administracao aparece apenas se o payload permitir |
| request finalizado com `canArchive` | administracao do chamado | `Arquivar` no painel administrativo | hero comunica status concluido, sem confundir com fluxo ativo |

Regra complementar:

- `showActionZoneAsPrimary = true` apenas quando o payload oficial colocar o ator em papel de action (`canRespondAction`) ou quando a etapa atual estiver aguardando abertura/execucao de `requestAction`;
- `showActionZoneAsPrimary = false` quando o payload ja expuser `canAdvance` ou `canFinalize`, mesmo que exista batch concluido visivel em `action.state = completed`;
- destinatario com `canRespondAction` pode continuar vendo contexto e administracao somente como superficies subordinadas; nenhuma delas disputa prioridade com a resposta da action.

### Planned Responsive Layout

#### Desktop (`xl` e acima)

- `DialogContent` em coluna flex com largura maxima ampliada;
- topo do corpo com resumo e hero ocupando a coluna principal;
- grid principal `xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.95fr)]`;
- coluna esquerda:
  - resumo;
  - hero operacional;
  - action da etapa;
  - administracao;
- coluna direita:
  - progresso;
  - timeline;
  - dados enviados;
  - anexos.

#### Tablet e mobile

- todas as zonas empilhadas em uma unica coluna;
- hero continua antes da action e da administracao;
- footer reduzido para evitar empilhamento excessivo de botoes;
- `ScrollArea` ocupa a area central do dialog, mantendo header e footer acessiveis.

## 3. Architecture Decisions

### ADR-B2-001: O CTA principal sai do footer e passa a ser body-first

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-16 |
| **Context** | O footer atual concentra `advance`, `finalize`, `archive` e `fechar`, fazendo comandos de fluxo competirem com acoes administrativas e com o proprio fechamento do modal. |

**Choice:** mover `advance` e `finalize` para a zona `Estado atual e proximo passo`, mantendo o footer como superficie de fechamento e, no maximo, de acoes globais realmente secundarias.

**Rationale:**
1. torna o proximo passo visivel acima da dobra em desktop;
2. reduz a dependencia de um footer estruturalmente fragil para acoes essenciais;
3. traduz no layout o contrato funcional ja corrigido no Build 1.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| manter `advance/finalize` no footer com destaque visual maior | preserva a competicao estrutural e nao resolve a hierarquia fraca |
| duplicar CTA no corpo e no footer | aumenta ambiguidade, risco de regressao visual e custo de teste |

**Consequences:**
- positivo: o operador passa a identificar o proximo passo sem percorrer todo o modal;
- positivo: o footer fica mais estavel e previsivel;
- negativo: os testes atuais precisam ser atualizados porque o DOM das acoes muda de lugar.

### ADR-B2-002: Um helper de view model organiza copy e destaque sem inferir permissoes

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-16 |
| **Context** | O dialog precisara decidir headlines, textos de apoio, intensidade visual e presenca de CTA no corpo sem espalhar condicoes longas pela arvore JSX. |

**Choice:** criar um helper puro de apresentacao, ex.: `buildRequestOperationalViewModel(detail)`, restrito a traducao do payload oficial para estado visual.

**Rationale:**
1. centraliza as regras de hierarquia sem reinventar authz no cliente;
2. facilita testes unitarios da ordem de prioridade visual;
3. reduz branching inline em `RequestDetailDialog.tsx`.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| manter toda a logica diretamente no JSX do dialog | piora legibilidade e dificulta testes de regressao |
| derivar o estado visual apenas de `statusCategory` | e simplista demais para distinguir `respondAction`, `advance` e `finalize` |

**Consequences:**
- positivo: a hierarquia visual fica explicita e testavel;
- negativo: introduz mais um helper frontend para manter.

### ADR-B2-003: `RequestActionCard` continua sendo a superficie oficial da action, mas deixa de competir com a continuidade do fluxo

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-16 |
| **Context** | O define proibe substituir a experiencia oficial da action, mas pede que ela seja encaixada em hierarquia superior do modal. |

**Choice:** preservar `RequestActionCard` como componente oficial de request/response, porem renderizado em zona dedicada e com apoio do hero para contextualizar seu papel.

**Rationale:**
1. protege o contrato do Build 1 e os handlers ja existentes;
2. evita duplicar formularios ou botoes de action em superficies paralelas;
3. permite dar prioridade maxima a `respondAction` sem misturar action com administracao.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| mover solicitacao/resposta de action para dentro do hero principal | mistura operacao de etapa com shell contextual e infla demais o card dominante |
| criar um segundo componente de action so para o modal novo | duplica comportamento e aumenta risco de drift funcional |

**Consequences:**
- positivo: a action permanece oficial e reconhecivel;
- positivo: o modal ganha hierarquia sem reimplementar logica de action;
- negativo: `RequestActionCard` pode precisar de pequenas props de variante para encaixe visual melhor.

### ADR-B2-004: Administracao do chamado vira zona propria, separada do fluxo

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-16 |
| **Context** | atribuicao/reatribuicao e arquivamento hoje aparecem misturados com o restante do detalhe e com CTAs de fluxo no footer. |

**Choice:** agrupar atribuicao/reatribuicao e arquivamento em um painel `Administracao do chamado`, explicitamente secundario em relacao a `advance/finalize/respondAction`.

**Rationale:**
1. deixa claro que administracao nao e o proximo passo natural do workflow;
2. reduz concorrencia visual entre comandos de natureza diferente;
3. melhora legibilidade para owner/responsavel em cenarios de multiplas permissoes.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| manter atribuicao no corpo e `archive` no footer | continua dividindo comandos administrativos em dois lugares |
| esconder administracao atras de dropdown ou menu contextual | reduz descobribilidade e adiciona interacao desnecessaria |

**Consequences:**
- positivo: separacao operacional mais clara;
- negativo: o corpo do dialog fica mais estruturado e exige pequenas extracoes de componente.

### ADR-B2-005: O primeiro ajuste de clipping sera modal-local, nao uma refatoracao ampla das primitives

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-16 |
| **Context** | O define autoriza tocar `dialog.tsx` e `scroll-area.tsx` apenas se necessario, e o problema atual parece concentrado no shell do detalhe operacional. |

**Choice:** reestruturar primeiro `RequestDetailDialog` com `flex`, `min-h-0` e corpo central scrollavel; so tocar `dialog.tsx` ou `scroll-area.tsx` se ainda restar clipping real apos essa mudanca.

**Rationale:**
1. reduz risco de regressao em outros dialogs da aplicacao;
2. resolve o problema mais perto do caso real;
3. simplifica rollback.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| refatorar imediatamente a primitive compartilhada de dialog | amplia escopo e risco sem provar necessidade global |
| manter a estrutura atual e apenas trocar alturas fixas | tende a mascarar o problema sem resolver a composicao |

**Consequences:**
- positivo: patch mais cirurgico;
- negativo: pode sobrar um ajuste pequeno na primitive compartilhada se houver comportamento especifico do Radix em certos dispositivos.

## 4. File Manifest

### Execution Order

| Phase | Files | Agent |
|-------|-------|-------|
| 1. View model operacional | `src/lib/workflows/management/request-detail-view-model.ts` | @react-frontend-developer |
| 2. Modal shell e zonas | `src/components/workflows/management/RequestDetailDialog.tsx`, novos subcomponentes do detalhe | @react-frontend-developer |
| 3. Action/admin/support encaixados | `RequestActionCard.tsx`, possivel painel administrativo | @react-frontend-developer |
| 4. Validation | testes do dialog, helper e action card | @react-frontend-developer |
| 5. Primitive fallback only-if-needed | `src/components/ui/dialog.tsx`, `src/components/ui/scroll-area.tsx` | @react-frontend-developer |

### Detailed Manifest

| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | `src/lib/workflows/management/request-detail-view-model.ts` | Create | traduzir payload oficial em headline, prioridade, copy contextual e CTA principal sem criar authz nova | @react-frontend-developer | - |
| 2 | `src/components/workflows/management/RequestDetailDialog.tsx` | Modify | transformar o dialog em shell por zonas, mover CTA principal para o corpo e estabilizar composicao header/body/footer | @react-frontend-developer | #1 |
| 3 | `src/components/workflows/management/RequestOperationalHero.tsx` | Create | renderizar estado atual, proximo passo, ator responsavel e CTA principal do fluxo | @react-frontend-developer | #1 |
| 4 | `src/components/workflows/management/RequestAdministrativePanel.tsx` | Create | concentrar atribuicao/reatribuicao e arquivamento em superficie secundaria | @react-frontend-developer | #2 |
| 5 | `src/components/workflows/management/RequestActionCard.tsx` | Modify | aceitar encaixe visual mais forte no modal novo sem alterar handlers nem contrato funcional | @react-frontend-developer | #2 |
| 6 | `src/components/workflows/management/RequestProgress.tsx` | Reuse or minor modify | continuar apresentando progresso como bloco de apoio com encaixe consistente na nova coluna secundaria | @react-frontend-developer | #2 |
| 7 | `src/components/workflows/management/RequestTimeline.tsx` | Reuse or minor modify | continuar exibindo historico oficial como bloco de apoio secundario | @react-frontend-developer | #2 |
| 8 | `src/components/workflows/management/RequestFormData.tsx` | Reuse or minor modify | manter dados enviados no grupo de apoio | @react-frontend-developer | #2 |
| 9 | `src/components/workflows/management/RequestAttachments.tsx` | Reuse or minor modify | manter anexos no grupo de apoio | @react-frontend-developer | #2 |
| 10 | `src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx` | Modify | validar ordem das zonas, CTA no corpo, separacao administrativa e footer reduzido | @react-frontend-developer | #2, #3, #4 |
| 11 | `src/lib/workflows/management/__tests__/request-detail-view-model.test.ts` | Create | cobrir matriz de prioridade visual sem renderizar o dialog inteiro | @react-frontend-developer | #1 |
| 12 | `src/components/workflows/management/__tests__/RequestActionCard.test.tsx` | Create or Modify | validar variante/encaixe do card sem quebrar request/respond oficiais | @react-frontend-developer | #5 |
| 13 | `src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx` | Preserve or minor modify | garantir que o container continua ligando `advance/finalize/archive/requestAction/respondAction` ao dialog | @react-frontend-developer | #2 |
| 14 | `src/components/ui/dialog.tsx` | Preserve or minor modify | apenas se a composicao modal-local nao bastar para resolver clipping | @react-frontend-developer | #2 |
| 15 | `src/components/ui/scroll-area.tsx` | Preserve or minor modify | apenas se necessario para suportar `h-full/min-h-0` do shell novo | @react-frontend-developer | #2 |

Nota de composicao:

- nao ha um componente standalone `RequestActionSection` neste build;
- a zona de action sera composta diretamente em `RequestDetailDialog.tsx`, reutilizando `RequestActionCard` como superficie oficial e adicionando apenas heading/copy local se necessario.

## 5. Code Patterns

### Pattern 1: Helper de view model puramente visual

```ts
// src/lib/workflows/management/request-detail-view-model.ts
import type { WorkflowManagementRequestDetailData } from './types';

export type RequestOperationalTone =
  | 'respond-action'
  | 'ready-to-advance'
  | 'ready-to-finalize'
  | 'request-action'
  | 'read-only';

export type RequestOperationalViewModel = {
  tone: RequestOperationalTone;
  title: string;
  description: string;
  highlightLabel?: string;
  showActionZoneAsPrimary: boolean;
  shouldRenderActionZone: boolean;
  primaryAction:
    | { kind: 'advance'; label: 'Avancar etapa' }
    | { kind: 'finalize'; label: 'Finalizar chamado' }
    | null;
};

export function buildRequestOperationalViewModel(
  detail: WorkflowManagementRequestDetailData,
): RequestOperationalViewModel {
  const { summary, permissions, action } = detail;

  if (permissions.canRespondAction && action.canRespond) {
    return {
      tone: 'respond-action',
      title: 'Aguardando sua resposta',
      description: `A etapa ${summary.currentStepName} depende da sua resposta na action atual.`,
      highlightLabel: 'Voce precisa agir agora',
      showActionZoneAsPrimary: true,
      shouldRenderActionZone: true,
      primaryAction: null,
    };
  }

  if (permissions.canAdvance) {
    return {
      tone: 'ready-to-advance',
      title: 'Pronto para avancar',
      description: `A etapa ${summary.currentStepName} ja pode seguir para o proximo passo oficial.`,
      highlightLabel: 'Proximo passo disponivel',
      showActionZoneAsPrimary: false,
      shouldRenderActionZone: action.available || Boolean(action.configurationError),
      primaryAction: { kind: 'advance', label: 'Avancar etapa' },
    };
  }

  if (permissions.canFinalize) {
    return {
      tone: 'ready-to-finalize',
      title: 'Pronto para concluir',
      description: `O chamado ja atingiu a etapa imediatamente anterior a conclusao oficial.`,
      highlightLabel: 'Conclusao disponivel',
      showActionZoneAsPrimary: false,
      shouldRenderActionZone: action.available || Boolean(action.configurationError),
      primaryAction: { kind: 'finalize', label: 'Finalizar chamado' },
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

  return {
    tone: 'read-only',
    title: 'Sem acao operacional imediata',
    description: 'O detalhe oficial nao expoe uma proxima acao para o ator autenticado neste momento.',
    showActionZoneAsPrimary: false,
    shouldRenderActionZone: action.available || Boolean(action.configurationError),
    primaryAction: null,
  };
}
```

### Pattern 2: Shell do dialog com header/footer fixos e corpo scrollavel

```tsx
// src/components/workflows/management/RequestDetailDialog.tsx
<DialogContent className="flex h-[min(92vh,calc(100vh-2rem))] max-w-6xl flex-col overflow-hidden p-0">
  <DialogHeader className="shrink-0 border-b px-6 py-5">
    <DialogTitle>Chamado #{summary.requestId}</DialogTitle>
    <DialogDescription>{description}</DialogDescription>
  </DialogHeader>

  <div className="min-h-0 flex-1">
    <ScrollArea className="h-full">
      <div className="space-y-6 px-6 py-5">
        <RequestSummaryStrip detail={detail} />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.95fr)]">
          <div className="space-y-6">
            <RequestOperationalHero
              detail={detail}
              viewModel={viewModel}
              onAdvance={handleAdvance}
              onFinalize={handleFinalize}
            />
            {viewModel.shouldRenderActionZone ? (
              <section className="space-y-3">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-foreground">Action da etapa</h2>
                  <p className="text-sm text-muted-foreground">
                    A surface oficial de `requestAction/respondAction` continua vivendo neste bloco.
                  </p>
                </div>
                <RequestActionCard
                  detail={detail}
                  collaborators={collaborators}
                  onRequestAction={onRequestAction}
                  onRespondAction={onRespondAction}
                  isRequestingAction={isRequestingAction}
                  isRespondingAction={isRespondingAction}
                />
              </section>
            ) : null}
            <RequestAdministrativePanel
              detail={detail}
              collaborators={collaborators}
              selectedResponsibleId={selectedResponsibleId}
              onResponsibleChange={setSelectedResponsibleId}
              onAssign={handleAssign}
              onArchive={handleArchive}
              isAssigning={isAssigning}
              isArchiving={isArchiving}
            />
          </div>

          <div className="space-y-6">
            <RequestProgress progress={detail.progress} />
            <RequestTimeline timeline={detail.timeline} />
            <RequestFormData formData={detail.formData} />
            <RequestAttachments attachments={detail.attachments} />
          </div>
        </div>
      </div>
    </ScrollArea>
  </div>

  <DialogFooter className="shrink-0 border-t px-6 py-4">
    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
      Fechar
    </Button>
  </DialogFooter>
</DialogContent>
```

Estados estruturais do shell:

- loading sem `detail`: header e footer continuam fixos; o corpo scrollavel renderiza apenas `ManagementAsyncState` com loading content, sem hero, action ou administracao;
- erro bloqueante sem `detail`: header e footer continuam fixos; o corpo renderiza apenas o estado de erro oficial;
- erro nao bloqueante com `detail`: o erro aparece como aviso secundario no topo do corpo, sem deslocar a prioridade do hero nem reintroduzir CTA no footer.
- sem action disponivel e sem `configurationError`: a zona `Action da etapa` nao e renderizada; o modal segue do hero diretamente para administracao e blocos de apoio.

### Pattern 3: Painel administrativo separado do fluxo

```tsx
// src/components/workflows/management/RequestAdministrativePanel.tsx
type RequestAdministrativePanelProps = {
  detail: WorkflowManagementRequestDetailData;
  collaborators: Collaborator[];
  selectedResponsibleId: string;
  onResponsibleChange: (value: string) => void;
  onAssign: () => Promise<unknown>;
  onArchive: () => Promise<unknown>;
  isAssigning?: boolean;
  isArchiving?: boolean;
};

export function RequestAdministrativePanel(props: RequestAdministrativePanelProps) {
  const canShowAssignForm = props.detail.permissions.canAssign;
  const canShowArchive = props.detail.permissions.canArchive;

  if (!canShowAssignForm && !canShowArchive) {
    return null;
  }

  return (
    <section className="rounded-xl border bg-background p-4">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-foreground">Administracao do chamado</h2>
        <p className="text-sm text-muted-foreground">
          Ajustes administrativos ficam separados do proximo passo do fluxo.
        </p>
      </div>

      {canShowAssignForm ? <ResponsibleAssignmentForm {...props} /> : null}

      {canShowArchive ? (
        <div className="mt-4 flex justify-end">
          <Button type="button" variant="outline" onClick={props.onArchive} disabled={props.isArchiving}>
            {props.isArchiving ? 'Arquivando...' : 'Arquivar'}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
```

## 6. API Contract

Nenhum endpoint novo ou alterado.

O Build 2 reaproveita integralmente os contratos oficiais ja fechados no Build 1:

- `GET /api/workflows/read/requests/{id}`
- `POST /api/workflows/runtime/requests/{id}/assign-responsible`
- `POST /api/workflows/runtime/requests/{id}/advance`
- `POST /api/workflows/runtime/requests/{id}/finalize`
- `POST /api/workflows/runtime/requests/{id}/archive`
- `POST /api/workflows/runtime/requests/{id}/request-action`
- `POST /api/workflows/runtime/requests/{id}/respond-action`

Mudanca esperada apenas na composicao visual do frontend. Nenhum campo novo e necessario no payload oficial.

## 7. Database Schema

Nenhuma mudanca no schema.

Sem alteracoes em Firestore, indices, colecoes, documentos ou migracoes.

## 8. Testing Strategy

### Unit Tests

| Component | Test |
|-----------|------|
| `request-detail-view-model.ts` | validar tons e CTA prioritario para `canRespondAction`, `canAdvance`, `canFinalize`, `canRequestAction` e estado read-only |
| helper de copy/ordem das zonas | garantir que a action vira primaria apenas quando o payload oficial indicar esse papel |

### Component Tests

| Component | Test |
|-----------|------|
| `RequestDetailDialog` | renderiza zonas com headings distintos: resumo, proximo passo, action da etapa, administracao e apoio |
| `RequestDetailDialog` | `Avancar etapa` aparece no corpo e nao no footer quando `canAdvance === true` |
| `RequestDetailDialog` | `Finalizar chamado` aparece no corpo e separado de `Arquivar` |
| `RequestDetailDialog` | `RespondAction` torna a zona de action dominante para destinatario pendente |
| `RequestDetailDialog` | request sem `action.available` e sem `configurationError` nao renderiza heading vazio de action |
| `RequestDetailDialog` | footer permanece com `Fechar` e sem CTA operacional primario |
| `RequestDetailDialog` | loading bloqueante preserva header/footer e nao renderiza hero/action/admin |
| `RequestDetailDialog` | erro bloqueante preserva shell fixo sem renderizar zonas operacionais |
| `RequestDetailDialog` | erro nao bloqueante com `detail` mantem hero e CTA principal, exibindo erro apenas como aviso secundario |
| `RequestAdministrativePanel` | atribuicao e arquivamento aparecem apenas quando o payload permitir |
| `RequestActionCard` | mantem request/respond oficiais e suporta variante de encaixe no modal novo |

### Integration Tests

| Flow | Test |
|------|------|
| owner/responsavel com `canAdvance` | abre detalhe, encontra hero com CTA de continuidade e executa `onAdvance` |
| owner/responsavel com `canFinalize` | encontra CTA de conclusao no corpo e nao no footer |
| owner/responsavel com `canRequestAction` | hero contextualiza a etapa e `RequestActionCard` disponibiliza a solicitacao |
| destinatario com `canRespondAction` | action e priorizada e `onRespondAction` continua sendo disparado pelo card oficial |
| request finalizado com `canArchive` | hero comunica status concluido e arquivamento aparece no painel administrativo |

### Manual Responsive Validation

- viewport desktop aproximado `1440x900`: resumo + hero + CTA principal visiveis sem depender da timeline;
- viewport notebook menor `1280x720`: header, corpo scrollavel e footer sem clipping;
- viewport mobile `390x844`: leitura sequencial clara, footer acessivel e sem stack excessivo de botoes.
- loading/error em desktop e mobile: header/footer permanecem acessiveis e nenhum CTA operacional migra para o footer.

### Acceptance Tests

```gherkin
GIVEN um responsavel atual com `canAdvance = true`
WHEN ele abre o modal do chamado
THEN o card de proximo passo mostra "Avancar etapa" no corpo
AND o footer nao e a superficie primaria dessa acao
```

```gherkin
GIVEN um destinatario com `canRespondAction = true`
WHEN ele abre o modal do chamado
THEN a action da etapa e apresentada como prioridade operacional
AND os comandos administrativos nao concorrem visualmente com a resposta
```

```gherkin
GIVEN um chamado finalizado com `canArchive = true`
WHEN o modal e aberto
THEN o status de conclusao fica claro no hero
AND `Arquivar` aparece apenas no bloco administrativo
```

## 9. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | reverter a nova composicao de `RequestDetailDialog.tsx` para o shell anterior | o modal volta a exibir resumo + cards + footer com CTAs antigos |
| 2 | remover `request-detail-view-model.ts` e subcomponentes novos | build volta a depender apenas do dialog monolitico anterior |
| 3 | restaurar `RequestActionCard.tsx` para a variante anterior, se houver props novas | request/respond continuam operando como antes |
| 4 | reverter atualizacoes de testes do Build 2 | suite volta a refletir a estrutura original |
| 5 | se tiver havido fallback em primitive compartilhada, reverter patch isolado de `dialog.tsx` ou `scroll-area.tsx` | outros dialogs mantem comportamento anterior |

**Metodo rapido:** `git revert <commit-do-build-2>`

## 10. Implementation Checklist

### Pre-Build

- [x] DEFINE document approved
- [x] Contrato funcional do Build 1 disponivel
- [x] Arquitetura e ADRs do Build 2 documentadas
- [x] File manifest mapeado para frontend
- [x] Estrategia de testes definida

### Post-Build

- [ ] `RequestDetailDialog` reorganizado em zonas explicitas
- [ ] `advance/finalize` removidos do papel de CTA principal do footer
- [ ] `RequestActionCard` encaixado como zona oficial da action
- [ ] administracao isolada em bloco proprio
- [ ] layout responsivo sem clipping em desktop/mobile
- [ ] testes unitarios e de componente cobrindo prioridade de CTA e ordem visual

## 11. Specialist Instructions

### For @react-frontend-developer

```markdown
Files to modify:
- src/lib/workflows/management/request-detail-view-model.ts
- src/components/workflows/management/RequestDetailDialog.tsx
- src/components/workflows/management/RequestOperationalHero.tsx
- src/components/workflows/management/RequestAdministrativePanel.tsx
- src/components/workflows/management/RequestActionCard.tsx
- src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx
- src/lib/workflows/management/__tests__/request-detail-view-model.test.ts

Key requirements:
- manter `RequestDetailDialog` como entrypoint publica;
- nao inferir permissao nova no cliente; apenas traduzir o payload oficial em hierarquia visual;
- colocar `advance` e `finalize` no corpo do modal;
- separar `archive` e atribuicao em bloco administrativo;
- preservar handlers e toasts existentes em `WorkflowManagementPage`;
- resolver clipping primeiro via composicao local do dialog antes de tocar primitives compartilhadas.
```

### For @react-frontend-developer (validation focus)

```markdown
Files to modify:
- src/components/workflows/management/__tests__/RequestActionCard.test.tsx
- src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx
- optionally src/components/ui/dialog.tsx
- optionally src/components/ui/scroll-area.tsx

Key requirements:
- provar por teste que o CTA principal nao depende mais do footer;
- cobrir a matriz owner/responsavel/destinatario com estados `advance`, `finalize`, `requestAction` e `respondAction`;
- se houver ajuste em primitive compartilhada, garantir que ele e minimo e sem regressao para outros dialogs.
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.1 | 2026-04-16 | Codex (`iterate` skill) | Clarified that completed action batches remain secondary when `canAdvance/canFinalize` are present, removed the implicit `RequestActionSection` ambiguity, hardened footer semantics to close-only, and added explicit shell/test guidance for loading and error states |
| 1.2 | 2026-04-16 | Codex (`iterate` skill) | Fixed the administrative panel wiring in Pattern 2, made the action zone explicitly conditional to avoid empty headings, and aligned the view model and component tests with that rendering rule |
| 1.0 | 2026-04-16 | Codex (`design` skill) | Initial technical design for Build 2 of the operational management modal refactor, covering hierarchy, responsive shell, CTA priority, file manifest and testing strategy |
