import type { CurrentQueueFilter, TimestampLike, WorkflowManagementFilters, WorkflowReadSlaState, WorkflowReadSummary } from './types';

type WorkflowReadPeriodField = 'closedAt' | 'submittedAt';

type ApplyOfficialReadFiltersOptions = {
  periodField: WorkflowReadPeriodField;
};

type TimestampObject = {
  seconds?: unknown;
  nanoseconds?: unknown;
  _seconds?: unknown;
  _nanoseconds?: unknown;
  toDate?: () => Date;
};

export class ReadValidationError extends Error {
  code: string;
  httpStatus: number;

  constructor(code: string, message: string, httpStatus = 400) {
    super(message);
    this.name = 'ReadValidationError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

function buildDateFromParts(seconds: number, nanoseconds: number): Date | null {
  if (!Number.isFinite(seconds) || !Number.isFinite(nanoseconds)) {
    return null;
  }

  const value = new Date(seconds * 1000 + nanoseconds / 1_000_000);
  return Number.isNaN(value.getTime()) ? null : value;
}

export function normalizeReadTimestamp(input: TimestampLike | Date | string | number | undefined): Date | null {
  if (!input) {
    return null;
  }

  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }

  if (typeof input === 'string' || typeof input === 'number') {
    const value = new Date(input);
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof input === 'object') {
    const timestamp = input as TimestampObject;

    if (typeof timestamp.toDate === 'function') {
      const value = timestamp.toDate();
      return Number.isNaN(value.getTime()) ? null : value;
    }

    const seconds =
      typeof timestamp.seconds === 'number'
        ? timestamp.seconds
        : typeof timestamp._seconds === 'number'
          ? timestamp._seconds
          : null;
    const nanoseconds =
      typeof timestamp.nanoseconds === 'number'
        ? timestamp.nanoseconds
        : typeof timestamp._nanoseconds === 'number'
          ? timestamp._nanoseconds
          : 0;

    if (seconds !== null) {
      return buildDateFromParts(seconds, nanoseconds);
    }
  }

  return null;
}

function parsePositiveInteger(value: string | null, fieldName: string): number | undefined {
  if (!value) {
    return undefined;
  }

  if (!/^\d+$/.test(value)) {
    throw new ReadValidationError(
      'INVALID_FILTER',
      `${fieldName} deve ser um inteiro positivo.`,
    );
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ReadValidationError(
      'INVALID_FILTER',
      `${fieldName} deve ser um inteiro positivo.`,
    );
  }

  return parsed;
}

function parseOptionalString(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function parseDateOnly(value: string | null, fieldName: string): string | undefined {
  if (!value) {
    return undefined;
  }

  if (!isValidDateOnly(value)) {
    throw new ReadValidationError(
      'INVALID_FILTER',
      `${fieldName} deve usar o formato YYYY-MM-DD.`,
    );
  }

  return value;
}

export function parseWorkflowReadSlaState(value: string | null): WorkflowReadSlaState | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (normalized === 'on_time') {
    return 'on_track';
  }

  if (normalized === 'on_track' || normalized === 'at_risk' || normalized === 'overdue') {
    return normalized;
  }

  throw new ReadValidationError(
    'INVALID_FILTER',
    `slaState invalido: ${value}.`,
  );
}

export function parseWorkflowManagementFilters(
  searchParams: URLSearchParams,
): WorkflowManagementFilters {
  const filters: WorkflowManagementFilters = {
    requestId: parsePositiveInteger(searchParams.get('requestId'), 'requestId'),
    workflowTypeId: parseOptionalString(searchParams.get('workflowTypeId')),
    areaId: parseOptionalString(searchParams.get('areaId')),
    requesterQuery: parseOptionalString(searchParams.get('requesterQuery')),
    slaState: parseWorkflowReadSlaState(searchParams.get('slaState')),
    periodFrom: parseDateOnly(searchParams.get('periodFrom'), 'periodFrom'),
    periodTo: parseDateOnly(searchParams.get('periodTo'), 'periodTo'),
  };

  if (filters.periodFrom && filters.periodTo && filters.periodFrom > filters.periodTo) {
    throw new ReadValidationError(
      'INVALID_FILTER',
      'periodFrom nao pode ser maior que periodTo.',
    );
  }

  return filters;
}

function getPeriodBoundary(value: string, boundary: 'start' | 'end'): Date {
  const suffix = boundary === 'start' ? 'T00:00:00.000Z' : 'T23:59:59.999Z';
  return new Date(`${value}${suffix}`);
}

export function computeWorkflowReadSlaState(
  item: Pick<WorkflowReadSummary, 'expectedCompletionAt' | 'submittedAt' | 'statusCategory'>,
  now = new Date(),
): WorkflowReadSlaState {
  if (item.statusCategory === 'finalized' || item.statusCategory === 'archived') {
    return 'on_track';
  }

  const expectedCompletionAt = normalizeReadTimestamp(item.expectedCompletionAt);
  const submittedAt = normalizeReadTimestamp(item.submittedAt);

  if (!expectedCompletionAt || !submittedAt) {
    return 'on_track';
  }

  const nowTime = now.getTime();
  const dueTime = expectedCompletionAt.getTime();

  if (nowTime >= dueTime) {
    return 'overdue';
  }

  const totalDuration = dueTime - submittedAt.getTime();
  if (totalDuration <= 0) {
    return 'on_track';
  }

  const remainingRatio = (dueTime - nowTime) / totalDuration;

  // The design leaves the exact threshold open; 25% remaining keeps the rule deterministic.
  if (remainingRatio <= 0.25) {
    return 'at_risk';
  }

  return 'on_track';
}

export function enrichWorkflowReadSummaryWithSlaState(
  item: WorkflowReadSummary,
  now = new Date(),
): WorkflowReadSummary {
  return {
    ...item,
    slaState: computeWorkflowReadSlaState(item, now),
  };
}

function matchesRequesterQuery(item: WorkflowReadSummary, requesterQuery?: string): boolean {
  if (!requesterQuery) {
    return true;
  }

  const requesterName = item.requesterName?.trim().toLowerCase() ?? '';
  return requesterName.includes(requesterQuery.trim().toLowerCase());
}

function matchesPeriod(
  item: WorkflowReadSummary,
  options: ApplyOfficialReadFiltersOptions,
  filters: WorkflowManagementFilters,
): boolean {
  if (!filters.periodFrom && !filters.periodTo) {
    return true;
  }

  const value = normalizeReadTimestamp(item[options.periodField]);
  if (!value) {
    return false;
  }

  if (filters.periodFrom) {
    const start = getPeriodBoundary(filters.periodFrom, 'start');
    if (value < start) {
      return false;
    }
  }

  if (filters.periodTo) {
    const end = getPeriodBoundary(filters.periodTo, 'end');
    if (value > end) {
      return false;
    }
  }

  return true;
}

export function applyOfficialReadFilters(
  items: WorkflowReadSummary[],
  filters: WorkflowManagementFilters,
  options: ApplyOfficialReadFiltersOptions,
  now = new Date(),
): WorkflowReadSummary[] {
  return items
    .map((item) => (item.slaState ? item : enrichWorkflowReadSummaryWithSlaState(item, now)))
    .filter((item) => {
      if (filters.workflowTypeId && item.workflowTypeId !== filters.workflowTypeId) {
        return false;
      }

      if (filters.areaId && item.areaId !== filters.areaId) {
        return false;
      }

      if (!matchesRequesterQuery(item, filters.requesterQuery)) {
        return false;
      }

      if (filters.slaState && item.slaState !== filters.slaState) {
        return false;
      }

      return matchesPeriod(item, options, filters);
    });
}

export function omitRequestIdFilter(filters: WorkflowManagementFilters): WorkflowManagementFilters {
  const { requestId: _requestId, ...nextFilters } = filters;
  return nextFilters;
}

export function isWorkflowInCurrentQueueScope(
  item: WorkflowReadSummary,
  actorUserId: string,
  filter: CurrentQueueFilter,
): boolean {
  if (item.ownerUserId !== actorUserId || item.isArchived) {
    return false;
  }

  if (item.statusCategory !== 'open' && item.statusCategory !== 'in_progress' && item.statusCategory !== 'waiting_action') {
    return false;
  }

  if (filter === 'waiting_assignment') {
    return item.statusCategory === 'open';
  }

  if (filter === 'in_progress') {
    return item.statusCategory === 'in_progress';
  }

  if (filter === 'waiting_action') {
    return item.statusCategory === 'waiting_action';
  }

  return true;
}

export function isWorkflowAssignedToActor(
  item: WorkflowReadSummary,
  actorUserId: string,
): boolean {
  if (item.responsibleUserId !== actorUserId || item.isArchived) {
    return false;
  }

  return item.statusCategory === 'open' || item.statusCategory === 'in_progress' || item.statusCategory === 'waiting_action';
}

export function isWorkflowPendingActionForActor(
  item: WorkflowReadSummary,
  actorUserId: string,
): boolean {
  if (item.isArchived || item.statusCategory !== 'waiting_action') {
    return false;
  }

  return item.pendingActionRecipientIds.includes(actorUserId);
}

export function isWorkflowInCompletedScope(
  item: WorkflowReadSummary,
  actorUserId: string,
): boolean {
  if (item.statusCategory !== 'finalized' && item.statusCategory !== 'archived') {
    return false;
  }

  return item.operationalParticipantIds.includes(actorUserId);
}
