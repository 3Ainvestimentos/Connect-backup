/** @jest-environment node */

export {};

jest.mock('../lookups', () => ({
  listWorkflowConfigAreas: jest.fn(),
  listWorkflowConfigOwners: jest.fn(),
}));

jest.mock('../history-v2', () => ({
  loadV2HistoryItems: jest.fn(),
  getAdminV2HistoryDetail: jest.fn(),
}));

jest.mock('../history-legacy', () => ({
  loadLegacyHistoryItems: jest.fn(),
  getAdminLegacyHistoryDetail: jest.fn(),
}));

const { listWorkflowConfigAreas, listWorkflowConfigOwners } = require('../lookups');
const { loadV2HistoryItems } = require('../history-v2');
const { loadLegacyHistoryItems } = require('../history-legacy');
const {
  applyAdminHistoryFilters,
  getAdminHistory,
  sortAdminHistoryItems,
} = require('../history-service');

function makeItem(overrides = {}) {
  return {
    origin: 'v2',
    requestKey: '1',
    requestIdLabel: '0001',
    sourceRequestId: 1,
    areaId: 'facilities',
    areaLabel: 'Facilities',
    workflowTypeId: 'facilities_manutencao',
    workflowLabel: 'Manutencao',
    statusKey: 'em_andamento',
    statusLabel: 'Em andamento',
    statusCategory: 'in_progress',
    ownerUserId: 'SMO2',
    ownerLabel: 'Owner',
    requesterLabel: 'Solicitante',
    responsibleLabel: 'Responsavel',
    submittedAt: '2026-04-01T10:00:00.000Z',
    lastUpdatedAt: '2026-04-01T12:00:00.000Z',
    periodReferenceAt: '2026-04-01T12:00:00.000Z',
    isArchived: false,
    compatibilityWarnings: [],
    ...overrides,
  };
}

describe('history-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listWorkflowConfigAreas.mockResolvedValue([{ areaId: 'facilities', name: 'Facilities', icon: 'building-2' }]);
    listWorkflowConfigOwners.mockResolvedValue([
      {
        collaboratorDocId: 'collab-1',
        userId: 'SMO2',
        name: 'Owner',
        email: 'owner@3ariva.com.br',
      },
    ]);
  });

  it('filters by origin, workflow, owner, status and period', () => {
    const items = [
      makeItem(),
      makeItem({
        origin: 'legacy',
        requestKey: 'legacy-1',
        requestIdLabel: 'L-1',
        workflowTypeId: 'legacy_tipo',
        workflowLabel: 'Legado',
        ownerUserId: null,
        ownerLabel: 'legacy@3ariva.com.br',
        statusCategory: 'open',
        periodReferenceAt: '2026-03-01T10:00:00.000Z',
      }),
    ];

    expect(
      applyAdminHistoryFilters(items, {
        origin: 'v2',
        workflowTypeId: 'facilities_manutencao',
        ownerUserId: 'SMO2',
        statusCategory: 'in_progress',
        periodFrom: '2026-04-01',
        periodTo: '2026-04-30',
      }),
    ).toEqual([items[0]]);
  });

  it('sorts by periodReferenceAt desc and then lastUpdatedAt desc', () => {
    const older = makeItem({ requestKey: '1', periodReferenceAt: '2026-04-01T10:00:00.000Z' });
    const newer = makeItem({ requestKey: '2', periodReferenceAt: '2026-04-02T10:00:00.000Z' });
    const tieBreaker = makeItem({
      requestKey: '3',
      periodReferenceAt: '2026-04-02T10:00:00.000Z',
      lastUpdatedAt: '2026-04-02T11:00:00.000Z',
    });

    expect(sortAdminHistoryItems([older, newer, tieBreaker]).map((item: { requestKey: string }) => item.requestKey)).toEqual([
      '3',
      '2',
      '1',
    ]);
  });

  it('returns merged history with partialSources when legacy fails', async () => {
    loadV2HistoryItems.mockResolvedValue([makeItem()]);
    loadLegacyHistoryItems.mockRejectedValue(new Error('legacy unavailable'));

    const result = await getAdminHistory({});

    expect(result.partialSources).toEqual(['legacy']);
    expect(result.items).toHaveLength(1);
    expect(result.filterOptions.origins).toEqual(['legacy', 'v2']);
    expect(result.totalVisible).toBe(1);
  });

  it('throws when no source is available', async () => {
    loadV2HistoryItems.mockRejectedValue(new Error('v2 unavailable'));
    loadLegacyHistoryItems.mockRejectedValue(new Error('legacy unavailable'));

    await expect(getAdminHistory({})).rejects.toThrow('No history source available.');
  });
});
