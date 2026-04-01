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
      canFinalize: true,
      canArchive: false,
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
        onFinalize={async () => {}}
        onArchive={async () => {}}
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
        onFinalize={async () => {}}
        onArchive={async () => {}}
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
        onFinalize={async () => {}}
        onArchive={async () => {}}
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
        onFinalize={async () => {}}
        onArchive={async () => {}}
      />,
    );

    expect(screen.getByText('Dados enviados')).toBeTruthy();
    expect(screen.getByText('Anexos')).toBeTruthy();
    expect(screen.getByText('Timeline')).toBeTruthy();
    expect(screen.getByText('Progresso')).toBeTruthy();
    expect(screen.getByText('Lucas Nogueira')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Abrir anexo' }).getAttribute('href')).toBe(
      'https://example.com/planilha.pdf',
    );
    expect(screen.getByRole('button', { name: 'Reatribuir responsavel' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Finalizar' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Arquivar' })).toBeNull();
  });
});
