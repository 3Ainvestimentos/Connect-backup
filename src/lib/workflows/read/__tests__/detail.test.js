/** @jest-environment node */

jest.mock('@/lib/workflows/runtime/repository', () => ({
  getWorkflowRequestByRequestId: jest.fn(),
  getWorkflowVersion: jest.fn(),
}));

jest.mock('@/lib/workflows/read/queries', () => {
  const actual = jest.requireActual('@/lib/workflows/read/queries');
  return {
    ...actual,
    getWorkflowAreaLabel: jest.fn(),
  };
});

const { RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
const {
  buildWorkflowRequestDetail,
  getWorkflowRequestDetail,
} = require('@/lib/workflows/read/detail');
const {
  getWorkflowRequestByRequestId,
  getWorkflowVersion,
} = require('@/lib/workflows/runtime/repository');
const { getWorkflowAreaLabel } = require('@/lib/workflows/read/queries');

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
    actionRequests: [],
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
        action: {
          type: 'execution',
          label: 'Executar atividade',
          approverIds: ['RESP1', 'EXEC2'],
          commentRequired: true,
          attachmentRequired: true,
          commentPlaceholder: 'Descreva o que foi executado',
          attachmentPlaceholder: 'Envie a evidencia',
        },
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
    getWorkflowAreaLabel.mockResolvedValue('Facilities');
  });

  it('compoe formData, attachments, progress, timeline e permissions sem inflar o summary', () => {
    const detail = buildWorkflowRequestDetail({
      docId: 'doc-1',
      request: buildRequest(),
      version: buildVersion(),
      actorUserId: 'SMO2',
      areaLabel: 'Facilities',
    });

    expect(detail.summary).toEqual(
      expect.objectContaining({
        docId: 'doc-1',
        requestId: 812,
        workflowVersion: 3,
        areaLabel: 'Facilities',
      }),
    );
    expect(detail.permissions).toEqual({
      canAssign: true,
      canAdvance: false,
      canFinalize: false,
      canArchive: false,
      canRequestAction: true,
      canRespondAction: false,
    });
    expect(detail.formData.fields).toEqual([
      expect.objectContaining({ fieldId: 'periodo', label: 'Periodo', order: 1 }),
      expect.objectContaining({ fieldId: 'nome_sobrenome', label: 'Nome e Sobrenome', order: 2 }),
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
        order: 3,
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
    expect(detail.stepsHistory).toEqual([
      {
        stepId: 'abertura',
        stepName: 'Abertura',
        kind: 'start',
        order: 1,
        state: 'completed',
        isCurrent: false,
        events: [],
        actionResponses: [],
      },
      {
        stepId: 'analise',
        stepName: 'Analise',
        kind: 'work',
        order: 2,
        state: 'completed',
        isCurrent: false,
        events: [],
        actionResponses: [],
      },
      {
        stepId: 'execucao',
        stepName: 'Execucao',
        kind: 'work',
        order: 3,
        state: 'active',
        isCurrent: true,
        events: [],
        actionResponses: [],
      },
      {
        stepId: 'encerramento',
        stepName: 'Encerramento',
        kind: 'final',
        order: 4,
        state: 'pending',
        isCurrent: false,
        events: [],
        actionResponses: [],
      },
    ]);
    expect(detail.action).toEqual({
      available: true,
      state: 'idle',
      batchId: null,
      type: 'execution',
      label: 'Executar atividade',
      commentRequired: true,
      attachmentRequired: true,
      commentPlaceholder: 'Descreva o que foi executado',
      attachmentPlaceholder: 'Envie a evidencia',
      canRequest: true,
      canRespond: false,
      requestedAt: null,
      completedAt: null,
      requestedByUserId: null,
      requestedByName: null,
      recipients: [],
      configuredRecipients: [
        { recipientUserId: 'RESP1' },
        { recipientUserId: 'EXEC2' },
      ],
      configurationError: null,
    });
  });

  it('expoe anexos de formulario quando o requester salva upload no formato canonico com fileUrl', () => {
    const detail = buildWorkflowRequestDetail({
      docId: 'doc-file-object',
      request: buildRequest({
        formData: {
          nome_sobrenome: 'Lucas Nogueira',
          periodo: { from: '2026-04-02', to: '2026-04-05' },
          anexo_planilha: {
            fileUrl: 'https://firebasestorage.googleapis.com/v0/b/example/o/planilha.pdf?alt=media&token=abc',
            storagePath:
              'Workflows/workflows_v2/uploads/form_field/facilities_suprimentos/anexo_planilha/2026-04/upl_123-planilha.pdf',
            uploadId: 'upl_123',
            fileName: 'planilha.pdf',
            contentType: 'application/pdf',
          },
        },
      }),
      version: buildVersion(),
      actorUserId: 'SMO2',
      areaLabel: 'Facilities',
    });

    expect(detail.formData.fields.find((field) => field.fieldId === 'anexo_planilha')).toBeUndefined();
    expect(detail.attachments).toEqual([
      {
        fieldId: 'anexo_planilha',
        label: 'Anexo da planilha',
        url: 'https://firebasestorage.googleapis.com/v0/b/example/o/planilha.pdf?alt=media&token=abc',
        fileName: 'planilha.pdf',
        order: 3,
      },
    ]);
  });

  it('expoe batch pendente de action com permissoes de resposta e timeline nova', () => {
    const detail = buildWorkflowRequestDetail({
      docId: 'doc-2',
      request: buildRequest({
        responsibleUserId: 'RESP_EXEC',
        responsibleName: 'Responsavel Execucao',
        statusCategory: 'waiting_action',
        hasPendingActions: true,
        pendingActionRecipientIds: ['EXEC2'],
        pendingActionTypes: ['execution'],
        operationalParticipantIds: ['SMO2', 'RESP_EXEC', 'EXEC2'],
        actionRequests: [
          {
            actionRequestId: 'act_req_1',
            actionBatchId: 'act_batch_1',
            stepId: 'execucao',
            stepName: 'Execucao',
            statusKey: 'execucao',
            type: 'execution',
            label: 'Executar atividade',
            recipientUserId: 'EXEC2',
            requestedByUserId: 'RESP_EXEC',
            requestedByName: 'Responsavel Execucao',
            requestedAt: { seconds: 5, nanoseconds: 0 },
            status: 'pending',
          },
        ],
        history: [
          {
            action: 'request_opened',
            timestamp: { seconds: 1, nanoseconds: 0 },
            userId: 'REQ1',
            userName: 'Requester',
          },
          {
            action: 'action_requested',
            timestamp: { seconds: 4, nanoseconds: 0 },
            userId: 'RESP_EXEC',
            userName: 'Responsavel Execucao',
            details: { stepId: 'execucao' },
          },
        ],
      }),
      version: buildVersion(),
      actorUserId: 'EXEC2',
    });

    expect(detail.permissions).toEqual({
      canAssign: false,
      canAdvance: false,
      canFinalize: false,
      canArchive: false,
      canRequestAction: false,
      canRespondAction: true,
    });
    expect(detail.action).toEqual(
      expect.objectContaining({
        state: 'pending',
        batchId: 'act_batch_1',
        canRequest: false,
        canRespond: true,
        completedAt: null,
        recipients: [
          expect.objectContaining({
            actionRequestId: 'act_req_1',
            recipientUserId: 'EXEC2',
            status: 'pending',
          }),
        ],
        configuredRecipients: [
          { recipientUserId: 'RESP1' },
          { recipientUserId: 'EXEC2' },
        ],
      }),
    );
    expect(detail.timeline).toEqual([
      expect.objectContaining({
        action: 'request_opened',
        label: 'Solicitacao aberta',
      }),
      expect.objectContaining({
        action: 'action_requested',
        label: 'Action solicitada',
      }),
    ]);
    expect(detail.stepsHistory.find((item) => item.stepId === 'execucao')).toEqual(
      expect.objectContaining({
        events: [
          expect.objectContaining({
            action: 'action_requested',
            label: 'Action solicitada',
          }),
        ],
        actionResponses: [
          expect.objectContaining({
            actionRequestId: 'act_req_1',
            recipientUserId: 'EXEC2',
            status: 'pending',
          }),
        ],
      }),
    );
  });

  it('returns empty configuredRecipients when the current step action has configurationError', () => {
    const detail = buildWorkflowRequestDetail({
      docId: 'doc-config-error',
      request: buildRequest(),
      version: buildVersion({
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
            action: {
              type: 'execution',
              label: 'Executar atividade',
              approverIds: [],
              commentRequired: true,
              attachmentRequired: true,
              commentPlaceholder: 'Descreva o que foi executado',
              attachmentPlaceholder: 'Envie a evidencia',
            },
          },
          encerramento: {
            stepId: 'encerramento',
            stepName: 'Encerramento',
            statusKey: 'encerramento',
            kind: 'final',
          },
        },
      }),
      actorUserId: 'SMO2',
      areaLabel: 'Facilities',
    });

    expect(detail.action.configurationError).toBeTruthy();
    expect(detail.action.configuredRecipients).toEqual([]);
  });

  it('normalizes legacy non-execution attachmentRequired in read detail', () => {
    const detail = buildWorkflowRequestDetail({
      docId: 'doc-legacy-approval',
      request: buildRequest(),
      version: buildVersion({
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
            action: {
              type: 'approval',
              label: 'Aprovar atividade',
              approverIds: ['RESP1'],
              commentRequired: true,
              attachmentRequired: true,
              attachmentPlaceholder: 'Nao deveria aparecer como obrigatorio',
            },
          },
          encerramento: {
            stepId: 'encerramento',
            stepName: 'Encerramento',
            statusKey: 'encerramento',
            kind: 'final',
          },
        },
      }),
      actorUserId: 'SMO2',
      areaLabel: 'Facilities',
    });

    expect(detail.action).toEqual(
      expect.objectContaining({
        available: true,
        type: 'approval',
        attachmentRequired: false,
        attachmentPlaceholder: null,
      }),
    );
  });

  it('mantem visivel o ultimo batch encerrado da etapa atual como completed', () => {
    const detail = buildWorkflowRequestDetail({
      docId: 'doc-3',
      request: buildRequest({
        responsibleUserId: 'RESP_EXEC',
        responsibleName: 'Responsavel Execucao',
        statusCategory: 'in_progress',
        hasPendingActions: false,
        pendingActionRecipientIds: [],
        pendingActionTypes: [],
        operationalParticipantIds: ['SMO2', 'RESP_EXEC', 'EXEC2'],
        actionRequests: [
          {
            actionRequestId: 'act_req_old',
            actionBatchId: 'act_batch_old',
            stepId: 'analise',
            stepName: 'Analise',
            statusKey: 'analise',
            type: 'approval',
            label: 'Aprovar etapa anterior',
            recipientUserId: 'APR1',
            requestedByUserId: 'RESP_OLD',
            requestedByName: 'Responsavel Analise',
            requestedAt: { seconds: 2, nanoseconds: 0 },
            status: 'approved',
            respondedAt: { seconds: 3, nanoseconds: 0 },
            respondedByUserId: 'APR1',
            respondedByName: 'Aprovador',
          },
          {
            actionRequestId: 'act_req_2',
            actionBatchId: 'act_batch_2',
            stepId: 'execucao',
            stepName: 'Execucao',
            statusKey: 'execucao',
            type: 'execution',
            label: 'Executar atividade',
            recipientUserId: 'EXEC2',
            requestedByUserId: 'RESP_EXEC',
            requestedByName: 'Responsavel Execucao',
            requestedAt: { seconds: 5, nanoseconds: 0 },
            status: 'executed',
            respondedAt: { seconds: 6, nanoseconds: 0 },
            respondedByUserId: 'EXEC2',
            respondedByName: 'Executor',
            responseComment: 'Execucao concluida',
            responseAttachment: {
              fileName: 'comprovante.pdf',
              contentType: 'application/pdf',
              fileUrl: 'https://storage.googleapis.com/example/comprovante.pdf',
              storagePath:
                'Workflows/workflows_v2/uploads/action_response/facilities_suprimentos/request_812/execucao/2026-04/upl_123-comprovante.pdf',
              uploadId: 'upl_123',
            },
          },
        ],
      }),
      version: buildVersion(),
      actorUserId: 'SMO2',
    });

    expect(detail.permissions.canRequestAction).toBe(false);
    expect(detail.permissions.canAdvance).toBe(false);
    expect(detail.permissions.canFinalize).toBe(true);
    expect(detail.action).toEqual(
      expect.objectContaining({
        state: 'completed',
        batchId: 'act_batch_2',
        canRequest: false,
        canRespond: false,
        requestedAt: { seconds: 5, nanoseconds: 0 },
        completedAt: { seconds: 6, nanoseconds: 0 },
        recipients: [
          expect.objectContaining({
            actionRequestId: 'act_req_2',
            status: 'executed',
            responseComment: 'Execucao concluida',
            responseAttachmentUrl: 'https://storage.googleapis.com/example/comprovante.pdf',
          }),
        ],
      }),
    );
    expect(detail.stepsHistory.find((item) => item.stepId === 'analise')).toEqual(
      expect.objectContaining({
        actionResponses: [
          expect.objectContaining({
            actionRequestId: 'act_req_old',
            status: 'approved',
          }),
        ],
      }),
    );
    expect(detail.stepsHistory.find((item) => item.stepId === 'execucao')).toEqual(
      expect.objectContaining({
        actionResponses: [
          expect.objectContaining({
            actionRequestId: 'act_req_2',
            status: 'executed',
            responseAttachmentUrl: 'https://storage.googleapis.com/example/comprovante.pdf',
          }),
        ],
      }),
    );
  });

  it('nao redistribui eventos sem details.stepId e preserva visibilidade restrita de anexos de resposta', () => {
    const detail = buildWorkflowRequestDetail({
      docId: 'doc-5',
      request: buildRequest({
        actionRequests: [
          {
            actionRequestId: 'act_req_hidden',
            actionBatchId: 'act_batch_hidden',
            stepId: 'execucao',
            stepName: 'Execucao',
            statusKey: 'execucao',
            type: 'execution',
            label: 'Executar atividade',
            recipientUserId: 'EXEC2',
            requestedByUserId: 'RESP1',
            requestedByName: 'Responsavel',
            requestedAt: { seconds: 5, nanoseconds: 0 },
            status: 'executed',
            respondedAt: { seconds: 6, nanoseconds: 0 },
            respondedByUserId: 'EXEC2',
            respondedByName: 'Executor',
            responseAttachment: {
              fileName: 'sigiloso.pdf',
              contentType: 'application/pdf',
              fileUrl: 'https://storage.googleapis.com/example/sigiloso.pdf',
              storagePath: 'Workflows/workflows_v2/uploads/action_response/example.pdf',
            },
          },
        ],
        history: [
          {
            action: 'request_opened',
            timestamp: { seconds: 1, nanoseconds: 0 },
            userId: 'REQ1',
            userName: 'Requester',
          },
          {
            action: 'action_requested',
            timestamp: { seconds: 4, nanoseconds: 0 },
            userId: 'RESP1',
            userName: 'Responsavel',
            details: {},
          },
        ],
      }),
      version: buildVersion(),
      actorUserId: 'OUTRO_ATOR',
      areaLabel: 'Facilities',
    });

    expect(detail.timeline).toHaveLength(2);
    expect(detail.stepsHistory.find((item) => item.stepId === 'execucao')).toEqual(
      expect.objectContaining({
        events: [],
        actionResponses: [
          expect.not.objectContaining({
            responseAttachmentUrl: 'https://storage.googleapis.com/example/sigiloso.pdf',
          }),
        ],
      }),
    );
  });

  it('libera advance apenas quando a etapa atual pode continuar para outra work step', () => {
    const detail = buildWorkflowRequestDetail({
      docId: 'doc-4',
      request: buildRequest({
        currentStepId: 'analise',
        currentStepName: 'Analise',
        currentStatusKey: 'analise',
        responsibleUserId: 'RESP1',
        stepStates: {
          abertura: 'completed',
          analise: 'active',
          execucao: 'pending',
          encerramento: 'pending',
        },
      }),
      version: buildVersion(),
      actorUserId: 'RESP1',
    });

    expect(detail.permissions).toEqual({
      canAssign: false,
      canAdvance: true,
      canFinalize: false,
      canArchive: false,
      canRequestAction: false,
      canRespondAction: false,
    });
  });

  it('usa a workflowVersion congelada no request ao buscar o detalhe', async () => {
    getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-1',
      data: buildRequest(),
    });
    getWorkflowVersion.mockResolvedValue(buildVersion());

    const detail = await getWorkflowRequestDetail(812, 'REQ1');

    expect(getWorkflowVersion).toHaveBeenCalledWith('facilities_suprimentos', 3);
    expect(getWorkflowAreaLabel).toHaveBeenCalledWith('facilities');
    expect(detail.summary.requestId).toBe(812);
    expect(detail.summary.areaLabel).toBe('Facilities');
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
