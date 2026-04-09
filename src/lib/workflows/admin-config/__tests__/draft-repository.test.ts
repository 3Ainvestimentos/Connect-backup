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
  createOrReuseWorkflowDraft,
  createWorkflowTypeWithDraft,
  saveWorkflowDraft,
} = require('../draft-repository');

const directCreateMock = jest.fn();
const directGetMock = jest.fn();
const directSetMock = jest.fn();
const directCollectionGetMock = jest.fn();
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
    set: (data: unknown) => directSetMock(path, data),
    collection: (name: string) => ({
      get: () => directCollectionGetMock(`${path}/${name}`),
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

  it('creates next draft from published version without writing action: undefined', async () => {
    directGetMock.mockImplementation(async (path: string) => {
      if (path === 'workflowTypes_v2/facilities_solicitacao_suprimentos') {
        return {
          exists: true,
          data: () => ({
            workflowTypeId: 'facilities_solicitacao_suprimentos',
            name: 'Solicitacao de Suprimentos',
            description: 'Descricao',
            icon: 'Package',
            areaId: 'facilities',
            ownerEmail: 'owner@3ariva.com.br',
            ownerUserId: 'SMO2',
            allowedUserIds: ['all'],
            active: true,
            latestPublishedVersion: 1,
          }),
        };
      }

      return { exists: false, data: () => undefined };
    });

    directCollectionGetMock.mockResolvedValue({
      docs: [
        {
          id: '1',
          data: () => ({
            workflowTypeId: 'facilities_solicitacao_suprimentos',
            version: 1,
            state: 'published',
            ownerEmailAtPublish: 'owner@3ariva.com.br',
            defaultSlaDays: 2,
            fields: [],
            initialStepId: 'stp_open',
            stepOrder: ['stp_open', 'stp_final'],
            stepsById: {
              stp_open: {
                stepId: 'stp_open',
                stepName: 'Inicio',
                statusKey: 'inicio',
                kind: 'start',
              },
              stp_final: {
                stepId: 'stp_final',
                stepName: 'Fim',
                statusKey: 'fim',
                kind: 'final',
              },
            },
            publishedAt: null,
          }),
        },
      ],
    });

    await expect(createOrReuseWorkflowDraft('facilities_solicitacao_suprimentos')).resolves.toEqual({
      workflowTypeId: 'facilities_solicitacao_suprimentos',
      version: 2,
      reusedExistingDraft: false,
      editorPath: '/admin/request-config/facilities_solicitacao_suprimentos/versions/2/edit',
    });

    expect(directSetMock).toHaveBeenCalledTimes(1);
    const [, savedDraft] = directSetMock.mock.calls[0];
    expect(savedDraft.stepsById.stp_open).toEqual({
      stepId: 'stp_open',
      stepName: 'Inicio',
      statusKey: 'inicio',
      kind: 'start',
    });
    expect(savedDraft.stepsById.stp_open).not.toHaveProperty('action');
  });
});
