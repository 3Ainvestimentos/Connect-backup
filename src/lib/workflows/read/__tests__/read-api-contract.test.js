/** @jest-environment node */

jest.mock('@/lib/workflows/runtime/auth-helpers', () => ({
  authenticateRuntimeActor: jest.fn(),
}));

jest.mock('@/lib/workflows/runtime/permission-auth', () => ({
  authenticateManagementV2Actor: jest.fn(),
  authenticateRequesterV2Actor: jest.fn(),
}));

jest.mock('@/lib/workflows/read/bootstrap', () => ({
  buildWorkflowManagementBootstrap: jest.fn(),
}));

jest.mock('@/lib/workflows/read/detail', () => ({
  getWorkflowRequestDetail: jest.fn(),
}));

jest.mock('@/lib/workflows/read/queries', () => ({
  queryScopedCurrentQueue: jest.fn(),
  queryScopedAssignments: jest.fn(),
  queryScopedCompletedHistory: jest.fn(),
  queryRequesterHistory: jest.fn(),
  groupWorkflowsByMonth: jest.fn(),
}));

const { RuntimeError, RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
const { authenticateRuntimeActor } = require('@/lib/workflows/runtime/auth-helpers');
const { authenticateManagementV2Actor } = require('@/lib/workflows/runtime/permission-auth');
const { authenticateRequesterV2Actor } = require('@/lib/workflows/runtime/permission-auth');
const { buildWorkflowManagementBootstrap } = require('@/lib/workflows/read/bootstrap');
const { getWorkflowRequestDetail } = require('@/lib/workflows/read/detail');
const {
  groupWorkflowsByMonth,
  queryScopedAssignments,
  queryScopedCompletedHistory,
  queryScopedCurrentQueue,
  queryRequesterHistory,
} = require('@/lib/workflows/read/queries');
const { GET: getCurrent } = require('@/app/api/workflows/read/current/route');
const { GET: getAssignments } = require('@/app/api/workflows/read/assignments/route');
const { GET: getCompleted } = require('@/app/api/workflows/read/completed/route');
const { GET: getBootstrap } = require('@/app/api/workflows/read/management/bootstrap/route');
const { GET: getMine } = require('@/app/api/workflows/read/mine/route');
const { GET: getRequestDetail } = require('@/app/api/workflows/read/requests/[requestId]/route');

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

function buildDetail(overrides = {}) {
  return {
    summary: buildSummary(),
    permissions: {
      canAssign: false,
      canAdvance: false,
      canFinalize: true,
      canArchive: false,
      canRequestAction: false,
      canRespondAction: false,
    },
    formData: {
      fields: [
        {
          fieldId: 'nome_sobrenome',
          label: 'Nome e Sobrenome',
          type: 'text',
          value: 'Requester',
        },
      ],
      extraFields: [],
    },
    attachments: [
      {
        fieldId: 'anexo',
        label: 'Planilha',
        url: 'https://example.com/planilha.pdf',
      },
    ],
    progress: {
      currentStepId: 'stp_work',
      totalSteps: 3,
      completedSteps: 1,
      items: [
        {
          stepId: 'stp_open',
          stepName: 'Aberto',
          statusKey: 'aberto',
          kind: 'start',
          order: 1,
          state: 'completed',
          isCurrent: false,
        },
      ],
    },
    action: {
      available: true,
      state: 'idle',
      batchId: null,
      type: 'approval',
      label: 'Aprovar etapa',
      commentRequired: false,
      attachmentRequired: false,
      commentPlaceholder: null,
      attachmentPlaceholder: null,
      canRequest: false,
      canRespond: false,
      requestedAt: null,
      completedAt: null,
      requestedByUserId: null,
      requestedByName: null,
      recipients: [],
      configurationError: null,
    },
    timeline: [
      {
        action: 'request_opened',
        label: 'Solicitacao aberta',
        timestamp: { seconds: 1, nanoseconds: 0 },
        userId: 'REQ1',
        userName: 'Requester',
        details: {},
      },
    ],
    ...overrides,
  };
}

describe('workflow read API contract', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    authenticateRuntimeActor.mockResolvedValue({
      decodedToken: { uid: 'firebase-uid-1' },
      actor: buildActor(),
    });
    authenticateManagementV2Actor.mockResolvedValue({
      decodedToken: { uid: 'firebase-uid-1' },
      actor: buildActor(),
    });
    authenticateRequesterV2Actor.mockResolvedValue({
      decodedToken: { uid: 'firebase-uid-1' },
      actor: buildActor(),
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('retorna envelope canonico em /read/current e repassa o filtro minimo', async () => {
    queryScopedCurrentQueue.mockResolvedValue([buildSummary()]);

    const response = await getCurrent(
      new Request(
        'http://localhost/api/workflows/read/current?filter=waiting_assignment&requestId=800&requesterQuery=Requester',
        {
          headers: { Authorization: 'Bearer token' },
        },
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: {
        filter: 'waiting_assignment',
        items: [expect.objectContaining({ requestId: 800 })],
      },
    });
    expect(queryScopedCurrentQueue).toHaveBeenCalledWith('SMO2', 'waiting_assignment', {
      requestId: 800,
      workflowTypeId: undefined,
      areaId: undefined,
      requesterQuery: 'Requester',
      slaState: undefined,
      periodFrom: undefined,
      periodTo: undefined,
    });
  });

  it('retorna bootstrap oficial com actor, capabilities, ownership e filterOptions', async () => {
    buildWorkflowManagementBootstrap.mockResolvedValue({
      actor: { actorUserId: 'SMO2', actorName: 'Owner' },
      capabilities: {
        canViewCurrentQueue: true,
        canViewAssignments: true,
        canViewCompleted: true,
      },
      ownership: {
        hasOwnedScopes: true,
        workflowTypeIds: ['facilities'],
        areaIds: ['ops'],
      },
      filterOptions: {
        workflows: [
          {
            workflowTypeId: 'facilities',
            workflowName: 'Facilities',
            areaId: 'ops',
          },
        ],
        areas: [{ areaId: 'ops', label: 'Operacoes' }],
      },
    });

    const response = await getBootstrap(
      new Request('http://localhost/api/workflows/read/management/bootstrap', {
        headers: { Authorization: 'Bearer token' },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: {
        actor: { actorUserId: 'SMO2', actorName: 'Owner' },
        capabilities: {
          canViewCurrentQueue: true,
          canViewAssignments: true,
          canViewCompleted: true,
        },
        ownership: {
          hasOwnedScopes: true,
          workflowTypeIds: ['facilities'],
          areaIds: ['ops'],
        },
        filterOptions: {
          workflows: [
            {
              workflowTypeId: 'facilities',
              workflowName: 'Facilities',
              areaId: 'ops',
            },
          ],
          areas: [{ areaId: 'ops', label: 'Operacoes' }],
        },
      },
    });
    expect(buildWorkflowManagementBootstrap).toHaveBeenCalledWith(
      expect.objectContaining({ actorUserId: 'SMO2' }),
    );
  });

  it('retorna detalhe rico canonico em /read/requests/[requestId] para ator autorizado', async () => {
    getWorkflowRequestDetail.mockResolvedValue(buildDetail());

    const response = await getRequestDetail(
      new Request('http://localhost/api/workflows/read/requests/800', {
        headers: { Authorization: 'Bearer token' },
      }),
      { params: Promise.resolve({ requestId: '800' }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: expect.objectContaining({
        summary: expect.objectContaining({ requestId: 800 }),
        permissions: {
          canAssign: false,
          canAdvance: false,
          canFinalize: true,
          canArchive: false,
          canRequestAction: false,
          canRespondAction: false,
        },
        attachments: [expect.objectContaining({ fieldId: 'anexo' })],
        action: expect.objectContaining({
          available: true,
          state: 'idle',
        }),
      }),
    });
    expect(getWorkflowRequestDetail).toHaveBeenCalledWith(800, 'SMO2');
  });

  it('rejeita requestId invalido em /read/requests/[requestId] antes da autenticacao', async () => {
    const response = await getRequestDetail(
      new Request('http://localhost/api/workflows/read/requests/abc', {
        headers: { Authorization: 'Bearer token' },
      }),
      { params: Promise.resolve({ requestId: 'abc' }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: 'INVALID_REQUEST_ID',
      message: 'RequestId invalido.',
    });
    expect(authenticateRuntimeActor).not.toHaveBeenCalled();
  });

  it('propaga 403 em /read/requests/[requestId] para outsider', async () => {
    getWorkflowRequestDetail.mockRejectedValue(
      new RuntimeError(RuntimeErrorCode.FORBIDDEN, 'Usuario nao possui permissao.', 403),
    );

    const response = await getRequestDetail(
      new Request('http://localhost/api/workflows/read/requests/800', {
        headers: { Authorization: 'Bearer token' },
      }),
      { params: Promise.resolve({ requestId: '800' }) },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: RuntimeErrorCode.FORBIDDEN,
      message: 'Usuario nao possui permissao.',
    });
  });

  it('propaga 404 em /read/requests/[requestId] quando o request nao existe', async () => {
    getWorkflowRequestDetail.mockRejectedValue(
      new RuntimeError(RuntimeErrorCode.REQUEST_NOT_FOUND, 'Request nao encontrado.', 404),
    );

    const response = await getRequestDetail(
      new Request('http://localhost/api/workflows/read/requests/999', {
        headers: { Authorization: 'Bearer token' },
      }),
      { params: Promise.resolve({ requestId: '999' }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: RuntimeErrorCode.REQUEST_NOT_FOUND,
      message: 'Request nao encontrado.',
    });
  });

  it('rejeita requestId invalido em /read/current sem tentar autenticar', async () => {
    const response = await getCurrent(
      new Request('http://localhost/api/workflows/read/current?requestId=abc', {
        headers: { Authorization: 'Bearer token' },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: 'INVALID_FILTER',
      message: 'requestId deve ser um inteiro positivo.',
    });
    expect(authenticateRuntimeActor).not.toHaveBeenCalled();
  });

  it('rejeita filtro invalido em /read/current sem tentar autenticar', async () => {
    const response = await getCurrent(new Request('http://localhost/api/workflows/read/current?filter=invalid', {
      headers: { Authorization: 'Bearer token' },
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: 'INVALID_FILTER',
      message: 'Filtro invalido: invalid.',
    });
    expect(authenticateRuntimeActor).not.toHaveBeenCalled();
  });

  it('retorna secoes separadas para atribuicoes e acoes pendentes', async () => {
    queryScopedAssignments.mockResolvedValue({
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
    queryScopedCompletedHistory.mockResolvedValue(items);
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
    authenticateRuntimeActor.mockRejectedValue(
      new RuntimeError(RuntimeErrorCode.UNAUTHORIZED, 'Token nao fornecido.', 401),
    );
    authenticateManagementV2Actor.mockRejectedValue(
      new RuntimeError(RuntimeErrorCode.UNAUTHORIZED, 'Token nao fornecido.', 401),
    );
    authenticateRequesterV2Actor.mockRejectedValue(
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

  it('retorna 500 quando authenticateRuntimeActor lanca erro de infraestrutura', async () => {
    authenticateRuntimeActor.mockRejectedValue(new Error('ECONNREFUSED'));
    authenticateManagementV2Actor.mockRejectedValue(new Error('ECONNREFUSED'));
    authenticateRequesterV2Actor.mockRejectedValue(new Error('ECONNREFUSED'));

    const response = await getAssignments(
      new Request('http://localhost/api/workflows/read/assignments', {
        headers: { Authorization: 'Bearer token' },
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor.',
    });
  });
});
