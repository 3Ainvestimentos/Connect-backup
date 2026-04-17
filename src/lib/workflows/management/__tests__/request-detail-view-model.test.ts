import { buildRequestOperationalViewModel } from '../request-detail-view-model';
import type { WorkflowManagementRequestDetailData } from '../types';

function buildDetail(
  overrides: Partial<WorkflowManagementRequestDetailData> = {},
): WorkflowManagementRequestDetailData {
  return {
    summary: {
      docId: 'doc-1',
      requestId: 812,
      workflowTypeId: 'facilities_suprimentos',
      workflowVersion: 3,
      workflowName: 'Solicitacao de Suprimentos',
      areaId: 'facilities',
      ownerEmail: 'owner@3ariva.com.br',
      ownerUserId: 'SMO2',
      requesterUserId: 'REQ1',
      requesterName: 'Requester',
      responsibleUserId: 'RESP1',
      responsibleName: 'Responsavel',
      currentStepId: 'execucao',
      currentStepName: 'Execucao',
      currentStatusKey: 'execucao',
      statusCategory: 'in_progress',
      hasResponsible: true,
      hasPendingActions: false,
      pendingActionRecipientIds: [],
      pendingActionTypes: [],
      operationalParticipantIds: ['SMO2', 'RESP1'],
      slaDays: 5,
      slaState: 'on_track',
      expectedCompletionAt: null,
      lastUpdatedAt: null,
      finalizedAt: null,
      closedAt: null,
      archivedAt: null,
      submittedAt: null,
      submittedMonthKey: '2026-04',
      closedMonthKey: null,
      isArchived: false,
    },
    permissions: {
      canAssign: false,
      canAdvance: false,
      canFinalize: false,
      canArchive: false,
      canRequestAction: false,
      canRespondAction: false,
    },
    formData: { fields: [], extraFields: [] },
    attachments: [],
    progress: {
      currentStepId: 'execucao',
      totalSteps: 4,
      completedSteps: 2,
      items: [],
    },
    action: {
      available: true,
      state: 'idle',
      batchId: null,
      type: 'approval',
      label: 'Aprovar etapa',
      commentRequired: false,
      attachmentRequired: false,
      commentPlaceholder: null,
      attachmentPlaceholder: null,
      canRequest: false,
      canRespond: false,
      requestedAt: null,
      completedAt: null,
      requestedByUserId: null,
      requestedByName: null,
      recipients: [],
      configurationError: null,
    },
    timeline: [],
    ...overrides,
  };
}

describe('buildRequestOperationalViewModel', () => {
  it('prioritizes respondAction when the actor must answer the current action', () => {
    const result = buildRequestOperationalViewModel(
      buildDetail({
        permissions: {
          canAssign: false,
          canAdvance: true,
          canFinalize: true,
          canArchive: false,
          canRequestAction: true,
          canRespondAction: true,
        },
        action: {
          ...buildDetail().action,
          canRespond: true,
          state: 'pending',
        },
      }),
    );

    expect(result.tone).toBe('respond-action');
    expect(result.showActionZoneAsPrimary).toBe(true);
    expect(result.primaryAction).toBeNull();
  });

  it('keeps completed action batches secondary when advance is available', () => {
    const result = buildRequestOperationalViewModel(
      buildDetail({
        permissions: {
          canAssign: false,
          canAdvance: true,
          canFinalize: false,
          canArchive: false,
          canRequestAction: false,
          canRespondAction: false,
        },
        action: {
          ...buildDetail().action,
          state: 'completed',
          completedAt: new Date('2026-04-02T12:00:00Z'),
        },
      }),
    );

    expect(result.tone).toBe('ready-to-advance');
    expect(result.showActionZoneAsPrimary).toBe(false);
    expect(result.primaryAction).toEqual({ kind: 'advance', label: 'Avancar etapa' });
  });

  it('returns finalize as the body-first CTA when only canFinalize is true', () => {
    const result = buildRequestOperationalViewModel(
      buildDetail({
        permissions: {
          canAssign: false,
          canAdvance: false,
          canFinalize: true,
          canArchive: false,
          canRequestAction: false,
          canRespondAction: false,
        },
      }),
    );

    expect(result.tone).toBe('ready-to-finalize');
    expect(result.primaryAction).toEqual({ kind: 'finalize', label: 'Finalizar chamado' });
  });

  it('keeps the action zone visible for requestAction scenarios', () => {
    const result = buildRequestOperationalViewModel(
      buildDetail({
        permissions: {
          canAssign: false,
          canAdvance: false,
          canFinalize: false,
          canArchive: false,
          canRequestAction: true,
          canRespondAction: false,
        },
      }),
    );

    expect(result.tone).toBe('request-action');
    expect(result.showActionZoneAsPrimary).toBe(true);
    expect(result.shouldRenderActionZone).toBe(true);
  });

  it('falls back to read-only when there is no immediate operational action', () => {
    const result = buildRequestOperationalViewModel(
      buildDetail({
        action: {
          ...buildDetail().action,
          available: false,
        },
      }),
    );

    expect(result.tone).toBe('read-only');
    expect(result.shouldRenderActionZone).toBe(false);
    expect(result.primaryAction).toBeNull();
  });
});
