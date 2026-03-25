/**
 * @fileOverview Firestore repository for the v2 workflow runtime.
 *
 * All reads and writes target the `_v2` parallel collections used by Fase 1.
 * This module isolates raw Firestore access from business logic.
 */

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import type { HistoryEntry, WorkflowTypeV2, WorkflowVersionV2, WorkflowRequestV2 } from './types';

// ---------------------------------------------------------------------------
// Collection references
// ---------------------------------------------------------------------------

const WORKFLOW_TYPES_COLLECTION = 'workflowTypes_v2';
const WORKFLOWS_COLLECTION = 'workflows_v2';
const COUNTER_DOC_PATH = 'counters/workflowCounter_v2';

function getDb() {
  return getFirestore(getFirebaseAdminApp());
}

function cleanRuntimeDataForFirestore<T>(value: T): T {
  if (value === undefined || value === null) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => {
      const cleanedItem = cleanRuntimeDataForFirestore(item);
      return cleanedItem === undefined ? null : cleanedItem;
    }) as T;
  }

  if (typeof value !== 'object') {
    return value;
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    return value;
  }

  const cleanedEntries = Object.entries(value).flatMap(([key, entryValue]) => {
    const cleanedValue = cleanRuntimeDataForFirestore(entryValue);
    return cleanedValue === undefined ? [] : [[key, cleanedValue]];
  });

  return Object.fromEntries(cleanedEntries) as T;
}

// ---------------------------------------------------------------------------
// Read helpers
// ---------------------------------------------------------------------------

/**
 * Fetches a workflow type document by its ID.
 */
export async function getWorkflowType(workflowTypeId: string): Promise<WorkflowTypeV2 | null> {
  const snap = await getDb().collection(WORKFLOW_TYPES_COLLECTION).doc(workflowTypeId).get();
  if (!snap.exists) return null;
  return snap.data() as WorkflowTypeV2;
}

/**
 * Fetches a published version document.
 */
export async function getWorkflowVersion(
  workflowTypeId: string,
  version: number,
): Promise<WorkflowVersionV2 | null> {
  const snap = await getDb()
    .collection(WORKFLOW_TYPES_COLLECTION)
    .doc(workflowTypeId)
    .collection('versions')
    .doc(String(version))
    .get();
  if (!snap.exists) return null;
  return snap.data() as WorkflowVersionV2;
}

/**
 * Fetches a workflow request document by its Firestore document ID.
 */
export async function getWorkflowRequest(docId: string): Promise<WorkflowRequestV2 | null> {
  const snap = await getDb().collection(WORKFLOWS_COLLECTION).doc(docId).get();
  if (!snap.exists) return null;
  return snap.data() as WorkflowRequestV2;
}

/**
 * Fetches a workflow request document by its sequential `requestId`.
 * Returns the Firestore doc ID and the document data.
 */
export async function getWorkflowRequestByRequestId(
  requestId: number,
): Promise<{ docId: string; data: WorkflowRequestV2 } | null> {
  const snap = await getDb()
    .collection(WORKFLOWS_COLLECTION)
    .where('requestId', '==', requestId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { docId: doc.id, data: doc.data() as WorkflowRequestV2 };
}

// ---------------------------------------------------------------------------
// Transactional open-request
// ---------------------------------------------------------------------------

/**
 * Atomically increments the v2 counter and creates a new request document.
 *
 * The counter read, increment, and document creation all happen inside a
 * single Firestore transaction to guarantee sequential `requestId` values.
 *
 * @param payload - The full request document payload (without `requestId`).
 * @returns The generated `requestId` and the Firestore document ID.
 */
export async function createRequestTransactionally(
  payload: Omit<WorkflowRequestV2, 'requestId'>,
): Promise<{ requestId: number; docId: string }> {
  const db = getDb();
  const counterRef = db.doc(COUNTER_DOC_PATH);
  const newDocRef = db.collection(WORKFLOWS_COLLECTION).doc();

  const requestId = await db.runTransaction(async (tx) => {
    const counterSnap = await tx.get(counterRef);
    const currentCount = counterSnap.exists ? (counterSnap.data()?.count as number) ?? 0 : 0;
    const nextId = currentCount + 1;

    tx.set(counterRef, { count: nextId }, { merge: true });

    const fullPayload: WorkflowRequestV2 = {
      ...payload,
      requestId: nextId,
    };

    tx.set(newDocRef, cleanRuntimeDataForFirestore(fullPayload));

    return nextId;
  });

  return { requestId, docId: newDocRef.id };
}

// ---------------------------------------------------------------------------
// Mutation helpers
// ---------------------------------------------------------------------------

/**
 * Applies a partial update to a workflow request document.
 *
 * @param docId - The Firestore document ID.
 * @param update - The fields to merge into the document.
 */
export async function updateWorkflowRequest(
  docId: string,
  update: Record<string, unknown>,
): Promise<void> {
  await getDb()
    .collection(WORKFLOWS_COLLECTION)
    .doc(docId)
    .update(cleanRuntimeDataForFirestore(update));
}

/**
 * Persists the mutation payload and the history append inside the same
 * transaction so the request cannot move state without its matching history.
 */
export async function updateWorkflowRequestWithHistory(
  docId: string,
  update: Record<string, unknown>,
  historyEntries: HistoryEntry | HistoryEntry[],
): Promise<void> {
  const db = getDb();
  const docRef = db.collection(WORKFLOWS_COLLECTION).doc(docId);
  const nextEntries = Array.isArray(historyEntries) ? historyEntries : [historyEntries];

  await db.runTransaction(async (tx) => {
    const requestSnap = await tx.get(docRef);

    if (!requestSnap.exists) {
      throw new Error(`Workflow request "${docId}" nao encontrado para atualizacao atomica.`);
    }

    const currentHistory = ((requestSnap.data()?.history ?? []) as HistoryEntry[]).slice();

    tx.update(
      docRef,
      cleanRuntimeDataForFirestore({
        ...update,
        history: [...currentHistory, ...nextEntries],
      }),
    );
  });
}

// ---------------------------------------------------------------------------
// Bootstrap / seed helpers
// ---------------------------------------------------------------------------

/**
 * Seeds a workflow type document. Used only by manual bootstrap scripts.
 */
export async function seedWorkflowType(
  workflowTypeId: string,
  data: Record<string, unknown>,
): Promise<void> {
  await getDb()
    .collection(WORKFLOW_TYPES_COLLECTION)
    .doc(workflowTypeId)
    .set(cleanRuntimeDataForFirestore(data));
}

/**
 * Seeds a version document. Used only by manual bootstrap scripts.
 */
export async function seedWorkflowVersion(
  workflowTypeId: string,
  version: number,
  data: Record<string, unknown>,
): Promise<void> {
  await getDb()
    .collection(WORKFLOW_TYPES_COLLECTION)
    .doc(workflowTypeId)
    .collection('versions')
    .doc(String(version))
    .set(cleanRuntimeDataForFirestore(data));
}
