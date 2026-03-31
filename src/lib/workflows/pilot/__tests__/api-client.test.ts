import type { User } from 'firebase/auth';
import {
  PilotApiError,
  authenticatedWorkflowFetch,
  getPilotCatalog,
  getPilotCompleted,
} from '../api-client';

describe('workflow pilot api client', () => {
  const user = {
    getIdToken: jest.fn().mockResolvedValue('token-123'),
  } as unknown as User;

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

  it('normalizes completed history into items and monthly groups', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        data: {
          items: [
            {
              docId: 'doc-1',
              requestId: 701,
              workflowTypeId: 'facilities_solicitacao_compras',
              workflowVersion: 1,
              workflowName: 'Solicitacao de compras',
              areaId: 'facilities',
              ownerEmail: 'owner@example.com',
              ownerUserId: 'owner-1',
              requesterUserId: 'requester-1',
              requesterName: 'Lucas',
              responsibleUserId: 'resp-1',
              responsibleName: 'Maria',
              currentStepId: 'step-5',
              currentStepName: 'Finalizado',
              currentStatusKey: 'finalizado',
              statusCategory: 'finalized',
              hasResponsible: true,
              hasPendingActions: false,
              pendingActionRecipientIds: [],
              pendingActionTypes: [],
              operationalParticipantIds: ['owner-1', 'resp-1'],
              slaDays: 5,
              expectedCompletionAt: null,
              lastUpdatedAt: { seconds: 1_775_040_000, nanoseconds: 0 },
              finalizedAt: { seconds: 1_775_040_000, nanoseconds: 0 },
              closedAt: { seconds: 1_775_040_000, nanoseconds: 0 },
              archivedAt: null,
              submittedAt: { seconds: 1_774_606_800, nanoseconds: 0 },
              submittedMonthKey: '2026-03',
              closedMonthKey: '2026-04',
              isArchived: false,
            },
          ],
          groups: [
            {
              monthKey: '2026-04',
              items: [
                {
                  docId: 'doc-1',
                  requestId: 701,
                  workflowTypeId: 'facilities_solicitacao_compras',
                  workflowVersion: 1,
                  workflowName: 'Solicitacao de compras',
                  areaId: 'facilities',
                  ownerEmail: 'owner@example.com',
                  ownerUserId: 'owner-1',
                  requesterUserId: 'requester-1',
                  requesterName: 'Lucas',
                  responsibleUserId: 'resp-1',
                  responsibleName: 'Maria',
                  currentStepId: 'step-5',
                  currentStepName: 'Finalizado',
                  currentStatusKey: 'finalizado',
                  statusCategory: 'finalized',
                  hasResponsible: true,
                  hasPendingActions: false,
                  pendingActionRecipientIds: [],
                  pendingActionTypes: [],
                  operationalParticipantIds: ['owner-1', 'resp-1'],
                  slaDays: 5,
                  expectedCompletionAt: null,
                  lastUpdatedAt: { seconds: 1_775_040_000, nanoseconds: 0 },
                  finalizedAt: { seconds: 1_775_040_000, nanoseconds: 0 },
                  closedAt: { seconds: 1_775_040_000, nanoseconds: 0 },
                  archivedAt: null,
                  submittedAt: { seconds: 1_774_606_800, nanoseconds: 0 },
                  submittedMonthKey: '2026-03',
                  closedMonthKey: '2026-04',
                  isArchived: false,
                },
              ],
            },
          ],
        },
      }),
    } as Response) as typeof fetch;

    await expect(getPilotCompleted(user)).resolves.toMatchObject({
      items: [
        expect.objectContaining({
          requestId: 701,
          workflowTypeId: 'facilities_solicitacao_compras',
          closedMonthKey: '2026-04',
          finalizedAt: new Date('2026-04-01T10:40:00.000Z'),
        }),
      ],
      groups: [
        expect.objectContaining({
          monthKey: '2026-04',
          items: [
            expect.objectContaining({
              requestId: 701,
            }),
          ],
        }),
      ],
    });
  });
});
