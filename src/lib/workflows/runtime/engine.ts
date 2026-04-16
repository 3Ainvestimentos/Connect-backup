/**
 * @fileOverview Step-machine engine helpers for the v2 workflow runtime.
 *
 * These functions handle step state transitions without touching Firestore directly.
 */

import type { StepDef, StepState, WorkflowVersionV2 } from './types';
import { RuntimeError, RuntimeErrorCode } from './errors';

/**
 * Builds the initial `stepStates` map for a newly opened request.
 * The initial step is set to `active`; all others are `pending`.
 *
 * @param version - The published version definition.
 * @returns A `stepStates` record keyed by stepId.
 */
export function buildInitialStepStates(version: WorkflowVersionV2): Record<string, StepState> {
  const states: Record<string, StepState> = {};
  for (const stepId of version.stepOrder) {
    states[stepId] = stepId === version.initialStepId ? 'active' : 'pending';
  }
  return states;
}

/**
 * Finds the next step in `stepOrder` after the given current step.
 *
 * @returns The next StepDef or null if the current step is the last.
 */
export function findNextStep(
  version: WorkflowVersionV2,
  currentStepId: string,
): StepDef | null {
  const idx = version.stepOrder.indexOf(currentStepId);
  if (idx === -1 || idx >= version.stepOrder.length - 1) return null;
  const nextId = version.stepOrder[idx + 1];
  return version.stepsById[nextId] ?? null;
}

/**
 * Finds the final step (kind === 'final') from the version definition.
 */
export function findFinalStep(version: WorkflowVersionV2): StepDef | null {
  for (const stepId of version.stepOrder) {
    const step = version.stepsById[stepId];
    if (step?.kind === 'final') return step;
  }
  return null;
}

/**
 * Finds the first in-progress step (kind === 'work') from the version definition.
 * Multiple work steps are allowed; the first one is the assignment target.
 */
export function findWorkStep(version: WorkflowVersionV2): StepDef | null {
  for (const stepId of version.stepOrder) {
    const step = version.stepsById[stepId];
    if (step?.kind === 'work') return step;
  }
  return null;
}

/**
 * Validates that an advance from the current step is allowed.
 *
 * Rules:
 * - The current step must be active in `stepStates`.
 * - The next step must not be of kind `final` (use finalize-request instead).
 *
 * @throws {RuntimeError} If the transition is invalid.
 */
export function assertCanAdvance(
  version: WorkflowVersionV2,
  currentStepId: string,
  stepStates: Record<string, StepState>,
): StepDef {
  if (stepStates[currentStepId] !== 'active') {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_STEP_TRANSITION,
      'A etapa atual nao esta ativa.',
    );
  }

  const nextStep = findNextStep(version, currentStepId);
  if (!nextStep) {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_STEP_TRANSITION,
      'Nao existe proxima etapa para avancar.',
    );
  }

  if (nextStep.kind === 'final') {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_STEP_TRANSITION,
      'A proxima etapa e a etapa final. Use finalize-request para concluir o chamado.',
    );
  }

  return nextStep;
}

/**
 * Produces updated `stepStates` after an advance.
 */
export function advanceStepStates(
  stepStates: Record<string, StepState>,
  fromStepId: string,
  toStepId: string,
): Record<string, StepState> {
  return {
    ...stepStates,
    [fromStepId]: 'completed',
    [toStepId]: 'active',
  };
}

/**
 * Produces updated `stepStates` after finalization.
 * Marks the current step as completed and the final step as completed.
 */
export function finalizeStepStates(
  stepStates: Record<string, StepState>,
  currentStepId: string,
  finalStepId: string,
): Record<string, StepState> {
  return {
    ...stepStates,
    [currentStepId]: 'completed',
    [finalStepId]: 'completed',
  };
}
