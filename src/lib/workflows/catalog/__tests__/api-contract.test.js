/** @jest-environment node */

jest.mock('@/lib/workflows/runtime/auth-helpers', () => ({
  authenticateRuntimeActor: jest.fn(),
}));

jest.mock('@/lib/workflows/catalog/published-metadata', () => ({
  getPublishedWorkflowMetadata: jest.fn(),
}));

const { RuntimeError, RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
const { authenticateRuntimeActor } = require('@/lib/workflows/runtime/auth-helpers');
const { getPublishedWorkflowMetadata } = require('@/lib/workflows/catalog/published-metadata');
const { GET } = require('@/app/api/workflows/catalog/[workflowTypeId]/route');

function buildActor() {
  return {
    actorUserId: 'SMO2',
    actorName: 'Owner',
    actorEmail: 'owner@3ariva.com.br',
    collaboratorDocId: 'collab-1',
  };
}

function buildMetadata(overrides = {}) {
  return {
    workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
    workflowName: 'Manutenção / Solicitações Gerais',
    description: 'Solicitação para serviços administrativos gerais.',
    icon: 'Settings',
    areaId: 'u3entfMNB17iklBOdq5H',
    version: 1,
    publishedAt: { seconds: 1, nanoseconds: 0 },
    defaultSlaDays: 5,
    initialStepId: 'stp_open',
    initialStepName: 'Solicitação Aberta',
    fields: [{ id: 'impacto', label: 'Nível de criticidade', type: 'select', required: true, order: 1 }],
    steps: [{ stepId: 'stp_open', stepName: 'Solicitação Aberta', statusKey: 'solicitacao_aberta', kind: 'start', order: 1 }],
    ...overrides,
  };
}

describe('workflow catalog API contract', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    authenticateRuntimeActor.mockResolvedValue({
      decodedToken: { uid: 'firebase-uid-1' },
      actor: buildActor(),
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('retorna envelope canonico de sucesso e repassa workflowTypeId + actorUserId ao service', async () => {
    getPublishedWorkflowMetadata.mockResolvedValue(buildMetadata());

    const response = await GET(
      new Request('http://localhost/api/workflows/catalog/facilities_manutencao_solicitacoes_gerais', {
        headers: { Authorization: 'Bearer token' },
      }),
      { params: Promise.resolve({ workflowTypeId: 'facilities_manutencao_solicitacoes_gerais' }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: expect.objectContaining({
        workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
        workflowName: 'Manutenção / Solicitações Gerais',
      }),
    });
    expect(getPublishedWorkflowMetadata).toHaveBeenCalledWith({
      workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
      actorUserId: 'SMO2',
    });
  });

  it('retorna 401 quando a autenticacao falha antes de consultar o catalogo', async () => {
    authenticateRuntimeActor.mockRejectedValue(
      new RuntimeError(RuntimeErrorCode.UNAUTHORIZED, 'Token nao fornecido.', 401),
    );

    const response = await GET(
      new Request('http://localhost/api/workflows/catalog/facilities_manutencao_solicitacoes_gerais'),
      { params: Promise.resolve({ workflowTypeId: 'facilities_manutencao_solicitacoes_gerais' }) },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: RuntimeErrorCode.UNAUTHORIZED,
      message: 'Token nao fornecido.',
    });
    expect(getPublishedWorkflowMetadata).not.toHaveBeenCalled();
  });

  it('retorna 400 quando o workflow esta inativo para novas aberturas', async () => {
    getPublishedWorkflowMetadata.mockRejectedValue(
      new RuntimeError(
        RuntimeErrorCode.WORKFLOW_TYPE_INACTIVE,
        'O tipo de workflow "Facilities" esta inativo e nao aceita novas solicitacoes.',
        400,
      ),
    );

    const response = await GET(
      new Request('http://localhost/api/workflows/catalog/facilities_manutencao_solicitacoes_gerais', {
        headers: { Authorization: 'Bearer token' },
      }),
      { params: Promise.resolve({ workflowTypeId: 'facilities_manutencao_solicitacoes_gerais' }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: RuntimeErrorCode.WORKFLOW_TYPE_INACTIVE,
      message: 'O tipo de workflow "Facilities" esta inativo e nao aceita novas solicitacoes.',
    });
  });

  it('retorna 403 quando o ator nao pode abrir o workflow', async () => {
    getPublishedWorkflowMetadata.mockRejectedValue(
      new RuntimeError(
        RuntimeErrorCode.FORBIDDEN,
        'Usuario nao possui permissao para abrir solicitacoes neste tipo de workflow.',
        403,
      ),
    );

    const response = await GET(
      new Request('http://localhost/api/workflows/catalog/facilities_manutencao_solicitacoes_gerais', {
        headers: { Authorization: 'Bearer token' },
      }),
      { params: Promise.resolve({ workflowTypeId: 'facilities_manutencao_solicitacoes_gerais' }) },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: RuntimeErrorCode.FORBIDDEN,
      message: 'Usuario nao possui permissao para abrir solicitacoes neste tipo de workflow.',
    });
  });

  it('retorna 404 quando nao existe versao publicada para o workflowTypeId', async () => {
    getPublishedWorkflowMetadata.mockRejectedValue(
      new RuntimeError(
        RuntimeErrorCode.PUBLISHED_VERSION_NOT_FOUND,
        'Tipo de workflow "facilities_manutencao_solicitacoes_gerais" nao possui versao publicada.',
        404,
      ),
    );

    const response = await GET(
      new Request('http://localhost/api/workflows/catalog/facilities_manutencao_solicitacoes_gerais', {
        headers: { Authorization: 'Bearer token' },
      }),
      { params: Promise.resolve({ workflowTypeId: 'facilities_manutencao_solicitacoes_gerais' }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: RuntimeErrorCode.PUBLISHED_VERSION_NOT_FOUND,
      message: 'Tipo de workflow "facilities_manutencao_solicitacoes_gerais" nao possui versao publicada.',
    });
  });

  it('retorna 400 quando latestPublishedVersion aponta para documento fora de state=published', async () => {
    getPublishedWorkflowMetadata.mockRejectedValue(
      new RuntimeError(
        RuntimeErrorCode.VERSION_NOT_PUBLISHED,
        'Versao 1 do tipo "facilities_manutencao_solicitacoes_gerais" nao esta publicada (state=draft).',
        400,
      ),
    );

    const response = await GET(
      new Request('http://localhost/api/workflows/catalog/facilities_manutencao_solicitacoes_gerais', {
        headers: { Authorization: 'Bearer token' },
      }),
      { params: Promise.resolve({ workflowTypeId: 'facilities_manutencao_solicitacoes_gerais' }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: RuntimeErrorCode.VERSION_NOT_PUBLISHED,
      message:
        'Versao 1 do tipo "facilities_manutencao_solicitacoes_gerais" nao esta publicada (state=draft).',
    });
  });

  it('retorna 500 quando a versao publicada esta inconsistente para montar o DTO', async () => {
    getPublishedWorkflowMetadata.mockRejectedValue(
      new RuntimeError(
        RuntimeErrorCode.INVALID_PUBLISHED_VERSION,
        'Versao 1 do tipo "facilities_manutencao_solicitacoes_gerais" sem initialStep valido.',
        500,
      ),
    );

    const response = await GET(
      new Request('http://localhost/api/workflows/catalog/facilities_manutencao_solicitacoes_gerais', {
        headers: { Authorization: 'Bearer token' },
      }),
      { params: Promise.resolve({ workflowTypeId: 'facilities_manutencao_solicitacoes_gerais' }) },
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: RuntimeErrorCode.INVALID_PUBLISHED_VERSION,
      message: 'Versao 1 do tipo "facilities_manutencao_solicitacoes_gerais" sem initialStep valido.',
    });
  });

  it('retorna envelope canonico de INTERNAL_ERROR para falhas inesperadas', async () => {
    getPublishedWorkflowMetadata.mockRejectedValue(new Error('ECONNREFUSED'));

    const response = await GET(
      new Request('http://localhost/api/workflows/catalog/facilities_manutencao_solicitacoes_gerais', {
        headers: { Authorization: 'Bearer token' },
      }),
      { params: Promise.resolve({ workflowTypeId: 'facilities_manutencao_solicitacoes_gerais' }) },
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor.',
    });
  });
});
