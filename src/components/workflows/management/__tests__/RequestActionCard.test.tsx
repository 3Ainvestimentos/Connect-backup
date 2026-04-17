import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { buildManagementRequestDetailFixture } from '@/lib/workflows/management/__tests__/request-detail-test-data';
import { RequestActionCard } from '../RequestActionCard';

describe('RequestActionCard', () => {
  it('supports the primary visual variant without changing official handlers', async () => {
    const user = userEvent.setup();
    const onRequestAction = jest.fn().mockResolvedValue(undefined);

    render(
      <RequestActionCard
        detail={buildManagementRequestDetailFixture({
          summary: {
            hasPendingActions: true,
            pendingActionRecipientIds: ['RESP1'],
            pendingActionTypes: ['approval'],
          },
          permissions: {
            canRequestAction: true,
            canRespondAction: true,
          },
          action: {
            state: 'pending',
            batchId: 'batch-1',
            canRequest: true,
            canRespond: true,
            requestedAt: new Date('2026-04-02T09:00:00Z'),
            requestedByUserId: 'SMO2',
            requestedByName: 'Owner',
            recipients: [
              {
                actionRequestId: 'act_req_1',
                recipientUserId: 'RESP1',
                status: 'pending',
                respondedAt: null,
                respondedByUserId: null,
                respondedByName: null,
              },
            ],
          },
        })}
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

  it('shows requesting busy copy and disables the request CTA', () => {
    render(
      <RequestActionCard
        detail={buildManagementRequestDetailFixture({
          permissions: {
            canRequestAction: true,
          },
          action: {
            canRequest: true,
            canRespond: false,
          },
        })}
        collaborators={[]}
        onRequestAction={jest.fn().mockResolvedValue(undefined)}
        onRespondAction={jest.fn().mockResolvedValue(undefined)}
        isRequestingAction
      />,
    );

    const button = screen.getByRole('button', { name: 'Solicitando...' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('blocks response controls and exposes sending label while respondAction is pending', () => {
    render(
      <RequestActionCard
        detail={buildManagementRequestDetailFixture({
          permissions: {
            canRespondAction: true,
          },
          action: {
            state: 'pending',
            canRequest: false,
            canRespond: true,
            commentRequired: true,
            recipients: [
              {
                actionRequestId: 'act_req_1',
                recipientUserId: 'RESP1',
                status: 'pending',
                respondedAt: null,
                respondedByUserId: null,
                respondedByName: null,
              },
            ],
          },
        })}
        collaborators={[]}
        onRequestAction={jest.fn().mockResolvedValue(undefined)}
        onRespondAction={jest.fn().mockResolvedValue(undefined)}
        isRespondingAction
      />,
    );

    expect(screen.getByRole('textbox', { name: 'Comentario *' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Aprovar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Rejeitar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Enviando...' })).toBeDisabled();
  });

  it('submits an execution response only after comment and attachment requirements are satisfied', async () => {
    const user = userEvent.setup();
    const onRespondAction = jest.fn().mockResolvedValue(undefined);

    render(
      <RequestActionCard
        detail={buildManagementRequestDetailFixture({
          permissions: {
            canRespondAction: true,
          },
          action: {
            type: 'execution',
            state: 'pending',
            canRequest: false,
            canRespond: true,
            commentRequired: true,
            attachmentRequired: true,
            attachmentPlaceholder: 'Envie a evidencia obrigatoria.',
            recipients: [
              {
                actionRequestId: 'act_req_1',
                recipientUserId: 'RESP1',
                status: 'pending',
                respondedAt: null,
                respondedByUserId: null,
                respondedByName: null,
              },
            ],
          },
        })}
        collaborators={[]}
        onRequestAction={jest.fn().mockResolvedValue(undefined)}
        onRespondAction={onRespondAction}
      />,
    );

    const submitButton = screen.getByRole('button', { name: 'Registrar execucao' });
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByRole('textbox', { name: 'Comentario *' }), 'Execucao concluida');
    expect(submitButton).toBeDisabled();

    const file = new File(['ok'], 'evidencia.txt', { type: 'text/plain' });
    await user.upload(screen.getByLabelText('Anexo *'), file);
    expect(submitButton).not.toBeDisabled();

    await user.click(submitButton);

    expect(onRespondAction).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: 812 }),
      expect.objectContaining({
        response: 'executed',
        comment: 'Execucao concluida',
        attachmentFile: file,
      }),
    );
  });
});
