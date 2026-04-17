import type { WorkflowManagementRequestDetailData } from '../types';

type DetailFixtureOverrides = Omit<
  Partial<WorkflowManagementRequestDetailData>,
  'summary' | 'permissions' | 'progress' | 'action'
> & {
  summary?: Partial<WorkflowManagementRequestDetailData['summary']>;
  permissions?: Partial<WorkflowManagementRequestDetailData['permissions']>;
  progress?: Partial<WorkflowManagementRequestDetailData['progress']>;
  action?: Partial<WorkflowManagementRequestDetailData['action']>;
};

export function buildManagementRequestDetailFixture(
  overrides: DetailFixtureOverrides = {},
): WorkflowManagementRequestDetailData {
  const base: WorkflowManagementRequestDetailData = {
    summary: {
      docId: 'doc-1',
      requestId: 812,
      workflowTypeId: 'facilities_suprimentos',
      workflowVersion: 3,
      workflowName: 'Solicitacao de Suprimentos',
      areaId: 'facilities',
      ownerEmail: 'owner@3ariva.com.br',
      ownerUserId: 'SMO2',
      requesterUserId: 'REQ1',
      requesterName: 'Requester',
      responsibleUserId: 'RESP1',
      responsibleName: 'Responsavel',
      currentStepId: 'execucao',
      currentStepName: 'Execucao',
      currentStatusKey: 'execucao',
      statusCategory: 'in_progress',
      hasResponsible: true,
      hasPendingActions: false,
      pendingActionRecipientIds: [],
      pendingActionTypes: [],
      operationalParticipantIds: ['SMO2', 'RESP1'],
      slaDays: 5,
      slaState: 'at_risk',
      expectedCompletionAt: new Date('2026-04-10T10:00:00Z'),
      lastUpdatedAt: new Date('2026-04-02T10:00:00Z'),
      finalizedAt: null,
      closedAt: null,
      archivedAt: null,
      submittedAt: new Date('2026-04-01T09:00:00Z'),
      submittedMonthKey: '2026-04',
      closedMonthKey: null,
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
          fieldId: 'nome_sobrenome',
          label: 'Nome e Sobrenome',
          type: 'text',
          value: 'Lucas Nogueira',
        },
      ],
      extraFields: [{ key: 'observacao_extra', value: 'Urgente' }],
    },
    attachments: [
      {
        fieldId: 'anexo_planilha',
        label: 'Anexo da planilha',
        url: 'https://example.com/planilha.pdf',
      },
    ],
    progress: {
      currentStepId: 'execucao',
      totalSteps: 4,
      completedSteps: 2,
      items: [
        {
          stepId: 'abertura',
          stepName: 'Abertura',
          statusKey: 'abertura',
          kind: 'start',
          order: 1,
          state: 'completed',
          isCurrent: false,
        },
        {
          stepId: 'execucao',
          stepName: 'Execucao',
          statusKey: 'execucao',
          kind: 'work',
          order: 3,
          state: 'active',
          isCurrent: true,
        },
      ],
    },
    action: {
      available: true,
      state: 'idle',
      batchId: null,
      type: 'approval',
      label: 'Aprovar etapa',
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
      configurationError: null,
    },
    timeline: [
      {
        action: 'request_opened',
        label: 'Solicitacao aberta',
        timestamp: new Date('2026-04-01T09:00:00Z'),
        userId: 'REQ1',
        userName: 'Requester',
        details: {},
      },
    ],
  };

  return {
    ...base,
    ...overrides,
    summary: {
      ...base.summary,
      ...overrides.summary,
    },
    permissions: {
      ...base.permissions,
      ...overrides.permissions,
    },
    progress: {
      ...base.progress,
      ...overrides.progress,
      items: overrides.progress?.items ?? base.progress.items,
    },
    action: {
      ...base.action,
      ...overrides.action,
      recipients: overrides.action?.recipients ?? base.action.recipients,
    },
    formData: overrides.formData ?? base.formData,
    attachments: overrides.attachments ?? base.attachments,
    timeline: overrides.timeline ?? base.timeline,
  };
}
