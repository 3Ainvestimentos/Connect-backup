import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { buildManagementRequestDetailFixture } from '@/lib/workflows/management/__tests__/request-detail-test-data';
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

const collaborator = {
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
};

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
        detail={buildManagementRequestDetailFixture({
          permissions: {
            canAssign: true,
            canFinalize: true,
          },
        })}
        collaborators={[collaborator]}
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
    expect(screen.getByRole('heading', { name: 'Ação atual' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Administração do chamado' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Histórico do chamado' })).toBeTruthy();
    expect(screen.getByText('Resumo operacional')).toBeTruthy();
    expect(screen.getByText('Dados enviados')).toBeTruthy();
    expect(screen.queryByText('Anexos da abertura')).toBeNull();
    expect(screen.queryByText('Lucas Nogueira')).toBeNull();
    expect(screen.queryByText('Anexo da planilha')).toBeNull();
    expect(screen.getByRole('button', { name: 'Reatribuir responsável' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Finalizar chamado' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Arquivar' })).toBeNull();
  });

  it('renders request/respond action controls when the actor is eligible', () => {
    render(
      <RequestDetailDialog
        open
        requestId={812}
        detail={buildManagementRequestDetailFixture({
          permissions: {
            canRequestAction: true,
            canRespondAction: true,
          },
          action: {
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
    expect(screen.getByRole('button', { name: 'Solicitar Aprovar etapa' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Registrar resposta' })).toBeTruthy();
  });

  it('shows advance busy label and keeps footer free of operational CTAs', () => {
    render(
      <RequestDetailDialog
        open
        requestId={812}
        detail={buildManagementRequestDetailFixture({
          permissions: {
            canAdvance: true,
          },
          action: {
            state: 'completed',
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
        isAdvancing
      />,
    );

    const advancingButton = screen.getByRole('button', { name: 'Avançando...' });
    expect(advancingButton).toBeDisabled();
    expect(advancingButton).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText(/já foi concluída/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Fechar' })).toBeTruthy();
    expect(screen.queryByText('Finalizar')).toBeNull();
  });

  it('shows finalized read-only copy and only keeps archive in the administrative panel', () => {
    render(
      <RequestDetailDialog
        open
        requestId={812}
        detail={buildManagementRequestDetailFixture({
          summary: {
            statusCategory: 'finalized',
            finalizedAt: new Date('2026-04-12T10:00:00Z'),
          },
          permissions: {
            canArchive: true,
          },
          action: {
            available: false,
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

    expect(screen.getByText('Chamado concluído')).toBeTruthy();
    expect(screen.getByText(/restam apenas ações administrativas autorizadas/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Arquivar' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Action da etapa' })).toBeNull();
  });

  it('shows finalized read-only copy without exposing archive when canArchive is false', () => {
    render(
      <RequestDetailDialog
        open
        requestId={812}
        detail={buildManagementRequestDetailFixture({
          summary: {
            statusCategory: 'finalized',
            finalizedAt: new Date('2026-04-12T10:00:00Z'),
          },
          permissions: {
            canArchive: false,
          },
          action: {
            available: false,
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

    expect(screen.getByText('Chamado concluído')).toBeTruthy();
    expect(screen.getByText(/permanece disponível apenas para consulta/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Arquivar' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Administração do chamado' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Action da etapa' })).toBeNull();
  });

  it('shows assigning busy state in the administrative panel', () => {
    render(
      <RequestDetailDialog
        open
        requestId={812}
        detail={buildManagementRequestDetailFixture({
          permissions: {
            canAssign: true,
          },
          action: {
            available: false,
          },
        })}
        collaborators={[collaborator]}
        onOpenChange={() => {}}
        onAssign={async () => {}}
        onAdvance={async () => {}}
        onFinalize={async () => {}}
        onArchive={async () => {}}
        onRequestAction={async () => {}}
        onRespondAction={async () => {}}
        isAssigning
      />,
    );

    const assigningButton = screen.getByRole('button', { name: 'Salvando...' });
    expect(assigningButton).toBeDisabled();
    expect(assigningButton).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows archiving busy state in the administrative panel', () => {
    render(
      <RequestDetailDialog
        open
        requestId={812}
        detail={buildManagementRequestDetailFixture({
          summary: {
            statusCategory: 'finalized',
            finalizedAt: new Date('2026-04-12T10:00:00Z'),
          },
          permissions: {
            canArchive: true,
          },
          action: {
            available: false,
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
        isArchiving
      />,
    );

    const archivingButton = screen.getByRole('button', { name: 'Arquivando...' });
    expect(archivingButton).toBeDisabled();
    expect(archivingButton).toHaveAttribute('aria-disabled', 'true');
  });

  it('keeps archived requests strictly read-only with no operational CTA', () => {
    render(
      <RequestDetailDialog
        open
        requestId={812}
        detail={buildManagementRequestDetailFixture({
          summary: {
            statusCategory: 'archived',
            isArchived: true,
            archivedAt: new Date('2026-04-13T10:00:00Z'),
          },
          action: {
            available: false,
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

    expect(screen.getByText('Chamado arquivado')).toBeTruthy();
    expect(screen.getByText(/apenas para consulta/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Avançar etapa' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Finalizar chamado' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Arquivar' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Administração do chamado' })).toBeNull();
  });

  it('keeps history and submitted data collapsed until the operator expands them', async () => {
    const user = userEvent.setup();

    render(
      <RequestDetailDialog
        open
        requestId={812}
        detail={buildManagementRequestDetailFixture()}
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

    expect(screen.queryByText('Etapa iniciada')).toBeNull();
    expect(screen.queryByText('Nome e Sobrenome')).toBeNull();

    const expandButtons = screen.getAllByRole('button', { name: 'Expandir' });
    await user.click(expandButtons[0]);
    await user.click(expandButtons[1]);

    expect(screen.queryByText('Etapa iniciada')).toBeNull();
    await user.click(screen.getByRole('button', { name: /Etapa 3: Execucao/i }));
    expect(screen.getByText('Etapa iniciada')).toBeTruthy();
    expect(screen.getByText('Nome e Sobrenome')).toBeTruthy();
  });

  it('shows a third-party pending action summary without exposing a CTA', () => {
    render(
      <RequestDetailDialog
        open
        requestId={812}
        detail={buildManagementRequestDetailFixture({
          summary: {
            hasPendingActions: true,
            pendingActionRecipientIds: ['RESP2'],
          },
          permissions: {
            canRespondAction: false,
          },
          action: {
            state: 'pending',
            canRespond: false,
            recipients: [
              {
                actionRequestId: 'act_req_1',
                recipientUserId: 'RESP2',
                status: 'pending',
                respondedAt: null,
                respondedByUserId: null,
                respondedByName: null,
              },
            ],
          },
        })}
        collaborators={[collaborator]}
        onOpenChange={() => {}}
        onAssign={async () => {}}
        onAdvance={async () => {}}
        onFinalize={async () => {}}
        onArchive={async () => {}}
        onRequestAction={async () => {}}
        onRespondAction={async () => {}}
      />,
    );

    expect(screen.getByText('Action pendente com terceiros')).toBeTruthy();
    expect(screen.getByText('Pendente com')).toBeTruthy();
    expect(screen.getAllByText('Novo Responsavel').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Registrar resposta' })).toBeNull();
  });
});
