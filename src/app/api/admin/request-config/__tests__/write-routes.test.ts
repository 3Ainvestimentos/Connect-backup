/** @jest-environment node */

export {};

jest.mock('@/lib/workflows/admin-config/auth', () => ({
  authenticateWorkflowConfigAdmin: jest.fn(),
}));

jest.mock('@/lib/workflows/admin-config/draft-repository', () => ({
  createWorkflowArea: jest.fn(),
  createWorkflowTypeWithDraft: jest.fn(),
  createOrReuseWorkflowDraft: jest.fn(),
  getWorkflowDraftEditorData: jest.fn(),
  saveWorkflowDraft: jest.fn(),
}));

const { RuntimeError, RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
const { authenticateWorkflowConfigAdmin } = require('@/lib/workflows/admin-config/auth');
const repository = require('@/lib/workflows/admin-config/draft-repository');
const areasRoute = require('@/app/api/admin/request-config/areas/route');
const workflowTypesRoute = require('@/app/api/admin/request-config/workflow-types/route');
const draftRoute = require('@/app/api/admin/request-config/workflow-types/[workflowTypeId]/drafts/route');
const versionRoute = require('@/app/api/admin/request-config/workflow-types/[workflowTypeId]/versions/[version]/route');

describe('request-config write routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authenticateWorkflowConfigAdmin.mockResolvedValue({
      decodedToken: { uid: 'firebase-uid-1' },
      collaborator: { id: 'collab-1', permissions: { canManageWorkflowsV2: true } },
    });
  });

  it('creates area with canonical envelope', async () => {
    repository.createWorkflowArea.mockResolvedValue({
      areaId: 'facilities',
      name: 'Facilities',
      icon: 'Building2',
    });

    const response = await areasRoute.POST(
      new Request('http://localhost/api/admin/request-config/areas', {
        method: 'POST',
        headers: { Authorization: 'Bearer token' },
        body: JSON.stringify({ name: 'Facilities', icon: 'Building2' }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: {
        areaId: 'facilities',
        name: 'Facilities',
        icon: 'Building2',
      },
    });
  });

  it('creates workflow type + initial draft', async () => {
    repository.createWorkflowTypeWithDraft.mockResolvedValue({
      workflowTypeId: 'facilities_manutencao',
      version: 1,
      editorPath: '/admin/request-config/facilities_manutencao/versions/1/edit',
    });

    const response = await workflowTypesRoute.POST(
      new Request('http://localhost/api/admin/request-config/workflow-types', {
        method: 'POST',
        headers: { Authorization: 'Bearer token' },
        body: JSON.stringify({
          areaId: 'facilities',
          name: 'Manutencao',
          description: 'Chamados prediais',
          icon: 'Wrench',
          ownerUserId: 'SMO2',
          allowedUserIds: ['all'],
          defaultSlaDays: 5,
        }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: expect.objectContaining({
        workflowTypeId: 'facilities_manutencao',
        version: 1,
      }),
    });
  });

  it('reuses an existing draft when opening a draft route', async () => {
    repository.createOrReuseWorkflowDraft.mockResolvedValue({
      workflowTypeId: 'facilities_manutencao',
      version: 3,
      reusedExistingDraft: true,
      editorPath: '/admin/request-config/facilities_manutencao/versions/3/edit',
    });

    const response = await draftRoute.POST(
      new Request('http://localhost/api/admin/request-config/workflow-types/facilities_manutencao/drafts', {
        method: 'POST',
        headers: { Authorization: 'Bearer token' },
      }),
      { params: Promise.resolve({ workflowTypeId: 'facilities_manutencao' }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: expect.objectContaining({
        workflowTypeId: 'facilities_manutencao',
        reusedExistingDraft: true,
      }),
    });
  });

  it('returns the draft bootstrap payload', async () => {
    repository.getWorkflowDraftEditorData.mockResolvedValue({
      draft: {
        workflowTypeId: 'facilities_manutencao',
        version: 1,
        state: 'draft',
        isNewWorkflowType: true,
        general: {
          name: 'Manutencao',
          description: 'Chamados prediais',
          icon: 'Wrench',
          areaId: 'facilities',
          ownerEmail: 'owner@3ariva.com.br',
          ownerUserId: 'SMO2',
          defaultSlaDays: 5,
          activeOnPublish: true,
        },
        access: {
          mode: 'all',
          allowedUserIds: ['all'],
          preview: 'Acesso publico para todos os colaboradores',
        },
        fields: [],
        steps: [],
        initialStepId: '',
        publishReadiness: [],
        meta: {
          createdAt: null,
          updatedAt: null,
          latestPublishedVersion: null,
        },
      },
      lookups: {
        areas: [],
        owners: [],
        collaborators: [],
      },
    });

    const response = await versionRoute.GET(
      new Request('http://localhost/api/admin/request-config/workflow-types/facilities_manutencao/versions/1', {
        headers: { Authorization: 'Bearer token' },
      }),
      { params: Promise.resolve({ workflowTypeId: 'facilities_manutencao', version: '1' }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: expect.objectContaining({
        draft: expect.objectContaining({
          workflowTypeId: 'facilities_manutencao',
          version: 1,
        }),
      }),
    });
  });

  it('saves a draft and returns warnings', async () => {
    repository.saveWorkflowDraft.mockResolvedValue({
      savedAt: '2026-04-08T18:30:00.000Z',
      publishReadiness: [
        {
          code: 'MISSING_FINAL_STEP',
          category: 'steps',
          severity: 'warning',
          message: 'Defina uma etapa final antes de publicar.',
        },
      ],
    });

    const response = await versionRoute.PUT(
      new Request('http://localhost/api/admin/request-config/workflow-types/facilities_manutencao/versions/1', {
        method: 'PUT',
        headers: { Authorization: 'Bearer token' },
        body: JSON.stringify({
          general: {
            name: 'Manutencao',
            description: 'Chamados prediais',
            icon: 'Wrench',
            areaId: 'facilities',
            ownerUserId: 'SMO2',
            defaultSlaDays: 5,
            activeOnPublish: true,
          },
          access: {
            mode: 'all',
            allowedUserIds: ['all'],
          },
          fields: [],
          steps: [],
          initialStepId: '',
        }),
      }),
      { params: Promise.resolve({ workflowTypeId: 'facilities_manutencao', version: '1' }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: expect.objectContaining({
        savedAt: '2026-04-08T18:30:00.000Z',
      }),
    });
  });

  it('maps runtime errors to the HTTP response', async () => {
    repository.createOrReuseWorkflowDraft.mockRejectedValue(
      new RuntimeError(RuntimeErrorCode.DRAFT_CONFLICT, 'O tipo ja possui um draft aberto.', 409),
    );

    const response = await draftRoute.POST(
      new Request('http://localhost/api/admin/request-config/workflow-types/facilities_manutencao/drafts', {
        method: 'POST',
        headers: { Authorization: 'Bearer token' },
      }),
      { params: Promise.resolve({ workflowTypeId: 'facilities_manutencao' }) },
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: RuntimeErrorCode.DRAFT_CONFLICT,
      message: 'O tipo ja possui um draft aberto.',
    });
  });
});
