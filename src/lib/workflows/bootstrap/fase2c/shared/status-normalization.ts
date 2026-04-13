import { generateStepId } from '@/lib/workflows/bootstrap/step-id';
import type { StepActionDef, StepDef } from '@/lib/workflows/runtime/types';
import type {
  Fase2cManifestEntry,
  LegacyWorkflowStatus,
  NormalizedStatusesResult,
} from './types';

const CANONICAL_STEPS: Array<{
  stepName: string;
  statusKey: string;
  kind: StepDef['kind'];
}> = [
  { stepName: 'Solicitação Aberta', statusKey: 'solicitacao_aberta', kind: 'start' },
  { stepName: 'Em andamento', statusKey: 'em_andamento', kind: 'work' },
  { stepName: 'Finalizado', statusKey: 'finalizado', kind: 'final' },
];

function sanitizeAction(action: StepActionDef): StepActionDef {
  return {
    type: action.type,
    label: action.label.trim(),
    approverIds: action.approverIds ? [...action.approverIds] : undefined,
    commentRequired: action.commentRequired,
    commentPlaceholder: action.commentPlaceholder?.trim(),
    attachmentPlaceholder: action.attachmentPlaceholder?.trim(),
  };
}

function generateUniqueStepId(seenStepIds: Set<string>): string {
  let stepId = generateStepId();

  while (seenStepIds.has(stepId)) {
    stepId = generateStepId();
  }

  seenStepIds.add(stepId);

  return stepId;
}

function resolveOverrideId(
  originalId: string,
  entry: Fase2cManifestEntry,
  overrideUsage: Map<string, number>,
): string {
  const overrides = entry.statusIdOverrides?.[originalId];

  if (!overrides) {
    return originalId;
  }

  const nextIndex = overrideUsage.get(originalId) ?? 0;

  if (nextIndex >= overrides.length) {
    throw new Error(
      `Override de status.id insuficiente para "${entry.workflowTypeId}" em "${originalId}".`,
    );
  }

  overrideUsage.set(originalId, nextIndex + 1);

  return overrides[nextIndex].trim();
}

function assertOverridesConsumed(
  workflowTypeId: string,
  overrides: Record<string, string[]> | undefined,
  overrideUsage: Map<string, number>,
): void {
  if (!overrides) {
    return;
  }

  for (const [originalId, values] of Object.entries(overrides)) {
    const used = overrideUsage.get(originalId) ?? 0;

    if (used !== values.length) {
      throw new Error(
        `Override de status.id inconsistente para "${workflowTypeId}" em "${originalId}": usados ${used}, configurados ${values.length}.`,
      );
    }
  }
}

function inferKind(index: number, total: number): StepDef['kind'] {
  if (total === 1) {
    return 'start';
  }

  if (index === 0) {
    return 'start';
  }

  if (index === total - 1) {
    return 'final';
  }

  return 'work';
}

function normalizePreserveLegacyStatuses(
  entry: Fase2cManifestEntry,
  legacyStatuses: LegacyWorkflowStatus[],
): NormalizedStatusesResult {
  const sanitizations: string[] = [];
  const stepsById: Record<string, StepDef> = {};
  const stepOrder: string[] = [];
  const statusesSummary: Array<{ statusKey: string; kind: StepDef['kind']; hasAction: boolean }> = [];
  const seenStatusKeys = new Set<string>();
  const seenStepIds = new Set<string>();
  const overrideUsage = new Map<string, number>();

  for (const [index, status] of legacyStatuses.entries()) {
    const originalId = status.id.trim();
    const resolvedStatusKey = resolveOverrideId(originalId, entry, overrideUsage);

    if (status.id !== originalId) {
      sanitizations.push(`status.id trimmed: "${status.id}" -> "${originalId}"`);
    }

    if (resolvedStatusKey !== originalId) {
      sanitizations.push(`status.id override: "${originalId}" -> "${resolvedStatusKey}"`);
    }

    if (seenStatusKeys.has(resolvedStatusKey)) {
      throw new Error(
        `Duplicidade de status.id sem cobertura de override em "${entry.workflowTypeId}": "${resolvedStatusKey}".`,
      );
    }

    seenStatusKeys.add(resolvedStatusKey);

    const stepName = status.label.trim();

    if (status.label !== stepName) {
      sanitizations.push(`status.label trimmed: "${originalId}"`);
    }

    const stepId = generateUniqueStepId(seenStepIds);
    const kind = inferKind(index, legacyStatuses.length);
    const action = status.action ? sanitizeAction(status.action) : undefined;

    if (status.action && JSON.stringify(status.action) !== JSON.stringify(action)) {
      sanitizations.push(`status.action normalized: "${resolvedStatusKey}"`);
    }

    stepsById[stepId] = {
      stepId,
      stepName,
      statusKey: resolvedStatusKey,
      kind,
      action,
    };

    stepOrder.push(stepId);
    statusesSummary.push({
      statusKey: resolvedStatusKey,
      kind,
      hasAction: Boolean(action),
    });
  }

  assertOverridesConsumed(entry.workflowTypeId, entry.statusIdOverrides, overrideUsage);

  return {
    initialStepId: stepOrder[0],
    stepOrder,
    stepsById,
    statusesSummary,
    sanitizations,
  };
}

function assertCanonicalStrategyEligible(
  entry: Fase2cManifestEntry,
  legacyStatuses: LegacyWorkflowStatus[],
): void {
  if (Object.keys(entry.statusIdOverrides ?? {}).length > 0) {
    throw new Error(
      `Workflow "${entry.workflowTypeId}" com stepStrategy "canonical_3_steps" nao pode declarar statusIdOverrides.`,
    );
  }

  const statusWithAction = legacyStatuses.find((status) => status.action);

  if (statusWithAction) {
    throw new Error(
      `Workflow "${entry.workflowTypeId}" com stepStrategy "canonical_3_steps" nao pode preservar status.action em "${statusWithAction.id.trim()}".`,
    );
  }
}

function normalizeCanonical3StepStatuses(
  entry: Fase2cManifestEntry,
  legacyStatuses: LegacyWorkflowStatus[],
): NormalizedStatusesResult {
  assertCanonicalStrategyEligible(entry, legacyStatuses);

  const stepsById: Record<string, StepDef> = {};
  const stepOrder: string[] = [];
  const seenStepIds = new Set<string>();

  for (const canonicalStep of CANONICAL_STEPS) {
    const stepId = generateUniqueStepId(seenStepIds);

    stepsById[stepId] = {
      stepId,
      stepName: canonicalStep.stepName,
      statusKey: canonicalStep.statusKey,
      kind: canonicalStep.kind,
    };

    stepOrder.push(stepId);
  }

  return {
    initialStepId: stepOrder[0],
    stepOrder,
    stepsById,
    statusesSummary: CANONICAL_STEPS.map((step) => ({
      statusKey: step.statusKey,
      kind: step.kind,
      hasAction: false,
    })),
    sanitizations: [
      `status.strategy applied: canonical_3_steps (${legacyStatuses.length} -> ${CANONICAL_STEPS.length})`,
    ],
  };
}

export function normalizeStatuses(
  entry: Fase2cManifestEntry,
  legacyStatuses: LegacyWorkflowStatus[],
): NormalizedStatusesResult {
  if (!legacyStatuses.length) {
    throw new Error(`Workflow "${entry.workflowTypeId}" nao possui statuses no snapshot legado.`);
  }

  switch (entry.stepStrategy) {
    case 'preserve_legacy':
      return normalizePreserveLegacyStatuses(entry, legacyStatuses);
    case 'canonical_3_steps':
      return normalizeCanonical3StepStatuses(entry, legacyStatuses);
    default:
      throw new Error(
        `Workflow "${entry.workflowTypeId}" possui stepStrategy desconhecido: "${String(entry.stepStrategy)}".`,
      );
  }
}
