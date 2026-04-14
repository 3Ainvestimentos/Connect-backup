import type { WorkflowRequest } from '@/contexts/WorkflowsContext';
import type { WorkflowDefinition } from '@/contexts/ApplicationsContext';

/**
 * Resolve o label humano do status de um request legado a partir da
 * definicao do workflow. Usa `request.status` como fallback quando a
 * definicao nao estiver disponivel.
 */
export function deriveLegacyStatusLabel(
  request: Pick<WorkflowRequest, 'status'>,
  definition: Pick<WorkflowDefinition, 'statuses'> | null | undefined,
): string {
  if (!definition) return request.status ?? '-';
  const match = definition.statuses?.find((s) => s.id === request.status);
  return match?.label ?? request.status ?? '-';
}
