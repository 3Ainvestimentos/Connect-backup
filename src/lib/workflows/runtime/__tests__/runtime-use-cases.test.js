/** @jest-environment node */

jest.mock('@/lib/workflows/runtime/repository', () => ({
  getWorkflowRequestByRequestId: jest.fn(),
  getWorkflowVersion: jest.fn(),
  updateWorkflowRequestWithHistory: jest.fn(),
}));

const repo = require('@/lib/workflows/runtime/repository');
const { RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
const { assignResponsible } = require('@/lib/workflows/runtime/use-cases/assign-responsible');
const { advanceStep } = require('@/lib/workflows/runtime/use-cases/advance-step');
const { finalizeRequest } = require('@/lib/workflows/runtime/use-cases/finalize-request');
const { archiveRequest } = require('@/lib/workflows/runtime/use-cases/archive-request');

function buildWorkflowVersion(overrides = {}) {
  return {
    workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
    version: 1,
    state: 'published',
    stepOrder: ['stp_open', 'stp_work', 'stp_final'],
    stepsById: {
      stp_open: {
        stepId: 'stp_open',
        stepName: 'Solicitação Aberta',
        statusKey: 'solicitacao_aberta',
        kind: 'start',
      },
      stp_work: {
        stepId: 'stp_work',
        stepName: 'Em andamento',
        statusKey: 'em_andamento',
        kind: 'work',
      },
      stp_final: {
        stepId: 'stp_final',
        stepName: 'Finalizado',
        statusKey: 'finalizado',
        kind: 'final',
      },
    },
    ...overrides,
  };
}

function buildRequest(overrides = {}) {
  return {
    requestId: 12,
    workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
    workflowVersion: 1,
    ownerUserId: 'SMO2',
    responsibleUserId: null,
    responsibleName: null,
    operationalParticipantIds: ['SMO2'],
    statusCategory: 'open',
    currentStepId: 'stp_open',
    currentStepName: 'Solicitação Aberta',
    currentStatusKey: 'solicitacao_aberta',
    stepStates: {
      stp_open: 'active',
      stp_work: 'pending',
      stp_final: 'pending',
    },
    isArchived: false,
    ...overrides,
  };
}

describe('workflow runtime use cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('materializa a primeira atribuição em Em andamento', async () => {
    repo.getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-1',
      data: buildRequest(),
    });
    repo.getWorkflowVersion.mockResolvedValue(buildWorkflowVersion());

    await assignResponsible({
      requestId: 12,
      responsibleUserId: 'resp-1',
      responsibleName: 'Responsável',
      actorUserId: 'SMO2',
      actorName: 'Owner',
    });

    expect(repo.updateWorkflowRequestWithHistory).toHaveBeenCalledWith(
      'doc-1',
      expect.objectContaining({
        responsibleUserId: 'resp-1',
        responsibleName: 'Responsável',
        currentStepId: 'stp_work',
        currentStepName: 'Em andamento',
        currentStatusKey: 'em_andamento',
        statusCategory: 'in_progress',
        'stepStates.stp_open': 'completed',
        'stepStates.stp_work': 'active',
      }),
      expect.objectContaining({
        action: 'responsible_assigned',
      }),
    );
  });

  it('falha a primeira atribuição se a versão publicada não puder ser resolvida', async () => {
    repo.getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-1',
      data: buildRequest({
        stepStates: {
          stp_open: 'active',
        },
      }),
    });
    repo.getWorkflowVersion.mockResolvedValue(null);

    await expect(
      assignResponsible({
        requestId: 12,
        responsibleUserId: 'resp-1',
        responsibleName: 'Responsável',
        actorUserId: 'SMO2',
        actorName: 'Owner',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.PUBLISHED_VERSION_NOT_FOUND,
      }),
    );
  });

  it('falha a primeira atribuicao quando a versao publicada nao possui etapa work', async () => {
    repo.getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-missing-work',
      data: buildRequest(),
    });
    repo.getWorkflowVersion.mockResolvedValue(
      buildWorkflowVersion({
        stepOrder: ['stp_open', 'stp_final'],
        stepsById: {
          stp_open: {
            stepId: 'stp_open',
            stepName: 'Solicitação Aberta',
            statusKey: 'solicitacao_aberta',
            kind: 'start',
          },
          stp_final: {
            stepId: 'stp_final',
            stepName: 'Finalizado',
            statusKey: 'finalizado',
            kind: 'final',
          },
        },
      }),
    );

    await expect(
      assignResponsible({
        requestId: 12,
        responsibleUserId: 'resp-1',
        responsibleName: 'Responsável',
        actorUserId: 'SMO2',
        actorName: 'Owner',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.INVALID_PUBLISHED_VERSION,
      }),
    );

    expect(repo.updateWorkflowRequestWithHistory).not.toHaveBeenCalled();
  });

  it('falha assign-responsible em waiting_action', async () => {
    repo.getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-waiting',
      data: buildRequest({
        statusCategory: 'waiting_action',
      }),
    });

    await expect(
      assignResponsible({
        requestId: 12,
        responsibleUserId: 'resp-1',
        responsibleName: 'Responsável',
        actorUserId: 'SMO2',
        actorName: 'Owner',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.INVALID_STEP_TRANSITION,
      }),
    );

    expect(repo.updateWorkflowRequestWithHistory).not.toHaveBeenCalled();
  });

  it('falha assign-responsible quando o ator nao e owner', async () => {
    repo.getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-forbidden',
      data: buildRequest(),
    });

    await expect(
      assignResponsible({
        requestId: 12,
        responsibleUserId: 'resp-1',
        responsibleName: 'Responsável',
        actorUserId: 'third-user',
        actorName: 'Terceiro',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.FORBIDDEN,
      }),
    );

    expect(repo.getWorkflowVersion).not.toHaveBeenCalled();
    expect(repo.updateWorkflowRequestWithHistory).not.toHaveBeenCalled();
  });

  it('reassign-responsible preserva a etapa atual e registra responsible_reassigned', async () => {
    repo.getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-reassign',
      data: buildRequest({
        requestId: 13,
        responsibleUserId: 'resp-atual',
        responsibleName: 'Responsável Atual',
        operationalParticipantIds: ['SMO2', 'resp-atual'],
        statusCategory: 'in_progress',
        currentStepId: 'stp_work',
        currentStepName: 'Em andamento',
        currentStatusKey: 'em_andamento',
      }),
    });

    await assignResponsible({
      requestId: 13,
      responsibleUserId: 'resp-novo',
      responsibleName: 'Novo Responsável',
      actorUserId: 'SMO2',
      actorName: 'Owner',
    });

    expect(repo.getWorkflowVersion).not.toHaveBeenCalled();
    expect(repo.updateWorkflowRequestWithHistory).toHaveBeenCalledWith(
      'doc-reassign',
      expect.objectContaining({
        responsibleUserId: 'resp-novo',
        responsibleName: 'Novo Responsável',
        operationalParticipantIds: ['SMO2', 'resp-atual', 'resp-novo'],
        hasResponsible: true,
      }),
      expect.objectContaining({
        action: 'responsible_reassigned',
        details: expect.objectContaining({
          transitionedToInProgress: false,
        }),
      }),
    );

    expect(repo.updateWorkflowRequestWithHistory).toHaveBeenCalledWith(
      'doc-reassign',
      expect.not.objectContaining({
        currentStepId: 'stp_open',
      }),
      expect.anything(),
    );
  });

  it('bloqueia advance-step quando o próximo passo é final', async () => {
    repo.getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-2',
      data: buildRequest({
        requestId: 20,
        workflowTypeId: 'facilities_solicitacao_compras',
        ownerUserId: 'owner-1',
        responsibleUserId: 'resp-1',
        statusCategory: 'in_progress',
        currentStepId: 'stp_work',
        currentStepName: 'Em andamento',
        stepStates: {
          stp_work: 'active',
          stp_final: 'pending',
        },
      }),
    });
    repo.getWorkflowVersion.mockResolvedValue({
      workflowTypeId: 'facilities_solicitacao_compras',
      version: 1,
      state: 'published',
      stepOrder: ['stp_work', 'stp_final'],
      stepsById: {
        stp_work: {
          stepId: 'stp_work',
          stepName: 'Em andamento',
          statusKey: 'em_andamento',
          kind: 'work',
        },
        stp_final: {
          stepId: 'stp_final',
          stepName: 'Finalizado',
          statusKey: 'finalizado',
          kind: 'final',
        },
      },
    });

    await expect(
      advanceStep({
        requestId: 20,
        actorUserId: 'resp-1',
        actorName: 'Responsável',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.INVALID_STEP_TRANSITION,
      }),
    );
  });

  it('falha advance-step se o ator nao for owner nem responsavel', async () => {
    repo.getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-advance-forbidden',
      data: buildRequest({
        requestId: 21,
        ownerUserId: 'owner-1',
        responsibleUserId: 'resp-1',
        statusCategory: 'in_progress',
        currentStepId: 'stp_work',
        currentStepName: 'Em andamento',
        stepStates: {
          stp_work: 'active',
          stp_mid: 'pending',
        },
      }),
    });

    await expect(
      advanceStep({
        requestId: 21,
        actorUserId: 'outsider',
        actorName: 'Terceiro',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.FORBIDDEN,
      }),
    );

    expect(repo.getWorkflowVersion).not.toHaveBeenCalled();
    expect(repo.updateWorkflowRequestWithHistory).not.toHaveBeenCalled();
  });

  it('falha advance-step quando o request esta finalizado', async () => {
    repo.getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-advance-finalized',
      data: buildRequest({
        requestId: 22,
        ownerUserId: 'owner-1',
        responsibleUserId: 'resp-1',
        statusCategory: 'finalized',
        currentStepId: 'stp_final',
        currentStepName: 'Finalizado',
      }),
    });

    await expect(
      advanceStep({
        requestId: 22,
        actorUserId: 'resp-1',
        actorName: 'Responsável',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.INVALID_STEP_TRANSITION,
      }),
    );

    expect(repo.getWorkflowVersion).not.toHaveBeenCalled();
  });

  it('falha advance-step quando o request esta arquivado', async () => {
    repo.getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-advance-archived',
      data: buildRequest({
        requestId: 23,
        ownerUserId: 'owner-1',
        responsibleUserId: 'resp-1',
        statusCategory: 'archived',
        currentStepId: 'stp_final',
        currentStepName: 'Finalizado',
        isArchived: true,
      }),
    });

    await expect(
      advanceStep({
        requestId: 23,
        actorUserId: 'resp-1',
        actorName: 'Responsável',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.INVALID_STEP_TRANSITION,
      }),
    );

    expect(repo.getWorkflowVersion).not.toHaveBeenCalled();
  });

  it('usa finalize-request como único caminho para a etapa final', async () => {
    repo.getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-3',
      data: buildRequest({
        requestId: 30,
        workflowTypeId: 'facilities_solicitacao_compras',
        ownerUserId: 'owner-1',
        responsibleUserId: 'resp-1',
        statusCategory: 'in_progress',
        currentStepId: 'stp_work',
        currentStepName: 'Em andamento',
        currentStatusKey: 'em_andamento',
        stepStates: {
          stp_open: 'completed',
          stp_work: 'active',
          stp_final: 'pending',
        },
      }),
    });
    repo.getWorkflowVersion.mockResolvedValue(
      buildWorkflowVersion({
        workflowTypeId: 'facilities_solicitacao_compras',
      }),
    );

    await finalizeRequest({
      requestId: 30,
      actorUserId: 'resp-1',
      actorName: 'Responsável',
    });

    expect(repo.updateWorkflowRequestWithHistory).toHaveBeenCalledWith(
      'doc-3',
      expect.objectContaining({
        currentStepId: 'stp_final',
        currentStepName: 'Finalizado',
        currentStatusKey: 'finalizado',
        statusCategory: 'finalized',
        closedAt: expect.anything(),
        finalizedAt: expect.anything(),
      }),
      expect.objectContaining({
        action: 'request_finalized',
      }),
    );

    const update = repo.updateWorkflowRequestWithHistory.mock.calls[0][1];
    expect(update.closedAt).toBe(update.finalizedAt);
  });

  it('permite finalize-request pelo owner como excecao operacional', async () => {
    repo.getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-owner-finalize',
      data: buildRequest({
        requestId: 31,
        ownerUserId: 'owner-1',
        responsibleUserId: 'resp-1',
        statusCategory: 'in_progress',
        currentStepId: 'stp_work',
        currentStepName: 'Em andamento',
        currentStatusKey: 'em_andamento',
        stepStates: {
          stp_open: 'completed',
          stp_work: 'active',
          stp_final: 'pending',
        },
      }),
    });
    repo.getWorkflowVersion.mockResolvedValue(buildWorkflowVersion());

    await finalizeRequest({
      requestId: 31,
      actorUserId: 'owner-1',
      actorName: 'Owner',
    });

    expect(repo.updateWorkflowRequestWithHistory).toHaveBeenCalledWith(
      'doc-owner-finalize',
      expect.objectContaining({
        statusCategory: 'finalized',
      }),
      expect.objectContaining({
        userId: 'owner-1',
        action: 'request_finalized',
      }),
    );
  });

  it('rejeita finalize-request por terceiro nao autorizado', async () => {
    repo.getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-finalize-forbidden',
      data: buildRequest({
        requestId: 32,
        ownerUserId: 'owner-1',
        responsibleUserId: 'resp-1',
        statusCategory: 'in_progress',
        currentStepId: 'stp_work',
        currentStepName: 'Em andamento',
      }),
    });

    await expect(
      finalizeRequest({
        requestId: 32,
        actorUserId: 'third-user',
        actorName: 'Terceiro',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.FINALIZATION_NOT_ALLOWED,
      }),
    );

    expect(repo.getWorkflowVersion).not.toHaveBeenCalled();
    expect(repo.updateWorkflowRequestWithHistory).not.toHaveBeenCalled();
  });

  it('rejeita finalize-request fora de in_progress', async () => {
    repo.getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-finalize-not-ready',
      data: buildRequest({
        requestId: 33,
        ownerUserId: 'owner-1',
        responsibleUserId: 'resp-1',
        statusCategory: 'open',
        currentStepId: 'stp_open',
        currentStepName: 'Solicitação Aberta',
        currentStatusKey: 'solicitacao_aberta',
      }),
    });

    await expect(
      finalizeRequest({
        requestId: 33,
        actorUserId: 'resp-1',
        actorName: 'Responsável',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.FINALIZATION_NOT_ALLOWED,
      }),
    );

    expect(repo.getWorkflowVersion).not.toHaveBeenCalled();
    expect(repo.updateWorkflowRequestWithHistory).not.toHaveBeenCalled();
  });

  it('permite archive apenas após finalização', async () => {
    repo.getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-4',
      data: {
        requestId: 40,
        ownerUserId: 'owner-1',
        isArchived: false,
        statusCategory: 'in_progress',
      },
    });

    await expect(
      archiveRequest({
        requestId: 40,
        actorUserId: 'owner-1',
        actorName: 'Owner',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.REQUEST_ALREADY_FINALIZED,
      }),
    );
  });

  it('permite archive-request apenas para owner apos finalizacao', async () => {
    repo.getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-archive-owner',
      data: buildRequest({
        requestId: 41,
        ownerUserId: 'owner-1',
        responsibleUserId: 'resp-1',
        statusCategory: 'finalized',
        currentStepId: 'stp_final',
        currentStepName: 'Finalizado',
        currentStatusKey: 'finalizado',
        isArchived: false,
        closedAt: { seconds: 10 },
        finalizedAt: { seconds: 10 },
      }),
    });

    await archiveRequest({
      requestId: 41,
      actorUserId: 'owner-1',
      actorName: 'Owner',
    });

    expect(repo.updateWorkflowRequestWithHistory).toHaveBeenCalledWith(
      'doc-archive-owner',
      expect.objectContaining({
        isArchived: true,
        statusCategory: 'archived',
        archivedAt: expect.anything(),
      }),
      expect.objectContaining({
        action: 'request_archived',
      }),
    );

    const update = repo.updateWorkflowRequestWithHistory.mock.calls[0][1];
    expect(update.closedAt).toBeUndefined();
  });

  it('rejeita archive-request por usuario nao-owner', async () => {
    repo.getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-archive-forbidden',
      data: buildRequest({
        requestId: 42,
        ownerUserId: 'owner-1',
        responsibleUserId: 'resp-1',
        statusCategory: 'finalized',
        currentStepId: 'stp_final',
        currentStepName: 'Finalizado',
      }),
    });

    await expect(
      archiveRequest({
        requestId: 42,
        actorUserId: 'resp-1',
        actorName: 'Responsável',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.FORBIDDEN,
      }),
    );

    expect(repo.updateWorkflowRequestWithHistory).not.toHaveBeenCalled();
  });

  it('rejeita archive-request quando o request ja esta arquivado', async () => {
    repo.getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-archive-already',
      data: buildRequest({
        requestId: 43,
        ownerUserId: 'owner-1',
        responsibleUserId: 'resp-1',
        statusCategory: 'archived',
        currentStepId: 'stp_final',
        currentStepName: 'Finalizado',
        currentStatusKey: 'finalizado',
        isArchived: true,
      }),
    });

    await expect(
      archiveRequest({
        requestId: 43,
        actorUserId: 'owner-1',
        actorName: 'Owner',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.REQUEST_ALREADY_ARCHIVED,
      }),
    );

    expect(repo.updateWorkflowRequestWithHistory).not.toHaveBeenCalled();
  });
});
