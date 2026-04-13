/** @jest-environment node */

jest.mock('@/lib/firebase-admin', () => ({
  getFirebaseAdminApp: jest.fn(() => ({ name: 'admin-app' })),
}));

const counterGetMock = jest.fn();
const getFirestoreMock = jest.fn(() => ({
  doc: jest.fn(() => ({
    get: (...args) => counterGetMock(...args),
  })),
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: (...args) => getFirestoreMock(...args),
  Timestamp: {
    now: jest.fn(() => ({ seconds: 1, nanoseconds: 0 })),
  },
}));

jest.mock('@/lib/workflows/runtime/repository', () => ({
  getWorkflowType: jest.fn(),
  getWorkflowVersion: jest.fn(),
  seedWorkflowType: jest.fn(),
  seedWorkflowVersion: jest.fn(),
}));

jest.mock('@/lib/workflows/bootstrap/fase2c/shared/owner-resolution', () => ({
  fetchCollaborators: jest.fn(),
}));

const {
  assertNoPublishedTargets,
  runSeedForLot,
} = require('@/lib/workflows/bootstrap/fase2c/shared/execution');
const {
  getWorkflowType,
  getWorkflowVersion,
  seedWorkflowType,
  seedWorkflowVersion,
} = require('@/lib/workflows/runtime/repository');
const { fetchCollaborators } = require('@/lib/workflows/bootstrap/fase2c/shared/owner-resolution');

function buildPayload(workflowTypeId = 'workflow_teste') {
  return {
    workflowTypeId,
    typePayload: { workflowTypeId, ownerEmail: 'owner@3ainvestimentos.com.br' },
    versionPayload: { workflowTypeId, version: 1 },
    reportItem: {
      lotId: 'lote_01_governanca_financeiro',
      legacyWorkflowId: 'legacy-1',
      workflowTypeId,
      name: 'Workflow Teste',
      areaId: 'area-1',
      ownerEmailLegacy: 'owner@3ariva.com.br',
      ownerEmailResolved: 'owner@3ainvestimentos.com.br',
      ownerUserId: 'OWN1',
      lotStatus: 'enabled',
      stepStrategy: 'canonical_3_steps',
      workflowTypeDocPath: `workflowTypes_v2/${workflowTypeId}`,
      versionDocPath: `workflowTypes_v2/${workflowTypeId}/versions/1`,
      fieldsSummary: [],
      statusesSummary: [],
      sanitizations: [],
    },
  };
}

describe('fase2c execution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchCollaborators.mockResolvedValue([{ email: 'owner@3ainvestimentos.com.br', id3a: 'OWN1' }]);
    getWorkflowType.mockResolvedValue(null);
    getWorkflowVersion.mockResolvedValue(null);
    counterGetMock.mockResolvedValue({
      exists: true,
      data: () => ({ lastRequestNumber: 812 }),
    });
  });

  it('nao executa writes em dry-run', async () => {
    const logger = jest.fn();

    await runSeedForLot({
      scriptName: 'seed-fase2c-test',
      argv: ['node', 'script'],
      logger,
      errorLogger: jest.fn(),
      buildPayloads: async () => [buildPayload('workflow_dry_run')],
    });

    expect(seedWorkflowType).not.toHaveBeenCalled();
    expect(seedWorkflowVersion).not.toHaveBeenCalled();
    expect(logger).toHaveBeenCalledWith('[seed-fase2c-test] Dry run. Nenhuma escrita foi executada.');
    expect(logger).toHaveBeenCalledWith(expect.stringContaining('"counterStatus": "present_valid"'));
    expect(logger).toHaveBeenCalledWith(expect.stringContaining('"stepStrategy": "canonical_3_steps"'));
  });

  it('aborta antes da primeira escrita quando o destino ja existe', async () => {
    getWorkflowType.mockResolvedValueOnce({ workflowTypeId: 'workflow_existente' });

    await expect(
      assertNoPublishedTargets([buildPayload('workflow_existente')]),
    ).rejects.toThrow('Destino ja publicado');

    expect(seedWorkflowType).not.toHaveBeenCalled();
    expect(seedWorkflowVersion).not.toHaveBeenCalled();
  });

  it('executa apenas workflowTypes_v2 e versions/1 mesmo com counter invalido', async () => {
    counterGetMock.mockResolvedValue({
      exists: true,
      data: () => ({ lastRequestNumber: '812' }),
    });

    await runSeedForLot({
      scriptName: 'seed-fase2c-test',
      argv: ['node', 'script', '--execute'],
      logger: jest.fn(),
      errorLogger: jest.fn(),
      buildPayloads: async () => [buildPayload('workflow_execute')],
    });

    expect(seedWorkflowType).toHaveBeenCalledWith('workflow_execute', {
      workflowTypeId: 'workflow_execute',
      ownerEmail: 'owner@3ainvestimentos.com.br',
    });
    expect(seedWorkflowVersion).toHaveBeenCalledWith('workflow_execute', 1, {
      workflowTypeId: 'workflow_execute',
      version: 1,
    });
  });

  it('executa workflowTypes_v2 e versions/1 mesmo com counter ausente', async () => {
    const logger = jest.fn();

    counterGetMock.mockResolvedValue({
      exists: false,
      data: () => undefined,
    });

    await runSeedForLot({
      scriptName: 'seed-fase2c-test',
      argv: ['node', 'script', '--execute'],
      logger,
      errorLogger: jest.fn(),
      buildPayloads: async () => [buildPayload('workflow_execute_absent')],
    });

    expect(seedWorkflowType).toHaveBeenCalledWith('workflow_execute_absent', {
      workflowTypeId: 'workflow_execute_absent',
      ownerEmail: 'owner@3ainvestimentos.com.br',
    });
    expect(seedWorkflowVersion).toHaveBeenCalledWith('workflow_execute_absent', 1, {
      workflowTypeId: 'workflow_execute_absent',
      version: 1,
    });
    expect(logger).toHaveBeenCalledWith(
      '[seed-fase2c-test] Seed concluido em workflowTypes_v2 e versions/1 sem escrita em counters/workflowCounter_v2. Counter status observado: absent.',
    );
  });
});
