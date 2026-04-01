import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useWorkflowManagement } from '@/hooks/use-workflow-management';
import { WorkflowManagementPage } from '../WorkflowManagementPage';

const mockReplace = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('@/hooks/use-workflow-management', () => ({
  useWorkflowManagement: jest.fn(),
}));
jest.mock('lucide-react', () => ({
  Check: () => null,
  ChevronDown: () => null,
  ChevronUp: () => null,
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

function buildHookResult(canViewCurrentQueue = true) {
  return {
    bootstrapQuery: {
      data: buildBootstrap(canViewCurrentQueue),
      isLoading: false,
      error: null,
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
  };
}

describe('WorkflowManagementPage', () => {
  beforeEach(() => {
    mockReplace.mockReset();
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

    expect(screen.queryByRole('tab', { name: 'Chamados atuais' })).toBeNull();
    expect(screen.getByRole('tab', { name: 'Atribuicoes e acoes' })).toBeTruthy();
    expect(
      screen.getByText(
        'A aba `Chamados atuais` exige ownership explicito. Seu perfil continua com acesso operacional a `Atribuicoes e acoes` e `Concluidas`.',
      ),
    ).toBeTruthy();
  });

  it('renders assignments subtabs and syncs the URL when switching the main tab', async () => {
    const user = userEvent.setup();

    render(<WorkflowManagementPage />);

    expect(screen.getByRole('tab', { name: 'Atribuidos a mim' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Acoes pendentes para mim' })).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: 'Concluidas' }));

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

    const completedTab = screen.getByRole('tab', { name: 'Concluidas' });
    expect(completedTab.getAttribute('data-state')).toBe('active');
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
});
