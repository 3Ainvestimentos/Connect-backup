import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RequestsV2Page } from '../RequestsV2Page';
import {
  useOpenRequesterWorkflow,
  usePublishedWorkflow,
  useRequestDetail,
  useRequesterCatalog,
} from '@/hooks/use-requester-workflows';
import { useRequesterUnifiedRequests } from '@/hooks/use-requester-unified-requests';
import { useWorkflowAreas } from '@/contexts/WorkflowAreasContext';
import type { RequesterCatalogArea } from '@/lib/workflows/requester/catalog-types';
import type { RequesterUnifiedRequestListItem } from '@/lib/workflows/requester/unified-types';
import type { WorkflowRequestDetailData } from '@/lib/workflows/read/types';
import '@testing-library/jest-dom';

jest.mock('lucide-react', () => ({
  AlertCircle: () => null,
  Building: () => null,
  Eye: () => null,
  FileClock: () => null,
  FolderOpen: () => null,
  Inbox: () => null,
  Loader2: () => null,
  Plus: () => null,
  Send: () => null,
  Timer: () => null,
  Wrench: () => null,
  X: () => null,
}));

jest.mock('@/hooks/use-requester-workflows', () => ({
  useOpenRequesterWorkflow: jest.fn(),
  usePublishedWorkflow: jest.fn(),
  useRequestDetail: jest.fn(),
  useRequesterCatalog: jest.fn(),
}));

jest.mock('@/hooks/use-requester-unified-requests', () => ({
  useRequesterUnifiedRequests: jest.fn(),
}));

jest.mock('@/contexts/WorkflowAreasContext', () => ({
  useWorkflowAreas: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: { uid: 'user-1', displayName: 'Test User', email: 'test@example.com' },
    currentUserCollab: { id: 'collab-1', id3a: '1', name: 'Test User', email: 'test@example.com' },
  })),
}));

const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(() => ({ toast: mockToast })),
}));

const mockCatalog: RequesterCatalogArea[] = [
  {
    areaId: 'area-1',
    areaName: 'Facilities',
    areaIcon: 'Building',
    workflows: [
      {
        workflowTypeId: 'wf-facilities-001',
        name: 'Manutencao Geral',
        description: 'Solicitacao de manutencao',
        icon: 'Wrench',
      },
    ],
  },
];

const mockMultiWorkflowCatalog: RequesterCatalogArea[] = [
  {
    areaId: 'area-2',
    areaName: 'Gente e Comunicacao',
    areaIcon: 'Building',
    workflows: [
      {
        workflowTypeId: 'wf-gente-001',
        name: 'Alteracao Cadastral',
        description: 'Solicitacao de alteracao cadastral nos bancos de dados da 3A RIVA.',
        icon: 'Wrench',
      },
      {
        workflowTypeId: 'wf-gente-002',
        name: 'Fale com a GENTE',
        description: 'Fale com a GENTE',
        icon: 'Plus',
      },
    ],
  },
];

const mockListItem: RequesterUnifiedRequestListItem = {
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
    workflowTypeId: 'wf-facilities-001',
    workflowVersion: 1,
    workflowName: 'Manutencao Geral',
    areaId: 'area-1',
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
};

const mockDetail: WorkflowRequestDetailData = {
  summary: {
    docId: 'doc-1',
    requestId: 1001,
    workflowTypeId: 'wf-facilities-001',
    workflowVersion: 1,
    workflowName: 'Manutencao Geral',
    areaId: 'area-1',
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
    canAssign: false,
    canAdvance: false,
    canFinalize: false,
    canArchive: false,
    canRequestAction: false,
    canRespondAction: false,
  },
  formData: { fields: [], extraFields: [] },
  attachments: [],
  progress: { currentStepId: 'step-1', totalSteps: 1, completedSteps: 0, items: [] },
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
  timeline: [],
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('RequestsV2Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useRequesterCatalog as jest.Mock).mockReturnValue({
      data: mockCatalog,
      isLoading: false,
      error: null,
    });

    (usePublishedWorkflow as jest.Mock).mockReturnValue({
      data: {
        workflowTypeId: 'wf-facilities-001',
        version: 1,
        fields: [],
      },
      isLoading: false,
      error: null,
    });

    (useOpenRequesterWorkflow as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({ requestId: 1001, docId: 'abc123' }),
      isPending: false,
    });

    (useRequesterUnifiedRequests as jest.Mock).mockReturnValue({
      items: [],
      status: 'success',
      isLoading: false,
      isError: false,
      error: null,
      legacyIdentityResolved: true,
    });

    (useRequestDetail as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      isError: false,
      stableData: undefined,
      hasStableData: false,
    });

    (useWorkflowAreas as jest.Mock).mockReturnValue({
      workflowAreas: [{ id: 'area-1', name: 'Facilities', icon: 'Building', storageFolderPath: 'facilities' }],
      loading: false,
    });
  });

  it('renders the canonical header and simplified area cards', () => {
    render(<RequestsV2Page />, { wrapper: createWrapper() });

    expect(screen.getByRole('heading', { name: 'Solicitações' })).toBeInTheDocument();
    expect(
      screen.getByText('Inicie processos e acesse as ferramentas da empresa.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Facilities' })).toBeInTheDocument();
    expect(screen.queryByText('1 tipo de solicitacao')).not.toBeInTheDocument();
    expect(screen.queryByText('Manutencao Geral')).not.toBeInTheDocument();
  });

  it('opens the submission modal when the area card is clicked', async () => {
    render(<RequestsV2Page />, { wrapper: createWrapper() });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Facilities' }));
    });

    expect(screen.getByText(/Enviar solicitacao/i)).toBeInTheDocument();
  });

  it('opens the workflow selection modal for areas with multiple workflows', async () => {
    (useRequesterCatalog as jest.Mock).mockReturnValue({
      data: mockMultiWorkflowCatalog,
      isLoading: false,
      error: null,
    });

    render(<RequestsV2Page />, { wrapper: createWrapper() });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Gente e Comunicacao' }));
    });

    expect(
      screen.getByRole('heading', { name: 'Gente e Comunicacao' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Selecione um dos processos abaixo para iniciar uma nova solicitacao.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Alteracao Cadastral' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fale com a GENTE' })).toBeInTheDocument();
  });

  it('supports keyboard activation on the area card', async () => {
    render(<RequestsV2Page />, { wrapper: createWrapper() });

    await act(async () => {
      fireEvent.keyDown(screen.getByRole('button', { name: 'Facilities' }), {
        key: 'Enter',
        code: 'Enter',
      });
    });

    expect(screen.getByText(/Enviar solicitacao/i)).toBeInTheDocument();
  });

  it('shows toast and resets flow on successful submission', async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue({ requestId: 1001, docId: 'abc123' });
    (useOpenRequesterWorkflow as jest.Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });

    render(<RequestsV2Page />, { wrapper: createWrapper() });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Facilities' }));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Enviar solicitacao'));
    });

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Solicitação aberta com sucesso!',
      description: 'Seu numero de solicitação e 1001.',
    });

    expect(screen.queryByText(/Enviar solicitacao/i)).not.toBeInTheDocument();
  });

  it('renders MyRequests section below the catalog shell', () => {
    render(<RequestsV2Page />, { wrapper: createWrapper() });

    expect(screen.getByText('Minhas Solicitacoes')).toBeInTheDocument();
  });

  it('opens the read-only detail dialog from the unified requests table', async () => {
    (useRequesterUnifiedRequests as jest.Mock).mockReturnValue({
      items: [mockListItem],
      status: 'success',
      isLoading: false,
      isError: false,
      error: null,
      legacyIdentityResolved: true,
    });

    (useRequestDetail as jest.Mock).mockReturnValue({
      data: mockDetail,
      isLoading: false,
      error: null,
      isError: false,
      stableData: mockDetail,
      hasStableData: true,
    });

    render(<RequestsV2Page />, { wrapper: createWrapper() });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes da solicitacao 1001' }));
    });

    await waitFor(() => {
      expect(screen.getByText(/Solicitação #1001/i)).toBeInTheDocument();
    });
  });

  it('resets selected item when the detail dialog is closed with Escape', async () => {
    (useRequesterUnifiedRequests as jest.Mock).mockReturnValue({
      items: [mockListItem],
      status: 'success',
      isLoading: false,
      isError: false,
      error: null,
      legacyIdentityResolved: true,
    });

    (useRequestDetail as jest.Mock).mockReturnValue({
      data: mockDetail,
      isLoading: false,
      error: null,
      isError: false,
      stableData: mockDetail,
      hasStableData: true,
    });

    render(<RequestsV2Page />, { wrapper: createWrapper() });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes da solicitacao 1001' }));
    });

    await waitFor(() => {
      expect(screen.getByText(/Solicitação #1001/i)).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape', keyCode: 27 });
    });

    await waitFor(() => {
      expect(screen.queryByText(/Solicitação #1001/i)).not.toBeInTheDocument();
    });
  });
});
