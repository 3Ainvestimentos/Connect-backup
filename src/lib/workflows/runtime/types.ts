/**
 * @fileOverview Core types for the v2 workflow runtime engine.
 *
 * All collections referenced here map to the Fase 1 parallel collections:
 * - workflowTypes_v2
 * - workflowTypes_v2/{workflowTypeId}/versions/{version}
 * - workflows_v2
 * - counters/workflowCounter_v2
 */

import { Timestamp } from 'firebase-admin/firestore';

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** Possible states for a step inside a running request. */
export type StepState = 'pending' | 'active' | 'completed' | 'skipped';

/** High-level lifecycle category for the request document (read-model). */
export type StatusCategory = 'open' | 'in_progress' | 'waiting_action' | 'finalized' | 'archived';

/** Semantic kind of a step inside a published version. */
export type StepKind = 'start' | 'work' | 'final';

/** State of a version document. */
export type VersionState = 'draft' | 'published';

/** Supported form field types in a published workflow version. */
export type VersionFieldType = 'text' | 'textarea' | 'select' | 'date' | 'date-range' | 'file';

/** Supported runtime history actions for Etapa 1. */
export type HistoryAction =
  | 'request_opened'
  | 'responsible_assigned'
  | 'responsible_reassigned'
  | 'step_completed'
  | 'entered_step'
  | 'request_finalized'
  | 'request_archived';

// ---------------------------------------------------------------------------
// workflowTypes_v2/{workflowTypeId}
// ---------------------------------------------------------------------------

export interface WorkflowTypeV2 {
  workflowTypeId: string;
  name: string;
  description: string;
  icon: string;
  areaId: string;
  ownerEmail: string;
  /** Operational owner identity (`id3a`), never Firebase `authUid`. */
  ownerUserId: string;
  allowedUserIds: string[];
  active: boolean;
  latestPublishedVersion: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ---------------------------------------------------------------------------
// workflowTypes_v2/{workflowTypeId}/versions/{version}
// ---------------------------------------------------------------------------

export interface VersionFieldDef {
  id: string;
  label: string;
  type: VersionFieldType;
  required: boolean;
  order: number;
  placeholder?: string;
  options?: string[];
}

export interface StepActionDef {
  type: 'approval' | 'acknowledgement' | 'execution';
  label: string;
  approverIds?: string[];
  commentRequired?: boolean;
  commentPlaceholder?: string;
  attachmentPlaceholder?: string;
}

export interface StepDef {
  stepId: string;
  stepName: string;
  statusKey: string;
  kind: StepKind;
  action?: StepActionDef;
}

export interface WorkflowVersionV2 {
  workflowTypeId: string;
  version: number;
  state: VersionState;
  ownerEmailAtPublish: string;
  defaultSlaDays: number;
  fields: VersionFieldDef[];
  initialStepId: string;
  stepOrder: string[];
  stepsById: Record<string, StepDef>;
  publishedAt: Timestamp;
}

// ---------------------------------------------------------------------------
// workflows_v2/{docId} -- the operational request document
// ---------------------------------------------------------------------------

export interface HistoryEntry {
  action: HistoryAction;
  timestamp: Timestamp;
  userId: string;
  userName: string;
  details?: Record<string, unknown>;
}

export interface WorkflowRequestV2 {
  // --- core identity ---
  requestId: number;
  workflowTypeId: string;
  workflowVersion: number;

  // --- form data ---
  formData: Record<string, unknown>;

  // --- step machine ---
  stepStates: Record<string, StepState>;
  history: HistoryEntry[];

  // --- read-model backbone (written by Etapa 1, consumed by Etapa 2) ---
  workflowName: string;
  areaId: string;
  ownerEmail: string;
  /** Operational owner identity (`id3a`). */
  ownerUserId: string;
  /** Operational requester identity (`id3a`). */
  requesterUserId: string;
  requesterName: string;
  /** Operational responsible identity (`id3a`). */
  responsibleUserId: string | null;
  responsibleName: string | null;
  currentStepId: string;
  currentStepName: string;
  currentStatusKey: string;
  statusCategory: StatusCategory;
  hasResponsible: boolean;
  hasPendingActions: boolean;
  pendingActionRecipientIds: string[];
  pendingActionTypes: string[];
  /** Operational participants tracked only with `id3a`. */
  operationalParticipantIds: string[];
  slaDays: number;
  expectedCompletionAt: Timestamp | null;
  lastUpdatedAt: Timestamp;
  finalizedAt: Timestamp | null;
  closedAt: Timestamp | null;
  archivedAt: Timestamp | null;
  submittedAt: Timestamp;
  submittedMonthKey: string;
  closedMonthKey: string | null;
  isArchived: boolean;
}

// ---------------------------------------------------------------------------
// API response envelope
// ---------------------------------------------------------------------------

export type RuntimeSuccess<T> = {
  ok: true;
  data: T;
};

export type RuntimeErrorResponse = {
  ok: false;
  code: string;
  message: string;
};
