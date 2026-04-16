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

export function canonicalizeVersionSteps<
  TVersion extends Pick<WorkflowVersionV2, 'stepOrder' | 'stepsById' | 'initialStepId'>,
>(version: TVersion): TVersion {
  const orderedSteps = (version.stepOrder || [])
    .map((stepId) => version.stepsById?.[stepId])
    .filter((step): step is StepDef => Boolean(step))
    .map((step) => ({
      stepId: step.stepId,
      stepName: step.stepName,
      action: step.action
        ? {
            ...step.action,
            approverIds: Array.isArray(step.action.approverIds) ? [...step.action.approverIds] : [],
          }
        : undefined,
    }));
  const canonical = canonicalizeSteps(orderedSteps);

  return {
    ...version,
    initialStepId: canonical.initialStepId,
    stepOrder: canonical.stepOrder,
    stepsById: canonical.stepsById,
  };
}
