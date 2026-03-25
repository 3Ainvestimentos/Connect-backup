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

describe('workflow runtime use cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('materializa a primeira atribuição em Em andamento', async () => {
    repo.getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-1',
      data: {
        requestId: 12,
        workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
        workflowVersion: 1,
        ownerUserId: '3gEXjlKgxJFl0q6udVMu',
        responsibleUserId: null,
        responsibleName: null,
        operationalParticipantIds: ['3gEXjlKgxJFl0q6udVMu'],
        statusCategory: 'open',
        currentStepId: 'stp_open',
        currentStepName: 'Solicitação Aberta',
        currentStatusKey: 'solicitacao_aberta',
        stepStates: {
          stp_open: 'active',
          stp_work: 'pending',
          stp_final: 'pending',
        },
      },
    });
    repo.getWorkflowVersion.mockResolvedValue({
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
    });

    await assignResponsible({
      requestId: 12,
      responsibleUserId: 'resp-1',
      responsibleName: 'Responsável',
      actorUserId: '3gEXjlKgxJFl0q6udVMu',
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
      data: {
        requestId: 12,
        workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
        workflowVersion: 1,
        ownerUserId: '3gEXjlKgxJFl0q6udVMu',
        responsibleUserId: null,
        responsibleName: null,
        operationalParticipantIds: ['3gEXjlKgxJFl0q6udVMu'],
        statusCategory: 'open',
        currentStepId: 'stp_open',
        currentStepName: 'Solicitação Aberta',
        currentStatusKey: 'solicitacao_aberta',
        stepStates: {
          stp_open: 'active',
        },
      },
    });
    repo.getWorkflowVersion.mockResolvedValue(null);

    await expect(
      assignResponsible({
        requestId: 12,
        responsibleUserId: 'resp-1',
        responsibleName: 'Responsável',
        actorUserId: '3gEXjlKgxJFl0q6udVMu',
        actorName: 'Owner',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.PUBLISHED_VERSION_NOT_FOUND,
      }),
    );
  });

  it('bloqueia advance-step quando o próximo passo é final', async () => {
    repo.getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-2',
      data: {
        requestId: 20,
        workflowTypeId: 'facilities_solicitacao_compras',
        workflowVersion: 1,
        ownerUserId: 'owner-1',
        responsibleUserId: 'resp-1',
        statusCategory: 'in_progress',
        currentStepId: 'stp_work',
        currentStepName: 'Em andamento',
        stepStates: {
          stp_work: 'active',
          stp_final: 'pending',
        },
      },
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

  it('usa finalize-request como único caminho para a etapa final', async () => {
    repo.getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-3',
      data: {
        requestId: 30,
        workflowTypeId: 'facilities_solicitacao_compras',
        workflowVersion: 1,
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
      },
    });
    repo.getWorkflowVersion.mockResolvedValue({
      workflowTypeId: 'facilities_solicitacao_compras',
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
    });

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
      }),
      expect.objectContaining({
        action: 'request_finalized',
      }),
    );
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
});
