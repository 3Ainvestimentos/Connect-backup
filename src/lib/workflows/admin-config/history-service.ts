import { RuntimeError, RuntimeErrorCode } from '@/lib/workflows/runtime/errors';
import { listWorkflowConfigAreas, listWorkflowConfigOwners } from './lookups';
import { getAdminLegacyHistoryDetail, loadLegacyHistoryItems } from './history-legacy';
import {
  ADMIN_HISTORY_STATUS_CATEGORIES,
  type AdminHistoryDetailData,
  type AdminHistoryFilterOptions,
  type AdminHistoryFilters,
  type AdminHistoryListData,
  type AdminHistoryOrigin,
  type AdminHistorySummary,
} from './history-types';
import { getAdminV2HistoryDetail, loadV2HistoryItems } from './history-v2';

type HistoryLookupContext = {
  areaLabelsById: Map<string, string>;
  ownerUserIdsByEmail: Map<string, string>;
  ownerLabelsByUserId: Map<string, string>;
};

function buildLookupContext(input: {
  areas: Awaited<ReturnType<typeof listWorkflowConfigAreas>>;
  owners: Awaited<ReturnType<typeof listWorkflowConfigOwners>>;
}): HistoryLookupContext {
  return {
    areaLabelsById: new Map(input.areas.map((area) => [area.areaId, area.name])),
    ownerUserIdsByEmail: new Map(
      input.owners
        .filter((owner) => owner.email)
        .map((owner) => [owner.email.trim().toLowerCase(), owner.userId]),
    ),
    ownerLabelsByUserId: new Map(
      input.owners.map((owner) => [owner.userId, owner.name || owner.email || owner.userId]),
    ),
  };
}

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

function getSortTimestamp(value: string | null): number {
  return value ? new Date(value).getTime() || 0 : 0;
}

function matchesQuery(item: AdminHistorySummary, query?: string): boolean {
  if (!query) {
    return true;
  }

  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) {
    return true;
  }

  return [
    item.requestIdLabel,
    item.workflowLabel,
    item.workflowTypeId,
    item.requesterLabel,
    item.ownerLabel,
    item.responsibleLabel,
  ].some((value) => typeof value === 'string' && normalizeSearch(value).includes(normalizedQuery));
}

function withinPeriod(item: AdminHistorySummary, filters: AdminHistoryFilters): boolean {
  if (!filters.periodFrom && !filters.periodTo) {
    return true;
  }

  const reference = item.periodReferenceAt ?? item.submittedAt ?? item.lastUpdatedAt;
  if (!reference) {
    return false;
  }

  const dateOnly = reference.slice(0, 10);

  if (filters.periodFrom && dateOnly < filters.periodFrom) {
    return false;
  }

  if (filters.periodTo && dateOnly > filters.periodTo) {
    return false;
  }

  return true;
}

export function applyAdminHistoryFilters(
  items: AdminHistorySummary[],
  filters: AdminHistoryFilters,
): AdminHistorySummary[] {
  return items.filter((item) => {
    if (filters.origin && item.origin !== filters.origin) {
      return false;
    }

    if (filters.areaId && item.areaId !== filters.areaId) {
      return false;
    }

    if (filters.workflowTypeId && item.workflowTypeId !== filters.workflowTypeId) {
      return false;
    }

    if (filters.statusCategory && item.statusCategory !== filters.statusCategory) {
      return false;
    }

    if (filters.ownerUserId && item.ownerUserId !== filters.ownerUserId) {
      return false;
    }

    if (!withinPeriod(item, filters)) {
      return false;
    }

    return matchesQuery(item, filters.query);
  });
}

export function sortAdminHistoryItems(items: AdminHistorySummary[]): AdminHistorySummary[] {
  return [...items].sort((left, right) => {
    const periodDiff =
      getSortTimestamp(right.periodReferenceAt) - getSortTimestamp(left.periodReferenceAt);

    if (periodDiff !== 0) {
      return periodDiff;
    }

    return getSortTimestamp(right.lastUpdatedAt) - getSortTimestamp(left.lastUpdatedAt);
  });
}

function uniqOptions(
  values: Array<{ value: string | null | undefined; label: string | null | undefined }>,
) {
  const entries = new Map<string, string>();

  values.forEach((entry) => {
    const value = entry.value?.trim();
    const label = entry.label?.trim();

    if (!value || !label || entries.has(value)) {
      return;
    }

    entries.set(value, label);
  });

  return Array.from(entries.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

export function buildAdminHistoryFilterOptions(items: AdminHistorySummary[]): AdminHistoryFilterOptions {
  return {
    origins: ['legacy', 'v2'],
    areas: uniqOptions(items.map((item) => ({ value: item.areaId, label: item.areaLabel }))),
    workflows: uniqOptions(
      items.map((item) => ({ value: item.workflowTypeId, label: item.workflowLabel })),
    ),
    owners: uniqOptions(items.map((item) => ({ value: item.ownerUserId, label: item.ownerLabel }))),
    statusCategories: [...ADMIN_HISTORY_STATUS_CATEGORIES],
  };
}

async function loadHistoryLookupContext(): Promise<HistoryLookupContext> {
  const [areas, owners] = await Promise.all([listWorkflowConfigAreas(), listWorkflowConfigOwners()]);
  return buildLookupContext({ areas, owners });
}

export async function getAdminHistory(filters: AdminHistoryFilters = {}): Promise<AdminHistoryListData> {
  const context = await loadHistoryLookupContext();

  const sourceResults = await Promise.allSettled([
    loadV2HistoryItems(context),
    loadLegacyHistoryItems(context),
  ]);

  const partialSources: AdminHistoryOrigin[] = [];
  const mergedItems: AdminHistorySummary[] = [];

  if (sourceResults[0].status === 'fulfilled') {
    mergedItems.push(...sourceResults[0].value);
  } else {
    partialSources.push('v2');
  }

  if (sourceResults[1].status === 'fulfilled') {
    mergedItems.push(...sourceResults[1].value);
  } else {
    partialSources.push('legacy');
  }

  if (partialSources.length === 2) {
    throw new Error('No history source available.');
  }

  const filtered = sortAdminHistoryItems(applyAdminHistoryFilters(mergedItems, filters));
  const limit = typeof filters.limit === 'number' ? filters.limit : 50;

  return {
    items: filtered.slice(0, limit),
    filterOptions: buildAdminHistoryFilterOptions(mergedItems),
    partialSources,
    totalVisible: filtered.length,
  };
}

export async function getAdminHistoryDetail(
  origin: AdminHistoryOrigin,
  requestKey: string,
): Promise<AdminHistoryDetailData> {
  const context = await loadHistoryLookupContext();

  if (origin === 'v2') {
    const requestId = Number(requestKey);

    if (!Number.isInteger(requestId) || requestId < 1) {
      throw new RuntimeError(RuntimeErrorCode.INVALID_DRAFT_PAYLOAD, 'requestKey v2 invalido.', 422);
    }

    return getAdminV2HistoryDetail(requestId, context);
  }

  if (origin === 'legacy') {
    return getAdminLegacyHistoryDetail(requestKey, context);
  }

  throw new RuntimeError(RuntimeErrorCode.INVALID_DRAFT_PAYLOAD, 'origin invalido.', 422);
}
