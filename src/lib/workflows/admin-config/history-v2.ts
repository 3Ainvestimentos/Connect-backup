import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { buildWorkflowRequestDetail } from '@/lib/workflows/read/detail';
import { mapWorkflowRequestToReadSummary } from '@/lib/workflows/read/queries';
import { normalizeReadTimestamp } from '@/lib/workflows/read/filters';
import { RuntimeError, RuntimeErrorCode } from '@/lib/workflows/runtime/errors';
import { getWorkflowRequestByRequestId, getWorkflowVersion } from '@/lib/workflows/runtime/repository';
import type { WorkflowRequestV2 } from '@/lib/workflows/runtime/types';
import type { AdminHistoryDetailData, AdminHistorySummary } from './history-types';

const WORKFLOWS_COLLECTION = 'workflows_v2';

type HistoryLookupContext = {
  areaLabelsById?: Map<string, string>;
  ownerLabelsByUserId?: Map<string, string>;
};

function getDb(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}

function toIso(value: unknown): string | null {
  return normalizeReadTimestamp(value as Parameters<typeof normalizeReadTimestamp>[0])?.toISOString() ?? null;
}

export function buildV2HistorySummary(
  item: WorkflowRequestV2,
  options: {
    docId?: string;
    areaLabelsById?: Map<string, string>;
    ownerLabelsByUserId?: Map<string, string>;
  } = {},
): AdminHistorySummary {
  const readSummary = options.docId
    ? mapWorkflowRequestToReadSummary(options.docId, item)
    : mapWorkflowRequestToReadSummary(String(item.requestId), item);

  return {
    origin: 'v2',
    requestKey: String(readSummary.requestId),
    requestIdLabel: String(readSummary.requestId).padStart(4, '0'),
    sourceRequestId: readSummary.requestId,
    areaId: readSummary.areaId,
    areaLabel: options.areaLabelsById?.get(readSummary.areaId) ?? readSummary.areaId ?? '-',
    workflowTypeId: readSummary.workflowTypeId,
    workflowLabel: readSummary.workflowName || readSummary.workflowTypeId || 'Workflow v2',
    statusKey: readSummary.currentStatusKey,
    statusLabel: readSummary.currentStepName || readSummary.currentStatusKey || '-',
    statusCategory: readSummary.statusCategory,
    ownerUserId: readSummary.ownerUserId,
    ownerLabel:
      options.ownerLabelsByUserId?.get(readSummary.ownerUserId) ??
      readSummary.ownerEmail ??
      readSummary.ownerUserId ??
      '-',
    requesterLabel: readSummary.requesterName || readSummary.requesterUserId || '-',
    responsibleLabel: readSummary.responsibleName || null,
    submittedAt: toIso(readSummary.submittedAt),
    lastUpdatedAt: toIso(readSummary.lastUpdatedAt),
    periodReferenceAt: toIso(readSummary.closedAt ?? readSummary.submittedAt),
    isArchived: Boolean(readSummary.isArchived),
    compatibilityWarnings: [],
  };
}

export async function loadV2HistoryItems(
  context: HistoryLookupContext = {},
  db: Firestore = getDb(),
): Promise<AdminHistorySummary[]> {
  const snapshot = await db.collection(WORKFLOWS_COLLECTION).orderBy('lastUpdatedAt', 'desc').get();

  return snapshot.docs.map((doc) =>
    buildV2HistorySummary(doc.data() as WorkflowRequestV2, {
      docId: doc.id,
      areaLabelsById: context.areaLabelsById,
      ownerLabelsByUserId: context.ownerLabelsByUserId,
    }),
  );
}

export async function getAdminV2HistoryDetail(
  requestId: number,
  context: HistoryLookupContext = {},
): Promise<AdminHistoryDetailData> {
  const requestEntry = await getWorkflowRequestByRequestId(requestId);

  if (!requestEntry) {
    throw new RuntimeError(RuntimeErrorCode.REQUEST_NOT_FOUND, 'Request nao encontrado.', 404);
  }

  const version = await getWorkflowVersion(
    requestEntry.data.workflowTypeId,
    requestEntry.data.workflowVersion,
  );

  if (!version) {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_PUBLISHED_VERSION,
      'Versao publicada do request nao encontrada.',
      500,
    );
  }

  const detail = buildWorkflowRequestDetail({
    docId: requestEntry.docId,
    request: requestEntry.data,
    version,
    actorUserId: requestEntry.data.ownerUserId,
  });

  const permissions = {
    canAssign: false as const,
    canFinalize: false as const,
    canArchive: false as const,
    canRequestAction: false as const,
    canRespondAction: false as const,
  };

  return {
    origin: 'v2',
    summary: buildV2HistorySummary(requestEntry.data, {
      docId: requestEntry.docId,
      areaLabelsById: context.areaLabelsById,
      ownerLabelsByUserId: context.ownerLabelsByUserId,
    }),
    detail: {
      ...detail,
      permissions,
      action: {
        ...detail.action,
        canRequest: false,
        canRespond: false,
      },
    },
    permissions,
  };
}
