# DESIGN: SIMPLIFICACAO_VISUAL_MODAL_OPERACIONAL_GESTAO_CHAMADOS

> Generated: 2026-04-20
> Status: Ready for /build
> Source: `DEFINE_SIMPLIFICACAO_VISUAL_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`
> Depends on: implementacao atual de `RequestDetailDialog`, `request-detail-view-model.ts` e no baseline consolidado pelos builds anteriores do modal operacional

## 1. Requirements Summary

### Problem

O modal operacional de `/gestao-de-chamados` ja preserva os contratos funcionais de atribuicao, continuidade, action e arquivamento, mas ainda apresenta excesso de blocos empilhados, copy longa e hierarquia visual pouco objetiva. O objetivo desta rodada e reduzir densidade visual e corrigir PT-BR sem reabrir runtime, permissoes, handlers ou contratos de detalhe.

### Success Criteria

| Criterion | Target |
|-----------|--------|
| Resumo full-width | `Resumo do chamado` passa a ocupar a primeira faixa inteira do body do dialog |
| Macrozona enxuta | `Acao atual` concentra continuidade oficial, `Action da etapa` e `Administracao do chamado` com menos cards e copy mais curta |
| Render dinamico previsivel | cada subbloco aparece apenas quando `detail.permissions`, `action` e estado do request justificarem exibicao |
| Hero redundante removido | o bloco equivalente ao hero atual deixa de existir como card alto e passa a ser um resumo operacional compacto |
| Historico colapsavel | `Historico do chamado` vira secao de nivel superior iniciando recolhida e preserva fallback legado |
| Dados enviados colapsavel | `Dados enviados` vira secao de nivel superior iniciando recolhida e preserva ordem canonica de campos/anexos |
| Faixa inferior responsiva | `Historico do chamado` e `Dados enviados` ficam lado a lado em larguras amplas e empilham em larguras menores |
| PT-BR corrigido | labels, descricoes auxiliares e textos operacionais deixam de expor formas sem acentuacao na UI final |
| Regressao funcional zero | `advance`, `finalize`, `requestAction`, `respondAction`, atribuicao/reatribuicao, arquivamento, historico e anexos continuam operando exatamente com os handlers e gates atuais |

### Constraints

- nenhum endpoint, payload, schema, regra de permissao ou runtime sera alterado;
- `WorkflowManagementPage` continua sendo a dona de fetch, mutations, toasts e close policy;
- `RequestDetailDialog` continua sendo a entrypoint publica do modal operacional;
- o payload oficial `WorkflowManagementRequestDetailData` permanece a unica fonte de verdade para decidir exibicao;
- a rodada pode reorganizar e simplificar componentes visuais, mas nao pode introduzir CTA novo nem alterar criterios de elegibilidade;
- a estrategia precisa contemplar o fallback legado quando `stepsHistory` nao vier no detalhe;
- a implementacao deve usar apenas frontend local ao namespace `src/components/workflows/management` e `src/lib/workflows/management`.

## 2. Architecture

### Source of Truth

Este design foi elaborado a partir de:

- `DEFINE_SIMPLIFICACAO_VISUAL_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`
- `src/components/workflows/management/RequestDetailDialog.tsx`
- `src/components/workflows/management/RequestOperationalHero.tsx`
- `src/components/workflows/management/RequestActionCard.tsx`
- `src/components/workflows/management/RequestAdministrativePanel.tsx`
- `src/components/workflows/management/RequestSummarySection.tsx`
- `src/components/workflows/management/RequestStepHistorySection.tsx`
- `src/components/workflows/management/RequestSubmittedDataSection.tsx`
- `src/components/workflows/management/RequestStepHistoryItem.tsx`
- `src/lib/workflows/management/request-detail-view-model.ts`
- `src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx`
- `src/components/workflows/management/__tests__/RequestActionCard.test.tsx`
- `src/components/workflows/management/__tests__/RequestStepHistorySection.test.tsx`
- `src/components/workflows/management/__tests__/RequestSubmittedDataSection.test.tsx`
- `src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx`
- `src/lib/workflows/management/__tests__/request-detail-view-model.test.ts`

Em caso de divergencia:

1. prevalece o DEFINE desta feature para escopo e aceite;
2. prevalece o payload oficial atual para gates e dados exibiveis;
3. prevalece este DESIGN para a organizacao da UI, responsabilidades por arquivo e estrategia de testes.

### Current Snapshot

O snapshot atual do codigo mostra quatro caracteristicas que este redesign precisa respeitar:

1. `RequestDetailDialog` hoje usa uma grade superior em duas colunas (`Resumo do chamado` + `Acao atual`) e uma grade inferior em duas colunas (`Historico por etapa` + `Dados enviados`).
2. `RequestOperationalHero` sempre renderiza um card proprio, mesmo quando a acao principal real esta no `RequestActionCard` ou no painel administrativo.
3. `RequestStepHistorySection` ja contem um fallback legado importante (`RequestProgress` + `RequestTimeline`) quando `stepsHistory` nao existe.
4. `RequestSubmittedDataSection` ja preserva a ordem canonica ao intercalar `formData.fields` e `attachments` por `order`.

### Target UI Shell

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Header do dialog                                                   │
│ - titulo do chamado                                                │
│ - descricao curta do workflow / etapa atual                        │
├─────────────────────────────────────────────────────────────────────┤
│ Resumo do chamado (full-width)                                     │
│ - grade mais larga e menos quebrada                                │
├─────────────────────────────────────────────────────────────────────┤
│ Acao atual                                                         │
│ - resumo operacional compacto (substitui hero alto)                │
│ - CTA de continuidade oficial, quando existir                      │
│ - Action da etapa, quando relevante                                │
│ - Administracao do chamado, quando relevante                       │
├───────────────────────────────┬─────────────────────────────────────┤
│ Historico do chamado          │ Dados enviados                     │
│ - secao recolhida por padrao  │ - secao recolhida por padrao       │
│ - fallback legado preservado  │ - ordem de campos/anexos preservada│
│ - expande o acordeao interno  │ - CTA "Ver anexo" preservado       │
└───────────────────────────────┴─────────────────────────────────────┘

Mobile / tablet estreito:
- Resumo do chamado
- Acao atual
- Historico do chamado
- Dados enviados
```

### System Diagram

```text
Authenticated operator
  |
  +--> /gestao-de-chamados
         |
         +--> WorkflowManagementPage
         |      |
         |      +--> useWorkflowManagement(...)
         |      |      |
         |      |      +--> detailQuery
         |      |      +--> assign / advance / finalize
         |      |      +--> archive / requestAction / respondAction
         |      |      \--> page-owned busy states + toast policy
         |      |
         |      \--> RequestDetailDialog
         |             |
         |             +--> collaborators prop (page-owned; sourced from CollaboratorsContext)
         |             +--> buildRequestDetailShellViewModel(detail, collaborators)
         |             |      |
         |             |      +--> header
         |             |      +--> summary meta items
         |             |      \--> currentAction priority + visibility flags + request target labels
         |             |
         |             +--> RequestSummarySection (full-width)
         |             +--> compact operational block (RequestOperationalHero)
         |             +--> RequestActionCard
         |             +--> RequestAdministrativePanel
         |             +--> RequestCollapsibleSection (novo wrapper local)
         |             |      +--> RequestStepHistorySection
         |             |      \--> RequestSubmittedDataSection
         |             \--> DialogFooter (Fechar)
         |
         +--> Unit tests
         |      \--> request-detail-view-model.test.ts
         |
         +--> Component tests
         |      +--> RequestDetailDialog.test.tsx
         |      +--> RequestActionCard.test.tsx
         |      +--> RequestAdministrativePanel.test.tsx
         |      +--> RequestStepHistorySection.test.tsx
         |      \--> RequestSubmittedDataSection.test.tsx
         |
         \--> Integration smoke
                \--> WorkflowManagementPage.test.tsx
```

### Data Flow

```text
LAYER 1 - Official detail payload (unchanged)
1. detailQuery continua entregando `summary`, `permissions`, `action`, `progress`,
   `timeline`, `stepsHistory`, `formData` e `attachments`.
2. Nenhuma regra de negocio nova e criada no frontend.

LAYER 2 - Shell derivation
3. buildRequestDetailShellViewModel(detail, collaborators) continua sendo o ponto unico para:
   - headline do dialog;
   - meta items do resumo;
   - prioridade operacional atual;
   - flags de exibicao do CTA de continuidade, action card e admin panel;
   - labels amigaveis dos destinatarios de `requestAction`.
4. A copy fica mais curta e em PT-BR correto, mas sem mover a decisao de estado
   para dentro dos componentes.
5. Os destinatarios da solicitacao sao derivados do campo oficial
   `detail.action.recipients[].recipientUserId`, resolvidos contra `collaborators`
   antes do render da superficie de `Solicitar`.

LAYER 3 - Dialog composition
6. RequestDetailDialog passa a renderizar:
   - resumo full-width primeiro;
   - macrozona `Acao atual` em bloco unico;
   - faixa inferior com duas secoes recolhiveis de mesmo nivel.
7. A macrozona usa um resumo operacional compacto no lugar do hero alto, mas
   preserva os CTAs oficiais de `advance` e `finalize`.

LAYER 4 - Nested surfaces
8. RequestActionCard preserva request/respond, validacoes e busy states, e
   mostra o destinatario resolvido da solicitacao sem vazar `id3a` cru.
9. RequestAdministrativePanel preserva atribuicao/reatribuicao e arquivamento.
10. RequestStepHistorySection preserva o acordeao por etapa e o fallback legado.
11. RequestSubmittedDataSection preserva ordenacao canonica e CTA de anexo.

LAYER 5 - Test confidence
12. Testes passam a validar ordem estrutural do shell, presenca condicional da
    macrozona e comportamento de colapso das secoes inferiores.
13. WorkflowManagementPage permanece apenas como smoke de wiring e close policy.
```

### State Management

| State | Storage | Lifecycle |
|-------|---------|-----------|
| `selectedRequestId` | `useState` em `WorkflowManagementPage` | abre/fecha o dialog; nao muda nesta feature |
| `detailQuery.data` | React Query | payload oficial; continua sendo a fonte de verdade do modal |
| `shellViewModel` | derivado em `RequestDetailDialog` | recalculado quando `detail` ou `collaborators` mudam; passa a expor flags mais alinhadas ao shell enxuto e labels amigaveis para destinatarios |
| `selectedResponsibleId` | `useState` em `RequestDetailDialog` | sincronizado com `detail.summary.responsibleUserId`; sem mudanca funcional |
| `assignMutation.isPending` | page-owned | continua bloqueando atribuicao/reatribuicao |
| `advanceMutation.isPending` | page-owned | continua bloqueando CTA de continuidade |
| `finalizeMutation.isPending` | page-owned | continua bloqueando CTA de finalizacao |
| `archiveMutation.isPending` | page-owned | continua bloqueando arquivamento |
| `requestActionMutation.isPending` | page-owned | continua bloqueando abertura de action |
| `respondActionMutation.isPending` | page-owned | continua bloqueando resposta de action |
| `isHistoryExpanded` | state local no novo wrapper colapsavel | inicia `false`; controla apenas a casca superior do historico |
| `isSubmittedDataExpanded` | state local no novo wrapper colapsavel | inicia `false`; controla apenas a casca superior de dados enviados |

### Planned View-Model Delta

O redesign nao precisa alterar o shape do payload, mas precisa explicitar melhor o contrato de apresentacao da macrozona. O delta planejado e:

- manter a decisao de prioridade em `request-detail-view-model.ts`;
- reduzir a dependencia de `statusNote` longo;
- expor um resumo operacional curto e flags diretas para composicao;
- derivar estados informativos read-only quando a pendencia real do fluxo pertencer a terceiros;
- resolver o destinatario de `requestAction` a partir de `id3a` para nome amigavel via `collaborators`;
- preservar a separacao entre:
  - CTA de continuidade oficial;
  - bloco de `Action da etapa`;
  - bloco de `Administracao do chamado`.

Contrato alvo sugerido:

| Field | Purpose |
|-------|---------|
| `header.title` / `header.description` | cabecalho do dialog |
| `summary.metaItems` | metadados exibidos no resumo full-width |
| `currentAction.priority` | `continuity` / `action` / `admin` / `read-only` |
| `currentAction.title` | headline operacional curta |
| `currentAction.contextLine` | unica frase de apoio curta; substitui descricao longa e nao reintroduz `statusNote` |
| `currentAction.informationalState` | contexto read-only derivado quando o proximo passo pertence a terceiros ou a outro responsavel atual |
| `currentAction.primaryAction` | CTA oficial `advance` ou `finalize`, quando existir |
| `currentAction.requestTargetRecipients` | lista de destinatarios amigaveis para a superficie de `Solicitar`, derivada de `detail.action.recipients[].recipientUserId` e resolvida via `collaborators` |
| `currentAction.shouldRenderOperationalSummary` | gate do resumo operacional compacto; aparece quando houver CTA de continuidade ou contexto informativo relevante |
| `currentAction.shouldRenderActionCard` | gate unico do `RequestActionCard` |
| `currentAction.shouldRenderAdminPanel` | gate unico do painel administrativo |
| `currentAction.shouldRenderSection` | evita renderizar uma macrozona vazia quando nenhum subbloco for aplicavel |
| `history.hasLegacyFallback` | preserva o caminho de compatibilidade temporaria |

## 3. Architecture Decisions

### ADR-001: A decisao operacional continua centralizada no view-model; o redesign atua no shell, nao nas regras

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-20 |
| **Context** | O codigo atual concentra prioridade e elegibilidade em `request-detail-view-model.ts`. O DEFINE pede simplificacao visual, nao redistribuicao de regras entre componentes. |

**Choice:** manter `request-detail-view-model.ts` como fonte unica para prioridade operacional, CTA principal e gates de exibicao, reduzindo apenas a copy e adaptando o shape derivado ao shell mais compacto. A mesma camada derivada tambem deve expor labels amigaveis para destinatarios de `requestAction`, usando os dados ja disponiveis de `collaborators`.

**Rationale:**
1. evita duplicar regras de permissao em `RequestDetailDialog`, `RequestOperationalHero`, `RequestActionCard` e `RequestAdministrativePanel`;
2. permite simplificar o layout sem reabrir a semantica de quem age agora;
3. reduz risco de regressao funcional durante a troca de hierarquia visual;
4. evita espalhar logica de resolucao de `id3a` entre o card de action e o shell do dialog.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| mover a logica de prioridade para dentro de `RequestDetailDialog` | mistura orquestracao visual com regra de estado e dificulta testes unitarios |
| distribuir parte da decisao entre hero, action card e admin panel | aumenta drift e cria mais de uma fonte de verdade |

**Consequences:**
- positivo: a feature continua essencialmente frontend/presentation;
- positivo: os testes unitarios do view-model seguem valiosos;
- positivo: os nomes de destinatarios de solicitacao podem ser testados como contrato de apresentacao;
- negativo: `request-detail-view-model.ts` continua sendo um arquivo sensivel a copy e prioridade.

---

### ADR-002: O hero atual sera absorvido por uma superficie operacional compacta dentro de `Acao atual`

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-20 |
| **Context** | `RequestOperationalHero` hoje sempre renderiza um card proprio com titulo, descricao e `statusNote`, o que aumenta altura e reforca a sensacao de "bloco dentro de bloco". O DEFINE pede reduzir ou absorver esse bloco sem perder o CTA principal. |

**Choice:** manter o arquivo `RequestOperationalHero.tsx`, mas transformando-o em um resumo operacional compacto e condicional, sem card heroico alto e sem `statusNote` longo. O CTA de continuidade oficial continua dentro dele quando existir, e a superficie tambem passa a suportar contexto read-only quando a pendencia real do fluxo estiver com terceiros ou com outro responsavel atual.

**Rationale:**
1. reaproveita a superficie ja existente responsavel pelo CTA primario de `advance/finalize`;
2. reduz churn de imports e riscos de wiring em `RequestDetailDialog`;
3. atende a meta visual sem rebatizar componentes ou reabrir contratos de props demais;
4. impede que o redesign preserve um "mini hero" sempre presente por inercia de implementacao;
5. evita esconder contexto importante quando o usuario atual nao pode agir.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| remover `RequestOperationalHero` completamente e mover tudo para `RequestDetailDialog` | aumenta JSX e espalha copy/CTA no componente orquestrador |
| manter o hero atual apenas com CSS menor | nao resolve a redundancia estrutural nem a copy excessiva |

**Consequences:**
- positivo: o CTA oficial continua claro e no mesmo ownership;
- positivo: a macrozona fica visualmente mais rasa;
- positivo: a renderizacao do resumo operacional passa a ser guiada por gate explicito no view-model;
- positivo: o modal continua explicando o estado atual mesmo quando a action ou a execucao pertence a terceiros;
- negativo: parte dos testes atuais acoplados a `statusNote` e ao texto "Estado atual e proximo passo" precisara ser atualizada.

---

### ADR-003: Historico e dados enviados ganham um wrapper local de disclosure, nao um novo uso de `Accordion`

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-20 |
| **Context** | O projeto ja possui `Accordion`, e `RequestStepHistorySection` ja usa esse primitive internamente para o historico por etapa. Reutilizar outro `Accordion` como casca superior criaria um acordeao aninhado sobre outro acordeao. |

**Choice:** criar um wrapper local `RequestCollapsibleSection.tsx` com `button`, `aria-expanded`, `aria-controls` e corpo colapsavel simples, para encapsular `Historico do chamado` e `Dados enviados`.

**Rationale:**
1. evita semantica e navegacao confusas de acordeao dentro de acordeao;
2. cria um shell reutilizavel para as duas secoes de nivel superior;
3. mantem `RequestStepHistorySection` livre para continuar usando o acordeao interno por etapa.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| usar `Accordion` do shadcn tambem na casca superior | gera nesting semantico desnecessario no historico |
| duplicar a logica de colapso separadamente em cada secao | aumenta repeticao e risco de divergencia visual |

**Consequences:**
- positivo: a feature ganha um primitive local claro e pequeno;
- positivo: historico e dados enviados compartilham UX de colapso consistente;
- negativo: entra um arquivo novo no namespace `management`.

---

### ADR-004: A confianca do redesign sera protegida por contrato de layout e matriz de presenca condicional

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-20 |
| **Context** | A suite atual cobre boa parte dos mecanismos operacionais, mas quase nao protege a nova hierarquia visual, os wrappers colapsaveis e a matriz de exibicao dinamica da macrozona `Acao atual`. |

**Choice:** expandir a estrategia de testes para incluir:
- ordem estrutural do shell;
- colapso/expansao das secoes inferiores;
- matriz explicita de presenca/ausencia entre continuidade oficial, action card e admin panel;
- suite dedicada de `RequestAdministrativePanel`.

**Rationale:**
1. o valor desta feature esta justamente na simplificacao visual e previsibilidade do shell;
2. sem novos testes, o build poderia preservar handlers e ainda falhar no objetivo do DEFINE;
3. suites menores por componente reduzem acoplamento desnecessario de `WorkflowManagementPage`.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| deixar a verificacao visual apenas para smoke manual | insuficiente para um redesign com muitos gates condicionais |
| colocar toda a cobertura no teste de pagina | tornaria os testes mais lentos, verbosos e menos localizados |

**Consequences:**
- positivo: o build fica protegido contra regressao visual e de wiring;
- positivo: a pagina pode continuar com smoke de integracao enxuto;
- negativo: a quantidade de arquivos de teste tocados aumenta.

## 4. File Manifest

### Execution Order

| Phase | Files | Agent |
|-------|-------|-------|
| 1. View-model contract | `request-detail-view-model.ts` e sua suite | `@react-frontend-developer` |
| 2. Shared shell primitive | novo wrapper colapsavel de secao | `@react-frontend-developer` |
| 3. Dialog shell | `RequestDetailDialog.tsx`, `RequestSummarySection.tsx`, `RequestOperationalHero.tsx` | `@react-frontend-developer` |
| 4. Conditional surfaces | `RequestActionCard.tsx`, `RequestAdministrativePanel.tsx`, `RequestStepHistorySection.tsx`, `RequestSubmittedDataSection.tsx`, `RequestStepHistoryItem.tsx` | `@react-frontend-developer` |
| 5. Test confidence | suites unitarias, component e smoke de pagina | `@react-frontend-developer` |

### Detailed Manifest

| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | `src/lib/workflows/management/request-detail-view-model.ts` | Modify | encurtar copy, corrigir PT-BR visivel, substituir a dependencia de `statusNote` por um contrato mais enxuto, expor `currentAction.priority` + flags diretas do shell, derivar estados informativos read-only a partir do payload ja existente e resolver destinatarios de `requestAction` via `collaborators` | `@react-frontend-developer` | - |
| 2 | `src/lib/workflows/management/__tests__/request-detail-view-model.test.ts` | Modify | proteger prioridade operacional, CTA principal e flags de exibicao sem acoplamento excessivo a frases longas | `@react-frontend-developer` | #1 |
| 3 | `src/components/workflows/management/RequestCollapsibleSection.tsx` | Create | encapsular trigger, descricao, badge opcional e corpo recolhivel para `Historico do chamado` e `Dados enviados` | `@react-frontend-developer` | #1 |
| 4 | `src/components/workflows/management/RequestDetailDialog.tsx` | Modify | reorganizar o body em resumo full-width, macrozona `Acao atual` enxuta e faixa inferior compartilhada com os wrappers colapsaveis explicitamente aplicados no shell | `@react-frontend-developer` | #1, #3 |
| 5 | `src/components/workflows/management/RequestSummarySection.tsx` | Modify | ampliar o resumo para faixa inteira, reduzir quebras de linha desnecessarias e ajustar densidade visual sem mudar meta items | `@react-frontend-developer` | #1, #4 |
| 6 | `src/components/workflows/management/RequestOperationalHero.tsx` | Modify | converter o hero em resumo operacional compacto, mantendo CTA de `advance/finalize` quando aplicavel e renderizando contexto read-only quando a pendencia pertencer a terceiros | `@react-frontend-developer` | #1, #4 |
| 7 | `src/components/workflows/management/RequestActionCard.tsx` | Modify | limpar badges ruidosos, traduzir labels como `Execucao`, manter validacoes, handlers e exibicao condicional, e exibir o destinatario amigavel da solicitacao sem mostrar `id3a` cru | `@react-frontend-developer` | #1, #4 |
| 8 | `src/components/workflows/management/RequestAdministrativePanel.tsx` | Modify | alinhar copy e densidade ao novo shell, preservando atribuicao/reatribuicao, arquivamento e gates atuais | `@react-frontend-developer` | #1, #4 |
| 9 | `src/components/workflows/management/RequestStepHistorySection.tsx` | Modify | adaptar o corpo do historico para ser consumido dentro do wrapper colapsavel definido pelo dialog, preservando fallback legado + acordeao por etapa | `@react-frontend-developer` | #3, #4 |
| 10 | `src/components/workflows/management/RequestSubmittedDataSection.tsx` | Modify | adaptar o corpo de dados enviados para ser consumido dentro do wrapper colapsavel definido pelo dialog e manter ordem canonica de campos/anexos | `@react-frontend-developer` | #3, #4 |
| 11 | `src/components/workflows/management/RequestStepHistoryItem.tsx` | Minor modify | ajustar labels internas para PT-BR consistente e manter comentarios/anexos de responses | `@react-frontend-developer` | #9 |
| 12 | `src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx` | Modify | validar nova ordem estrutural, matriz de presenca da macrozona e ausencia de CTA operacional no footer | `@react-frontend-developer` | #4, #5, #6, #7, #8, #9, #10 |
| 13 | `src/components/workflows/management/__tests__/RequestActionCard.test.tsx` | Modify | cobrir limpeza de badges, labels em PT-BR, ocultacao quando nao aplicavel e preservacao de required/disabled states | `@react-frontend-developer` | #7 |
| 14 | `src/components/workflows/management/__tests__/RequestAdministrativePanel.test.tsx` | Create | cobrir atribuicao/reatribuicao, arquivamento, ocultacao total e busy states do painel administrativo | `@react-frontend-developer` | #8 |
| 15 | `src/components/workflows/management/__tests__/RequestStepHistorySection.test.tsx` | Modify | cobrir secao colapsavel, expansao do historico, fallback legado e preservacao do acordeao por etapa | `@react-frontend-developer` | #9, #11 |
| 16 | `src/components/workflows/management/__tests__/RequestSubmittedDataSection.test.tsx` | Modify | cobrir secao colapsavel, ordem preservada e CTA `Ver anexo` apos expansao | `@react-frontend-developer` | #10 |
| 17 | `src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx` | Preserve / smoke focused | manter prova de wiring, mutacoes e close policy sem absorver asserts finos de layout | `@react-frontend-developer` | #4, #12 |

Arquivos explicitamente fora do delta:

- `src/lib/workflows/management/types.ts`
- `src/lib/workflows/management/api-client.ts`
- hooks, endpoints e mutations de management
- qualquer arquivo de backend, firestore, storage ou functions

## 5. Code Patterns

### Pattern 1: View-model curto para a macrozona `Acao atual`

```typescript
// src/lib/workflows/management/request-detail-view-model.ts

export type RequestCurrentActionPriority =
  | 'continuity'
  | 'action'
  | 'admin'
  | 'read-only';

export type RequestCurrentActionViewModel = {
  priority: RequestCurrentActionPriority;
  title: string;
  contextLine: string | null;
  informationalState: RequestCurrentActionInformationalState | null;
  primaryAction: RequestOperationalPrimaryAction | null;
  requestTargetRecipients: string[];
  shouldRenderOperationalSummary: boolean;
  shouldRenderActionCard: boolean;
  shouldRenderAdminPanel: boolean;
  shouldRenderSection: boolean;
};

export type RequestCurrentActionInformationalState = {
  kind:
    | 'pending-action-with-others'
    | 'awaiting-third-party-response'
    | 'in-progress-with-assignee'
    | 'continuity-blocked';
  label: string;
  owners: string[];
  note: string | null;
};

function buildCurrentActionViewModel(
  detail: WorkflowManagementRequestDetailData,
  collaborators: Collaborator[],
): RequestCurrentActionViewModel {
  const operational = buildRequestOperationalViewModel(detail);
  const priority = resolveCurrentActionPriority(detail, operational);
  const shouldRenderActionCard = operational.shouldRenderActionZone;
  const shouldRenderAdminPanel =
    detail.permissions.canAssign || detail.permissions.canArchive;
  const informationalState = buildCurrentActionInformationalState(detail, operational);
  const requestTargetRecipients = buildRequestTargetRecipients(detail, operational, collaborators);
  const shouldRenderOperationalSummary =
    operational.primaryAction !== null ||
    informationalState !== null ||
    priority === 'read-only';

  return {
    priority,
    title: operational.title,
    contextLine: buildCurrentActionContextLine(priority, operational),
    informationalState,
    primaryAction: operational.primaryAction,
    requestTargetRecipients,
    shouldRenderOperationalSummary,
    shouldRenderActionCard,
    shouldRenderAdminPanel,
    shouldRenderSection:
      shouldRenderOperationalSummary ||
      shouldRenderActionCard ||
      shouldRenderAdminPanel,
  };
}
```

Uso esperado:

- o builder continua tomando a decisao de estado;
- `RequestDetailDialog` consome apenas `priority`, `title`, `contextLine` e flags;
- `contextLine` e uma frase unica e curta, nunca um substituto para `statusNote` longo;
- `informationalState` cobre os casos em que existe uma pendencia real, mas o ator autenticado nao pode executa-la;
- `requestTargetRecipients` resolve os `id3a` vindos de `detail.action.recipients[].recipientUserId` para nomes amigaveis antes do render do card;
- `RequestOperationalHero` deixa de ser permanente e passa a obedecer `shouldRenderOperationalSummary`;
- a macrozona inteira pode ser omitida quando `shouldRenderSection` for `false`.

### Pattern 2: Wrapper local para secoes colapsaveis de nivel superior

```tsx
// src/components/workflows/management/RequestCollapsibleSection.tsx
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type RequestCollapsibleSectionProps = {
  id: string;
  title: string;
  description: string;
  defaultExpanded?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
};

export function RequestCollapsibleSection({
  id,
  title,
  description,
  defaultExpanded = false,
  badge,
  children,
}: RequestCollapsibleSectionProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const contentId = `${id}-content`;

  return (
    <section className="rounded-xl border bg-background" aria-labelledby={id}>
      <div className="border-b px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id={id} className="text-sm font-semibold text-foreground">
                {title}
              </h2>
              {badge}
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-expanded={expanded}
            aria-controls={contentId}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? 'Recolher' : 'Expandir'}
          </Button>
        </div>
      </div>

      <div
        id={contentId}
        hidden={!expanded}
        className={cn('px-4 py-4', !expanded && 'hidden')}
      >
        {children}
      </div>
    </section>
  );
}
```

Uso esperado:

- `defaultExpanded={false}` tanto para historico quanto para dados enviados;
- o historico mantem seu acordeao interno por etapa dentro do corpo expandido;
- o wrapper pode receber badge de fallback legado quando necessario.

### Pattern 3: Novo esqueleto de `RequestDetailDialog`

```tsx
// src/components/workflows/management/RequestDetailDialog.tsx

<ManagementAsyncState ...>
  {detail && shellViewModel ? (
    <>
      {hasNonBlockingError ? <ManagementErrorState ... /> : null}

      <div className="space-y-6">
        <RequestSummarySection summary={shellViewModel.summary} />

        {shellViewModel.currentAction.shouldRenderSection ? (
          <section className="space-y-4" aria-labelledby="request-current-action-title">
            <div className="space-y-1">
              <h2 id="request-current-action-title" className="text-sm font-semibold text-foreground">
                Acao atual
              </h2>
            </div>

            <div className="space-y-4 rounded-xl border bg-muted/10 p-4">
              {shellViewModel.currentAction.contextLine ? (
                <p className="text-sm text-muted-foreground">
                  {shellViewModel.currentAction.contextLine}
                </p>
              ) : null}

              {shellViewModel.currentAction.shouldRenderOperationalSummary ? (
                <RequestOperationalHero
                  ...
                  informationalState={shellViewModel.currentAction.informationalState}
                />
              ) : null}

              {shellViewModel.currentAction.shouldRenderActionCard ? (
                <RequestActionCard
                  ...
                  requestTargetRecipients={shellViewModel.currentAction.requestTargetRecipients}
                />
              ) : null}

              {shellViewModel.currentAction.shouldRenderAdminPanel ? (
                <RequestAdministrativePanel ... />
              ) : null}
            </div>
          </section>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
          <RequestCollapsibleSection
            id="request-history"
            title="Historico do chamado"
            description="Eventos, comentarios e anexos oficiais por etapa."
            defaultExpanded={false}
            badge={shellViewModel.history.hasLegacyFallback ? <LegacyBadge /> : null}
          >
            <RequestStepHistorySection ... />
          </RequestCollapsibleSection>

          <RequestCollapsibleSection
            id="request-submitted-data"
            title="Dados enviados"
            description="Campos e anexos da abertura original do chamado."
            defaultExpanded={false}
          >
            <RequestSubmittedDataSection ... />
          </RequestCollapsibleSection>
        </div>
      </div>
    </>
  ) : null}
</ManagementAsyncState>
```

Regras desse pattern:

- o resumo sai da grade superior e passa para faixa inteira;
- a macrozona `Acao atual` deixa de depender de duas colunas com o resumo;
- a copy introdutoria longa da macrozona sai do shell e vira, no maximo, `contextLine` curta derivada do view-model;
- o resumo operacional compacto nao e mais obrigatorio: ele so aparece quando houver continuidade oficial ou contexto read-only relevante;
- `Action da etapa` e `Administracao do chamado` continuam independentes e podem aparecer sem o resumo operacional;
- quando houver pendencia pertencente a terceiros, o shell nao esconde o contexto: ele mostra um estado informativo read-only com o(s) usuario(s) ou responsavel atual sempre que o payload existente permitir;
- quando o card estiver em modo `Solicitar`, ele deve informar explicitamente para quem a solicitacao sera enviada usando nome amigavel de `collaborators`, nunca `id3a` cru;
- os wrappers colapsaveis de `Historico do chamado` e `Dados enviados` sao aplicados diretamente no dialog, nao delegados implicitamente aos componentes internos;
- a faixa inferior vira o unico grid compartilhado do body.

### Pattern 4: Teste de contrato de layout e presenca condicional

```tsx
// src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx

it('renders summary first and the lower sections as top-level siblings', () => {
  render(<RequestDetailDialog ... detail={buildManagementRequestDetailFixture()} />);

  const summaryHeading = screen.getByRole('heading', { name: 'Resumo do chamado' });
  const currentActionHeading = screen.getByRole('heading', { name: 'Acao atual' });
  const historyToggle = screen.getByRole('button', { name: /Historico do chamado/i });
  const submittedToggle = screen.getByRole('button', { name: /Dados enviados/i });

  expect(summaryHeading.compareDocumentPosition(currentActionHeading)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  expect(historyToggle).toHaveAttribute('aria-expanded', 'false');
  expect(submittedToggle).toHaveAttribute('aria-expanded', 'false');
});

it.each([
  ['continuity only', { permissions: { canAdvance: true }, action: { available: false } }],
  ['action only', { permissions: { canRequestAction: true }, action: { available: true, canRequest: true } }],
  ['admin only', { permissions: { canAssign: true }, action: { available: false } }],
  ['pending action with other users', { action: { available: true, canRespond: false, pendingWith: ['Joao', 'Maria'] } }],
  ['request action with resolved recipient', { action: { available: true, canRequest: true, recipientIds: ['SMO2'] }, collaborators: [{ id3a: 'SMO2', name: 'Sergio Moura' }] }],
  ['in progress with another assignee', { assignment: { currentResponsible: 'Fulano' }, actor: { email: 'viewer@example.com' } }],
])('renders the expected current action composition for %s', (_label, overrides) => {
  render(<RequestDetailDialog ... detail={buildManagementRequestDetailFixture(overrides)} />);
  // assert presence/absence of operational summary, action card and admin panel
  // assert informational read-only state when the pending owner is someone else
  // assert request recipient label is rendered with collaborator name, never raw id3a
});
```

## 6. API Contract

Nenhum endpoint novo ou alterado.

## 7. Database Schema (mudancas)

Nenhuma mudanca no schema.

## 8. Testing Strategy

### Unit Tests

| Component | Test |
|-----------|------|
| `request-detail-view-model.ts` | prioridade `continuity/action/admin/read-only` continua correta por permissao e estado |
| `request-detail-view-model.ts` | CTA principal continua sendo apenas `Avancar etapa` ou `Finalizar chamado` quando aplicavel |
| `request-detail-view-model.ts` | `contextLine` curta continua coerente para `respond-action`, `ready-to-advance`, `ready-to-finalize`, `request-action`, `finalized` e `archived` |
| `request-detail-view-model.ts` | `informationalState` deriva corretamente cenarios de `action pending / actor not eligible`, `awaiting third-party response`, `continuity blocked` e `in progress with assignee` sem mudar gates funcionais |
| `request-detail-view-model.ts` | `requestTargetRecipients` resolve `detail.action.recipients[].recipientUserId` para nomes amigaveis usando `collaborators`, sem deixar ids tecnicos vazarem para a UI |

### Component Tests

| Component | Test |
|-----------|------|
| `RequestDetailDialog.tsx` | ordem estrutural: resumo full-width antes da macrozona e historico/dados enviados como wrappers colapsaveis irmaos de mesmo nivel |
| `RequestDetailDialog.tsx` | matriz de presenca: continuidade sozinha, action sozinha, admin sozinho, continuidade + action, continuidade + admin, read-only, `action pending / actor not eligible`, `in progress / actor not assignee` |
| `RequestDetailDialog.tsx` | resumo operacional compacto nao aparece nos cenarios `action only` e `admin only` |
| `RequestDetailDialog.tsx` | quando a pendencia pertence a terceiros, o shell exibe contexto read-only com o(s) usuario(s) ou responsavel atual, sem CTA indevido |
| `RequestDetailDialog.tsx` | footer continua contendo apenas `Fechar` |
| `RequestActionCard.tsx` | remocao de badges ruidosos e labels PT-BR sem quebrar request/respond |
| `RequestActionCard.tsx` | required continua indicado apenas por `*`, placeholder e disabled state |
| `RequestActionCard.tsx` | secao nao renderiza quando `action.available` e `configurationError` nao justificam exibicao |
| `RequestActionCard.tsx` | modo `Solicitar` informa claramente o destinatario da solicitacao com nome amigavel e nao exibe `id3a` cru |
| `RequestAdministrativePanel.tsx` | atribuicao/reatribuicao, arquivamento, ocultacao total e busy states |
| `RequestStepHistorySection.tsx` | secao inicia recolhida, expande sob comando e preserva conteudo por etapa |
| `RequestStepHistorySection.tsx` | fallback legado continua acessivel e explicito |
| `RequestSubmittedDataSection.tsx` | secao inicia recolhida, expande e preserva ordem de campos/anexos + CTA `Ver anexo` |

### Integration Tests

| Flow | Test |
|------|------|
| `WorkflowManagementPage` + dialog | abrir o dialog e manter wiring atual das mutacoes operacionais |
| `advance/requestAction/respondAction` | dialog permanece aberto apos sucesso |
| `finalize/archive` | dialog fecha apenas nos casos ja previstos |
| toasts/erro | manter a cobertura atual sem mover asserts finos de layout para a pagina |

### Acceptance Tests

```gherkin
GIVEN um chamado em andamento com permissao para avancar
WHEN o modal operacional e aberto
THEN o resumo ocupa a primeira faixa inteira
AND a macrozona "Acao atual" destaca "Avancar etapa"
AND o footer exibe apenas "Fechar"
```

```gherkin
GIVEN um chamado com action respondivel pelo ator autenticado
WHEN o modal operacional e aberto
THEN a macrozona "Acao atual" exibe a superficie da action
AND o CTA principal de continuidade nao aparece
AND o resumo operacional compacto nao ocupa um bloco proprio
AND comentario/anexo continuam obedecendo obrigatoriedade oficial
```

```gherkin
GIVEN um chamado com CTA de "Solicitar" disponivel
WHEN o modal operacional e aberto
THEN a superficie de `Action da etapa` informa para quem a solicitacao sera enviada
AND o destinatario e exibido com nome amigavel resolvido de `collaborators`
AND nenhum `id3a` cru aparece na interface
```

```gherkin
GIVEN um chamado com action pendente pertencente a outros usuarios
WHEN o modal operacional e aberto por um ator nao elegivel para responder
THEN a macrozona "Acao atual" exibe um estado informativo read-only
AND o modal informa com quem a acao esta pendente
AND nenhum CTA de resposta e exibido para o ator atual
```

```gherkin
GIVEN um chamado em andamento com responsavel atual diferente do ator autenticado
WHEN o modal operacional e aberto
THEN a macrozona "Acao atual" informa com quem o chamado esta em andamento
AND a tela nao sugere que o ator atual seja o executor do proximo passo
```

```gherkin
GIVEN um chamado finalizado com permissao de arquivamento
WHEN o modal operacional e aberto
THEN a macrozona exibe apenas contexto read-only
AND "Administracao do chamado" continua disponivel
AND nenhum CTA operacional de avancar ou finalizar e reintroduzido
```

```gherkin
GIVEN um chamado com `stepsHistory` ausente
WHEN o usuario expande "Historico do chamado"
THEN o fallback legado continua visivel
AND progresso e timeline permanecem acessiveis dentro da secao
```

```gherkin
GIVEN um chamado com campos e anexos de abertura
WHEN o usuario expande "Dados enviados"
THEN os itens aparecem na ordem canonica original
AND o CTA "Ver anexo" continua abrindo a URL oficial
```

## 9. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | Reverter `RequestDetailDialog.tsx`, `RequestSummarySection.tsx` e `RequestOperationalHero.tsx` para restaurar o shell anterior | o dialog volta a exibir resumo lateral + hero alto |
| 2 | Reverter `RequestCollapsibleSection.tsx`, `RequestStepHistorySection.tsx` e `RequestSubmittedDataSection.tsx` | historico e dados enviados deixam de ser colapsaveis e retornam ao comportamento anterior |
| 3 | Reverter `RequestActionCard.tsx`, `RequestAdministrativePanel.tsx` e `RequestStepHistoryItem.tsx` se a limpeza de copy gerar regressao visual inesperada | labels e badges retornam ao baseline anterior |
| 4 | Reverter as suites de teste para o baseline previo apenas se o rollback de producao for confirmado | a pipeline volta a refletir o shell anterior |

**Metodo rapido:** `git revert <commit-do-build>`

Rollback funcional esperado:

- como nao ha mudanca de backend nem de schema, o rollback e exclusivamente de frontend;
- nenhum dado precisa ser migrado;
- nenhum cache novo precisa ser invalidado alem do ciclo normal do deploy.

## 10. Implementation Checklist

### Pre-Build

- [ ] DEFINE document aprovado
- [ ] prioridades da macrozona `Acao atual` confirmadas contra o codigo real
- [ ] manifesto de arquivos revisado
- [ ] wrapper colapsavel escolhido para evitar acordeao aninhado no historico
- [ ] gate explicito do resumo operacional compacto fechado no view-model
- [ ] derivacao de estados informativos read-only limitada ao payload ja existente e sem abrir dependencia de backend novo
- [ ] estrategia de resolucao de `id3a` para nome amigavel reaproveita `collaborators` ja disponiveis no app
- [ ] origem oficial dos destinatarios de solicitacao confirmada em `detail.action.recipients[].recipientUserId`
- [ ] estrategia de testes alinhada ao objetivo visual da feature

### Post-Build

- [ ] `Resumo do chamado` renderiza full-width
- [ ] `Acao atual` nao depende mais de hero alto com `statusNote` longo
- [ ] `Acao atual` nao renderiza resumo operacional compacto nos cenarios `action only` e `admin only`
- [ ] `Acao atual` informa pendencias pertencentes a terceiros quando o ator atual nao puder agir
- [ ] `Acao atual` informa com quem o chamado esta em andamento quando houver responsavel atual diferente do ator autenticado
- [ ] `Action da etapa` informa o destinatario da solicitacao com nome amigavel antes do submit
- [ ] nenhum `id3a` cru vaza para a interface do modal operacional
- [ ] `Historico do chamado` e `Dados enviados` iniciam recolhidos
- [ ] fallback legado do historico continua funcionando
- [ ] order de `submittedItems` continua preservada
- [ ] PT-BR visivel do modal foi corrigido nas superficies alteradas
- [ ] suites dirigidas passaram
- [ ] smoke manual em desktop largo e mobile nao revelou scroll/empilhamento problematico

## 11. Specialist Instructions

### For @react-frontend-developer

```markdown
Files to modify:
- src/lib/workflows/management/request-detail-view-model.ts
- src/components/workflows/management/RequestDetailDialog.tsx
- src/components/workflows/management/RequestSummarySection.tsx
- src/components/workflows/management/RequestOperationalHero.tsx
- src/components/workflows/management/RequestActionCard.tsx
- src/components/workflows/management/RequestAdministrativePanel.tsx
- src/components/workflows/management/RequestStepHistorySection.tsx
- src/components/workflows/management/RequestSubmittedDataSection.tsx
- src/components/workflows/management/RequestStepHistoryItem.tsx
- src/components/workflows/management/RequestCollapsibleSection.tsx
- src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx
- src/components/workflows/management/__tests__/RequestActionCard.test.tsx
- src/components/workflows/management/__tests__/RequestAdministrativePanel.test.tsx
- src/components/workflows/management/__tests__/RequestStepHistorySection.test.tsx
- src/components/workflows/management/__tests__/RequestSubmittedDataSection.test.tsx
- src/lib/workflows/management/__tests__/request-detail-view-model.test.ts

Key requirements:
- nao alterar handlers, props de mutation nem close policy page-owned;
- nao alterar o shape de `WorkflowManagementRequestDetailData`;
- manter a decisao de elegibilidade centralizada no view-model;
- evitar acordeao aninhado para as secoes superiores;
- preservar fallback legado, ordem canonica e CTA `Ver anexo`;
- derivar estados informativos apenas com os dados ja disponiveis no detalhe atual, com fallback elegante quando nomes completos nao estiverem disponiveis;
- resolver destinatarios de `requestAction` com base em `collaborators` ja carregados no app e nunca renderizar `id3a` cru;
- atualizar testes para focar em contrato funcional + estrutura, nao em frases longas descartaveis.
```

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-20 | Codex (`design` skill) | Initial design for visual simplification of the operational modal in `/gestao-de-chamados`, including compact current-action shell, top-level collapsible sections, file manifest, code patterns, testing strategy and rollback plan |
| 1.1 | 2026-04-20 | Codex (`iterate` skill) | Tightened the design to make `Acao atual` truly dynamic, replaced generic long description with constrained `contextLine`, made the compact operational summary explicitly conditional, and wired `Historico do chamado` / `Dados enviados` through top-level `RequestCollapsibleSection` wrappers in the dialog pattern |
| 1.2 | 2026-04-20 | Codex (`iterate` skill) | Added explicit read-only informational states for pending actions owned by third parties and for requests already in progress with another responsible user, updating the view-model contract, shell patterns, acceptance tests and checklist accordingly |
| 1.3 | 2026-04-20 | Codex (`iterate` skill) | Added explicit request-recipient visibility for `Solicitar`, requiring `id3a` resolution through `collaborators` into friendly names in the action surface, with corresponding contract, test and checklist updates |
| 1.4 | 2026-04-20 | Codex (`iterate` skill) | Clarified that `RequestDetailDialog` injects `collaborators` into `buildRequestDetailShellViewModel`, and pinned the official request-recipient source to `detail.action.recipients[].recipientUserId` to remove build-time ambiguity |
