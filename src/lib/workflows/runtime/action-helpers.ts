import { RuntimeError, RuntimeErrorCode } from './errors';
import type {
  StepActionDef,
  StepDef,
  WorkflowActionRequest,
  WorkflowActionRequestStatus,
  WorkflowRequestV2,
  WorkflowVersionV2,
} from './types';

export type StepActionDescription =
  | {
      available: false;
      step: StepDef;
      action: null;
      approverIds: [];
      commentRequired: false;
      attachmentRequired: false;
      commentPlaceholder: null;
      attachmentPlaceholder: null;
      configurationError: null;
    }
  | {
      available: true;
      step: StepDef;
      action: StepActionDef;
      approverIds: string[];
      commentRequired: boolean;
      attachmentRequired: boolean;
      commentPlaceholder: string | null;
      attachmentPlaceholder: string | null;
      configurationError: string | null;
    };

function normalizeApproverIds(rawApproverIds: unknown): {
  approverIds: string[];
  configurationError: string | null;
} {
  if (!Array.isArray(rawApproverIds)) {
    return {
      approverIds: [],
      configurationError: 'A etapa atual nao possui approverIds validos para abrir a action.',
    };
  }

  const approverIds = rawApproverIds.map((entry) =>
    typeof entry === 'string' ? entry.trim() : '',
  );

  if (approverIds.length === 0 || approverIds.some((entry) => entry === '')) {
    return {
      approverIds: [],
      configurationError: 'A etapa atual nao possui approverIds validos para abrir a action.',
    };
  }

  if (new Set(approverIds).size !== approverIds.length) {
    return {
      approverIds,
      configurationError: 'A etapa atual possui approverIds duplicados e nao pode abrir a action.',
    };
  }

  return {
    approverIds,
    configurationError: null,
  };
}

export function getCurrentStepDefinition(
  version: WorkflowVersionV2,
  request: Pick<WorkflowRequestV2, 'currentStepId'>,
): StepDef {
  const step = version.stepsById[request.currentStepId];

  if (!step) {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_PUBLISHED_VERSION,
      `Versao publicada inconsistente: etapa "${request.currentStepId}" nao encontrada.`,
      500,
    );
  }

  return step;
}

export function describeCurrentStepAction(
  version: WorkflowVersionV2,
  request: Pick<WorkflowRequestV2, 'currentStepId'>,
): StepActionDescription {
  const step = getCurrentStepDefinition(version, request);

  if (!step.action) {
    return {
      available: false,
      step,
      action: null,
      approverIds: [],
      commentRequired: false,
      attachmentRequired: false,
      commentPlaceholder: null,
      attachmentPlaceholder: null,
      configurationError: null,
    };
  }

  const { approverIds, configurationError } = normalizeApproverIds(step.action.approverIds);

  return {
    available: true,
    step,
    action: step.action,
    approverIds,
    commentRequired: step.action.commentRequired === true,
    attachmentRequired: step.action.attachmentRequired === true,
    commentPlaceholder: step.action.commentPlaceholder?.trim() || null,
    attachmentPlaceholder: step.action.attachmentPlaceholder?.trim() || null,
    configurationError,
  };
}

export function assertCurrentStepActionConfigured(
  version: WorkflowVersionV2,
  request: Pick<WorkflowRequestV2, 'currentStepId'>,
): Extract<StepActionDescription, { available: true }> {
  const description = describeCurrentStepAction(version, request);

  if (!description.available || description.configurationError) {
    throw new RuntimeError(
      RuntimeErrorCode.ACTION_CONFIGURATION_INVALID,
      description.configurationError ??
        'A etapa atual nao possui uma action configurada para este chamado.',
      400,
    );
  }

  return description;
}

export function getPendingActionEntriesForCurrentStep(
  request: Pick<WorkflowRequestV2, 'currentStepId' | 'actionRequests'>,
): WorkflowActionRequest[] {
  return (request.actionRequests ?? []).filter(
    (entry) => entry.stepId === request.currentStepId && entry.status === 'pending',
  );
}

export function getCurrentPendingActionBatchEntries(
  request: Pick<WorkflowRequestV2, 'currentStepId' | 'actionRequests'>,
): WorkflowActionRequest[] {
  const pendingEntries = getPendingActionEntriesForCurrentStep(request);

  if (pendingEntries.length === 0) {
    return [];
  }

  const pendingBatchId = pendingEntries[0].actionBatchId;

  return (request.actionRequests ?? []).filter(
    (entry) => entry.stepId === request.currentStepId && entry.actionBatchId === pendingBatchId,
  );
}

export function hasAnyActionBatchForCurrentStep(
  request: Pick<WorkflowRequestV2, 'currentStepId' | 'actionRequests'>,
): boolean {
  return (request.actionRequests ?? []).some((entry) => entry.stepId === request.currentStepId);
}

export function getDisplayActionBatchEntriesForCurrentStep(
  request: Pick<WorkflowRequestV2, 'currentStepId' | 'actionRequests'>,
): WorkflowActionRequest[] {
  const pendingEntries = getPendingActionEntriesForCurrentStep(request);

  if (pendingEntries.length > 0) {
    const pendingBatchId = pendingEntries[0].actionBatchId;

    return (request.actionRequests ?? []).filter(
      (entry) => entry.stepId === request.currentStepId && entry.actionBatchId === pendingBatchId,
    );
  }

  const actionRequests = request.actionRequests ?? [];
  for (let index = actionRequests.length - 1; index >= 0; index -= 1) {
    const entry = actionRequests[index];
    if (entry.stepId !== request.currentStepId) {
      continue;
    }

    return actionRequests.filter(
      (candidate) =>
        candidate.stepId === request.currentStepId &&
        candidate.actionBatchId === entry.actionBatchId,
    );
  }

  return [];
}

export function findPendingActionForActor(
  request: Pick<WorkflowRequestV2, 'currentStepId' | 'actionRequests'>,
  actorUserId: string,
): WorkflowActionRequest | null {
  return (
    request.actionRequests?.find(
      (entry) =>
        entry.stepId === request.currentStepId &&
        entry.recipientUserId === actorUserId &&
        entry.status === 'pending',
    ) ?? null
  );
}

export function mapActionResponseToStatus(
  response: 'approved' | 'rejected' | 'acknowledged' | 'executed',
): WorkflowActionRequestStatus {
  switch (response) {
    case 'approved':
      return 'approved';
    case 'rejected':
      return 'rejected';
    case 'acknowledged':
      return 'acknowledged';
    case 'executed':
      return 'executed';
    default:
      throw new Error(`Resposta de action nao suportada: ${response}`);
  }
}
