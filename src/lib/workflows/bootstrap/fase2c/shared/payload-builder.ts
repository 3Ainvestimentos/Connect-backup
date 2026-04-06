import { Timestamp } from 'firebase-admin/firestore';
import type { WorkflowTypeV2, WorkflowVersionV2 } from '@/lib/workflows/runtime/types';
import { normalizeFields } from './field-normalization';
import { resolveOwner } from './owner-resolution';
import { assertLegacyAreaExists, assertUniqueWorkflowTypeIds, loadLegacyWorkflow } from './source';
import { normalizeStatuses } from './status-normalization';
import type { BuildSeedPayload, CollaboratorRecord, Fase2cManifestEntry } from './types';

function trimIfNeeded(
  value: string,
  label: string,
  target: string,
  sanitizations: string[],
): string {
  const trimmed = value.trim();

  if (trimmed !== value) {
    sanitizations.push(`${label} trimmed: "${target}"`);
  }

  return trimmed;
}

export function buildSeedPayloadsForLot(
  manifest: Fase2cManifestEntry[],
  collaborators: CollaboratorRecord[],
  now: Timestamp = Timestamp.now(),
): BuildSeedPayload[] {
  assertUniqueWorkflowTypeIds(manifest);

  return manifest.map((entry) => {
    const legacy = loadLegacyWorkflow(entry.legacyWorkflowId);
    assertLegacyAreaExists(legacy.areaId);

    const owner = resolveOwner(entry, legacy.ownerEmail, collaborators);
    const normalizedFields = normalizeFields(entry, legacy.fields ?? []);
    const normalizedStatuses = normalizeStatuses(entry, legacy.statuses ?? []);
    const sanitizations = [
      ...normalizedFields.sanitizations,
      ...normalizedStatuses.sanitizations,
    ];

    const name = trimIfNeeded(legacy.name, 'workflow.name', entry.workflowTypeId, sanitizations);
    const description = trimIfNeeded(
      legacy.description,
      'workflow.description',
      entry.workflowTypeId,
      sanitizations,
    );
    const icon = trimIfNeeded(legacy.icon, 'workflow.icon', entry.workflowTypeId, sanitizations);

    if (owner.ownerEmailResolved !== owner.ownerEmailLegacy) {
      sanitizations.push(
        `owner.email normalized: "${owner.ownerEmailLegacy}" -> "${owner.ownerEmailResolved}"`,
      );
    }

    const typePayload: WorkflowTypeV2 = {
      workflowTypeId: entry.workflowTypeId,
      name,
      description,
      icon,
      areaId: legacy.areaId,
      ownerEmail: owner.ownerEmailResolved,
      ownerUserId: owner.ownerUserId,
      allowedUserIds: [...legacy.allowedUserIds],
      active: entry.lotStatus === 'enabled',
      latestPublishedVersion: 1,
      createdAt: now,
      updatedAt: now,
    };

    const versionPayload: WorkflowVersionV2 = {
      workflowTypeId: entry.workflowTypeId,
      version: 1,
      state: 'published',
      ownerEmailAtPublish: owner.ownerEmailResolved,
      defaultSlaDays: legacy.defaultSlaDays,
      fields: normalizedFields.fields,
      initialStepId: normalizedStatuses.initialStepId,
      stepOrder: normalizedStatuses.stepOrder,
      stepsById: normalizedStatuses.stepsById,
      publishedAt: now,
    };

    return {
      workflowTypeId: entry.workflowTypeId,
      typePayload,
      versionPayload,
      reportItem: {
        lotId: entry.lotId,
        legacyWorkflowId: entry.legacyWorkflowId,
        workflowTypeId: entry.workflowTypeId,
        name,
        areaId: legacy.areaId,
        ownerEmailLegacy: owner.ownerEmailLegacy,
        ownerEmailResolved: owner.ownerEmailResolved,
        ownerUserId: owner.ownerUserId,
        lotStatus: entry.lotStatus,
        workflowTypeDocPath: `workflowTypes_v2/${entry.workflowTypeId}`,
        versionDocPath: `workflowTypes_v2/${entry.workflowTypeId}/versions/1`,
        fieldsSummary: normalizedFields.fields.map((field) => ({
          id: field.id,
          type: field.type,
          required: field.required,
        })),
        statusesSummary: normalizedStatuses.statusesSummary,
        sanitizations,
      },
    };
  });
}

