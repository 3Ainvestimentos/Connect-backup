/** @jest-environment node */

jest.mock('@/lib/workflows/runtime/repository', () => ({
  getWorkflowRequestByRequestId: jest.fn(),
  getWorkflowVersion: jest.fn(),
}));

const { RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
const {
  buildWorkflowRequestDetail,
  getWorkflowRequestDetail,
} = require('@/lib/workflows/read/detail');
const {
  getWorkflowRequestByRequestId,
  getWorkflowVersion,
} = require('@/lib/workflows/runtime/repository');

function buildRequest(overrides = {}) {
  return {
    requestId: 812,
    workflowTypeId: 'facilities_suprimentos',
    workflowVersion: 3,
    formData: {
      nome_sobrenome: 'Lucas Nogueira',
      periodo: { from: '2026-04-02', to: '2026-04-05' },
      anexo_planilha: 'https://storage.googleapis.com/example/planilha.pdf',
      campo_ignorado: '',
      observacao_extra: 'Extra oficial',
      _internal: 'secret',
    },
    stepStates: {
      abertura: 'completed',
      analise: 'completed',
      execucao: 'active',
      encerramento: 'pending',
    },
    history: [
      {
        action: 'entered_step',
        timestamp: { seconds: 3, nanoseconds: 0 },
        userId: 'SMO2',
        userName: 'Owner',
      },
      {
        action: 'request_opened',
        timestamp: { seconds: 1, nanoseconds: 0 },
        userId: 'REQ1',
        userName: 'Requester',
      },
    ],
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
    expectedCompletionAt: { seconds: 10, nanoseconds: 0 },
    lastUpdatedAt: { seconds: 4, nanoseconds: 0 },
    finalizedAt: null,
    closedAt: null,
    archivedAt: null,
    submittedAt: { seconds: 1, nanoseconds: 0 },
    submittedMonthKey: '2026-04',
    closedMonthKey: null,
    isArchived: false,
    ...overrides,
  };
}

function buildVersion(overrides = {}) {
  return {
    workflowTypeId: 'facilities_suprimentos',
    version: 3,
    state: 'published',
    ownerEmailAtPublish: 'owner@3ariva.com.br',
    defaultSlaDays: 5,
    fields: [
      {
        id: 'nome_sobrenome',
        label: 'Nome e Sobrenome',
        type: 'text',
        required: true,
        order: 2,
      },
      {
        id: 'anexo_planilha',
        label: 'Anexo da planilha',
        type: 'file',
        required: false,
        order: 3,
      },
      {
        id: 'periodo',
        label: 'Periodo',
        type: 'date-range',
        required: false,
        order: 1,
      },
    ],
    initialStepId: 'abertura',
    stepOrder: ['abertura', 'analise', 'execucao', 'encerramento'],
    stepsById: {
      abertura: {
        stepId: 'abertura',
        stepName: 'Abertura',
        statusKey: 'abertura',
        kind: 'start',
      },
      analise: {
        stepId: 'analise',
        stepName: 'Analise',
        statusKey: 'analise',
        kind: 'work',
      },
      execucao: {
        stepId: 'execucao',
        stepName: 'Execucao',
        statusKey: 'execucao',
        kind: 'work',
      },
      encerramento: {
        stepId: 'encerramento',
        stepName: 'Encerramento',
        statusKey: 'encerramento',
        kind: 'final',
      },
    },
    publishedAt: { seconds: 1, nanoseconds: 0 },
    ...overrides,
  };
}

describe('workflow request detail composer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('compoe formData, attachments, progress, timeline e permissions sem inflar o summary', () => {
    const detail = buildWorkflowRequestDetail({
      docId: 'doc-1',
      request: buildRequest(),
      version: buildVersion(),
      actorUserId: 'SMO2',
    });

    expect(detail.summary).toEqual(
      expect.objectContaining({
        docId: 'doc-1',
        requestId: 812,
        workflowVersion: 3,
      }),
    );
    expect(detail.permissions).toEqual({
      canAssign: true,
      canFinalize: true,
      canArchive: false,
    });
    expect(detail.formData.fields).toEqual([
      expect.objectContaining({ fieldId: 'periodo', label: 'Periodo' }),
      expect.objectContaining({ fieldId: 'nome_sobrenome', label: 'Nome e Sobrenome' }),
    ]);
    expect(detail.formData.fields.find((field) => field.fieldId === 'anexo_planilha')).toBeUndefined();
    expect(detail.formData.extraFields).toEqual([
      { key: 'observacao_extra', value: 'Extra oficial' },
    ]);
    expect(detail.attachments).toEqual([
      {
        fieldId: 'anexo_planilha',
        label: 'Anexo da planilha',
        url: 'https://storage.googleapis.com/example/planilha.pdf',
      },
    ]);
    expect(detail.progress).toEqual(
      expect.objectContaining({
        currentStepId: 'execucao',
        totalSteps: 4,
        completedSteps: 2,
      }),
    );
    expect(detail.timeline).toEqual([
      expect.objectContaining({
        action: 'request_opened',
        label: 'Solicitacao aberta',
      }),
      expect.objectContaining({
        action: 'entered_step',
        label: 'Entrada em etapa',
      }),
    ]);
  });

  it('usa a workflowVersion congelada no request ao buscar o detalhe', async () => {
    getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-1',
      data: buildRequest(),
    });
    getWorkflowVersion.mockResolvedValue(buildVersion());

    const detail = await getWorkflowRequestDetail(812, 'REQ1');

    expect(getWorkflowVersion).toHaveBeenCalledWith('facilities_suprimentos', 3);
    expect(detail.summary.requestId).toBe(812);
  });

  it('rejeita leitura para outsider fora do escopo operacional', async () => {
    getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-1',
      data: buildRequest(),
    });

    await expect(getWorkflowRequestDetail(812, 'OUT1')).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.FORBIDDEN,
      }),
    );
    expect(getWorkflowVersion).not.toHaveBeenCalled();
  });
});
