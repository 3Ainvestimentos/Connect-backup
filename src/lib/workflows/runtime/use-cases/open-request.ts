/**
 * @fileOverview Use case: open a new workflow request.
 *
 * Transactional flow:
 * 1. Resolve published version.
 * 2. Validate user access.
 * 3. Normalize form data.
 * 4. Generate sequential requestId + create document inside a transaction.
 */

import { Timestamp } from 'firebase-admin/firestore';
import { assertCanOpen } from '../authz';
import { buildInitialStepStates } from '../engine';
import { buildHistoryEntry } from '../history';
import { normalizeFormData } from '../input-normalization';
import { buildOpenReadModel } from '../read-model';
import * as repo from '../repository';
import type { WorkflowRequestV2 } from '../types';
import { resolvePublishedVersion } from './resolve-published-version';

export interface OpenRequestInput {
  workflowTypeId: string;
  formData: Record<string, unknown>;
  requesterUserId: string;
  requesterName: string;
}

export interface OpenRequestResult {
  requestId: number;
  docId: string;
}

/**
 * Opens a new workflow request.
 *
 * @param input - The input parameters.
 * @returns The generated request ID and Firestore document ID.
 */
export async function openRequest(input: OpenRequestInput): Promise<OpenRequestResult> {
  const { workflowType, version } = await resolvePublishedVersion(input.workflowTypeId);

  // Authorization
  assertCanOpen(workflowType, input.requesterUserId);

  // Normalize form data (centrodecusto -> centro_custo)
  const normalizedFormData = normalizeFormData(input.formData);

  // Resolve initial step
  const initialStep = version.stepsById[version.initialStepId];
  const now = Timestamp.now();

  // Build step states
  const stepStates = buildInitialStepStates(version);

  // Build history
  const history = [
    buildHistoryEntry('request_opened', input.requesterUserId, input.requesterName, {
      workflowTypeId: input.workflowTypeId,
      workflowVersion: version.version,
    }, now),
  ];

  // Build read-model fields
  const readModel = buildOpenReadModel({
    workflowName: workflowType.name,
    areaId: workflowType.areaId,
    ownerEmail: workflowType.ownerEmail,
    ownerUserId: workflowType.ownerUserId,
    requesterUserId: input.requesterUserId,
    requesterName: input.requesterName,
    currentStepId: version.initialStepId,
    currentStepName: initialStep.stepName,
    currentStatusKey: initialStep.statusKey,
    slaDays: version.defaultSlaDays,
    submittedAt: now,
  });

  // Build payload (without requestId - it will be generated in the transaction)
  const payload: Omit<WorkflowRequestV2, 'requestId'> = {
    workflowTypeId: input.workflowTypeId,
    workflowVersion: version.version,
    formData: normalizedFormData,
    stepStates,
    history,
    submittedAt: now,
    ...readModel,
  } as Omit<WorkflowRequestV2, 'requestId'>;

  // Transactional creation
  const { requestId, docId } = await repo.createRequestTransactionally(payload);

  return { requestId, docId };
}
