import type { StepDef, VersionFieldDef } from '@/lib/workflows/runtime/types';
import type {
  DraftReadinessIssue,
  WorkflowConfigAccessMode,
  WorkflowConfigOwnerLookup,
  WorkflowDraftEditorGeneral,
} from './types';
import { evaluatePublishability } from './publishability';

export function normalizeAllowedUserIds(mode: WorkflowConfigAccessMode, allowedUserIds: string[]): string[] {
  if (mode === 'all') {
    return ['all'];
  }

  const ids = Array.from(
    new Set(
      allowedUserIds
        .map((value) => value.trim())
        .filter((value) => value !== '' && value !== 'all'),
    ),
  );

  return ids;
}

export function buildAccessPreview(mode: WorkflowConfigAccessMode, allowedUserIds: string[]) {
  if (mode === 'all' || allowedUserIds.includes('all')) {
    return 'Acesso publico para todos os colaboradores';
  }

  if (allowedUserIds.length === 0) {
    return 'Nenhum colaborador selecionado';
  }

  if (allowedUserIds.length === 1) {
    return 'Acesso restrito a 1 colaborador';
  }

  return `Acesso restrito a ${allowedUserIds.length} colaboradores`;
}

export function evaluateDraftReadiness(input: {
  general: WorkflowDraftEditorGeneral;
  access: {
    mode: WorkflowConfigAccessMode;
    allowedUserIds: string[];
  };
  fields: VersionFieldDef[];
  steps: StepDef[];
  initialStepId: string;
  collaborators?: WorkflowConfigOwnerLookup[];
}): DraftReadinessIssue[] {
  return evaluatePublishability({
    workflowType: { latestPublishedVersion: null },
    version: {
      version: 1,
      state: 'draft',
      defaultSlaDays: input.general.defaultSlaDays,
      fields: input.fields,
      initialStepId: input.initialStepId,
      stepOrder: input.steps.map((step) => step.stepId),
      stepsById: Object.fromEntries(input.steps.map((step) => [step.stepId, step])),
      draftConfig: {
        workflowType: {
          name: input.general.name,
          description: input.general.description,
          icon: input.general.icon,
          areaId: input.general.areaId,
          ownerEmail: input.general.ownerEmail,
          ownerUserId: input.general.ownerUserId,
          allowedUserIds: input.access.mode === 'all' ? ['all'] : input.access.allowedUserIds,
          active: input.general.activeOnPublish,
        },
      },
      workflowTypeSnapshot: null,
    },
    collaborators: input.collaborators || [],
  });
}
