import type { StepDef, StepKind, WorkflowVersionV2 } from '@/lib/workflows/runtime/types';

type CanonicalSemantics = {
  statusKey: string;
  kind: StepKind;
  roleLabel: 'Inicial' | 'Intermediaria' | 'Final';
  roleDescription: string;
};

type MinimalStep = Pick<StepDef, 'stepId' | 'stepName' | 'action'>;

export type CanonicalizedStepsResult = {
  steps: StepDef[];
  stepsById: Record<string, StepDef>;
  stepOrder: string[];
  initialStepId: string;
};

export type VersionStepOrderInspection = {
  stepOrder: string[];
  orderedExistingSteps: StepDef[];
  missingStepIds: string[];
  duplicateStepIds: string[];
  isStructurallyValid: boolean;
};

export function deriveCanonicalSemantics(index: number, total: number): CanonicalSemantics {
  if (index === 0) {
    return {
      statusKey: 'solicitacao_aberta',
      kind: 'start',
      roleLabel: 'Inicial',
      roleDescription: 'Abre o chamado e define a etapa inicial obrigatoria.',
    };
  }

  if (index === total - 1) {
    return {
      statusKey: 'finalizado',
      kind: 'final',
      roleLabel: 'Final',
      roleDescription: 'Encerra o chamado como ultima etapa da ordem.',
    };
  }

  return {
    statusKey: 'em_andamento',
    kind: 'work',
    roleLabel: 'Intermediaria',
    roleDescription: 'Executa o fluxo operacional entre a abertura e o encerramento.',
  };
}

export function canonicalizeSteps(steps: MinimalStep[]): CanonicalizedStepsResult {
  const canonicalSteps = steps.map((step, index) => {
    const semantics = deriveCanonicalSemantics(index, steps.length);

    return {
      stepId: step.stepId,
      stepName: step.stepName,
      statusKey: semantics.statusKey,
      kind: semantics.kind,
      ...(step.action ? { action: step.action } : {}),
    } satisfies StepDef;
  });

  return {
    steps: canonicalSteps,
    stepsById: Object.fromEntries(canonicalSteps.map((step) => [step.stepId, step])),
    stepOrder: canonicalSteps.map((step) => step.stepId),
    initialStepId: canonicalSteps[0]?.stepId || '',
  };
}

function cloneStepDef(step: StepDef): StepDef {
  return {
    ...step,
    action: step.action
      ? {
          ...step.action,
          approverIds: Array.isArray(step.action.approverIds) ? [...step.action.approverIds] : [],
        }
      : undefined,
  };
}

export function inspectVersionStepOrder<
  TVersion extends Pick<WorkflowVersionV2, 'stepOrder' | 'stepsById'>,
>(version: TVersion): VersionStepOrderInspection {
  const stepOrder = Array.isArray(version.stepOrder) ? [...version.stepOrder] : [];
  const stepsById = version.stepsById || {};
  const seenStepIds = new Set<string>();
  const duplicateStepIds = new Set<string>();
  const missingStepIds = new Set<string>();
  const orderedExistingSteps: StepDef[] = [];

  stepOrder.forEach((stepId) => {
    if (seenStepIds.has(stepId)) {
      duplicateStepIds.add(stepId);
    } else {
      seenStepIds.add(stepId);
    }

    const step = stepsById[stepId];
    if (!step) {
      missingStepIds.add(stepId);
      return;
    }

    orderedExistingSteps.push(cloneStepDef(step));
  });

  return {
    stepOrder,
    orderedExistingSteps,
    missingStepIds: Array.from(missingStepIds),
    duplicateStepIds: Array.from(duplicateStepIds),
    isStructurallyValid: missingStepIds.size === 0 && duplicateStepIds.size === 0,
  };
}

export function canonicalizeVersionSteps<
  TVersion extends Pick<WorkflowVersionV2, 'stepOrder' | 'stepsById' | 'initialStepId'>,
>(version: TVersion): TVersion {
  const inspection = inspectVersionStepOrder(version);

  if (!inspection.isStructurallyValid) {
    return {
      ...version,
      initialStepId: version.initialStepId,
      stepOrder: inspection.stepOrder,
      stepsById: Object.fromEntries(
        Object.entries(version.stepsById || {}).map(([stepId, step]) => [stepId, cloneStepDef(step)]),
      ),
    };
  }

  const canonical = canonicalizeSteps(
    inspection.orderedExistingSteps.map((step) => ({
      stepId: step.stepId,
      stepName: step.stepName,
      action: step.action,
    })),
  );

  return {
    ...version,
    initialStepId: canonical.initialStepId,
    stepOrder: canonical.stepOrder,
    stepsById: canonical.stepsById,
  };
}
