import workflowAreasJson from '@/scripts/results/workflowAreas.json';
import workflowDefinitionsJson from '@/scripts/results/workflowDefinitions.json';
import type {
  Fase2cManifestEntry,
  LegacyWorkflowArea,
  LegacyWorkflowDefinition,
} from './types';

const LEGACY_WORKFLOW_DEFINITIONS =
  workflowDefinitionsJson as Record<string, LegacyWorkflowDefinition>;
const LEGACY_WORKFLOW_AREAS = workflowAreasJson as Record<string, LegacyWorkflowArea>;

export function loadLegacySources(): {
  workflowDefinitions: Record<string, LegacyWorkflowDefinition>;
  workflowAreas: Record<string, LegacyWorkflowArea>;
} {
  return {
    workflowDefinitions: LEGACY_WORKFLOW_DEFINITIONS,
    workflowAreas: LEGACY_WORKFLOW_AREAS,
  };
}

export function loadLegacyWorkflow(legacyWorkflowId: string): LegacyWorkflowDefinition {
  const workflow = LEGACY_WORKFLOW_DEFINITIONS[legacyWorkflowId];

  if (!workflow) {
    throw new Error(`Workflow legado "${legacyWorkflowId}" nao encontrado em workflowDefinitions.json.`);
  }

  return workflow;
}

export function assertLegacyAreaExists(areaId: string): LegacyWorkflowArea {
  const area = LEGACY_WORKFLOW_AREAS[areaId];

  if (!area) {
    throw new Error(`Area legado "${areaId}" nao encontrada em workflowAreas.json.`);
  }

  return area;
}

export function assertUniqueWorkflowTypeIds(manifest: Fase2cManifestEntry[]): void {
  const seen = new Set<string>();

  for (const entry of manifest) {
    if (seen.has(entry.workflowTypeId)) {
      throw new Error(
        `workflowTypeId canonico repetido no manifesto: "${entry.workflowTypeId}".`,
      );
    }

    seen.add(entry.workflowTypeId);
  }
}

