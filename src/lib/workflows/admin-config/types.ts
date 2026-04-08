import type { RuntimeErrorResponse, RuntimeSuccess, VersionState, WorkflowTypeV2 } from '@/lib/workflows/runtime/types';

export type WorkflowConfigVersionUiStatus = 'Rascunho' | 'Publicada' | 'Inativa';

export type WorkflowConfigVersionListItem = {
  version: number;
  state: VersionState;
  uiStatus: WorkflowConfigVersionUiStatus;
  isActivePublished: boolean;
  stepCount: number;
  fieldCount: number;
  publishedAt: string | null;
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

export type WorkflowConfigCatalogSuccess = RuntimeSuccess<WorkflowConfigCatalogData>;
export type WorkflowConfigCatalogError = RuntimeErrorResponse;
