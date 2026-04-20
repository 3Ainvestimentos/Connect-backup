import type { WorkflowRequest } from '@/contexts/WorkflowsContext';
import type { WorkflowDefinition } from '@/contexts/ApplicationsContext';
import type { WorkflowArea } from '@/contexts/WorkflowAreasContext';
import { deriveLegacyWorkflowName } from '../legacy/derive-legacy-workflow-name';
import { deriveLegacyStatusLabel } from '../legacy/derive-legacy-status-label';
import { deriveLegacyArea } from '../legacy/derive-legacy-area';
import { deriveLegacyAttachments } from '../legacy/derive-legacy-attachments';
import { deriveLegacyTimeline } from '../legacy/derive-legacy-timeline';
import type {
  RequesterUnifiedLegacyDetail,
  RequesterUnifiedRequestDetailField,
} from '../unified-types';

function parseIsoSafe(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Converte os campos do formData legado em `RequesterUnifiedRequestDetailField[]`
 * usando a definicao do workflow para labels e tipos.
 */
function buildLegacyFields(
  request: Pick<WorkflowRequest, 'formData'>,
  definition: Pick<WorkflowDefinition, 'fields'> | null | undefined,
): RequesterUnifiedRequestDetailField[] {
  const formData = request.formData ?? {};
  const fields: RequesterUnifiedRequestDetailField[] = [];

  if (definition?.fields?.length) {
    for (const [index, fieldDef] of definition.fields.entries()) {
      if (fieldDef.type === 'file') continue;
      const value = formData[fieldDef.id];
      if (value === undefined || value === null) continue;
      fields.push({
        fieldId: fieldDef.id,
        label: fieldDef.label,
        value,
        type: fieldDef.type,
        order: index,
      });
    }
  } else {
    // Fallback sem definicao: usa fieldId como label
    for (const [index, [key, value]] of Object.entries(formData).entries()) {
      if (value === undefined || value === null) continue;
      fields.push({ fieldId: key, label: key, value, type: 'text', order: index });
    }
  }

  return fields;
}

export function legacyRequestToUnifiedDetail(
  request: WorkflowRequest,
  definition: WorkflowDefinition | null,
  workflowArea: WorkflowArea | null,
): RequesterUnifiedLegacyDetail {
  const area = deriveLegacyArea(definition, workflowArea);

  const summary = {
    requesterName: request.submittedBy?.userName ?? '-',
    workflowName: deriveLegacyWorkflowName(request, definition),
    displayRequestId: request.requestId ?? request.id,
    submittedAt: parseIsoSafe(request.submittedAt),
    lastUpdatedAt: parseIsoSafe(request.lastUpdatedAt),
    responsibleName: request.assignee?.name ?? null,
    openedInLabel: area.areaLabel,
    statusLabel: deriveLegacyStatusLabel(request, definition),
    currentStepName: null, // legado nao tem currentStepName pre-computado
  };

  const fields = buildLegacyFields(request, definition);
  const attachments = deriveLegacyAttachments(request, definition);
  const timeline = deriveLegacyTimeline(request, definition);

  return {
    origin: 'legacy',
    detailKey: `legacy:${request.id}`,
    summary,
    fields,
    attachments,
    timeline,
    progress: null, // legado nao tem progress estruturado
    raw: { request, definition, workflowArea },
  };
}
