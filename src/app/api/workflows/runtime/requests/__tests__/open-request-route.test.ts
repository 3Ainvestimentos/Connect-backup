/** @jest-environment node */

export {};

jest.mock('@/lib/workflows/runtime/permission-auth', () => ({
  authenticateRequesterV2Actor: jest.fn(),
}));

jest.mock('@/lib/workflows/runtime/use-cases/open-request', () => ({
  openRequest: jest.fn(),
}));

const { RuntimeError, RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
const { authenticateRequesterV2Actor } = require('@/lib/workflows/runtime/permission-auth');
const { openRequest } = require('@/lib/workflows/runtime/use-cases/open-request');
const { POST } = require('@/app/api/workflows/runtime/requests/route');

describe('open request route', () => {
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

  it('returns 201 when request is opened successfully', async () => {
    openRequest.mockResolvedValue({ requestId: 123 });

    const response = await POST(
      new Request('http://localhost/api/workflows/runtime/requests', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({
          workflowTypeId: 'wf-1',
          formData: { field: 'value' },
        }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: { requestId: 123 },
    });
    expect(authenticateRequesterV2Actor).toHaveBeenCalledTimes(1);
  });

  it('returns 401 when no token provided', async () => {
    authenticateRequesterV2Actor.mockRejectedValue(
      new RuntimeError(RuntimeErrorCode.UNAUTHORIZED, 'Token nao fornecido.', 401),
    );

    const response = await POST(
      new Request('http://localhost/api/workflows/runtime/requests', {
        method: 'POST',
        body: JSON.stringify({ workflowTypeId: 'wf-1', formData: {} }),
      }),
    );

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

    const response = await POST(
      new Request('http://localhost/api/workflows/runtime/requests', {
        method: 'POST',
        headers: { Authorization: 'Bearer token-no-perm' },
        body: JSON.stringify({ workflowTypeId: 'wf-1', formData: {} }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: RuntimeErrorCode.FORBIDDEN,
    });
    expect(openRequest).not.toHaveBeenCalled();
  });

  it('returns 400 when required fields are missing', async () => {
    const response = await POST(
      new Request('http://localhost/api/workflows/runtime/requests', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: 'INVALID_FORM_DATA',
    });
  });

  it('returns 500 for unexpected errors', async () => {
    openRequest.mockRejectedValue(new Error('boom'));

    const response = await POST(
      new Request('http://localhost/api/workflows/runtime/requests', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({
          workflowTypeId: 'wf-1',
          formData: { field: 'value' },
        }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: 'INTERNAL_ERROR',
    });
  });
});
