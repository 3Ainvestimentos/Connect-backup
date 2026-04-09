import type {
  RuntimeErrorResponse,
  RuntimeSuccess,
  StepActionDef,
  StepDef,
  VersionFieldDef,
  VersionState,
  WorkflowTypeV2,
} from '@/lib/workflows/runtime/types';

export type WorkflowConfigVersionUiStatus = 'Rascunho' | 'Publicada' | 'Inativa';
export type WorkflowConfigAccessMode = 'all' | 'specific';
export type DraftReadinessCategory = 'general' | 'access' | 'fields' | 'steps' | 'actions';

export type WorkflowConfigVersionListItem = {
  version: number;
  state: VersionState;
  uiStatus: WorkflowConfigVersionUiStatus;
  derivedStatus: WorkflowConfigVersionUiStatus;
  isActivePublished: boolean;
  canPublish: boolean;
  canActivate: boolean;
  hasBlockingIssues: boolean;
  stepCount: number;
  fieldCount: number;
  publishedAt: string | null;
  lastTransitionAt: string | null;
};

export type WorkflowConfigTypeListItem = Pick<
  WorkflowTypeV2,
  | 'workflowTypeId'
  | 'name'
  | 'description'
  | 'areaId'
  | 'ownerEmail'
  | 'ownerUserId'
  | 'active'
  | 'latestPublishedVersion'
> & {
  versionCount: number;
  publishedVersionLabel: string;
  hasPublishedVersion: boolean;
  draftVersion: number | null;
  versions: WorkflowConfigVersionListItem[];
};

export type WorkflowConfigAreaListItem = {
  areaId: string;
  name: string;
  icon: string;
  typeCount: number;
  publishedTypeCount: number;
  draftOnlyTypeCount: number;
  types: WorkflowConfigTypeListItem[];
};

export type WorkflowConfigCatalogSummary = {
  areaCount: number;
  workflowTypeCount: number;
  versionCount: number;
};

export type WorkflowConfigCatalogData = {
  areas: WorkflowConfigAreaListItem[];
  summary: WorkflowConfigCatalogSummary;
};

export type WorkflowConfigAreaLookup = {
  areaId: string;
  name: string;
  icon: string;
};

export type WorkflowConfigOwnerLookup = {
  collaboratorDocId?: string;
  userId: string;
  name: string;
  email: string;
  area?: string;
  position?: string;
};

export type WorkflowConfigCollaboratorLookup = WorkflowConfigOwnerLookup & {
  collaboratorDocId: string;
};

export type DraftReadinessIssue = {
  code: string;
  category: DraftReadinessCategory;
  severity: 'warning' | 'blocking';
  message: string;
  path?: string;
};

export type WorkflowDraftEditorGeneral = {
  name: string;
  description: string;
  icon: string;
  areaId: string;
  areaName: string;
  ownerEmail: string;
  ownerUserId: string;
  defaultSlaDays: number;
  activeOnPublish: boolean;
};

export type WorkflowDraftEditorAccess = {
  mode: WorkflowConfigAccessMode;
  allowedUserIds: string[];
  preview: string;
};

export type WorkflowDraftEditorMeta = {
  createdAt: string | null;
  updatedAt: string | null;
  latestPublishedVersion: number | null;
};

export type WorkflowDraftEditorMode = 'edit' | 'read-only';

export type WorkflowDraftEditorApprover = {
  collaboratorDocId: string;
  userId: string;
  name: string;
  email: string;
};

export type WorkflowDraftEditorStepAction = Omit<StepActionDef, 'approverIds'> & {
  approvers: WorkflowDraftEditorApprover[];
  unresolvedApproverIds?: string[];
};

export type WorkflowDraftEditorStep = Omit<StepDef, 'action'> & {
  action?: WorkflowDraftEditorStepAction;
};

export type WorkflowDraftEditorDraft = {
  workflowTypeId: string;
  version: number;
  state: VersionState;
  mode: WorkflowDraftEditorMode;
  derivedStatus: WorkflowConfigVersionUiStatus;
  canPublish: boolean;
  canActivate: boolean;
  isNewWorkflowType: boolean;
  general: WorkflowDraftEditorGeneral;
  access: WorkflowDraftEditorAccess;
  fields: VersionFieldDef[];
  steps: WorkflowDraftEditorStep[];
  initialStepId: string;
  publishReadiness: DraftReadinessIssue[];
  meta: WorkflowDraftEditorMeta;
};

export type WorkflowDraftEditorLookups = {
  areas: WorkflowConfigAreaLookup[];
  owners: WorkflowConfigOwnerLookup[];
  collaborators: WorkflowConfigCollaboratorLookup[];
};

export type WorkflowDraftEditorData = {
  draft: WorkflowDraftEditorDraft;
  lookups: WorkflowDraftEditorLookups;
};

export type CreateWorkflowAreaInput = {
  name: string;
  icon: string;
};

export type CreateWorkflowAreaResult = {
  areaId: string;
  name: string;
  icon: string;
};

export type CreateWorkflowTypeInput = {
  areaId: string;
  name: string;
  description: string;
  icon: string;
  ownerUserId: string;
  allowedUserIds: string[];
  defaultSlaDays?: number;
};

export type CreateWorkflowTypeResult = {
  workflowTypeId: string;
  version: number;
  editorPath: string;
};

export type CreateWorkflowDraftResult = {
  workflowTypeId: string;
  version: number;
  reusedExistingDraft: boolean;
  editorPath: string;
};

export type SaveWorkflowDraftInput = {
  general: {
    name: string;
    description: string;
    icon: string;
    ownerUserId: string;
    defaultSlaDays: number;
    activeOnPublish: boolean;
  };
  access: {
    mode: WorkflowConfigAccessMode;
    allowedUserIds: string[];
  };
  fields: Array<Partial<VersionFieldDef>>;
  steps: Array<
    Omit<Partial<WorkflowDraftEditorStep>, 'action'> & {
      action?: Omit<Partial<WorkflowDraftEditorStepAction>, 'approvers'> & {
        approverCollaboratorDocIds?: string[];
        unresolvedApproverIds?: string[];
      };
    }
  >;
  initialStepId: string;
};

export type SaveWorkflowDraftResult = {
  savedAt: string;
  publishReadiness: DraftReadinessIssue[];
};

export type WorkflowVersionTransitionResult = {
  workflowTypeId: string;
  version: number;
  state?: VersionState;
  latestPublishedVersion: number | null;
  publishedAt?: string | null;
  transition: 'published' | 'activated';
  catalogStatus: WorkflowConfigVersionUiStatus;
};

export type WorkflowConfigCatalogSuccess = RuntimeSuccess<WorkflowConfigCatalogData>;
export type WorkflowConfigCatalogError = RuntimeErrorResponse;

export type CreateWorkflowAreaSuccess = RuntimeSuccess<CreateWorkflowAreaResult>;
export type CreateWorkflowAreaError = RuntimeErrorResponse;

export type CreateWorkflowTypeSuccess = RuntimeSuccess<CreateWorkflowTypeResult>;
export type CreateWorkflowTypeError = RuntimeErrorResponse;

export type CreateWorkflowDraftSuccess = RuntimeSuccess<CreateWorkflowDraftResult>;
export type CreateWorkflowDraftError = RuntimeErrorResponse;

export type WorkflowDraftEditorSuccess = RuntimeSuccess<WorkflowDraftEditorData>;
export type WorkflowDraftEditorError = RuntimeErrorResponse;

export type SaveWorkflowDraftSuccess = RuntimeSuccess<SaveWorkflowDraftResult>;
export type SaveWorkflowDraftError = RuntimeErrorResponse;

export type WorkflowVersionTransitionSuccess = RuntimeSuccess<WorkflowVersionTransitionResult>;
export type WorkflowVersionTransitionError = RuntimeErrorResponse;
