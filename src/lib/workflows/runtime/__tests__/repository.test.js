/** @jest-environment node */

jest.mock('@/lib/firebase-admin', () => ({
  getFirebaseAdminApp: jest.fn(() => ({ name: 'admin-app' })),
}));

const directCounterGetMock = jest.fn();
const directCounterSetMock = jest.fn();
const counterRef = {
  path: 'counters/workflowCounter_v2',
  get: (...args) => directCounterGetMock(...args),
  set: (...args) => directCounterSetMock(...args),
};
const newDocRef = { id: 'workflow-doc-1', path: 'workflows_v2/workflow-doc-1' };
const transactionGetMock = jest.fn();
const transactionSetMock = jest.fn();
const updateMock = jest.fn();
const transactionMock = {
  get: (...args) => transactionGetMock(...args),
  set: (...args) => transactionSetMock(...args),
  update: (...args) => updateMock(...args),
};

const collectionDocMock = jest.fn(() => newDocRef);
const collectionMock = jest.fn(() => ({ doc: collectionDocMock }));
const docMock = jest.fn(() => counterRef);
const runTransactionMock = jest.fn(async (callback) => callback(transactionMock));
const getFirestoreMock = jest.fn(() => ({
  doc: docMock,
  collection: collectionMock,
  runTransaction: runTransactionMock,
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: (...args) => getFirestoreMock(...args),
}));

const { createRequestTransactionally, seedWorkflowCounterV2 } = require('@/lib/workflows/runtime/repository');

function buildRequestPayload(overrides = {}) {
  return {
    workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
    workflowVersion: 1,
    workflowName: 'Facilities',
    areaId: 'u3entfMNB17iklBOdq5H',
    ownerEmail: 'owner@3ariva.com.br',
    ownerUserId: 'SMO2',
    requesterUserId: 'REQ1',
    requesterName: 'Requester',
    responsibleUserId: null,
    responsibleName: null,
    operationalParticipantIds: ['SMO2'],
    currentStepId: 'stp_open',
    currentStepName: 'Solicitação Aberta',
    currentStatusKey: 'solicitacao_aberta',
    statusCategory: 'open',
    hasResponsible: false,
    hasPendingActions: false,
    pendingActionRecipientIds: [],
    pendingActionTypes: [],
    formData: {},
    stepStates: {
      stp_open: 'active',
    },
    history: [],
    slaDays: 3,
    expectedCompletionAt: { seconds: 3 },
    finalizedAt: null,
    closedAt: null,
    archivedAt: null,
    submittedAt: { seconds: 1 },
    submittedMonthKey: '1970-01',
    closedMonthKey: null,
    lastUpdatedAt: { seconds: 1 },
    isArchived: false,
    ...overrides,
  };
}

describe('workflow runtime repository counter v2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('incrementa a partir de lastRequestNumber seeded em 799', async () => {
    transactionGetMock.mockResolvedValue({
      exists: true,
      data: () => ({
        lastRequestNumber: 799,
      }),
    });

    await expect(createRequestTransactionally(buildRequestPayload())).resolves.toEqual({
      requestId: 800,
      docId: 'workflow-doc-1',
    });

    expect(transactionSetMock).toHaveBeenNthCalledWith(
      1,
      counterRef,
      { lastRequestNumber: 800 },
      { merge: true },
    );
    expect(transactionSetMock).toHaveBeenNthCalledWith(
      2,
      newDocRef,
      expect.objectContaining({
        requestId: 800,
      }),
    );
  });

  it('falha quando o contador ainda nao existe', async () => {
    transactionGetMock.mockResolvedValue({
      exists: false,
      data: () => undefined,
    });

    await expect(
      createRequestTransactionally(
        buildRequestPayload({
          workflowTypeId: 'facilities_solicitacao_compras',
          workflowName: 'Compras',
          requesterUserId: 'REQ2',
          requesterName: 'Requester 2',
          operationalParticipantIds: ['SMO2'],
          submittedAt: { seconds: 2 },
          lastUpdatedAt: { seconds: 2 },
        }),
      ),
    ).rejects.toMatchObject({
      code: 'COUNTER_NOT_INITIALIZED',
      httpStatus: 500,
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('falha quando lastRequestNumber nao e numerico', async () => {
    transactionGetMock.mockResolvedValue({
      exists: true,
      data: () => ({
        lastRequestNumber: '799',
      }),
    });

    await expect(createRequestTransactionally(buildRequestPayload())).rejects.toMatchObject({
      code: 'INVALID_REQUEST_COUNTER',
      httpStatus: 500,
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('falha quando o contador existe sem lastRequestNumber', async () => {
    transactionGetMock.mockResolvedValue({
      exists: true,
      data: () => ({}),
    });

    await expect(createRequestTransactionally(buildRequestPayload())).rejects.toMatchObject({
      code: 'INVALID_REQUEST_COUNTER',
      httpStatus: 500,
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('falha quando lastRequestNumber e null', async () => {
    transactionGetMock.mockResolvedValue({
      exists: true,
      data: () => ({
        lastRequestNumber: null,
      }),
    });

    await expect(createRequestTransactionally(buildRequestPayload())).rejects.toMatchObject({
      code: 'INVALID_REQUEST_COUNTER',
      httpStatus: 500,
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('materializa o seed do contador v2 apenas quando o documento nao existe', async () => {
    directCounterGetMock.mockResolvedValue({
      exists: false,
      data: () => undefined,
    });

    await expect(seedWorkflowCounterV2(799)).resolves.toBe('created');

    expect(directCounterSetMock).toHaveBeenCalledWith(
      { lastRequestNumber: 799 },
      { merge: true },
    );
  });

  it('preserva o contador v2 existente sem resetar a sequencia', async () => {
    directCounterGetMock.mockResolvedValue({
      exists: true,
      data: () => ({
        lastRequestNumber: 812,
      }),
    });

    await expect(seedWorkflowCounterV2(799)).resolves.toBe('preserved');

    expect(directCounterSetMock).not.toHaveBeenCalled();
  });

  it('falha quando o contador existente esta invalido', async () => {
    directCounterGetMock.mockResolvedValue({
      exists: true,
      data: () => ({
        lastRequestNumber: '812',
      }),
    });

    await expect(seedWorkflowCounterV2(799)).rejects.toMatchObject({
      code: 'INVALID_REQUEST_COUNTER',
      httpStatus: 500,
    });

    expect(directCounterSetMock).not.toHaveBeenCalled();
  });

  it('falha no seed quando o documento existe sem lastRequestNumber', async () => {
    directCounterGetMock.mockResolvedValue({
      exists: true,
      data: () => ({}),
    });

    await expect(seedWorkflowCounterV2(799)).rejects.toMatchObject({
      code: 'INVALID_REQUEST_COUNTER',
      httpStatus: 500,
    });

    expect(directCounterSetMock).not.toHaveBeenCalled();
  });
});
