/** @jest-environment node */

jest.mock('@/lib/workflows/runtime/repository', () => ({
  getWorkflowRequestByRequestId: jest.fn(),
}));

const {
  applyOfficialReadFilters,
  parseWorkflowManagementFilters,
} = require('@/lib/workflows/read/filters');
const {
  buildAssignedToMeQuery,
  buildCompletedHistoryQuery,
  buildOwnerCurrentQueueQuery,
  buildOwnerInProgressQueueQuery,
  buildOwnerWaitingActionQuery,
  buildOwnerWaitingAssignmentQuery,
  buildPendingActionForMeQuery,
  buildRequesterHistoryQuery,
  groupWorkflowsByMonth,
  queryAssignmentsForActor,
  queryScopedCurrentQueue,
} = require('@/lib/workflows/read/queries');
const { getWorkflowRequestByRequestId } = require('@/lib/workflows/runtime/repository');

class FakeQuery {
  constructor(docs = []) {
    this.docs = docs;
    this.operations = [];
  }

  where(field, operator, value) {
    this.operations.push({ type: 'where', field, operator, value });
    return this;
  }

  orderBy(field, direction) {
    this.operations.push({ type: 'orderBy', field, direction });
    return this;
  }

  async get() {
    return {
      docs: this.docs.map((doc) => ({
        id: doc.id,
        data: () => doc.data,
      })),
    };
  }
}

function createDb(docSequences = [[]]) {
  const queries = [];
  const db = {
    collection: jest.fn(() => {
      const nextDocs = docSequences[Math.min(queries.length, docSequences.length - 1)];
      const query = new FakeQuery(nextDocs);
      queries.push(query);
      return query;
    }),
  };

  return {
    db,
    queries,
  };
}

function buildWorkflowData(overrides = {}) {
  return {
    requestId: 801,
    workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
    workflowVersion: 1,
    workflowName: 'Facilities',
    areaId: 'area-1',
    ownerEmail: 'owner@3ariva.com.br',
    ownerUserId: 'SMO2',
    requesterUserId: 'REQ1',
    requesterName: 'Requester',
    responsibleUserId: 'RESP1',
    responsibleName: 'Responsavel',
    currentStepId: 'stp_work',
    currentStepName: 'Em andamento',
    currentStatusKey: 'em_andamento',
    statusCategory: 'in_progress',
    hasResponsible: true,
    hasPendingActions: false,
    pendingActionRecipientIds: [],
    pendingActionTypes: [],
    operationalParticipantIds: ['SMO2', 'RESP1'],
    slaDays: 5,
    expectedCompletionAt: { seconds: 10 },
    lastUpdatedAt: { seconds: 9 },
    finalizedAt: null,
    closedAt: null,
    archivedAt: null,
    submittedAt: { seconds: 1 },
    submittedMonthKey: '2026-03',
    closedMonthKey: null,
    isArchived: false,
    ...overrides,
  };
}

describe('workflow read queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('materializa a query base de Chamados atuais com filtros e ordenacao canonicos', () => {
    const { db, queries } = createDb();

    buildOwnerCurrentQueueQuery(db, 'SMO2');

    expect(db.collection).toHaveBeenCalledWith('workflows_v2');
    expect(queries[0].operations).toEqual([
      { type: 'where', field: 'ownerUserId', operator: '==', value: 'SMO2' },
      { type: 'where', field: 'isArchived', operator: '==', value: false },
      {
        type: 'where',
        field: 'statusCategory',
        operator: 'in',
        value: ['open', 'in_progress', 'waiting_action'],
      },
      { type: 'orderBy', field: 'lastUpdatedAt', direction: 'desc' },
    ]);
  });

  it('materializa os filtros internos de Chamados atuais para atribuicao, andamento e waiting_action', () => {
    const waitingAssignment = createDb();
    buildOwnerWaitingAssignmentQuery(waitingAssignment.db, 'SMO2');
    expect(waitingAssignment.queries[0].operations).toEqual([
      { type: 'where', field: 'ownerUserId', operator: '==', value: 'SMO2' },
      { type: 'where', field: 'isArchived', operator: '==', value: false },
      { type: 'where', field: 'statusCategory', operator: '==', value: 'open' },
      { type: 'orderBy', field: 'lastUpdatedAt', direction: 'desc' },
    ]);

    const inProgress = createDb();
    buildOwnerInProgressQueueQuery(inProgress.db, 'SMO2');
    expect(inProgress.queries[0].operations).toEqual([
      { type: 'where', field: 'ownerUserId', operator: '==', value: 'SMO2' },
      { type: 'where', field: 'isArchived', operator: '==', value: false },
      { type: 'where', field: 'statusCategory', operator: '==', value: 'in_progress' },
      { type: 'orderBy', field: 'lastUpdatedAt', direction: 'desc' },
    ]);

    const waitingAction = createDb();
    buildOwnerWaitingActionQuery(waitingAction.db, 'SMO2');
    expect(waitingAction.queries[0].operations).toEqual([
      { type: 'where', field: 'ownerUserId', operator: '==', value: 'SMO2' },
      { type: 'where', field: 'isArchived', operator: '==', value: false },
      { type: 'where', field: 'statusCategory', operator: '==', value: 'waiting_action' },
      { type: 'orderBy', field: 'lastUpdatedAt', direction: 'desc' },
    ]);
  });

  it('materializa queries de atribuicoes, acoes pendentes, concluidas e minhas solicitacoes', () => {
    const assigned = createDb();
    buildAssignedToMeQuery(assigned.db, 'RESP1');
    expect(assigned.queries[0].operations).toEqual([
      { type: 'where', field: 'responsibleUserId', operator: '==', value: 'RESP1' },
      { type: 'where', field: 'isArchived', operator: '==', value: false },
      {
        type: 'where',
        field: 'statusCategory',
        operator: 'in',
        value: ['open', 'in_progress', 'waiting_action'],
      },
      { type: 'orderBy', field: 'lastUpdatedAt', direction: 'desc' },
    ]);

    const pendingAction = createDb();
    buildPendingActionForMeQuery(pendingAction.db, 'RESP1');
    expect(pendingAction.queries[0].operations).toEqual([
      {
        type: 'where',
        field: 'pendingActionRecipientIds',
        operator: 'array-contains',
        value: 'RESP1',
      },
      { type: 'where', field: 'isArchived', operator: '==', value: false },
      { type: 'where', field: 'statusCategory', operator: '==', value: 'waiting_action' },
      { type: 'orderBy', field: 'lastUpdatedAt', direction: 'desc' },
    ]);

    const completed = createDb();
    buildCompletedHistoryQuery(completed.db, 'RESP1');
    expect(completed.queries[0].operations).toEqual([
      {
        type: 'where',
        field: 'operationalParticipantIds',
        operator: 'array-contains',
        value: 'RESP1',
      },
      {
        type: 'where',
        field: 'statusCategory',
        operator: 'in',
        value: ['finalized', 'archived'],
      },
      { type: 'orderBy', field: 'closedAt', direction: 'desc' },
    ]);

    const mine = createDb();
    buildRequesterHistoryQuery(mine.db, 'REQ1');
    expect(mine.queries[0].operations).toEqual([
      { type: 'where', field: 'requesterUserId', operator: '==', value: 'REQ1' },
      { type: 'orderBy', field: 'submittedAt', direction: 'desc' },
    ]);
  });

  it('retorna atribuicoes e acoes pendentes mapeadas para o DTO do read layer', async () => {
    const { db } = createDb([
      [
        {
          id: 'doc-assigned',
          data: buildWorkflowData(),
        },
      ],
      [
        {
          id: 'doc-pending',
          data: buildWorkflowData({
            requestId: 802,
            statusCategory: 'waiting_action',
            hasPendingActions: true,
            pendingActionRecipientIds: ['RESP1'],
            pendingActionTypes: ['approval'],
          }),
        },
      ],
    ]);

    await expect(queryAssignmentsForActor('RESP1', db)).resolves.toEqual({
      assignedItems: [
        expect.objectContaining({
          docId: 'doc-assigned',
          requestId: 801,
          responsibleUserId: 'RESP1',
        }),
      ],
      pendingActionItems: [
        expect.objectContaining({
          docId: 'doc-pending',
          requestId: 802,
          pendingActionRecipientIds: ['RESP1'],
        }),
      ],
    });
  });

  it('agrupa resultados por mes preservando a ordenacao recebida da query', () => {
    const groups = groupWorkflowsByMonth(
      [
        { requestId: 3, submittedMonthKey: '2026-03' },
        { requestId: 2, submittedMonthKey: '2026-03' },
        { requestId: 1, submittedMonthKey: '2026-02' },
      ],
      'submittedMonthKey',
    );

    expect(groups).toEqual([
      {
        monthKey: '2026-03',
        items: [{ requestId: 3, submittedMonthKey: '2026-03' }, { requestId: 2, submittedMonthKey: '2026-03' }],
      },
      {
        monthKey: '2026-02',
        items: [{ requestId: 1, submittedMonthKey: '2026-02' }],
      },
    ]);
  });

  it('parseia filtros oficiais, aceita alias on_time e valida intervalo de periodo', () => {
    expect(
      parseWorkflowManagementFilters(
        new URLSearchParams(
          'requestId=801&workflowTypeId=facilities&areaId=ops&requesterQuery=alice&slaState=on_time&periodFrom=2026-03-01&periodTo=2026-03-31',
        ),
      ),
    ).toEqual({
      requestId: 801,
      workflowTypeId: 'facilities',
      areaId: 'ops',
      requesterQuery: 'alice',
      slaState: 'on_track',
      periodFrom: '2026-03-01',
      periodTo: '2026-03-31',
    });

    expect(() =>
      parseWorkflowManagementFilters(
        new URLSearchParams('periodFrom=2026-04-01&periodTo=2026-03-01'),
      ),
    ).toThrow('periodFrom nao pode ser maior que periodTo.');
  });

  it('aplica requesterQuery, slaState e periodo conforme o campo temporal da lista', () => {
    const now = new Date('2026-03-28T12:00:00.000Z');
    const items = [
      {
        ...buildWorkflowData({
          requestId: 801,
          requesterName: 'Alice',
          submittedAt: { seconds: Date.parse('2026-03-20T00:00:00.000Z') / 1000 },
          expectedCompletionAt: { seconds: Date.parse('2026-03-30T00:00:00.000Z') / 1000 },
        }),
        docId: 'doc-801',
      },
      {
        ...buildWorkflowData({
          requestId: 802,
          requesterName: 'Bob',
          submittedAt: { seconds: Date.parse('2026-03-05T00:00:00.000Z') / 1000 },
          expectedCompletionAt: { seconds: Date.parse('2026-03-06T00:00:00.000Z') / 1000 },
        }),
        docId: 'doc-802',
      },
    ];

    expect(
      applyOfficialReadFilters(
        items,
        {
          requesterQuery: 'ali',
          slaState: 'at_risk',
          periodFrom: '2026-03-01',
          periodTo: '2026-03-31',
        },
        { periodField: 'submittedAt' },
        now,
      ),
    ).toEqual([
      expect.objectContaining({
        requestId: 801,
        slaState: 'at_risk',
      }),
    ]);
  });

  it('faz lookup exato por requestId em Chamados atuais e respeita o predicate de escopo', async () => {
    getWorkflowRequestByRequestId.mockResolvedValue({
      docId: 'doc-803',
      data: buildWorkflowData({
        requestId: 803,
        ownerUserId: 'SMO2',
        statusCategory: 'waiting_action',
      }),
    });

    await expect(
      queryScopedCurrentQueue(
        'SMO2',
        'waiting_action',
        {
          requestId: 803,
        },
        {},
      ),
    ).resolves.toEqual([
      expect.objectContaining({
        requestId: 803,
        statusCategory: 'waiting_action',
      }),
    ]);

    await expect(
      queryScopedCurrentQueue(
        'OTHER',
        'waiting_action',
        {
          requestId: 803,
        },
        {},
      ),
    ).resolves.toEqual([]);
  });
});
