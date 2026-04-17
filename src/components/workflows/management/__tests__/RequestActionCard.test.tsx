import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequestActionCard } from '../RequestActionCard';

function buildDetail() {
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
      statusCategory: 'in_progress' as const,
      hasResponsible: true,
      hasPendingActions: true,
      pendingActionRecipientIds: ['RESP1'],
      pendingActionTypes: ['approval'],
      operationalParticipantIds: ['SMO2', 'RESP1'],
      slaDays: 5,
      slaState: 'at_risk' as const,
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
      canRequestAction: true,
      canRespondAction: true,
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
      state: 'pending' as const,
      batchId: 'batch-1',
      type: 'approval' as const,
      label: 'Aprovar etapa',
      commentRequired: false,
      attachmentRequired: false,
      commentPlaceholder: null,
      attachmentPlaceholder: null,
      canRequest: true,
      canRespond: true,
      requestedAt: new Date('2026-04-02T09:00:00Z'),
      completedAt: null,
      requestedByUserId: 'SMO2',
      requestedByName: 'Owner',
      recipients: [
        {
          actionRequestId: 'act_req_1',
          recipientUserId: 'RESP1',
          status: 'pending' as const,
          respondedAt: null,
          respondedByUserId: null,
          respondedByName: null,
        },
      ],
      configurationError: null,
    },
    timeline: [],
  };
}

describe('RequestActionCard', () => {
  it('supports the primary visual variant without changing official handlers', async () => {
    const user = userEvent.setup();
    const onRequestAction = jest.fn().mockResolvedValue(undefined);

    render(
      <RequestActionCard
        detail={buildDetail()}
        collaborators={[]}
        onRequestAction={onRequestAction}
        onRespondAction={jest.fn().mockResolvedValue(undefined)}
        variant="primary"
      />,
    );

    const requestButton = screen.getByRole('button', { name: 'Solicitar Aprovar etapa' });

    expect(requestButton.closest('[data-variant="primary"]')).toBeTruthy();

    await user.click(requestButton);

    expect(onRequestAction).toHaveBeenCalledTimes(1);
  });
});
