import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequestDetailDialog } from '../RequestDetailDialog';

jest.mock('lucide-react', () => ({
  ChevronDown: () => null,
  ChevronUp: () => null,
  Check: () => null,
  X: () => null,
}));

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  Object.defineProperty(global, 'ResizeObserver', {
    configurable: true,
    writable: true,
    value: ResizeObserverMock,
  });
});

function buildDetail(overrides: Partial<Parameters<typeof RequestDetailDialog>[0]['detail']> = {}) {
  return {
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
      statusCategory: 'in_progress' as const,
      hasResponsible: true,
      hasPendingActions: false,
      pendingActionRecipientIds: [],
      pendingActionTypes: [],
      operationalParticipantIds: ['SMO2', 'RESP1'],
      slaDays: 5,
      slaState: 'at_risk' as const,
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
      canAssign: true,
      canAdvance: false,
      canFinalize: true,
      canArchive: false,
      canRequestAction: false,
      canRespondAction: false,
    },
    formData: {
      fields: [
        {
          fieldId: 'nome_sobrenome',
          label: 'Nome e Sobrenome',
          type: 'text' as const,
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
          kind: 'start' as const,
          order: 1,
          state: 'completed' as const,
          isCurrent: false,
        },
        {
          stepId: 'execucao',
          stepName: 'Execucao',
          statusKey: 'execucao',
          kind: 'work' as const,
          order: 3,
          state: 'active' as const,
          isCurrent: true,
        },
      ],
    },
    action: {
      available: true,
      state: 'idle' as const,
      batchId: null,
      type: 'approval' as const,
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
        action: 'request_opened' as const,
        label: 'Solicitacao aberta',
        timestamp: new Date('2026-04-01T09:00:00Z'),
        userId: 'REQ1',
        userName: 'Requester',
        details: {},
      },
    ],
    ...overrides,
  };
}

describe('RequestDetailDialog', () => {
  it('renders loading state while the detail query is pending', () => {
    render(
      <RequestDetailDialog
        open
        requestId={812}
        isLoading
        collaborators={[]}
        onOpenChange={() => {}}
        onAssign={async () => {}}
        onAdvance={async () => {}}
        onFinalize={async () => {}}
        onArchive={async () => {}}
        onRequestAction={async () => {}}
        onRespondAction={async () => {}}
      />,
    );

    expect(screen.getByText('Chamado #812')).toBeTruthy();
    expect(screen.getByText('Carregando detalhe oficial do chamado.')).toBeTruthy();
  });

  it('renders error fallback inside the official dialog', () => {
    const onRetry = jest.fn();

    render(
      <RequestDetailDialog
        open
        requestId={812}
        errorMessage="Falha de rede"
        collaborators={[]}
        onRetry={onRetry}
        onOpenChange={() => {}}
        onAssign={async () => {}}
        onAdvance={async () => {}}
        onFinalize={async () => {}}
        onArchive={async () => {}}
        onRequestAction={async () => {}}
        onRespondAction={async () => {}}
      />,
    );

    expect(screen.getByText('Falha ao carregar o detalhe')).toBeTruthy();
    expect(screen.getByText('Falha de rede')).toBeTruthy();
  });

  it('retries the detail query from the dialog fallback', async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();

    render(
      <RequestDetailDialog
        open
        requestId={812}
        errorMessage="Falha de rede"
        collaborators={[]}
        onRetry={onRetry}
        onOpenChange={() => {}}
        onAssign={async () => {}}
        onAdvance={async () => {}}
        onFinalize={async () => {}}
        onArchive={async () => {}}
        onRequestAction={async () => {}}
        onRespondAction={async () => {}}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders detail blocks and shows only the actions allowed by permissions', () => {
    render(
      <RequestDetailDialog
        open
        requestId={812}
        detail={buildDetail()}
        collaborators={[
          {
            id: 'col-1',
            id3a: 'RESP2',
            name: 'Novo Responsavel',
            email: 'resp2@3ariva.com.br',
            axis: 'Operacoes',
            area: 'Facilities',
            position: 'Analista',
            segment: 'Facilities',
            leader: 'Leader',
            city: 'Sao Paulo',
            permissions: {
              canManageWorkflows: false,
              canManageRequests: false,
              canManageVacation: false,
              canManageContent: false,
              canManageTripsBirthdays: false,
              canViewTasks: false,
              canViewBI: false,
              canViewRankings: false,
              canViewCRM: false,
              canViewStrategicPanel: false,
              canViewOpportunityMap: false,
              canViewMeetAnalyses: false,
              canViewDirectoria: false,
              canViewBILeaders: false,
            },
          },
        ]}
        onOpenChange={() => {}}
        onAssign={async () => {}}
        onAdvance={async () => {}}
        onFinalize={async () => {}}
        onArchive={async () => {}}
        onRequestAction={async () => {}}
        onRespondAction={async () => {}}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Resumo do chamado' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Administracao do chamado' })).toBeTruthy();
    expect(screen.getByText('Estado atual e proximo passo')).toBeTruthy();
    expect(screen.getByText('Dados enviados')).toBeTruthy();
    expect(screen.getByText('Anexos')).toBeTruthy();
    expect(screen.getByText('Timeline')).toBeTruthy();
    expect(screen.getByText('Progresso')).toBeTruthy();
    expect(screen.getByText('Lucas Nogueira')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Abrir anexo' }).getAttribute('href')).toBe(
      'https://example.com/planilha.pdf',
    );
    expect(screen.getByRole('button', { name: 'Reatribuir responsavel' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Finalizar chamado' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Finalizar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Arquivar' })).toBeNull();
  });

  it('renders request/respond action controls when the actor is eligible', () => {
    render(
      <RequestDetailDialog
        open
        requestId={812}
        detail={buildDetail({
          permissions: {
            canAssign: false,
            canAdvance: false,
            canFinalize: false,
            canArchive: false,
            canRequestAction: true,
            canRespondAction: true,
          },
          action: {
            ...buildDetail().action,
            state: 'pending',
            canRequest: true,
            canRespond: true,
            recipients: [
              {
                actionRequestId: 'act_req_1',
                recipientUserId: 'RESP1',
                status: 'pending',
                respondedAt: null,
                respondedByUserId: null,
                respondedByName: null,
              },
            ],
          },
        })}
        collaborators={[]}
        onOpenChange={() => {}}
        onAssign={async () => {}}
        onAdvance={async () => {}}
        onFinalize={async () => {}}
        onArchive={async () => {}}
        onRequestAction={async () => {}}
        onRespondAction={async () => {}}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Action da etapa' })).toBeTruthy();
    expect(screen.getByText('Aguardando sua resposta')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Solicitar Aprovar etapa' })).toBeTruthy();
    expect(screen.getByText('Responder action')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Aprovar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Rejeitar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Registrar resposta' })).toBeTruthy();
  });

  it('keeps the action card visible for a completed batch without response CTA', () => {
    render(
      <RequestDetailDialog
        open
        requestId={812}
        detail={buildDetail({
          permissions: {
            canAssign: false,
            canAdvance: false,
            canFinalize: true,
            canArchive: false,
            canRequestAction: false,
            canRespondAction: false,
          },
          action: {
            ...buildDetail().action,
            state: 'completed',
            batchId: 'act_batch_2',
            type: 'execution',
            label: 'Executar atividade',
            requestedAt: new Date('2026-04-02T09:00:00Z'),
            completedAt: new Date('2026-04-02T12:00:00Z'),
            recipients: [
              {
                actionRequestId: 'act_req_2',
                recipientUserId: 'RESP1',
                status: 'executed',
                respondedAt: new Date('2026-04-02T12:00:00Z'),
                respondedByUserId: 'RESP1',
                respondedByName: 'Responsavel',
                responseComment: 'Execucao concluida',
                responseAttachmentUrl: 'https://example.com/comprovante.pdf',
              },
            ],
          },
        })}
        collaborators={[]}
        onOpenChange={() => {}}
        onAssign={async () => {}}
        onAdvance={async () => {}}
        onFinalize={async () => {}}
        onArchive={async () => {}}
        onRequestAction={async () => {}}
        onRespondAction={async () => {}}
      />,
    );

    expect(screen.getByText('Batch concluido')).toBeTruthy();
    expect(screen.getByText('Execucao concluida')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Abrir anexo da resposta' })).toBeTruthy();
    expect(screen.queryByText('Responder action')).toBeNull();
    expect(screen.getByRole('button', { name: 'Finalizar chamado' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Finalizar' })).toBeNull();
  });

  it('renders the advance CTA and hides finalize when only canAdvance is true', async () => {
    const user = userEvent.setup();
    const onAdvance = jest.fn();

    render(
      <RequestDetailDialog
        open
        requestId={812}
        detail={buildDetail({
          permissions: {
            canAssign: false,
            canAdvance: true,
            canFinalize: false,
            canArchive: false,
            canRequestAction: false,
            canRespondAction: false,
          },
          action: {
            ...buildDetail().action,
            available: false,
            label: null,
            type: null,
          },
        })}
        collaborators={[]}
        onOpenChange={() => {}}
        onAssign={async () => {}}
        onAdvance={onAdvance}
        onFinalize={async () => {}}
        onArchive={async () => {}}
        onRequestAction={async () => {}}
        onRespondAction={async () => {}}
      />,
    );

    expect(screen.getByRole('button', { name: 'Avancar etapa' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Finalizar chamado' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Finalizar' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Avancar etapa' }));

    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it('keeps the footer close-only even when a primary CTA exists in the body', () => {
    render(
      <RequestDetailDialog
        open
        requestId={812}
        detail={buildDetail({
          permissions: {
            canAssign: false,
            canAdvance: true,
            canFinalize: false,
            canArchive: false,
            canRequestAction: false,
            canRespondAction: false,
          },
          action: {
            ...buildDetail().action,
            available: false,
            label: null,
            type: null,
          },
        })}
        collaborators={[]}
        onOpenChange={() => {}}
        onAssign={async () => {}}
        onAdvance={async () => {}}
        onFinalize={async () => {}}
        onArchive={async () => {}}
        onRequestAction={async () => {}}
        onRespondAction={async () => {}}
      />,
    );

    const allButtons = screen.getAllByRole('button').map((button) => button.textContent);

    expect(allButtons.filter((label) => label === 'Fechar')).toHaveLength(1);
    expect(allButtons.filter((label) => label === 'Avancar etapa')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Arquivar' })).toBeNull();
  });

  it('does not render the action zone when the payload exposes no action and no configuration error', () => {
    render(
      <RequestDetailDialog
        open
        requestId={812}
        detail={buildDetail({
          permissions: {
            canAssign: false,
            canAdvance: false,
            canFinalize: false,
            canArchive: false,
            canRequestAction: false,
            canRespondAction: false,
          },
          action: {
            ...buildDetail().action,
            available: false,
            configurationError: null,
            label: null,
            type: null,
          },
        })}
        collaborators={[]}
        onOpenChange={() => {}}
        onAssign={async () => {}}
        onAdvance={async () => {}}
        onFinalize={async () => {}}
        onArchive={async () => {}}
        onRequestAction={async () => {}}
        onRespondAction={async () => {}}
      />,
    );

    expect(screen.queryByRole('heading', { name: 'Action da etapa' })).toBeNull();
  });
});
