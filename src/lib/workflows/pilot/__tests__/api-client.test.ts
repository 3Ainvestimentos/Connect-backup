import {
  PilotApiError,
  authenticatedWorkflowFetch,
  getPilotCatalog,
} from '../api-client';

describe('workflow pilot api client', () => {
  const user = {
    getIdToken: jest.fn().mockResolvedValue('token-123'),
  } as any;

  afterEach(() => {
    jest.restoreAllMocks();
    delete (globalThis as { fetch?: typeof fetch }).fetch;
  });

  it('returns normalized catalog data from the canonical envelope', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        data: {
          workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
          workflowName: 'Solicitacoes Gerais',
          description: 'Descricao',
          icon: 'Building2',
          areaId: 'facilities',
          version: 2,
          publishedAt: { seconds: 1_774_606_800, nanoseconds: 0 },
          defaultSlaDays: 3,
          initialStepId: 'step-1',
          initialStepName: 'Solicitacao Aberta',
          fields: [],
          steps: [],
        },
      }),
    } as Response) as typeof fetch;

    await expect(
      getPilotCatalog(user, 'facilities_manutencao_solicitacoes_gerais'),
    ).resolves.toMatchObject({
      workflowTypeId: 'facilities_manutencao_solicitacoes_gerais',
      version: 2,
      publishedAt: new Date('2026-03-27T10:20:00.000Z'),
    });
  });

  it('preserves backend code and http status in typed errors', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        ok: false,
        code: 'FORBIDDEN',
        message: 'Acesso negado.',
      }),
    } as Response) as typeof fetch;

    await expect(authenticatedWorkflowFetch(user, '/api/test')).rejects.toEqual(
      expect.objectContaining<PilotApiError>({
        name: 'PilotApiError',
        code: 'FORBIDDEN',
        httpStatus: 403,
        message: 'Acesso negado.',
      }),
    );
  });
});
