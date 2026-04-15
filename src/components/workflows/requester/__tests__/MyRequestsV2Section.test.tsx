import { act, fireEvent, render, screen } from '@testing-library/react';
import { MyRequestsV2Section } from '../MyRequestsV2Section';
import { useRequesterUnifiedRequests } from '@/hooks/use-requester-unified-requests';
import type { RequesterUnifiedRequestListItem } from '@/lib/workflows/requester/unified-types';
import '@testing-library/jest-dom';

jest.mock('lucide-react', () => ({
  AlertCircle: () => null,
  Eye: () => null,
  FileClock: () => null,
  Inbox: () => null,
  Timer: () => null,
}));

jest.mock('@/hooks/use-requester-unified-requests', () => ({
  useRequesterUnifiedRequests: jest.fn(),
}));

const mockItems: RequesterUnifiedRequestListItem[] = [
  {
    origin: 'v2',
    detailKey: 'v2:1001',
    requestId: 1001,
    displayRequestId: '1001',
    workflowName: 'Manutencao Geral',
    statusLabel: 'Em andamento',
    statusVariant: 'default',
    expectedCompletionLabel: '-',
    expectedCompletionAt: null,
    submittedAt: null,
    lastUpdatedAt: null,
    raw: {
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
  },
];

describe('MyRequestsV2Section', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state from the unified hook', () => {
    (useRequesterUnifiedRequests as jest.Mock).mockReturnValue({
      items: [],
      status: 'loading',
    });

    render(<MyRequestsV2Section onSelectRequest={jest.fn()} />);

    expect(screen.getByText('Minhas Solicitacoes')).toBeInTheDocument();
    expect(screen.getByText(/Acompanhe o status das suas solicitacoes aqui/i)).toBeInTheDocument();
  });

  it('renders error state from the unified hook', () => {
    (useRequesterUnifiedRequests as jest.Mock).mockReturnValue({
      items: [],
      status: 'error',
    });

    render(<MyRequestsV2Section onSelectRequest={jest.fn()} />);

    expect(screen.getByText('Nao foi possivel carregar suas solicitacoes.')).toBeInTheDocument();
  });

  it('renders partial state warning while keeping available rows', () => {
    (useRequesterUnifiedRequests as jest.Mock).mockReturnValue({
      items: mockItems,
      status: 'partial',
    });

    render(<MyRequestsV2Section onSelectRequest={jest.fn()} />);

    expect(
      screen.getByText('Algumas solicitacoes podem estar desatualizadas. Exibindo dados disponiveis.')
    ).toBeInTheDocument();
    expect(screen.getByText('Manutencao Geral')).toBeInTheDocument();
  });

  it('renders empty state when there are no requests', () => {
    (useRequesterUnifiedRequests as jest.Mock).mockReturnValue({
      items: [],
      status: 'success',
    });

    render(<MyRequestsV2Section onSelectRequest={jest.fn()} />);

    expect(screen.getByText('Nenhuma solicitacao encontrada')).toBeInTheDocument();
    expect(
      screen.getByText('Voce ainda nao fez nenhuma solicitacao. Inicie uma nos cards acima.')
    ).toBeInTheDocument();
  });

  it('renders the unified table with the expected columns and data', () => {
    (useRequesterUnifiedRequests as jest.Mock).mockReturnValue({
      items: mockItems,
      status: 'success',
    });

    render(<MyRequestsV2Section onSelectRequest={jest.fn()} />);

    expect(screen.getByText('#')).toBeInTheDocument();
    expect(screen.getByText('Tipo')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Previsao de Conclusao')).toBeInTheDocument();
    expect(screen.getByText('Acoes')).toBeInTheDocument();
    expect(screen.getByText('1001')).toBeInTheDocument();
    expect(screen.getByText('Em andamento')).toBeInTheDocument();
  });

  it('calls onSelectRequest with the selected unified item', async () => {
    const handleSelectRequest = jest.fn();
    (useRequesterUnifiedRequests as jest.Mock).mockReturnValue({
      items: mockItems,
      status: 'success',
    });

    render(<MyRequestsV2Section onSelectRequest={handleSelectRequest} />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Ver detalhes da solicitacao 1001' })
      );
    });

    expect(handleSelectRequest).toHaveBeenCalledWith(mockItems[0]);
  });

  it('renders expected completion date when the unified item provides it', () => {
    (useRequesterUnifiedRequests as jest.Mock).mockReturnValue({
      items: [
        {
          ...mockItems[0],
          detailKey: 'v2:1006',
          requestId: 1006,
          displayRequestId: '1006',
          expectedCompletionAt: new Date(Date.UTC(2026, 3, 15, 12, 0, 0)),
          expectedCompletionLabel: '15/04/2026',
        },
      ],
      status: 'success',
    });

    render(<MyRequestsV2Section onSelectRequest={jest.fn()} />);

    expect(screen.getByText('15/04/2026')).toBeInTheDocument();
  });
});
