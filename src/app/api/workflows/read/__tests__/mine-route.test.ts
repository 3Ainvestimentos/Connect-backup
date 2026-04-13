/** @jest-environment node */

export {};

jest.mock('@/lib/workflows/runtime/permission-auth', () => ({
  authenticateRequesterV2Actor: jest.fn(),
}));

jest.mock('@/lib/workflows/read/queries', () => ({
  queryRequesterHistory: jest.fn(),
  groupWorkflowsByMonth: jest.fn((items) => items),
}));

const { RuntimeError, RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
const { authenticateRequesterV2Actor } = require('@/lib/workflows/runtime/permission-auth');
const { queryRequesterHistory } = require('@/lib/workflows/read/queries');
const { GET } = require('@/app/api/workflows/read/mine/route');

describe('requester mine route', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    authenticateRequesterV2Actor.mockResolvedValue({
      decodedToken: { uid: 'firebase-uid-1' },
      actor: {
        actorUserId: 'id3a-1',
        actorName: 'Test User',
        actorEmail: 'test@3a.com',
        collaboratorDocId: 'collab-1',
      },
    });
  });

  afterEach(() => consoleErrorSpy.mockRestore());

  it('returns 200 with history data when authorized', async () => {
    queryRequesterHistory.mockResolvedValue([]);

    const response = await GET(
      new Request('http://localhost/api/workflows/read/mine', {
        headers: { Authorization: 'Bearer valid-token' },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, data: { items: [] } });
    expect(authenticateRequesterV2Actor).toHaveBeenCalledTimes(1);
  });

  it('returns 401 when no token provided', async () => {
    authenticateRequesterV2Actor.mockRejectedValue(
      new RuntimeError(RuntimeErrorCode.UNAUTHORIZED, 'Token nao fornecido.', 401),
    );

    const response = await GET(new Request('http://localhost/api/workflows/read/mine'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: RuntimeErrorCode.UNAUTHORIZED,
    });
  });

  it('returns 403 when collaborator lacks canOpenRequestsV2', async () => {
    authenticateRequesterV2Actor.mockRejectedValue(
      new RuntimeError(
        RuntimeErrorCode.FORBIDDEN,
        'Usuario sem permissao para abertura de solicitacoes v2.',
        403,
      ),
    );

    const response = await GET(
      new Request('http://localhost/api/workflows/read/mine', {
        headers: { Authorization: 'Bearer token-no-perm' },
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: RuntimeErrorCode.FORBIDDEN,
    });
    expect(queryRequesterHistory).not.toHaveBeenCalled();
  });

  it('returns 500 for unexpected errors', async () => {
    queryRequesterHistory.mockRejectedValue(new Error('boom'));

    const response = await GET(
      new Request('http://localhost/api/workflows/read/mine', {
        headers: { Authorization: 'Bearer valid-token' },
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: 'INTERNAL_ERROR',
    });
  });
});
