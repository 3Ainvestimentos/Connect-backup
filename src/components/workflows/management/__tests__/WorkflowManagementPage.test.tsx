import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useWorkflowManagement } from '@/hooks/use-workflow-management';
import { buildManagementRequestDetailFixture } from '@/lib/workflows/management/__tests__/request-detail-test-data';
import { WorkflowManagementPage } from '../WorkflowManagementPage';

const mockReplace = jest.fn();
const mockToast = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('@/hooks/use-workflow-management', () => ({
  useWorkflowManagement: jest.fn(),
}));
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));
jest.mock('@/contexts/CollaboratorsContext', () => ({
  useCollaborators: () => ({
    collaborators: [],
  }),
}));
jest.mock('lucide-react', () => ({
  Check: () => null,
  ChevronDown: () => null,
  ChevronUp: () => null,
  X: () => null,
}));
jest.mock('next/navigation', () => ({
  usePathname: () => '/gestao-de-chamados',
  useRouter: () => ({
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
}));

const mockUseWorkflowManagement = useWorkflowManagement as jest.MockedFunction<
  typeof useWorkflowManagement
>;

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

function buildBootstrap(canViewCurrentQueue = true) {
  return {
    actor: {
      actorUserId: 'SMO2',
      actorName: 'Owner',
    },
    capabilities: {
      canViewCurrentQueue,
      canViewAssignments: true,
      canViewCompleted: true,
    },
    ownership: {
      hasOwnedScopes: canViewCurrentQueue,
      workflowTypeIds: canViewCurrentQueue ? ['facilities'] : [],
      areaIds: ['ops'],
    },
    filterOptions: {
      workflows: [
        {
          workflowTypeId: 'facilities',
          workflowName: 'Facilities',
          areaId: 'ops',
        },
      ],
      areas: [
        {
          areaId: 'ops',
          label: 'Operacoes',
        },
      ],
    },
  };
}

function buildSummary(requestId: number) {
  return buildManagementRequestDetailFixture({
    summary: {
      requestId,
      docId: `doc-${requestId}`,
    },
  }).summary;
}

function buildHookResult(canViewCurrentQueue = true) {
  return {
    bootstrapQuery: {
      data: buildBootstrap(canViewCurrentQueue),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    },
    currentQuery: {
      data: {
        filter: 'all',
        items: [],
      },
      isLoading: false,
      error: null,
    },
    assignmentsQuery: {
      data: {
        assignedItems: [],
        pendingActionItems: [],
      },
      isLoading: false,
      error: null,
    },
    completedQuery: {
      data: {
        items: [],
        groups: [],
      },
      isLoading: false,
      error: null,
    },
    detailQuery: {
      data: undefined,
      isLoading: false,
      error: null,
    },
    refetchActiveTab: jest.fn(),
    refetchDetail: jest.fn(),
    assignMutation: {
      mutateAsync: jest.fn(),
      isPending: false,
    },
    advanceMutation: {
      mutateAsync: jest.fn(),
      isPending: false,
    },
    finalizeMutation: {
      mutateAsync: jest.fn(),
      isPending: false,
    },
    archiveMutation: {
      mutateAsync: jest.fn(),
      isPending: false,
    },
    requestActionMutation: {
      mutateAsync: jest.fn(),
      isPending: false,
    },
    respondActionMutation: {
      mutateAsync: jest.fn(),
      isPending: false,
    },
  };
}

describe('WorkflowManagementPage', () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockToast.mockReset();
    mockSearchParams = new URLSearchParams();
    mockUseWorkflowManagement.mockReturnValue(
      buildHookResult() as unknown as ReturnType<typeof useWorkflowManagement>,
    );
  });

  it('hides the current queue tab when the bootstrap denies ownership capability', () => {
    mockUseWorkflowManagement.mockReturnValue(
      buildHookResult(false) as unknown as ReturnType<typeof useWorkflowManagement>,
    );

    render(<WorkflowManagementPage />);

    const tabsList = screen.getByRole('tablist');

    expect(screen.queryByRole('tab', { name: 'Chamados atuais' })).toBeNull();
    expect(screen.getByRole('tab', { name: 'Atribuições e ações' })).toBeTruthy();
    expect(
      screen.queryByText(/A aba `Chamados atuais` exige ownership explícito\./),
    ).toBeNull();
    expect(tabsList.className).toContain('sm:grid-cols-2');
    expect(tabsList.className).not.toContain('lg:grid-cols-3');
  });

  it('renders the main tabs in a full-width shell and syncs the URL when switching tabs', async () => {
    const user = userEvent.setup();

    render(<WorkflowManagementPage />);

    const tabsList = screen.getByRole('tablist');
    expect(tabsList.className).toContain('w-full');
    expect(tabsList.className).toContain('grid');
    expect(screen.getByRole('heading', { name: 'Ações pendentes para mim' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Atribuídos a mim' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Abrir filtros' })).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: 'Concluídas' }));

    expect(mockReplace).toHaveBeenCalledWith('/gestao-de-chamados?tab=completed', {
      scroll: false,
    });
  });

  it('restores the UI from the URL contract and serializes toolbar filters back to the URL', async () => {
    const user = userEvent.setup();
    mockSearchParams = new URLSearchParams(
      'tab=completed&subtab=pending&requestId=801&requester=Alice',
    );

    render(<WorkflowManagementPage />);

    const completedTab = screen.getByRole('tab', { name: 'Concluídas' });
    expect(completedTab.getAttribute('data-state')).toBe('active');
    expect(screen.getByText('Chamado: #801')).toBeTruthy();
    expect(screen.getByText('Solicitante: Alice')).toBeTruthy();
    expect(screen.queryByText('Convívio controlado com superfícies legadas')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Abrir filtros' }));

    expect((screen.getByLabelText('Numero do chamado') as HTMLInputElement).value).toBe('801');
    expect((screen.getByLabelText('Solicitante') as HTMLInputElement).value).toBe('Alice');

    await user.clear(screen.getByLabelText('Solicitante'));
    await user.type(screen.getByLabelText('Solicitante'), 'Bob');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    expect(mockReplace).toHaveBeenLastCalledWith(
      '/gestao-de-chamados?tab=completed&subtab=pending&requestId=801&requester=Bob',
      { scroll: false },
    );
  });

  it('renders the official bootstrap skeleton while the surface initializes', () => {
    mockUseWorkflowManagement.mockReturnValue({
      ...buildHookResult(),
      bootstrapQuery: {
        data: undefined,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      },
    } as unknown as ReturnType<typeof useWorkflowManagement>);

    render(<WorkflowManagementPage />);

    expect(screen.getByText('Carregando superfície oficial')).toBeTruthy();
    expect(screen.getByTestId('management-panel-skeleton')).toBeTruthy();
  });

  it('retries the active tab locally without resetting the whole page', async () => {
    const user = userEvent.setup();
    const refetchActiveTab = jest.fn();

    mockUseWorkflowManagement.mockReturnValue({
      ...buildHookResult(),
      assignmentsQuery: {
        data: undefined,
        isLoading: false,
        error: new Error('Falha de rede'),
      },
      refetchActiveTab,
    } as unknown as ReturnType<typeof useWorkflowManagement>);

    render(<WorkflowManagementPage />);

    await user.click(screen.getAllByRole('button', { name: 'Tentar novamente' })[0]);

    expect(refetchActiveTab).toHaveBeenCalledTimes(1);
  });

  it('keeps the dialog open after advance', async () => {
    const user = userEvent.setup();
    const advanceMutation = { mutateAsync: jest.fn().mockResolvedValue({ requestId: 812 }), isPending: false };

    const detail = buildManagementRequestDetailFixture({
      permissions: {
        canAdvance: true,
      },
      action: {
        available: false,
      },
    });

    mockUseWorkflowManagement.mockImplementation((_, selectedRequestId) => ({
      ...buildHookResult(),
      assignmentsQuery: {
        data: {
          assignedItems: [buildSummary(812)],
          pendingActionItems: [],
        },
        isLoading: false,
        error: null,
      },
      detailQuery: {
        data: selectedRequestId === 812 ? detail : undefined,
        isLoading: false,
        error: null,
      },
      advanceMutation,
    }) as unknown as ReturnType<typeof useWorkflowManagement>);

    render(<WorkflowManagementPage />);

    await user.click(screen.getByRole('button', { name: 'Abrir' }));
    expect(screen.getByRole('heading', { name: 'Chamado #812' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Avancar etapa' }));
    await waitFor(() => expect(advanceMutation.mutateAsync).toHaveBeenCalledWith({ requestId: 812 }));
    expect(screen.getByRole('heading', { name: 'Chamado #812' })).toBeTruthy();
  });

  it('closes the dialog after finalize', async () => {
    const user = userEvent.setup();
    const finalizeMutation = { mutateAsync: jest.fn().mockResolvedValue({ requestId: 812 }), isPending: false };

    mockUseWorkflowManagement.mockImplementation((_, selectedRequestId) => ({
      ...buildHookResult(),
      assignmentsQuery: {
        data: {
          assignedItems: [buildSummary(812)],
          pendingActionItems: [],
        },
        isLoading: false,
        error: null,
      },
      detailQuery: {
        data:
          selectedRequestId === 812
            ? buildManagementRequestDetailFixture({
                permissions: {
                  canFinalize: true,
                },
                action: {
                  available: false,
                },
              })
            : undefined,
        isLoading: false,
        error: null,
      },
      finalizeMutation,
    }) as unknown as ReturnType<typeof useWorkflowManagement>);

    render(<WorkflowManagementPage />);

    await user.click(screen.getByRole('button', { name: 'Abrir' }));
    expect(screen.getByRole('heading', { name: 'Chamado #812' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Finalizar chamado' }));
    await waitFor(() => expect(finalizeMutation.mutateAsync).toHaveBeenCalledWith({ requestId: 812 }));
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Chamado #812' })).toBeNull());
  });

  it('closes the dialog after archive', async () => {
    const user = userEvent.setup();
    const archiveMutation = { mutateAsync: jest.fn().mockResolvedValue({ requestId: 812 }), isPending: false };

    mockUseWorkflowManagement.mockImplementation((_, selectedRequestId) => ({
      ...buildHookResult(),
      assignmentsQuery: {
        data: {
          assignedItems: [buildSummary(812)],
          pendingActionItems: [],
        },
        isLoading: false,
        error: null,
      },
      detailQuery: {
        data:
          selectedRequestId === 812
            ? buildManagementRequestDetailFixture({
                summary: {
                  statusCategory: 'finalized',
                },
                permissions: {
                  canArchive: true,
                },
                action: {
                  available: false,
                },
              })
            : undefined,
        isLoading: false,
        error: null,
      },
      archiveMutation,
    }) as unknown as ReturnType<typeof useWorkflowManagement>);

    render(<WorkflowManagementPage />);

    await user.click(screen.getByRole('button', { name: 'Abrir' }));
    expect(screen.getByRole('heading', { name: 'Chamado #812' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Arquivar' }));
    await waitFor(() => expect(archiveMutation.mutateAsync).toHaveBeenCalledWith({ requestId: 812 }));
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Chamado #812' })).toBeNull());
  });

  it('keeps the dialog open after requestAction and respondAction', async () => {
    const user = userEvent.setup();
    const requestActionMutation = { mutateAsync: jest.fn().mockResolvedValue({ requestId: 812 }), isPending: false };
    const respondActionMutation = { mutateAsync: jest.fn().mockResolvedValue({ requestId: 812 }), isPending: false };

    mockUseWorkflowManagement.mockImplementation((_, selectedRequestId) => ({
      ...buildHookResult(),
      assignmentsQuery: {
        data: {
          assignedItems: [buildSummary(812)],
          pendingActionItems: [],
        },
        isLoading: false,
        error: null,
      },
      detailQuery: {
        data:
          selectedRequestId === 812
            ? buildManagementRequestDetailFixture({
                permissions: {
                  canRequestAction: true,
                  canRespondAction: true,
                },
                action: {
                  canRequest: true,
                  canRespond: true,
                  state: 'pending',
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
              })
            : undefined,
        isLoading: false,
        error: null,
      },
      requestActionMutation,
      respondActionMutation,
    }) as unknown as ReturnType<typeof useWorkflowManagement>);

    render(<WorkflowManagementPage />);

    await user.click(screen.getByRole('button', { name: 'Abrir' }));
    await user.click(screen.getByRole('button', { name: 'Solicitar Aprovar etapa' }));

    await waitFor(() => expect(requestActionMutation.mutateAsync).toHaveBeenCalledWith({ requestId: 812 }));
    expect(screen.getByRole('heading', { name: 'Chamado #812' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Registrar resposta' }));
    await waitFor(() =>
      expect(respondActionMutation.mutateAsync).toHaveBeenCalledWith({
        requestId: 812,
        response: 'approved',
        comment: undefined,
        attachmentFile: undefined,
      }),
    );
    expect(screen.getByRole('heading', { name: 'Chamado #812' })).toBeTruthy();
  });
});
