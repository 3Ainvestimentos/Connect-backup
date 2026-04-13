import type { User } from 'firebase/auth';
import type {
  CreateWorkflowAreaInput,
  CreateWorkflowAreaResult,
  CreateWorkflowDraftResult,
  CreateWorkflowTypeInput,
  CreateWorkflowTypeResult,
  SaveWorkflowDraftInput,
  SaveWorkflowDraftResult,
  WorkflowConfigAccessMode,
  WorkflowConfigAreaListItem,
  WorkflowConfigCatalogData,
  WorkflowConfigCollaboratorLookup,
  WorkflowConfigOwnerLookup,
  WorkflowConfigTypeListItem,
  WorkflowConfigVersionListItem,
  WorkflowDraftEditorData,
  WorkflowVersionTransitionResult,
} from './types';
import type { RuntimeErrorResponse, RuntimeSuccess } from '@/lib/workflows/runtime/types';
import type {
  AdminHistoryDetailData,
  AdminHistoryFilters,
  AdminHistoryLegacyDetail,
  AdminHistoryListData,
  AdminHistoryOrigin,
  AdminHistoryStatusCategory,
} from './history-types';

type ApiEnvelope<TData> = RuntimeSuccess<TData> | RuntimeErrorResponse;

export class WorkflowConfigApiError extends Error {
  code: string;
  httpStatus: number;

  constructor(code: string, message: string, httpStatus: number) {
    super(message);
    this.name = 'WorkflowConfigApiError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asAccessMode(value: unknown): WorkflowConfigAccessMode {
  return value === 'specific' ? 'specific' : 'all';
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function appendFilterParam(params: URLSearchParams, key: string, value: string | number | undefined) {
  if (value === undefined || value === '') {
    return;
  }

  params.set(key, String(value));
}

function buildHistoryFilterParams(filters: AdminHistoryFilters): URLSearchParams {
  const params = new URLSearchParams();

  appendFilterParam(params, 'origin', filters.origin);
  appendFilterParam(params, 'areaId', filters.areaId);
  appendFilterParam(params, 'workflowTypeId', filters.workflowTypeId);
  appendFilterParam(params, 'statusCategory', filters.statusCategory);
  appendFilterParam(params, 'ownerUserId', filters.ownerUserId);
  appendFilterParam(params, 'periodFrom', filters.periodFrom);
  appendFilterParam(params, 'periodTo', filters.periodTo);
  appendFilterParam(params, 'query', filters.query);
  appendFilterParam(params, 'limit', filters.limit);

  return params;
}

function asHistoryOrigin(value: unknown): AdminHistoryOrigin {
  return value === 'legacy' ? 'legacy' : 'v2';
}

function asHistoryStatusCategory(value: unknown): AdminHistoryStatusCategory | 'unknown' {
  if (
    value === 'open' ||
    value === 'in_progress' ||
    value === 'waiting_action' ||
    value === 'finalized' ||
    value === 'archived'
  ) {
    return value;
  }

  return 'unknown';
}

function normalizeHistorySummary(input: unknown): AdminHistoryListData['items'][number] {
  const item = isObject(input) ? input : {};

  return {
    origin: asHistoryOrigin(item.origin),
    requestKey: asString(item.requestKey),
    requestIdLabel: asString(item.requestIdLabel),
    sourceRequestId:
      typeof item.sourceRequestId === 'number' || typeof item.sourceRequestId === 'string'
        ? item.sourceRequestId
        : null,
    areaId: typeof item.areaId === 'string' ? item.areaId : null,
    areaLabel: asString(item.areaLabel),
    workflowTypeId: typeof item.workflowTypeId === 'string' ? item.workflowTypeId : null,
    workflowLabel: asString(item.workflowLabel),
    statusKey: typeof item.statusKey === 'string' ? item.statusKey : null,
    statusLabel: asString(item.statusLabel),
    statusCategory: asHistoryStatusCategory(item.statusCategory),
    ownerUserId: typeof item.ownerUserId === 'string' ? item.ownerUserId : null,
    ownerLabel: asString(item.ownerLabel),
    requesterLabel: asString(item.requesterLabel),
    responsibleLabel: typeof item.responsibleLabel === 'string' ? item.responsibleLabel : null,
    submittedAt: typeof item.submittedAt === 'string' ? item.submittedAt : null,
    lastUpdatedAt: typeof item.lastUpdatedAt === 'string' ? item.lastUpdatedAt : null,
    periodReferenceAt: typeof item.periodReferenceAt === 'string' ? item.periodReferenceAt : null,
    isArchived: asBoolean(item.isArchived),
    compatibilityWarnings: asStringArray(item.compatibilityWarnings),
  };
}

function normalizeHistoryListData(input: unknown): AdminHistoryListData {
  const item = isObject(input) ? input : {};
  const filterOptions = isObject(item.filterOptions) ? item.filterOptions : {};

  return {
    items: Array.isArray(item.items) ? item.items.map(normalizeHistorySummary) : [],
    filterOptions: {
      origins: Array.isArray(filterOptions.origins)
        ? filterOptions.origins.map(asHistoryOrigin)
        : ['legacy', 'v2'],
      areas: Array.isArray(filterOptions.areas)
        ? (filterOptions.areas as AdminHistoryListData['filterOptions']['areas'])
        : [],
      workflows: Array.isArray(filterOptions.workflows)
        ? (filterOptions.workflows as AdminHistoryListData['filterOptions']['workflows'])
        : [],
      owners: Array.isArray(filterOptions.owners)
        ? (filterOptions.owners as AdminHistoryListData['filterOptions']['owners'])
        : [],
      statusCategories: Array.isArray(filterOptions.statusCategories)
        ? filterOptions.statusCategories
            .map(asHistoryStatusCategory)
            .filter((value): value is AdminHistoryStatusCategory => value !== 'unknown')
        : [],
    },
    partialSources: Array.isArray(item.partialSources) ? item.partialSources.map(asHistoryOrigin) : [],
    totalVisible: asNumber(item.totalVisible),
  };
}

function normalizeHistoryDetailData(input: unknown): AdminHistoryDetailData {
  const item = isObject(input) ? input : {};
  const origin = asHistoryOrigin(item.origin);

  if (origin === 'legacy') {
    const detail = isObject(item.detail) ? item.detail : {};

    return {
      origin,
      summary: normalizeHistorySummary(item.summary),
      detail: {
        formEntries: Array.isArray(detail.formEntries)
          ? (detail.formEntries as AdminHistoryLegacyDetail['formEntries'])
          : [],
        history: Array.isArray(detail.history)
          ? (detail.history as AdminHistoryLegacyDetail['history'])
          : [],
        attachments: Array.isArray(detail.attachments)
          ? (detail.attachments as AdminHistoryLegacyDetail['attachments'])
          : [],
      },
    };
  }

  const detail =
    isObject(item.detail)
      ? (item.detail as Extract<AdminHistoryDetailData, { origin: 'v2' }>['detail'])
      : ({} as Extract<AdminHistoryDetailData, { origin: 'v2' }>['detail']);

  return {
    origin,
    summary: normalizeHistorySummary(item.summary),
    detail,
    permissions: {
      canAssign: false,
      canFinalize: false,
      canArchive: false,
      canRequestAction: false,
      canRespondAction: false,
    },
  };
}

function normalizeVersion(input: unknown): WorkflowConfigVersionListItem {
  const item = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const uiStatus = asString(item.uiStatus);
  const state = asString(item.state);

  return {
    version: asNumber(item.version),
    state: state === 'published' ? 'published' : 'draft',
    uiStatus:
      uiStatus === 'Publicada' || uiStatus === 'Inativa' || uiStatus === 'Rascunho'
        ? uiStatus
        : 'Rascunho',
    isActivePublished: asBoolean(item.isActivePublished),
    derivedStatus:
      uiStatus === 'Publicada' || uiStatus === 'Inativa' || uiStatus === 'Rascunho'
        ? uiStatus
        : 'Rascunho',
    canPublish: asBoolean(item.canPublish),
    canActivate: asBoolean(item.canActivate),
    hasBlockingIssues: asBoolean(item.hasBlockingIssues),
    stepCount: asNumber(item.stepCount),
    fieldCount: asNumber(item.fieldCount),
    publishedAt: typeof item.publishedAt === 'string' ? item.publishedAt : null,
    lastTransitionAt: typeof item.lastTransitionAt === 'string' ? item.lastTransitionAt : null,
  };
}

function normalizeType(input: unknown): WorkflowConfigTypeListItem {
  const item = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};

  return {
    workflowTypeId: asString(item.workflowTypeId),
    name: asString(item.name),
    description: asString(item.description),
    areaId: asString(item.areaId),
    ownerEmail: asString(item.ownerEmail),
    ownerUserId: asString(item.ownerUserId),
    active: asBoolean(item.active),
    latestPublishedVersion: asNumberOrNull(item.latestPublishedVersion),
    versionCount: asNumber(item.versionCount),
    publishedVersionLabel: asString(item.publishedVersionLabel),
    hasPublishedVersion: asBoolean(item.hasPublishedVersion),
    draftVersion: asNumberOrNull(item.draftVersion),
    versions: Array.isArray(item.versions) ? item.versions.map(normalizeVersion) : [],
  };
}

function normalizeArea(input: unknown): WorkflowConfigAreaListItem {
  const item = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};

  return {
    areaId: asString(item.areaId),
    name: asString(item.name),
    icon: asString(item.icon),
    typeCount: asNumber(item.typeCount),
    publishedTypeCount: asNumber(item.publishedTypeCount),
    draftOnlyTypeCount: asNumber(item.draftOnlyTypeCount),
    types: Array.isArray(item.types) ? item.types.map(normalizeType) : [],
  };
}

function normalizeCatalog(input: unknown): WorkflowConfigCatalogData {
  const item = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const summary =
    typeof item.summary === 'object' && item.summary !== null
      ? (item.summary as Record<string, unknown>)
      : {};

  return {
    areas: Array.isArray(item.areas) ? item.areas.map(normalizeArea) : [],
    summary: {
      areaCount: asNumber(summary.areaCount),
      workflowTypeCount: asNumber(summary.workflowTypeCount),
      versionCount: asNumber(summary.versionCount),
    },
  };
}

function normalizeOwnerLookup(input: unknown): WorkflowConfigOwnerLookup {
  const item = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};

  return {
    collaboratorDocId: typeof item.collaboratorDocId === 'string' ? item.collaboratorDocId : undefined,
    userId: asString(item.userId),
    name: asString(item.name),
    email: asString(item.email),
    area: asString(item.area),
    position: asString(item.position),
  };
}

function normalizeCollaboratorLookup(input: unknown): WorkflowConfigCollaboratorLookup {
  const owner = normalizeOwnerLookup(input);

  return {
    collaboratorDocId: owner.collaboratorDocId || '',
    userId: owner.userId,
    name: owner.name,
    email: owner.email,
    area: owner.area,
    position: owner.position,
  };
}

function normalizeDraftEditor(input: unknown): WorkflowDraftEditorData {
  const item = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const draft = typeof item.draft === 'object' && item.draft !== null ? (item.draft as Record<string, unknown>) : {};
  const lookups =
    typeof item.lookups === 'object' && item.lookups !== null
      ? (item.lookups as Record<string, unknown>)
      : {};
  const general =
    typeof draft.general === 'object' && draft.general !== null
      ? (draft.general as Record<string, unknown>)
      : {};
  const access =
    typeof draft.access === 'object' && draft.access !== null
      ? (draft.access as Record<string, unknown>)
      : {};
  const meta =
    typeof draft.meta === 'object' && draft.meta !== null ? (draft.meta as Record<string, unknown>) : {};

  return {
    draft: {
      workflowTypeId: asString(draft.workflowTypeId),
      version: asNumber(draft.version),
      state: asString(draft.state) === 'published' ? 'published' : 'draft',
      mode: asString(draft.mode) === 'read-only' ? 'read-only' : 'edit',
      derivedStatus:
        asString(draft.derivedStatus) === 'Publicada' ||
        asString(draft.derivedStatus) === 'Inativa' ||
        asString(draft.derivedStatus) === 'Rascunho'
          ? (asString(draft.derivedStatus) as WorkflowDraftEditorData['draft']['derivedStatus'])
          : 'Rascunho',
      canPublish: asBoolean(draft.canPublish),
      canActivate: asBoolean(draft.canActivate),
      isNewWorkflowType: asBoolean(draft.isNewWorkflowType),
      general: {
        name: asString(general.name),
        description: asString(general.description),
        icon: asString(general.icon),
        areaId: asString(general.areaId),
        areaName: asString(general.areaName),
        ownerEmail: asString(general.ownerEmail),
        ownerUserId: asString(general.ownerUserId),
        defaultSlaDays: asNumber(general.defaultSlaDays),
        activeOnPublish: asBoolean(general.activeOnPublish),
      },
      access: {
        mode: asAccessMode(access.mode),
        allowedUserIds: asStringArray(access.allowedUserIds),
        preview: asString(access.preview),
      },
      fields: Array.isArray(draft.fields) ? (draft.fields as WorkflowDraftEditorData['draft']['fields']) : [],
      steps: Array.isArray(draft.steps)
        ? (draft.steps as WorkflowDraftEditorData['draft']['steps']).map((step) => ({
            ...step,
            action: step.action
              ? {
                  ...step.action,
                  approvers: Array.isArray(step.action.approvers) ? step.action.approvers : [],
                  unresolvedApproverIds: Array.isArray(step.action.unresolvedApproverIds)
                    ? step.action.unresolvedApproverIds.filter((item) => typeof item === 'string')
                    : [],
                }
              : undefined,
          }))
        : [],
      initialStepId: asString(draft.initialStepId),
      publishReadiness: Array.isArray(draft.publishReadiness)
        ? (draft.publishReadiness as WorkflowDraftEditorData['draft']['publishReadiness'])
        : [],
      meta: {
        createdAt: typeof meta.createdAt === 'string' ? meta.createdAt : null,
        updatedAt: typeof meta.updatedAt === 'string' ? meta.updatedAt : null,
        latestPublishedVersion: asNumberOrNull(meta.latestPublishedVersion),
      },
    },
    lookups: {
      areas: Array.isArray(lookups.areas)
        ? (lookups.areas as WorkflowDraftEditorData['lookups']['areas'])
        : [],
      owners: Array.isArray(lookups.owners) ? lookups.owners.map(normalizeOwnerLookup) : [],
      collaborators: Array.isArray(lookups.collaborators)
        ? lookups.collaborators.map(normalizeCollaboratorLookup)
        : [],
    },
  };
}

function normalizeTransitionResult(input: unknown): WorkflowVersionTransitionResult {
  const item = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const transition = asString(item.transition);
  const catalogStatus = asString(item.catalogStatus);

  return {
    workflowTypeId: asString(item.workflowTypeId),
    version: asNumber(item.version),
    state: asString(item.state) === 'published' ? 'published' : undefined,
    latestPublishedVersion: asNumberOrNull(item.latestPublishedVersion),
    publishedAt: typeof item.publishedAt === 'string' ? item.publishedAt : null,
    transition: transition === 'activated' ? 'activated' : 'published',
    catalogStatus:
      catalogStatus === 'Publicada' || catalogStatus === 'Inativa' || catalogStatus === 'Rascunho'
        ? catalogStatus
        : 'Publicada',
  };
}

async function getAuthHeaders(user: User) {
  const token = await user.getIdToken();

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function requestJson<TData>(
  user: User,
  url: string,
  init?: RequestInit,
): Promise<TData> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(await getAuthHeaders(user)),
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  let payload: ApiEnvelope<TData> | null = null;

  try {
    payload = (await response.json()) as ApiEnvelope<TData>;
  } catch (error) {
    if (!response.ok) {
      throw new WorkflowConfigApiError('UNKNOWN_ERROR', 'Falha ao consumir a API administrativa.', response.status);
    }

    throw error;
  }

  if (!response.ok || !payload || payload.ok !== true) {
    const errorPayload =
      payload && payload.ok === false
        ? payload
        : { code: 'UNKNOWN_ERROR', message: 'Falha ao consumir a API administrativa.' };

    throw new WorkflowConfigApiError(errorPayload.code, errorPayload.message, response.status);
  }

  return payload.data;
}

export async function fetchWorkflowConfigCatalog(user: User): Promise<WorkflowConfigCatalogData> {
  const data = await requestJson<WorkflowConfigCatalogData>(user, '/api/admin/request-config/catalog');
  return normalizeCatalog(data);
}

export async function fetchWorkflowConfigHistory(
  user: User,
  filters: AdminHistoryFilters = {},
): Promise<AdminHistoryListData> {
  const params = buildHistoryFilterParams(filters);
  const path = params.toString()
    ? `/api/admin/request-config/history?${params.toString()}`
    : '/api/admin/request-config/history';
  const data = await requestJson<AdminHistoryListData>(user, path);

  return normalizeHistoryListData(data);
}

export async function fetchWorkflowConfigHistoryDetail(
  user: User,
  origin: 'legacy' | 'v2',
  requestKey: string,
): Promise<AdminHistoryDetailData> {
  const data = await requestJson<AdminHistoryDetailData>(
    user,
    `/api/admin/request-config/history/${origin}/${encodeURIComponent(requestKey)}`,
  );

  return normalizeHistoryDetailData(data);
}

export async function createWorkflowArea(user: User, input: CreateWorkflowAreaInput): Promise<CreateWorkflowAreaResult> {
  return requestJson<CreateWorkflowAreaResult>(user, '/api/admin/request-config/areas', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function createWorkflowType(
  user: User,
  input: CreateWorkflowTypeInput,
): Promise<CreateWorkflowTypeResult> {
  return requestJson<CreateWorkflowTypeResult>(user, '/api/admin/request-config/workflow-types', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function createWorkflowDraft(
  user: User,
  workflowTypeId: string,
): Promise<CreateWorkflowDraftResult> {
  return requestJson<CreateWorkflowDraftResult>(
    user,
    `/api/admin/request-config/workflow-types/${workflowTypeId}/drafts`,
    {
      method: 'POST',
    },
  );
}

export async function fetchWorkflowDraftEditor(
  user: User,
  workflowTypeId: string,
  version: number,
): Promise<WorkflowDraftEditorData> {
  const data = await requestJson<WorkflowDraftEditorData>(
    user,
    `/api/admin/request-config/workflow-types/${workflowTypeId}/versions/${version}`,
  );

  return normalizeDraftEditor(data);
}

export async function saveWorkflowDraft(
  user: User,
  workflowTypeId: string,
  version: number,
  input: SaveWorkflowDraftInput,
): Promise<SaveWorkflowDraftResult> {
  return requestJson<SaveWorkflowDraftResult>(
    user,
    `/api/admin/request-config/workflow-types/${workflowTypeId}/versions/${version}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  );
}

export async function publishWorkflowVersion(
  user: User,
  workflowTypeId: string,
  version: number,
): Promise<WorkflowVersionTransitionResult> {
  const data = await requestJson<WorkflowVersionTransitionResult>(
    user,
    `/api/admin/request-config/workflow-types/${workflowTypeId}/versions/${version}/publish`,
    {
      method: 'POST',
      body: JSON.stringify({ confirm: true }),
    },
  );

  return normalizeTransitionResult(data);
}

export async function activateWorkflowVersion(
  user: User,
  workflowTypeId: string,
  version: number,
): Promise<WorkflowVersionTransitionResult> {
  const data = await requestJson<WorkflowVersionTransitionResult>(
    user,
    `/api/admin/request-config/workflow-types/${workflowTypeId}/versions/${version}/activate`,
    {
      method: 'POST',
      body: JSON.stringify({ confirm: true }),
    },
  );

  return normalizeTransitionResult(data);
}
