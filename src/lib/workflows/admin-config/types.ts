import type {
  RuntimeErrorResponse,
  RuntimeSuccess,
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
  userId: string;
  name: string;
  email: string;
  area?: string;
  position?: string;
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

export type WorkflowDraftEditorDraft = {
  workflowTypeId: string;
  version: number;
  state: VersionState;
  derivedStatus: WorkflowConfigVersionUiStatus;
  canPublish: boolean;
  canActivate: boolean;
  isNewWorkflowType: boolean;
  general: WorkflowDraftEditorGeneral;
  access: WorkflowDraftEditorAccess;
  fields: VersionFieldDef[];
  steps: StepDef[];
  initialStepId: string;
  publishReadiness: DraftReadinessIssue[];
  meta: WorkflowDraftEditorMeta;
};

export type WorkflowDraftEditorLookups = {
  areas: WorkflowConfigAreaLookup[];
  owners: WorkflowConfigOwnerLookup[];
  collaborators: WorkflowConfigOwnerLookup[];
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
    areaId: string;
    ownerUserId: string;
    defaultSlaDays: number;
    activeOnPublish: boolean;
  };
  access: {
    mode: WorkflowConfigAccessMode;
    allowedUserIds: string[];
  };
  fields: Array<Partial<VersionFieldDef>>;
  steps: Array<Partial<StepDef>>;
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
