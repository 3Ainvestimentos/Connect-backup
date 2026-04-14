import type { WorkflowRequest } from '@/contexts/WorkflowsContext';
import type { WorkflowDefinition } from '@/contexts/ApplicationsContext';

/**
 * Resolve o nome do workflow a partir do request legado.
 * Usa `request.type` como lookup em `workflowDefinitions`;
 * fallback em `request.type` e depois em `'-'`.
 */
export function deriveLegacyWorkflowName(
  request: Pick<WorkflowRequest, 'type'>,
  definition: Pick<WorkflowDefinition, 'name'> | null | undefined,
): string {
  if (definition?.name) return definition.name;
  if (request.type) return request.type;
  return '-';
}
