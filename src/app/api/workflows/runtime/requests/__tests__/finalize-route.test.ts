/** @jest-environment node */

export {};

jest.mock('@/lib/workflows/runtime/permission-auth', () => ({
  authenticateManagementV2Actor: jest.fn(),
}));

jest.mock('@/lib/workflows/runtime/use-cases/finalize-request', () => ({
  finalizeRequest: jest.fn(),
}));

const { RuntimeError, RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
const { authenticateManagementV2Actor } = require('@/lib/workflows/runtime/permission-auth');
const { finalizeRequest } = require('@/lib/workflows/runtime/use-cases/finalize-request');
const { POST } = require('@/app/api/workflows/runtime/requests/[id]/finalize/route');

describe('finalize route', () => {
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

  it('returns 200 when request finalizes successfully', async () => {
    finalizeRequest.mockResolvedValue({ requestId: 123, status: 'finalized' });

    const response = await POST(
      new Request('http://localhost/api/workflows/runtime/requests/123/finalize', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ actorName: 'Manager User' }),
      }),
      { params: Promise.resolve({ id: '123' }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: { requestId: 123, status: 'finalized' },
    });
  });

  it('returns 401 when no token provided', async () => {
    authenticateManagementV2Actor.mockRejectedValue(
      new RuntimeError(RuntimeErrorCode.UNAUTHORIZED, 'Token nao fornecido.', 401),
    );

    const response = await POST(
      new Request('http://localhost/api/workflows/runtime/requests/123/finalize', {
        method: 'POST',
        body: JSON.stringify({ actorName: 'Manager User' }),
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
      new Request('http://localhost/api/workflows/runtime/requests/123/finalize', {
        method: 'POST',
        headers: { Authorization: 'Bearer token-no-perm' },
        body: JSON.stringify({ actorName: 'Manager User' }),
      }),
      { params: Promise.resolve({ id: '123' }) },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: RuntimeErrorCode.FORBIDDEN,
    });
    expect(finalizeRequest).not.toHaveBeenCalled();
  });
});
