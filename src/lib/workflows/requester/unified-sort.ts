import type { RequesterUnifiedRequestListItem } from './unified-types';

function toMs(date: Date | null): number {
  return date ? date.getTime() : 0;
}

/**
 * Ordenacao deterministica:
 *  1. lastUpdatedAt desc
 *  2. submittedAt desc
 *  3. origin (v2 antes de legacy)
 *  4. detailKey ascendente
 */
export function compareUnifiedListItems(
  a: RequesterUnifiedRequestListItem,
  b: RequesterUnifiedRequestListItem,
): number {
  const byUpdated = toMs(b.lastUpdatedAt) - toMs(a.lastUpdatedAt);
  if (byUpdated !== 0) return byUpdated;

  const bySubmitted = toMs(b.submittedAt) - toMs(a.submittedAt);
  if (bySubmitted !== 0) return bySubmitted;

  const originRank = (o: 'legacy' | 'v2') => (o === 'v2' ? 0 : 1);
  const byOrigin = originRank(a.origin) - originRank(b.origin);
  if (byOrigin !== 0) return byOrigin;

  return a.detailKey.localeCompare(b.detailKey);
}
