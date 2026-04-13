/** @jest-environment node */

jest.mock('@/lib/firebase-admin', () => ({
  getFirebaseAdminApp: jest.fn(() => ({ name: 'admin-app' })),
}));

const verifyIdTokenMock = jest.fn();
const getAuthMock = jest.fn(() => ({
  verifyIdToken: verifyIdTokenMock,
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: (...args) => getAuthMock(...args),
}));

const resolveRuntimeActorMock = jest.fn();

jest.mock('@/lib/workflows/runtime/actor-resolution', () => ({
  resolveRuntimeActor: (...args) => resolveRuntimeActorMock(...args),
}));

const { RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
const {
  authenticateRuntimeActor,
  verifyBearerToken,
} = require('@/lib/workflows/runtime/auth-helpers');

describe('auth helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 401 para erro auth/id-token-expired', async () => {
    verifyIdTokenMock.mockRejectedValue({ code: 'auth/id-token-expired' });

    await expect(
      verifyBearerToken(
        new Request('http://localhost/api/workflows/read/current', {
          headers: { Authorization: 'Bearer expired-token' },
        }),
      ),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.UNAUTHORIZED,
        httpStatus: 401,
        message: 'Token invalido.',
      }),
    );
  });

  it('retorna 401 para erro auth/argument-error', async () => {
    verifyIdTokenMock.mockRejectedValue({ code: 'auth/argument-error' });

    await expect(
      verifyBearerToken(
        new Request('http://localhost/api/workflows/read/current', {
          headers: { Authorization: 'Bearer malformed-token' },
        }),
      ),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.UNAUTHORIZED,
        httpStatus: 401,
        message: 'Token invalido.',
      }),
    );
  });

  it('re-lanca erro sem prefixo auth', async () => {
    const infraError = Object.assign(new Error('App not initialized'), { code: 'app/no-app' });
    verifyIdTokenMock.mockRejectedValue(infraError);

    await expect(
      verifyBearerToken(
        new Request('http://localhost/api/workflows/read/current', {
          headers: { Authorization: 'Bearer token' },
        }),
      ),
    ).rejects.toBe(infraError);
  });

  it('re-lanca erro generico sem propriedade code', async () => {
    const infraError = new Error('ECONNREFUSED');
    verifyIdTokenMock.mockRejectedValue(infraError);

    await expect(
      verifyBearerToken(
        new Request('http://localhost/api/workflows/read/current', {
          headers: { Authorization: 'Bearer token' },
        }),
      ),
    ).rejects.toBe(infraError);
  });

  it('retorna decodedToken e actor no caso feliz', async () => {
    const decodedToken = { uid: 'firebase-uid-1', email: 'owner@3ariva.com.br' };
    const actor = {
      actorUserId: 'SMO2',
      actorName: 'Owner',
      actorEmail: 'owner@3ariva.com.br',
      collaboratorDocId: 'collab-1',
    };

    verifyIdTokenMock.mockResolvedValue(decodedToken);
    resolveRuntimeActorMock.mockResolvedValue(actor);

    await expect(
      authenticateRuntimeActor(
        new Request('http://localhost/api/workflows/read/current', {
          headers: { Authorization: 'Bearer valid-token' },
        }),
      ),
    ).resolves.toEqual({
      decodedToken,
      actor,
    });
  });
});
