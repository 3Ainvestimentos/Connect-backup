import type { StepDef, VersionFieldDef } from '@/lib/workflows/runtime/types';
import type { DraftReadinessIssue, WorkflowConfigAccessMode, WorkflowConfigAreaLookup, WorkflowConfigOwnerLookup } from '@/lib/workflows/admin-config/types';

export type WorkflowDraftFormValues = {
  general: {
    name: string;
    description: string;
    icon: string;
    areaId: string;
    ownerEmail: string;
    ownerUserId: string;
    defaultSlaDays: number;
    activeOnPublish: boolean;
  };
  access: {
    mode: WorkflowConfigAccessMode;
    allowedUserIds: string[];
  };
  fields: VersionFieldDef[];
  steps: StepDef[];
  initialStepId: string;
};

export type WorkflowDraftEditorLookups = {
  areas: WorkflowConfigAreaLookup[];
  owners: WorkflowConfigOwnerLookup[];
};

export type WorkflowDraftEditorMeta = {
  workflowTypeId: string;
  version: number;
  state: 'draft' | 'published';
  isNewWorkflowType: boolean;
  latestPublishedVersion: number | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type WorkflowDraftReadiness = DraftReadinessIssue[];
