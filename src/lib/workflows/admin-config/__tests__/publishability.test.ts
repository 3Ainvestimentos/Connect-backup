/** @jest-environment node */

export {};

const {
  canActivateVersion,
  deriveVersionStatus,
  evaluatePublishability,
  hasSufficientWorkflowTypeSnapshot,
} = require('../publishability');

function buildCollaborators() {
  return [
    { userId: 'OWN1', email: 'owner@3ariva.com.br', name: 'Owner' },
    { userId: 'APR1', email: 'approver@3ariva.com.br', name: 'Approver' },
  ];
}

function buildDraftVersion(overrides = {}) {
  return {
    version: 3,
    state: 'draft',
    defaultSlaDays: 5,
    fields: [{ id: 'impacto', type: 'text' }],
    initialStepId: 'start',
    stepOrder: ['start', 'work', 'final'],
    stepsById: {
      start: { stepId: 'start', stepName: 'Inicio', statusKey: 'inicio', kind: 'work' },
      work: {
        stepId: 'work',
        stepName: 'Triagem',
        statusKey: 'qualquer_coisa',
        kind: 'final',
      },
      final: {
        stepId: 'final',
        stepName: 'Fim',
        statusKey: 'duplicado',
        kind: 'start',
        action: { type: 'approval', label: 'Aprovar', approverIds: ['APR1'] },
      },
    },
    draftConfig: {
      workflowType: {
        name: 'Workflow',
        description: 'Descricao',
        icon: 'Wrench',
        areaId: 'facilities',
        ownerEmail: 'owner@3ariva.com.br',
        ownerUserId: 'OWN1',
        allowedUserIds: ['all'],
        active: true,
      },
    },
    workflowTypeSnapshot: null,
    ...overrides,
  };
}

describe('publishability helpers', () => {
  it('derives UI status from state and latestPublishedVersion', () => {
    expect(deriveVersionStatus({ latestPublishedVersion: 2 }, { version: 3, state: 'draft' })).toBe('Rascunho');
    expect(deriveVersionStatus({ latestPublishedVersion: 2 }, { version: 2, state: 'published' })).toBe('Publicada');
    expect(deriveVersionStatus({ latestPublishedVersion: 2 }, { version: 1, state: 'published' })).toBe('Inativa');
  });

  it('blocks publish when action approvers are duplicated', () => {
    const issues = evaluatePublishability({
      workflowType: { latestPublishedVersion: 2 },
      version: buildDraftVersion({
        stepsById: {
          start: { stepId: 'start', stepName: 'Inicio', statusKey: 'inicio', kind: 'start' },
          work: { stepId: 'work', stepName: 'Triagem', statusKey: 'em_andamento', kind: 'work' },
          final: {
            stepId: 'final',
            stepName: 'Fim',
            statusKey: 'fim',
            kind: 'final',
            action: { type: 'approval', label: 'Aprovar', approverIds: ['APR1', 'APR1'] },
          },
        },
      }),
      collaborators: buildCollaborators(),
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'DUPLICATE_ACTION_APPROVER', severity: 'blocking' }),
      ]),
    );
  });

  it('permite statusKey repetido nas etapas intermediarias quando o canon e satisfeito', () => {
    const issues = evaluatePublishability({
      workflowType: { latestPublishedVersion: 2 },
      version: buildDraftVersion({
        stepOrder: ['start', 'work_1', 'work_2', 'final'],
        stepsById: {
          start: { stepId: 'start', stepName: 'Inicio', statusKey: 'duplicado', kind: 'final' },
          work_1: { stepId: 'work_1', stepName: 'Triagem', statusKey: 'duplicado', kind: 'start' },
          work_2: { stepId: 'work_2', stepName: 'Execucao', statusKey: 'duplicado', kind: 'final' },
          final: {
            stepId: 'final',
            stepName: 'Fim',
            statusKey: 'duplicado',
            kind: 'work',
            action: { type: 'approval', label: 'Aprovar', approverIds: ['APR1'] },
          },
        },
      }),
      collaborators: buildCollaborators(),
    });

    expect(issues).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'DUPLICATE_STATUS_KEY' })]),
    );
    expect(issues).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'INSUFFICIENT_STEPS', severity: 'blocking' }),
        expect.objectContaining({ code: 'INVALID_INTERMEDIATE_STEP' }),
      ]),
    );
  });

  it('explicita ids ausentes em stepOrder sem healing silencioso', () => {
    const issues = evaluatePublishability({
      workflowType: { latestPublishedVersion: 2 },
      version: buildDraftVersion({
        initialStepId: 'legacy-start',
        stepOrder: ['start', 'missing', 'final'],
        stepsById: {
          start: { stepId: 'start', stepName: 'Inicio', statusKey: 'x', kind: 'final' },
          final: { stepId: 'final', stepName: 'Fim', statusKey: 'y', kind: 'start' },
        },
      }),
      collaborators: buildCollaborators(),
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'STEP_ORDER_REFERENCES_UNKNOWN_STEP', severity: 'blocking' }),
      ]),
    );
    expect(issues).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'INVALID_INITIAL_STEP' })]),
    );
  });

  it('explicita ids duplicados em stepOrder sem checks canonicos mortos', () => {
    const issues = evaluatePublishability({
      workflowType: { latestPublishedVersion: 2 },
      version: buildDraftVersion({
        stepOrder: ['start', 'work', 'work', 'final'],
      }),
      collaborators: buildCollaborators(),
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'DUPLICATE_STEP_ORDER', severity: 'blocking' }),
      ]),
    );
    expect(issues).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'MULTIPLE_START_STEPS' }),
        expect.objectContaining({ code: 'INVALID_FINAL_STEP' }),
      ]),
    );
  });

  it('bloqueia publicacao quando o draft tem menos de 3 etapas', () => {
    const issues = evaluatePublishability({
      workflowType: { latestPublishedVersion: 2 },
      version: buildDraftVersion({
        stepOrder: ['start', 'final'],
        stepsById: {
          start: { stepId: 'start', stepName: 'Inicio', statusKey: 'inicio', kind: 'start' },
          final: { stepId: 'final', stepName: 'Fim', statusKey: 'fim', kind: 'final' },
        },
      }),
      collaborators: buildCollaborators(),
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'INSUFFICIENT_STEPS', severity: 'blocking' }),
      ]),
    );
  });

  it('allows activation only for inactive published versions with snapshot', () => {
    expect(
      canActivateVersion(
        { latestPublishedVersion: 3 },
        {
          version: 2,
          state: 'published',
          workflowTypeSnapshot: {
            name: 'Workflow',
            description: 'Descricao',
            icon: 'Wrench',
            areaId: 'facilities',
            ownerEmail: 'owner@3ariva.com.br',
            ownerUserId: 'OWN1',
            allowedUserIds: ['all'],
            active: true,
          },
        },
      ),
    ).toBe(true);
    expect(
      canActivateVersion(
        { latestPublishedVersion: 2 },
        {
          version: 2,
          state: 'published',
          workflowTypeSnapshot: {
            name: 'Workflow',
            description: 'Descricao',
            icon: 'Wrench',
            areaId: 'facilities',
            ownerEmail: 'owner@3ariva.com.br',
            ownerUserId: 'OWN1',
            allowedUserIds: ['all'],
            active: true,
          },
        },
      ),
    ).toBe(false);
    expect(
      canActivateVersion(
        { latestPublishedVersion: 3 },
        { version: 2, state: 'published', workflowTypeSnapshot: null },
      ),
    ).toBe(false);
  });

  it('requires a structurally complete snapshot for activation', () => {
    expect(
      hasSufficientWorkflowTypeSnapshot({
        name: 'Workflow',
        description: 'Descricao',
        icon: 'Wrench',
        areaId: 'facilities',
        ownerEmail: 'owner@3ariva.com.br',
        ownerUserId: 'OWN1',
        allowedUserIds: ['all'],
        active: true,
      }),
    ).toBe(true);

    expect(
      hasSufficientWorkflowTypeSnapshot({
        name: 'Workflow',
        description: '',
        icon: 'Wrench',
        areaId: 'facilities',
        ownerEmail: 'owner@3ariva.com.br',
        ownerUserId: 'OWN1',
        allowedUserIds: ['all'],
        active: true,
      }),
    ).toBe(false);

    expect(
      canActivateVersion(
        { latestPublishedVersion: 3 },
        {
          version: 2,
          state: 'published',
          workflowTypeSnapshot: {
            name: 'Workflow',
            description: '',
            icon: 'Wrench',
            areaId: 'facilities',
            ownerEmail: 'owner@3ariva.com.br',
            ownerUserId: 'OWN1',
            allowedUserIds: ['all'],
            active: true,
          },
        },
      ),
    ).toBe(false);
  });
});
