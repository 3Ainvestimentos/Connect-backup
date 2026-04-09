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
    stepOrder: ['start', 'final'],
    stepsById: {
      start: { stepId: 'start', stepName: 'Inicio', statusKey: 'inicio', kind: 'start' },
      final: {
        stepId: 'final',
        stepName: 'Fim',
        statusKey: 'fim',
        kind: 'final',
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
