/** @jest-environment node */

jest.mock('@/lib/firebase-admin', () => ({
  getFirebaseAdminApp: jest.fn(() => ({ name: 'admin-app' })),
}));

const getMock = jest.fn();
const whereMock = jest.fn(() => ({ get: getMock }));
const collectionMock = jest.fn(() => ({ where: whereMock }));
const getFirestoreMock = jest.fn(() => ({ collection: collectionMock }));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: (...args) => getFirestoreMock(...args),
}));

const { RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
const { resolveRuntimeActor } = require('@/lib/workflows/runtime/actor-resolution');

describe('resolveRuntimeActor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolve o actor operacional via id3a', async () => {
    getMock.mockResolvedValue({
      empty: false,
      size: 1,
      docs: [
        {
          id: 'collab-doc-1',
          data: () => ({
            id3a: 'SMO2',
            name: 'Stefania Otoni',
            email: 'stefania.otoni@3ariva.com.br',
            authUid: 'firebase-uid-1',
          }),
        },
      ],
    });

    await expect(
      resolveRuntimeActor({
        uid: 'firebase-uid-1',
        email: 'stefania.otoni@3ainvestimentos.com.br',
      }),
    ).resolves.toEqual({
      actorUserId: 'SMO2',
      actorName: 'Stefania Otoni',
      actorEmail: 'stefania.otoni@3ainvestimentos.com.br',
      collaboratorDocId: 'collab-doc-1',
    });
  });

  it('falha quando nao existe colaborador para o authUid', async () => {
    getMock.mockResolvedValue({
      empty: true,
      size: 0,
      docs: [],
    });

    await expect(
      resolveRuntimeActor({
        uid: 'missing-auth-uid',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.FORBIDDEN,
      }),
    );
  });

  it('falha quando o colaborador nao possui id3a', async () => {
    getMock.mockResolvedValue({
      empty: false,
      size: 1,
      docs: [
        {
          id: 'collab-doc-2',
          data: () => ({
            name: 'Sem ID 3A',
            email: 'sem.id3a@3ainvestimentos.com.br',
            authUid: 'firebase-uid-2',
          }),
        },
      ],
    });

    await expect(
      resolveRuntimeActor({
        uid: 'firebase-uid-2',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: RuntimeErrorCode.FORBIDDEN,
      }),
    );
  });
});
