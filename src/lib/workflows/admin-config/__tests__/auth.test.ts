/** @jest-environment node */

export {};

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(),
}));

jest.mock('@/lib/firebase-admin', () => ({
  getFirebaseAdminApp: jest.fn(() => ({ name: 'admin-app' })),
}));

jest.mock('@/lib/workflows/runtime/auth-helpers', () => ({
  verifyBearerToken: jest.fn(),
}));

const { getFirestore } = require('firebase-admin/firestore');
const { verifyBearerToken } = require('@/lib/workflows/runtime/auth-helpers');
const { authenticateWorkflowConfigAdmin } = require('../auth');

function createDoc(id: string, data: Record<string, unknown>) {
  return {
    id,
    data: () => data,
  };
}

describe('authenticateWorkflowConfigAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('falls back to raw and normalized email candidates when authUid is not found', async () => {
    verifyBearerToken.mockResolvedValue({
      uid: 'firebase-uid-1',
      email: 'owner@3ariva.com.br',
    });

    const whereMock = jest
      .fn()
      .mockReturnValueOnce({
        get: jest.fn().mockResolvedValue({ size: 0, docs: [] }),
      })
      .mockReturnValueOnce({
        get: jest.fn().mockResolvedValue({
          size: 1,
          docs: [
            createDoc('collab-1', {
              email: 'owner@3ainvestimentos.com.br',
              permissions: { canManageWorkflowsV2: true },
            }),
          ],
        }),
      });

    getFirestore.mockReturnValue({
      collection: jest.fn(() => ({
        where: whereMock,
      })),
    });

    const result = await authenticateWorkflowConfigAdmin(
      new Request('http://localhost/api/admin/request-config/catalog', {
        headers: { Authorization: 'Bearer token' },
      }),
    );

    expect(result.collaborator.id).toBe('collab-1');
    expect(whereMock).toHaveBeenNthCalledWith(1, 'authUid', '==', 'firebase-uid-1');
    expect(whereMock).toHaveBeenNthCalledWith(
      2,
      'email',
      'in',
      ['owner@3ariva.com.br', 'owner@3ainvestimentos.com.br'],
    );
  });
});
