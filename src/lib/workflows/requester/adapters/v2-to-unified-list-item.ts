import type { WorkflowReadSummary } from '@/lib/workflows/read/types';
import { normalizeReadTimestamp } from '@/lib/workflows/read/filters';
import type { RequesterUnifiedV2ListItem } from '../unified-types';

/**
 * Converte um `WorkflowReadSummary` v2 em `RequesterUnifiedV2ListItem`.
 * Usa `statusCategory` e `currentStepName` para presentation.
 */
export function v2ReadSummaryToUnifiedListItem(
  summary: WorkflowReadSummary,
): RequesterUnifiedV2ListItem {
  const fallbackLabel =
    summary.statusCategory === 'archived'
      ? 'Arquivado'
      : summary.statusCategory === 'finalized'
        ? 'Concluido'
        : summary.statusCategory === 'waiting_action'
          ? 'Aguardando acao'
          : summary.statusCategory === 'open' && !summary.hasResponsible
            ? 'Aguardando atribuicao'
            : 'Em andamento';

  const statusLabel = summary.currentStepName?.trim() || fallbackLabel;

  const statusVariant =
    summary.statusCategory === 'archived'
      ? 'outline'
      : summary.statusCategory === 'finalized'
        ? 'secondary'
        : summary.statusCategory === 'open' && !summary.hasResponsible
          ? 'destructive'
          : 'default';

  const expectedCompletionAt = summary.expectedCompletionAt
    ? normalizeReadTimestamp(summary.expectedCompletionAt)
    : null;

  const expectedCompletionLabel = expectedCompletionAt
    ? expectedCompletionAt.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '-';

  return {
    origin: 'v2',
    detailKey: `v2:${summary.requestId}`,
    requestId: summary.requestId,
    displayRequestId: String(summary.requestId),
    workflowName: summary.workflowName ?? summary.workflowTypeId ?? '-',
    statusLabel,
    statusVariant,
    expectedCompletionAt,
    expectedCompletionLabel,
    submittedAt: summary.submittedAt
      ? normalizeReadTimestamp(summary.submittedAt)
      : null,
    lastUpdatedAt: summary.lastUpdatedAt
      ? normalizeReadTimestamp(summary.lastUpdatedAt)
      : null,
    raw: summary,
  };
}
