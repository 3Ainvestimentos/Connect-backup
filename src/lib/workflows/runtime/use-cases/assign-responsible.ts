/**
 * @fileOverview Use case: assign or reassign a responsible to a workflow request.
 *
 * Rules:
 * - Only the owner can assign.
 * - First assignment transitions from 'open' (Solicitacao Aberta) to 'in_progress' (Em andamento).
 * - Defensively reject if statusCategory is 'waiting_action' in Etapa 1.
 * - Cannot assign to archived or finalized requests.
 */

import { Timestamp } from 'firebase-admin/firestore';
import { assertCanAssign } from '../authz';
import { findWorkStep } from '../engine';
import { RuntimeError, RuntimeErrorCode } from '../errors';
import { buildHistoryEntry } from '../history';
import { buildAssignReadModelUpdate } from '../read-model';
import * as repo from '../repository';
import type { StatusCategory, WorkflowVersionV2 } from '../types';

export interface AssignResponsibleInput {
  requestId: number;
  responsibleUserId: string;
  responsibleName: string;
  actorUserId: string;
  actorName: string;
}

export interface AssignResponsibleResult {
  docId: string;
  requestId: number;
}

/**
 * Assigns (or reassigns) a responsible user to a workflow request.
 *
 * @param input - The input parameters.
 * @param resolveVersion - Callback to fetch the version definition (for step lookup).
 * @returns The document ID and request ID.
 */
export async function assignResponsible(
  input: AssignResponsibleInput,
  resolveVersion?: (typeId: string, ver: number) => Promise<WorkflowVersionV2 | null>,
): Promise<AssignResponsibleResult> {
  const result = await repo.getWorkflowRequestByRequestId(input.requestId);
  if (!result) {
    throw new RuntimeError(RuntimeErrorCode.REQUEST_NOT_FOUND, 'Chamado nao encontrado.', 404);
  }

  const { docId, data: request } = result;

  // Guard: already finalized or archived
  if (request.statusCategory === 'finalized' || request.statusCategory === 'archived') {
    throw new RuntimeError(
      RuntimeErrorCode.REQUEST_ALREADY_FINALIZED,
      'Nao e possivel atribuir responsavel a um chamado finalizado ou arquivado.',
    );
  }

  // Guard: defensively reject waiting_action in Etapa 1
  if (request.statusCategory === 'waiting_action') {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_STEP_TRANSITION,
      'Nao e possivel atribuir responsavel enquanto existem acoes pendentes.',
    );
  }

  // Authorization: only owner can assign
  assertCanAssign(request.ownerUserId, input.actorUserId);

  // Validate responsible
  if (!input.responsibleUserId || input.responsibleUserId.trim() === '') {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_RESPONSIBLE,
      'O ID do responsavel e obrigatorio.',
    );
  }

  const now = Timestamp.now();
  const isFirstAssignment = !request.responsibleUserId;

  // If transitioning from open -> in_progress, resolve the 'work' step
  let inProgressStepId: string | undefined;
  let inProgressStepName: string | undefined;
  let inProgressStatusKey: string | undefined;

  if (request.statusCategory === 'open') {
    const versionFetcher = resolveVersion ?? repo.getWorkflowVersion;
    const version = await versionFetcher(request.workflowTypeId, request.workflowVersion);

    if (!version) {
      throw new RuntimeError(
        RuntimeErrorCode.PUBLISHED_VERSION_NOT_FOUND,
        'Versao publicada nao encontrada para materializar a primeira atribuicao.',
        404,
      );
    }

    const workStep = findWorkStep(version);
    if (!workStep) {
      throw new RuntimeError(
        RuntimeErrorCode.INVALID_PUBLISHED_VERSION,
        'Versao publicada nao possui a etapa canonica "Em andamento".',
      );
    }

    inProgressStepId = workStep.stepId;
    inProgressStepName = workStep.stepName;
    inProgressStatusKey = workStep.statusKey;
  }

  // Build read-model update
  const readModelUpdate = buildAssignReadModelUpdate({
    responsibleUserId: input.responsibleUserId,
    responsibleName: input.responsibleName,
    currentStatusCategory: request.statusCategory as StatusCategory,
    existingParticipantIds: request.operationalParticipantIds ?? [],
    inProgressStepId,
    inProgressStepName,
    inProgressStatusKey,
    now,
  });

  // Build step state updates if transitioning
  const stepStateUpdates: Record<string, unknown> = {};
  if (request.statusCategory === 'open' && inProgressStepId) {
    stepStateUpdates[`stepStates.${request.currentStepId}`] = 'completed';
    stepStateUpdates[`stepStates.${inProgressStepId}`] = 'active';
  }

  // History entry
  const historyEntry = buildHistoryEntry(
    isFirstAssignment ? 'responsible_assigned' : 'responsible_reassigned',
    input.actorUserId,
    input.actorName,
    {
      responsibleUserId: input.responsibleUserId,
      responsibleName: input.responsibleName,
      transitionedToInProgress: request.statusCategory === 'open',
    },
    now,
  );

  await repo.updateWorkflowRequestWithHistory(
    docId,
    {
      ...readModelUpdate,
      ...stepStateUpdates,
    },
    historyEntry,
  );

  return { docId, requestId: input.requestId };
}
