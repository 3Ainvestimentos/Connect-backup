/** @jest-environment node */

export {};

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(),
}));

jest.mock('@/lib/firebase-admin', () => ({
  getFirebaseAdminApp: jest.fn(() => ({ name: 'admin-app' })),
}));

const { getFirestore } = require('firebase-admin/firestore');
const { buildWorkflowConfigCatalog } = require('../catalog');

function createTimestamp(isoString: string) {
  return {
    toDate: () => new Date(isoString),
  };
}

function createDoc(id: string, data: Record<string, unknown>, versions: Array<Record<string, unknown>> = []) {
  return {
    id,
    data: () => data,
    ref: {
      collection: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          docs: versions.map((version) => ({
            data: () => version,
          })),
        }),
      })),
    },
  };
}

describe('buildWorkflowConfigCatalog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('aggregates areas, workflow types and versions while deriving UI status fields', async () => {
    const areaDocs = [
      createDoc('facilities', {
        name: 'Facilities',
        icon: 'building-2',
        storageFolderPath: 'private/facilities',
      }),
      createDoc('people', {
        name: 'People',
        icon: 'users',
      }),
    ];

    const typeDocs = [
      createDoc(
        'facilities_manutencao',
        {
          workflowTypeId: 'facilities_manutencao',
          name: 'Manutencao',
          description: 'Chamados prediais.',
          areaId: 'facilities',
          ownerEmail: 'owner@3ariva.com.br',
          ownerUserId: 'SMO2',
          active: true,
          latestPublishedVersion: 2,
        },
        [
          {
            workflowTypeId: 'facilities_manutencao',
            version: 1,
            state: 'published',
            fields: [{ id: 'impacto' }],
            stepOrder: ['open'],
            publishedAt: createTimestamp('2026-04-01T10:00:00.000Z'),
          },
          {
            workflowTypeId: 'facilities_manutencao',
            version: 2,
            state: 'published',
            fields: [{ id: 'impacto' }, { id: 'urgencia' }],
            stepOrder: ['open', 'approve'],
            publishedAt: createTimestamp('2026-04-03T15:30:00.000Z'),
          },
          {
            workflowTypeId: 'facilities_manutencao',
            version: 3,
            state: 'draft',
            fields: [{ id: 'impacto' }, { id: 'urgencia' }, { id: 'anexo' }],
            stepOrder: ['open', 'approve'],
            publishedAt: createTimestamp('2026-04-04T15:30:00.000Z'),
          },
        ],
      ),
      createDoc(
        'people_admission',
        {
          workflowTypeId: 'people_admission',
          name: 'Admissao',
          description: 'Onboarding',
          areaId: 'people',
          ownerEmail: 'hr@3ariva.com.br',
          ownerUserId: 'HR1',
          active: true,
        },
        [
          {
            workflowTypeId: 'people_admission',
            version: 1,
            state: 'draft',
            fields: [{ id: 'candidate' }],
            stepOrder: ['open'],
            publishedAt: null,
          },
        ],
      ),
    ];

    getFirestore.mockReturnValue({
      collection: jest.fn((name) => ({
        get: jest.fn().mockResolvedValue({
          docs: name === 'workflowAreas' ? areaDocs : typeDocs,
        }),
      })),
    });

    const result = await buildWorkflowConfigCatalog();

    expect(result.summary).toEqual({
      areaCount: 2,
      workflowTypeCount: 2,
      versionCount: 4,
    });

    expect(result.areas).toEqual([
      {
        areaId: 'facilities',
        name: 'Facilities',
        icon: 'building-2',
        typeCount: 1,
        publishedTypeCount: 1,
        draftOnlyTypeCount: 0,
        types: [
          expect.objectContaining({
            workflowTypeId: 'facilities_manutencao',
            publishedVersionLabel: 'v2 publicada',
            hasPublishedVersion: true,
            draftVersion: 3,
            versions: [
              expect.objectContaining({ version: 1, uiStatus: 'Inativa', isActivePublished: false }),
              expect.objectContaining({ version: 2, uiStatus: 'Publicada', isActivePublished: true }),
              expect.objectContaining({ version: 3, uiStatus: 'Rascunho', isActivePublished: false }),
            ],
          }),
        ],
      },
      {
        areaId: 'people',
        name: 'People',
        icon: 'users',
        typeCount: 1,
        publishedTypeCount: 0,
        draftOnlyTypeCount: 1,
        types: [
          expect.objectContaining({
            workflowTypeId: 'people_admission',
            publishedVersionLabel: 'Rascunho inicial / sem publicada',
            hasPublishedVersion: false,
            draftVersion: 1,
            versions: [expect.objectContaining({ version: 1, uiStatus: 'Rascunho' })],
          }),
        ],
      },
    ]);

    expect(JSON.stringify(result)).not.toContain('storageFolderPath');
  });
});
