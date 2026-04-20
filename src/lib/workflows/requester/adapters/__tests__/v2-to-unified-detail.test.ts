import { v2ReadDetailToUnifiedDetail } from '../v2-to-unified-detail';
import type { WorkflowRequestDetailData } from '@/lib/workflows/read/types';

describe('v2ReadDetailToUnifiedDetail', () => {
  it('preserves timeline action and details for requester history enrichment', () => {
    const detail = v2ReadDetailToUnifiedDetail({
      summary: {
        docId: 'doc-1',
        requestId: 1001,
        workflowTypeId: 'wf-facilities-001',
        workflowVersion: 1,
        workflowName: 'Manutenção Geral',
        areaId: 'area-1',
        ownerEmail: 'owner@example.com',
        ownerUserId: 'owner-1',
        requesterUserId: 'user-1',
        requesterName: 'Test User',
        responsibleUserId: null,
        responsibleName: null,
        currentStepId: 'step-2',
        currentStepName: 'Execução',
        currentStatusKey: 'in_progress',
        statusCategory: 'in_progress',
        hasResponsible: false,
        hasPendingActions: false,
        pendingActionRecipientIds: [],
        pendingActionTypes: [],
        operationalParticipantIds: [],
        slaDays: 5,
        expectedCompletionAt: null,
        lastUpdatedAt: null,
        finalizedAt: null,
        closedAt: null,
        archivedAt: null,
        submittedAt: null,
        submittedMonthKey: '2026-04',
        closedMonthKey: 'unknown',
        isArchived: false,
      },
      permissions: {
        canAssign: false,
        canAdvance: false,
        canFinalize: false,
        canArchive: false,
        canRequestAction: false,
        canRespondAction: false,
      },
      formData: {
        fields: [],
        extraFields: [],
      },
      attachments: [],
      progress: {
        currentStepId: 'step-2',
        totalSteps: 2,
        completedSteps: 1,
        items: [],
      },
      action: {
        available: false,
        state: 'idle',
        batchId: null,
        type: null,
        label: null,
        commentRequired: false,
        attachmentRequired: false,
        commentPlaceholder: null,
        attachmentPlaceholder: null,
        canRequest: false,
        canRespond: false,
        requestedAt: null,
        completedAt: null,
        requestedByUserId: null,
        requestedByName: null,
        recipients: [],
      },
      timeline: [
        {
          action: 'step_completed',
          label: 'Etapa concluída',
          timestamp: {
            toDate: () => new Date('2026-04-12T15:00:00.000Z'),
          },
          userId: 'user-2',
          userName: 'Sistema',
          details: { stepId: 'step-1', foo: 'bar' },
        },
      ],
    } satisfies WorkflowRequestDetailData);

    expect(detail.timeline).toEqual([
      expect.objectContaining({
        action: 'step_completed',
        details: { stepId: 'step-1', foo: 'bar' },
        notes: '{\n  "stepId": "step-1",\n  "foo": "bar"\n}',
      }),
    ]);
  });

  it('preserves submitted field and attachment ordering metadata', () => {
    const detail = v2ReadDetailToUnifiedDetail({
      summary: {
        docId: 'doc-1',
        requestId: 1001,
        workflowTypeId: 'wf-facilities-001',
        workflowVersion: 1,
        workflowName: 'Manutenção Geral',
        areaId: 'area-1',
        ownerEmail: 'owner@example.com',
        ownerUserId: 'owner-1',
        requesterUserId: 'user-1',
        requesterName: 'Test User',
        responsibleUserId: null,
        responsibleName: null,
        currentStepId: 'step-2',
        currentStepName: 'Execução',
        currentStatusKey: 'in_progress',
        statusCategory: 'in_progress',
        hasResponsible: false,
        hasPendingActions: false,
        pendingActionRecipientIds: [],
        pendingActionTypes: [],
        operationalParticipantIds: [],
        slaDays: 5,
        expectedCompletionAt: null,
        lastUpdatedAt: null,
        finalizedAt: null,
        closedAt: null,
        archivedAt: null,
        submittedAt: null,
        submittedMonthKey: '2026-04',
        closedMonthKey: 'unknown',
        isArchived: false,
      },
      permissions: {
        canAssign: false,
        canAdvance: false,
        canFinalize: false,
        canArchive: false,
        canRequestAction: false,
        canRespondAction: false,
      },
      formData: {
        fields: [
          {
            fieldId: 'description',
            label: 'Descrição',
            type: 'text',
            value: 'Trocar lâmpada',
            order: 0,
          },
        ],
        extraFields: [],
      },
      attachments: [
        {
          fieldId: 'attachment',
          label: 'Foto',
          url: 'https://example.com/uploads/foto%20teste.png?alt=media',
          fileName: 'foto teste.png',
          order: 1,
        },
      ],
      progress: {
        currentStepId: 'step-2',
        totalSteps: 2,
        completedSteps: 1,
        items: [],
      },
      action: {
        available: false,
        state: 'idle',
        batchId: null,
        type: null,
        label: null,
        commentRequired: false,
        attachmentRequired: false,
        commentPlaceholder: null,
        attachmentPlaceholder: null,
        canRequest: false,
        canRespond: false,
        requestedAt: null,
        completedAt: null,
        requestedByUserId: null,
        requestedByName: null,
        recipients: [],
      },
      timeline: [],
    } satisfies WorkflowRequestDetailData);

    expect(detail.fields[0]).toEqual(expect.objectContaining({ order: 0 }));
    expect(detail.attachments[0]).toEqual(
      expect.objectContaining({ order: 1, fileName: 'foto teste.png' }),
    );
  });
});
