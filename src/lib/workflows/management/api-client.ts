import type { User } from 'firebase/auth';
import type {
  WorkflowManagementArchiveInput,
  WorkflowManagementRequestActionDetail,
  WorkflowManagementRequestActionInput,
  WorkflowManagementAssignResponsibleInput,
  WorkflowManagementAssignmentsData,
  WorkflowManagementBootstrapData,
  WorkflowManagementCompletedData,
  WorkflowManagementCurrentData,
  WorkflowManagementFilters,
  WorkflowManagementMutationResult,
  WorkflowManagementMonthGroup,
  WorkflowManagementRespondActionInput,
  WorkflowManagementRequestAttachment,
  WorkflowManagementRequestDetailData,
  WorkflowManagementRequestDetailExtraField,
  WorkflowManagementRequestDetailField,
  WorkflowManagementRequestDetailPermissions,
  WorkflowManagementRequestProgressItem,
  WorkflowManagementRequestSummary,
  WorkflowManagementRequestTimelineItem,
  WorkflowManagementFinalizeInput,
} from './types';

type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiError = {
  ok: false;
  code?: string;
  message?: string;
};

type ApiEnvelope<T> = ApiSuccess<T> | ApiError;

type TimestampObject = {
  seconds?: unknown;
  nanoseconds?: unknown;
  _seconds?: unknown;
  _nanoseconds?: unknown;
  toDate?: () => Date;
};

export class WorkflowManagementApiError extends Error {
  code: string;
  httpStatus: number;

  constructor(code: string, message: string, httpStatus: number) {
    super(message);
    this.name = 'WorkflowManagementApiError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown): boolean {
  return Boolean(value);
}

function buildDateFromParts(seconds: number, nanoseconds: number): Date | null {
  if (!Number.isFinite(seconds) || !Number.isFinite(nanoseconds)) {
    return null;
  }

  const value = new Date(seconds * 1000 + nanoseconds / 1_000_000);
  return Number.isNaN(value.getTime()) ? null : value;
}

function normalizeTimestamp(input: unknown): Date | null {
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

function appendFilter(params: URLSearchParams, key: string, value: string | number | undefined) {
  if (value === undefined || value === '') {
    return;
  }

  params.set(key, String(value));
}

function buildManagementFilterParams(filters: WorkflowManagementFilters): URLSearchParams {
  const params = new URLSearchParams();

  appendFilter(params, 'requestId', filters.requestId);
  appendFilter(params, 'workflowTypeId', filters.workflowTypeId);
  appendFilter(params, 'areaId', filters.areaId);
  appendFilter(params, 'requesterQuery', filters.requesterQuery);
  appendFilter(params, 'slaState', filters.slaState);
  appendFilter(params, 'periodFrom', filters.periodFrom);
  appendFilter(params, 'periodTo', filters.periodTo);

  return params;
}

function normalizeRequestSummary(input: unknown): WorkflowManagementRequestSummary {
  const item = isObject(input) ? input : {};

  return {
    docId: asString(item.docId),
    requestId: asNumber(item.requestId),
    workflowTypeId: asString(item.workflowTypeId),
    workflowVersion: asNumber(item.workflowVersion),
    workflowName: asString(item.workflowName),
    areaId: asString(item.areaId),
    ownerEmail: asString(item.ownerEmail),
    ownerUserId: asString(item.ownerUserId),
    requesterUserId: asString(item.requesterUserId),
    requesterName: asString(item.requesterName),
    responsibleUserId: asNullableString(item.responsibleUserId),
    responsibleName: asNullableString(item.responsibleName),
    currentStepId: asString(item.currentStepId),
    currentStepName: asString(item.currentStepName),
    currentStatusKey: asString(item.currentStatusKey),
    statusCategory: (asString(item.statusCategory) || 'open') as WorkflowManagementRequestSummary['statusCategory'],
    hasResponsible: Boolean(item.hasResponsible),
    hasPendingActions: Boolean(item.hasPendingActions),
    pendingActionRecipientIds: isStringArray(item.pendingActionRecipientIds)
      ? item.pendingActionRecipientIds
      : [],
    pendingActionTypes: isStringArray(item.pendingActionTypes) ? item.pendingActionTypes : [],
    operationalParticipantIds: isStringArray(item.operationalParticipantIds)
      ? item.operationalParticipantIds
      : [],
    slaDays: asNumber(item.slaDays),
    slaState:
      item.slaState === 'on_track' || item.slaState === 'at_risk' || item.slaState === 'overdue'
        ? item.slaState
        : undefined,
    expectedCompletionAt: normalizeTimestamp(item.expectedCompletionAt),
    lastUpdatedAt: normalizeTimestamp(item.lastUpdatedAt),
    finalizedAt: normalizeTimestamp(item.finalizedAt),
    closedAt: normalizeTimestamp(item.closedAt),
    archivedAt: normalizeTimestamp(item.archivedAt),
    submittedAt: normalizeTimestamp(item.submittedAt),
    submittedMonthKey: asString(item.submittedMonthKey),
    closedMonthKey: asNullableString(item.closedMonthKey),
    isArchived: Boolean(item.isArchived),
  };
}

function normalizeMonthGroup(input: unknown): WorkflowManagementMonthGroup {
  const group = isObject(input) ? input : {};

  return {
    monthKey: asString(group.monthKey, 'unknown'),
    items: Array.isArray(group.items) ? group.items.map(normalizeRequestSummary) : [],
  };
}

async function authenticatedManagementFetch<T>(
  user: User,
  input: string,
  init?: RequestInit,
): Promise<T> {
  const token = await user.getIdToken();
  const headers = new Headers(init?.headers);

  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(input, {
    ...init,
    headers,
    cache: 'no-store',
  });

  let payload: ApiEnvelope<T> | null = null;

  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch (error) {
    if (!response.ok) {
      throw new WorkflowManagementApiError(
        'UNKNOWN_ERROR',
        'Falha ao consumir API de gestao de chamados.',
        response.status,
      );
    }

    throw error;
  }

  if (!response.ok || !payload || payload.ok !== true) {
    const errorPayload = (payload ?? {}) as ApiError;
    throw new WorkflowManagementApiError(
      errorPayload.code ?? 'UNKNOWN_ERROR',
      errorPayload.message ?? 'Falha ao consumir API de gestao de chamados.',
      response.status,
    );
  }

  return payload.data;
}

function normalizePermissions(input: unknown): WorkflowManagementRequestDetailPermissions {
  const permissions = isObject(input) ? input : {};

  return {
    canAssign: asBoolean(permissions.canAssign),
    canFinalize: asBoolean(permissions.canFinalize),
    canArchive: asBoolean(permissions.canArchive),
    canRequestAction: asBoolean(permissions.canRequestAction),
    canRespondAction: asBoolean(permissions.canRespondAction),
  };
}

function normalizeDetailField(input: unknown): WorkflowManagementRequestDetailField {
  const field = isObject(input) ? input : {};
  const type = asString(field.type);

  return {
    fieldId: asString(field.fieldId),
    label: asString(field.label),
    type:
      type === 'text' ||
      type === 'textarea' ||
      type === 'select' ||
      type === 'date' ||
      type === 'date-range' ||
      type === 'file'
        ? type
        : 'text',
    value: field.value,
  };
}

function normalizeDetailExtraField(input: unknown): WorkflowManagementRequestDetailExtraField {
  const field = isObject(input) ? input : {};

  return {
    key: asString(field.key),
    value: field.value,
  };
}

function normalizeAttachment(input: unknown): WorkflowManagementRequestAttachment {
  const attachment = isObject(input) ? input : {};

  return {
    fieldId: asString(attachment.fieldId),
    label: asString(attachment.label),
    url: asString(attachment.url),
  };
}

function normalizeProgressItem(input: unknown): WorkflowManagementRequestProgressItem {
  const item = isObject(input) ? input : {};
  const kind = asString(item.kind);
  const state = asString(item.state);

  return {
    stepId: asString(item.stepId),
    stepName: asString(item.stepName),
    statusKey: asString(item.statusKey),
    kind: kind === 'start' || kind === 'work' || kind === 'final' ? kind : 'work',
    order: asNumber(item.order),
    state:
      state === 'pending' || state === 'active' || state === 'completed' || state === 'skipped'
        ? state
        : 'pending',
    isCurrent: asBoolean(item.isCurrent),
  };
}

function normalizeTimelineItem(input: unknown): WorkflowManagementRequestTimelineItem {
  const item = isObject(input) ? input : {};
  const action = asString(item.action);

  return {
    action:
      action === 'request_opened' ||
      action === 'responsible_assigned' ||
      action === 'responsible_reassigned' ||
      action === 'step_completed' ||
      action === 'entered_step' ||
      action === 'action_requested' ||
      action === 'action_approved' ||
      action === 'action_rejected' ||
      action === 'action_acknowledged' ||
      action === 'action_executed' ||
      action === 'request_finalized' ||
      action === 'request_archived'
        ? action
        : 'request_opened',
    label: asString(item.label),
    timestamp: normalizeTimestamp(item.timestamp),
    userId: asString(item.userId),
    userName: asString(item.userName),
    details: isObject(item.details) ? item.details : {},
  };
}

function normalizeActionDetail(input: unknown): WorkflowManagementRequestActionDetail {
  const detail = isObject(input) ? input : {};
  const state = asString(detail.state);

  return {
    available: asBoolean(detail.available),
    state: state === 'pending' || state === 'completed' ? state : 'idle',
    batchId: asNullableString(detail.batchId),
    type:
      detail.type === 'approval' ||
      detail.type === 'acknowledgement' ||
      detail.type === 'execution'
        ? detail.type
        : null,
    label: asNullableString(detail.label),
    commentRequired: asBoolean(detail.commentRequired),
    attachmentRequired: asBoolean(detail.attachmentRequired),
    commentPlaceholder: asNullableString(detail.commentPlaceholder),
    attachmentPlaceholder: asNullableString(detail.attachmentPlaceholder),
    canRequest: asBoolean(detail.canRequest),
    canRespond: asBoolean(detail.canRespond),
    requestedAt: normalizeTimestamp(detail.requestedAt),
    completedAt: normalizeTimestamp(detail.completedAt),
    requestedByUserId: asNullableString(detail.requestedByUserId),
    requestedByName: asNullableString(detail.requestedByName),
    recipients: Array.isArray(detail.recipients)
      ? detail.recipients.map((recipient) => {
          const item = isObject(recipient) ? recipient : {};
          const status = asString(item.status);

          return {
            actionRequestId: asString(item.actionRequestId),
            recipientUserId: asString(item.recipientUserId),
            status:
              status === 'pending' ||
              status === 'approved' ||
              status === 'rejected' ||
              status === 'acknowledged' ||
              status === 'executed'
                ? status
                : 'pending',
            respondedAt: normalizeTimestamp(item.respondedAt),
            respondedByUserId: asNullableString(item.respondedByUserId),
            respondedByName: asNullableString(item.respondedByName),
            ...(typeof item.responseComment === 'string' && item.responseComment.trim() !== ''
              ? { responseComment: item.responseComment }
              : {}),
            ...(typeof item.responseAttachmentUrl === 'string' &&
            item.responseAttachmentUrl.trim() !== ''
              ? { responseAttachmentUrl: item.responseAttachmentUrl }
              : {}),
          };
        })
      : [],
    configurationError: asNullableString(detail.configurationError),
  };
}

function normalizeMutationResult(input: unknown): WorkflowManagementMutationResult {
  const result = isObject(input) ? input : {};

  return {
    docId: asString(result.docId),
    requestId: asNumber(result.requestId),
  };
}

function normalizeBootstrapData(input: unknown): WorkflowManagementBootstrapData {
  const data = isObject(input) ? input : {};
  const actor = isObject(data.actor) ? data.actor : {};
  const capabilities = isObject(data.capabilities) ? data.capabilities : {};
  const ownership = isObject(data.ownership) ? data.ownership : {};
  const filterOptions = isObject(data.filterOptions) ? data.filterOptions : {};

  return {
    actor: {
      actorUserId: asString(actor.actorUserId),
      actorName: asString(actor.actorName),
    },
    capabilities: {
      canViewCurrentQueue: Boolean(capabilities.canViewCurrentQueue),
      canViewAssignments: Boolean(capabilities.canViewAssignments),
      canViewCompleted: Boolean(capabilities.canViewCompleted),
    },
    ownership: {
      hasOwnedScopes: Boolean(ownership.hasOwnedScopes),
      workflowTypeIds: isStringArray(ownership.workflowTypeIds) ? ownership.workflowTypeIds : [],
      areaIds: isStringArray(ownership.areaIds) ? ownership.areaIds : [],
    },
    filterOptions: {
      workflows: Array.isArray(filterOptions.workflows)
        ? filterOptions.workflows.map((workflow) => {
            const item = isObject(workflow) ? workflow : {};
            return {
              workflowTypeId: asString(item.workflowTypeId),
              workflowName: asString(item.workflowName),
              areaId: asString(item.areaId),
            };
          })
        : [],
      areas: Array.isArray(filterOptions.areas)
        ? filterOptions.areas.map((area) => {
            const item = isObject(area) ? area : {};
            return {
              areaId: asString(item.areaId),
              label: asString(item.label),
            };
          })
        : [],
    },
  };
}

function normalizeCurrentData(input: unknown): WorkflowManagementCurrentData {
  const data = isObject(input) ? input : {};

  return {
    filter: (asString(data.filter) || 'all') as WorkflowManagementCurrentData['filter'],
    items: Array.isArray(data.items) ? data.items.map(normalizeRequestSummary) : [],
  };
}

function normalizeAssignmentsData(input: unknown): WorkflowManagementAssignmentsData {
  const data = isObject(input) ? input : {};

  return {
    assignedItems: Array.isArray(data.assignedItems)
      ? data.assignedItems.map(normalizeRequestSummary)
      : [],
    pendingActionItems: Array.isArray(data.pendingActionItems)
      ? data.pendingActionItems.map(normalizeRequestSummary)
      : [],
  };
}

function normalizeCompletedData(input: unknown): WorkflowManagementCompletedData {
  const data = isObject(input) ? input : {};

  return {
    items: Array.isArray(data.items) ? data.items.map(normalizeRequestSummary) : [],
    groups: Array.isArray(data.groups) ? data.groups.map(normalizeMonthGroup) : [],
  };
}

function normalizeRequestDetailData(input: unknown): WorkflowManagementRequestDetailData {
  const data = isObject(input) ? input : {};
  const formData = isObject(data.formData) ? data.formData : {};
  const progress = isObject(data.progress) ? data.progress : {};

  return {
    summary: normalizeRequestSummary(data.summary),
    permissions: normalizePermissions(data.permissions),
    formData: {
      fields: Array.isArray(formData.fields) ? formData.fields.map(normalizeDetailField) : [],
      extraFields: Array.isArray(formData.extraFields)
        ? formData.extraFields.map(normalizeDetailExtraField)
        : [],
    },
    attachments: Array.isArray(data.attachments) ? data.attachments.map(normalizeAttachment) : [],
    progress: {
      currentStepId: asString(progress.currentStepId),
      totalSteps: asNumber(progress.totalSteps),
      completedSteps: asNumber(progress.completedSteps),
      items: Array.isArray(progress.items) ? progress.items.map(normalizeProgressItem) : [],
    },
    action: normalizeActionDetail(data.action),
    timeline: Array.isArray(data.timeline) ? data.timeline.map(normalizeTimelineItem) : [],
  };
}

export async function getManagementBootstrap(
  user: User,
): Promise<WorkflowManagementBootstrapData> {
  const data = await authenticatedManagementFetch<unknown>(
    user,
    '/api/workflows/read/management/bootstrap',
  );

  return normalizeBootstrapData(data);
}

export async function getManagementCurrent(
  user: User,
  filter: WorkflowManagementCurrentData['filter'],
  filters: WorkflowManagementFilters,
): Promise<WorkflowManagementCurrentData> {
  const params = buildManagementFilterParams(filters);
  params.set('filter', filter);

  const data = await authenticatedManagementFetch<unknown>(
    user,
    `/api/workflows/read/current?${params.toString()}`,
  );

  return normalizeCurrentData(data);
}

export async function getManagementAssignments(
  user: User,
  filters: WorkflowManagementFilters,
): Promise<WorkflowManagementAssignmentsData> {
  const params = buildManagementFilterParams(filters);
  const suffix = params.toString() ? `?${params.toString()}` : '';

  const data = await authenticatedManagementFetch<unknown>(
    user,
    `/api/workflows/read/assignments${suffix}`,
  );

  return normalizeAssignmentsData(data);
}

export async function getManagementCompleted(
  user: User,
  filters: WorkflowManagementFilters,
) : Promise<WorkflowManagementCompletedData> {
  const params = buildManagementFilterParams(filters);
  const suffix = params.toString() ? `?${params.toString()}` : '';

  const data = await authenticatedManagementFetch<unknown>(
    user,
    `/api/workflows/read/completed${suffix}`,
  );

  return normalizeCompletedData(data);
}

export async function getManagementRequestDetail(
  user: User,
  requestId: number,
): Promise<WorkflowManagementRequestDetailData> {
  const data = await authenticatedManagementFetch<unknown>(
    user,
    `/api/workflows/read/requests/${requestId}`,
  );

  return normalizeRequestDetailData(data);
}

export async function assignManagementResponsible(
  user: User,
  payload: WorkflowManagementAssignResponsibleInput,
): Promise<WorkflowManagementMutationResult> {
  const data = await authenticatedManagementFetch<unknown>(
    user,
    `/api/workflows/runtime/requests/${payload.requestId}/assign`,
    {
      method: 'POST',
      body: JSON.stringify({
        responsibleUserId: payload.responsibleUserId,
        responsibleName: payload.responsibleName,
        actorName: payload.actorName,
      }),
    },
  );

  return normalizeMutationResult(data);
}

export async function finalizeManagementRequest(
  user: User,
  payload: WorkflowManagementFinalizeInput,
): Promise<WorkflowManagementMutationResult> {
  const data = await authenticatedManagementFetch<unknown>(
    user,
    `/api/workflows/runtime/requests/${payload.requestId}/finalize`,
    {
      method: 'POST',
      body: JSON.stringify({
        actorName: payload.actorName,
      }),
    },
  );

  return normalizeMutationResult(data);
}

export async function archiveManagementRequest(
  user: User,
  payload: WorkflowManagementArchiveInput,
): Promise<WorkflowManagementMutationResult> {
  const data = await authenticatedManagementFetch<unknown>(
    user,
    `/api/workflows/runtime/requests/${payload.requestId}/archive`,
    {
      method: 'POST',
      body: JSON.stringify({
        actorName: payload.actorName,
      }),
    },
  );

  return normalizeMutationResult(data);
}

export async function requestManagementAction(
  user: User,
  payload: WorkflowManagementRequestActionInput,
): Promise<WorkflowManagementMutationResult> {
  const data = await authenticatedManagementFetch<unknown>(
    user,
    `/api/workflows/runtime/requests/${payload.requestId}/request-action`,
    {
      method: 'POST',
      body: JSON.stringify({
        actorName: payload.actorName,
      }),
    },
  );

  return normalizeMutationResult(data);
}

export async function respondManagementAction(
  user: User,
  payload: WorkflowManagementRespondActionInput,
): Promise<WorkflowManagementMutationResult> {
  const data = await authenticatedManagementFetch<unknown>(
    user,
    `/api/workflows/runtime/requests/${payload.requestId}/respond-action`,
    {
      method: 'POST',
      body: JSON.stringify({
        actorName: payload.actorName,
        response: payload.response,
        comment: payload.comment,
        attachment: payload.attachment,
      }),
    },
  );

  return normalizeMutationResult(data);
}
