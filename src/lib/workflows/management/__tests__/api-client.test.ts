/** @jest-environment node */

import { getManagementRequestDetail } from '@/lib/workflows/management/api-client';

describe('workflow management api client', () => {
  const user = {
    getIdToken: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    user.getIdToken.mockResolvedValue('token-123');
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('normalizes completed action batches without falling back to idle', async () => {
    jest.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        data: {
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
            submittedMonthKey: '2026-04',
            closedMonthKey: null,
            isArchived: false,
          },
          permissions: {
            canAssign: false,
            canFinalize: true,
            canArchive: false,
            canRequestAction: false,
            canRespondAction: false,
          },
          formData: {
            fields: [],
            extraFields: [],
          },
          attachments: [],
          progress: {
            currentStepId: 'execucao',
            totalSteps: 4,
            completedSteps: 2,
            items: [],
          },
          action: {
            available: true,
            state: 'completed',
            batchId: 'act_batch_2',
            type: 'execution',
            label: 'Executar atividade',
            commentRequired: true,
            attachmentRequired: true,
            commentPlaceholder: 'Descreva a execucao',
            attachmentPlaceholder: 'Envie a evidencia',
            canRequest: false,
            canRespond: false,
            requestedAt: { seconds: 1712048400, nanoseconds: 0 },
            completedAt: { seconds: 1712059200, nanoseconds: 0 },
            requestedByUserId: 'RESP1',
            requestedByName: 'Responsavel',
            recipients: [
              {
                actionRequestId: 'act_req_2',
                recipientUserId: 'RESP1',
                status: 'executed',
                respondedAt: { seconds: 1712059200, nanoseconds: 0 },
                respondedByUserId: 'RESP1',
                respondedByName: 'Responsavel',
                responseComment: 'Execucao concluida',
                responseAttachmentUrl: 'https://example.com/comprovante.pdf',
              },
            ],
            configurationError: null,
          },
          timeline: [],
        },
      }),
    } as Response);

    const detail = await getManagementRequestDetail(user as never, 812);

    expect(user.getIdToken).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/workflows/read/requests/812',
      expect.objectContaining({
        cache: 'no-store',
        headers: expect.any(Headers),
      }),
    );
    expect(detail.action.state).toBe('completed');
    expect(detail.action.batchId).toBe('act_batch_2');
    expect(detail.action.completedAt).toEqual(new Date('2024-04-02T12:00:00.000Z'));
  });
});
