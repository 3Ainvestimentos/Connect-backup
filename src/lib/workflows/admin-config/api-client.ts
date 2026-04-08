import type { User } from 'firebase/auth';
import type {
  WorkflowConfigAreaListItem,
  WorkflowConfigCatalogData,
  WorkflowConfigCatalogError,
  WorkflowConfigCatalogSuccess,
  WorkflowConfigTypeListItem,
  WorkflowConfigVersionListItem,
} from './types';

type ApiEnvelope = WorkflowConfigCatalogSuccess | WorkflowConfigCatalogError;

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

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function normalizeVersion(input: unknown): WorkflowConfigVersionListItem {
  const item = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const uiStatus = asString(item.uiStatus);
  const state = asString(item.state);

  return {
    version: asNumber(item.version),
    state: state === 'draft' || state === 'published' ? state : 'draft',
    uiStatus:
      uiStatus === 'Publicada' || uiStatus === 'Inativa' || uiStatus === 'Rascunho'
        ? uiStatus
        : 'Rascunho',
    isActivePublished: asBoolean(item.isActivePublished),
    stepCount: asNumber(item.stepCount),
    fieldCount: asNumber(item.fieldCount),
    publishedAt: typeof item.publishedAt === 'string' ? item.publishedAt : null,
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
    latestPublishedVersion: asNumber(item.latestPublishedVersion),
    versionCount: asNumber(item.versionCount),
    publishedVersionLabel: asString(item.publishedVersionLabel),
    hasPublishedVersion: asBoolean(item.hasPublishedVersion),
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

export async function fetchWorkflowConfigCatalog(user: User): Promise<WorkflowConfigCatalogData> {
  const token = await user.getIdToken();
  const response = await fetch('/api/admin/request-config/catalog', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  let payload: ApiEnvelope | null = null;

  try {
    payload = (await response.json()) as ApiEnvelope;
  } catch (error) {
    if (!response.ok) {
      throw new WorkflowConfigApiError(
        'UNKNOWN_ERROR',
        'Falha ao consumir o catalogo administrativo de chamados.',
        response.status,
      );
    }

    throw error;
  }

  if (!response.ok || !payload || payload.ok !== true) {
    const errorPayload =
      payload && payload.ok === false
        ? payload
        : { code: 'UNKNOWN_ERROR', message: 'Falha ao consumir o catalogo administrativo de chamados.' };

    throw new WorkflowConfigApiError(
      errorPayload.code,
      errorPayload.message,
      response.status,
    );
  }

  return normalizeCatalog(payload.data);
}
