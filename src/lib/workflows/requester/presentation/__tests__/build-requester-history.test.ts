import { buildRequesterHistory } from '../build-requester-history';
import { legacyRequestToUnifiedDetail } from '../../adapters/legacy-to-unified-detail';
import { mockLegacyRequest, mockWorkflowArea, mockWorkflowDefinition } from '../../legacy/__tests__/fixtures';
import type { RequesterUnifiedRequestDetail } from '../../unified-types';

describe('buildRequesterHistory', () => {
  it('derives v2 history from progress items in step order', () => {
    const detail = {
      origin: 'v2',
      detailKey: 'v2:1001',
      summary: {
        requesterName: 'Test User',
        workflowName: 'Manutenção Geral',
        displayRequestId: '1001',
        submittedAt: null,
        lastUpdatedAt: null,
        responsibleName: null,
        openedInLabel: 'Facilities',
        statusLabel: 'Em andamento',
        currentStepName: 'Execução',
      },
      fields: [],
      attachments: [],
      timeline: [
        {
          label: 'Evento granular que não deve aparecer',
          timestamp: new Date('2026-04-11T10:00:00.000Z'),
          userName: 'Sistema',
          action: 'request_opened',
          details: null,
        },
        {
          label: 'Etapa concluída',
          timestamp: new Date('2026-04-12T14:45:00.000Z'),
          userName: 'Sistema',
          action: 'step_completed',
          details: { stepId: 'step-1' },
        },
        {
          label: 'Etapa concluída novamente',
          timestamp: new Date('2026-04-12T15:00:00.000Z'),
          userName: 'Sistema',
          action: 'step_completed',
          details: { stepId: 'step-1' },
        },
      ],
      progress: {
        currentStepId: 'step-2',
        totalSteps: 3,
        completedSteps: 1,
        items: [
          {
            stepId: 'step-3',
            stepName: 'Conclusão',
            statusKey: 'pending',
            kind: 'final',
            order: 3,
            state: 'pending',
            isCurrent: false,
          },
          {
            stepId: 'step-1',
            stepName: 'Abertura',
            statusKey: 'completed',
            kind: 'start',
            order: 1,
            state: 'completed',
            isCurrent: false,
          },
          {
            stepId: 'step-2',
            stepName: 'Execução',
            statusKey: 'in_progress',
            kind: 'work',
            order: 2,
            state: 'active',
            isCurrent: true,
          },
        ],
      },
      raw: {} as RequesterUnifiedRequestDetail['raw'],
    } satisfies RequesterUnifiedRequestDetail;

    const history = buildRequesterHistory(detail);

    expect(history.map((item) => item.title)).toEqual(['Abertura', 'Execução', 'Conclusão']);
    expect(history.map((item) => item.source)).toEqual(['progress', 'progress', 'progress']);
    expect(history.map((item) => item.dateVisibility)).toEqual([
      'only-when-present',
      'only-when-present',
      'only-when-present',
    ]);
    expect(history[0].occurredAt?.toISOString()).toBe('2026-04-12T15:00:00.000Z');
    expect(history[1]).toMatchObject({
      title: 'Execução',
      stateLabel: 'Atual',
      isCurrent: true,
      occurredAt: null,
    });
    expect(history[2].occurredAt).toBeNull();
  });

  it('derives legacy history from timeline ordered by timestamp', () => {
    const detail = legacyRequestToUnifiedDetail(
      mockLegacyRequest,
      mockWorkflowDefinition,
      mockWorkflowArea,
    );

    const history = buildRequesterHistory(detail);

    expect(history).toHaveLength(2);
    expect(history[0]).toMatchObject({
      title: 'Pendente',
      actorName: 'Joao Silva',
      dateVisibility: 'always',
      source: 'timeline',
    });
    expect(history[1]).toMatchObject({
      title: 'Em Andamento',
      actorName: 'Maria Santos',
      dateVisibility: 'always',
      notesText: 'Solicitacao em analise',
      source: 'timeline',
    });
    expect(history[0].occurredAt?.getTime()).toBeLessThan(history[1].occurredAt?.getTime() ?? 0);
  });
});
