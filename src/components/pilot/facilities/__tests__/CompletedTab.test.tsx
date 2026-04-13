import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompletedTab } from '../CompletedTab';
import type { PilotMonthGroup, PilotRequestSummary } from '@/lib/workflows/pilot/types';

const completedItem: PilotRequestSummary = {
  docId: 'doc-1',
  requestId: 801,
  workflowTypeId: 'facilities_solicitacao_compras',
  workflowVersion: 1,
  workflowName: 'Solicitacao de compras',
  areaId: 'facilities',
  ownerEmail: 'owner@example.com',
  ownerUserId: 'owner-1',
  requesterUserId: 'requester-1',
  requesterName: 'Lucas',
  responsibleUserId: 'resp-1',
  responsibleName: 'Maria Silva',
  currentStepId: 'step-5',
  currentStepName: 'Finalizado',
  currentStatusKey: 'finalizado',
  statusCategory: 'finalized',
  hasResponsible: true,
  hasPendingActions: false,
  pendingActionRecipientIds: [],
  pendingActionTypes: [],
  operationalParticipantIds: ['owner-1', 'resp-1'],
  slaDays: 5,
  expectedCompletionAt: null,
  lastUpdatedAt: new Date('2026-04-02T10:20:00.000Z'),
  finalizedAt: new Date('2026-04-02T10:20:00.000Z'),
  closedAt: new Date('2026-04-02T10:20:00.000Z'),
  archivedAt: null,
  submittedAt: new Date('2026-03-30T10:20:00.000Z'),
  submittedMonthKey: '2026-03',
  closedMonthKey: '2026-04',
  isArchived: false,
};

describe('CompletedTab', () => {
  it('renders monthly groups from the completed endpoint and opens the selected item', async () => {
    const user = userEvent.setup();
    const onOpenRequest = jest.fn();
    const groups: PilotMonthGroup[] = [
      {
        monthKey: '2026-04',
        items: [completedItem],
      },
    ];

    render(
      <CompletedTab
        groups={groups}
        items={[completedItem]}
        isLoading={false}
        actorUserId="owner-1"
        scopeLabel="todos os workflows"
        onOpenRequest={onOpenRequest}
      />,
    );

    expect(screen.getByText('abril de 2026')).not.toBeNull();
    expect(screen.getByText('Chamado #801')).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Abrir' }));

    expect(onOpenRequest).toHaveBeenCalledWith(completedItem);
  });

  it('shows an empty state when there are no completed items', () => {
    render(
      <CompletedTab
        groups={[]}
        items={[]}
        isLoading={false}
        actorUserId="owner-1"
        scopeLabel="somente compras"
        onOpenRequest={jest.fn()}
      />,
    );

    expect(screen.getByText('Concluidas')).not.toBeNull();
    expect(screen.getByText('Exibindo: somente compras.')).not.toBeNull();
  });
});
