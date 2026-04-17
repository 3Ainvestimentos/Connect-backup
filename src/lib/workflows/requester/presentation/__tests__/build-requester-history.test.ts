import { buildRequesterHistory } from '../build-requester-history';
import { legacyRequestToUnifiedDetail } from '../../adapters/legacy-to-unified-detail';
import { mockLegacyRequest, mockWorkflowArea, mockWorkflowDefinition } from '../../legacy/__tests__/fixtures';
import type { RequesterUnifiedRequestDetail } from '../../unified-types';

function makeV2Detail(overrides?: {
  timeline?: RequesterUnifiedRequestDetail['timeline'];
  progressItems?: NonNullable<RequesterUnifiedRequestDetail['progress']>['items'];
  submittedAt?: Date | null;
}) {
  return {
    origin: 'v2',
    detailKey: 'v2:2001',
    summary: {
      requesterName: 'Test User',
      workflowName: 'Workflow Test',
      displayRequestId: '2001',
      submittedAt: overrides?.submittedAt ?? null,
      lastUpdatedAt: null,
      responsibleName: null,
      openedInLabel: 'Facilities',
      statusLabel: 'Em andamento',
      currentStepName: 'Execução',
    },
    fields: [],
    attachments: [],
    timeline: overrides?.timeline ?? [],
    progress: {
      currentStepId: 'step-2',
      totalSteps: 3,
      completedSteps: 1,
      items: overrides?.progressItems ?? [
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
        {
          stepId: 'step-3',
          stepName: 'Conclusão',
          statusKey: 'pending',
          kind: 'final',
          order: 3,
          state: 'pending',
          isCurrent: false,
        },
      ],
    },
    raw: {} as RequesterUnifiedRequestDetail['raw'],
  } satisfies RequesterUnifiedRequestDetail;
}

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

  it('uses request_opened as fallback for the first completed v2 step without step_completed', () => {
    const detail = makeV2Detail({
      timeline: [
        {
          label: 'Solicitação aberta',
          timestamp: new Date('2026-04-11T10:00:00.000Z'),
          userName: 'Sistema',
          action: 'request_opened',
          details: null,
        },
      ],
    });

    const history = buildRequesterHistory(detail);

    expect(history[0].occurredAt?.toISOString()).toBe('2026-04-11T10:00:00.000Z');
    expect(history[1].occurredAt).toBeNull();
    expect(history[2].occurredAt).toBeNull();
  });

  it('uses submittedAt as fallback when the first completed v2 step has no matching timeline event', () => {
    const detail = makeV2Detail({
      submittedAt: new Date('2026-04-10T08:30:00.000Z'),
    });

    const history = buildRequesterHistory(detail);

    expect(history[0].occurredAt?.toISOString()).toBe('2026-04-10T08:30:00.000Z');
  });

  it('keeps non-initial completed steps without a fallback date', () => {
    const detail = makeV2Detail({
      timeline: [
        {
          label: 'Solicitação aberta',
          timestamp: new Date('2026-04-11T10:00:00.000Z'),
          userName: 'Sistema',
          action: 'request_opened',
          details: null,
        },
      ],
      progressItems: [
        {
          stepId: 'step-1',
          stepName: 'Abertura',
          statusKey: 'in_progress',
          kind: 'start',
          order: 1,
          state: 'active',
          isCurrent: true,
        },
        {
          stepId: 'step-2',
          stepName: 'Execução',
          statusKey: 'completed',
          kind: 'work',
          order: 2,
          state: 'completed',
          isCurrent: false,
        },
      ],
    });

    const history = buildRequesterHistory(detail);

    expect(history[0].occurredAt).toBeNull();
    expect(history[1].occurredAt).toBeNull();
  });

  it('prefers step_completed over request_opened for the first completed step', () => {
    const detail = makeV2Detail({
      timeline: [
        {
          label: 'Solicitação aberta',
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
      ],
      submittedAt: new Date('2026-04-09T08:30:00.000Z'),
    });

    const history = buildRequesterHistory(detail);

    expect(history[0].occurredAt?.toISOString()).toBe('2026-04-12T14:45:00.000Z');
  });

  it('keeps active and pending v2 steps without dates even when fallback sources exist', () => {
    const detail = makeV2Detail({
      timeline: [
        {
          label: 'Solicitação aberta',
          timestamp: new Date('2026-04-11T10:00:00.000Z'),
          userName: 'Sistema',
          action: 'request_opened',
          details: null,
        },
      ],
      submittedAt: new Date('2026-04-09T08:30:00.000Z'),
    });

    const history = buildRequesterHistory(detail);

    expect(history[1].occurredAt).toBeNull();
    expect(history[2].occurredAt).toBeNull();
  });

  it('uses original array index as tiebreaker when multiple steps share the same order', () => {
    const detail = makeV2Detail({
      timeline: [
        {
          label: 'Solicitação aberta',
          timestamp: new Date('2026-04-11T10:00:00.000Z'),
          userName: 'Sistema',
          action: 'request_opened',
          details: null,
        },
      ],
      progressItems: [
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
          statusKey: 'completed',
          kind: 'work',
          order: 1,
          state: 'completed',
          isCurrent: false,
        },
      ],
    });

    const history = buildRequesterHistory(detail);

    expect(history[0].title).toBe('Abertura');
    expect(history[0].occurredAt?.toISOString()).toBe('2026-04-11T10:00:00.000Z');
    expect(history[1].occurredAt).toBeNull();
  });
});
