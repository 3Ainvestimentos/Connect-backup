import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { WorkflowManagementRequestSummary } from '@/lib/workflows/management/types';
import { CompletedPanel } from '../CompletedPanel';

jest.mock('lucide-react', () => ({
  ChevronDown: () => null,
}));

function buildItem(
  requestId: number,
  overrides: Partial<WorkflowManagementRequestSummary> = {},
): WorkflowManagementRequestSummary {
  return {
    docId: `doc-${requestId}`,
    requestId,
    workflowTypeId: 'facilities',
    workflowVersion: 1,
    workflowName: 'Facilities',
    areaId: 'ops',
    ownerEmail: 'owner@example.com',
    ownerUserId: 'SMO2',
    requesterUserId: `user-${requestId}`,
    requesterName: `Requester ${requestId}`,
    responsibleUserId: null,
    responsibleName: null,
    currentStepId: 'step-1',
    currentStepName: 'Triagem',
    currentStatusKey: 'open',
    statusCategory: 'finalized',
    hasResponsible: false,
    hasPendingActions: false,
    pendingActionRecipientIds: [],
    pendingActionTypes: [],
    operationalParticipantIds: [],
    slaDays: 3,
    slaState: 'on_track',
    expectedCompletionAt: null,
    lastUpdatedAt: new Date('2026-03-10T12:00:00Z'),
    finalizedAt: new Date('2026-03-10T12:00:00Z'),
    closedAt: new Date('2026-03-10T12:00:00Z'),
    archivedAt: null,
    submittedAt: new Date('2026-03-01T12:00:00Z'),
    submittedMonthKey: '2026-03',
    closedMonthKey: '2026-03',
    isArchived: false,
    ...overrides,
  };
}

describe('CompletedPanel', () => {
  it('sorts groups by newest month, keeps unknown last and opens the newest group by default', async () => {
    const user = userEvent.setup();
    const januaryItem = buildItem(101, {
      requesterName: 'Janeiro',
      submittedMonthKey: '2026-01',
      closedMonthKey: '2026-01',
    });
    const marchItem = buildItem(103, {
      requesterName: 'Marco',
      submittedMonthKey: '2026-03',
      closedMonthKey: '2026-03',
    });
    const unknownItem = buildItem(199, {
      requesterName: 'Sem mes',
      submittedMonthKey: 'unknown',
      closedMonthKey: null,
    });

    render(
      <CompletedPanel
        data={{
          items: [januaryItem, marchItem, unknownItem],
          groups: [
            { monthKey: '2026-01', items: [januaryItem] },
            { monthKey: 'unknown', items: [unknownItem] },
            { monthKey: '2026-03', items: [marchItem] },
          ],
        }}
        hasActiveFilters={false}
        isLoading={false}
        onOpenRequest={jest.fn()}
      />,
    );

    const marchTrigger = screen.getByRole('button', { name: /março de 2026/i });
    const januaryTrigger = screen.getByRole('button', { name: /janeiro de 2026/i });
    const unknownTrigger = screen.getByRole('button', { name: /sem referencia mensal/i });

    expect(
      marchTrigger.compareDocumentPosition(januaryTrigger) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      januaryTrigger.compareDocumentPosition(unknownTrigger) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    expect(screen.getByText('Chamado #103')).toBeTruthy();
    expect(screen.queryByText('Chamado #101')).toBeNull();

    await user.click(januaryTrigger);

    expect(screen.getByText('Chamado #101')).toBeTruthy();
    expect(screen.queryByText('Chamado #103')).toBeNull();
  });
});
