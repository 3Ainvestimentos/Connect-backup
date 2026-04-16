import type {
  DraftReadinessIssue,
  WorkflowConfigAccessMode,
  WorkflowConfigAreaLookup,
  WorkflowConfigCollaboratorLookup,
  WorkflowConfigOwnerLookup,
  WorkflowDraftEditorApprover,
  WorkflowDraftEditorMode,
  WorkflowDraftEditorStep,
} from '@/lib/workflows/admin-config/types';
import type { VersionFieldDef, VersionState } from '@/lib/workflows/runtime/types';

export type WorkflowDraftFormValues = {
  general: {
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
  access: {
    mode: WorkflowConfigAccessMode;
    allowedUserIds: string[];
    preview: string;
  };
  fields: VersionFieldDef[];
  steps: WorkflowDraftEditorStep[];
};

export type WorkflowDraftEditorLookups = {
  areas: WorkflowConfigAreaLookup[];
  owners: WorkflowConfigOwnerLookup[];
  collaborators: WorkflowConfigCollaboratorLookup[];
};

export type WorkflowDraftEditorMeta = {
  workflowTypeId: string;
  version: number;
  state: VersionState;
  mode: WorkflowDraftEditorMode;
  isNewWorkflowType: boolean;
  latestPublishedVersion: number | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type WorkflowDraftReadiness = DraftReadinessIssue[];
export type WorkflowDraftApprover = WorkflowDraftEditorApprover;
export type WorkflowDraftDirtyState = {
  isDirty: boolean;
  isReadOnly: boolean;
};

export type WorkflowDraftEditorShellState = {
  submitDraft: () => void;
  publishVersion: () => void;
  isSaving: boolean;
  isPublishing: boolean;
  canPublish: boolean;
  isReadOnly: boolean;
};
