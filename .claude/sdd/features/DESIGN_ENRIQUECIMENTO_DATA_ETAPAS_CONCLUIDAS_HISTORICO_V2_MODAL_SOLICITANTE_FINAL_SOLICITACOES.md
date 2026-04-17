# DESIGN: ENRIQUECIMENTO_DATA_ETAPAS_CONCLUIDAS_HISTORICO_V2_MODAL_SOLICITANTE_FINAL_SOLICITACOES

> Generated: 2026-04-17
> Status: Ready for /build
> Source: DEFINE_ENRIQUECIMENTO_DATA_ETAPAS_CONCLUIDAS_HISTORICO_V2_MODAL_SOLICITANTE_FINAL_SOLICITACOES.md
> Depends on: `DESIGN_AJUSTE_MODAL_SOLICITANTE_FINAL_SOLICITACOES.md` e na implementacao atual de `RequesterUnifiedRequestDetailDialog`

## 1. Objetivo

Fechar uma iteracao pontual no modal do solicitante final em `/solicitacoes` para que o bloco `Historico` do `v2` continue mostrando etapas estruturadas vindas de `progress.items`, mas passe a exibir a data real de conclusao quando houver um match confiavel com eventos `step_completed` da `timeline`.

Esta iteracao cobre:

- enriquecimento de metadado no caminho requester `v2`;
- preservacao do comportamento `legacy`;
- remocao de placeholder artificial para etapas `active` e `pending` do `v2`;
- cobertura automatizada do helper e do dialog requester.

Esta iteracao nao cobre:

- mudanca de endpoint, schema, Cloud Functions ou read model;
- exibicao da timeline tecnica do `v2` ao usuario final;
- data para etapa `active` com base em `entered_step`;
- mudanca funcional do historico `legacy`.

## 2. Fonte de Verdade

Este documento deriva de:

- [DEFINE_ENRIQUECIMENTO_DATA_ETAPAS_CONCLUIDAS_HISTORICO_V2_MODAL_SOLICITANTE_FINAL_SOLICITACOES.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/features/DEFINE_ENRIQUECIMENTO_DATA_ETAPAS_CONCLUIDAS_HISTORICO_V2_MODAL_SOLICITANTE_FINAL_SOLICITACOES.md)
- [DESIGN_AJUSTE_MODAL_SOLICITANTE_FINAL_SOLICITACOES.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/features/DESIGN_AJUSTE_MODAL_SOLICITANTE_FINAL_SOLICITACOES.md)
- [RequesterUnifiedRequestDetailDialog.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/requester/RequesterUnifiedRequestDetailDialog.tsx)
- [RequesterRequestHistory.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/workflows/requester/RequesterRequestHistory.tsx)
- [build-requester-history.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/requester/presentation/build-requester-history.ts)
- [v2-to-unified-detail.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/requester/adapters/v2-to-unified-detail.ts)
- [unified-types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/requester/unified-types.ts)
- [types.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/types.ts)
- [detail.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/read/detail.ts)
- [advance-step.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/use-cases/advance-step.ts)

Em caso de divergencia:

1. prevalece o `DEFINE` desta feature para escopo e aceite;
2. depois prevalece o contrato real do detalhe requester `v2` ja exposto por `GET /api/workflows/read/requests/[requestId]`;
3. depois prevalece o shell requester aprovado em `DESIGN_AJUSTE_MODAL_SOLICITANTE_FINAL_SOLICITACOES.md`;
4. depois prevalece este documento para orientar o `/build`.

## 3. Estado Atual e Gaps Reais

### 3.1. O que o codigo faz hoje

- `buildRequesterHistory()` usa `detail.progress.items` como fonte correta do `Historico` no `v2`, mas atribui `occurredAt: null` para todas as etapas, inclusive as `completed`.
- `RequesterRequestHistory` sempre renderiza a area de data e usa `formatManagementDate(item.occurredAt, 'Sem data')`, o que introduz placeholder artificial no `v2`.
- `v2ReadDetailToUnifiedDetail()` normaliza a `timeline`, mas hoje reduz `details` a um `notes` serializado e nao preserva `action/details` em formato estruturado.
- O contrato real do backend ja contem o dado necessario: `advance-step.ts` grava `step_completed` com `details.stepId`, e `read/detail.ts` expoe esse payload em `WorkflowRequestTimelineItem.details`.
- O caminho `legacy` ja funciona com `timeline` derivada e nao precisa de match com `progress`.

### 3.2. Lacunas objetivas em relacao ao DEFINE aprovado

- a UI nao consegue mostrar a data de conclusao de etapas `completed` do `v2`, embora o dado exista indiretamente na `timeline`;
- o helper requester nao consegue fazer match estrutural por `stepId` porque o adapter `v2` nao preserva `action/details`;
- o render atual mostra `Sem data` para etapas `active` e `pending`, violando a decisao de UX desta rodada;
- o design atual nao separa explicitamente "timestamp disponivel" de "data que deve ser exibida", o que cria ambiguidade para preservar `legacy`.

### 3.3. Invariantes que esta feature precisa preservar

- `v2` continua usando `progress.items` como fonte visual primaria do bloco `Historico`;
- `legacy` continua usando `timeline` como unica fonte funcional do bloco `Historico`;
- nenhum evento tecnico do `v2` (`step_completed`, `entered_step`, `action_requested`) aparece como item visivel no `Historico`;
- o dialog requester continua read-only;
- nenhum endpoint, permissao, contrato de backend ou schema muda nesta rodada.

## 4. Arquitetura da Solucao

### 4.1. Diagrama arquitetural

```text
[/solicitacoes]
      |
      v
[RequestsV2Page]
      |
      v
[RequesterUnifiedRequestDetailDialog]
      |
      +----------------------------------------+
      |                                        |
      v                                        v
[legacyRequestToUnifiedDetail]       [v2ReadDetailToUnifiedDetail]
      |                                        |
      |                             preserves timeline.action/details
      |                                        |
      +-------------------+--------------------+
                          |
                          v
             [RequesterUnifiedRequestDetail]
                          |
                          v
             [buildRequesterHistory(detail)]
                          |
         +----------------+--------------------------+
         |                                           |
         v                                           v
 legacy: detail.timeline only              v2: progress.items + timeline lookup
                                           |
                                           +--> index step_completed by details.stepId
                                           +--> attach occurredAt only to completed steps
                                           +--> keep visual order from progress.order
                          |
                          v
             [RequesterRequestHistory]
                          |
                          +--> render date only when policy allows
                          +--> no placeholder for v2 active/pending/no-match
```

### 4.2. Fluxo fechado por camada

```text
LAYER 1 (Dialog orchestration)
1. RequesterUnifiedRequestDetailDialog continua resolvendo `legacy` vs `v2`.
2. Nenhuma mudanca em fetch, loading, erro bloqueante ou fechamento do dialog.

LAYER 2 (Unified detail contract)
3. unified-types.ts passa a permitir que timeline requester preserve `action` e `details`.
4. v2-to-unified-detail.ts deixa de colapsar `details` apenas em `notes` e carrega o objeto estruturado.
5. legacy-to-unified-detail.ts / derive-legacy-timeline.ts seguem populando timeline, com `action/details` nulos ou omitidos.

LAYER 3 (Presentation derivation)
6. build-requester-history.ts cria um indice auxiliar `completedAtByStepId` apenas para `origin === 'v2'`.
7. O indice considera somente itens da timeline com:
   - `action === 'step_completed'`
   - `typeof details.stepId === 'string'`
   - timestamp valido
8. Cada item de `progress.items` gera um `RequesterHistoryItem` visivel.
9. Para `state === 'completed'`, o helper tenta anexar `occurredAt` usando `completedAtByStepId.get(stepId)`.
10. Para `state === 'active'`, `pending` ou `skipped`, `occurredAt` permanece `null`.
11. O helper do `v2` preserva a ordem canonica de `progress.order`; a timeline nunca reordena as etapas.
12. O helper do `legacy` permanece baseado em `detail.timeline`, ordenado cronologicamente como hoje.

LAYER 4 (Render)
13. RequesterRequestHistory passa a renderizar a data segundo uma politica explicita de exibicao:
   - `legacy`: manter politica atual (`Sem data` apenas se realmente nao houver timestamp)
   - `v2`: renderizar data somente quando `occurredAt` existir
14. O bloco `Historico` continua sem expor eventos tecnicos ao usuario final.
```

### 4.3. Delta de contrato de dados

#### 4.3.1. Timeline unificada requester

| Campo | Antes | Depois | Motivo |
|-------|-------|--------|--------|
| `action` | nao exposto | `WorkflowRequestTimelineItem['action'] \| null` | identificar `step_completed` no caminho `v2` |
| `details` | perdido ou serializado em `notes` | `Record<string, unknown> \| null` | ler `details.stepId` de forma estruturada |
| `notes` | string opcional | sem mudanca obrigatoria | legado continua podendo usar texto livre |

Regra de compatibilidade:

- `legacy` pode devolver `action: null` e `details: null`;
- `v2` deve preservar `action/details` exatamente como chegam do read model normalizado;
- nenhum consumidor fora do requester passa a depender desses campos nesta rodada.

#### 4.3.2. View-model de historico requester

`RequesterHistoryItem` passa a distinguir disponibilidade tecnica de timestamp e politica de exibicao.

| Campo | Regra `legacy` | Regra `v2` |
|-------|----------------|------------|
| `occurredAt` | vem de `timeline.timestamp` | vem do match `step_completed` por `stepId` somente para etapas `completed` |
| `source` | `'timeline'` | `'progress'` |
| `isCurrent` | `false` | vem de `progress.items[].isCurrent` |
| `stateLabel` | omitido | vem de `getManagementProgressStateLabel(item.state)` |
| `dateVisibility` | `'always'` | `'only-when-present'` |

Regras fechadas:

- `dateVisibility = 'always'` significa que o componente pode exibir fallback textual se `occurredAt` for `null`;
- `dateVisibility = 'only-when-present'` significa que o componente nao deve renderizar nenhum placeholder;
- isso preserva `legacy` e atende o requisito de UX do `v2` sem criar branches difusos no JSX.

### 4.4. Regra de match e ordenacao do `v2`

Contrato fechado para o enrich:

1. A timeline do `v2` e apenas um indice auxiliar; nunca uma fonte visual.
2. O match e estritamente estrutural:
   - `timeline.action === 'step_completed'`
   - `timeline.details.stepId === progressItem.stepId`
3. Nao existe fallback por `label`, `stepName`, `statusLabel` ou comparacao fuzzy.
4. Se houver mais de um `step_completed` para o mesmo `stepId`, vence o timestamp valido mais recente.
5. Se `stepId` estiver ausente, invalido ou o timestamp nao puder ser normalizado, a etapa continua sem data.
6. A ordem do `Historico` `v2` continua sendo a ordem canonica das etapas (`order`, depois indice), nao a ordem temporal dos eventos auxiliares.

## 5. Architecture Decisions

### ADR-001: Preservar `action/details` no adapter requester `v2`

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-17 |
| Context | O read model `v2` ja expoe `timeline.action` e `timeline.details`, incluindo `details.stepId`, mas o adapter requester atual serializa esse objeto em `notes` e perde o contrato estruturado necessario para match por etapa. |

**Choice:** expandir `RequesterUnifiedRequestDetailTimelineItem` para manter `action` e `details` estruturados no caminho `v2`.

**Rationale:**

1. fecha o requisito S1 do DEFINE com match estrutural real;
2. evita buscar `detail.raw.timeline` dentro do helper de apresentacao;
3. mantem a decisao arquitetural de trabalhar sempre sobre o contrato unificado requester.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| Ler `detail.raw.timeline` diretamente em `build-requester-history.ts` | vaza contrato bruto para a camada de apresentacao e enfraquece o adapter |
| Match por `label` ou `stepName` | contraria o DEFINE e e mais fragil |

**Consequences:**

- Positivo: o helper consegue enriquecer a data sem depender do shape bruto do endpoint.
- Negativo: `unified-types.ts` e adapters requester recebem um delta pequeno de contrato.

---

### ADR-002: A timeline do `v2` entra apenas como lookup table de conclusao

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-17 |
| Context | O shell requester aprovado anteriormente ja decidiu que o `Historico` do `v2` deve mostrar etapas e nao eventos tecnicos. Ainda assim, a data real de conclusao mora na timeline. |

**Choice:** usar a `timeline` apenas para montar um mapa `stepId -> completedAt`, mantendo `progress.items` como unica fonte de itens visiveis.

**Rationale:**

1. atende M1 e M2 simultaneamente;
2. impede que `step_completed`, `entered_step` e `action_requested` vazem para a UX final;
3. reduz o risco de regressao visual no modal requester.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| Renderizar diretamente os eventos `step_completed` no historico | quebra a decisao de produto do `v2` por etapas |
| Fundir timeline e progress num novo array persistido no adapter | adiciona complexidade sem beneficio funcional |

**Consequences:**

- Positivo: o usuario continua vendo apenas etapas.
- Positivo: o enriquecimento de data fica isolado e reversivel.
- Negativo: o helper requester passa a ter um passo extra de indexacao.

---

### ADR-003: O `Historico` `v2` preserva ordem de etapa, nao ordem de evento

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-17 |
| Context | Depois do enrich, etapas `completed` podem ganhar timestamp, enquanto `active` e `pending` continuam sem data. Se o helper voltar a ordenar o `v2` por `occurredAt`, a UI pode passar a refletir eventos auxiliares em vez da sequencia oficial das etapas. |

**Choice:** no caminho `v2`, ordenar exclusivamente por `progress.items[].order` e usar a data apenas como metadado visual.

**Rationale:**

1. `progress.items` e a fonte visual primaria aprovada;
2. a leitura por etapa fica estavel mesmo quando algumas etapas nao tiverem match;
3. evita reorder inesperado se houver timestamps inconsistentes no historico tecnico.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| Reordenar o `v2` por `occurredAt` quando houver data | confunde a hierarquia visual do progresso da solicitacao |
| Misturar ordenacao por data e fallback por order | cria regra hibrida dificil de explicar e testar |

**Consequences:**

- Positivo: o `Historico` `v2` continua previsivel.
- Negativo: a data deixa de ser um driver de ordenacao, apenas um enriquecimento.

---

### ADR-004: Politica de exibicao de data fica explicita no view-model

| Attribute | Value |
|-----------|-------|
| Status | Accepted |
| Date | 2026-04-17 |
| Context | O componente atual sempre renderiza um texto de data com fallback `'Sem data'`. Isso viola a UX do `v2`, mas remover o fallback globalmente pode alterar `legacy` sem necessidade. |

**Choice:** adicionar ao `RequesterHistoryItem` uma politica explicita (`dateVisibility`) para diferenciar `legacy` de `v2`.

**Rationale:**

1. preserva `legacy` sem condicionar o JSX a regras de negocio espalhadas;
2. fecha M3, M4 e M6 do DEFINE;
3. torna o comportamento facilmente testavel em helper e componente.

**Alternatives Rejected:**

| Alternative | Why Rejected |
|-------------|--------------|
| Branch por `item.source === 'progress'` diretamente no JSX | funciona, mas deixa a regra mais implicita e menos testavel |
| Remover placeholder para todo mundo | pode alterar comportamento de `legacy` alem do necessario |

**Consequences:**

- Positivo: politica de exibicao fica declarativa.
- Negativo: `RequesterHistoryItem` ganha um campo a mais de apresentacao.

## 6. File Manifest

### Execution Order

| Phase | Files | Agent |
|-------|-------|-------|
| 1. Unified contract | tipos + adapter `v2` + timeline legacy | @react-frontend-developer |
| 2. Presentation logic | helper `buildRequesterHistory` | @react-frontend-developer |
| 3. UI render | `RequesterRequestHistory` | @react-frontend-developer |
| 4. Regression coverage | testes do helper e do dialog | @react-frontend-developer |

### Detailed Manifest

| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | `src/lib/workflows/requester/unified-types.ts` | Modify | Preservar `timeline.action/details` no contrato unificado requester | @react-frontend-developer | - |
| 2 | `src/lib/workflows/requester/adapters/v2-to-unified-detail.ts` | Modify | Mapear `action/details` estruturados da timeline `v2` para o contrato unificado | @react-frontend-developer | #1 |
| 3 | `src/lib/workflows/requester/legacy/derive-legacy-timeline.ts` | Modify (if needed) | Preencher shape compativel de timeline requester sem inventar dados para `legacy`, apenas se o delta de tipos exigir campos opcionais explicitos | @react-frontend-developer | #1 |
| 4 | `src/lib/workflows/requester/presentation/build-requester-history.ts` | Modify | Indexar `step_completed` por `stepId`, enriquecer `completed`, preservar order do `v2` e politica de data | @react-frontend-developer | #1, #2, #3 |
| 5 | `src/components/workflows/requester/RequesterRequestHistory.tsx` | Modify | Renderizar data apenas quando a politica do item permitir | @react-frontend-developer | #4 |
| 6 | `src/lib/workflows/requester/presentation/__tests__/build-requester-history.test.ts` | Modify | Cobrir match por `stepId`, no-match, ausencia de placeholder via contrato e preservacao `legacy` | @react-frontend-developer | #4 |
| 7 | `src/components/workflows/requester/__tests__/RequesterUnifiedRequestDetailDialog.test.tsx` | Modify | Cobrir data em etapa concluida, ausencia de data em `Atual`/`Pendente`, erro bloqueante e fechamento | @react-frontend-developer | #5, #6 |

Notas de escopo:

- `RequesterUnifiedRequestDetailDialog.tsx` nao exige mudanca arquitetural obrigatoria nesta rodada, desde que continue usando `buildRequesterHistory(unifiedDetail)`.
- `useRequestDetail()` e a query do requester permanecem sem mudanca.
- Nenhum arquivo de backend entra no manifest desta iteracao.
- `derive-legacy-timeline.ts` so entra na rodada se `unified-types.ts` exigir preenchimento explicito de campos opcionais; caso contrario, o caminho legado deve permanecer sem churn.

## 7. Code Patterns

### Pattern 1: Indexacao estrutural de `step_completed` por `stepId`

```typescript
function buildCompletedAtByStepId(
  timeline: RequesterUnifiedRequestDetail['timeline'],
): Map<string, Date> {
  const completedAtByStepId = new Map<string, Date>();

  for (const item of timeline) {
    if (item.action !== 'step_completed') continue;

    const rawStepId = item.details?.stepId;
    const stepId = typeof rawStepId === 'string' ? rawStepId.trim() : '';
    if (!stepId || !item.timestamp) continue;

    const previous = completedAtByStepId.get(stepId);
    if (!previous || previous.getTime() < item.timestamp.getTime()) {
      completedAtByStepId.set(stepId, item.timestamp);
    }
  }

  return completedAtByStepId;
}
```

Uso esperado:

- somente no caminho `origin === 'v2'`;
- sem fallback textual;
- sem depender de `raw.timeline`.

### Pattern 2: Derivacao do `Historico` `v2` por etapas com data opcional

```typescript
const completedAtByStepId = buildCompletedAtByStepId(detail.timeline);

return [...(detail.progress?.items ?? [])]
  .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
  .map((item, index) => {
    const occurredAt =
      item.state === 'completed'
        ? completedAtByStepId.get(item.stepId) ?? null
        : null;

    return {
      id: `v2:${detail.detailKey}:${item.stepId}:${index}`,
      title: item.stepName?.trim() || '-',
      stateLabel: getManagementProgressStateLabel(item.state),
      occurredAt,
      isCurrent: item.isCurrent,
      source: 'progress' as const,
      sortOrder: item.order ?? index,
      dateVisibility: 'only-when-present' as const,
    };
  });
```

Regra fechada:

- o array resultante do `v2` nao deve ser reordenado por `occurredAt`;
- `occurredAt` e apenas metadado de exibicao.

### Pattern 3: Render condicional da data no componente requester

```tsx
const shouldRenderDate =
  item.dateVisibility === 'always' || item.occurredAt !== null;

{shouldRenderDate ? (
  <p className="text-xs text-muted-foreground">
    {formatManagementDate(item.occurredAt, 'Sem data')}
  </p>
) : null}
```

Efeito esperado:

- `legacy` continua aceitando fallback;
- `v2` nao mostra `Sem data`, `Nao concluida` nem texto equivalente.

## 8. API Contract

Nenhum endpoint novo ou alterado.

Continuam valendo, sem mudanca contratual:

- `GET /api/workflows/read/requests/[requestId]`
- `GET /api/workflows/read/mine`

## 9. Database Schema

Nenhuma mudanca no schema.

Nenhuma mudanca em:

- Firestore read models `v2`;
- colecoes legadas de workflow;
- Cloud Functions ou regras de seguranca.

## 10. Testing Strategy

### 10.1. Unit Tests

| Component | Test |
|-----------|------|
| `build-requester-history.ts` | etapa `completed` do `v2` recebe `occurredAt` quando existir `step_completed.details.stepId` correspondente |
| `build-requester-history.ts` | quando houver mais de um `step_completed` para o mesmo `stepId`, vence o timestamp valido mais recente |
| `build-requester-history.ts` | etapa `completed` do `v2` permanece sem data quando nao houver match ou quando `details.stepId` for invalido |
| `build-requester-history.ts` | etapas `active` e `pending` do `v2` nunca recebem data, mesmo com timeline presente |
| `build-requester-history.ts` | ordem do `v2` continua baseada em `progress.order`, nao em timestamp |
| `build-requester-history.ts` | caminho `legacy` continua derivando historico a partir de `timeline` sem match com `progress` |

### 10.2. Component / Integration Tests

| Flow | Test |
|------|------|
| `RequesterUnifiedRequestDetailDialog` `v2` | exibe data apenas para etapa `Concluida` com match por `stepId` |
| `RequesterUnifiedRequestDetailDialog` `v2` | nao exibe `Sem data` em itens `Atual` e `Pendente` |
| `RequesterUnifiedRequestDetailDialog` `v2` | nao renderiza evento tecnico da timeline (`Evento tecnico`, `step_completed`, etc.) |
| `RequesterUnifiedRequestDetailDialog` erro bloqueante | continua mostrando alerta destrutivo quando nao houver `stableData` |
| `RequesterUnifiedRequestDetailDialog` fechamento | continua fechando o dialog corretamente via botao `Fechar` / `onOpenChange(false)` |
| `RequesterUnifiedRequestDetailDialog` `legacy` | continua exibindo historico derivado de timeline e sem dependencia de `progress` |

### 10.3. Acceptance Tests

```gherkin
GIVEN um detalhe requester v2 com uma etapa "Triagem" em state "completed"
AND existe na timeline um evento "step_completed" com details.stepId = "triagem"
WHEN o solicitante abre o modal em /solicitacoes
THEN o bloco Historico mostra a etapa "Triagem"
AND mostra a data formatada de conclusao dessa etapa
AND nao mostra o evento tecnico da timeline
```

```gherkin
GIVEN um detalhe requester v2 com uma etapa "Execucao" em state "active"
WHEN o solicitante abre o modal
THEN o bloco Historico mostra a etapa "Execucao" com label "Atual"
AND nao mostra "Sem data"
AND nao mostra "Nao concluida"
```

```gherkin
GIVEN um detalhe requester legacy
WHEN o solicitante abre o modal
THEN o bloco Historico continua sendo derivado apenas da timeline legado
AND nenhuma regra de match com progress e aplicada
```

## 11. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | Reverter as mudancas em `build-requester-history.ts` e `RequesterRequestHistory.tsx` | o `Historico` `v2` volta a mostrar apenas etapas sem data |
| 2 | Reverter o delta de `unified-types.ts` e `v2-to-unified-detail.ts` | timeline requester deixa de carregar `action/details` estruturados |
| 3 | Reexecutar a suite requester | confirmar que `legacy` continua abrindo e que o dialog volta ao comportamento anterior |

**Metodo rapido:** `git revert <commit-do-build>`

## 12. Implementation Checklist

### Pre-Build

- [x] DEFINE document aprovado
- [x] Contrato real de `step_completed.details.stepId` validado no runtime/read model
- [x] Arquivos impactados identificados
- [x] Regra de preservacao `legacy` definida
- [x] Estrategia de testes definida

### Post-Build

- [ ] Timeline requester `v2` preserva `action/details`
- [ ] `buildRequesterHistory` faz match por `stepId` sem heuristica textual
- [ ] `RequesterRequestHistory` nao mostra placeholder no `v2` quando nao houver data
- [ ] `legacy` continua usando apenas timeline
- [ ] Testes requester passam

## 13. Specialist Instructions

### For @react-frontend-developer

```markdown
Files to modify:
- src/lib/workflows/requester/unified-types.ts
- src/lib/workflows/requester/adapters/v2-to-unified-detail.ts
- src/lib/workflows/requester/legacy/derive-legacy-timeline.ts (apenas se necessario para satisfazer tipos opcionais)
- src/lib/workflows/requester/presentation/build-requester-history.ts
- src/components/workflows/requester/RequesterRequestHistory.tsx
- src/lib/workflows/requester/presentation/__tests__/build-requester-history.test.ts
- src/components/workflows/requester/__tests__/RequesterUnifiedRequestDetailDialog.test.tsx

Key requirements:
- `v2` continua mostrando etapas de `progress.items`; a timeline e apenas metadado auxiliar
- match somente por `action === 'step_completed'` e `details.stepId === progress.stepId`
- nao usar fallback por label, nome de etapa ou status
- preservar comportamento `legacy`
- nao introduzir placeholder textual para `active`/`pending` do `v2`
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-17 | Codex | Initial design for enriching completed-step dates in requester v2 history using structural match by `stepId` while preserving `legacy` behavior |
| 1.1 | 2026-04-17 | Codex | Refina o design para reduzir churn no caminho `legacy` (arquivo so entra se necessario) e explicita teste obrigatorio para resolver multiplos eventos `step_completed` por `stepId` usando o timestamp valido mais recente |
