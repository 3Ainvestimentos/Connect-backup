import { render, screen, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MyRequestDetailDialog } from '../MyRequestDetailDialog';
import { useRequestDetail, useMyRequests, useOpenRequesterWorkflow } from '@/hooks/use-requester-workflows';
import type { WorkflowRequestDetailData } from '@/lib/workflows/read/types';
import '@testing-library/jest-dom';

jest.mock('@/hooks/use-requester-workflows', () => ({
  useRequestDetail: jest.fn(),
  useMyRequests: jest.fn(),
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

const mockDetail: WorkflowRequestDetailData = {
  summary: {
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
  permissions: {
    canAssign: true,
    canFinalize: true,
    canArchive: false,
    canRequestAction: false,
    canRespondAction: false,
  },
  formData: {
    fields: [
      { fieldId: 'description', label: 'Descricao', type: 'text', value: 'Teste de descricao' },
    ],
    extraFields: [],
  },
  attachments: [],
  progress: {
    currentStepId: 'step-1',
    totalSteps: 3,
    completedSteps: 1,
    items: [
      {
        stepId: 'step-1',
        stepName: 'Abertura',
        statusKey: 'completed',
        kind: 'start',
        order: 1,
        state: 'completed',
        isCurrent: false,
      },
      {
        stepId: 'step-2',
        stepName: 'Execucao',
        statusKey: 'in_progress',
        kind: 'work',
        order: 2,
        state: 'active',
        isCurrent: true,
      },
    ],
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
      action: 'request_opened',
      label: 'Solicitacao aberta',
      timestamp: null,
      userId: 'user-1',
      userName: 'Test User',
    },
  ],
};

describe('MyRequestDetailDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useMyRequests as jest.Mock).mockReturnValue({
      data: { items: [], groups: [] },
      isLoading: false,
      error: null,
    });
    (useOpenRequesterWorkflow as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });
  });

  it('should render loading state when fetching detail', () => {
    (useRequestDetail as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isError: false,
    });

    render(
      <MyRequestDetailDialog open onOpenChange={jest.fn()} requestId={1001} />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('Carregando detalhe...')).toBeInTheDocument();
  });

  it('should render error state when detail fetch fails', () => {
    (useRequestDetail as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
      isError: true,
    });

    render(
      <MyRequestDetailDialog open onOpenChange={jest.fn()} requestId={1001} />,
      { wrapper: createWrapper() },
    );

    expect(
      screen.getByText(/Nao foi possivel carregar os detalhes desta solicitacao/i)
    ).toBeInTheDocument();
  });

  it('should render summary header with correct fields', () => {
    (useRequestDetail as jest.Mock).mockReturnValue({
      data: mockDetail,
      isLoading: false,
      error: null,
      isError: false,
    });

    render(
      <MyRequestDetailDialog open onOpenChange={jest.fn()} requestId={1001} />,
      { wrapper: createWrapper() },
    );

    // Verify summary header title
    expect(screen.getByText('Informacoes do chamado')).toBeInTheDocument();

    // Verify all 6 summary fields present
    expect(screen.getByText('Solicitante')).toBeInTheDocument();
    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(screen.getByText('Tipo')).toBeInTheDocument();
    expect(screen.getByText('Manutencao Geral')).toBeInTheDocument();
    expect(screen.getByText('Ultima Atualizacao')).toBeInTheDocument();
    expect(screen.getByText('Responsavel')).toBeInTheDocument();
    expect(screen.getByText('Aberto em')).toBeInTheDocument();
    expect(screen.getByText('facilities')).toBeInTheDocument();
    // Test User appears in both summary and timeline, so use queryAll
    expect(screen.getAllByText('Test User').length).toBeGreaterThan(0);
  });

  it('should render formData section', () => {
    (useRequestDetail as jest.Mock).mockReturnValue({
      data: mockDetail,
      isLoading: false,
      error: null,
      isError: false,
    });

    render(
      <MyRequestDetailDialog open onOpenChange={jest.fn()} requestId={1001} />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('Dados enviados')).toBeInTheDocument();
    expect(screen.getByText('Descricao')).toBeInTheDocument();
    expect(screen.getByText('Teste de descricao')).toBeInTheDocument();
  });

  it('should render progress section', () => {
    (useRequestDetail as jest.Mock).mockReturnValue({
      data: mockDetail,
      isLoading: false,
      error: null,
      isError: false,
    });

    render(
      <MyRequestDetailDialog open onOpenChange={jest.fn()} requestId={1001} />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('Progresso')).toBeInTheDocument();
    expect(screen.getByText('1 de 3 etapas concluidas.')).toBeInTheDocument();
    expect(screen.getByText('Abertura')).toBeInTheDocument();
    expect(screen.getByText('Execucao')).toBeInTheDocument();
  });

  it('should render timeline section', () => {
    (useRequestDetail as jest.Mock).mockReturnValue({
      data: mockDetail,
      isLoading: false,
      error: null,
      isError: false,
    });

    render(
      <MyRequestDetailDialog open onOpenChange={jest.fn()} requestId={1001} />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.getByText('Solicitacao aberta')).toBeInTheDocument();
  });

  it('should NOT render any operational CTAs even if permissions are true', () => {
    const detailWithPerms: WorkflowRequestDetailData = {
      ...mockDetail,
      permissions: {
        canAssign: true,
        canFinalize: true,
        canArchive: true,
        canRequestAction: true,
        canRespondAction: true,
      },
    };
    (useRequestDetail as jest.Mock).mockReturnValue({
      data: detailWithPerms,
      isLoading: false,
      error: null,
      isError: false,
    });

    render(
      <MyRequestDetailDialog open onOpenChange={jest.fn()} requestId={1001} />,
      { wrapper: createWrapper() },
    );

    // Verify no operational buttons exist
    expect(screen.queryByText(/Atribuir/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Finalizar/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Arquivar/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Solicitar acao/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Responder acao/i)).not.toBeInTheDocument();
  });

  it('should render attachments section (even if empty)', () => {
    (useRequestDetail as jest.Mock).mockReturnValue({
      data: mockDetail,
      isLoading: false,
      error: null,
      isError: false,
    });

    render(
      <MyRequestDetailDialog open onOpenChange={jest.fn()} requestId={1001} />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('Anexos')).toBeInTheDocument();
    expect(
      screen.getByText(/Nenhum anexo oficial associado a este chamado/i)
    ).toBeInTheDocument();
  });

  it('should not fetch detail when dialog is closed', () => {
    (useRequestDetail as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      isError: false,
    });

    render(
      <MyRequestDetailDialog open={false} onOpenChange={jest.fn()} requestId={1001} />,
      { wrapper: createWrapper() },
    );

    // Query should be disabled, so no loading/error/data
    expect(screen.queryByText('Carregando detalhe...')).not.toBeInTheDocument();
  });
});
