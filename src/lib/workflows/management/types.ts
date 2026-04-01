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
