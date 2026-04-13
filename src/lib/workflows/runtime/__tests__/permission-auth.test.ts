/** @jest-environment node */

export {};

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(),
}));

jest.mock('@/lib/firebase-admin', () => ({
  getFirebaseAdminApp: jest.fn(() => ({ name: 'admin-app' })),
}));

jest.mock('@/lib/workflows/runtime/auth-helpers', () => ({
  verifyBearerToken: jest.fn(),
}));

const { getFirestore } = require('firebase-admin/firestore');
const { verifyBearerToken } = require('@/lib/workflows/runtime/auth-helpers');
const {
  authenticateRequesterV2Actor,
  authenticateManagementV2Actor,
} = require('../permission-auth');

function createDoc(id: string, data: Record<string, unknown>) {
  return {
    id,
    data: () => data,
  };
}

describe('authenticateRequesterV2Actor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when verifyBearerToken throws UNAUTHORIZED', async () => {
    const { RuntimeError, RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
    verifyBearerToken.mockRejectedValue(
      new RuntimeError(RuntimeErrorCode.UNAUTHORIZED, 'Token nao fornecido.', 401),
    );

    await expect(
      authenticateRequesterV2Actor(
        new Request('http://localhost/api/workflows/requester/catalog'),
      ),
    ).rejects.toThrow(RuntimeError);
  });

  it('throws FORBIDDEN when collaborator is not found', async () => {
    const { RuntimeError, RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');

    verifyBearerToken.mockResolvedValue({
      uid: 'firebase-uid-1',
      email: 'user@3ariva.com.br',
    });

    const whereMock = jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue({ size: 0, docs: [] }),
    });

    getFirestore.mockReturnValue({
      collection: jest.fn(() => ({ where: whereMock })),
    });

    await expect(
      authenticateRequesterV2Actor(
        new Request('http://localhost/api/workflows/requester/catalog', {
          headers: { Authorization: 'Bearer token' },
        }),
      ),
    ).rejects.toThrow(RuntimeError);
  });

  it('throws FORBIDDEN when canOpenRequestsV2 is false', async () => {
    const { RuntimeError, RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');

    verifyBearerToken.mockResolvedValue({
      uid: 'firebase-uid-1',
      email: 'user@3ariva.com.br',
    });

    const whereMock = jest
      .fn()
      .mockReturnValueOnce({
        get: jest.fn().mockResolvedValue({ size: 0, docs: [] }),
      })
      .mockReturnValueOnce({
        get: jest.fn().mockResolvedValue({
          size: 1,
          docs: [
            createDoc('collab-1', {
              id3a: 'id3a-1',
              email: 'user@3ariva.com.br',
              permissions: { canOpenRequestsV2: false },
            }),
          ],
        }),
      });

    getFirestore.mockReturnValue({
      collection: jest.fn(() => ({ where: whereMock })),
    });

    await expect(
      authenticateRequesterV2Actor(
        new Request('http://localhost/api/workflows/requester/catalog', {
          headers: { Authorization: 'Bearer token' },
        }),
      ),
    ).rejects.toThrow('Usuario sem permissao para abertura de solicitacoes v2.');
  });

  it('returns actor when collaborator has canOpenRequestsV2 = true', async () => {
    verifyBearerToken.mockResolvedValue({
      uid: 'firebase-uid-1',
      email: 'user@3ariva.com.br',
      name: 'Test User',
    });

    const whereMock = jest.fn().mockReturnValueOnce({
      get: jest.fn().mockResolvedValue({
        size: 1,
        docs: [
          createDoc('collab-1', {
            id3a: 'id3a-1',
            name: 'Test User',
            email: 'user@3ariva.com.br',
            authUid: 'firebase-uid-1',
            permissions: { canOpenRequestsV2: true },
          }),
        ],
      }),
    });

    getFirestore.mockReturnValue({
      collection: jest.fn(() => ({ where: whereMock })),
    });

    const result = await authenticateRequesterV2Actor(
      new Request('http://localhost/api/workflows/requester/catalog', {
        headers: { Authorization: 'Bearer token' },
      }),
    );

    expect(result.actor.actorUserId).toBe('id3a-1');
    expect(result.actor.actorName).toBe('Test User');
    expect(result.actor.collaboratorDocId).toBe('collab-1');
    expect(result.decodedToken.uid).toBe('firebase-uid-1');
  });

  it('falls back to email when authUid is not found', async () => {
    verifyBearerToken.mockResolvedValue({
      uid: 'firebase-uid-2',
      email: 'owner@3ariva.com.br',
    });

    const whereMock = jest
      .fn()
      .mockReturnValueOnce({
        get: jest.fn().mockResolvedValue({ size: 0, docs: [] }),
      })
      .mockReturnValueOnce({
        get: jest.fn().mockResolvedValue({
          size: 1,
          docs: [
            createDoc('collab-2', {
              id3a: 'id3a-2',
              email: 'owner@3ainvestimentos.com.br',
              permissions: { canOpenRequestsV2: true },
            }),
          ],
        }),
      });

    getFirestore.mockReturnValue({
      collection: jest.fn(() => ({ where: whereMock })),
    });

    const result = await authenticateRequesterV2Actor(
      new Request('http://localhost/api/workflows/requester/catalog', {
        headers: { Authorization: 'Bearer token' },
      }),
    );

    expect(result.actor.actorUserId).toBe('id3a-2');
    expect(whereMock).toHaveBeenNthCalledWith(1, 'authUid', '==', 'firebase-uid-2');
    expect(whereMock).toHaveBeenNthCalledWith(
      2,
      'email',
      'in',
      ['owner@3ariva.com.br', 'owner@3ainvestimentos.com.br'],
    );
  });
});

describe('authenticateManagementV2Actor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when verifyBearerToken throws UNAUTHORIZED', async () => {
    const { RuntimeError, RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
    verifyBearerToken.mockRejectedValue(
      new RuntimeError(RuntimeErrorCode.UNAUTHORIZED, 'Token nao fornecido.', 401),
    );

    await expect(
      authenticateManagementV2Actor(
        new Request('http://localhost/api/workflows/read/management/bootstrap'),
      ),
    ).rejects.toThrow(RuntimeError);
  });

  it('throws FORBIDDEN when collaborator is not found', async () => {
    const { RuntimeError } = require('@/lib/workflows/runtime/errors');

    verifyBearerToken.mockResolvedValue({
      uid: 'firebase-uid-missing',
      email: 'missing@3ariva.com.br',
    });

    const whereMock = jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue({ size: 0, docs: [] }),
    });

    getFirestore.mockReturnValue({
      collection: jest.fn(() => ({ where: whereMock })),
    });

    await expect(
      authenticateManagementV2Actor(
        new Request('http://localhost/api/workflows/read/management/bootstrap', {
          headers: { Authorization: 'Bearer token' },
        }),
      ),
    ).rejects.toThrow(RuntimeError);
  });

  it('throws FORBIDDEN when canManageRequestsV2 is false', async () => {
    const { RuntimeError } = require('@/lib/workflows/runtime/errors');

    verifyBearerToken.mockResolvedValue({
      uid: 'firebase-uid-1',
      email: 'manager@3ariva.com.br',
    });

    const whereMock = jest.fn().mockReturnValueOnce({
      get: jest.fn().mockResolvedValue({
        size: 1,
        docs: [
          createDoc('collab-1', {
            id3a: 'id3a-1',
            email: 'manager@3ariva.com.br',
            authUid: 'firebase-uid-1',
            permissions: { canManageRequestsV2: false },
          }),
        ],
      }),
    });

    getFirestore.mockReturnValue({
      collection: jest.fn(() => ({ where: whereMock })),
    });

    await expect(
      authenticateManagementV2Actor(
        new Request('http://localhost/api/workflows/read/management/bootstrap', {
          headers: { Authorization: 'Bearer token' },
        }),
      ),
    ).rejects.toThrow('Usuario sem permissao para gestao de chamados v2.');
  });

  it('returns actor when collaborator has canManageRequestsV2 = true', async () => {
    verifyBearerToken.mockResolvedValue({
      uid: 'firebase-uid-3',
      email: 'manager@3ariva.com.br',
      name: 'Manager User',
    });

    const whereMock = jest.fn().mockReturnValueOnce({
      get: jest.fn().mockResolvedValue({
        size: 1,
        docs: [
          createDoc('collab-3', {
            id3a: 'id3a-3',
            name: 'Manager User',
            email: 'manager@3ariva.com.br',
            authUid: 'firebase-uid-3',
            permissions: { canManageRequestsV2: true },
          }),
        ],
      }),
    });

    getFirestore.mockReturnValue({
      collection: jest.fn(() => ({ where: whereMock })),
    });

    const result = await authenticateManagementV2Actor(
      new Request('http://localhost/api/workflows/read/management/bootstrap', {
        headers: { Authorization: 'Bearer token' },
      }),
    );

    expect(result.actor.actorUserId).toBe('id3a-3');
    expect(result.actor.actorName).toBe('Manager User');
    expect(result.actor.collaboratorDocId).toBe('collab-3');
  });

  it('falls back to email when authUid is not found', async () => {
    verifyBearerToken.mockResolvedValue({
      uid: 'firebase-uid-5',
      email: 'manager@3ariva.com.br',
    });

    const whereMock = jest
      .fn()
      .mockReturnValueOnce({
        get: jest.fn().mockResolvedValue({ size: 0, docs: [] }),
      })
      .mockReturnValueOnce({
        get: jest.fn().mockResolvedValue({
          size: 1,
          docs: [
            createDoc('collab-5', {
              id3a: 'id3a-5',
              email: 'manager@3ainvestimentos.com.br',
              permissions: { canManageRequestsV2: true },
            }),
          ],
        }),
      });

    getFirestore.mockReturnValue({
      collection: jest.fn(() => ({ where: whereMock })),
    });

    const result = await authenticateManagementV2Actor(
      new Request('http://localhost/api/workflows/read/management/bootstrap', {
        headers: { Authorization: 'Bearer token' },
      }),
    );

    expect(result.actor.actorUserId).toBe('id3a-5');
    expect(whereMock).toHaveBeenNthCalledWith(1, 'authUid', '==', 'firebase-uid-5');
    expect(whereMock).toHaveBeenNthCalledWith(
      2,
      'email',
      'in',
      ['manager@3ariva.com.br', 'manager@3ainvestimentos.com.br'],
    );
  });

  it('throws FORBIDDEN when collaborator has no permissions field', async () => {
    const { RuntimeError } = require('@/lib/workflows/runtime/errors');

    verifyBearerToken.mockResolvedValue({
      uid: 'firebase-uid-4',
      email: 'noperms@3ariva.com.br',
    });

    const whereMock = jest.fn().mockReturnValueOnce({
      get: jest.fn().mockResolvedValue({
        size: 1,
        docs: [
          createDoc('collab-4', {
            id3a: 'id3a-4',
            email: 'noperms@3ariva.com.br',
            authUid: 'firebase-uid-4',
          }),
        ],
      }),
    });

    getFirestore.mockReturnValue({
      collection: jest.fn(() => ({ where: whereMock })),
    });

    await expect(
      authenticateManagementV2Actor(
        new Request('http://localhost/api/workflows/read/management/bootstrap', {
          headers: { Authorization: 'Bearer token' },
        }),
      ),
    ).rejects.toThrow('Usuario sem permissao para gestao de chamados v2.');
  });
});
