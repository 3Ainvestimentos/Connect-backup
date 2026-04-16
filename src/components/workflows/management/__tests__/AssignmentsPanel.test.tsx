import { render, screen } from '@testing-library/react';
import type {
  WorkflowManagementAssignmentsData,
  WorkflowManagementRequestSummary,
} from '@/lib/workflows/management/types';
import { AssignmentsPanel } from '../AssignmentsPanel';

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
    statusCategory: 'in_progress',
    hasResponsible: false,
    hasPendingActions: false,
    pendingActionRecipientIds: [],
    pendingActionTypes: [],
    operationalParticipantIds: [],
    slaDays: 3,
    slaState: 'on_track',
    expectedCompletionAt: null,
    lastUpdatedAt: new Date('2026-03-10T12:00:00Z'),
    finalizedAt: null,
    closedAt: null,
    archivedAt: null,
    submittedAt: new Date('2026-03-01T12:00:00Z'),
    submittedMonthKey: '2026-03',
    closedMonthKey: null,
    isArchived: false,
    ...overrides,
  };
}

function buildData(): WorkflowManagementAssignmentsData {
  return {
    pendingActionItems: [buildItem(201, { hasPendingActions: true })],
    assignedItems: [buildItem(202, { responsibleName: 'Owner', hasResponsible: true })],
  };
}

describe('AssignmentsPanel', () => {
  it('renders both operational sections at the same time', () => {
    render(
      <AssignmentsPanel
        data={buildData()}
        activeSubtab="pending"
        hasActiveFilters={false}
        isLoading={false}
        onOpenRequest={jest.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Acoes pendentes para mim' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Atribuidos a mim' })).toBeTruthy();
    expect(screen.getByText('Chamado #201')).toBeTruthy();
    expect(screen.getByText('Chamado #202')).toBeTruthy();
  });

  it('uses the legacy subtab only to preserve section order', () => {
    render(
      <AssignmentsPanel
        data={buildData()}
        activeSubtab="assigned"
        hasActiveFilters={false}
        isLoading={false}
        onOpenRequest={jest.fn()}
      />,
    );

    const assignedHeading = screen.getByRole('heading', { name: 'Atribuidos a mim' });
    const pendingHeading = screen.getByRole('heading', { name: 'Acoes pendentes para mim' });

    expect(
      assignedHeading.compareDocumentPosition(pendingHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('shows independent empty copy for each filtered section', () => {
    render(
      <AssignmentsPanel
        data={{ pendingActionItems: [], assignedItems: [] }}
        activeSubtab="pending"
        hasActiveFilters
        isLoading={false}
        onOpenRequest={jest.fn()}
      />,
    );

    expect(
      screen.getByText('Nenhuma acao pendente corresponde aos filtros aplicados no recorte atual.'),
    ).toBeTruthy();
    expect(
      screen.getByText('Nenhum chamado atribuido corresponde aos filtros aplicados no recorte atual.'),
    ).toBeTruthy();
  });
});
