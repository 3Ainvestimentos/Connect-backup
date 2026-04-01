/**
 * @fileOverview Authorization helpers for the v2 workflow runtime.
 */

import { RuntimeError, RuntimeErrorCode } from './errors';
import type { WorkflowRequestV2, WorkflowTypeV2 } from './types';

/**
 * Validates that the user is allowed to open a request for the given workflow type.
 *
 * @param workflowType - The workflow type document.
 * @param userId - The authenticated user's operational `id3a`.
 * @throws {RuntimeError} If the workflow type is inactive or the user is not allowed.
 */
export function assertCanOpen(workflowType: WorkflowTypeV2, userId: string): void {
  if (!workflowType.active) {
    throw new RuntimeError(
      RuntimeErrorCode.WORKFLOW_TYPE_INACTIVE,
      `O tipo de workflow "${workflowType.name}" esta inativo e nao aceita novas solicitacoes.`,
    );
  }

  const allowed = workflowType.allowedUserIds;
  if (!allowed.includes('all') && !allowed.includes(userId)) {
    throw new RuntimeError(
      RuntimeErrorCode.FORBIDDEN,
      'Usuario nao possui permissao para abrir solicitacoes neste tipo de workflow.',
      403,
    );
  }
}

/**
 * Validates that the actor can assign a responsible to the request.
 * Only the owner of the workflow type can assign/reassign.
 *
 * @param ownerUserId - The ownerUserId from the workflow type.
 * @param actorUserId - The operational `id3a` of the user attempting the action.
 */
export function assertCanAssign(ownerUserId: string, actorUserId: string): void {
  if (actorUserId !== ownerUserId) {
    throw new RuntimeError(
      RuntimeErrorCode.FORBIDDEN,
      'Apenas o owner do tipo de workflow pode atribuir um responsavel.',
      403,
    );
  }
}

/**
 * Validates that the actor can finalize a request.
 * Allowed actors: current responsible OR the owner (as operational exception).
 *
 * @param ownerUserId - The ownerUserId from the workflow type.
 * @param responsibleUserId - The current responsible on the request (may be null).
 * @param actorUserId - The operational `id3a` of the user attempting finalization.
 */
export function assertCanFinalize(
  ownerUserId: string,
  responsibleUserId: string | null,
  actorUserId: string,
): void {
  const isOwner = actorUserId === ownerUserId;
  const isResponsible = responsibleUserId != null && actorUserId === responsibleUserId;

  if (!isOwner && !isResponsible) {
    throw new RuntimeError(
      RuntimeErrorCode.FINALIZATION_NOT_ALLOWED,
      'Apenas o responsavel atual ou o owner podem finalizar o chamado.',
    );
  }
}

/**
 * Validates that the actor can archive a request.
 * Only the owner can archive.
 *
 * @param ownerUserId - The ownerUserId from the request document.
 * @param actorUserId - The operational `id3a` of the user attempting archival.
 */
export function assertCanArchive(ownerUserId: string, actorUserId: string): void {
  if (actorUserId !== ownerUserId) {
    throw new RuntimeError(
      RuntimeErrorCode.FORBIDDEN,
      'Apenas o owner do tipo de workflow pode arquivar um chamado.',
      403,
    );
  }
}

/**
 * Validates that the actor can read the request detail.
 * Allowed actors: owner, requester, current responsible, pending-action recipient,
 * or any tracked operational participant.
 *
 * @param request - The request document to be read.
 * @param actorUserId - The operational `id3a` of the current actor.
 */
export function assertCanReadRequest(request: WorkflowRequestV2, actorUserId: string): void {
  const isOwner = request.ownerUserId === actorUserId;
  const isRequester = request.requesterUserId === actorUserId;
  const isResponsible =
    request.responsibleUserId != null && request.responsibleUserId === actorUserId;
  const isPendingActionRecipient = request.pendingActionRecipientIds.includes(actorUserId);
  const isOperationalParticipant = request.operationalParticipantIds.includes(actorUserId);

  if (
    !isOwner &&
    !isRequester &&
    !isResponsible &&
    !isPendingActionRecipient &&
    !isOperationalParticipant
  ) {
    throw new RuntimeError(
      RuntimeErrorCode.FORBIDDEN,
      'Usuario nao possui permissao para ler este chamado.',
      403,
    );
  }
}
