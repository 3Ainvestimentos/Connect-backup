# DESIGN: AJUSTE_MODAL_SOLICITANTE_FINAL_SOLICITACOES

> Generated: 2026-04-17
> Status: Ready for /build
> Source: DEFINE_AJUSTE_MODAL_SOLICITANTE_FINAL_SOLICITACOES.md
> Depends on: `DESIGN_COMPATIBILIDADE_LEGADO_MINHAS_SOLICITACOES_SOLICITACOES_V2.md` e na implementacao atual de `RequesterUnifiedRequestDetailDialog`

## 1. Requirements Summary

### Problem
O dialog do solicitante final em `/solicitacoes` ja unifica itens `legacy` e `v2`, mas continua apresentando um shell visual hibrido: bloco inicial em card moderno, `RequestProgress` separado, `RequestTimeline` separado e copy sem acentuacao em varios pontos. O resultado nao replica a experiencia esperada do modal legado `RequestDetailsModal.tsx`, que organiza a leitura em cabecalho, grade de informacoes, `Dados enviados`, `Historico` e rodape.

### Success Criteria
| Criterion | Target |
|-----------|--------|
| Shell visual unico | `legacy` e `v2` abrem no mesmo dialog com a mesma hierarquia visual principal |
| Fidelidade estrutural ao legado | Header, grade de metadados, `Dados enviados`, `Historico` e footer seguem o shell do modal legado |
| Zero `Timeline` separada | Nenhum titulo/componente `Timeline` aparece no requester final |
| Zero `Progresso` separado | Nenhum bloco `RequestProgress` aparece no requester final |
| `Historico` ordenado | Item mais antigo aparece no topo e o mais recente no fim |
| Compatibilidade de conteudo | `Dados enviados` permanece para `legacy` e `v2`; anexos aparecem quando existirem |
| PT-BR corrigido | Textos do modal usam grafia correta: `Solicitação`, `Histórico`, `Não`, `Responsável`, `Última atualização`, `Ações` |
| Read-only preservado | Nenhum CTA operacional ou mutacao de estado e adicionado ao dialog |

### Constraints
- Escopo restrito ao modal do solicitante final em `/solicitacoes`.
- Sem mudancas em backend, endpoints, Cloud Functions, Firestore Rules ou schema.
- `RequestsV2Page` continua sendo o ponto de abertura do dialog.
- `legacy` e `v2` permanecem usando os adapters existentes como fonte do detalhe.
- A derivacao nova deve ficar isolada na camada requester; nao reutilizar `RequestTimeline` ou `RequestProgress` via CSS.
- O shell visual final deve ser requester-owned e nao pode depender de `Card`s empilhados de `management/` para os blocos principais do modal.
- O resultado final precisa continuar acessivel: `DialogTitle`, `DialogDescription`, foco de abertura/fechamento, area rolavel e botao de fechar.

## 2. Architecture

### System Diagram

```text
[/solicitacoes]
      |
      v
[RequestsV2Page]
      |
      v
[RequesterUnifiedRequestDetailDialog]
      |
      +---------------------------------------------+
      |                                             |
      v                                             v
[legacyRequestToUnifiedDetail]             [useRequestDetail(requestId)]
      |                                             |
      v                                             v
[RequesterUnifiedRequestDetail] <----- [v2ReadDetailToUnifiedDetail]
      |
      v
[buildRequesterHistory(detail)]   <- NOVO helper requester-only
      |
      +----------------------+------------------------------+------------------------------+--------------------+
      |                      |                              |                              |                    |
      v                      v                              v                              v                    v
[Dialog header]   [RequesterRequestSummaryHeader]   [RequesterRequestFormData]   [RequesterRequestAttachments?]   [RequesterRequestHistory]
                                                                                                                            |
                                                                                                                            v
                                                                                                                     [DialogFooter]

Removed from requester shell:
- RequestProgress
- RequestTimeline
```

### Target UI Shell

```text
┌───────────────────────────────────────────────────────────────┐
│ Titulo do dialog: "Solicitação #1234 - Nome do workflow"     │
│ Descricao: resumo curto read-only                            │
├───────────────────────────────────────────────────────────────┤
│ Grade de informacoes (estilo legado)                         │
│ - Solicitante     - Tipo                                     │
│ - Data            - Última atualização                       │
│ - Responsável     - Área / aberto em                         │
├───────────────────────────────────────────────────────────────┤
│ Dados enviados                                               │
├───────────────────────────────────────────────────────────────┤
│ Anexos (somente quando existirem)                            │
├───────────────────────────────────────────────────────────────┤
│ Histórico                                                    │
│ o etapa / label + data + ator + notas                        │
│ o ...                                                        │
│ o item mais recente por ultimo                               │
├───────────────────────────────────────────────────────────────┤
│ Footer com CTA unico: Fechar                                 │
└───────────────────────────────────────────────────────────────┘
```

### Data Flow

```text
LAYER 1 (Page / Dialog orchestration)
1. src/components/workflows/requester/RequestsV2Page.tsx
   -> mantem selectedItem e showDetailDialog sem mudanca de fluxo.
2. src/components/workflows/requester/RequesterUnifiedRequestDetailDialog.tsx
   -> continua resolvendo legacy vs v2 e controla loading/erro do fetch v2.

LAYER 2 (Unified detail - existente)
3. src/lib/workflows/requester/adapters/legacy-to-unified-detail.ts
   -> continua normalizando detalhe legado.
4. src/lib/workflows/requester/adapters/v2-to-unified-detail.ts
   -> continua normalizando detalhe v2 para o shell requester.

LAYER 3 (Requester presentation - novo)
5. src/lib/workflows/requester/presentation/build-requester-history.ts
   -> cria RequesterHistoryItem[] bifurcando por `detail.origin`:
      v2: extrai etapas de `detail.progress.items` (sem usar timeline).
      legacy: extrai eventos de `detail.timeline` (sem usar progress).
   -> ordena cronologicamente ascendente em ambos os casos.
6. src/components/workflows/requester/RequesterRequestHistory.tsx
   -> renderiza a secao final `Historico` em estilo de linha do tempo legado.
7. src/components/workflows/requester/RequesterRequestFormData.tsx
   -> renderiza `Dados enviados` no shell legado, sem `Card` de management.
8. src/components/workflows/requester/RequesterRequestAttachments.tsx
   -> renderiza `Anexos` no shell legado, sem `Card` de management.

LAYER 4 (Reuse controlado)
9. src/components/workflows/requester/RequesterRequestSummaryHeader.tsx
   -> deixa de parecer um card de management e passa a espelhar a grade do legado.
10. src/components/workflows/management/presentation.ts
   -> pode ser reaproveitado apenas para formatacao de valores/campos; nao para o shell visual final.
```

### State Management
| State | Storage | Lifecycle |
|-------|---------|-----------|
| `selectedItem` | `useState` em `RequestsV2Page` | Definido ao clicar em um item; limpo ao fechar dialog |
| Detalhe `v2` | TanStack Query via `useRequestDetail(requestId, enabled)` | Ativo apenas quando o dialog esta aberto para item `v2` |
| Detalhe `legacy` | Derivado sincronicamente por `legacyRequestToUnifiedDetail` | Recalculado ao abrir item `legacy` |
| `RequesterHistoryItem[]` | `useMemo` em `RequesterUnifiedRequestDetailDialog` | Recomputado quando `unifiedDetail` muda |
| Estado de erro bloqueante `v2` | Derivado da query | Renderiza alerta destrutivo e esconde o corpo quando nao ha `stableData` |
| Estado de erro nao bloqueante `v2` | Derivado da query | Opcional; se mantido, exibe alerta e preserva o ultimo detalhe valido |

### Presentation Contract Delta

As pequenas adaptacoes aprovadas no DEFINE ficam isoladas em `src/lib/workflows/requester/presentation/build-requester-history.ts` e nao exigem mudanca de endpoint nem de schema.

**Estrategia v2 (fonte: `detail.progress.items`)**

| Derived field | Source | Purpose | Fallback |
|---------------|--------|---------|----------|
| `id` | `v2:${detailKey}:${index}` | chave estavel de render no `Historico` | - |
| `title` | `progress.items[].stepName` | nome da etapa exibido como titulo principal | `'-'` |
| `stateLabel` | `progress.items[].state` | chip secundario visivel no render (`Concluida`, `Em andamento`, `Pendente`) | omitido |
| `isCurrent` | `progress.items[].isCurrent` | destacar visualmente a etapa atual no `Historico` | `false` |
| `occurredAt` | `progress.items[].completedAt` ou `progress.items[].startedAt` quando disponivel | ordenacao e exibicao cronologica | `null` (usa `stepOrder` como fallback de ordenacao) |
| `actorName` | nao disponivel em `progress` | - | omitido para v2 |
| `notesText` | nao disponivel em `progress` | - | omitido para v2 |
| `source` | `'progress'` | debug/testes e rastreabilidade da derivacao | - |

**Estrategia legacy (fonte: `detail.timeline`)**

| Derived field | Source | Purpose | Fallback |
|---------------|--------|---------|----------|
| `id` | `legacy:${detailKey}:${index}` | chave estavel de render no `Historico` | - |
| `title` | `timeline.label` ou `summary.statusLabel` | titulo principal do item | `'-'` |
| `actorName` | `timeline.userName` | nome exibido ao lado do timestamp | `'Sistema'` |
| `occurredAt` | `timeline.timestamp` | ordenacao e exibicao cronologica | `null` |
| `notesText` | `timeline.notes` | corpo textual do evento | omitido |
| `stateLabel` | nao aplicavel para legacy | - | omitido |
| `isCurrent` | nao aplicavel para legacy | - | `false` |
| `source` | `'timeline'` | debug/testes e rastreabilidade da derivacao | - |

Regras por origem:
- v2 usa exclusivamente `detail.progress.items` como fonte. A `detail.timeline` do v2 nao e consumida pelo helper — contem eventos granulares que nao correspondem a experiencia de etapas desejada.
- Legacy usa exclusivamente `detail.timeline` como fonte. `detail.progress` e `null` ou vazio para itens legados.
- Nenhuma regra de negocio nova e persistida; tudo permanece como view-model de apresentacao.
- A bifurcacao por origem fica isolada em `build-requester-history.ts`.

## 3. Architecture Decisions

### ADR-001: Orquestracao atual permanece; apenas a camada de apresentacao requester muda

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-17 |
| **Context** | A compatibilidade `legacy` + `v2` ja foi resolvida no build anterior via `RequesterUnifiedRequestDetailDialog`, `legacyRequestToUnifiedDetail` e `v2ReadDetailToUnifiedDetail`. O problema atual e visual e de derivacao do `Historico`, nao de origem dos dados. |

**Choice:** Manter `RequesterUnifiedRequestDetailDialog` como entrypoint e introduzir uma subcamada requester-only para apresentacao do `Historico` e do shell legado.

**Rationale:**
1. Evita reabrir a arquitetura de selecao unificada, que ja esta funcionando.
2. Mantem o risco concentrado em frontend/presentation.
3. Permite comparar antes/depois em um unico arquivo orquestrador.

**Alternatives Rejected:**
| Alternative | Why Rejected |
|-------------|--------------|
| Criar uma nova familia completa de dialog sem reaproveitar o entrypoint atual | Escopo maior que o necessario e aumenta area de regressao |
| Alterar endpoints para devolver `Historico` pronto | Nao ha necessidade de backend para um ajuste puramente visual |

**Consequences:**
- Positivo: menor diff funcional e menor risco de quebrar `legacy` ou `v2`.
- Negativo: o dialog continua concentrando fetch/orquestracao e precisa de disciplina para nao voltar a acumular JSX demais.

---

### ADR-002: `Historico` bifurca fonte por origem — v2 usa `progress`, legacy usa `timeline`

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted (revised) |
| **Date** | 2026-04-17 |
| **Revised** | 2026-04-17 |
| **Context** | O legado expoe `history` derivado como `timeline` com ator, timestamp e notas. O v2 expoe `progress` com etapas estruturadas (stepName, state, isCurrent) e `timeline` com eventos granulares. O usuario quer ver apenas etapas no historico — nao o detalhamento evento-a-evento da timeline. O BRAINSTORM ja capturava essa distincao: v2 deriva de `progress`, legacy deriva de `timeline`. A versao anterior deste ADR consolidava `timeline` como base para ambos com `progress` como enriquecimento, o que contrariava a intencao original. |

**Choice:** Criar `RequesterHistoryItem[]` com estrategia bifurcada por `detail.origin`:
- Quando `origin === 'v2'`: fonte primaria e `detail.progress.items` (etapas estruturadas). Cada etapa vira um item do historico com `stepName`, `state` e `isCurrent`. Nao se usa `detail.timeline`.
- Quando `origin === 'legacy'`: fonte primaria e `detail.timeline` (eventos derivados pelo adapter legado). Cada evento vira um item com `label`, `userName`, `timestamp` e `notes`.

O resultado e ordenado do mais antigo para o mais recente em ambos os casos.

**Rationale:**
1. Para v2, `progress.items` contem exatamente o que o usuario quer ver: etapas com nome, estado e indicacao de etapa atual. A `timeline` do v2 contem eventos granulares (criacao, atribuicao, avancos individuais) que poluem a experiencia do solicitante.
2. Para legacy, `timeline` e a unica fonte confiavel — `progress` e `null` ou vazio.
3. A bifurcacao por origem fica isolada no helper de apresentacao (`build-requester-history.ts`), sem alterar adapters ou contratos upstream.
4. O BRAINSTORM (Must Have) ja definia essa separacao; a correcao alinha o DESIGN com a intencao documentada.

**Alternatives Rejected:**
| Alternative | Why Rejected |
|-------------|--------------|
| Usar `timeline` como base para ambos com `progress` como enriquecimento (decisao anterior) | Para v2, a timeline contem eventos granulares que o usuario nao quer ver; o enriquecimento com progress nao resolve o problema de excesso de itens |
| Renderizar `RequestProgress` com CSS parecendo timeline | Mantem a separacao conceitual errada e viola o requisito M3 |
| Fundir timeline e progress em um novo tipo persistido no adapter base | Aumenta churn de tipos sem necessidade; o requisito pede isolamento na apresentacao |

**Consequences:**
- Positivo: v2 mostra apenas etapas estruturadas, alinhado com a expectativa do usuario.
- Positivo: legacy continua funcionando com a timeline derivada, sem regressao.
- Positivo: alinha DESIGN com BRAINSTORM, eliminando ambiguidade sobre a fonte de dados.
- Negativo: o helper precisa de dois caminhos de codigo testados independentemente.
- Negativo: para v2, perde-se detalhamento de eventos individuais (ator, notas por evento) — mas isso e intencional.

---

### ADR-003: `RequestProgress` e `RequestTimeline` saem do requester shell; `Dados enviados` e `Anexos` passam a ser requester-owned

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-17 |
| **Context** | Os componentes de management `RequestProgress` e `RequestTimeline` materializam justamente a divisao visual que o usuario rejeitou. Ja `RequestFormData` e `RequestAttachments` tem utilidade funcional, mas o shell visual deles continua baseado em `Card`, o que conflita com a fidelidade ao legado. |

**Choice:** Remover `RequestProgress` e `RequestTimeline` do dialog requester. Substituir o uso direto de `RequestFormData` e `RequestAttachments` por componentes requester-owned que reaproveitam apenas utilitarios de formatacao e links, mas nao os wrappers visuais de `management`.

**Rationale:**
1. Elimina a ambiguidade entre `Timeline` e `Historico`.
2. Preserva reuso de logica onde ele nao conflita com a UX pedida.
3. Aproxima o layout do legado sem reconstruir blocos estaveis desnecessariamente.

**Alternatives Rejected:**
| Alternative | Why Rejected |
|-------------|--------------|
| Reusar `RequestFormData` e `RequestAttachments` com seus `Card`s atuais | Mantem uma pilha de cards modernos e reduz a fidelidade visual ao legado |
| Manter `Anexos` sempre visivel com empty state | Afasta o shell do legado e adiciona ruido visual quando nao ha anexos |

**Consequences:**
- Positivo: shell mais limpo e mais fiel a referencia.
- Negativo: o build cria mais dois componentes requester-owned, embora pequenos.

---

### ADR-004: Correcao de PT-BR e semantica ficam em componentes requester-owned

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-04-17 |
| **Context** | O modal atual tem varias strings sem acento no proprio requester (`Solicitacao`, `Nao`, `Responsavel`, `Ultima Atualizacao`). Corrigir isso em shared components de management aumentaria o raio de impacto sem necessidade. |

**Choice:** Corrigir copy e labels do modal apenas em `RequesterUnifiedRequestDetailDialog`, `RequesterRequestSummaryHeader` e no novo componente de `Historico`.

**Rationale:**
1. O requisito de texto correto e limitado ao modal do solicitante.
2. O legado de referencia ja mostra a nomenclatura final desejada.
3. Mantem a iteracao pequena e segura.

**Alternatives Rejected:**
| Alternative | Why Rejected |
|-------------|--------------|
| Corrigir copy em toda a area requester/management no mesmo build | Escopo maior que o definido |
| Deixar a correcao textual para um follow-up | O DEFINE torna isso critico para aceitacao |

**Consequences:**
- Positivo: o build fecha o requisito de PT-BR sem dispersao.
- Negativo: ainda podem restar strings sem acento fora do modal e fora deste escopo.

## 4. File Manifest

### Execution Order
| Phase | Files | Agent |
|-------|-------|-------|
| 1. Presentation contract | helper + tests do `Historico` | @react-frontend-developer |
| 2. Requester shell | dialog + summary header + history component | @react-frontend-developer |
| 3. Regression coverage | component tests do dialog/pagina | @react-frontend-developer |

### Detailed Manifest
| # | File | Action | Purpose | Agent | Depends On |
|---|------|--------|---------|-------|------------|
| 1 | `src/lib/workflows/requester/presentation/build-requester-history.ts` | Create | Derivar `RequesterHistoryItem[]` para `legacy` e `v2` em ordem cronologica ascendente a partir do contrato unificado | @react-frontend-developer | adapters atuais |
| 2 | `src/lib/workflows/requester/presentation/__tests__/build-requester-history.test.ts` | Create | Validar ordenacao, fallbacks e enrich opcional com `progress` | @react-frontend-developer | #1 |
| 3 | `src/components/workflows/requester/RequesterRequestHistory.tsx` | Create | Renderizar o bloco final `Historico` em layout inspirado no legado | @react-frontend-developer | #1 |
| 4 | `src/components/workflows/requester/RequesterRequestFormData.tsx` | Create | Renderizar `Dados enviados` em shell requester, sem `Card` de management | @react-frontend-developer | utilitarios de formatacao |
| 5 | `src/components/workflows/requester/RequesterRequestAttachments.tsx` | Create | Renderizar `Anexos` em shell requester, sem `Card` de management | @react-frontend-developer | links/shape de anexos |
| 6 | `src/components/workflows/requester/RequesterRequestSummaryHeader.tsx` | Modify | Aproximar a grade de informacoes do modal legado e corrigir PT-BR | @react-frontend-developer | - |
| 7 | `src/components/workflows/requester/RequesterUnifiedRequestDetailDialog.tsx` | Modify | Remover `RequestProgress` e `RequestTimeline`, aplicar shell legado, anexos condicionais e footer | @react-frontend-developer | #1, #3, #4, #5, #6 |
| 8 | `src/components/workflows/requester/__tests__/RequestsV2Page.test.tsx` | Modify | Cobrir abertura do dialog final com shell requester novo para item `v2` e fechamento | @react-frontend-developer | #7 |
| 9 | `src/components/workflows/requester/__tests__/RequesterUnifiedRequestDetailDialog.test.tsx` | Create | Cobrir `legacy`, `v2`, ausencia de `Timeline`, nome `Historico`, anexos e copy PT-BR | @react-frontend-developer | #7 |
| 10 | `src/lib/workflows/requester/adapters/__tests__/legacy-to-unified.test.ts` | Modify | Garantir que o detalhe legado continua fornecendo insumos suficientes para o helper novo | @react-frontend-developer | #1 |

Notas de escopo:
- `src/lib/workflows/requester/unified-types.ts` permanece sem mudanca obrigatoria.
- `src/lib/workflows/requester/adapters/v2-to-unified-detail.ts` pode precisar apenas garantir que `detail.timeline` esteja suficientemente normalizado para o helper requester; o helper nao deve depender de `detail.raw.timeline`.
- `src/components/workflows/management/RequestProgress.tsx` e `RequestTimeline.tsx` nao sao alterados; apenas deixam de ser usados no requester.
- `src/components/workflows/management/RequestFormData.tsx` e `RequestAttachments.tsx` deixam de compor o shell requester diretamente.

## 5. Code Patterns

### Pattern 1: Helper de apresentacao para o `Historico`

```ts
// src/lib/workflows/requester/presentation/build-requester-history.ts
import type { RequesterUnifiedRequestDetail } from '@/lib/workflows/requester/unified-types';

export type RequesterHistoryItem = {
  id: string;
  title: string;
  actorName?: string;
  occurredAt: Date | null;
  notesText?: string;
  stateLabel?: string;
  isCurrent: boolean;
  source: 'progress' | 'timeline';
};

export function buildRequesterHistory(
  detail: RequesterUnifiedRequestDetail,
): RequesterHistoryItem[] {
  if (detail.origin === 'v2') {
    return buildFromProgress(detail);
  }
  return buildFromTimeline(detail);
}

/** v2: etapas estruturadas de progress — sem timeline */
function buildFromProgress(
  detail: RequesterUnifiedRequestDetail,
): RequesterHistoryItem[] {
  const items = (detail.progress?.items ?? []).map((step, index) => ({
    id: `v2:${detail.detailKey}:${index}`,
    title: step.stepName || '-',
    stateLabel: step.state,
    isCurrent: step.isCurrent ?? false,
    occurredAt: step.completedAt ?? step.startedAt ?? null,
    source: 'progress' as const,
  }));

  return sortChronologically(items);
}

/** legacy: eventos derivados de timeline — sem progress */
function buildFromTimeline(
  detail: RequesterUnifiedRequestDetail,
): RequesterHistoryItem[] {
  const items = detail.timeline.map((event, index) => ({
    id: `legacy:${detail.detailKey}:${index}`,
    title: event.label || detail.summary.statusLabel || '-',
    actorName: event.userName || 'Sistema',
    occurredAt: event.timestamp,
    notesText: event.notes,
    isCurrent: false,
    source: 'timeline' as const,
  }));

  return sortChronologically(items);
}

function sortChronologically(items: RequesterHistoryItem[]): RequesterHistoryItem[] {
  return items.sort((left, right) => {
    const leftTime = left.occurredAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const rightTime = right.occurredAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return leftTime - rightTime;
  });
}
```

### Pattern 2: Componente requester-owned para o bloco final

```tsx
// src/components/workflows/requester/RequesterRequestHistory.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatManagementDate } from '@/lib/workflows/management/presentation';
import type { RequesterHistoryItem } from '@/lib/workflows/requester/presentation/build-requester-history';

type Props = {
  items: RequesterHistoryItem[];
};

export function RequesterRequestHistory({ items }: Props) {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">Histórico</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Ainda não há eventos publicados para esta solicitação.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-start gap-3 text-sm">
                <div className="flex flex-col items-center pt-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-foreground/70" />
                  {index < items.length - 1 ? <span className="mt-2 h-10 w-px bg-border" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.stateLabel ? (
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                        {item.stateLabel}
                      </span>
                    ) : null}
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.actorName} ({formatManagementDate(item.occurredAt)})
                    </p>
                  </div>
                  {item.isCurrent ? (
                    <p className="mt-1 text-xs font-medium text-foreground/80">Etapa atual</p>
                  ) : null}
                  {item.notesText ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                      {item.notesText}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Pattern 3: Shell final do dialog requester

```tsx
// src/components/workflows/requester/RequesterUnifiedRequestDetailDialog.tsx
const historyItems = React.useMemo(() => {
  if (!unifiedDetail) return [];
  return buildRequesterHistory(unifiedDetail);
}, [unifiedDetail]);

{unifiedDetail ? (
  <>
    <RequesterRequestSummaryHeader
      requesterName={unifiedDetail.summary.requesterName}
      submittedAt={unifiedDetail.summary.submittedAt}
      workflowName={unifiedDetail.summary.workflowName}
      lastUpdatedAt={unifiedDetail.summary.lastUpdatedAt}
      responsibleName={unifiedDetail.summary.responsibleName}
      openedInLabel={unifiedDetail.summary.openedInLabel}
    />
    <RequesterRequestFormData fields={unifiedDetail.fields} />
    {unifiedDetail.attachments.length > 0 ? (
      <RequesterRequestAttachments attachments={unifiedDetail.attachments} />
    ) : null}
    <RequesterRequestHistory items={historyItems} />
  </>
) : null}

<DialogFooter className="px-6 pb-6 pt-2">
  <DialogClose asChild>
    <Button variant="outline">Fechar</Button>
  </DialogClose>
</DialogFooter>
```

## 6. API Contract

Nenhum endpoint novo ou alterado.

O build continua consumindo:
- `GET /api/workflows/read/requests/[requestId]` para detalhe `v2`
- detalhe `legacy` ja resolvido a partir da selecao existente no cliente

## 7. Database Schema

Nenhuma mudanca no schema.

Sem impacto em:
- Firestore collections
- Firestore Rules
- Storage Rules
- Cloud Functions

## 8. Testing Strategy

### Unit Tests
| Component | Test |
|-----------|------|
| `build-requester-history.ts` (v2) | para `origin === 'v2'`, extrai itens exclusivamente de `detail.progress.items` — nao consome `detail.timeline` |
| `build-requester-history.ts` (v2) | cada item v2 tem `title` derivado de `stepName`, `stateLabel` derivado de `state` e `isCurrent` do progress |
| `build-requester-history.ts` (v2) | ordena etapas v2 cronologicamente ascendente por `completedAt`/`startedAt` |
| `build-requester-history.ts` (v2) | nao quebra quando `progress` esta vazio ou `items` e `[]` |
| `build-requester-history.ts` (legacy) | para `origin === 'legacy'`, extrai itens exclusivamente de `detail.timeline` — nao consome `detail.progress` |
| `build-requester-history.ts` (legacy) | cada item legacy tem `title` derivado de `label`, `actorName` de `userName` e `occurredAt` de `timestamp` |
| `build-requester-history.ts` (legacy) | ordena eventos legacy do mais antigo para o mais recente, mesmo quando o adapter entregar timeline descendente |
| `build-requester-history.ts` (legacy) | nao quebra quando `timestamp`, `notes` ou `userName` estiverem ausentes |
| `legacy-to-unified-detail.ts` | continua entregando `timeline`, `attachments` e `fields` esperados pelo shell requester |

### Component Tests
| Flow | Test |
|------|------|
| Dialog `v2` | renderiza titulo, descricao, grade de informacoes, `Dados enviados`, `Historico` com etapas de progress, footer `Fechar` |
| Dialog `v2` historico | exibe `stepName` e `stateLabel` de cada etapa; nao exibe eventos de timeline |
| Dialog `legacy` | renderiza o mesmo shell visual e usa o mesmo titulo `Historico` com eventos de timeline |
| Dialog `legacy` historico | exibe `label`, `userName` e `timestamp` de cada evento; nao exibe campos de progress |
| Ausencia de blocos antigos | `queryByText('Timeline')` e `queryByText('Progresso')` retornam `null` |
| Historico v2 etapa atual | renderiza `Etapa atual` quando `isCurrent = true` no item de progress |
| PT-BR | assert explicito para `Solicitação`, `Histórico`, `Responsável`, `Última atualização`, `Não foi possível...` |
| Anexos | renderiza secao apenas quando houver anexos; nao oculta anexos validos por fidelidade ao legado |
| Acessibilidade | `DialogDescription` continua presente e o botao `Fechar` fecha o dialog |
| Erro `v2` | erro bloqueante continua aparecendo sem renderizar corpo inconsistente |

### Regression Tests
| File | Focus |
|------|-------|
| `RequestsV2Page.test.tsx` | abertura do dialog a partir da lista continua funcional com item `v2` |
| `RequesterUnifiedRequestDetailDialog.test.tsx` | fixtures `legacy` e `v2` validam shell unico |
| `build-requester-history.test.ts` | ordem cronologica e fallback de matching protegem a logica mais sensivel |

### Acceptance Tests

```gherkin
GIVEN um item v2 aberto a partir de "Minhas Solicitações"
WHEN o solicitante abre o dialog
THEN ele ve um unico shell read-only com "Dados enviados" e "Histórico"
AND o "Histórico" exibe apenas as etapas estruturadas de progress (stepName, state)
AND nao ve blocos separados chamados "Timeline" ou "Progresso"
AND nao ve eventos granulares da timeline do v2

GIVEN um item legacy aberto na mesma lista
WHEN o dialog e exibido
THEN a hierarquia visual principal e a mesma do item v2
AND o "Histórico" exibe eventos derivados da timeline legada (label, userName, timestamp)
AND o historico aparece do evento mais antigo para o mais recente

GIVEN um item com anexos
WHEN o dialog abre
THEN a secao de anexos aparece antes do "Histórico"
AND os links continuam acessiveis em nova aba
```

## 9. Rollback Plan

| Step | Action | Verification |
|------|--------|--------------|
| 1 | Reverter `RequesterUnifiedRequestDetailDialog.tsx` para a composicao anterior com `RequestProgress` e `RequestTimeline` | O dialog volta a exibir `Progresso` e `Timeline` separados |
| 2 | Remover `RequesterRequestHistory.tsx` e `build-requester-history.ts` | O build compila sem referencias a esses arquivos |
| 3 | Restaurar testes ajustados para o shell antigo ou remover os novos asserts de `Historico` | Suite requester volta ao baseline anterior |

**Metodo rapido:** `git revert <commit-do-build>`

## 10. Implementation Checklist

### Pre-Build
- [x] DEFINE aprovado e com escopo fechado
- [x] Shell visual alvo confirmado como referencia do legado
- [x] Contrato derivado do `Historico` documentado com fallbacks
- [x] Manifesto de arquivos fechado sem backend
- [x] Estrategia de testes para `legacy` + `v2` definida

### Post-Build
- [ ] `RequesterUnifiedRequestDetailDialog` nao importa mais `RequestProgress` nem `RequestTimeline`
- [ ] O titulo final da secao e `Histórico`
- [ ] O modal nao contem `Timeline` nem `Progresso` como blocos independentes
- [ ] O shell final tem footer com `Fechar`
- [ ] Itens `legacy` e `v2` passam pela mesma experiencia visual principal
- [ ] Para v2, o historico exibe apenas etapas de `progress` — nao consome `timeline`
- [ ] Para legacy, o historico exibe eventos de `timeline` — nao consome `progress`
- [ ] Copias principais do modal estao em PT-BR correto
- [ ] Testes do helper cobrem ambos os caminhos (v2/progress e legacy/timeline) independentemente
- [ ] Testes do dialog passaram

## 11. Specialist Instructions

### For @react-frontend-developer
```markdown
Files to modify/create:
- src/lib/workflows/requester/presentation/build-requester-history.ts
- src/lib/workflows/requester/presentation/__tests__/build-requester-history.test.ts
- src/components/workflows/requester/RequesterRequestHistory.tsx
- src/components/workflows/requester/RequesterRequestSummaryHeader.tsx
- src/components/workflows/requester/RequesterUnifiedRequestDetailDialog.tsx
- src/components/workflows/requester/__tests__/RequesterUnifiedRequestDetailDialog.test.tsx
- src/components/workflows/requester/__tests__/RequestsV2Page.test.tsx
- src/lib/workflows/requester/adapters/__tests__/legacy-to-unified.test.ts

Key requirements:
- Nao alterar endpoint, hook ou contrato backend.
- Nao reutilizar `RequestTimeline` nem `RequestProgress` no requester final.
- Ordenar `Historico` do mais antigo para o mais recente.
- Manter anexos visiveis quando existirem.
- Corrigir copy do modal para PT-BR com acentuacao.
- Garantir que `legacy` e `v2` usem o mesmo shell visual principal.
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-17 | Codex | Initial design based on DEFINE_AJUSTE_MODAL_SOLICITANTE_FINAL_SOLICITACOES.md |
| 1.1 | 2026-04-17 | iterate-agent | Corrige ADR-002: substitui decisao "timeline como base + progress como enriquecimento" por bifurcacao correta por origem — v2 usa `progress.items` como fonte exclusiva, legacy usa `timeline`. Atualiza Presentation Contract Delta com duas tabelas por estrategia, Pattern 1 com codigo bifurcado por `detail.origin`, Testing Strategy com cenarios independentes por origem, Acceptance Tests e Implementation Checklist. Alinha DESIGN com distincao ja documentada no BRAINSTORM |
