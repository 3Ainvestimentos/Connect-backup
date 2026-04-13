/** @jest-environment node */

export {};

jest.mock('@/lib/workflows/runtime/repository', () => ({
  getWorkflowRequestByRequestId: jest.fn(),
  getWorkflowVersion: jest.fn(),
}));

jest.mock('@/lib/workflows/read/detail', () => ({
  buildAdminWorkflowRequestDetail: jest.fn(),
}));

const { getWorkflowRequestByRequestId, getWorkflowVersion } = require('@/lib/workflows/runtime/repository');
const { buildAdminWorkflowRequestDetail } = require('@/lib/workflows/read/detail');
const { getAdminV2HistoryDetail } = require('../history-v2');

describe('history-v2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds admin detail through the admin read-only builder', async () => {
    getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'req-doc-1',
      data: {
        requestId: 12,
        workflowTypeId: 'facilities_manutencao',
        workflowVersion: 3,
        workflowName: 'Manutencao',
        areaId: 'facilities',
        ownerEmail: 'owner@3ariva.com.br',
        ownerUserId: 'OWN1',
        requesterUserId: 'REQ1',
        requesterName: 'Requester',
        responsibleUserId: 'RESP1',
        responsibleName: 'Responsible',
        currentStepId: 'step_1',
        currentStepName: 'Etapa atual',
        currentStatusKey: 'em_andamento',
        statusCategory: 'in_progress',
        hasResponsible: true,
        hasPendingActions: false,
        pendingActionRecipientIds: [],
        pendingActionTypes: [],
        operationalParticipantIds: [],
        slaDays: 5,
        expectedCompletionAt: null,
        lastUpdatedAt: null,
        finalizedAt: null,
        closedAt: null,
        archivedAt: null,
        submittedAt: null,
        submittedMonthKey: null,
        closedMonthKey: null,
        isArchived: false,
        formData: {},
        history: [],
        stepStates: {},
        actionRequests: [],
      },
    });
    getWorkflowVersion.mockResolvedValue({
      workflowTypeId: 'facilities_manutencao',
      version: 3,
      fields: [],
      stepOrder: [],
      stepsById: {},
    });
    buildAdminWorkflowRequestDetail.mockReturnValue({
      summary: {},
      permissions: {
        canAssign: false,
        canFinalize: false,
        canArchive: false,
        canRequestAction: false,
        canRespondAction: false,
      },
      formData: { fields: [], extraFields: [] },
      attachments: [],
      progress: { currentStepId: 'step_1', totalSteps: 0, completedSteps: 0, items: [] },
      action: {
        available: false,
        state: 'idle',
        batchId: null,
        type: null,
        label: null,
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
    });

    await getAdminV2HistoryDetail(12);

    expect(buildAdminWorkflowRequestDetail).toHaveBeenCalledWith({
      docId: 'req-doc-1',
      request: expect.objectContaining({
        requestId: 12,
        ownerUserId: 'OWN1',
      }),
      version: expect.objectContaining({
        workflowTypeId: 'facilities_manutencao',
        version: 3,
      }),
    });
  });
});
