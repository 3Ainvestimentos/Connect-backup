import { render, screen } from '@testing-library/react';
import { RequestSummaryList } from '../RequestSummaryList';
import type { PilotRequestSummary } from '@/lib/workflows/pilot/types';

const baseItem: PilotRequestSummary = {
  docId: 'doc-1',
  requestId: 501,
  workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
  workflowVersion: 1,
  workflowName: '',
  areaId: 'facilities',
  ownerEmail: 'owner@example.com',
  ownerUserId: 'owner-1',
  requesterUserId: 'requester-1',
  requesterName: 'Solicitante',
  responsibleUserId: null,
  responsibleName: null,
  currentStepId: 'step-1',
  currentStepName: 'Solicitacao Aberta',
  currentStatusKey: 'open',
  statusCategory: 'open',
  hasResponsible: false,
  hasPendingActions: false,
  pendingActionRecipientIds: [],
  pendingActionTypes: [],
  operationalParticipantIds: [],
  slaDays: 3,
  expectedCompletionAt: null,
  lastUpdatedAt: new Date('2026-03-27T10:20:00.000Z'),
  finalizedAt: null,
  closedAt: null,
  archivedAt: null,
  submittedAt: new Date('2026-03-27T10:20:00.000Z'),
  submittedMonthKey: '2026-03',
  closedMonthKey: null,
  isArchived: false,
};

describe('RequestSummaryList', () => {
  it('uses the workflow short label when workflowName is empty and the workflow is known', () => {
    render(
      <RequestSummaryList
        items={[baseItem]}
        actorUserId="owner-1"
        emptyTitle="Sem chamados"
        emptyDescription="Nenhum item"
        onOpenRequest={jest.fn()}
      />,
    );

    expect(screen.getByText('Manutencao geral')).not.toBeNull();
  });

  it('falls back to the raw workflowTypeId when the workflow is unknown', () => {
    render(
      <RequestSummaryList
        items={[
          {
            ...baseItem,
            workflowTypeId: 'facilities_fluxo_inesperado',
          },
        ]}
        actorUserId="owner-1"
        emptyTitle="Sem chamados"
        emptyDescription="Nenhum item"
        onOpenRequest={jest.fn()}
      />,
    );

    expect(screen.getByText('facilities_fluxo_inesperado')).not.toBeNull();
    expect(screen.queryByText('Manutencao geral')).toBeNull();
  });
});
