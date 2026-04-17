# DESIGN: FALLBACK_DATA_PRIMEIRA_ETAPA_CONCLUIDA_HISTORICO_V2_MODAL_SOLICITANTE_FINAL_SOLICITACOES

> Generated: 2026-04-17
> Status: Ready for /build
> Source: DEFINE_FALLBACK_DATA_PRIMEIRA_ETAPA_CONCLUIDA_HISTORICO_V2_MODAL_SOLICITANTE_FINAL_SOLICITACOES.md
> Series: 3/3 (AJUSTE_MODAL -> ENRIQUECIMENTO_DATA -> FALLBACK_DATA)

## 1. Requirements Summary

### Problem
A primeira etapa concluida do historico v2 pode permanecer sem data mesmo apos o enriquecimento por `step_completed`, porque a abertura do fluxo nem sempre gera um evento explicito de conclusao dessa etapa. O usuario final ve "Concluida" sem referencia temporal.

### Success Criteria
| Criterion | Target |
|-----------|--------|
| Primeira etapa concluida com data | 100% dos casos em que existir `request_opened` ou `submittedAt` |
| Fallback restrito a primeira etapa | 0 ocorrencias de fallback em etapas intermediarias ou finais |
| Prioridade correta | `step_completed` prevalece sobre `request_opened` que prevalece sobre `submittedAt` |
| Zero regressao active/pending | Etapas `active`/`pending` seguem sem data |
| Compatibilidade legacy | 0 regressoes em chamados legacy |
| Lacunas de testes cobertas | Erro bloqueante v2, fechamento do dialog e no-match scenario cobertos |

### Constraints
- Sem mudanca em backend, endpoints, schema ou legacy.
- Fallback restrito a primeira etapa (menor `order`; empate = primeiro no array; `order` nulo em todos = primeiro no array).
- `submittedAt` vem de `detail.summary.submittedAt`.
- `request_opened` vem de `detail.timeline` (campo `action`).
- Decisoes ja tomadas no DEFINE; nao reavaliar.

## 2. Architecture

### Estado Atual do Codigo

`buildRequesterHistory` (build-requester-history.ts) hoje faz:

1. Para `origin === 'v2'`:
   - Extrai `progressItems` de `detail.progress.items`.
   - Constroi `completedAtByStepId` via `buildCompletedAtByStepId`: percorre `detail.timeline` filtrando `action === 'step_completed'` com `details.stepId` valido, e mapeia `stepId -> Date` (maior timestamp em caso de duplicata).
   - Cada item de progress com `state === 'completed'` recebe `occurredAt` do map por `stepId`, ou `null` se nao houver match.
   - `dateVisibility` e sempre `'only-when-present'`.
   - Ordena por `sortOrder` (derivado de `item.order ?? index`).

2. Para `origin === 'legacy'`: usa `detail.timeline` como fonte, sem mudanca nesta feature.

### Delta Objetivo

Adicionar uma funcao `resolveDateForFirstStep` que, para a primeira etapa concluida do v2 sem match em `completedAtByStepId`, aplica fallback controlado:

```
step_completed (via completedAtByStepId)
  -> request_opened (primeiro evento com action === 'request_opened' na timeline)
    -> submittedAt (detail.summary.submittedAt)
      -> null (sem data)
```

Este fallback aplica-se exclusivamente ao item com menor `sortOrder` dentre os itens de progress. Etapas intermediarias e finais sem `step_completed` continuam com `occurredAt: null`.

### System Diagram

```text
[RequesterUnifiedRequestDetailDialog]
      |
      v
[buildRequesterHistory(detail)]
      |
      +--- origin === 'v2' ---+
      |                        |
      v                        v
[buildCompletedAtByStepId]   [resolveRequestOpenedDate]  <-- NOVO
      |                        |
      v                        v
[completedAtByStepId Map]   [requestOpenedDate: Date|null]
      |                        |
      +--------+---------------+
               |
               v
     [resolveDateForFirstStep]  <-- NOVO
               |
               v
     Para cada progress item:
       if completed + tem match no map -> usa map
       if completed + e primeira etapa + sem match -> resolveDateForFirstStep
       else -> null
```

### Data Flow

```text
LAYER 1 (Presentation logic - modificado)
1. src/lib/workflows/requester/presentation/build-requester-history.ts
   -> buildCompletedAtByStepId (existente, sem mudanca)
   -> resolveRequestOpenedDate (NOVO): extrai timestamp do primeiro evento request_opened
   -> resolveDateForFirstStep (NOVO): aplica cadeia step_completed -> request_opened -> submittedAt
   -> buildRequesterHistory: integra resolveDateForFirstStep na primeira etapa

LAYER 2 (Testes - modificado)
2. src/lib/workflows/requester/presentation/__tests__/build-requester-history.test.ts
   -> Novos cenarios de fallback + lacunas do build anterior
3. src/components/workflows/requester/__tests__/RequesterUnifiedRequestDetailDialog.test.tsx
   -> Erro bloqueante, fechamento, no-match scenario
```

### State Management

Sem mudanca. O `historyItems` continua sendo derivado via `useMemo` em `RequesterUnifiedRequestDetailDialog`. A unica diferenca e que o helper agora preenche `occurredAt` da primeira etapa em mais cenarios.

## 3. Architecture Decisions

### ADR-001: Definicao de "primeira etapa" por `order` canonico

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-17 |
| **Context** | O fallback so se aplica a primeira etapa. Precisamos de uma definicao deterministica de "primeira" que funcione com dados reais: `order` pode ser nulo, pode haver empate, e a ordem do array pode variar. |

**Choice:** Primeira etapa = item com menor `order` canonico; em empate de `order` (incluindo `null`), prevalece o menor `index` original do array. O sort do fluxo v2 usa um comparador de duas chaves: `(a.order ?? Infinity) - (b.order ?? Infinity) || a.index - b.index`. O `sortedIndex === 0` apos esse sort identifica a primeira etapa de forma deterministica.

**Rationale:**
1. Um comparador de duas chaves garante desempate explicito sem depender da estabilidade do sort do motor JS.
2. `item.order ?? index` em um campo escalar nao resolve empates de `order`: dois itens com `order: 1` ficam com o mesmo `sortOrder: 1` e o resultado de `1 - 1 === 0` deixa a ordem indefinida.
3. Separar `order` de `index` no comparador preserva ambos como criterios independentes e testáveis.
4. Nao depende de heuristica por label/nome da etapa.

**Alternatives Rejected:**
| Alternative | Why Rejected |
|-------------|--------------|
| Usar `kind === 'start'` para identificar a primeira etapa | Nem todas as definicoes de workflow marcam a primeira etapa como `start`; `kind` pode ser `work` na primeira |
| Usar a posicao no array original (sempre indice 0) | O array vem sem garantia de ordenacao; `order` e mais confiavel quando presente |
| Procurar pelo stepName "Abertura" | Heuristica fragil baseada em label; quebraria em workflows com nomenclatura diferente |

**Consequences:**
- Positivo: previsivel e testavel; o comparador de duas chaves garante determinismo sem depender da estabilidade do sort.
- Negativo: o fluxo v2 precisa manter `index` original apos o sort (via tuple `{ item, index }`), o que e um delta pequeno em relacao ao sort atual de `sortOrder` escalar.

---

### ADR-002: Ordem de precedencia do fallback temporal

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-17 |
| **Context** | A primeira etapa concluida pode nao ter `step_completed`. Precisamos de uma cadeia de fallback que use dados ja disponiveis no contrato unificado sem adicionar chamadas de backend. |

**Choice:** Cadeia de precedencia para a primeira etapa concluida:
1. `step_completed` (via `completedAtByStepId.get(stepId)`) -- fonte primaria, maior precisao
2. `request_opened` (primeiro evento com `action === 'request_opened'` em `detail.timeline`) -- proxy temporal da abertura
3. `submittedAt` (`detail.summary.submittedAt`) -- ultima opcao, sempre disponivel para requests submetidos
4. `null` -- sem data, se nenhuma fonte estiver disponivel

**Rationale:**
1. `step_completed` e o dado mais preciso: timestamp real da conclusao da etapa.
2. `request_opened` e o proxy mais proximo: marca quando o fluxo comecou, temporalmente coincide com a primeira etapa.
3. `submittedAt` e o fallback mais robusto: quase sempre presente, mas marca a submissao do formulario, nao a conclusao da etapa.
4. A cadeia e unidirecional e nao retro-aplica: se `step_completed` existe, `request_opened` e `submittedAt` sao ignorados.

**Alternatives Rejected:**
| Alternative | Why Rejected |
|-------------|--------------|
| Usar apenas `step_completed` e `submittedAt` (pular `request_opened`) | `request_opened` e mais preciso que `submittedAt` como proxy da primeira etapa; ignorar perde granularidade |
| Aplicar fallback em todas as etapas concluidas sem match | Ampliaria demais a heuristica; `request_opened` so faz sentido temporal para a primeira etapa |
| Buscar `entered_step` como fallback intermediario | O DEFINE exclui `entered_step` explicitamente (W2); alem disso, `entered_step` marca entrada, nao conclusao |

**Consequences:**
- Positivo: a primeira etapa concluida quase sempre tera uma data visivel.
- Positivo: a cadeia e internamente documentavel via `dateSource` no view-model (C1 do DEFINE).
- Negativo: `request_opened` e `submittedAt` sao proxies, nao a data real de conclusao. Mas e melhor que vazio.

---

### ADR-003: Cobertura das lacunas de testes do build anterior

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-17 |
| **Context** | O build anterior (ENRIQUECIMENTO_DATA) deixou tres lacunas de teste identificadas: (1) erro bloqueante do dialog v2 (`isError: true, hasStableData: false`), (2) fechamento via botao "Fechar", (3) etapa completed sem match no step_completed (no-match scenario). Estas lacunas devem ser cobertas neste build. |

**Choice:** Adicionar os tres cenarios aos testes existentes:
1. `RequesterUnifiedRequestDetailDialog.test.tsx`: teste de erro bloqueante mockando `useRequestDetail` com `isError: true, hasStableData: false` e validando que o alerta destrutivo aparece sem renderizar corpo.
2. `RequesterUnifiedRequestDetailDialog.test.tsx`: teste de fechamento via `userEvent.click` no botao "Fechar" validando que `onOpenChange` e chamado com `false`.
3. `build-requester-history.test.ts`: teste de etapa completed sem match no `step_completed` e que nao e primeira etapa, validando `occurredAt: null` (no-match scenario, sem fallback).

**Rationale:**
1. Os cenarios sao faceis de testar com mocks existentes.
2. O erro bloqueante ja tem o markup no dialog (`isV2BlockingError`); falta apenas o teste.
3. O no-match scenario valida que o fallback nao vaza para etapas intermediarias.

**Alternatives Rejected:**
| Alternative | Why Rejected |
|-------------|--------------|
| Deixar as lacunas para um build futuro | Acumular divida de testes aumenta risco de regressao; o escopo e pequeno |
| Criar um arquivo de teste separado para as lacunas | Fragmenta a suite sem necessidade; os testes se encaixam nos arquivos existentes |

**Consequences:**
- Positivo: fecha as lacunas conhecidas sem aumentar o escopo funcional.
- Negativo: nenhum trade-off significativo; os testes sao complementares.

## 4. File Manifest

### Execution Order
| Phase | Files | Agent |
|-------|-------|-------|
| 1. Presentation logic | `build-requester-history.ts` | @react-frontend-developer |
| 2. Unit tests | `build-requester-history.test.ts` | @react-frontend-developer |
| 3. Component tests | `RequesterUnifiedRequestDetailDialog.test.tsx` | @react-frontend-developer |

### Detailed Manifest
| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | `src/lib/workflows/requester/presentation/build-requester-history.ts` | Modify | Adicionar `resolveRequestOpenedDate`, `resolveDateForFirstStep` e integrar no fluxo v2 | @react-frontend-developer | - |
| 2 | `src/lib/workflows/requester/presentation/__tests__/build-requester-history.test.ts` | Modify | Cobrir fallback `request_opened`, fallback `submittedAt`, no-match em etapa nao-inicial, preservacao de `step_completed` como primaria | @react-frontend-developer | #1 |
| 3 | `src/components/workflows/requester/__tests__/RequesterUnifiedRequestDetailDialog.test.tsx` | Modify | Cobrir erro bloqueante v2, fechamento do dialog e render da data via fallback | @react-frontend-developer | #1 |

Notas de escopo:
- `src/lib/workflows/requester/unified-types.ts` -- sem mudanca obrigatoria. Se a implementacao optar por rastrear `dateSource` (C1/COULD), pode-se adicionar um campo opcional ao `RequesterHistoryItem`, mas nao ao contrato unificado.
- `src/lib/workflows/requester/adapters/v2-to-unified-detail.ts` -- sem mudanca. Ja preserva `timeline[].action` e `timeline[].details`.
- `src/components/workflows/requester/RequesterRequestHistory.tsx` -- sem mudanca. A politica de render por `dateVisibility: 'only-when-present'` ja funciona: se `occurredAt` vier preenchido via fallback, a data aparece; se nao, omite.

## 5. Code Patterns

### Pattern 1: resolveRequestOpenedDate (funcao auxiliar NOVA)

```ts
// src/lib/workflows/requester/presentation/build-requester-history.ts

/**
 * Extrai o timestamp do primeiro evento `request_opened` na timeline.
 * Retorna `null` se nao houver evento correspondente ou se o timestamp for nulo.
 */
function resolveRequestOpenedDate(
  detail: RequesterUnifiedRequestDetail,
): Date | null {
  if (detail.origin !== 'v2') {
    return null;
  }

  for (const item of detail.timeline) {
    if (item.action === 'request_opened' && item.timestamp) {
      return item.timestamp;
    }
  }

  return null;
}
```

### Pattern 2: resolveDateForFirstStep (funcao auxiliar NOVA)

```ts
// src/lib/workflows/requester/presentation/build-requester-history.ts

/**
 * Resolve a data de conclusao da primeira etapa do v2 usando cadeia de fallback:
 * step_completed -> request_opened -> submittedAt -> null
 *
 * So deve ser chamada para a primeira etapa (menor sortOrder) com state === 'completed'
 * que nao tenha match em completedAtByStepId.
 */
function resolveDateForFirstStep(
  requestOpenedDate: Date | null,
  submittedAt: Date | null,
): Date | null {
  return requestOpenedDate ?? submittedAt ?? null;
}
```

### Pattern 3: Integracao no buildRequesterHistory (fluxo v2 MODIFICADO)

```ts
// src/lib/workflows/requester/presentation/build-requester-history.ts

export function buildRequesterHistory(
  detail: RequesterUnifiedRequestDetail,
): RequesterHistoryItem[] {
  if (detail.origin === 'v2') {
    const progressItems = detail.progress?.items ?? [];
    const completedAtByStepId = buildCompletedAtByStepId(detail);
    const requestOpenedDate = resolveRequestOpenedDate(detail);

    const mapped = [...progressItems]
      .map((item, index) => ({
        id: `v2:${detail.detailKey}:${item.stepId}:${index}`,
        title: item.stepName?.trim() || '-',
        stateLabel: getManagementProgressStateLabel(item.state),
        occurredAt: null as Date | null,        // preenchido abaixo
        dateVisibility: 'only-when-present' as const,
        isCurrent: item.isCurrent,
        source: 'progress' as const,
        sortOrder: item.order ?? index,
      }))
      .sort((left, right) => left.sortOrder - right.sortOrder);

    // Identificar a primeira etapa (menor sortOrder)
    const firstStepIndex = mapped.length > 0 ? 0 : -1; // ja esta sorted

    for (let i = 0; i < mapped.length; i++) {
      const progressItem = progressItems.find(
        (p, idx) => `v2:${detail.detailKey}:${p.stepId}:${idx}` === mapped[i].id,
      );

      if (!progressItem || progressItem.state !== 'completed') {
        continue;
      }

      const stepCompletedDate = completedAtByStepId.get(progressItem.stepId) ?? null;

      if (stepCompletedDate) {
        mapped[i] = { ...mapped[i], occurredAt: stepCompletedDate };
      } else if (i === firstStepIndex) {
        // Fallback: apenas para a primeira etapa
        mapped[i] = {
          ...mapped[i],
          occurredAt: resolveDateForFirstStep(
            requestOpenedDate,
            detail.summary.submittedAt,
          ),
        };
      }
      // Etapas intermediarias/finais sem step_completed: occurredAt permanece null
    }

    return mapped;
  }

  // Legacy path: sem mudanca
  return detail.timeline
    .map((item, index) => ({
      id: `legacy:${detail.detailKey}:${index}`,
      title: item.label?.trim() || detail.summary.statusLabel || '-',
      actorName: item.userName?.trim() || 'Sistema',
      notesText: item.notes,
      occurredAt: item.timestamp,
      dateVisibility: 'always' as const,
      isCurrent: false,
      source: 'timeline' as const,
      sortOrder: index,
    }))
    .sort(compareHistoryItems);
}
```

**Nota sobre a implementacao real:** O Pattern 3b (abaixo) e a implementacao recomendada. O importante e que a logica de fallback respeite:
1. Sort por `(a.item.order ?? Infinity) - (b.item.order ?? Infinity) || a.index - b.index` — comparador de duas chaves, sem depender de `sortOrder` escalar como tiebreaker.
2. O `index` original deve ser preservado no tuple antes do sort para que o tiebreaker seja deterministico.
3. O `sortedIndex === 0` apos o sort e a "primeira etapa".
4. Se `state === 'completed'` e `completedAtByStepId` nao tem match e `sortedIndex === 0`: aplica fallback.
5. Se `state === 'completed'` e `completedAtByStepId` nao tem match e `sortedIndex > 0`: `occurredAt = null`.

### Pattern 3b: Implementacao alternativa mais limpa

```ts
// Abordagem que preserva a referencia ao progressItem sem .find()

export function buildRequesterHistory(
  detail: RequesterUnifiedRequestDetail,
): RequesterHistoryItem[] {
  if (detail.origin === 'v2') {
    const progressItems = detail.progress?.items ?? [];
    const completedAtByStepId = buildCompletedAtByStepId(detail);
    const requestOpenedDate = resolveRequestOpenedDate(detail);

    // Criar tuples preservando o index original para tiebreaker explicito
    const sorted = [...progressItems]
      .map((item, index) => ({ item, index }))
      .sort((a, b) =>
        (a.item.order ?? Infinity) - (b.item.order ?? Infinity) || a.index - b.index,
      );

    return sorted.map(({ item, index }, sortedIndex) => {
      const sortOrder = item.order ?? index;
      let occurredAt: Date | null = null;

      if (item.state === 'completed') {
        const stepDate = completedAtByStepId.get(item.stepId) ?? null;

        if (stepDate) {
          occurredAt = stepDate;
        } else if (sortedIndex === 0) {
          occurredAt = resolveDateForFirstStep(
            requestOpenedDate,
            detail.summary.submittedAt,
          );
        }
      }

      return {
        id: `v2:${detail.detailKey}:${item.stepId}:${index}`,
        title: item.stepName?.trim() || '-',
        stateLabel: getManagementProgressStateLabel(item.state),
        occurredAt,
        dateVisibility: 'only-when-present' as const,
        isCurrent: item.isCurrent,
        source: 'progress' as const,
        sortOrder,
      };
    });
  }

  // Legacy path inalterado...
}
```

## 6. API Contract

Nenhum endpoint novo ou alterado.

## 7. Database Schema

Nenhuma mudanca no schema.

## 8. Testing Strategy

### Unit Tests (build-requester-history.test.ts)

| # | Scenario | Input | Expected | Maps to |
|---|----------|-------|----------|---------|
| U1 | step_completed como fonte primaria (existente, manter) | v2 detail com `step_completed` match para step-1 | `occurredAt` = timestamp do `step_completed` | M2 |
| U2 | Fallback request_opened na primeira etapa | v2 detail: step-1 `completed` sem `step_completed`, timeline com `request_opened` timestamp | `occurredAt` da primeira etapa = timestamp do `request_opened` | M3, S1 |
| U3 | Fallback submittedAt na primeira etapa | v2 detail: step-1 `completed` sem `step_completed`, sem `request_opened`, `summary.submittedAt` presente | `occurredAt` da primeira etapa = `submittedAt` | M3, S1 |
| U4 | Sem fallback em etapa nao-inicial (no-match scenario) | v2 detail: step-2 `completed` sem `step_completed`, step-1 como primeira etapa | `occurredAt` de step-2 = `null` | M4 |
| U5 | Primeira etapa sem nenhuma fonte disponivel | v2 detail: step-1 `completed`, sem `step_completed`, sem `request_opened`, `submittedAt: null` | `occurredAt` = `null` | M3 (fallback esgota sem data) |
| U6 | step_completed prevalece sobre request_opened | v2 detail: step-1 `completed` com `step_completed` E `request_opened` na timeline | `occurredAt` = timestamp do `step_completed`, nao do `request_opened` | M2, S1 |
| U7 | Etapa active continua sem data | v2 detail: step-2 `active`, com `request_opened` na timeline | `occurredAt` = `null` | M5 |
| U8 | Etapa pending continua sem data | v2 detail: step-3 `pending` | `occurredAt` = `null` | M6 |
| U9 | Legacy nao muda | legacy detail | Resultado identico ao teste existente | M7 |
| U10 | Primeira etapa com order nulo em todos os itens | v2 detail: todos os itens sem `order`, step-1 no indice 0 do array | step-1 (indice 0) recebe fallback | S3, ADR-001 |
| U11 | Primeira etapa com empate de order | v2 detail: step-1 (indice 0) e step-2 (indice 1) ambos com `order: 1`; step-1 completed sem step_completed, request_opened presente | step-1 (menor index) recebe fallback; step-2 nao recebe fallback | ADR-001 |

### Component Tests (RequesterUnifiedRequestDetailDialog.test.tsx)

| # | Scenario | Mock | Expected | Maps to |
|---|----------|------|----------|---------|
| C1 | Erro bloqueante v2 | `useRequestDetail` retorna `{ isError: true, hasStableData: false, data: undefined, stableData: undefined }` | Alerta destrutivo visivel, corpo nao renderiza `Historico` nem `Dados enviados` | M8, lacuna build anterior |
| C2 | Fechamento do dialog via botao "Fechar" | `useRequestDetail` retorna dados validos, `onOpenChange` como `jest.fn()` | Clicar em "Fechar" chama `onOpenChange` | M8, lacuna build anterior |
| C3 | Primeira etapa com fallback request_opened renderiza data | v2 detail com step-1 `completed` sem `step_completed`, `request_opened` com timestamp | Data formatada da primeira etapa aparece no DOM | M3 |
| C4 | Etapa completed sem match nao renderiza placeholder (no-match) | v2 detail com step-2 `completed` sem `step_completed`, nao e primeira etapa | Nenhum "Sem data" no DOM para essa etapa | M4, M8, lacuna build anterior |

### Fixtures de teste

```ts
// Fixture base v2 para testes de fallback (build-requester-history.test.ts)
const makeV2Detail = (overrides: {
  timeline?: RequesterUnifiedRequestDetailTimelineItem[];
  progressItems?: WorkflowRequestProgressItem[];
  submittedAt?: Date | null;
}): RequesterUnifiedRequestDetail => ({
  origin: 'v2',
  detailKey: 'v2:2001',
  summary: {
    requesterName: 'Test User',
    workflowName: 'Workflow Test',
    displayRequestId: '2001',
    submittedAt: overrides.submittedAt ?? null,
    lastUpdatedAt: null,
    responsibleName: null,
    openedInLabel: 'Area Test',
    statusLabel: 'Em andamento',
    currentStepName: 'Etapa 2',
  },
  fields: [],
  attachments: [],
  timeline: overrides.timeline ?? [],
  progress: {
    currentStepId: 'step-2',
    totalSteps: 3,
    completedSteps: 1,
    items: overrides.progressItems ?? [
      {
        stepId: 'step-1',
        stepName: 'Abertura',
        statusKey: 'completed',
        kind: 'start',
        order: 1,
        state: 'completed',
        isCurrent: false,
      },
      {
        stepId: 'step-2',
        stepName: 'Execucao',
        statusKey: 'in_progress',
        kind: 'work',
        order: 2,
        state: 'active',
        isCurrent: true,
      },
      {
        stepId: 'step-3',
        stepName: 'Conclusao',
        statusKey: 'pending',
        kind: 'final',
        order: 3,
        state: 'pending',
        isCurrent: false,
      },
    ],
  },
  raw: {} as RequesterUnifiedRequestDetail['raw'],
});
```

### Acceptance Tests

```gherkin
GIVEN um chamado v2 cuja primeira etapa esta concluida sem step_completed
  AND a timeline contem um evento request_opened com timestamp
WHEN o solicitante abre o dialog
THEN a primeira etapa exibe a data do request_opened
  AND nenhum evento tecnico aparece no historico

GIVEN um chamado v2 cuja primeira etapa esta concluida sem step_completed
  AND a timeline nao contem request_opened
  AND o summary contem submittedAt
WHEN o solicitante abre o dialog
THEN a primeira etapa exibe a data de submittedAt

GIVEN um chamado v2 com uma etapa intermediaria concluida sem step_completed
WHEN o solicitante abre o dialog
THEN a etapa intermediaria aparece sem data
  AND nenhum placeholder "Sem data" e renderizado

GIVEN um chamado v2 cuja primeira etapa concluida tem step_completed correspondente
  AND a timeline tambem contem request_opened
WHEN o solicitante abre o dialog
THEN a primeira etapa exibe a data do step_completed (nao do request_opened)

GIVEN um chamado v2 com erro bloqueante (isError, sem stableData)
WHEN o dialog abre
THEN um alerta destrutivo aparece
  AND o corpo do dialog (historico, dados enviados) nao e renderizado

GIVEN qualquer dialog aberto com dados validos
WHEN o usuario clica em "Fechar"
THEN o dialog fecha
```

## 9. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | Reverter `build-requester-history.ts` para a versao pre-fallback (remover `resolveRequestOpenedDate` e `resolveDateForFirstStep`) | A primeira etapa sem `step_completed` volta a exibir sem data |
| 2 | Remover testes novos ou reverter para o baseline pre-fallback | Suite passa sem os cenarios de fallback |

**Metodo rapido:** `git revert <commit-do-build>`

O rollback e seguro porque:
- Nenhum componente de UI muda nesta feature.
- Nenhum tipo/contrato muda.
- A logica de fallback e aditiva e isolada em duas funcoes privadas do helper.

## 10. Implementation Checklist

### Pre-Build
- [x] DEFINE aprovado com clarity score 15/15
- [x] Decisoes de "primeira etapa" e ordem de precedencia documentadas
- [x] Manifesto de arquivos fechado (3 arquivos)
- [x] Code patterns copy-paste ready
- [x] Testing strategy com cenarios M1-M8 + lacunas mapeados

### Post-Build
- [ ] `resolveRequestOpenedDate` e `resolveDateForFirstStep` adicionadas como funcoes privadas
- [ ] `buildRequesterHistory` integra fallback apenas para `sortedIndex === 0` com `state === 'completed'`
- [ ] Nenhuma etapa intermediaria/final recebe fallback
- [ ] `step_completed` continua prevalecendo sobre fallback
- [ ] Etapas `active`/`pending` continuam com `occurredAt: null`
- [ ] Legacy inalterado
- [ ] Teste U2 (fallback request_opened) passa
- [ ] Teste U3 (fallback submittedAt) passa
- [ ] Teste U4 (no-match nao-inicial) passa
- [ ] Teste U6 (precedencia step_completed) passa
- [ ] Teste C1 (erro bloqueante) passa
- [ ] Teste C2 (fechamento) passa
- [ ] Testes existentes continuam passando sem mudanca

## 11. Specialist Instructions

### For @react-frontend-developer
```markdown
Files to modify:
- src/lib/workflows/requester/presentation/build-requester-history.ts
- src/lib/workflows/requester/presentation/__tests__/build-requester-history.test.ts
- src/components/workflows/requester/__tests__/RequesterUnifiedRequestDetailDialog.test.tsx

Key requirements:
- Adicionar `resolveRequestOpenedDate` e `resolveDateForFirstStep` como funcoes privadas em build-requester-history.ts.
- Integrar fallback no fluxo v2: apos o sort por sortOrder, o item no indice 0 (primeira etapa) com state === 'completed' sem match em completedAtByStepId recebe o fallback.
- A cadeia de fallback e: step_completed -> request_opened -> submittedAt -> null.
- NAO aplicar fallback em etapas com sortedIndex > 0.
- NAO alterar o fluxo legacy.
- NAO alterar nenhum componente de UI, tipo ou adapter.
- Nos testes do helper: usar a fixture base `makeV2Detail` para parametrizar cenarios.
- Nos testes do dialog: mockar `useRequestDetail` para cenarios de erro bloqueante e fechamento. Usar `userEvent` para o teste de fechamento.
- O teste existente 'derives v2 history from progress items in step order' continua passando sem mudanca (step-1 ja tem step_completed no fixture).
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-17 | design-agent | Initial design based on DEFINE_FALLBACK_DATA_PRIMEIRA_ETAPA_CONCLUIDA_HISTORICO_V2_MODAL_SOLICITANTE_FINAL_SOLICITACOES.md |
| 1.1 | 2026-04-17 | iterate | Corrige ADR-001: tiebreaker de empate de `order` passa a usar comparador de duas chaves `(order ?? Infinity) || index` em vez de depender de estabilidade do sort via `sortOrder` escalar. Atualiza Pattern 3b e teste U11. |
