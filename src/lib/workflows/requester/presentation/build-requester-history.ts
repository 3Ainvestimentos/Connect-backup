import { getManagementProgressStateLabel } from '@/lib/workflows/management/presentation';
import type { RequesterUnifiedRequestDetail } from '../unified-types';

export type RequesterHistoryItem = {
  id: string;
  title: string;
  stateLabel?: string;
  actorName?: string;
  notesText?: string;
  occurredAt: Date | null;
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

export function buildRequesterHistory(
  detail: RequesterUnifiedRequestDetail,
): RequesterHistoryItem[] {
  if (detail.origin === 'v2') {
    const progressItems = detail.progress?.items ?? [];

    return [...progressItems]
      .map((item, index) => ({
        id: `v2:${detail.detailKey}:${item.stepId}:${index}`,
        title: item.stepName?.trim() || '-',
        stateLabel: getManagementProgressStateLabel(item.state),
        occurredAt: null,
        isCurrent: item.isCurrent,
        source: 'progress' as const,
        sortOrder: item.order ?? index,
      }))
      .sort(compareHistoryItems);
  }

  return detail.timeline
    .map((item, index) => ({
      id: `legacy:${detail.detailKey}:${index}`,
      title: item.label?.trim() || detail.summary.statusLabel || '-',
      actorName: item.userName?.trim() || 'Sistema',
      notesText: item.notes,
      occurredAt: item.timestamp,
      isCurrent: false,
      source: 'timeline' as const,
      sortOrder: index,
    }))
    .sort(compareHistoryItems);
}
