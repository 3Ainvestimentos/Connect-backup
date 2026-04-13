/** @jest-environment node */

export {};

jest.mock('@/lib/workflows/runtime/permission-auth', () => ({
  authenticateManagementV2Actor: jest.fn(),
}));

jest.mock('@/lib/workflows/runtime/use-cases/assign-responsible', () => ({
  assignResponsible: jest.fn(),
}));

const { RuntimeError, RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
const { authenticateManagementV2Actor } = require('@/lib/workflows/runtime/permission-auth');
const { assignResponsible } = require('@/lib/workflows/runtime/use-cases/assign-responsible');
const { POST } = require('@/app/api/workflows/runtime/requests/[id]/assign/route');

describe('assign route', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    authenticateManagementV2Actor.mockResolvedValue({
      decodedToken: { uid: 'firebase-uid-1' },
      actor: {
        actorUserId: 'id3a-1',
        actorName: 'Manager User',
        actorEmail: 'manager@3a.com',
        collaboratorDocId: 'collab-1',
      },
    });
  });

  afterEach(() => consoleErrorSpy.mockRestore());

  it('returns 200 when request is assigned successfully', async () => {
    assignResponsible.mockResolvedValue({ requestId: 123, status: 'assigned' });

    const response = await POST(
      new Request('http://localhost/api/workflows/runtime/requests/123/assign', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({
          responsibleUserId: 'id3a-2',
          responsibleName: 'Responsible User',
          actorName: 'Manager User',
        }),
      }),
      { params: Promise.resolve({ id: '123' }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: { requestId: 123, status: 'assigned' },
    });
  });

  it('returns 401 when no token provided', async () => {
    authenticateManagementV2Actor.mockRejectedValue(
      new RuntimeError(RuntimeErrorCode.UNAUTHORIZED, 'Token nao fornecido.', 401),
    );

    const response = await POST(
      new Request('http://localhost/api/workflows/runtime/requests/123/assign', {
        method: 'POST',
        body: JSON.stringify({
          responsibleUserId: 'id3a-2',
          responsibleName: 'Responsible User',
          actorName: 'Manager User',
        }),
      }),
      { params: Promise.resolve({ id: '123' }) },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: RuntimeErrorCode.UNAUTHORIZED,
    });
  });

  it('returns 403 when collaborator lacks canManageRequestsV2', async () => {
    authenticateManagementV2Actor.mockRejectedValue(
      new RuntimeError(
        RuntimeErrorCode.FORBIDDEN,
        'Usuario sem permissao para gestao de chamados v2.',
        403,
      ),
    );

    const response = await POST(
      new Request('http://localhost/api/workflows/runtime/requests/123/assign', {
        method: 'POST',
        headers: { Authorization: 'Bearer token-no-perm' },
        body: JSON.stringify({
          responsibleUserId: 'id3a-2',
          responsibleName: 'Responsible User',
          actorName: 'Manager User',
        }),
      }),
      { params: Promise.resolve({ id: '123' }) },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: RuntimeErrorCode.FORBIDDEN,
    });
    expect(assignResponsible).not.toHaveBeenCalled();
  });
});
