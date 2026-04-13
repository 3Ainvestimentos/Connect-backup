/** @jest-environment node */

const { Timestamp } = require('firebase-admin/firestore');
const {
  WORKFLOW_READ_MODEL_REQUIRED_FIELDS,
  buildArchiveReadModelUpdate,
  buildAssignReadModelUpdate,
  buildAdvanceReadModelUpdate,
  buildFinalizeReadModelUpdate,
  buildOpenReadModel,
} = require('@/lib/workflows/runtime/read-model');

function at(isoString) {
  return Timestamp.fromDate(new Date(isoString));
}

describe('workflow read-model consistency', () => {
  it('projeta a shape obrigatoria do documento workflows_v2 na abertura', () => {
    const submittedAt = at('2026-03-25T12:00:00.000Z');
    const readModel = buildOpenReadModel({
      workflowName: 'Facilities',
      areaId: 'area-1',
      ownerEmail: 'owner@3ariva.com.br',
      ownerUserId: 'SMO2',
      requesterUserId: 'REQ1',
      requesterName: 'Requester',
      currentStepId: 'stp_open',
      currentStepName: 'Solicitação Aberta',
      currentStatusKey: 'solicitacao_aberta',
      slaDays: 5,
      submittedAt,
    });

    const persistedDocument = {
      requestId: 800,
      workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
      workflowVersion: 1,
      submittedAt,
      formData: {},
      stepStates: {
        stp_open: 'active',
      },
      history: [],
      ...readModel,
    };

    expect(Object.keys(readModel).sort()).toEqual([...WORKFLOW_READ_MODEL_REQUIRED_FIELDS].sort());
    expect(persistedDocument).toEqual(
      expect.objectContaining({
        requestId: 800,
        workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
        workflowVersion: 1,
        ownerUserId: 'SMO2',
        requesterUserId: 'REQ1',
        responsibleUserId: null,
        hasResponsible: false,
        hasPendingActions: false,
        pendingActionRecipientIds: [],
        pendingActionTypes: [],
        operationalParticipantIds: ['SMO2'],
        submittedMonthKey: '2026-03',
        closedMonthKey: null,
        isArchived: false,
      }),
    );
  });

  it('atribui responsavel sem reintroduzir o requester em operationalParticipantIds', () => {
    const update = buildAssignReadModelUpdate({
      responsibleUserId: 'RESP1',
      responsibleName: 'Responsável',
      currentStatusCategory: 'open',
      existingParticipantIds: ['SMO2'],
      inProgressStepId: 'stp_work',
      inProgressStepName: 'Em andamento',
      inProgressStatusKey: 'em_andamento',
      now: at('2026-03-25T13:00:00.000Z'),
    });

    expect(update).toEqual(
      expect.objectContaining({
        responsibleUserId: 'RESP1',
        responsibleName: 'Responsável',
        hasResponsible: true,
        operationalParticipantIds: ['SMO2', 'RESP1'],
        currentStepId: 'stp_work',
        currentStepName: 'Em andamento',
        currentStatusKey: 'em_andamento',
        statusCategory: 'in_progress',
      }),
    );
  });

  it('mantem um helper dedicado para advance-step e a etapa atual coerente', () => {
    const now = at('2026-03-25T14:00:00.000Z');
    expect(
      buildAdvanceReadModelUpdate({
        nextStepId: 'stp_review',
        nextStepName: 'Triagem',
        nextStatusKey: 'triagem',
        now,
      }),
    ).toEqual({
      currentStepId: 'stp_review',
      currentStepName: 'Triagem',
      currentStatusKey: 'triagem',
      statusCategory: 'in_progress',
      lastUpdatedAt: now,
    });
  });

  it('fecha o chamado com closedAt igual a finalizedAt e limpa helpers de pending action', () => {
    const now = at('2026-03-25T15:00:00.000Z');
    const update = buildFinalizeReadModelUpdate({
      finalStepId: 'stp_final',
      finalStepName: 'Finalizado',
      finalStatusKey: 'finalizado',
      now,
    });

    expect(update.closedAt).toBe(now);
    expect(update.finalizedAt).toBe(now);
    expect(update.closedMonthKey).toBe('2026-03');
    expect(update.hasPendingActions).toBe(false);
    expect(update.pendingActionRecipientIds).toEqual([]);
    expect(update.pendingActionTypes).toEqual([]);
  });

  it('arquiva sem sobrescrever o momento de fechamento', () => {
    const closedAt = at('2026-03-25T15:00:00.000Z');
    const archivedAt = at('2026-03-26T10:00:00.000Z');
    const finalized = buildFinalizeReadModelUpdate({
      finalStepId: 'stp_final',
      finalStepName: 'Finalizado',
      finalStatusKey: 'finalizado',
      now: closedAt,
    });
    const archivedDocument = {
      ...finalized,
      ...buildArchiveReadModelUpdate({ now: archivedAt }),
    };

    expect(archivedDocument).toEqual(
      expect.objectContaining({
        closedAt,
        finalizedAt: closedAt,
        archivedAt,
        isArchived: true,
        statusCategory: 'archived',
      }),
    );
  });
});
