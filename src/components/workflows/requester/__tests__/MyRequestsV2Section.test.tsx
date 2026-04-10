import { render, screen, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MyRequestsV2Section } from '../MyRequestsV2Section';
import { useMyRequests, useRequestDetail, useOpenRequesterWorkflow } from '@/hooks/use-requester-workflows';
import type { WorkflowGroupedReadData } from '@/lib/workflows/read/types';
import '@testing-library/jest-dom';

jest.mock('@/hooks/use-requester-workflows', () => ({
  useMyRequests: jest.fn(),
  useRequestDetail: jest.fn(),
  useOpenRequesterWorkflow: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: { uid: 'user-1', displayName: 'Test User', email: 'test@example.com' },
    currentUserCollab: { id: 'collab-1', id3a: '1', name: 'Test User', email: 'test@example.com' },
  })),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

const mockItems: WorkflowGroupedReadData['items'] = [
  {
    docId: 'doc-1',
    requestId: 1001,
    workflowTypeId: 'wf-facilities',
    workflowVersion: 1,
    workflowName: 'Manutencao Geral',
    areaId: 'facilities',
    ownerEmail: 'owner@example.com',
    ownerUserId: 'owner-1',
    requesterUserId: 'user-1',
    requesterName: 'Test User',
    responsibleUserId: null,
    responsibleName: null,
    currentStepId: 'step-1',
    currentStepName: 'Em andamento',
    currentStatusKey: 'in_progress',
    statusCategory: 'in_progress',
    hasResponsible: false,
    hasPendingActions: false,
    pendingActionRecipientIds: [],
    pendingActionTypes: [],
    operationalParticipantIds: [],
    slaDays: 5,
    expectedCompletionAt: null,
    lastUpdatedAt: null as any,
    finalizedAt: null,
    closedAt: null,
    archivedAt: null,
    submittedAt: null as any,
    submittedMonthKey: '2026-04',
    closedMonthKey: 'unknown',
    isArchived: false,
  },
];

describe('MyRequestsV2Section', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useOpenRequesterWorkflow as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });
  });

  it('should render loading skeleton when loading', () => {
    (useMyRequests as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<MyRequestsV2Section onSelectRequest={jest.fn()} />, { wrapper: createWrapper() });

    expect(screen.getByText('Minhas Solicitacoes')).toBeInTheDocument();
    // Should have skeleton elements
    const skeletons = screen.getAllByRole('progressbar', { hidden: true });
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render error state when query fails', () => {
    (useMyRequests as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
    });

    render(<MyRequestsV2Section onSelectRequest={jest.fn()} />, { wrapper: createWrapper() });

    expect(screen.getByText('Minhas Solicitacoes')).toBeInTheDocument();
    expect(
      screen.getByText('Nao foi possivel carregar suas solicitacoes.')
    ).toBeInTheDocument();
  });

  it('should render empty state when no requests exist', () => {
    (useMyRequests as jest.Mock).mockReturnValue({
      data: { items: [], groups: [] },
      isLoading: false,
      error: null,
    });

    render(<MyRequestsV2Section onSelectRequest={jest.fn()} />, { wrapper: createWrapper() });

    expect(screen.getByText('Nenhuma solicitacao encontrada')).toBeInTheDocument();
    expect(
      screen.getByText('Voce ainda nao fez nenhuma solicitacao. Inicie uma nos cards acima.')
    ).toBeInTheDocument();
  });

  it('should render table with correct columns and data', () => {
    (useMyRequests as jest.Mock).mockReturnValue({
      data: { items: mockItems, groups: [] },
      isLoading: false,
      error: null,
    });

    render(<MyRequestsV2Section onSelectRequest={jest.fn()} />, { wrapper: createWrapper() });

    // Verify table headers
    expect(screen.getByText('#')).toBeInTheDocument();
    expect(screen.getByText('Tipo')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Previsao de Conclusao')).toBeInTheDocument();
    expect(screen.getByText('Acoes')).toBeInTheDocument();

    // Verify row data
    expect(screen.getByText('1001')).toBeInTheDocument();
    expect(screen.getByText('Manutencao Geral')).toBeInTheDocument();
  });

  it('should call onSelectRequest when eye button is clicked', async () => {
    const handleSelectRequest = jest.fn();
    (useMyRequests as jest.Mock).mockReturnValue({
      data: { items: mockItems, groups: [] },
      isLoading: false,
      error: null,
    });

    render(<MyRequestsV2Section onSelectRequest={handleSelectRequest} />, { wrapper: createWrapper() });

    // Find and click the eye button
    const eyeButton = screen.getByRole('button', { name: '' });
    await act(async () => {
      fireEvent.click(eyeButton);
    });

    expect(handleSelectRequest).toHaveBeenCalledWith(1001);
  });

  it('should render status badge with correct label for in_progress', () => {
    (useMyRequests as jest.Mock).mockReturnValue({
      data: { items: mockItems, groups: [] },
      isLoading: false,
      error: null,
    });

    render(<MyRequestsV2Section onSelectRequest={jest.fn()} />, { wrapper: createWrapper() });

    expect(screen.getByText('Em andamento')).toBeInTheDocument();
  });

  it('should render archived status correctly', () => {
    const archivedItem = {
      ...mockItems[0],
      requestId: 1002,
      statusCategory: 'archived' as const,
    };
    (useMyRequests as jest.Mock).mockReturnValue({
      data: { items: [archivedItem], groups: [] },
      isLoading: false,
      error: null,
    });

    render(<MyRequestsV2Section onSelectRequest={jest.fn()} />, { wrapper: createWrapper() });

    expect(screen.getByText('Arquivado')).toBeInTheDocument();
  });

  it('should render finalized status correctly', () => {
    const finalizedItem = {
      ...mockItems[0],
      requestId: 1003,
      statusCategory: 'finalized' as const,
    };
    (useMyRequests as jest.Mock).mockReturnValue({
      data: { items: [finalizedItem], groups: [] },
      isLoading: false,
      error: null,
    });

    render(<MyRequestsV2Section onSelectRequest={jest.fn()} />, { wrapper: createWrapper() });

    expect(screen.getByText('Concluido')).toBeInTheDocument();
  });
});
