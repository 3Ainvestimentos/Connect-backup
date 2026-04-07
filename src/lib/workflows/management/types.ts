export const MANAGEMENT_TABS = ['current', 'assignments', 'completed'] as const;
export const MANAGEMENT_ASSIGNMENTS_SUBTABS = ['assigned', 'pending'] as const;
export const MANAGEMENT_CURRENT_QUEUE_FILTERS = [
  'all',
  'waiting_assignment',
  'in_progress',
  'waiting_action',
] as const;
export const MANAGEMENT_SLA_STATES = ['on_track', 'at_risk', 'overdue'] as const;

export type ManagementTabId = (typeof MANAGEMENT_TABS)[number];
export type ManagementAssignmentsSubtab = (typeof MANAGEMENT_ASSIGNMENTS_SUBTABS)[number];
export type ManagementCurrentQueueFilter = (typeof MANAGEMENT_CURRENT_QUEUE_FILTERS)[number];
export type ManagementSlaState = (typeof MANAGEMENT_SLA_STATES)[number];

export type WorkflowManagementFilters = {
  requestId?: number;
  workflowTypeId?: string;
  areaId?: string;
  requesterQuery?: string;
  slaState?: ManagementSlaState;
  periodFrom?: string;
  periodTo?: string;
};

export type WorkflowManagementSearchParams = {
  tab?: ManagementTabId;
  subtab?: ManagementAssignmentsSubtab;
  queue?: ManagementCurrentQueueFilter;
  requestId?: string;
  workflow?: string;
  area?: string;
  requester?: string;
  sla?: ManagementSlaState;
  from?: string;
  to?: string;
};

export type WorkflowManagementViewState = {
  activeTab: ManagementTabId;
  assignmentsSubtab: ManagementAssignmentsSubtab;
  currentFilter: ManagementCurrentQueueFilter;
  filters: WorkflowManagementFilters;
};

export type WorkflowManagementRequestSummary = {
  docId: string;
  requestId: number;
  workflowTypeId: string;
  workflowVersion: number;
  workflowName: string;
  areaId: string;
  ownerEmail: string;
  ownerUserId: string;
  requesterUserId: string;
  requesterName: string;
  responsibleUserId: string | null;
  responsibleName: string | null;
  currentStepId: string;
  currentStepName: string;
  currentStatusKey: string;
  statusCategory: 'open' | 'in_progress' | 'waiting_action' | 'finalized' | 'archived';
  hasResponsible: boolean;
  hasPendingActions: boolean;
  pendingActionRecipientIds: string[];
  pendingActionTypes: string[];
  operationalParticipantIds: string[];
  slaDays: number;
  slaState?: ManagementSlaState;
  expectedCompletionAt: Date | null;
  lastUpdatedAt: Date | null;
  finalizedAt: Date | null;
  closedAt: Date | null;
  archivedAt: Date | null;
  submittedAt: Date | null;
  submittedMonthKey: string;
  closedMonthKey: string | null;
  isArchived: boolean;
};

export type WorkflowManagementMonthGroup = {
  monthKey: string;
  items: WorkflowManagementRequestSummary[];
};

export type WorkflowManagementCurrentData = {
  filter: ManagementCurrentQueueFilter;
  items: WorkflowManagementRequestSummary[];
};

export type WorkflowManagementAssignmentsData = {
  assignedItems: WorkflowManagementRequestSummary[];
  pendingActionItems: WorkflowManagementRequestSummary[];
};

export type WorkflowManagementCompletedData = {
  items: WorkflowManagementRequestSummary[];
  groups: WorkflowManagementMonthGroup[];
};

export type WorkflowManagementRequestDetailPermissions = {
  canAssign: boolean;
  canFinalize: boolean;
  canArchive: boolean;
  canRequestAction: boolean;
  canRespondAction: boolean;
};

export type WorkflowManagementRequestDetailField = {
  fieldId: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'date-range' | 'file';
  value: unknown;
};

export type WorkflowManagementRequestDetailExtraField = {
  key: string;
  value: unknown;
};

export type WorkflowManagementRequestAttachment = {
  fieldId: string;
  label: string;
  url: string;
};

export type WorkflowManagementRequestProgressItem = {
  stepId: string;
  stepName: string;
  statusKey: string;
  kind: 'start' | 'work' | 'final';
  order: number;
  state: 'pending' | 'active' | 'completed' | 'skipped';
  isCurrent: boolean;
};

export type WorkflowManagementRequestTimelineItem = {
  action:
    | 'request_opened'
    | 'responsible_assigned'
    | 'responsible_reassigned'
    | 'step_completed'
    | 'entered_step'
    | 'action_requested'
    | 'action_approved'
    | 'action_rejected'
    | 'action_acknowledged'
    | 'action_executed'
    | 'request_finalized'
    | 'request_archived';
  label: string;
  timestamp: Date | null;
  userId: string;
  userName: string;
  details?: Record<string, unknown>;
};

export type WorkflowManagementRequestActionRecipient = {
  actionRequestId: string;
  recipientUserId: string;
  status: 'pending' | 'approved' | 'rejected' | 'acknowledged' | 'executed';
  respondedAt: Date | null;
  respondedByUserId: string | null;
  respondedByName: string | null;
  responseComment?: string;
  responseAttachmentUrl?: string;
};

export type WorkflowManagementRequestActionDetail = {
  available: boolean;
  state: 'idle' | 'pending';
  type: 'approval' | 'acknowledgement' | 'execution' | null;
  label: string | null;
  commentRequired: boolean;
  attachmentRequired: boolean;
  commentPlaceholder: string | null;
  attachmentPlaceholder: string | null;
  canRequest: boolean;
  canRespond: boolean;
  requestedAt: Date | null;
  requestedByUserId: string | null;
  requestedByName: string | null;
  recipients: WorkflowManagementRequestActionRecipient[];
  configurationError?: string | null;
};

export type WorkflowManagementRequestDetailData = {
  summary: WorkflowManagementRequestSummary;
  permissions: WorkflowManagementRequestDetailPermissions;
  formData: {
    fields: WorkflowManagementRequestDetailField[];
    extraFields: WorkflowManagementRequestDetailExtraField[];
  };
  attachments: WorkflowManagementRequestAttachment[];
  progress: {
    currentStepId: string;
    totalSteps: number;
    completedSteps: number;
    items: WorkflowManagementRequestProgressItem[];
  };
  action: WorkflowManagementRequestActionDetail;
  timeline: WorkflowManagementRequestTimelineItem[];
};

export type WorkflowManagementMutationResult = {
  docId: string;
  requestId: number;
};

export type WorkflowManagementAssignResponsibleInput = {
  requestId: number;
  responsibleUserId: string;
  responsibleName: string;
  actorName?: string;
};

export type WorkflowManagementFinalizeInput = {
  requestId: number;
  actorName?: string;
};

export type WorkflowManagementArchiveInput = {
  requestId: number;
  actorName?: string;
};

export type WorkflowManagementRequestActionInput = {
  requestId: number;
  actorName?: string;
};

export type WorkflowManagementRespondActionAttachment = {
  fileName: string;
  contentType: string;
  fileUrl: string;
  storagePath: string;
  uploadId?: string;
};

export type WorkflowManagementRespondActionInput = {
  requestId: number;
  response: 'approved' | 'rejected' | 'acknowledged' | 'executed';
  comment?: string;
  actorName?: string;
  attachment?: WorkflowManagementRespondActionAttachment;
  attachmentFile?: File | null;
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

export type ManagementTabDefinition = {
  tab: ManagementTabId;
  title: string;
  description: string;
};

export type ManagementAssignmentsSubtabDefinition = {
  tab: ManagementAssignmentsSubtab;
  title: string;
};
