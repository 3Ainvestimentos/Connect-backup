import {
  getFirestore,
  type Firestore,
  type Query,
  type QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { getWorkflowRequestByRequestId } from '../runtime/repository';
import type { WorkflowRequestV2, WorkflowTypeV2 } from '../runtime/types';
import {
  applyOfficialReadFilters,
  enrichWorkflowReadSummaryWithSlaState,
  isWorkflowAssignedToActor,
  isWorkflowInCompletedScope,
  isWorkflowInCurrentQueueScope,
  isWorkflowPendingActionForActor,
  omitRequestIdFilter,
} from './filters';
import {
  ACTIVE_STATUS_CATEGORIES,
  COMPLETED_STATUS_CATEGORIES,
  type CurrentQueueFilter,
  type WorkflowManagementFilters,
  type WorkflowManagementOwnership,
  type WorkflowAssignmentsReadData,
  type WorkflowReadMonthField,
  type WorkflowReadMonthGroup,
  type WorkflowReadSummary,
} from './types';

const WORKFLOW_TYPES_COLLECTION = 'workflowTypes_v2';
const WORKFLOWS_COLLECTION = 'workflows_v2';
const WORKFLOW_AREAS_COLLECTION = 'workflowAreas';

function getDb(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}

export function mapWorkflowRequestToReadSummary(
  docId: string,
  data: WorkflowRequestV2,
): WorkflowReadSummary {
  return {
    docId,
    requestId: data.requestId,
    workflowTypeId: data.workflowTypeId,
    workflowVersion: data.workflowVersion,
    workflowName: data.workflowName,
    areaId: data.areaId,
    ownerEmail: data.ownerEmail,
    ownerUserId: data.ownerUserId,
    requesterUserId: data.requesterUserId,
    requesterName: data.requesterName,
    responsibleUserId: data.responsibleUserId,
    responsibleName: data.responsibleName,
    currentStepId: data.currentStepId,
    currentStepName: data.currentStepName,
    currentStatusKey: data.currentStatusKey,
    statusCategory: data.statusCategory,
    hasResponsible: data.hasResponsible,
    hasPendingActions: data.hasPendingActions,
    pendingActionRecipientIds: data.pendingActionRecipientIds,
    pendingActionTypes: data.pendingActionTypes,
    operationalParticipantIds: data.operationalParticipantIds,
    slaDays: data.slaDays,
    expectedCompletionAt: data.expectedCompletionAt,
    lastUpdatedAt: data.lastUpdatedAt,
    finalizedAt: data.finalizedAt,
    closedAt: data.closedAt,
    archivedAt: data.archivedAt,
    submittedAt: data.submittedAt,
    submittedMonthKey: data.submittedMonthKey,
    closedMonthKey: data.closedMonthKey,
    isArchived: data.isArchived,
  };
}

type WorkflowAreaDocument = {
  name?: string;
};

function mapWorkflowReadSummary(doc: QueryDocumentSnapshot): WorkflowReadSummary {
  return mapWorkflowRequestToReadSummary(doc.id, doc.data() as WorkflowRequestV2);
}

async function executeWorkflowQuery(query: Query): Promise<WorkflowReadSummary[]> {
  const snapshot = await query.get();
  return snapshot.docs.map(mapWorkflowReadSummary).map((item) => enrichWorkflowReadSummaryWithSlaState(item));
}

function buildOwnerActiveBaseQuery(db: Firestore, ownerUserId: string) {
  return db
    .collection(WORKFLOWS_COLLECTION)
    .where('ownerUserId', '==', ownerUserId)
    .where('isArchived', '==', false)
    .where('statusCategory', 'in', [...ACTIVE_STATUS_CATEGORIES]);
}

function buildAssignedActiveBaseQuery(db: Firestore, responsibleUserId: string) {
  return db
    .collection(WORKFLOWS_COLLECTION)
    .where('responsibleUserId', '==', responsibleUserId)
    .where('isArchived', '==', false)
    .where('statusCategory', 'in', [...ACTIVE_STATUS_CATEGORIES]);
}

export function buildOwnerCurrentQueueQuery(db: Firestore, ownerUserId: string): Query {
  return buildOwnerActiveBaseQuery(db, ownerUserId).orderBy('lastUpdatedAt', 'desc');
}

export function buildOwnerWaitingAssignmentQuery(db: Firestore, ownerUserId: string): Query {
  return db
    .collection(WORKFLOWS_COLLECTION)
    .where('ownerUserId', '==', ownerUserId)
    .where('isArchived', '==', false)
    .where('statusCategory', '==', 'open')
    .orderBy('lastUpdatedAt', 'desc');
}

export function buildOwnerInProgressQueueQuery(db: Firestore, ownerUserId: string): Query {
  return db
    .collection(WORKFLOWS_COLLECTION)
    .where('ownerUserId', '==', ownerUserId)
    .where('isArchived', '==', false)
    .where('statusCategory', '==', 'in_progress')
    .orderBy('lastUpdatedAt', 'desc');
}

export function buildOwnerWaitingActionQuery(db: Firestore, ownerUserId: string): Query {
  return db
    .collection(WORKFLOWS_COLLECTION)
    .where('ownerUserId', '==', ownerUserId)
    .where('isArchived', '==', false)
    .where('statusCategory', '==', 'waiting_action')
    .orderBy('lastUpdatedAt', 'desc');
}

export function buildAssignedToMeQuery(db: Firestore, responsibleUserId: string): Query {
  return buildAssignedActiveBaseQuery(db, responsibleUserId).orderBy('lastUpdatedAt', 'desc');
}

export function buildPendingActionForMeQuery(db: Firestore, actorUserId: string): Query {
  return db
    .collection(WORKFLOWS_COLLECTION)
    .where('pendingActionRecipientIds', 'array-contains', actorUserId)
    .where('isArchived', '==', false)
    .where('statusCategory', '==', 'waiting_action')
    .orderBy('lastUpdatedAt', 'desc');
}

export function buildCompletedHistoryQuery(db: Firestore, actorUserId: string): Query {
  return db
    .collection(WORKFLOWS_COLLECTION)
    .where('operationalParticipantIds', 'array-contains', actorUserId)
    .where('statusCategory', 'in', [...COMPLETED_STATUS_CATEGORIES])
    .orderBy('closedAt', 'desc');
}

export function buildRequesterHistoryQuery(db: Firestore, requesterUserId: string): Query {
  return db
    .collection(WORKFLOWS_COLLECTION)
    .where('requesterUserId', '==', requesterUserId)
    .orderBy('submittedAt', 'desc');
}

export async function queryOwnerCurrentQueue(
  ownerUserId: string,
  filter: CurrentQueueFilter = 'all',
  db: Firestore = getDb(),
): Promise<WorkflowReadSummary[]> {
  const query =
    filter === 'waiting_assignment'
      ? buildOwnerWaitingAssignmentQuery(db, ownerUserId)
      : filter === 'in_progress'
        ? buildOwnerInProgressQueueQuery(db, ownerUserId)
        : filter === 'waiting_action'
          ? buildOwnerWaitingActionQuery(db, ownerUserId)
          : buildOwnerCurrentQueueQuery(db, ownerUserId);

  return executeWorkflowQuery(query);
}

export async function queryAssignmentsForActor(
  actorUserId: string,
  db: Firestore = getDb(),
): Promise<WorkflowAssignmentsReadData> {
  const [assignedItems, pendingActionItems] = await Promise.all([
    executeWorkflowQuery(buildAssignedToMeQuery(db, actorUserId)),
    executeWorkflowQuery(buildPendingActionForMeQuery(db, actorUserId)),
  ]);

  return {
    assignedItems,
    pendingActionItems,
  };
}

export async function queryCompletedHistory(
  actorUserId: string,
  db: Firestore = getDb(),
): Promise<WorkflowReadSummary[]> {
  return executeWorkflowQuery(buildCompletedHistoryQuery(db, actorUserId));
}

export async function queryRequesterHistory(
  requesterUserId: string,
  db: Firestore = getDb(),
): Promise<WorkflowReadSummary[]> {
  return executeWorkflowQuery(buildRequesterHistoryQuery(db, requesterUserId));
}

export async function queryOwnedWorkflowScopes(
  actorUserId: string,
  db: Firestore = getDb(),
): Promise<WorkflowManagementOwnership> {
  const snapshot = await db
    .collection(WORKFLOW_TYPES_COLLECTION)
    .where('ownerUserId', '==', actorUserId)
    .where('active', '==', true)
    .get();

  const workflowTypeIds: string[] = [];
  const areaIds = new Set<string>();

  snapshot.docs.forEach((doc) => {
    const data = doc.data() as WorkflowTypeV2;
    const workflowTypeId = data.workflowTypeId || doc.id;

    workflowTypeIds.push(workflowTypeId);

    if (data.areaId) {
      areaIds.add(data.areaId);
    }
  });

  return {
    hasOwnedScopes: workflowTypeIds.length > 0,
    workflowTypeIds,
    areaIds: Array.from(areaIds),
  };
}

async function queryExactWorkflowRequest(requestId: number): Promise<WorkflowReadSummary | null> {
  const result = await getWorkflowRequestByRequestId(requestId);

  if (!result) {
    return null;
  }

  return enrichWorkflowReadSummaryWithSlaState(
    mapWorkflowRequestToReadSummary(result.docId, result.data),
  );
}

export async function getWorkflowAreaLabel(
  areaId: string,
  db: Firestore = getDb(),
): Promise<string> {
  const normalizedAreaId = areaId.trim();
  if (!normalizedAreaId) {
    return areaId;
  }

  const snapshot = await db.collection(WORKFLOW_AREAS_COLLECTION).doc(normalizedAreaId).get();
  if (!snapshot.exists) {
    return normalizedAreaId;
  }

  const data = snapshot.data() as WorkflowAreaDocument;
  return data.name?.trim() || normalizedAreaId;
}

export async function queryScopedCurrentQueue(
  actorUserId: string,
  filter: CurrentQueueFilter,
  filters: WorkflowManagementFilters,
  db: Firestore = getDb(),
): Promise<WorkflowReadSummary[]> {
  const nextFilters = omitRequestIdFilter(filters);

  if (filters.requestId) {
    const exactItem = await queryExactWorkflowRequest(filters.requestId);

    if (!exactItem || !isWorkflowInCurrentQueueScope(exactItem, actorUserId, filter)) {
      return [];
    }

    return applyOfficialReadFilters([exactItem], nextFilters, { periodField: 'submittedAt' });
  }

  const items = await queryOwnerCurrentQueue(actorUserId, filter, db);
  return applyOfficialReadFilters(items, nextFilters, { periodField: 'submittedAt' });
}

export async function queryScopedAssignments(
  actorUserId: string,
  filters: WorkflowManagementFilters,
  db: Firestore = getDb(),
): Promise<WorkflowAssignmentsReadData> {
  const nextFilters = omitRequestIdFilter(filters);

  if (filters.requestId) {
    const exactItem = await queryExactWorkflowRequest(filters.requestId);

    if (!exactItem) {
      return { assignedItems: [], pendingActionItems: [] };
    }

    const assignedItems = isWorkflowAssignedToActor(exactItem, actorUserId) ? [exactItem] : [];
    const pendingActionItems = isWorkflowPendingActionForActor(exactItem, actorUserId)
      ? [exactItem]
      : [];

    return {
      assignedItems: applyOfficialReadFilters(assignedItems, nextFilters, {
        periodField: 'submittedAt',
      }),
      pendingActionItems: applyOfficialReadFilters(pendingActionItems, nextFilters, {
        periodField: 'submittedAt',
      }),
    };
  }

  const data = await queryAssignmentsForActor(actorUserId, db);

  return {
    assignedItems: applyOfficialReadFilters(data.assignedItems, nextFilters, {
      periodField: 'submittedAt',
    }),
    pendingActionItems: applyOfficialReadFilters(data.pendingActionItems, nextFilters, {
      periodField: 'submittedAt',
    }),
  };
}

export async function queryScopedCompletedHistory(
  actorUserId: string,
  filters: WorkflowManagementFilters,
  db: Firestore = getDb(),
): Promise<WorkflowReadSummary[]> {
  const nextFilters = omitRequestIdFilter(filters);

  if (filters.requestId) {
    const exactItem = await queryExactWorkflowRequest(filters.requestId);

    if (!exactItem || !isWorkflowInCompletedScope(exactItem, actorUserId)) {
      return [];
    }

    return applyOfficialReadFilters([exactItem], nextFilters, { periodField: 'closedAt' });
  }

  const items = await queryCompletedHistory(actorUserId, db);
  return applyOfficialReadFilters(items, nextFilters, { periodField: 'closedAt' });
}

export function groupWorkflowsByMonth(
  items: WorkflowReadSummary[],
  field: WorkflowReadMonthField,
): WorkflowReadMonthGroup[] {
  const groups = new Map<string, WorkflowReadSummary[]>();

  for (const item of items) {
    const monthKey = item[field] ?? 'unknown';
    const existingItems = groups.get(monthKey);

    if (existingItems) {
      existingItems.push(item);
      continue;
    }

    groups.set(monthKey, [item]);
  }

  return Array.from(groups.entries()).map(([monthKey, groupedItems]) => ({
    monthKey,
    items: groupedItems,
  }));
}
