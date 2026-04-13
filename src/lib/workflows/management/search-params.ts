import {
  MANAGEMENT_DEFAULT_ASSIGNMENTS_SUBTAB,
  MANAGEMENT_DEFAULT_CURRENT_FILTER,
  MANAGEMENT_DEFAULT_TAB,
} from './constants';
import type {
  ManagementAssignmentsSubtab,
  ManagementCurrentQueueFilter,
  ManagementSlaState,
  ManagementTabId,
  WorkflowManagementFilters,
  WorkflowManagementViewState,
} from './types';

type SearchParamsReader = Pick<URLSearchParams, 'get'>;

function parseTab(value: string | null): ManagementTabId {
  if (value === 'current' || value === 'assignments' || value === 'completed') {
    return value;
  }

  return MANAGEMENT_DEFAULT_TAB;
}

function parseAssignmentsSubtab(value: string | null): ManagementAssignmentsSubtab {
  if (value === 'assigned' || value === 'pending') {
    return value;
  }

  return MANAGEMENT_DEFAULT_ASSIGNMENTS_SUBTAB;
}

function parseCurrentQueueFilter(value: string | null): ManagementCurrentQueueFilter {
  if (
    value === 'all' ||
    value === 'waiting_assignment' ||
    value === 'in_progress' ||
    value === 'waiting_action'
  ) {
    return value;
  }

  return MANAGEMENT_DEFAULT_CURRENT_FILTER;
}

function parsePositiveInteger(value: string | null): number | undefined {
  if (!value || !/^\d+$/.test(value)) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function parseOptionalString(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function parseSlaState(value: string | null): ManagementSlaState | undefined {
  if (value === 'on_track' || value === 'at_risk' || value === 'overdue') {
    return value;
  }

  return undefined;
}

function appendIfPresent(params: URLSearchParams, key: string, value: string | number | undefined) {
  if (value === undefined || value === '') {
    return;
  }

  params.set(key, String(value));
}

export function parseManagementSearchParams(
  params: SearchParamsReader,
): WorkflowManagementViewState {
  return {
    activeTab: parseTab(params.get('tab')),
    assignmentsSubtab: parseAssignmentsSubtab(params.get('subtab')),
    currentFilter: parseCurrentQueueFilter(params.get('queue')),
    filters: {
      requestId: parsePositiveInteger(params.get('requestId')),
      workflowTypeId: parseOptionalString(params.get('workflow')),
      areaId: parseOptionalString(params.get('area')),
      requesterQuery: parseOptionalString(params.get('requester')),
      slaState: parseSlaState(params.get('sla')),
      periodFrom: parseOptionalString(params.get('from')),
      periodTo: parseOptionalString(params.get('to')),
    },
  };
}

export function serializeManagementSearchParams(
  state: WorkflowManagementViewState,
): URLSearchParams {
  const params = new URLSearchParams();

  if (state.activeTab !== MANAGEMENT_DEFAULT_TAB) {
    params.set('tab', state.activeTab);
  }

  if (state.assignmentsSubtab !== MANAGEMENT_DEFAULT_ASSIGNMENTS_SUBTAB) {
    params.set('subtab', state.assignmentsSubtab);
  }

  if (state.currentFilter !== MANAGEMENT_DEFAULT_CURRENT_FILTER) {
    params.set('queue', state.currentFilter);
  }

  appendIfPresent(params, 'requestId', state.filters.requestId);
  appendIfPresent(params, 'workflow', state.filters.workflowTypeId);
  appendIfPresent(params, 'area', state.filters.areaId);
  appendIfPresent(params, 'requester', state.filters.requesterQuery);
  appendIfPresent(params, 'sla', state.filters.slaState);
  appendIfPresent(params, 'from', state.filters.periodFrom);
  appendIfPresent(params, 'to', state.filters.periodTo);

  return params;
}

export function buildManagementViewState(
  currentState: WorkflowManagementViewState,
  updates: Partial<WorkflowManagementViewState> & {
    filters?: WorkflowManagementFilters;
  },
): WorkflowManagementViewState {
  return {
    activeTab: updates.activeTab ?? currentState.activeTab,
    assignmentsSubtab: updates.assignmentsSubtab ?? currentState.assignmentsSubtab,
    currentFilter: updates.currentFilter ?? currentState.currentFilter,
    filters: updates.filters ?? currentState.filters,
  };
}
