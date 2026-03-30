export const PILOT_CURRENT_QUEUE_FILTERS = [
  'all',
  'waiting_assignment',
  'in_progress',
  'waiting_action',
] as const;

export type PilotCurrentQueueFilter = (typeof PILOT_CURRENT_QUEUE_FILTERS)[number];

export type PilotFieldType = 'text' | 'textarea' | 'select' | 'date' | 'date-range' | 'file';
export type PilotStepKind = 'start' | 'work' | 'final';
export type PilotStatusCategory =
  | 'open'
  | 'in_progress'
  | 'waiting_action'
  | 'finalized'
  | 'archived';
export type PilotBadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';
export type PilotSituationKey =
  | 'awaiting_assignment'
  | 'in_progress'
  | 'waiting_action'
  | 'finalized'
  | 'archived';

export type PilotWorkflowField = {
  id: string;
  label: string;
  type: PilotFieldType;
  required: boolean;
  order: number;
  placeholder?: string;
  options?: string[];
};

export type PilotWorkflowStep = {
  stepId: string;
  stepName: string;
  statusKey: string;
  kind: PilotStepKind;
  order: number;
};

export type PilotWorkflowCatalog = {
  workflowTypeId: string;
  workflowName: string;
  description: string;
  icon: string;
  areaId: string;
  version: number;
  publishedAt: Date | null;
  defaultSlaDays: number;
  initialStepId: string;
  initialStepName: string;
  fields: PilotWorkflowField[];
  steps: PilotWorkflowStep[];
};

export type PilotRequestSummary = {
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
  statusCategory: PilotStatusCategory;
  hasResponsible: boolean;
  hasPendingActions: boolean;
  pendingActionRecipientIds: string[];
  pendingActionTypes: string[];
  operationalParticipantIds: string[];
  slaDays: number;
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

export type PilotMonthGroup = {
  monthKey: string;
  items: PilotRequestSummary[];
};

export type PilotCurrentQueueData = {
  filter: PilotCurrentQueueFilter;
  items: PilotRequestSummary[];
};

export type PilotAssignmentsData = {
  assignedItems: PilotRequestSummary[];
  pendingActionItems: PilotRequestSummary[];
};

export type PilotMineData = {
  items: PilotRequestSummary[];
  groups: PilotMonthGroup[];
};

export type PilotMutationResult = {
  docId: string;
  requestId: number;
};

export type OpenPilotRequestInput = {
  workflowTypeId: string;
  requesterName: string;
  formData: Record<string, unknown>;
};

export type PilotUploadInitInput = {
  workflowTypeId: string;
  fieldId: string;
  fileName: string;
  contentType: string;
};

export type PilotUploadInitResult = {
  uploadUrl: string;
  uploadMethod: 'PUT';
  uploadHeaders: Record<string, string>;
  fileUrl: string;
  storagePath: string;
  uploadId: string;
  expiresAt: string;
};

export type PilotUploadFileInput = {
  workflowTypeId: string;
  fieldId: string;
  file: File;
};

export type PilotUploadFileResult = {
  fileUrl: string;
};

export type PilotFileTransferErrorCode = 'UPLOAD_TRANSFER_FAILED';

export class PilotFileTransferError extends Error {
  code: PilotFileTransferErrorCode;
  httpStatus: number;

  constructor(
    code: PilotFileTransferErrorCode,
    httpStatus: number,
    message = 'Falha ao transferir arquivo para o Storage.',
  ) {
    super(message);
    this.name = 'PilotFileTransferError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export type AssignPilotResponsibleInput = {
  requestId: number;
  responsibleUserId: string;
  responsibleName: string;
  actorName?: string;
};

export type FinalizePilotRequestInput = {
  requestId: number;
  actorName?: string;
};

export type ArchivePilotRequestInput = {
  requestId: number;
  actorName?: string;
};

export type PilotRequestPresentation = {
  situationKey: PilotSituationKey;
  label: string;
  badgeVariant: PilotBadgeVariant;
  canAssign: boolean;
  canFinalize: boolean;
  canArchive: boolean;
};
