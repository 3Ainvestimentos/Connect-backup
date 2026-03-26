/**
 * @fileOverview Read-model projection helpers for the v2 workflow runtime.
 *
 * These functions compute the denormalized read-model fields that are
 * persisted alongside the operational data in each `workflows_v2` document.
 *
 * The Etapa 1 writes these fields; the Etapa 2 validates and consumes them.
 */

import { Timestamp } from 'firebase-admin/firestore';
import type { StatusCategory } from './types';

export const WORKFLOW_READ_MODEL_REQUIRED_FIELDS = [
  'workflowName',
  'areaId',
  'ownerEmail',
  'ownerUserId',
  'requesterUserId',
  'requesterName',
  'responsibleUserId',
  'responsibleName',
  'currentStepId',
  'currentStepName',
  'currentStatusKey',
  'statusCategory',
  'hasResponsible',
  'hasPendingActions',
  'pendingActionRecipientIds',
  'pendingActionTypes',
  'operationalParticipantIds',
  'slaDays',
  'expectedCompletionAt',
  'lastUpdatedAt',
  'finalizedAt',
  'closedAt',
  'archivedAt',
  'submittedMonthKey',
  'closedMonthKey',
  'isArchived',
] as const;

/**
 * Computes a YYYY-MM month key from a Timestamp.
 *
 * @param ts - A Firestore Timestamp.
 * @returns A string in `YYYY-MM` format.
 */
export function toMonthKey(ts: Timestamp): string {
  const date = ts.toDate();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Computes the expected completion date based on SLA days from a given start date.
 *
 * @param submittedAt - The submission timestamp.
 * @param slaDays - Number of days for the SLA.
 * @returns A Timestamp representing the expected completion date.
 */
export function computeExpectedCompletion(submittedAt: Timestamp, slaDays: number): Timestamp {
  const date = submittedAt.toDate();
  date.setDate(date.getDate() + slaDays);
  return Timestamp.fromDate(date);
}

/**
 * Returns the initial read-model fields for a freshly opened request.
 */
export function buildOpenReadModel(params: {
  workflowName: string;
  areaId: string;
  ownerEmail: string;
  ownerUserId: string;
  requesterUserId: string;
  requesterName: string;
  currentStepId: string;
  currentStepName: string;
  currentStatusKey: string;
  slaDays: number;
  submittedAt: Timestamp;
}): Record<string, unknown> {
  return {
    workflowName: params.workflowName,
    areaId: params.areaId,
    ownerEmail: params.ownerEmail,
    ownerUserId: params.ownerUserId,
    requesterUserId: params.requesterUserId,
    requesterName: params.requesterName,
    responsibleUserId: null,
    responsibleName: null,
    currentStepId: params.currentStepId,
    currentStepName: params.currentStepName,
    currentStatusKey: params.currentStatusKey,
    statusCategory: 'open' as StatusCategory,
    hasResponsible: false,
    hasPendingActions: false,
    pendingActionRecipientIds: [],
    pendingActionTypes: [],
    operationalParticipantIds: [params.ownerUserId],
    slaDays: params.slaDays,
    expectedCompletionAt: computeExpectedCompletion(params.submittedAt, params.slaDays),
    lastUpdatedAt: params.submittedAt,
    finalizedAt: null,
    closedAt: null,
    archivedAt: null,
    submittedMonthKey: toMonthKey(params.submittedAt),
    closedMonthKey: null,
    isArchived: false,
  };
}

/**
 * Returns the read-model field updates after assigning a responsible.
 * If the request was in `open`, it transitions to `in_progress`.
 */
export function buildAssignReadModelUpdate(params: {
  responsibleUserId: string;
  responsibleName: string;
  currentStatusCategory: StatusCategory;
  existingParticipantIds: string[];
  /** If transitioning to 'em_andamento', provide the step info. */
  inProgressStepId?: string;
  inProgressStepName?: string;
  inProgressStatusKey?: string;
  now: Timestamp;
}): Record<string, unknown> {
  const participantIds = params.existingParticipantIds.includes(params.responsibleUserId)
    ? params.existingParticipantIds
    : [...params.existingParticipantIds, params.responsibleUserId];

  const update: Record<string, unknown> = {
    responsibleUserId: params.responsibleUserId,
    responsibleName: params.responsibleName,
    hasResponsible: true,
    operationalParticipantIds: participantIds,
    lastUpdatedAt: params.now,
  };

  // First assignment: transition from open -> in_progress
  if (params.currentStatusCategory === 'open' && params.inProgressStepId) {
    update.currentStepId = params.inProgressStepId;
    update.currentStepName = params.inProgressStepName;
    update.currentStatusKey = params.inProgressStatusKey;
    update.statusCategory = 'in_progress';
  }

  return update;
}

/**
 * Returns the read-model field updates after advancing to the next step.
 */
export function buildAdvanceReadModelUpdate(params: {
  nextStepId: string;
  nextStepName: string;
  nextStatusKey: string;
  now: Timestamp;
}): Record<string, unknown> {
  return {
    currentStepId: params.nextStepId,
    currentStepName: params.nextStepName,
    currentStatusKey: params.nextStatusKey,
    statusCategory: 'in_progress' as StatusCategory,
    lastUpdatedAt: params.now,
  };
}

/**
 * Returns the read-model field updates after finalizing a request.
 */
export function buildFinalizeReadModelUpdate(params: {
  finalStepId: string;
  finalStepName: string;
  finalStatusKey: string;
  now: Timestamp;
}): Record<string, unknown> {
  return {
    currentStepId: params.finalStepId,
    currentStepName: params.finalStepName,
    currentStatusKey: params.finalStatusKey,
    statusCategory: 'finalized' as StatusCategory,
    finalizedAt: params.now,
    closedAt: params.now,
    closedMonthKey: toMonthKey(params.now),
    hasPendingActions: false,
    pendingActionRecipientIds: [],
    pendingActionTypes: [],
    lastUpdatedAt: params.now,
  };
}

/**
 * Returns the read-model field updates after archiving a request.
 */
export function buildArchiveReadModelUpdate(params: {
  now: Timestamp;
}): Record<string, unknown> {
  return {
    isArchived: true,
    statusCategory: 'archived' as StatusCategory,
    archivedAt: params.now,
    lastUpdatedAt: params.now,
  };
}
