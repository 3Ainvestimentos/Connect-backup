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
  listWorkflowConfigCollaborators: jest.fn(),
}));

const { getFirestore } = require('firebase-admin/firestore');
const { RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
const { resolveOwnerByUserId } = require('../lookups');
const {
  createWorkflowArea,
  createOrReuseWorkflowDraft,
  createWorkflowTypeWithDraft,
  getWorkflowDraftEditorData,
  saveWorkflowDraft,
  hydrateApproverSelections,
} = require('../draft-repository');
const { listWorkflowConfigAreas, listWorkflowConfigOwners, listWorkflowConfigCollaborators } = require('../lookups');

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
  listWorkflowConfigAreas.mockResolvedValue([
    { areaId: 'facilities', name: 'Facilities', icon: 'Building2' },
    { areaId: 'governanca', name: 'Governanca', icon: 'Lock' },
  ]);
  listWorkflowConfigOwners.mockResolvedValue([]);
  listWorkflowConfigCollaborators.mockResolvedValue([
    {
      collaboratorDocId: 'collab-apr1',
      userId: 'APR1',
      name: 'Ana Paula',
      email: 'ana.paula@3ariva.com.br',
      area: 'Facilities',
      position: 'Coordenadora',
    },
  ]);
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

  it('rejects save when payload still carries unresolved approver ids', async () => {
    await expect(
      saveWorkflowDraft('facilities_manutencao', 1, {
        general: {
          name: 'Manutencao',
          description: 'Chamados prediais',
          icon: 'Wrench',
          ownerUserId: 'SMO2',
          defaultSlaDays: 5,
          activeOnPublish: true,
        },
        access: {
          mode: 'all',
          allowedUserIds: ['all'],
        },
        fields: [],
        steps: [
          {
            stepName: 'Validacao',
            statusKey: 'validacao',
            kind: 'work',
            action: {
              type: 'approval',
              label: 'Aprovar',
              approverCollaboratorDocIds: ['collab-apr1'],
              unresolvedApproverIds: ['APR_GHOST'],
            },
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: RuntimeErrorCode.INVALID_DRAFT_PAYLOAD,
      httpStatus: 422,
    });

    expect(getFirestore).not.toHaveBeenCalled();
  });

  it('builds published read-only data from the version snapshot instead of the current root', async () => {
    directGetMock.mockImplementation(async (path: string) => {
      if (path === 'workflowTypes_v2/facilities_manutencao') {
        return {
          exists: true,
          data: () => ({
            workflowTypeId: 'facilities_manutencao',
            name: 'Nome Atual',
            description: 'Descricao atual',
            icon: 'Wrench',
            areaId: 'facilities',
            ownerEmail: 'atual@3ariva.com.br',
            ownerUserId: 'OWN1',
            allowedUserIds: ['all'],
            active: true,
            latestPublishedVersion: 2,
          }),
        };
      }

      if (path === 'workflowTypes_v2/facilities_manutencao/versions/1') {
        return {
          exists: true,
          ref: makeDocRef(path),
          data: () => ({
            workflowTypeId: 'facilities_manutencao',
            version: 1,
            state: 'published',
            ownerEmailAtPublish: 'historico@3ariva.com.br',
            defaultSlaDays: 3,
            fields: [],
            initialStepId: '',
            stepOrder: [],
            stepsById: {},
            publishedAt: null,
            workflowTypeSnapshot: {
              name: 'Nome Historico',
              description: 'Descricao historica',
              icon: 'FileText',
              areaId: 'governanca',
              ownerEmail: 'historico@3ariva.com.br',
              ownerUserId: 'HIS1',
              allowedUserIds: ['APR1'],
              active: true,
            },
          }),
        };
      }

      return { exists: false, data: () => undefined };
    });

    const result = await getWorkflowDraftEditorData('facilities_manutencao', 1);

    expect(result.draft.mode).toBe('read-only');
    expect(result.draft.general.name).toBe('Nome Historico');
    expect(result.draft.general.description).toBe('Descricao historica');
    expect(result.draft.general.ownerUserId).toBe('HIS1');
    expect(result.draft.general.areaId).toBe('governanca');
    expect(result.draft.general.areaName).toBe('Governanca');
    expect(result.draft.access.allowedUserIds).toEqual(['APR1']);
  });

  it('normalizes legacy non-execution attachmentRequired when hydrating draft data', async () => {
    directGetMock.mockImplementation(async (path: string) => {
      if (path === 'workflowTypes_v2/facilities_manutencao') {
        return {
          exists: true,
          data: () => ({
            workflowTypeId: 'facilities_manutencao',
            name: 'Nome Atual',
            description: 'Descricao atual',
            icon: 'Wrench',
            areaId: 'facilities',
            ownerEmail: 'atual@3ariva.com.br',
            ownerUserId: 'OWN1',
            allowedUserIds: ['all'],
            active: true,
            latestPublishedVersion: null,
          }),
        };
      }

      if (path === 'workflowTypes_v2/facilities_manutencao/versions/1') {
        return {
          exists: true,
          ref: makeDocRef(path),
          data: () => ({
            workflowTypeId: 'facilities_manutencao',
            version: 1,
            state: 'draft',
            ownerEmailAtPublish: 'owner@3ariva.com.br',
            defaultSlaDays: 3,
            fields: [],
            initialStepId: 'stp_review',
            stepOrder: ['stp_review'],
            stepsById: {
              stp_review: {
                stepId: 'stp_review',
                stepName: 'Revisao',
                statusKey: 'em_revisao',
                kind: 'work',
                action: {
                  type: 'approval',
                  label: 'Aprovar',
                  approverIds: ['APR1'],
                  attachmentRequired: true,
                },
              },
            },
            publishedAt: null,
            draftConfig: {
              workflowType: {
                name: 'Nome Atual',
                description: 'Descricao atual',
                icon: 'Wrench',
                areaId: 'facilities',
                ownerEmail: 'atual@3ariva.com.br',
                ownerUserId: 'OWN1',
                allowedUserIds: ['all'],
                active: true,
              },
            },
          }),
        };
      }

      return { exists: false, data: () => undefined };
    });

    const result = await getWorkflowDraftEditorData('facilities_manutencao', 1);

    expect(result.draft.steps[0].action).toEqual(
      expect.objectContaining({
        type: 'approval',
        attachmentRequired: false,
      }),
    );
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

  it('recalcula statusKey, kind e initialStepId pela ordem ao salvar draft', async () => {
    directGetMock.mockImplementation(async (path: string) => {
      if (path === 'workflowTypes_v2/facilities_manutencao') {
        return {
          exists: true,
          data: () => ({
            workflowTypeId: 'facilities_manutencao',
            name: 'Manutencao',
            description: 'Chamados prediais',
            icon: 'Wrench',
            areaId: 'facilities',
            ownerEmail: 'owner@3ariva.com.br',
            ownerUserId: 'SMO2',
            allowedUserIds: ['all'],
            active: true,
            latestPublishedVersion: null,
          }),
        };
      }
      if (path === 'workflowTypes_v2/facilities_manutencao/versions/1') {
        return {
          exists: true,
          ref: makeDocRef(path),
          data: () => ({
            workflowTypeId: 'facilities_manutencao',
            version: 1,
            state: 'draft',
            ownerEmailAtPublish: 'owner@3ariva.com.br',
            defaultSlaDays: 5,
            fields: [],
            initialStepId: 'legacy-initial',
            stepOrder: ['legacy-open', 'legacy-final'],
            stepsById: {
              'legacy-open': {
                stepId: 'legacy-open',
                stepName: 'Inicio legado',
                statusKey: 'nao_importa',
                kind: 'final',
              },
              'legacy-final': {
                stepId: 'legacy-final',
                stepName: 'Fim legado',
                statusKey: 'nao_importa',
                kind: 'start',
              },
            },
            publishedAt: null,
          }),
        };
      }
      if (path === 'workflowAreas/facilities') {
        return { exists: true, data: () => ({ name: 'Facilities' }) };
      }
      return { exists: false, data: () => undefined };
    });

    await saveWorkflowDraft('facilities_manutencao', 1, {
      general: {
        name: 'Manutencao',
        description: 'Chamados prediais',
        icon: 'Wrench',
        ownerUserId: 'SMO2',
        defaultSlaDays: 5,
        activeOnPublish: true,
      },
      access: { mode: 'all', allowedUserIds: ['all'] },
      fields: [],
      steps: [
        {
          stepId: 'legacy-final',
          stepName: 'Abertura',
          statusKey: 'manual_1',
          kind: 'final',
        },
        {
          stepId: 'legacy-open',
          stepName: 'Execucao',
          statusKey: 'manual_2',
          kind: 'start',
        },
        {
          stepName: 'Encerramento',
          statusKey: 'manual_3',
          kind: 'work',
        },
      ],
    });

    expect(transactionUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'workflowTypes_v2/facilities_manutencao/versions/1' }),
      expect.objectContaining({
        initialStepId: 'legacy-final',
        stepOrder: ['legacy-final', 'legacy-open', 'stp_encerramento'],
        stepsById: {
          'legacy-final': expect.objectContaining({
            stepId: 'legacy-final',
            stepName: 'Abertura',
            statusKey: 'solicitacao_aberta',
            kind: 'start',
          }),
          'legacy-open': expect.objectContaining({
            stepId: 'legacy-open',
            stepName: 'Execucao',
            statusKey: 'em_andamento',
            kind: 'work',
          }),
          stp_encerramento: expect.objectContaining({
            stepId: 'stp_encerramento',
            stepName: 'Encerramento',
            statusKey: 'finalizado',
            kind: 'final',
          }),
        },
      }),
    );
  });

  it('normalizes attachmentRequired to false when saving non-execution actions', async () => {
    directGetMock.mockImplementation(async (path: string) => {
      if (path === 'workflowTypes_v2/facilities_manutencao') {
        return {
          exists: true,
          data: () => ({
            workflowTypeId: 'facilities_manutencao',
            name: 'Manutencao',
            description: 'Chamados prediais',
            icon: 'Wrench',
            areaId: 'facilities',
            ownerEmail: 'owner@3ariva.com.br',
            ownerUserId: 'SMO2',
            allowedUserIds: ['all'],
            active: true,
            latestPublishedVersion: null,
          }),
        };
      }
      if (path === 'workflowTypes_v2/facilities_manutencao/versions/1') {
        return {
          exists: true,
          ref: makeDocRef(path),
          data: () => ({
            workflowTypeId: 'facilities_manutencao',
            version: 1,
            state: 'draft',
            ownerEmailAtPublish: 'owner@3ariva.com.br',
            defaultSlaDays: 5,
            fields: [],
            initialStepId: '',
            stepOrder: [],
            stepsById: {},
            publishedAt: null,
          }),
        };
      }
      if (path === 'workflowAreas/facilities') {
        return { exists: true, data: () => ({ name: 'Facilities' }) };
      }
      if (path === 'collaborators/collab-apr1') {
        return { exists: true, data: () => ({ id3a: 'APR1' }) };
      }
      return { exists: false, data: () => undefined };
    });

    await saveWorkflowDraft('facilities_manutencao', 1, {
      general: {
        name: 'Manutencao',
        description: 'Chamados prediais',
        icon: 'Wrench',
        ownerUserId: 'SMO2',
        defaultSlaDays: 5,
        activeOnPublish: true,
      },
      access: { mode: 'all', allowedUserIds: ['all'] },
      fields: [],
      steps: [
        {
          stepName: 'Validacao',
          statusKey: 'validacao',
          kind: 'work',
          action: {
            type: 'approval',
            label: 'Aprovar',
            approverCollaboratorDocIds: ['collab-apr1'],
            unresolvedApproverIds: [],
            attachmentRequired: true,
            attachmentPlaceholder: 'Nao deve persistir como obrigatorio',
          },
        },
      ],
    });

    expect(transactionUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'workflowTypes_v2/facilities_manutencao/versions/1' }),
      expect.objectContaining({
        stepsById: {
          stp_validacao: expect.objectContaining({
            action: expect.objectContaining({
              type: 'approval',
              attachmentRequired: false,
            }),
          }),
        },
      }),
    );
  });

  it('resolveCollaboratorDocIdsToApproverIds rejeita 422 quando collaboratorDoc nao encontrado', async () => {
    // Arrange: workflowType + version draft devem existir para saveWorkflowDraft chegar ate
    // o normalizeSteps. Colaborador apr1 existe, ghost nao.
    directGetMock.mockImplementation(async (path: string) => {
      if (path === 'workflowTypes_v2/facilities_manutencao') {
        return {
          exists: true,
          data: () => ({
            workflowTypeId: 'facilities_manutencao',
            name: 'Manutencao',
            description: 'Chamados prediais',
            icon: 'Wrench',
            areaId: 'facilities',
            ownerEmail: 'owner@3ariva.com.br',
            ownerUserId: 'SMO2',
            allowedUserIds: ['all'],
            active: true,
            latestPublishedVersion: null,
          }),
        };
      }
      if (path === 'workflowTypes_v2/facilities_manutencao/versions/1') {
        return {
          exists: true,
          ref: makeDocRef(path),
          data: () => ({
            workflowTypeId: 'facilities_manutencao',
            version: 1,
            state: 'draft',
            ownerEmailAtPublish: 'owner@3ariva.com.br',
            defaultSlaDays: 5,
            fields: [],
            initialStepId: '',
            stepOrder: [],
            stepsById: {},
            publishedAt: null,
          }),
        };
      }
      if (path === 'workflowAreas/facilities') {
        return { exists: true, data: () => ({ name: 'Facilities' }) };
      }
      if (path === 'collaborators/collab-apr1') {
        return { exists: true, data: () => ({ id3a: 'APR1' }) };
      }
      if (path === 'collaborators/collab-ghost') {
        return { exists: false, data: () => undefined };
      }
      return { exists: false, data: () => undefined };
    });

    // Save deve falhar com 422 antes de concluir a transacao.
    await expect(
      saveWorkflowDraft('facilities_manutencao', 1, {
        general: {
          name: 'Manutencao',
          description: 'Chamados prediais',
          icon: 'Wrench',
          ownerUserId: 'SMO2',
          defaultSlaDays: 5,
          activeOnPublish: true,
        },
        access: { mode: 'all', allowedUserIds: ['all'] },
        fields: [],
        steps: [
          {
            stepName: 'Validacao',
            statusKey: 'validacao',
            kind: 'work',
            action: {
              type: 'approval',
              label: 'Aprovar',
              approverCollaboratorDocIds: ['collab-apr1', 'collab-ghost'],
              unresolvedApproverIds: [],
            },
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: RuntimeErrorCode.INVALID_DRAFT_PAYLOAD,
      httpStatus: 422,
    });
  });

  it('hydrateApproverSelections separa aprovadores resolvidos de nao resolvidos', () => {
    const collaboratorsByUserId = new Map([
      [
        'APR1',
        {
          collaboratorDocId: 'collab-apr1',
          userId: 'APR1',
          name: 'Ana Paula',
          email: 'ana.paula@3ariva.com.br',
          area: 'Facilities',
        },
      ],
    ]);

    const result = hydrateApproverSelections(['APR1', 'APR_GHOST'], collaboratorsByUserId);

    expect(result.approvers).toEqual([
      {
        collaboratorDocId: 'collab-apr1',
        userId: 'APR1',
        name: 'Ana Paula',
        email: 'ana.paula@3ariva.com.br',
      },
    ]);
    expect(result.unresolvedApproverIds).toEqual(['APR_GHOST']);
  });
});
