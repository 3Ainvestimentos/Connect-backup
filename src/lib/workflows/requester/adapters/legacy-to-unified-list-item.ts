import type { WorkflowRequest } from '@/contexts/WorkflowsContext';
import type { WorkflowDefinition } from '@/contexts/ApplicationsContext';
import type { WorkflowArea } from '@/contexts/WorkflowAreasContext';
import { deriveLegacyWorkflowName } from '../legacy/derive-legacy-workflow-name';
import { deriveLegacyStatusLabel } from '../legacy/derive-legacy-status-label';
import { deriveLegacyArea } from '../legacy/derive-legacy-area';
import { deriveLegacyExpectedCompletion } from '../legacy/derive-legacy-expected-completion';
import type { RequesterUnifiedLegacyListItem } from '../unified-types';

function parseIsoSafe(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function legacyRequestToUnifiedListItem(
  request: WorkflowRequest,
  definition: WorkflowDefinition | null,
  workflowArea: WorkflowArea | null,
): RequesterUnifiedLegacyListItem {
  const { expectedCompletionAt, expectedCompletionLabel } =
    deriveLegacyExpectedCompletion(request, definition);

  const area = deriveLegacyArea(definition, workflowArea);

  return {
    origin: 'legacy',
    detailKey: `legacy:${request.id}`,
    requestDocId: request.id,
    displayRequestId: request.requestId ?? request.id,
    workflowName: deriveLegacyWorkflowName(request, definition),
    statusLabel: deriveLegacyStatusLabel(request, definition),
    statusVariant: 'secondary',
    expectedCompletionAt,
    expectedCompletionLabel,
    submittedAt: parseIsoSafe(request.submittedAt),
    lastUpdatedAt: parseIsoSafe(request.lastUpdatedAt),
    raw: { request, definition, workflowArea },
  };
}
