# DESIGN: Correcoes complementares do Build 3 - modal operacional de gestao de chamados

> Generated: 2026-04-17
> Status: Ready for /build
> Source: `DEFINE_CORRECOES_COMPLEMENTARES_BUILD3_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`
> Base design: `DESIGN_BUILD3_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`
> Build report baseline: `BUILD_REPORT_BUILD3_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md`

## 1. Requirements Summary

### Problem

O Build 3 ja estabilizou o shell do modal operacional de `/gestao-de-chamados`, mas o repositorio ainda carrega tres gaps objetivos:

1. `buildRequestOperationalViewModel(...)` ainda reconhece `summary.statusCategory === 'finalized'` como estado terminal apenas quando `permissions.canArchive` tambem e verdadeiro, o que faz requests finalizados sem permissao de arquivar cairem na copy generica de "Sem acao operacional imediata".
2. o painel administrativo ja renderiza `Salvando...` e `Arquivando...` com `disabled/aria-disabled`, mas a suite do dialog ainda nao prova explicitamente esses busy states.
3. `WorkflowManagementPage.tsx` ja possui toasts destrutivos e policy de fechamento correta por tipo de mutation, porem a suite de integracao ainda nao cobre os cenarios de erro que garantem permanencia do dialog aberto e ausencia de fechamento indevido.

Esta microcorrecao existe para fechar o Build 3 com um delta pequeno, centrado em view model e cobertura automatizada, sem reabrir arquitetura, layout ou contrato de runtime.

### Success Criteria

| Criterion | Target |
|-----------|--------|
| Estado terminal comunicado corretamente | qualquer request `finalized` mostra copy de conclusao mesmo com `canArchive = false` |
| `canArchive` continua opcional | a permissao controla apenas a presenca do CTA administrativo de arquivamento |
| Busy states administrativos blindados | `Salvando...` e `Arquivando...` aparecem com `disabled/aria-disabled` corretos |
| Erro de mutation preserva UX | toasts destrutivos aparecem em falha e o dialog nao fecha em `assign`, `advance`, `requestAction`, `respondAction`, `finalize` ou `archive` com erro |
| Fechamento complementar do Build 3 | o patch fica restrito a view model, suites de teste e documentacao de build report |

### Constraints

- nenhum endpoint, payload, schema, permissao ou regra de runtime sera alterado;
- nenhuma refatoracao estrutural do modal sera reaberta;
- `WorkflowManagementPage` continua dona dos mutation handlers, toasts e close policy;
- `RequestDetailDialog` continua apenas derivando UI a partir de `detail`, props de mutation e `buildRequestOperationalViewModel(...)`;
- esta rodada nao cobre smoke responsivo manual nem typecheck global do repositorio.

---

## 2. Fonte de Verdade e Estado Atual

Este design deriva de:

- [DEFINE_CORRECOES_COMPLEMENTARES_BUILD3_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DEFINE_CORRECOES_COMPLEMENTARES_BUILD3_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md)
- [DESIGN_BUILD3_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/DESIGN_BUILD3_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md)
- [BUILD_REPORT_BUILD3_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/reports/BUILD_REPORT_BUILD3_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md)
- [request-detail-view-model.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/request-detail-view-model.ts)
- [request-detail-view-model.test.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/__tests__/request-detail-view-model.test.ts)
- [RequestAdministrativePanel.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestAdministrativePanel.tsx)
- [RequestDetailDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/RequestDetailDialog.tsx)
- [RequestDetailDialog.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx)
- [WorkflowManagementPage.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/WorkflowManagementPage.tsx)
- [WorkflowManagementPage.test.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx)
- [request-detail-test-data.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/management/__tests__/request-detail-test-data.ts)

Estado real do repositorio em 2026-04-17:

- `request-detail-view-model.ts` ja cobre `respond-action`, `ready-to-advance`, `ready-to-finalize`, `request-action`, `finalized + canArchive` e `archived`, mas ainda acopla o reconhecimento de `finalized` a `permissions.canArchive`;
- `RequestAdministrativePanel.tsx` ja implementa os busy labels oficiais e usa `disabled/aria-disabled` tanto para atribuicao quanto para arquivamento;
- `WorkflowManagementPage.tsx` ja encapsula todos os `try/catch`, emite toast destrutivo em falha e fecha o dialog apenas em sucesso de `finalize` e `archive`;
- `WorkflowManagementPage.test.tsx` hoje prova o comportamento de sucesso para `advance`, `finalize`, `archive`, `requestAction` e `respondAction`, mas ainda nao prova o branch de erro;
- `RequestDetailDialog.test.tsx` cobre o branch `finalized + canArchive`, porem ainda nao cobre `finalized + !canArchive`, `isAssigning` e `isArchiving`.

Implicacao pratica:

- existe apenas um ajuste funcional de producao previsto: separar "estado terminal finalizado" de "acao administrativa de arquivar" no view model;
- os demais itens sao lacunas de confianca automatizada sobre comportamento que o codigo ja implementa;
- esta microetapa deve permanecer pequena e deliberadamente anti-redesign.

---

## 3. Architecture

### System Diagram

```text
Operator in /gestao-de-chamados
  |
  +--> WorkflowManagementPage
  |      |
  |      +--> useWorkflowManagement(...)
  |      |      |
  |      |      +--> assignMutation / advanceMutation / finalizeMutation
  |      |      +--> archiveMutation / requestActionMutation / respondActionMutation
  |      |      \--> detailQuery
  |      |
  |      +--> toast success/error ownership
  |      +--> close policy ownership
  |      \--> RequestDetailDialog
  |             |
  |             +--> buildRequestOperationalViewModel(detail)
  |             +--> RequestOperationalHero
  |             +--> RequestActionCard
  |             \--> RequestAdministrativePanel
  |
  +--> Unit confidence
  |      \--> request-detail-view-model.test.ts
  |
  +--> Component confidence
  |      \--> RequestDetailDialog.test.tsx
  |
  \--> Integration confidence
         \--> WorkflowManagementPage.test.tsx
```

### Data Flow

```text
LAYER 1 - Official detail payload
1. detailQuery continua sendo a unica fonte de verdade para summary, permissions e action.
2. Nenhuma mutation nova ou campo novo e introduzido nesta rodada.

LAYER 2 - View model derivado
3. buildRequestOperationalViewModel(detail) decide copy, tone e CTA primario.
4. A microcorrecao move o branch de "finalized" para antes do gate de canArchive.
5. canArchive continua apenas como gate visual do painel administrativo.

LAYER 3 - Busy-state propagation
6. WorkflowManagementPage continua fornecendo isAssigning, isArchiving e demais flags.
7. RequestDetailDialog apenas propaga essas flags para hero, action card e painel administrativo.
8. Nenhum componente cria estado local paralelo para submit oficial.

LAYER 4 - Error/close policy
9. Cada handler da pagina continua exibindo toast destrutivo em catch.
10. Somente finalize/archive em sucesso limpam selectedRequestId.
11. Em erro, o dialog deve permanecer aberto para retry ou leitura do contexto, inclusive em `assign`.

LAYER 5 - Documentation follow-up
12. O build report do Build 3 deve registrar que a rodada complementar fechou os gaps automatizados restantes.
```

### State Management

| State | Storage | Lifecycle |
|-------|---------|-----------|
| `summary.statusCategory` | payload oficial de detalhe | define se o request esta em progresso, finalizado ou arquivado |
| `permissions.canArchive` | payload oficial de detalhe | controla apenas a presenca do CTA administrativo de arquivar |
| `requestOperationalViewModel` | derivado em `RequestDetailDialog` | recalculado a cada mudanca de `detail` |
| `assignMutation.isPending` | `useWorkflowManagement` | controla `Salvando...` e bloqueio do CTA de atribuicao |
| `archiveMutation.isPending` | `useWorkflowManagement` | controla `Arquivando...` e bloqueio do CTA de arquivamento |
| `selectedRequestId` | `WorkflowManagementPage` | mantido em sucesso de `assign`, `advance`, `requestAction`, `respondAction`; limpo apenas em sucesso de `finalize`, `archive` ou fechamento manual |
| `toast` de erro | `useToast()` | emitido em cada catch de mutation, sem alterar ownership do dialog |

---

## 4. Architecture Decisions

### ADR-B3-COMP-001: `finalized` e um estado terminal independente de `canArchive`

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-17 |
| Context | O usuario pode abrir um request com `summary.statusCategory === 'finalized'` sem permissao de arquivar. O fluxo ja terminou, mas a copy atual cai em "Sem acao operacional imediata" por depender de `permissions.canArchive`. |

**Choice:** o view model passa a reconhecer qualquer `statusCategory === 'finalized'` como branch terminal de conclusao. `canArchive` permanece restrito ao painel administrativo.

**Rationale:**
1. o estado de negocio "finalizado" nao depende de uma permissao administrativa posterior;
2. a copy terminal precisa ser consistente entre owner, responsavel e usuarios read-only;
3. a correcao evita regressao sem tocar em endpoint, payload ou permissao.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| manter `finalized` condicionado a `canArchive` | perpetua uma copy incorreta para requests efetivamente concluidos |
| introduzir um novo `tone` so para `finalized` sem `canArchive` | aumenta branching sem necessidade, pois o estado continua sendo terminal/read-only |

**Consequences:**

- positivo: a comunicacao de conclusao fica correta para qualquer request finalizado;
- positivo: o CTA de arquivamento continua obedecendo ao payload oficial;
- negativo: algumas assertions textuais dos testes precisam ser atualizadas para refletir a nova prioridade de copy.

### ADR-B3-COMP-002: busy states administrativos serao blindados por teste de dialog, nao por nova infraestrutura

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-17 |
| Context | `RequestAdministrativePanel.tsx` ja implementa `Salvando...`, `Arquivando...`, `disabled` e `aria-disabled`, mas essa garantia ainda nao esta provada por teste no nivel do modal oficial. |

**Choice:** expandir `RequestDetailDialog.test.tsx` para validar os dois cenarios administrativos diretamente na composicao real, reaproveitando `buildManagementRequestDetailFixture(...)`.

**Rationale:**
1. o gap e de confianca, nao de implementacao estrutural;
2. o teste no nivel do dialog prova o wiring real de props e a renderizacao final do painel administrativo;
3. evita criar suite isolada desnecessaria para comportamento ja coberto por um componente pai mais representativo.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| criar suite dedicada apenas para `RequestAdministrativePanel` | adiciona custo de manutencao sem ampliar materialmente a confianca |
| modificar o componente para novo tipo de loading | amplia escopo sem resolver a ausencia de prova automatizada |

**Consequences:**

- positivo: o contrato visual e acessivel de `Salvando...` e `Arquivando...` fica documentado em teste;
- positivo: o diff continua pequeno e restrito ao namespace do modal;
- negativo: `RequestDetailDialog.test.tsx` cresce um pouco em cobertura.

### ADR-B3-COMP-003: erro de mutation continua page-owned e deve ser provado em integracao

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-17 |
| Context | O close policy do dialog e os toasts ja vivem em `WorkflowManagementPage.tsx`. O risco remanescente e de regressao nesse wiring, nao no dialog em si. |

**Choice:** ampliar `WorkflowManagementPage.test.tsx` para cobrir erro de mutation usando os mesmos mocks de hook e `useToast`, provando toast destrutivo e permanencia do dialog aberto, incluindo pelo menos um caso administrativo de `assign`.

**Rationale:**
1. o comportamento pertence a `WorkflowManagementPage`, nao a `RequestDetailDialog`;
2. o teste de integracao e o ponto correto para verificar simultaneamente mutation, toast e selectedRequestId;
3. preserva o principio do Build 3 de manter mutation ownership na pagina.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| mover o tratamento de erro para o dialog | quebraria ownership ja consolidado |
| testar toasts apenas indiretamente via snapshots ou mocks de componente | nao prova a policy de fechamento do dialog |

**Consequences:**

- positivo: a pagina passa a ter cobertura completa de sucesso e falha para o modal operacional;
- positivo: qualquer regressao futura em `setSelectedRequestId(null)` fica detectavel;
- negativo: a suite de integracao fica mais verbosa por precisar exercitar mais de um handler de erro.

---

## 5. File Manifest

### Execution Order

| Phase | Files | Agent |
|-------|-------|-------|
| 1. View model correction | `request-detail-view-model.ts`, `request-detail-view-model.test.ts` | `@react-frontend-developer` |
| 2. Dialog confidence | `RequestDetailDialog.test.tsx` | `@react-frontend-developer` |
| 3. Page error confidence | `WorkflowManagementPage.test.tsx` | `@react-frontend-developer` |
| 4. Documentation follow-up | `BUILD_REPORT_BUILD3_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md` | `@react-frontend-developer` |

### Detailed Manifest

| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | `src/lib/workflows/management/request-detail-view-model.ts` | Modify | desacoplar o branch `finalized` de `permissions.canArchive`, preservando o CTA de arquivamento apenas no painel administrativo | `@react-frontend-developer` | - |
| 2 | `src/lib/workflows/management/__tests__/request-detail-view-model.test.ts` | Modify | adicionar regressao para `finalized + canArchive = false` e provar ausencia de CTA operacional primario | `@react-frontend-developer` | #1 |
| 3 | `src/components/workflows/management/RequestAdministrativePanel.tsx` | Verify no change expected | manter como fonte oficial de `Salvando...` / `Arquivando...`; alterar apenas se algum detalhe de acessibilidade impedir a nova prova automatizada | `@react-frontend-developer` | - |
| 4 | `src/components/workflows/management/RequestDetailDialog.tsx` | Verify no change expected | preservar o wiring atual do painel administrativo e do hero; ajustar apenas se os testes revelarem acoplamento indevido | `@react-frontend-developer` | #3 |
| 5 | `src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx` | Modify | cobrir `finalized` sem `canArchive`, `isAssigning` e `isArchiving` usando `buildManagementRequestDetailFixture(...)` | `@react-frontend-developer` | #1, #3, #4 |
| 6 | `src/components/workflows/management/WorkflowManagementPage.tsx` | Verify no change expected | manter handlers, toasts e close policy como estao; alterar somente se a suite revelar comportamento divergente do DEFINE | `@react-frontend-developer` | - |
| 7 | `src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx` | Modify | provar toast destrutivo, dialog aberto em erro e policy de fechamento preservada para mutations com falha, incluindo `assign` | `@react-frontend-developer` | #6 |
| 8 | `.claude/sdd/reports/BUILD_REPORT_BUILD3_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md` | Modify | registrar que a rodada complementar fechou as tres lacunas automatizadas remanescentes do Build 3 | `@react-frontend-developer` | #1, #5, #7 |

Arquivos explicitamente fora do delta esperado:

- `RequestOperationalHero.tsx`: sem mudanca funcional prevista;
- `RequestActionCard.tsx`: sem mudanca funcional prevista;
- hooks, runtime, read-side, endpoints, schema e permissoes: fora do escopo.

---

## 6. Code Patterns

### Pattern 1: branch `finalized` reconhecido antes de considerar `canArchive`

```ts
// src/lib/workflows/management/request-detail-view-model.ts
if (summary.statusCategory === 'finalized') {
  return {
    tone: 'read-only',
    title: 'Chamado concluido',
    description: permissions.canArchive
      ? 'O fluxo operacional foi encerrado e restam apenas acoes administrativas autorizadas.'
      : 'O fluxo operacional foi encerrado e este chamado permanece em modo somente leitura.',
    highlightLabel: 'Conclusao registrada',
    statusNote: permissions.canArchive
      ? 'Use o arquivamento apenas quando for necessario retirar o chamado da fila ativa.'
      : 'Nenhuma nova acao operacional deve ser reintroduzida fora do payload oficial.',
    showActionZoneAsPrimary: false,
    shouldRenderActionZone,
    primaryAction: null,
  };
}
```

Notas:

- o critico e o gate de entrada no branch, nao a copy exata palavra por palavra;
- `permissions.canArchive` pode continuar refinando descricao/statusNote, mas nao o reconhecimento de conclusao;
- `primaryAction` deve permanecer `null` em qualquer request `finalized`.

### Pattern 2: prova de busy states administrativos no dialog oficial

```tsx
// src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx
it('shows assigning busy state in the administrative panel', () => {
  render(
    <RequestDetailDialog
      open
      requestId={812}
      detail={buildManagementRequestDetailFixture({
        permissions: { canAssign: true },
      })}
      collaborators={[collaborator]}
      onOpenChange={() => {}}
      onAssign={async () => {}}
      onAdvance={async () => {}}
      onFinalize={async () => {}}
      onArchive={async () => {}}
      onRequestAction={async () => {}}
      onRespondAction={async () => {}}
      isAssigning
    />,
  );

  const button = screen.getByRole('button', { name: 'Salvando...' });
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute('aria-disabled', 'true');
});

it('shows archiving busy state in the administrative panel', () => {
  render(
    <RequestDetailDialog
      open
      requestId={812}
      detail={buildManagementRequestDetailFixture({
        summary: { statusCategory: 'finalized' },
        permissions: { canArchive: true },
        action: { available: false },
      })}
      collaborators={[]}
      onOpenChange={() => {}}
      onAssign={async () => {}}
      onAdvance={async () => {}}
      onFinalize={async () => {}}
      onArchive={async () => {}}
      onRequestAction={async () => {}}
      onRespondAction={async () => {}}
      isArchiving
    />,
  );

  const button = screen.getByRole('button', { name: 'Arquivando...' });
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute('aria-disabled', 'true');
});
```

Diretriz:

- o teste deve continuar usando o dialog oficial como superficie observavel;
- `buildManagementRequestDetailFixture(...)` permanece o builder padrao;
- nao criar novo helper inline para esses cenarios.

### Pattern 3: erro de mutation em integracao com toast destrutivo e dialog aberto

```tsx
// src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx
it('keeps the dialog open and shows a destructive toast when finalize fails', async () => {
  const user = userEvent.setup();
  const finalizeMutation = {
    mutateAsync: jest.fn().mockRejectedValue(new Error('Falha de rede')),
    isPending: false,
  };

  mockUseWorkflowManagement.mockImplementation((_, selectedRequestId) => ({
    ...buildHookResult(),
    assignmentsQuery: {
      data: {
        assignedItems: [buildSummary(812)],
        pendingActionItems: [],
      },
      isLoading: false,
      error: null,
    },
    detailQuery: {
      data:
        selectedRequestId === 812
          ? buildManagementRequestDetailFixture({
              permissions: { canFinalize: true },
              action: { available: false },
            })
          : undefined,
      isLoading: false,
      error: null,
    },
    finalizeMutation,
  }) as unknown as ReturnType<typeof useWorkflowManagement>);

  render(<WorkflowManagementPage />);

  await user.click(screen.getByRole('button', { name: 'Abrir' }));
  await user.click(screen.getByRole('button', { name: 'Finalizar chamado' }));

  await waitFor(() => expect(finalizeMutation.mutateAsync).toHaveBeenCalledWith({ requestId: 812 }));
  await waitFor(() =>
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Falha ao finalizar chamado',
        variant: 'destructive',
      }),
    ),
  );
  expect(screen.getByRole('heading', { name: 'Chamado #812' })).toBeTruthy();
});
```

Diretriz:

- repetir o mesmo padrao para pelo menos:
  - um caso administrativo de erro (`assign`);
  - um caso de mutation que fecha em sucesso (`finalize` ou `archive`);
  - um caso que permanece aberto em sucesso (`advance`, `requestAction` ou `respondAction`);
- o foco do patch e provar o branch de erro, nao reescrever a suite inteira.

---

## 7. API Contract

Nenhum endpoint novo ou alterado.

Contrato preservado:

- `GET /api/workflows/read/requests/{requestId}` continua sendo a unica fonte de `summary`, `permissions` e `action`;
- mutations de atribuicao, avancar, finalizar, arquivar, solicitar action e responder action preservam payloads e side effects existentes;
- a mudanca de `finalized` e estritamente de apresentacao local no view model.

Anotacao explicita desta microetapa:

- o patch nao muda runtime nem policy server-side;
- o patch apenas corrige a derivacao de copy terminal e blinda comportamento existente com testes.

---

## 8. Database Schema

Nenhuma mudanca de schema.

Firestore / Storage:

- nenhuma colecao nova;
- nenhum novo campo;
- nenhuma migracao;
- nenhum backfill;
- nenhum efeito em indices ou contratos de persistencia.

---

## 9. Testing Strategy

### Unit Tests

| Component | Test |
|-----------|------|
| `request-detail-view-model.ts` | provar que `statusCategory = finalized` gera copy de conclusao com e sem `canArchive` |
| `request-detail-view-model.ts` | provar que `primaryAction` continua `null` e `tone = read-only` no branch terminal |

### Component Tests

| Component | Test |
|-----------|------|
| `RequestDetailDialog.test.tsx` | request `finalized` sem `canArchive` mostra copy de conclusao e nao reintroduz CTA operacional primario |
| `RequestDetailDialog.test.tsx` | `isAssigning` mostra `Salvando...` com `disabled` e `aria-disabled` |
| `RequestDetailDialog.test.tsx` | `isArchiving` mostra `Arquivando...` com `disabled` e `aria-disabled` |

### Integration Tests

| Flow | Test |
|------|------|
| `assign` com erro | toast destrutivo + dialog permanece aberto |
| `finalize` com erro | toast destrutivo + dialog permanece aberto |
| `archive` com erro | toast destrutivo + dialog permanece aberto |
| `advance` ou `requestAction/respondAction` com erro | toast destrutivo + dialog permanece aberto |
| close policy consolidada | sucesso continua fechando apenas `finalize/archive`; erro nao fecha nenhuma mutation |

### Acceptance Tests

```gherkin
GIVEN um request com summary.statusCategory = finalized
AND permissions.canArchive = false
WHEN o usuario abre o modal operacional
THEN o hero comunica que o chamado foi concluido
AND nenhum CTA operacional primario e exibido
```

```gherkin
GIVEN um request com permissions.canAssign = true
WHEN o modal recebe isAssigning = true
THEN o painel administrativo exibe Salvando...
AND o botao permanece disabled e aria-disabled
```

```gherkin
GIVEN um request finalizado com permissions.canArchive = true
WHEN o modal recebe isArchiving = true
THEN o painel administrativo exibe Arquivando...
AND o CTA de arquivamento permanece bloqueado
```

```gherkin
GIVEN uma atribuicao de responsavel falha
WHEN o usuario confirma a operacao na WorkflowManagementPage
THEN um toast destrutivo e exibido
AND o dialog continua aberto no request atual
```

```gherkin
GIVEN uma mutation de finalize ou archive falha
WHEN o usuario aciona a operacao na WorkflowManagementPage
THEN um toast destrutivo e exibido
AND o dialog continua aberto no request atual
```

### Suggested Validation Command

```bash
npm test -- --runInBand \
  src/lib/workflows/management/__tests__/request-detail-view-model.test.ts \
  src/components/workflows/management/__tests__/RequestDetailDialog.test.tsx \
  src/components/workflows/management/__tests__/WorkflowManagementPage.test.tsx
```

Opcionalmente, se o build complementar tambem tocar o report:

```bash
git diff -- .claude/sdd/reports/BUILD_REPORT_BUILD3_REFATORACAO_MODAL_OPERACIONAL_GESTAO_CHAMADOS.md
```

---

## 10. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | Reverter a mudanca em `request-detail-view-model.ts` | requests `finalized` voltam ao comportamento anterior, conhecido, ainda que com copy incorreta quando `canArchive = false` |
| 2 | Reverter os testes novos de dialog e page | a suite retorna ao baseline do Build 3 original |
| 3 | Reverter a anotacao complementar do build report, se aplicada | documentacao volta ao estado do report original |
| 4 | Reexecutar a suite dirigida do modal operacional | confirmar que o baseline anterior foi restaurado sem tocar runtime ou schema |

Metodo rapido:

```bash
git revert <commit-hash>
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-17 | Codex (`design` skill) | Initial technical design for the complementary post-Build-3 corrections: finalized copy without canArchive, administrative busy-state coverage, mutation-error/toast coverage, and build-report follow-up |
