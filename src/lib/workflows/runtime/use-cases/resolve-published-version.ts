/**
 * @fileOverview Use case: resolve the published version for a workflow type.
 *
 * Reads `latestPublishedVersion` from the workflow type document,
 * then loads and validates the corresponding version sub-document.
 */

import { RuntimeError, RuntimeErrorCode } from '../errors';
import * as repo from '../repository';
import type { WorkflowTypeV2, WorkflowVersionV2 } from '../types';

export interface ResolvedVersion {
  workflowType: WorkflowTypeV2;
  version: WorkflowVersionV2;
}

/**
 * Resolves the latest published version for a given workflow type.
 *
 * @param workflowTypeId - The ID of the workflow type.
 * @returns The workflow type document and the published version document.
 * @throws {RuntimeError} If the type is not found, inactive, or the version is missing/invalid.
 */
export async function resolvePublishedVersion(
  workflowTypeId: string,
): Promise<ResolvedVersion> {
  const workflowType = await repo.getWorkflowType(workflowTypeId);

  if (!workflowType) {
    throw new RuntimeError(
      RuntimeErrorCode.PUBLISHED_VERSION_NOT_FOUND,
      `Tipo de workflow "${workflowTypeId}" nao encontrado.`,
      404,
    );
  }

  const versionNumber = workflowType.latestPublishedVersion;
  if (!versionNumber || versionNumber < 1) {
    throw new RuntimeError(
      RuntimeErrorCode.PUBLISHED_VERSION_NOT_FOUND,
      `Tipo de workflow "${workflowTypeId}" nao possui versao publicada.`,
      404,
    );
  }

  const version = await repo.getWorkflowVersion(workflowTypeId, versionNumber);

  if (!version) {
    throw new RuntimeError(
      RuntimeErrorCode.PUBLISHED_VERSION_NOT_FOUND,
      `Versao ${versionNumber} do tipo "${workflowTypeId}" nao encontrada.`,
      404,
    );
  }

  if (version.state !== 'published') {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_PUBLISHED_VERSION,
      `Versao ${versionNumber} do tipo "${workflowTypeId}" nao esta publicada (state=${version.state}).`,
    );
  }

  return { workflowType, version };
}
