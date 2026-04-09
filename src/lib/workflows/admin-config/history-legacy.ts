import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { normalizeReadTimestamp } from '@/lib/workflows/read/filters';
import { RuntimeError, RuntimeErrorCode } from '@/lib/workflows/runtime/errors';
import type { AdminHistoryDetailData, AdminHistoryStatusCategoryWithUnknown, AdminHistorySummary } from './history-types';

const WORKFLOWS_COLLECTION = 'workflows';

type LegacySubmittedBy = {
  userId?: string;
  userName?: string;
  userEmail?: string;
};

type LegacyAssignee = {
  id?: string;
  name?: string;
};

type LegacyActionRequest = {
  status?: string;
};

type LegacyHistoryEntry = {
  timestamp?: unknown;
  status?: string;
  userName?: string;
  notes?: string;
};

type LegacyWorkflowRequest = {
  requestId?: string;
  type?: string;
  status?: string;
  ownerEmail?: string;
  submittedBy?: LegacySubmittedBy;
  submittedAt?: string;
  lastUpdatedAt?: string;
  formData?: Record<string, unknown>;
  history?: LegacyHistoryEntry[];
  assignee?: LegacyAssignee;
  isArchived?: boolean;
  actionRequests?: Record<string, LegacyActionRequest[]>;
};

type LegacyHistoryContext = {
  ownerUserIdsByEmail?: Map<string, string>;
  ownerLabelsByUserId?: Map<string, string>;
};

function getDb(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}

function toIso(value: unknown): string | null {
  return normalizeReadTimestamp(value as Parameters<typeof normalizeReadTimestamp>[0])?.toISOString() ?? null;
}

function normalizeEmail(value: string | undefined): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function humanizeKey(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function looksLikeUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function inferLegacyStatusCategory(
  item: LegacyWorkflowRequest,
): AdminHistoryStatusCategoryWithUnknown {
  if (item.isArchived) {
    return 'archived';
  }

  const normalizedStatus = item.status?.trim().toLowerCase() ?? '';
  const hasPendingAction = Object.values(item.actionRequests ?? {}).some((entries) =>
    (entries ?? []).some((entry) => entry?.status === 'pending'),
  );

  if (hasPendingAction) {
    return 'waiting_action';
  }

  if (
    ['aprovado', 'reprovado', 'concluido', 'concluído', 'finalizado', 'cancelado', 'closed'].some((label) =>
      normalizedStatus.includes(label),
    )
  ) {
    return 'finalized';
  }

  if (item.assignee?.id || item.assignee?.name) {
    return 'in_progress';
  }

  if (normalizedStatus) {
    return 'open';
  }

  return 'unknown';
}

export function buildLegacyHistorySummary(
  docId: string,
  item: LegacyWorkflowRequest,
  context: LegacyHistoryContext = {},
): AdminHistorySummary {
  const ownerEmail = normalizeEmail(item.ownerEmail);
  const ownerUserId = ownerEmail ? context.ownerUserIdsByEmail?.get(ownerEmail) ?? null : null;

  return {
    origin: 'legacy',
    requestKey: docId,
    requestIdLabel: item.requestId?.trim() || docId,
    sourceRequestId: item.requestId?.trim() || null,
    areaId: null,
    areaLabel: 'Legado',
    workflowTypeId: item.type?.trim() || null,
    workflowLabel: item.type?.trim() || 'Workflow legado',
    statusKey: item.status?.trim() || null,
    statusLabel: item.status?.trim() || 'Status legado',
    statusCategory: inferLegacyStatusCategory(item),
    ownerUserId,
    ownerLabel:
      (ownerUserId ? context.ownerLabelsByUserId?.get(ownerUserId) : null) ??
      item.ownerEmail?.trim() ??
      '-',
    requesterLabel: item.submittedBy?.userName?.trim() || item.submittedBy?.userEmail?.trim() || '-',
    responsibleLabel: item.assignee?.name?.trim() || null,
    submittedAt: toIso(item.submittedAt),
    lastUpdatedAt: toIso(item.lastUpdatedAt ?? item.submittedAt),
    periodReferenceAt: toIso(item.lastUpdatedAt ?? item.submittedAt),
    isArchived: Boolean(item.isArchived),
    compatibilityWarnings: [],
  };
}

export async function loadLegacyHistoryItems(
  context: LegacyHistoryContext = {},
  db: Firestore = getDb(),
): Promise<AdminHistorySummary[]> {
  const snapshot = await db.collection(WORKFLOWS_COLLECTION).get();

  return snapshot.docs.map((doc) =>
    buildLegacyHistorySummary(doc.id, doc.data() as LegacyWorkflowRequest, context),
  );
}

export async function getAdminLegacyHistoryDetail(
  requestKey: string,
  context: LegacyHistoryContext = {},
  db: Firestore = getDb(),
): Promise<AdminHistoryDetailData> {
  const snapshot = await db.collection(WORKFLOWS_COLLECTION).doc(requestKey).get();

  if (!snapshot.exists) {
    throw new RuntimeError(RuntimeErrorCode.REQUEST_NOT_FOUND, 'Request nao encontrado.', 404);
  }

  const data = snapshot.data() as LegacyWorkflowRequest;
  const formData = data.formData ?? {};
  const formEntries = Object.entries(formData).map(([key, value]) => ({
    key,
    label: humanizeKey(key),
    value,
  }));
  const attachments = Object.entries(formData)
    .filter(([, value]) => looksLikeUrl(value))
    .map(([key, value]) => ({
      label: humanizeKey(key),
      url: value as string,
    }));
  const history = (data.history ?? []).map((entry) => ({
    timestamp: toIso(entry.timestamp),
    status: entry.status?.trim() || '-',
    userName: entry.userName?.trim() || '-',
    ...(entry.notes?.trim() ? { notes: entry.notes.trim() } : {}),
  }));

  return {
    origin: 'legacy',
    summary: buildLegacyHistorySummary(snapshot.id, data, context),
    detail: {
      formEntries,
      attachments,
      history,
    },
  };
}
