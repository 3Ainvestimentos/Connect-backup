import {
  describeCurrentStepAction,
  getPendingActionEntriesForCurrentStep,
  hasAnyActionBatchForCurrentStep,
} from './action-helpers';
import { findNextStep } from './engine';
import type { WorkflowRequestV2, WorkflowVersionV2 } from './types';

export type RequestContinuationState = {
  currentStepIsActive: boolean;
  nextStepKind: 'start' | 'work' | 'final' | null;
  hasPendingAction: boolean;
  actionConfigured: boolean;
  actionConfigurationError: string | null;
  hasAnyActionBatch: boolean;
  hasCompletedActionBatch: boolean;
  requiresCompletedActionBatch: boolean;
  canAdvanceByState: boolean;
  canFinalizeByState: boolean;
};

export function getRequestContinuationState(
  request: WorkflowRequestV2,
  version: WorkflowVersionV2,
): RequestContinuationState {
  const nextStep = findNextStep(version, request.currentStepId);
  const actionDescription = describeCurrentStepAction(version, request);
  const hasPendingAction = getPendingActionEntriesForCurrentStep(request).length > 0;
  const hasAnyActionBatch = hasAnyActionBatchForCurrentStep(request);
  const hasCompletedActionBatch = hasAnyActionBatch && !hasPendingAction;
  const requiresCompletedActionBatch = actionDescription.available;
  const currentStepIsActive = request.stepStates[request.currentStepId] === 'active';
  const actionGateSatisfied =
    !requiresCompletedActionBatch ||
    (!actionDescription.configurationError && hasCompletedActionBatch);

  return {
    currentStepIsActive,
    nextStepKind: nextStep?.kind ?? null,
    hasPendingAction,
    actionConfigured: actionDescription.available,
    actionConfigurationError: actionDescription.configurationError,
    hasAnyActionBatch,
    hasCompletedActionBatch,
    requiresCompletedActionBatch,
    canAdvanceByState:
      request.statusCategory === 'in_progress' &&
      currentStepIsActive &&
      !hasPendingAction &&
      actionGateSatisfied &&
      nextStep?.kind === 'work',
    canFinalizeByState:
      request.statusCategory === 'in_progress' &&
      currentStepIsActive &&
      !hasPendingAction &&
      actionGateSatisfied &&
      nextStep?.kind === 'final',
  };
}
