/** @jest-environment node */

jest.mock('@/lib/workflows/runtime/auth-helpers', () => ({
  verifyBearerToken: jest.fn(),
}));

jest.mock('@/lib/workflows/runtime/actor-resolution', () => ({
  resolveRuntimeActor: jest.fn(),
}));

jest.mock('@/lib/workflows/read/queries', () => ({
  queryOwnerCurrentQueue: jest.fn(),
  queryAssignmentsForActor: jest.fn(),
  queryCompletedHistory: jest.fn(),
  queryRequesterHistory: jest.fn(),
  groupWorkflowsByMonth: jest.fn(),
}));

const { RuntimeError, RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
const { verifyBearerToken } = require('@/lib/workflows/runtime/auth-helpers');
const { resolveRuntimeActor } = require('@/lib/workflows/runtime/actor-resolution');
const {
  groupWorkflowsByMonth,
  queryAssignmentsForActor,
  queryCompletedHistory,
  queryOwnerCurrentQueue,
  queryRequesterHistory,
} = require('@/lib/workflows/read/queries');
const { GET: getCurrent } = require('@/app/api/workflows/read/current/route');
const { GET: getAssignments } = require('@/app/api/workflows/read/assignments/route');
const { GET: getCompleted } = require('@/app/api/workflows/read/completed/route');
const { GET: getMine } = require('@/app/api/workflows/read/mine/route');

function buildActor() {
  return {
    actorUserId: 'SMO2',
    actorName: 'Owner',
    actorEmail: 'owner@3ariva.com.br',
    collaboratorDocId: 'collab-1',
  };
}

function buildSummary(overrides = {}) {
  return {
    docId: 'doc-1',
    requestId: 800,
    workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
    workflowVersion: 1,
    workflowName: 'Facilities',
    areaId: 'area-1',
    ownerEmail: 'owner@3ariva.com.br',
    ownerUserId: 'SMO2',
    requesterUserId: 'REQ1',
    requesterName: 'Requester',
    responsibleUserId: 'RESP1',
    responsibleName: 'Responsável',
    currentStepId: 'stp_work',
    currentStepName: 'Em andamento',
    currentStatusKey: 'em_andamento',
    statusCategory: 'in_progress',
    hasResponsible: true,
    hasPendingActions: false,
    pendingActionRecipientIds: [],
    pendingActionTypes: [],
    operationalParticipantIds: ['SMO2', 'RESP1'],
    slaDays: 5,
    expectedCompletionAt: null,
    lastUpdatedAt: null,
    finalizedAt: null,
    closedAt: null,
    archivedAt: null,
    submittedAt: null,
    submittedMonthKey: '2026-03',
    closedMonthKey: null,
    isArchived: false,
    ...overrides,
  };
}

describe('workflow read API contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    verifyBearerToken.mockResolvedValue({ uid: 'firebase-uid-1' });
    resolveRuntimeActor.mockResolvedValue(buildActor());
  });

  it('retorna envelope canonico em /read/current e repassa o filtro minimo', async () => {
    queryOwnerCurrentQueue.mockResolvedValue([buildSummary()]);

    const response = await getCurrent(
      new Request('http://localhost/api/workflows/read/current?filter=waiting_assignment', {
        headers: { Authorization: 'Bearer token' },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: {
        filter: 'waiting_assignment',
        items: [expect.objectContaining({ requestId: 800 })],
      },
    });
    expect(queryOwnerCurrentQueue).toHaveBeenCalledWith('SMO2', 'waiting_assignment');
  });

  it('rejeita filtro invalido em /read/current sem tentar autenticar', async () => {
    const response = await getCurrent(
      new Request('http://localhost/api/workflows/read/current?filter=invalid', {
        headers: { Authorization: 'Bearer token' },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: 'INVALID_FILTER',
      message: 'Filtro invalido: invalid.',
    });
    expect(verifyBearerToken).not.toHaveBeenCalled();
  });

  it('retorna secoes separadas para atribuicoes e acoes pendentes', async () => {
    queryAssignmentsForActor.mockResolvedValue({
      assignedItems: [buildSummary()],
      pendingActionItems: [buildSummary({ docId: 'doc-2', requestId: 801, statusCategory: 'waiting_action' })],
    });

    const response = await getAssignments(
      new Request('http://localhost/api/workflows/read/assignments', {
        headers: { Authorization: 'Bearer token' },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: {
        assignedItems: [expect.objectContaining({ requestId: 800 })],
        pendingActionItems: [expect.objectContaining({ requestId: 801 })],
      },
    });
  });

  it('agrupa Concluidas por closedMonthKey e preserva o envelope de sucesso', async () => {
    const items = [
      buildSummary({ statusCategory: 'finalized', closedMonthKey: '2026-03', closedAt: { seconds: 3 } }),
    ];
    queryCompletedHistory.mockResolvedValue(items);
    groupWorkflowsByMonth.mockReturnValue([{ monthKey: '2026-03', items }]);

    const response = await getCompleted(
      new Request('http://localhost/api/workflows/read/completed', {
        headers: { Authorization: 'Bearer token' },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: {
        items,
        groups: [{ monthKey: '2026-03', items }],
      },
    });
    expect(groupWorkflowsByMonth).toHaveBeenCalledWith(items, 'closedMonthKey');
  });

  it('mapeia erro de autenticacao nas rotas read-side com envelope consistente', async () => {
    verifyBearerToken.mockRejectedValue(
      new RuntimeError(RuntimeErrorCode.UNAUTHORIZED, 'Token nao fornecido.', 401),
    );

    const response = await getMine(
      new Request('http://localhost/api/workflows/read/mine'),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: RuntimeErrorCode.UNAUTHORIZED,
      message: 'Token nao fornecido.',
    });
    expect(queryRequesterHistory).not.toHaveBeenCalled();
  });
});
