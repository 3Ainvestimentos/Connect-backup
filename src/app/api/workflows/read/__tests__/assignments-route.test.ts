/** @jest-environment node */

export {};

jest.mock('@/lib/workflows/runtime/permission-auth', () => ({
  authenticateManagementV2Actor: jest.fn(),
}));

jest.mock('@/lib/workflows/read/queries', () => ({
  queryScopedAssignments: jest.fn(),
}));

jest.mock('@/lib/workflows/read/filters', () => ({
  parseWorkflowManagementFilters: jest.fn(() => ({})),
  ReadValidationError: class ReadValidationError extends Error {
    code: string;
    httpStatus: number;

    constructor(code: string, message: string, httpStatus = 400) {
      super(message);
      this.code = code;
      this.httpStatus = httpStatus;
    }
  },
}));

const { RuntimeError, RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
const { authenticateManagementV2Actor } = require('@/lib/workflows/runtime/permission-auth');
const { queryScopedAssignments } = require('@/lib/workflows/read/queries');
const { GET } = require('@/app/api/workflows/read/assignments/route');

describe('assignments route', () => {
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

  it('returns 200 with assignments data when authorized', async () => {
    queryScopedAssignments.mockResolvedValue({ items: [], groups: [] });

    const response = await GET(
      new Request('http://localhost/api/workflows/read/assignments', {
        headers: { Authorization: 'Bearer valid-token' },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: { items: [], groups: [] },
    });
    expect(authenticateManagementV2Actor).toHaveBeenCalledTimes(1);
  });

  it('returns 401 when no token provided', async () => {
    authenticateManagementV2Actor.mockRejectedValue(
      new RuntimeError(RuntimeErrorCode.UNAUTHORIZED, 'Token nao fornecido.', 401),
    );

    const response = await GET(new Request('http://localhost/api/workflows/read/assignments'));

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

    const response = await GET(
      new Request('http://localhost/api/workflows/read/assignments', {
        headers: { Authorization: 'Bearer token-no-perm' },
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: RuntimeErrorCode.FORBIDDEN,
    });
    expect(queryScopedAssignments).not.toHaveBeenCalled();
  });
});
