/** @jest-environment node */

export {};

jest.mock('@/lib/firebase-admin', () => ({
  getFirebaseAdminApp: jest.fn(() => ({ name: 'admin-app' })),
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(),
  Timestamp: {
    now: jest.fn(),
  },
}));

jest.mock('../lookups', () => ({
  listWorkflowConfigOwners: jest.fn(),
}));

const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
const { listWorkflowConfigOwners } = require('../lookups');
const { publishDraftVersion } = require('../publication-service');

const transactionGetMock = jest.fn();
const transactionUpdateMock = jest.fn();
const runTransactionMock = jest.fn(async (callback) =>
  callback({
    get: transactionGetMock,
    update: transactionUpdateMock,
  }),
);

function makeDocRef(path: string) {
  return {
    id: path.split('/').at(-1),
    path,
    collection: (name: string) => ({
      doc: (id: string) => makeDocRef(`${path}/${name}/${id}`),
    }),
  };
}

function buildDraftWorkflowTypeSnapshot() {
  return {
    name: 'Facilities e Suprimentos',
    description: 'Chamados operacionais',
    icon: 'Building2',
    areaId: 'facilities',
    ownerEmail: 'owner@3ariva.com.br',
    ownerUserId: 'OWN1',
    allowedUserIds: ['all'],
    active: true,
  };
}

function buildRoot() {
  return {
    workflowTypeId: 'facilities_manutencao',
    latestPublishedVersion: null,
  };
}

function buildDraftVersion(overrides: Record<string, unknown> = {}) {
  return {
    workflowTypeId: 'facilities_manutencao',
    version: 1,
    state: 'draft',
    defaultSlaDays: 5,
    fields: [],
    initialStepId: 'legacy-start',
    stepOrder: ['start', 'work', 'final'],
    stepsById: {
      start: {
        stepId: 'start',
        stepName: 'Inicio',
        statusKey: 'legacy-open',
        kind: 'final',
      },
      work: {
        stepId: 'work',
        stepName: 'Execucao',
        statusKey: 'legacy-progress',
        kind: 'start',
      },
      final: {
        stepId: 'final',
        stepName: 'Fim',
        statusKey: 'legacy-done',
        kind: 'work',
      },
    },
    draftConfig: {
      workflowType: buildDraftWorkflowTypeSnapshot(),
    },
    workflowTypeSnapshot: null,
    publishedAt: null,
    ...overrides,
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

  listWorkflowConfigOwners.mockResolvedValue([
    {
      userId: 'OWN1',
      name: 'Owner Name',
      email: 'owner@3ariva.com.br',
    },
  ]);

  Timestamp.now.mockReturnValue({
    toDate: () => new Date('2026-04-16T12:00:00.000Z'),
  });
});

describe('publication-service', () => {
  it('blocks publish when stepOrder references an unknown step id', async () => {
    transactionGetMock.mockImplementation(async (ref: { path: string }) => {
      if (ref.path === 'workflowTypes_v2/facilities_manutencao') {
        return { data: () => buildRoot() };
      }

      if (ref.path === 'workflowTypes_v2/facilities_manutencao/versions/1') {
        return {
          data: () =>
            buildDraftVersion({
              stepOrder: ['start', 'missing', 'final'],
            }),
        };
      }

      return { data: () => undefined };
    });

    await expect(
      publishDraftVersion({
        workflowTypeId: 'facilities_manutencao',
        version: 1,
        actorUserId: 'admin-1',
        actorName: 'Admin User',
      }),
    ).rejects.toMatchObject({
      code: RuntimeErrorCode.VERSION_NOT_PUBLISHABLE,
      issues: expect.arrayContaining([
        expect.objectContaining({
          code: 'STEP_ORDER_REFERENCES_UNKNOWN_STEP',
          category: 'steps',
        }),
      ]),
    });

    expect(transactionUpdateMock).not.toHaveBeenCalled();
  });

  it('publishes a valid draft with canonicalized step semantics materialized', async () => {
    transactionGetMock.mockImplementation(async (ref: { path: string }) => {
      if (ref.path === 'workflowTypes_v2/facilities_manutencao') {
        return { data: () => buildRoot() };
      }

      if (ref.path === 'workflowTypes_v2/facilities_manutencao/versions/1') {
        return {
          data: () => buildDraftVersion(),
        };
      }

      return { data: () => undefined };
    });

    await expect(
      publishDraftVersion({
        workflowTypeId: 'facilities_manutencao',
        version: 1,
        actorUserId: 'admin-1',
        actorName: 'Admin User',
      }),
    ).resolves.toMatchObject({
      workflowTypeId: 'facilities_manutencao',
      version: 1,
      state: 'published',
      transition: 'published',
    });

    expect(transactionUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'workflowTypes_v2/facilities_manutencao/versions/1',
      }),
      expect.objectContaining({
        state: 'published',
        initialStepId: 'start',
        stepOrder: ['start', 'work', 'final'],
        stepsById: {
          start: expect.objectContaining({
            kind: 'start',
            statusKey: 'solicitacao_aberta',
          }),
          work: expect.objectContaining({
            kind: 'work',
            statusKey: 'em_andamento',
          }),
          final: expect.objectContaining({
            kind: 'final',
            statusKey: 'finalizado',
          }),
        },
      }),
    );
  });

  it('normalizes legacy attachmentRequired outside execution during publish', async () => {
    transactionGetMock.mockImplementation(async (ref: { path: string }) => {
      if (ref.path === 'workflowTypes_v2/facilities_manutencao') {
        return { data: () => buildRoot() };
      }

      if (ref.path === 'workflowTypes_v2/facilities_manutencao/versions/1') {
        return {
          data: () =>
            buildDraftVersion({
              stepsById: {
                start: {
                  stepId: 'start',
                  stepName: 'Inicio',
                  statusKey: 'legacy-open',
                  kind: 'final',
                },
                work: {
                  stepId: 'work',
                  stepName: 'Validacao',
                  statusKey: 'legacy-progress',
                  kind: 'start',
                  action: {
                    type: 'approval',
                    label: 'Aprovar',
                    approverIds: ['OWN1'],
                    attachmentRequired: true,
                  },
                },
                final: {
                  stepId: 'final',
                  stepName: 'Fim',
                  statusKey: 'legacy-done',
                  kind: 'work',
                },
              },
            }),
        };
      }

      return { data: () => undefined };
    });

    await publishDraftVersion({
      workflowTypeId: 'facilities_manutencao',
      version: 1,
      actorUserId: 'admin-1',
      actorName: 'Admin User',
    });

    expect(transactionUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'workflowTypes_v2/facilities_manutencao/versions/1',
      }),
      expect.objectContaining({
        stepsById: {
          start: expect.any(Object),
          work: expect.objectContaining({
            action: expect.objectContaining({
              type: 'approval',
              attachmentRequired: false,
            }),
          }),
          final: expect.any(Object),
        },
      }),
    );
  });
});
