/** @jest-environment node */

jest.mock('@/lib/workflows/runtime/repository', () => ({
  getWorkflowRequestByRequestId: jest.fn(),
  getWorkflowVersion: jest.fn(),
  updateWorkflowRequestWithHistory: jest.fn(),
  mutateWorkflowRequestAtomically: jest.fn(),
}));

const repo = require('@/lib/workflows/runtime/repository');
const { RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
const { assignResponsible } = require('@/lib/workflows/runtime/use-cases/assign-responsible');
const { advanceStep } = require('@/lib/workflows/runtime/use-cases/advance-step');
const { finalizeRequest } = require('@/lib/workflows/runtime/use-cases/finalize-request');
const { archiveRequest } = require('@/lib/workflows/runtime/use-cases/archive-request');
const { requestAction } = require('@/lib/workflows/runtime/use-cases/request-action');
const { respondAction } = require('@/lib/workflows/runtime/use-cases/respond-action');

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
        action: {
          type: 'approval',
          label: 'Aprovar etapa',
          approverIds: ['APR1', 'APR2'],
        },
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
    hasResponsible: false,
    hasPendingActions: false,
    pendingActionRecipientIds: [],
    pendingActionTypes: [],
    actionRequests: [],
    closedAt: null,
    finalizedAt: null,
    archivedAt: null,
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
    repo.mutateWorkflowRequestAtomically.mockImplementation(async (docId, mutator) => {
      const currentRequest = repo.getWorkflowRequestByRequestId.mock.results.at(-1)?.value
        ? (await repo.getWorkflowRequestByRequestId.mock.results.at(-1).value).data
        : buildRequest();
      const mutation = await mutator(currentRequest, { seconds: 1, nanoseconds: 0 });
      return mutation.result;
    });
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

  it('avanca etapa intermediaria usando o helper canonico do read model', async () => {
    repo.getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-advance-success',
      data: buildRequest({
        requestId: 19,
        ownerUserId: 'owner-1',
        responsibleUserId: 'resp-1',
        responsibleName: 'Responsável',
        operationalParticipantIds: ['owner-1', 'resp-1'],
        statusCategory: 'in_progress',
        currentStepId: 'stp_work',
        currentStepName: 'Em andamento',
        currentStatusKey: 'em_andamento',
        hasResponsible: true,
        stepStates: {
          stp_open: 'completed',
          stp_work: 'active',
          stp_review: 'pending',
          stp_final: 'pending',
        },
      }),
    });
    repo.getWorkflowVersion.mockResolvedValue(
      buildWorkflowVersion({
        stepOrder: ['stp_open', 'stp_work', 'stp_review', 'stp_final'],
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
          stp_review: {
            stepId: 'stp_review',
            stepName: 'Triagem',
            statusKey: 'triagem',
            kind: 'work',
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
      advanceStep({
        requestId: 19,
        actorUserId: 'resp-1',
        actorName: 'Responsável',
      }),
    ).resolves.toEqual({
      docId: 'doc-advance-success',
      requestId: 19,
      newStepId: 'stp_review',
      newStepName: 'Triagem',
    });

    expect(repo.updateWorkflowRequestWithHistory).toHaveBeenCalledWith(
      'doc-advance-success',
      expect.objectContaining({
        stepStates: {
          stp_open: 'completed',
          stp_work: 'completed',
          stp_review: 'active',
          stp_final: 'pending',
        },
        currentStepId: 'stp_review',
        currentStepName: 'Triagem',
        currentStatusKey: 'triagem',
        statusCategory: 'in_progress',
        lastUpdatedAt: expect.anything(),
      }),
      [
        expect.objectContaining({ action: 'step_completed' }),
        expect.objectContaining({ action: 'entered_step' }),
      ],
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

  it('bloqueia advance-step quando existe action pendente na etapa atual', async () => {
    repo.getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-advance-pending-action',
      data: buildRequest({
        requestId: 20,
        ownerUserId: 'owner-1',
        responsibleUserId: 'resp-1',
        statusCategory: 'in_progress',
        currentStepId: 'stp_work',
        currentStepName: 'Em andamento',
        hasPendingActions: true,
        pendingActionRecipientIds: ['APR1'],
        pendingActionTypes: ['approval'],
        actionRequests: [
          {
            actionRequestId: 'act_req_1',
            actionBatchId: 'act_batch_1',
            stepId: 'stp_work',
            stepName: 'Em andamento',
            statusKey: 'em_andamento',
            type: 'approval',
            label: 'Aprovar etapa',
            recipientUserId: 'APR1',
            requestedByUserId: 'RESP1',
            requestedByName: 'Responsavel',
            requestedAt: { seconds: 1, nanoseconds: 0 },
            status: 'pending',
          },
        ],
        stepStates: {
          stp_work: 'active',
          stp_review: 'pending',
          stp_final: 'pending',
        },
      }),
    });

    await expect(
      advanceStep({
        requestId: 20,
        actorUserId: 'resp-1',
        actorName: 'Responsavel',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.INVALID_STEP_TRANSITION,
      }),
    );

    expect(repo.getWorkflowVersion).not.toHaveBeenCalled();
    expect(repo.updateWorkflowRequestWithHistory).not.toHaveBeenCalled();
  });

  it('abre requestAction para todos os approverIds e entra em waiting_action', async () => {
    repo.getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-action-open',
      data: buildRequest({
        requestId: 50,
        responsibleUserId: 'RESP1',
        responsibleName: 'Responsavel',
        statusCategory: 'in_progress',
        currentStepId: 'stp_work',
        currentStepName: 'Em andamento',
        currentStatusKey: 'em_andamento',
        hasResponsible: true,
        operationalParticipantIds: ['SMO2', 'RESP1'],
      }),
    });
    repo.getWorkflowVersion.mockResolvedValue(buildWorkflowVersion());

    await expect(
      requestAction({
        requestId: 50,
        actorUserId: 'RESP1',
        actorName: 'Responsavel',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        docId: 'doc-action-open',
        requestId: 50,
        pendingRecipients: ['APR1', 'APR2'],
      }),
    );

    expect(repo.mutateWorkflowRequestAtomically).toHaveBeenCalledWith(
      'doc-action-open',
      expect.any(Function),
    );
  });

  it('rejeita requestAction quando a etapa atual ja possui batch pendente', async () => {
    repo.getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-action-existing',
      data: buildRequest({
        requestId: 51,
        responsibleUserId: 'RESP1',
        responsibleName: 'Responsavel',
        statusCategory: 'in_progress',
        currentStepId: 'stp_work',
        currentStepName: 'Em andamento',
        currentStatusKey: 'em_andamento',
        hasResponsible: true,
        actionRequests: [
          {
            actionRequestId: 'act_req_1',
            actionBatchId: 'act_batch_1',
            stepId: 'stp_work',
            stepName: 'Em andamento',
            statusKey: 'em_andamento',
            type: 'approval',
            label: 'Aprovar etapa',
            recipientUserId: 'APR1',
            requestedByUserId: 'RESP1',
            requestedByName: 'Responsavel',
            requestedAt: { seconds: 1, nanoseconds: 0 },
            status: 'pending',
          },
        ],
      }),
    });
    repo.getWorkflowVersion.mockResolvedValue(buildWorkflowVersion());

    await expect(
      requestAction({
        requestId: 51,
        actorUserId: 'RESP1',
        actorName: 'Responsavel',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.ACTION_REQUEST_ALREADY_OPEN,
      }),
    );
  });

  it('responde approval e retorna para in_progress ao fechar a ultima pendencia', async () => {
    repo.getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-action-response',
      data: buildRequest({
        requestId: 52,
        responsibleUserId: 'RESP1',
        responsibleName: 'Responsavel',
        statusCategory: 'waiting_action',
        currentStepId: 'stp_work',
        currentStepName: 'Em andamento',
        currentStatusKey: 'em_andamento',
        hasResponsible: true,
        hasPendingActions: true,
        pendingActionRecipientIds: ['APR1'],
        pendingActionTypes: ['approval'],
        operationalParticipantIds: ['SMO2', 'RESP1', 'APR1'],
        actionRequests: [
          {
            actionRequestId: 'act_req_1',
            actionBatchId: 'act_batch_1',
            stepId: 'stp_work',
            stepName: 'Em andamento',
            statusKey: 'em_andamento',
            type: 'approval',
            label: 'Aprovar etapa',
            recipientUserId: 'APR1',
            requestedByUserId: 'RESP1',
            requestedByName: 'Responsavel',
            requestedAt: { seconds: 1, nanoseconds: 0 },
            status: 'pending',
          },
        ],
      }),
    });
    repo.getWorkflowVersion.mockResolvedValue(buildWorkflowVersion());

    await expect(
      respondAction({
        requestId: 52,
        actorUserId: 'APR1',
        actorName: 'Aprovador',
        response: 'approved',
        comment: 'Tudo certo',
      }),
    ).resolves.toEqual({
      docId: 'doc-action-response',
      requestId: 52,
      actionRequestId: 'act_req_1',
      actionBatchId: 'act_batch_1',
      remainingPendingCount: 0,
      statusCategory: 'in_progress',
    });
  });

  it('rejeita respondAction para outsider sem pendencia', async () => {
    repo.getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-action-response-forbidden',
      data: buildRequest({
        requestId: 53,
        responsibleUserId: 'RESP1',
        responsibleName: 'Responsavel',
        statusCategory: 'waiting_action',
        currentStepId: 'stp_work',
        currentStepName: 'Em andamento',
        currentStatusKey: 'em_andamento',
        hasResponsible: true,
        hasPendingActions: true,
        pendingActionRecipientIds: ['APR1'],
        pendingActionTypes: ['approval'],
        actionRequests: [
          {
            actionRequestId: 'act_req_1',
            actionBatchId: 'act_batch_1',
            stepId: 'stp_work',
            stepName: 'Em andamento',
            statusKey: 'em_andamento',
            type: 'approval',
            label: 'Aprovar etapa',
            recipientUserId: 'APR1',
            requestedByUserId: 'RESP1',
            requestedByName: 'Responsavel',
            requestedAt: { seconds: 1, nanoseconds: 0 },
            status: 'pending',
          },
        ],
      }),
    });
    repo.getWorkflowVersion.mockResolvedValue(buildWorkflowVersion());

    await expect(
      respondAction({
        requestId: 53,
        actorUserId: 'OUT1',
        actorName: 'Outsider',
        response: 'approved',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.ACTION_RESPONSE_NOT_ALLOWED,
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

  it('avanca a etapa intermediaria preservando a coerencia do read model', async () => {
    repo.getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-advance-success',
      data: buildRequest({
        requestId: 24,
        ownerUserId: 'owner-1',
        responsibleUserId: 'resp-1',
        responsibleName: 'Responsavel',
        hasResponsible: true,
        statusCategory: 'in_progress',
        currentStepId: 'stp_work',
        currentStepName: 'Em andamento',
        currentStatusKey: 'em_andamento',
        stepStates: {
          stp_open: 'completed',
          stp_work: 'active',
          stp_review: 'pending',
          stp_final: 'pending',
        },
      }),
    });
    repo.getWorkflowVersion.mockResolvedValue(
      buildWorkflowVersion({
        stepOrder: ['stp_open', 'stp_work', 'stp_review', 'stp_final'],
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
          stp_review: {
            stepId: 'stp_review',
            stepName: 'Aguardando validacao',
            statusKey: 'aguardando_validacao',
            kind: 'work',
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
      advanceStep({
        requestId: 24,
        actorUserId: 'resp-1',
        actorName: 'Responsavel',
      }),
    ).resolves.toEqual({
      docId: 'doc-advance-success',
      requestId: 24,
      newStepId: 'stp_review',
      newStepName: 'Aguardando validacao',
    });

    expect(repo.updateWorkflowRequestWithHistory).toHaveBeenCalledWith(
      'doc-advance-success',
      expect.objectContaining({
        stepStates: {
          stp_open: 'completed',
          stp_work: 'completed',
          stp_review: 'active',
          stp_final: 'pending',
        },
        currentStepId: 'stp_review',
        currentStepName: 'Aguardando validacao',
        currentStatusKey: 'aguardando_validacao',
        statusCategory: 'in_progress',
        lastUpdatedAt: expect.anything(),
      }),
      [
        expect.objectContaining({ action: 'step_completed' }),
        expect.objectContaining({ action: 'entered_step' }),
      ],
    );
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
