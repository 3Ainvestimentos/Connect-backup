/** @jest-environment node */

export {};

jest.mock('@/lib/workflows/admin-config/auth', () => ({
  authenticateWorkflowConfigAdmin: jest.fn(),
}));

jest.mock('@/lib/workflows/admin-config/history-service', () => ({
  getAdminHistory: jest.fn(),
  getAdminHistoryDetail: jest.fn(),
}));

const { RuntimeError, RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
const { authenticateWorkflowConfigAdmin } = require('@/lib/workflows/admin-config/auth');
const { getAdminHistory, getAdminHistoryDetail } = require('@/lib/workflows/admin-config/history-service');
const { GET: listHistory } = require('@/app/api/admin/request-config/history/route');
const { GET: detailHistory } = require('@/app/api/admin/request-config/history/[origin]/[requestKey]/route');

describe('request-config history routes', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    authenticateWorkflowConfigAdmin.mockResolvedValue({
      decodedToken: { uid: 'firebase-uid-1' },
      collaborator: { id: 'collab-1', permissions: { canManageWorkflowsV2: true } },
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('returns the unified list payload', async () => {
    getAdminHistory.mockResolvedValue({
      items: [],
      filterOptions: {
        origins: ['legacy', 'v2'],
        areas: [],
        workflows: [],
        owners: [],
        statusCategories: ['open', 'in_progress', 'waiting_action', 'finalized', 'archived'],
      },
      partialSources: [],
      totalVisible: 0,
    });

    const response = await listHistory(
      new Request('http://localhost/api/admin/request-config/history?origin=v2&limit=20', {
        headers: { Authorization: 'Bearer token' },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: {
        items: [],
        filterOptions: {
          origins: ['legacy', 'v2'],
          areas: [],
          workflows: [],
          owners: [],
          statusCategories: ['open', 'in_progress', 'waiting_action', 'finalized', 'archived'],
        },
        partialSources: [],
        totalVisible: 0,
      },
    });
    expect(getAdminHistory).toHaveBeenCalledWith({
      origin: 'v2',
      areaId: undefined,
      workflowTypeId: undefined,
      statusCategory: undefined,
      ownerUserId: undefined,
      periodFrom: undefined,
      periodTo: undefined,
      query: undefined,
      limit: 20,
    });
  });

  it('returns 401 when authentication fails', async () => {
    authenticateWorkflowConfigAdmin.mockRejectedValue(
      new RuntimeError(RuntimeErrorCode.UNAUTHORIZED, 'Token nao fornecido.', 401),
    );

    const response = await listHistory(new Request('http://localhost/api/admin/request-config/history'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: RuntimeErrorCode.UNAUTHORIZED,
      message: 'Token nao fornecido.',
    });
  });

  it('returns detail by origin', async () => {
    getAdminHistoryDetail.mockResolvedValue({
      origin: 'legacy',
      summary: {
        origin: 'legacy',
        requestKey: 'legacy-1',
        requestIdLabel: 'legacy-1',
        areaLabel: 'Legado',
        workflowLabel: 'Legado',
        statusLabel: 'aberto',
        statusCategory: 'open',
        ownerLabel: '-',
        requesterLabel: '-',
        responsibleLabel: null,
        submittedAt: null,
        lastUpdatedAt: null,
        periodReferenceAt: null,
        isArchived: false,
        compatibilityWarnings: [],
      },
      detail: {
        formEntries: [],
        history: [],
        attachments: [],
      },
    });

    const response = await detailHistory(
      new Request('http://localhost/api/admin/request-config/history/legacy/legacy-1', {
        headers: { Authorization: 'Bearer token' },
      }),
      {
        params: Promise.resolve({
          origin: 'legacy',
          requestKey: 'legacy-1',
        }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: {
        origin: 'legacy',
      },
    });
    expect(getAdminHistoryDetail).toHaveBeenCalledWith('legacy', 'legacy-1');
  });

  it('returns 400 for an invalid origin', async () => {
    const response = await detailHistory(
      new Request('http://localhost/api/admin/request-config/history/invalid/1', {
        headers: { Authorization: 'Bearer token' },
      }),
      {
        params: Promise.resolve({
          origin: 'invalid',
          requestKey: '1',
        }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: RuntimeErrorCode.INVALID_DRAFT_PAYLOAD,
      message: 'Origem de historico invalida.',
    });
  });
});
