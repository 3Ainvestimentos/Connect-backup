/** @jest-environment node */

export {};

const {
  buildLegacyHistorySummary,
  inferLegacyStatusCategory,
} = require('../history-legacy');

describe('history-legacy', () => {
  it('infers waiting_action when a legacy action is still pending', () => {
    expect(
      inferLegacyStatusCategory({
        status: 'em_validacao',
        actionRequests: {
          em_validacao: [{ status: 'pending' }],
        },
      }),
    ).toBe('waiting_action');
  });

  it('maps the legacy request into the unified summary shape', () => {
    const summary = buildLegacyHistorySummary(
      'legacy-doc-1',
      {
        requestId: '0042',
        type: 'Ferias',
        status: 'finalizado',
        ownerEmail: 'owner@3ariva.com.br',
        submittedBy: {
          userName: 'Solicitante',
        },
        submittedAt: '2026-04-01T10:00:00.000Z',
        lastUpdatedAt: '2026-04-02T10:00:00.000Z',
        assignee: {
          name: 'Responsavel',
        },
        isArchived: false,
      },
      {
        ownerUserIdsByEmail: new Map([['owner@3ariva.com.br', 'SMO2']]),
        ownerLabelsByUserId: new Map([['SMO2', 'Owner Name']]),
      },
    );

    expect(summary).toEqual({
      origin: 'legacy',
      requestKey: 'legacy-doc-1',
      requestIdLabel: '0042',
      sourceRequestId: '0042',
      areaId: null,
      areaLabel: 'Legado',
      workflowTypeId: 'Ferias',
      workflowLabel: 'Ferias',
      statusKey: 'finalizado',
      statusLabel: 'finalizado',
      statusCategory: 'finalized',
      ownerUserId: 'SMO2',
      ownerLabel: 'Owner Name',
      requesterLabel: 'Solicitante',
      responsibleLabel: 'Responsavel',
      submittedAt: '2026-04-01T10:00:00.000Z',
      lastUpdatedAt: '2026-04-02T10:00:00.000Z',
      periodReferenceAt: '2026-04-02T10:00:00.000Z',
      isArchived: false,
      compatibilityWarnings: [],
    });
  });
});
