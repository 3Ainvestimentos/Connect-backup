import { getManagementProgressStateLabel } from '@/lib/workflows/management/presentation';
import type { RequesterUnifiedRequestDetail } from '../unified-types';

export type RequesterHistoryItem = {
  id: string;
  title: string;
  stateLabel?: string;
  actorName?: string;
  notesText?: string;
  occurredAt: Date | null;
  dateVisibility: 'always' | 'only-when-present';
  isCurrent: boolean;
  source: 'progress' | 'timeline';
  sortOrder: number;
};

function compareHistoryItems(left: RequesterHistoryItem, right: RequesterHistoryItem): number {
  const leftTimestamp = left.occurredAt?.getTime() ?? null;
  const rightTimestamp = right.occurredAt?.getTime() ?? null;

  if (leftTimestamp !== null && rightTimestamp !== null && leftTimestamp !== rightTimestamp) {
    return leftTimestamp - rightTimestamp;
  }

  if (leftTimestamp !== null && rightTimestamp === null) {
    return -1;
  }

  if (leftTimestamp === null && rightTimestamp !== null) {
    return 1;
  }

  return left.sortOrder - right.sortOrder;
}

function buildCompletedAtByStepId(detail: RequesterUnifiedRequestDetail): Map<string, Date> {
  if (detail.origin !== 'v2') {
    return new Map();
  }

  const completedAtByStepId = new Map<string, Date>();

  for (const item of detail.timeline) {
    if (item.action !== 'step_completed' || !item.timestamp) {
      continue;
    }

    const stepId = item.details?.stepId;
    if (typeof stepId !== 'string' || !stepId.trim()) {
      continue;
    }

    const current = completedAtByStepId.get(stepId);
    if (!current || current.getTime() < item.timestamp.getTime()) {
      completedAtByStepId.set(stepId, item.timestamp);
    }
  }

  return completedAtByStepId;
}

export function buildRequesterHistory(
  detail: RequesterUnifiedRequestDetail,
): RequesterHistoryItem[] {
  if (detail.origin === 'v2') {
    const progressItems = detail.progress?.items ?? [];
    const completedAtByStepId = buildCompletedAtByStepId(detail);

    return [...progressItems]
      .map((item, index) => ({
        id: `v2:${detail.detailKey}:${item.stepId}:${index}`,
        title: item.stepName?.trim() || '-',
        stateLabel: getManagementProgressStateLabel(item.state),
        occurredAt:
          item.state === 'completed'
            ? completedAtByStepId.get(item.stepId) ?? null
            : null,
        dateVisibility: 'only-when-present' as const,
        isCurrent: item.isCurrent,
        source: 'progress' as const,
        sortOrder: item.order ?? index,
      }))
      .sort((left, right) => left.sortOrder - right.sortOrder);
  }

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
