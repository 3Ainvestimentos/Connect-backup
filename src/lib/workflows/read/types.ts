import type { Timestamp } from 'firebase-admin/firestore';
import type {
  HistoryAction,
  StatusCategory,
  StepKind,
  StepState,
  VersionFieldType,
  WorkflowActionRequestStatus,
  WorkflowRequestV2,
} from '../runtime/types';

export const ACTIVE_STATUS_CATEGORIES = ['open', 'in_progress', 'waiting_action'] as const;
export const COMPLETED_STATUS_CATEGORIES = ['finalized', 'archived'] as const;
export const CURRENT_QUEUE_FILTERS = [
  'all',
  'waiting_assignment',
  'in_progress',
  'waiting_action',
] as const;
export const WORKFLOW_READ_SLA_STATES = ['on_track', 'at_risk', 'overdue'] as const;

export type WorkflowReadStatusCategory = StatusCategory;
export type CurrentQueueFilter = (typeof CURRENT_QUEUE_FILTERS)[number];
export type WorkflowReadSlaState = (typeof WORKFLOW_READ_SLA_STATES)[number];
export type WorkflowReadMonthField = 'closedMonthKey' | 'submittedMonthKey';

export type WorkflowReadSummary = {
  docId: string;
  slaState?: WorkflowReadSlaState;
  areaLabel?: string;
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

export type WorkflowManagementFilters = {
  requestId?: number;
  workflowTypeId?: string;
  areaId?: string;
  requesterQuery?: string;
  slaState?: WorkflowReadSlaState;
  periodFrom?: string;
  periodTo?: string;
};

export type WorkflowManagementActor = {
  actorUserId: string;
  actorName: string;
};

export type WorkflowManagementCapabilities = {
  canViewCurrentQueue: boolean;
  canViewAssignments: boolean;
  canViewCompleted: boolean;
};

export type WorkflowManagementOwnership = {
  hasOwnedScopes: boolean;
  workflowTypeIds: string[];
  areaIds: string[];
};

export type WorkflowManagementFilterWorkflowOption = {
  workflowTypeId: string;
  workflowName: string;
  areaId: string;
};

export type WorkflowManagementFilterAreaOption = {
  areaId: string;
  label: string;
};

export type WorkflowManagementFilterOptions = {
  workflows: WorkflowManagementFilterWorkflowOption[];
  areas: WorkflowManagementFilterAreaOption[];
};

export type WorkflowManagementBootstrapData = {
  actor: WorkflowManagementActor;
  capabilities: WorkflowManagementCapabilities;
  ownership: WorkflowManagementOwnership;
  filterOptions: WorkflowManagementFilterOptions;
};

export type WorkflowRequestDetailPermissions = {
  canAssign: boolean;
  canAdvance: boolean;
  canFinalize: boolean;
  canArchive: boolean;
  canRequestAction: boolean;
  canRespondAction: boolean;
};

export type WorkflowRequestDetailField = {
  fieldId: string;
  label: string;
  type: VersionFieldType;
  value: unknown;
};

export type WorkflowRequestDetailExtraField = {
  key: string;
  value: unknown;
};

export type WorkflowRequestAttachment = {
  fieldId: string;
  label: string;
  url: string;
};

export type WorkflowRequestProgressItem = {
  stepId: string;
  stepName: string;
  statusKey: string;
  kind: StepKind;
  order: number;
  state: StepState;
  isCurrent: boolean;
};

export type WorkflowRequestTimelineItem = {
  action: HistoryAction;
  label: string;
  timestamp: TimestampLike;
  userId: string;
  userName: string;
  details?: Record<string, unknown>;
};

export type WorkflowRequestActionRecipientDetail = {
  actionRequestId: string;
  recipientUserId: string;
  status: WorkflowActionRequestStatus;
  respondedAt: TimestampLike;
  respondedByUserId: string | null;
  respondedByName: string | null;
  responseComment?: string;
  responseAttachmentUrl?: string;
};

export type WorkflowRequestStepEvent = {
  action: HistoryAction;
  label: string;
  timestamp: TimestampLike;
  userId: string;
  userName: string;
};

export type WorkflowRequestStepActionResponse = {
  actionRequestId: string;
  recipientUserId: string;
  status: WorkflowActionRequestStatus;
  respondedAt: TimestampLike;
  respondedByUserId: string | null;
  respondedByName: string | null;
  responseComment?: string;
  responseAttachmentUrl?: string;
};

export type WorkflowRequestStepHistoryItem = {
  stepId: string;
  stepName: string;
  kind: StepKind;
  order: number;
  state: StepState;
  isCurrent: boolean;
  events: WorkflowRequestStepEvent[];
  actionResponses: WorkflowRequestStepActionResponse[];
};

export type WorkflowRequestActionState = 'idle' | 'pending' | 'completed';

export type WorkflowRequestActionDetail = {
  available: boolean;
  state: WorkflowRequestActionState;
  batchId: string | null;
  type: 'approval' | 'acknowledgement' | 'execution' | null;
  label: string | null;
  commentRequired: boolean;
  attachmentRequired: boolean;
  commentPlaceholder: string | null;
  attachmentPlaceholder: string | null;
  canRequest: boolean;
  canRespond: boolean;
  requestedAt: TimestampLike;
  completedAt: TimestampLike;
  requestedByUserId: string | null;
  requestedByName: string | null;
  recipients: WorkflowRequestActionRecipientDetail[];
  configurationError?: string | null;
};

export type WorkflowRequestDetailData = {
  summary: WorkflowReadSummary;
  permissions: WorkflowRequestDetailPermissions;
  formData: {
    fields: WorkflowRequestDetailField[];
    extraFields: WorkflowRequestDetailExtraField[];
  };
  attachments: WorkflowRequestAttachment[];
  progress: {
    currentStepId: string;
    totalSteps: number;
    completedSteps: number;
    items: WorkflowRequestProgressItem[];
  };
  action: WorkflowRequestActionDetail;
  timeline: WorkflowRequestTimelineItem[];
  stepsHistory?: WorkflowRequestStepHistoryItem[];
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
