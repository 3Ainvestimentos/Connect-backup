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
    expect(screen.getByRole('heading', { name: 'Acao atual' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Administracao do chamado' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Historico por etapa' })).toBeTruthy();
    expect(screen.getByText('Estado atual e proximo passo')).toBeTruthy();
    expect(screen.getByText('Dados enviados')).toBeTruthy();
    expect(screen.getByText('Anexos da abertura')).toBeTruthy();
    expect(screen.getByText('Lucas Nogueira')).toBeTruthy();
    expect(screen.getByText('Facilities')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Ver anexo' }).getAttribute('href')).toBe(
      'https://example.com/planilha.pdf',
    );
    expect(screen.getByRole('link', { name: 'Baixar anexo' }).getAttribute('href')).toBe(
      'https://example.com/planilha.pdf',
    );
    expect(screen.getByRole('button', { name: 'Reatribuir responsavel' })).toBeTruthy();
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

    const advancingButton = screen.getByRole('button', { name: 'Avancando...' });
    expect(advancingButton).toBeDisabled();
    expect(advancingButton).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText(/action atual ja foi concluida/i)).toBeTruthy();
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

    expect(screen.getByText('Chamado concluido')).toBeTruthy();
    expect(screen.getByText(/restam apenas acoes administrativas autorizadas/i)).toBeTruthy();
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

    expect(screen.getByText('Chamado concluido')).toBeTruthy();
    expect(screen.getByText(/permanece disponivel apenas para consulta/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Arquivar' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Administracao do chamado' })).toBeNull();
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
    expect(screen.queryByRole('button', { name: 'Avancar etapa' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Finalizar chamado' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Arquivar' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Administracao do chamado' })).toBeNull();
  });
});
