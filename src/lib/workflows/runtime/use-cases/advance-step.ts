/**
 * @fileOverview Use case: advance the request to the next step.
 *
 * Rules:
 * - Cannot advance to the final step (use finalize-request instead).
 * - In the pilot, this use case has no real happy path but exists as structural capacity.
 * - Only the responsible or owner can advance.
 */

import { Timestamp } from 'firebase-admin/firestore';
import { assertCanAdvance, advanceStepStates } from '../engine';
import { RuntimeError, RuntimeErrorCode } from '../errors';
import { buildHistoryEntry } from '../history';
import * as repo from '../repository';
import type { StatusCategory } from '../types';

export interface AdvanceStepInput {
  requestId: number;
  actorUserId: string;
  actorName: string;
}

export interface AdvanceStepResult {
  docId: string;
  requestId: number;
  newStepId: string;
  newStepName: string;
}

/**
 * Advances the request to the next non-final step.
 *
 * @param input - The input parameters.
 * @returns The updated step information.
 */
export async function advanceStep(input: AdvanceStepInput): Promise<AdvanceStepResult> {
  const result = await repo.getWorkflowRequestByRequestId(input.requestId);
  if (!result) {
    throw new RuntimeError(RuntimeErrorCode.REQUEST_NOT_FOUND, 'Chamado nao encontrado.', 404);
  }

  const { docId, data: request } = result;

  // Guard: must be in_progress
  if (request.statusCategory !== 'in_progress') {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_STEP_TRANSITION,
      `Chamado nao esta em andamento (statusCategory=${request.statusCategory}).`,
    );
  }

  // Guard: finalized or archived
  if (request.statusCategory === ('finalized' as StatusCategory) || request.statusCategory === ('archived' as StatusCategory)) {
    throw new RuntimeError(
      RuntimeErrorCode.REQUEST_ALREADY_FINALIZED,
      'Chamado ja finalizado ou arquivado.',
    );
  }

  // Authorization: responsible or owner
  const isOwner = input.actorUserId === request.ownerUserId;
  const isResponsible = request.responsibleUserId != null && input.actorUserId === request.responsibleUserId;
  if (!isOwner && !isResponsible) {
    throw new RuntimeError(
      RuntimeErrorCode.FORBIDDEN,
      'Apenas o responsavel ou o owner podem avancar o chamado.',
      403,
    );
  }

  // Load version for step validation
  const version = await repo.getWorkflowVersion(request.workflowTypeId, request.workflowVersion);
  if (!version) {
    throw new RuntimeError(
      RuntimeErrorCode.PUBLISHED_VERSION_NOT_FOUND,
      'Versao publicada nao encontrada para o chamado.',
      404,
    );
  }

  // Engine validation (will throw if next step is final)
  const nextStep = assertCanAdvance(version, request.currentStepId, request.stepStates);

  const now = Timestamp.now();
  const newStepStates = advanceStepStates(request.stepStates, request.currentStepId, nextStep.stepId);

  const historyEntries = [
    buildHistoryEntry(
      'step_completed',
      input.actorUserId,
      input.actorName,
      {
        stepId: request.currentStepId,
        stepName: request.currentStepName,
      },
      now,
    ),
    buildHistoryEntry(
      'entered_step',
      input.actorUserId,
      input.actorName,
      {
        stepId: nextStep.stepId,
        stepName: nextStep.stepName,
        statusKey: nextStep.statusKey,
      },
      now,
    ),
  ];

  await repo.updateWorkflowRequestWithHistory(
    docId,
    {
      stepStates: newStepStates,
      currentStepId: nextStep.stepId,
      currentStepName: nextStep.stepName,
      currentStatusKey: nextStep.statusKey,
      statusCategory: 'in_progress',
      lastUpdatedAt: now,
    },
    historyEntries,
  );

  return {
    docId,
    requestId: input.requestId,
    newStepId: nextStep.stepId,
    newStepName: nextStep.stepName,
  };
}
