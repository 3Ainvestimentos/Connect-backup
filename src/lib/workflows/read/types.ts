import type { Timestamp } from 'firebase-admin/firestore';
import type { StatusCategory, WorkflowRequestV2 } from '../runtime/types';

export const ACTIVE_STATUS_CATEGORIES = ['open', 'in_progress', 'waiting_action'] as const;
export const COMPLETED_STATUS_CATEGORIES = ['finalized', 'archived'] as const;
export const CURRENT_QUEUE_FILTERS = [
  'all',
  'waiting_assignment',
  'in_progress',
  'waiting_action',
] as const;

export type WorkflowReadStatusCategory = StatusCategory;
export type CurrentQueueFilter = (typeof CURRENT_QUEUE_FILTERS)[number];
export type WorkflowReadMonthField = 'closedMonthKey' | 'submittedMonthKey';

export type WorkflowReadSummary = {
  docId: string;
} & Pick<
  WorkflowRequestV2,
  | 'requestId'
  | 'workflowTypeId'
  | 'workflowVersion'
  | 'workflowName'
  | 'areaId'
  | 'ownerEmail'
  | 'ownerUserId'
  | 'requesterUserId'
  | 'requesterName'
  | 'responsibleUserId'
  | 'responsibleName'
  | 'currentStepId'
  | 'currentStepName'
  | 'currentStatusKey'
  | 'statusCategory'
  | 'hasResponsible'
  | 'hasPendingActions'
  | 'pendingActionRecipientIds'
  | 'pendingActionTypes'
  | 'operationalParticipantIds'
  | 'slaDays'
  | 'expectedCompletionAt'
  | 'lastUpdatedAt'
  | 'finalizedAt'
  | 'closedAt'
  | 'archivedAt'
  | 'submittedAt'
  | 'submittedMonthKey'
  | 'closedMonthKey'
  | 'isArchived'
>;

export type WorkflowReadMonthGroup = {
  monthKey: string;
  items: WorkflowReadSummary[];
};

export type WorkflowCurrentReadData = {
  filter: CurrentQueueFilter;
  items: WorkflowReadSummary[];
};

export type WorkflowAssignmentsReadData = {
  assignedItems: WorkflowReadSummary[];
  pendingActionItems: WorkflowReadSummary[];
};

export type WorkflowGroupedReadData = {
  items: WorkflowReadSummary[];
  groups: WorkflowReadMonthGroup[];
};

export type ReadSuccess<T> = {
  ok: true;
  data: T;
};

export type ReadError = {
  ok: false;
  code: string;
  message: string;
};

export type TimestampLike = Timestamp | null;
