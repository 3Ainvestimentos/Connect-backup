import type { WorkflowDefinition } from '@/contexts/ApplicationsContext';
import type { WorkflowArea } from '@/contexts/WorkflowAreasContext';

export interface DeriveLegacyAreaResult {
  areaId: string;
  areaLabel: string;
}

/**
 * Resolve areaId e label amigavel a partir da definicao do workflow
 * e do catalogo de workflowAreas.
 * Degradacao elegante: fallback em `'-'` quando indisponivel.
 */
export function deriveLegacyArea(
  definition: Pick<WorkflowDefinition, 'areaId'> | null | undefined,
  workflowArea: WorkflowArea | null | undefined,
): DeriveLegacyAreaResult {
  const areaId = definition?.areaId ?? '-';
  const areaLabel = workflowArea?.name ?? areaId;
  return { areaId, areaLabel };
}
