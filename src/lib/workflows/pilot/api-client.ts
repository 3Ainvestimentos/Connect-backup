import type { User } from 'firebase/auth';
import { normalizePilotTimestamp } from './timestamps';
import { PilotFileTransferError } from './types';
import type {
  ArchivePilotRequestInput,
  AssignPilotResponsibleInput,
  FinalizePilotRequestInput,
  OpenPilotRequestInput,
  PilotAssignmentsData,
  PilotCurrentQueueData,
  PilotCurrentQueueFilter,
  PilotMineData,
  PilotMonthGroup,
  PilotMutationResult,
  PilotUploadFileResult,
  PilotRequestSummary,
  PilotUploadFileInput,
  PilotUploadInitInput,
  PilotUploadInitResult,
  PilotWorkflowCatalog,
  PilotWorkflowField,
  PilotWorkflowStep,
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

export class PilotApiError extends Error {
  code: string;
  httpStatus: number;

  constructor(code: string, message: string, httpStatus: number) {
    super(message);
    this.name = 'PilotApiError';
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

function normalizeWorkflowField(input: unknown): PilotWorkflowField {
  const field = isObject(input) ? input : {};

  return {
    id: asString(field.id),
    label: asString(field.label),
    type: (asString(field.type) || 'text') as PilotWorkflowField['type'],
    required: Boolean(field.required),
    order: asNumber(field.order),
    placeholder: asNullableString(field.placeholder) ?? undefined,
    options: isStringArray(field.options) ? field.options : undefined,
  };
}

function normalizeWorkflowStep(input: unknown): PilotWorkflowStep {
  const step = isObject(input) ? input : {};

  return {
    stepId: asString(step.stepId),
    stepName: asString(step.stepName),
    statusKey: asString(step.statusKey),
    kind: (asString(step.kind) || 'work') as PilotWorkflowStep['kind'],
    order: asNumber(step.order),
  };
}

function normalizeWorkflowCatalog(input: unknown): PilotWorkflowCatalog {
  const catalog = isObject(input) ? input : {};

  return {
    workflowTypeId: asString(catalog.workflowTypeId),
    workflowName: asString(catalog.workflowName),
    description: asString(catalog.description),
    icon: asString(catalog.icon),
    areaId: asString(catalog.areaId),
    version: asNumber(catalog.version),
    publishedAt: normalizePilotTimestamp(catalog.publishedAt),
    defaultSlaDays: asNumber(catalog.defaultSlaDays),
    initialStepId: asString(catalog.initialStepId),
    initialStepName: asString(catalog.initialStepName),
    fields: Array.isArray(catalog.fields) ? catalog.fields.map(normalizeWorkflowField) : [],
    steps: Array.isArray(catalog.steps) ? catalog.steps.map(normalizeWorkflowStep) : [],
  };
}

function normalizeRequestSummary(input: unknown): PilotRequestSummary {
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
    statusCategory: (asString(item.statusCategory) || 'open') as PilotRequestSummary['statusCategory'],
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
    expectedCompletionAt: normalizePilotTimestamp(item.expectedCompletionAt),
    lastUpdatedAt: normalizePilotTimestamp(item.lastUpdatedAt),
    finalizedAt: normalizePilotTimestamp(item.finalizedAt),
    closedAt: normalizePilotTimestamp(item.closedAt),
    archivedAt: normalizePilotTimestamp(item.archivedAt),
    submittedAt: normalizePilotTimestamp(item.submittedAt),
    submittedMonthKey: asString(item.submittedMonthKey),
    closedMonthKey: asNullableString(item.closedMonthKey),
    isArchived: Boolean(item.isArchived),
  };
}

function normalizeMonthGroup(input: unknown): PilotMonthGroup {
  const group = isObject(input) ? input : {};

  return {
    monthKey: asString(group.monthKey, 'unknown'),
    items: Array.isArray(group.items) ? group.items.map(normalizeRequestSummary) : [],
  };
}

function normalizeCurrentQueueData(input: unknown): PilotCurrentQueueData {
  const data = isObject(input) ? input : {};

  return {
    filter: (asString(data.filter) || 'all') as PilotCurrentQueueFilter,
    items: Array.isArray(data.items) ? data.items.map(normalizeRequestSummary) : [],
  };
}

function normalizeAssignmentsData(input: unknown): PilotAssignmentsData {
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

function normalizeMineData(input: unknown): PilotMineData {
  const data = isObject(input) ? input : {};

  return {
    items: Array.isArray(data.items) ? data.items.map(normalizeRequestSummary) : [],
    groups: Array.isArray(data.groups) ? data.groups.map(normalizeMonthGroup) : [],
  };
}

function normalizeMutationResult(input: unknown): PilotMutationResult {
  const result = isObject(input) ? input : {};

  return {
    docId: asString(result.docId),
    requestId: asNumber(result.requestId),
  };
}

function normalizeHeaders(input: unknown): Record<string, string> {
  if (!isObject(input)) {
    return {};
  }

  return Object.entries(input).reduce<Record<string, string>>((accumulator, [key, value]) => {
    if (typeof value === 'string') {
      accumulator[key] = value;
    }
    return accumulator;
  }, {});
}

function normalizeUploadInitResult(input: unknown): PilotUploadInitResult {
  const result = isObject(input) ? input : {};

  return {
    uploadUrl: asString(result.uploadUrl),
    uploadMethod: (asString(result.uploadMethod) || 'PUT') as PilotUploadInitResult['uploadMethod'],
    uploadHeaders: normalizeHeaders(result.uploadHeaders),
    fileUrl: asString(result.fileUrl),
    storagePath: asString(result.storagePath),
    uploadId: asString(result.uploadId),
    expiresAt: asString(result.expiresAt),
  };
}

export async function authenticatedWorkflowFetch<T>(
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
      throw new PilotApiError('UNKNOWN_ERROR', 'Falha ao consumir API de workflows.', response.status);
    }
    throw error;
  }

  if (!response.ok || !payload || payload.ok !== true) {
    const errorPayload = (payload ?? {}) as ApiError;
    throw new PilotApiError(
      errorPayload.code ?? 'UNKNOWN_ERROR',
      errorPayload.message ?? 'Falha ao consumir API de workflows.',
      response.status,
    );
  }

  return payload.data;
}

export async function getPilotCatalog(
  user: User,
  workflowTypeId: string,
): Promise<PilotWorkflowCatalog> {
  const data = await authenticatedWorkflowFetch<unknown>(
    user,
    `/api/workflows/catalog/${workflowTypeId}`,
  );

  return normalizeWorkflowCatalog(data);
}

export async function getPilotCurrentQueue(
  user: User,
  filter: PilotCurrentQueueFilter,
): Promise<PilotCurrentQueueData> {
  const data = await authenticatedWorkflowFetch<unknown>(
    user,
    `/api/workflows/read/current?filter=${filter}`,
  );

  return normalizeCurrentQueueData(data);
}

export async function getPilotAssignments(user: User): Promise<PilotAssignmentsData> {
  const data = await authenticatedWorkflowFetch<unknown>(user, '/api/workflows/read/assignments');
  return normalizeAssignmentsData(data);
}

export async function getPilotMine(user: User): Promise<PilotMineData> {
  const data = await authenticatedWorkflowFetch<unknown>(user, '/api/workflows/read/mine');
  return normalizeMineData(data);
}

export async function openPilotRequest(
  user: User,
  payload: OpenPilotRequestInput,
): Promise<PilotMutationResult> {
  const data = await authenticatedWorkflowFetch<unknown>(user, '/api/workflows/runtime/requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return normalizeMutationResult(data);
}

export async function requestPilotUpload(
  user: User,
  payload: PilotUploadInitInput,
): Promise<PilotUploadInitResult> {
  const data = await authenticatedWorkflowFetch<unknown>(user, '/api/workflows/runtime/uploads', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return normalizeUploadInitResult(data);
}

export async function putFileToSignedUrl(
  uploadUrl: string,
  uploadHeaders: Record<string, string>,
  file: Blob,
  uploadMethod: PilotUploadInitResult['uploadMethod'] = 'PUT',
): Promise<void> {
  try {
    const response = await fetch(uploadUrl, {
      method: uploadMethod,
      headers: uploadHeaders,
      body: file,
    });

    if (!response.ok) {
      throw new PilotFileTransferError(
        'UPLOAD_TRANSFER_FAILED',
        response.status,
        'Falha ao transferir arquivo para o Storage.',
      );
    }
  } catch (error) {
    if (error instanceof PilotFileTransferError) {
      throw error;
    }

    throw new PilotFileTransferError(
      'UPLOAD_TRANSFER_FAILED',
      0,
      'Falha ao transferir arquivo para o Storage.',
    );
  }
}

export async function uploadPilotFile(
  user: User,
  input: PilotUploadFileInput,
): Promise<PilotUploadFileResult> {
  const signed = await requestPilotUpload(user, {
    workflowTypeId: input.workflowTypeId,
    fieldId: input.fieldId,
    fileName: input.file.name,
    contentType: input.file.type || 'application/octet-stream',
  });

  await putFileToSignedUrl(
    signed.uploadUrl,
    signed.uploadHeaders,
    input.file,
    signed.uploadMethod,
  );

  return { fileUrl: signed.fileUrl };
}

export async function assignPilotResponsible(
  user: User,
  payload: AssignPilotResponsibleInput,
): Promise<PilotMutationResult> {
  const data = await authenticatedWorkflowFetch<unknown>(
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

export async function finalizePilotRequest(
  user: User,
  payload: FinalizePilotRequestInput,
): Promise<PilotMutationResult> {
  const data = await authenticatedWorkflowFetch<unknown>(
    user,
    `/api/workflows/runtime/requests/${payload.requestId}/finalize`,
    {
      method: 'POST',
      body: JSON.stringify({ actorName: payload.actorName }),
    },
  );

  return normalizeMutationResult(data);
}

export async function archivePilotRequest(
  user: User,
  payload: ArchivePilotRequestInput,
): Promise<PilotMutationResult> {
  const data = await authenticatedWorkflowFetch<unknown>(
    user,
    `/api/workflows/runtime/requests/${payload.requestId}/archive`,
    {
      method: 'POST',
      body: JSON.stringify({ actorName: payload.actorName }),
    },
  );

  return normalizeMutationResult(data);
}
