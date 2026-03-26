import {
  getFirestore,
  type Firestore,
  type Query,
  type QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import type { WorkflowRequestV2 } from '../runtime/types';
import {
  ACTIVE_STATUS_CATEGORIES,
  COMPLETED_STATUS_CATEGORIES,
  type CurrentQueueFilter,
  type WorkflowAssignmentsReadData,
  type WorkflowReadMonthField,
  type WorkflowReadMonthGroup,
  type WorkflowReadSummary,
} from './types';

const WORKFLOWS_COLLECTION = 'workflows_v2';

function getDb(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}

function mapWorkflowReadSummary(doc: QueryDocumentSnapshot): WorkflowReadSummary {
  const data = doc.data() as WorkflowRequestV2;

  return {
    docId: doc.id,
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

async function executeWorkflowQuery(query: Query): Promise<WorkflowReadSummary[]> {
  const snapshot = await query.get();
  return snapshot.docs.map(mapWorkflowReadSummary);
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
  return buildOwnerActiveBaseQuery(db, ownerUserId)
    .where('hasResponsible', '==', false)
    .orderBy('lastUpdatedAt', 'desc');
}

export function buildOwnerInProgressQueueQuery(db: Firestore, ownerUserId: string): Query {
  return buildOwnerActiveBaseQuery(db, ownerUserId)
    .where('hasResponsible', '==', true)
    .where('hasPendingActions', '==', false)
    .orderBy('lastUpdatedAt', 'desc');
}

export function buildOwnerWaitingActionQuery(db: Firestore, ownerUserId: string): Query {
  return buildOwnerActiveBaseQuery(db, ownerUserId)
    .where('hasPendingActions', '==', true)
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
