import { filterMonthGroupsByWorkflow, filterRequestsByWorkflow } from '../workflow-filters';
import type { PilotMonthGroup, PilotRequestSummary } from '../types';

const maintenanceRequest: PilotRequestSummary = {
  docId: 'doc-1',
  requestId: 101,
  workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
  workflowVersion: 1,
  workflowName: 'Manutencao',
  areaId: 'facilities',
  ownerEmail: 'owner@example.com',
  ownerUserId: 'owner-1',
  requesterUserId: 'requester-1',
  requesterName: 'Solicitante',
  responsibleUserId: null,
  responsibleName: null,
  currentStepId: 'step-1',
  currentStepName: 'Aberto',
  currentStatusKey: 'open',
  statusCategory: 'open',
  hasResponsible: false,
  hasPendingActions: false,
  pendingActionRecipientIds: [],
  pendingActionTypes: [],
  operationalParticipantIds: [],
  slaDays: 3,
  expectedCompletionAt: null,
  lastUpdatedAt: new Date('2026-03-30T10:00:00.000Z'),
  finalizedAt: null,
  closedAt: null,
  archivedAt: null,
  submittedAt: new Date('2026-03-30T10:00:00.000Z'),
  submittedMonthKey: '2026-03',
  closedMonthKey: null,
  isArchived: false,
};

const suppliesRequest: PilotRequestSummary = {
  ...maintenanceRequest,
  docId: 'doc-2',
  requestId: 202,
  workflowTypeId: 'facilities_solicitacao_suprimentos',
  workflowName: 'Suprimentos',
  submittedMonthKey: '2026-04',
};

describe('workflow-filters', () => {
  it('preserves the original array when the scope is all', () => {
    const items = [maintenanceRequest, suppliesRequest];

    expect(
      filterRequestsByWorkflow(
        items,
        'all',
        'facilities_manutencao_solicitacoes_gerais',
      ),
    ).toBe(items);
  });

  it('filters flat lists by the active workflow', () => {
    expect(
      filterRequestsByWorkflow(
        [maintenanceRequest, suppliesRequest],
        'active',
        'facilities_solicitacao_suprimentos',
      ),
    ).toEqual([suppliesRequest]);
  });

  it('rebuilds monthly groups without mutating the cache payload', () => {
    const groups: PilotMonthGroup[] = [
      {
        monthKey: '2026-03',
        items: [maintenanceRequest],
      },
      {
        monthKey: '2026-04',
        items: [suppliesRequest],
      },
    ];

    const filtered = filterMonthGroupsByWorkflow(
      groups,
      'active',
      'facilities_solicitacao_suprimentos',
    );

    expect(filtered).toEqual([
      {
        monthKey: '2026-04',
        items: [suppliesRequest],
      },
    ]);
    expect(filtered).not.toBe(groups);
    expect(groups[0].items).toEqual([maintenanceRequest]);
    expect(groups[1].items).toEqual([suppliesRequest]);
  });
});
