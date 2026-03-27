import { assertCanOpen } from '@/lib/workflows/runtime/authz';
import { RuntimeError, RuntimeErrorCode } from '@/lib/workflows/runtime/errors';
import { resolvePublishedVersion } from '@/lib/workflows/runtime/use-cases/resolve-published-version';
import type { VersionFieldDef } from '@/lib/workflows/runtime/types';
import type { WorkflowPublishedField, WorkflowPublishedMetadata } from './types';

function mapPublishedField(field: VersionFieldDef): WorkflowPublishedField {
  const mapped: WorkflowPublishedField = {
    id: field.id,
    label: field.label,
    type: field.type,
    required: field.required,
    order: field.order,
  };

  if (typeof field.placeholder === 'string' && field.placeholder.trim() !== '') {
    mapped.placeholder = field.placeholder;
  }

  if (Array.isArray(field.options) && field.options.length > 0) {
    mapped.options = [...field.options];
  }

  return mapped;
}

export async function getPublishedWorkflowMetadata(params: {
  workflowTypeId: string;
  actorUserId: string;
}): Promise<WorkflowPublishedMetadata> {
  const { workflowType, version } = await resolvePublishedVersion(params.workflowTypeId);
  assertCanOpen(workflowType, params.actorUserId);

  const initialStep = version.stepsById[version.initialStepId];
  if (!initialStep) {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_PUBLISHED_VERSION,
      `Versao ${version.version} do tipo "${workflowType.workflowTypeId}" sem initialStep valido.`,
      500,
    );
  }

  const steps = version.stepOrder.map((stepId, index) => {
    const step = version.stepsById[stepId];
    if (!step) {
      throw new RuntimeError(
        RuntimeErrorCode.INVALID_PUBLISHED_VERSION,
        `Versao ${version.version} do tipo "${workflowType.workflowTypeId}" com stepOrder inconsistente.`,
        500,
      );
    }

    return {
      stepId: step.stepId,
      stepName: step.stepName,
      statusKey: step.statusKey,
      kind: step.kind,
      order: index + 1,
    };
  });

  const fields = [...version.fields]
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
    .map(mapPublishedField);

  return {
    workflowTypeId: workflowType.workflowTypeId,
    workflowName: workflowType.name,
    description: workflowType.description,
    icon: workflowType.icon,
    areaId: workflowType.areaId,
    version: version.version,
    publishedAt: version.publishedAt ?? null,
    defaultSlaDays: version.defaultSlaDays,
    initialStepId: version.initialStepId,
    initialStepName: initialStep.stepName,
    fields,
    steps,
  };
}
