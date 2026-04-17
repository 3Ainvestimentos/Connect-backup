import type { WorkflowRequest, WorkflowHistoryLog } from '@/contexts/WorkflowsContext';
import type { WorkflowDefinition } from '@/contexts/ApplicationsContext';
import type { RequesterUnifiedRequestDetailTimelineItem } from '../unified-types';

/**
 * Converte `request.history` + definicao em timeline unificada.
 * Ordena por timestamp descendente e resolve labels via `definition.statuses`.
 */
export function deriveLegacyTimeline(
  request: Pick<WorkflowRequest, 'history'>,
  definition: Pick<WorkflowDefinition, 'statuses'> | null | undefined,
): RequesterUnifiedRequestDetailTimelineItem[] {
  const history = request.history ?? [];
  if (history.length === 0) return [];

  return history
    .slice()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .map((log: WorkflowHistoryLog) => {
      const statusDef = definition?.statuses?.find((s) => s.id === log.status);
      const label = statusDef?.label ?? log.status ?? '-';
      const timestamp = log.timestamp ? new Date(log.timestamp) : null;
      // Valida se a date e valida
      const normalizedTimestamp = timestamp && Number.isNaN(timestamp.getTime()) ? null : timestamp;

      return {
        action: null,
        details: null,
        label,
        timestamp: normalizedTimestamp,
        userName: log.userName,
        notes: log.notes,
      };
    });
}
