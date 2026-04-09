/** @jest-environment node */

export {};

jest.mock('@/lib/firebase-admin', () => ({
  getFirebaseAdminApp: jest.fn(() => ({ name: 'admin-app' })),
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(),
  FieldValue: {
    serverTimestamp: jest.fn(() => ({ __serverTimestamp: true })),
  },
}));

jest.mock('../lookups', () => ({
  resolveOwnerByUserId: jest.fn(),
  listWorkflowConfigAreas: jest.fn(),
  listWorkflowConfigOwners: jest.fn(),
}));

const { getFirestore } = require('firebase-admin/firestore');
const { RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
const { resolveOwnerByUserId } = require('../lookups');
const {
  createWorkflowArea,
  createWorkflowTypeWithDraft,
  saveWorkflowDraft,
} = require('../draft-repository');

const directCreateMock = jest.fn();
const directGetMock = jest.fn();
const transactionGetMock = jest.fn();
const transactionCreateMock = jest.fn();
const transactionUpdateMock = jest.fn();
const runTransactionMock = jest.fn(async (callback) =>
  callback({
    get: transactionGetMock,
    create: transactionCreateMock,
    update: transactionUpdateMock,
  }),
);

function makeDocRef(path: string) {
  return {
    id: path.split('/').at(-1),
    path,
    create: (data: unknown) => directCreateMock(path, data),
    get: () => directGetMock(path),
    collection: (name: string) => ({
      doc: (id: string) => makeDocRef(`${path}/${name}/${id}`),
    }),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  getFirestore.mockReturnValue({
    collection: (name: string) => ({
      doc: (id: string) => makeDocRef(`${name}/${id}`),
    }),
    runTransaction: runTransactionMock,
  });
  resolveOwnerByUserId.mockResolvedValue({
    userId: 'SMO2',
    name: 'Owner Name',
    email: 'owner@3ariva.com.br',
  });
});

describe('draft-repository safeguards', () => {
  it('rejects malformed create area payload with 422', async () => {
    await expect(createWorkflowArea({ icon: 'FolderOpen' } as never)).rejects.toMatchObject({
      code: RuntimeErrorCode.INVALID_DRAFT_PAYLOAD,
      httpStatus: 422,
    });

    expect(getFirestore).not.toHaveBeenCalled();
  });

  it('retries area creation with numeric suffix when the canonical id already exists', async () => {
    directCreateMock.mockImplementation(async (path: string) => {
      if (path === 'workflowAreas/facilities') {
        throw { code: 'already-exists' };
      }
    });

    await expect(createWorkflowArea({ name: 'Facilities', icon: 'Building2' })).resolves.toEqual({
      areaId: 'facilities-2',
      name: 'Facilities',
      icon: 'Building2',
    });
  });

  it('rejects malformed create workflow type payload with 422', async () => {
    await expect(
      createWorkflowTypeWithDraft({
        areaId: 'facilities',
        name: 'Manutencao',
        description: 'Chamados prediais',
        icon: 'Wrench',
        ownerUserId: 'SMO2',
        allowedUserIds: 'all' as never,
      }),
    ).rejects.toMatchObject({
      code: RuntimeErrorCode.INVALID_DRAFT_PAYLOAD,
      httpStatus: 422,
    });
  });

  it('retries workflow type creation with suffixed id when the canonical id collides at commit time', async () => {
    transactionGetMock.mockImplementation(async (ref: { path: string }) => {
      if (ref.path === 'workflowAreas/facilities') {
        return { exists: true, data: () => ({ name: 'Facilities' }) };
      }

      return { exists: false, data: () => undefined };
    });

    runTransactionMock
      .mockImplementationOnce(async (callback: (transaction: unknown) => Promise<void>) => {
        await callback({
          get: transactionGetMock,
          create: transactionCreateMock,
          update: transactionUpdateMock,
        });
        throw { code: 'already-exists' };
      })
      .mockImplementationOnce(async (callback: (transaction: unknown) => Promise<void>) =>
        callback({
          get: transactionGetMock,
          create: transactionCreateMock,
          update: transactionUpdateMock,
        }),
      );

    await expect(
      createWorkflowTypeWithDraft({
        areaId: 'facilities',
        name: 'Manutencao Predial',
        description: 'Chamados prediais',
        icon: 'Wrench',
        ownerUserId: 'SMO2',
        allowedUserIds: ['all'],
      }),
    ).resolves.toEqual({
      workflowTypeId: 'facilities_manutencao_predial_2',
      version: 1,
      editorPath: '/admin/request-config/facilities_manutencao_predial_2/versions/1/edit',
    });
  });

  it('rejects malformed save payload with 422 before touching Firestore', async () => {
    await expect(saveWorkflowDraft('facilities_manutencao', 1, { steps: [] } as never)).rejects.toMatchObject({
      code: RuntimeErrorCode.INVALID_DRAFT_PAYLOAD,
      httpStatus: 422,
    });

    expect(getFirestore).not.toHaveBeenCalled();
  });
});
