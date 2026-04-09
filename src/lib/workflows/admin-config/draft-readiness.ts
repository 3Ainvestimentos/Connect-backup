import type { StepDef, VersionFieldDef } from '@/lib/workflows/runtime/types';
import type { DraftReadinessIssue, WorkflowConfigAccessMode, WorkflowDraftEditorGeneral } from './types';

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
}): DraftReadinessIssue[] {
  const issues: DraftReadinessIssue[] = [];

  if (input.general.name.trim() === '') {
    issues.push({
      code: 'MISSING_NAME',
      category: 'general',
      severity: 'warning',
      message: 'Informe o nome do workflow antes de publicar.',
      path: 'general.name',
    });
  }

  if (input.general.areaId.trim() === '') {
    issues.push({
      code: 'MISSING_AREA',
      category: 'general',
      severity: 'warning',
      message: 'Selecione uma area antes de publicar.',
      path: 'general.areaId',
    });
  }

  if (input.general.ownerUserId.trim() === '') {
    issues.push({
      code: 'MISSING_OWNER',
      category: 'general',
      severity: 'warning',
      message: 'Selecione um owner valido antes de publicar.',
      path: 'general.ownerUserId',
    });
  }

  if (input.access.mode === 'specific' && input.access.allowedUserIds.length === 0) {
    issues.push({
      code: 'MISSING_ALLOWED_USERS',
      category: 'access',
      severity: 'warning',
      message: 'Selecione ao menos um colaborador quando o acesso for restrito.',
      path: 'access.allowedUserIds',
    });
  }

  if (input.steps.length === 0) {
    issues.push({
      code: 'MISSING_STEPS',
      category: 'steps',
      severity: 'warning',
      message: 'Defina ao menos uma etapa antes de publicar.',
      path: 'steps',
    });
  }

  if (input.steps.length > 0 && !input.steps.some((step) => step.stepId === input.initialStepId)) {
    issues.push({
      code: 'INVALID_INITIAL_STEP',
      category: 'steps',
      severity: 'warning',
      message: 'A etapa inicial precisa apontar para uma etapa existente.',
      path: 'initialStepId',
    });
  }

  if (input.steps.length > 0 && !input.steps.some((step) => step.kind === 'final')) {
    issues.push({
      code: 'MISSING_FINAL_STEP',
      category: 'steps',
      severity: 'warning',
      message: 'Defina uma etapa final antes de publicar.',
      path: 'steps',
    });
  }

  input.steps.forEach((step, index) => {
    if (step.action?.type === 'approval' && (!step.action.approverIds || step.action.approverIds.length === 0)) {
      issues.push({
        code: 'APPROVAL_STEP_WITHOUT_APPROVERS',
        category: 'actions',
        severity: 'warning',
        message: `A etapa ${index + 1} exige aprovadores predefinidos para publicar.`,
        path: `steps.${index}.action.approverIds`,
      });
    }
  });

  if (input.fields.some((field) => field.label.trim() === '')) {
    issues.push({
      code: 'FIELD_WITHOUT_LABEL',
      category: 'fields',
      severity: 'warning',
      message: 'Todos os campos devem ter um rotulo antes de publicar.',
      path: 'fields',
    });
  }

  return issues;
}
