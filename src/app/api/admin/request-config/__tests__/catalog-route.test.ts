/** @jest-environment node */

export {};

jest.mock('@/lib/workflows/admin-config/auth', () => ({
  authenticateWorkflowConfigAdmin: jest.fn(),
}));

jest.mock('@/lib/workflows/admin-config/catalog', () => ({
  buildWorkflowConfigCatalog: jest.fn(),
}));

const { RuntimeError, RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
const { authenticateWorkflowConfigAdmin } = require('@/lib/workflows/admin-config/auth');
const { buildWorkflowConfigCatalog } = require('@/lib/workflows/admin-config/catalog');
const { GET } = require('@/app/api/admin/request-config/catalog/route');

describe('request-config catalog route', () => {
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

  it('returns the canonical success envelope', async () => {
    buildWorkflowConfigCatalog.mockResolvedValue({
      areas: [],
      summary: {
        areaCount: 0,
        workflowTypeCount: 0,
        versionCount: 0,
      },
    });

    const response = await GET(
      new Request('http://localhost/api/admin/request-config/catalog', {
        headers: { Authorization: 'Bearer token' },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: {
        areas: [],
        summary: {
          areaCount: 0,
          workflowTypeCount: 0,
          versionCount: 0,
        },
      },
    });
    expect(authenticateWorkflowConfigAdmin).toHaveBeenCalledTimes(1);
    expect(buildWorkflowConfigCatalog).toHaveBeenCalledTimes(1);
  });

  it('returns 401 when authentication fails', async () => {
    authenticateWorkflowConfigAdmin.mockRejectedValue(
      new RuntimeError(RuntimeErrorCode.UNAUTHORIZED, 'Token nao fornecido.', 401),
    );

    const response = await GET(new Request('http://localhost/api/admin/request-config/catalog'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: RuntimeErrorCode.UNAUTHORIZED,
      message: 'Token nao fornecido.',
    });
    expect(buildWorkflowConfigCatalog).not.toHaveBeenCalled();
  });

  it('returns 403 when the collaborator lacks canManageWorkflowsV2', async () => {
    authenticateWorkflowConfigAdmin.mockRejectedValue(
      new RuntimeError(
        RuntimeErrorCode.FORBIDDEN,
        'Usuario sem permissao para configurar workflows v2.',
        403,
      ),
    );

    const response = await GET(
      new Request('http://localhost/api/admin/request-config/catalog', {
        headers: { Authorization: 'Bearer token' },
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: RuntimeErrorCode.FORBIDDEN,
      message: 'Usuario sem permissao para configurar workflows v2.',
    });
  });

  it('returns INTERNAL_ERROR for unexpected failures', async () => {
    buildWorkflowConfigCatalog.mockRejectedValue(new Error('boom'));

    const response = await GET(
      new Request('http://localhost/api/admin/request-config/catalog', {
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
