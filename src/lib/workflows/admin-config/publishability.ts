import type {
  StepDef,
  WorkflowTypeSnapshotV2,
  WorkflowTypeV2,
  WorkflowVersionV2,
} from '@/lib/workflows/runtime/types';
import type { DraftReadinessIssue, WorkflowConfigOwnerLookup, WorkflowConfigVersionUiStatus } from './types';

type PublishabilityInput = {
  workflowType: Pick<WorkflowTypeV2, 'latestPublishedVersion'>;
  version: Pick<
    WorkflowVersionV2,
    | 'version'
    | 'state'
    | 'defaultSlaDays'
    | 'fields'
    | 'initialStepId'
    | 'stepOrder'
    | 'stepsById'
    | 'draftConfig'
    | 'workflowTypeSnapshot'
  >;
  collaborators: WorkflowConfigOwnerLookup[];
};

function trim(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeSnapshot(
  snapshot: WorkflowTypeSnapshotV2 | null | undefined,
): WorkflowTypeSnapshotV2 {
  return {
    name: trim(snapshot?.name),
    description: trim(snapshot?.description),
    icon: trim(snapshot?.icon),
    areaId: trim(snapshot?.areaId),
    ownerEmail: trim(snapshot?.ownerEmail),
    ownerUserId: trim(snapshot?.ownerUserId),
    allowedUserIds: Array.isArray(snapshot?.allowedUserIds)
      ? Array.from(new Set(snapshot.allowedUserIds.map((item) => trim(item)).filter(Boolean)))
      : [],
    active: snapshot?.active === true,
  };
}

export function hasSufficientWorkflowTypeSnapshot(
  snapshot: WorkflowTypeSnapshotV2 | null | undefined,
): snapshot is WorkflowTypeSnapshotV2 {
  const normalized = normalizeSnapshot(snapshot);

  return (
    normalized.name !== '' &&
    normalized.description !== '' &&
    normalized.icon !== '' &&
    normalized.areaId !== '' &&
    normalized.ownerEmail !== '' &&
    normalized.ownerUserId !== '' &&
    normalized.allowedUserIds.length > 0
  );
}

export function buildWorkflowTypeSnapshot(
  snapshot: WorkflowTypeSnapshotV2 | null | undefined,
): WorkflowTypeSnapshotV2 {
  return normalizeSnapshot(snapshot);
}

export function deriveVersionStatus(
  workflowType: Pick<WorkflowTypeV2, 'latestPublishedVersion'>,
  version: Pick<WorkflowVersionV2, 'version' | 'state'>,
): WorkflowConfigVersionUiStatus {
  if (version.state === 'draft') {
    return 'Rascunho';
  }

  return workflowType.latestPublishedVersion === version.version ? 'Publicada' : 'Inativa';
}

export function canActivateVersion(
  workflowType: Pick<WorkflowTypeV2, 'latestPublishedVersion'>,
  version: Pick<WorkflowVersionV2, 'version' | 'state' | 'workflowTypeSnapshot'>,
): boolean {
  return (
    version.state === 'published' &&
    workflowType.latestPublishedVersion !== version.version &&
    hasSufficientWorkflowTypeSnapshot(version.workflowTypeSnapshot)
  );
}

function pushIssue(
  issues: DraftReadinessIssue[],
  issue: Omit<DraftReadinessIssue, 'severity'> & { severity?: DraftReadinessIssue['severity'] },
) {
  issues.push({
    severity: issue.severity ?? 'blocking',
    ...issue,
  });
}

function cloneDraftSteps(
  version: Pick<WorkflowVersionV2, 'stepOrder' | 'stepsById'>,
): StepDef[] {
  return (version.stepOrder || [])
    .map((stepId) => version.stepsById?.[stepId])
    .filter((step): step is StepDef => Boolean(step));
}

function ownerExists(ownerId: string, collaborators: WorkflowConfigOwnerLookup[]) {
  return collaborators.some((collaborator) => collaborator.userId === ownerId && collaborator.email.trim() !== '');
}

function hasDuplicateValues(values: string[]) {
  return new Set(values).size !== values.length;
}

export function evaluatePublishability(input: PublishabilityInput): DraftReadinessIssue[] {
  if (input.version.state !== 'draft') {
    return [];
  }

  const issues: DraftReadinessIssue[] = [];
  const snapshot = normalizeSnapshot(input.version.draftConfig?.workflowType);
  const fields = Array.isArray(input.version.fields) ? input.version.fields : [];
  const stepOrder = Array.isArray(input.version.stepOrder) ? input.version.stepOrder : [];
  const stepsById = input.version.stepsById || {};
  const steps = cloneDraftSteps(input.version);

  if (snapshot.name === '') {
    pushIssue(issues, {
      code: 'MISSING_NAME',
      category: 'general',
      message: 'Informe o nome do workflow antes de publicar.',
      path: 'general.name',
    });
  }

  if (snapshot.description === '') {
    pushIssue(issues, {
      code: 'MISSING_DESCRIPTION',
      category: 'general',
      message: 'Informe a descricao do workflow antes de publicar.',
      path: 'general.description',
    });
  }

  if (snapshot.icon === '') {
    pushIssue(issues, {
      code: 'MISSING_ICON',
      category: 'general',
      message: 'Selecione um icone antes de publicar.',
      path: 'general.icon',
    });
  }

  if (snapshot.areaId === '') {
    pushIssue(issues, {
      code: 'MISSING_AREA',
      category: 'general',
      message: 'Selecione uma area antes de publicar.',
      path: 'general.areaId',
    });
  }

  if (snapshot.ownerUserId === '' || !ownerExists(snapshot.ownerUserId, input.collaborators)) {
    pushIssue(issues, {
      code: 'INVALID_OWNER',
      category: 'general',
      message: 'Selecione um owner valido antes de publicar.',
      path: 'general.ownerUserId',
    });
  }

  if (!Number.isInteger(input.version.defaultSlaDays) || input.version.defaultSlaDays < 0) {
    pushIssue(issues, {
      code: 'INVALID_DEFAULT_SLA',
      category: 'general',
      message: 'O SLA padrao precisa ser um inteiro maior ou igual a zero.',
      path: 'general.defaultSlaDays',
    });
  }

  const fieldIds = fields.map((field) => trim(field.id)).filter(Boolean);
  if (hasDuplicateValues(fieldIds)) {
    pushIssue(issues, {
      code: 'DUPLICATE_FIELD_ID',
      category: 'fields',
      message: 'Os campos possuem ids duplicados.',
      path: 'fields',
    });
  }

  fields.forEach((field, index) => {
    if (field.type === 'select' && (!Array.isArray(field.options) || field.options.length === 0)) {
      pushIssue(issues, {
        code: 'SELECT_WITHOUT_OPTIONS',
        category: 'fields',
        message: 'Campos select precisam ter ao menos uma opcao.',
        path: `fields.${index}.options`,
      });
    }
  });

  if (Object.keys(stepsById).length === 0 || stepOrder.length === 0) {
    pushIssue(issues, {
      code: 'MISSING_STEPS',
      category: 'steps',
      message: 'Defina ao menos uma etapa antes de publicar.',
      path: 'steps',
    });
  }

  if (trim(input.version.initialStepId) === '' || !stepsById[input.version.initialStepId]) {
    pushIssue(issues, {
      code: 'INVALID_INITIAL_STEP',
      category: 'steps',
      message: 'A etapa inicial precisa apontar para uma etapa existente.',
      path: 'initialStepId',
    });
  }

  const startSteps = steps.filter((step) => step.kind === 'start');
  const finalSteps = steps.filter((step) => step.kind === 'final');

  if (startSteps.length === 0) {
    pushIssue(issues, {
      code: 'MISSING_START_STEP',
      category: 'steps',
      message: 'Defina uma etapa inicial do tipo start antes de publicar.',
      path: 'steps',
    });
  }

  if (startSteps.length > 1) {
    pushIssue(issues, {
      code: 'MULTIPLE_START_STEPS',
      category: 'steps',
      message: 'Existe mais de uma etapa marcada como start.',
      path: 'steps',
    });
  }

  if (finalSteps.length === 0) {
    pushIssue(issues, {
      code: 'MISSING_FINAL_STEP',
      category: 'steps',
      message: 'Defina uma etapa final antes de publicar.',
      path: 'steps',
    });
  }

  if (hasDuplicateValues(stepOrder)) {
    pushIssue(issues, {
      code: 'DUPLICATE_STEP_ORDER',
      category: 'steps',
      message: 'A ordem das etapas contem ids duplicados.',
      path: 'steps',
    });
  }

  if (stepOrder.some((stepId) => !stepsById[stepId])) {
    pushIssue(issues, {
      code: 'STEP_ORDER_REFERENCES_UNKNOWN_STEP',
      category: 'steps',
      message: 'A ordem das etapas referencia ids ausentes.',
      path: 'steps',
    });
  }

  const statusKeys = steps.map((step) => trim(step.statusKey)).filter(Boolean);
  if (hasDuplicateValues(statusKeys)) {
    pushIssue(issues, {
      code: 'DUPLICATE_STATUS_KEY',
      category: 'steps',
      message: 'As etapas possuem statusKey duplicado.',
      path: 'steps',
    });
  }

  steps.forEach((step, index) => {
    const approverIds =
      Array.isArray(step.action?.approverIds) ? step.action?.approverIds.map((item) => trim(item)).filter(Boolean) : [];

    if (step.action && approverIds.length === 0) {
      pushIssue(issues, {
        code: 'ACTION_WITHOUT_APPROVERS',
        category: 'actions',
        message: 'A etapa com acao precisa ter approverIds configurados.',
        path: `steps.${index}.action.approverIds`,
      });
    }

    if (approverIds.length > 0 && hasDuplicateValues(approverIds)) {
      pushIssue(issues, {
        code: 'DUPLICATE_ACTION_APPROVER',
        category: 'actions',
        message: 'A etapa de aprovacao possui approverIds duplicados.',
        path: `steps.${index}.action.approverIds`,
      });
    }

    if (approverIds.some((approverId) => !ownerExists(approverId, input.collaborators))) {
      pushIssue(issues, {
        code: 'UNKNOWN_ACTION_APPROVER',
        category: 'actions',
        message: 'A etapa de acao referencia aprovadores inexistentes.',
        path: `steps.${index}.action.approverIds`,
      });
    }
  });

  return issues;
}

export function hasBlockingPublishIssues(issues: DraftReadinessIssue[]) {
  return issues.some((issue) => issue.severity === 'blocking');
}

export function getLastTransitionAt(version: Pick<WorkflowVersionV2, 'activatedAt' | 'publishedAt'>) {
  const activatedAt = version.activatedAt;
  if (activatedAt && typeof activatedAt.toDate === 'function') {
    return activatedAt.toDate().toISOString();
  }

  const publishedAt = version.publishedAt;
  if (publishedAt && typeof publishedAt.toDate === 'function') {
    return publishedAt.toDate().toISOString();
  }

  return null;
}
