import type { Timestamp } from 'firebase-admin/firestore';
import type { StepKind, VersionFieldType } from '../runtime/types';

export type TimestampLike = Timestamp | null;

export type WorkflowPublishedField = {
  id: string;
  label: string;
  type: VersionFieldType;
  required: boolean;
  order: number;
  placeholder?: string;
  options?: string[];
};

export type WorkflowPublishedStep = {
  stepId: string;
  stepName: string;
  statusKey: string;
  kind: StepKind;
  order: number;
};

export type WorkflowPublishedMetadata = {
  workflowTypeId: string;
  workflowName: string;
  description: string;
  icon: string;
  areaId: string;
  version: number;
  publishedAt: TimestampLike;
  defaultSlaDays: number;
  initialStepId: string;
  initialStepName: string;
  fields: WorkflowPublishedField[];
  steps: WorkflowPublishedStep[];
};

export type WorkflowCatalogSuccess = {
  ok: true;
  data: WorkflowPublishedMetadata;
};

export type WorkflowCatalogError = {
  ok: false;
  code: string;
  message: string;
};
