import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RequestsV2Page } from '../RequestsV2Page';
import { useRequesterCatalog, useOpenRequesterWorkflow, usePublishedWorkflow, useMyRequests, useRequestDetail } from '@/hooks/use-requester-workflows';
import type { RequesterCatalogArea } from '@/lib/workflows/requester/catalog-types';
import type { WorkflowRequestDetailData } from '@/lib/workflows/read/types';
import '@testing-library/jest-dom';

jest.mock('lucide-react', () => ({
  FileClock: () => null,
  Inbox: () => null,
  Eye: () => null,
  Timer: () => null,
  Building: () => null,
  Wrench: () => null,
  Plus: () => null,
  Send: () => null,
  Loader2: () => null,
  AlertCircle: () => null,
  X: () => null,
}));

jest.mock('@/hooks/use-requester-workflows', () => ({
  useRequesterCatalog: jest.fn(),
  usePublishedWorkflow: jest.fn(),
  useOpenRequesterWorkflow: jest.fn(),
  useMyRequests: jest.fn(),
  useRequestDetail: jest.fn(),
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
        icon: 'wrench',
      },
    ],
  },
];

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

describe('RequestsV2Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRequesterCatalog as jest.Mock).mockReturnValue({
      data: mockCatalog,
      isLoading: false,
      error: null,
    });
    // Always mock usePublishedWorkflow since WorkflowSubmissionModal uses it
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
    // MyRequests default mock
    (useMyRequests as jest.Mock).mockReturnValue({
      data: { items: [], groups: [] },
      isLoading: false,
      error: null,
    });
    // RequestDetail default mock
    (useRequestDetail as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      isError: false,
      stableData: undefined,
      hasStableData: false,
    });
  });

  it('should display the catalog areas when loaded', () => {
    render(<RequestsV2Page />, { wrapper: createWrapper() });

    expect(screen.getByText('Solicitacoes')).toBeInTheDocument();
    expect(screen.getByText('Manutencao Geral')).toBeInTheDocument();
  });

  it('should call resetSubmissionFlow when submission modal is closed', async () => {
    render(<RequestsV2Page />, { wrapper: createWrapper() });

    // Open submission modal by clicking area with single workflow
    const workflowButton = screen.getByText('Manutencao Geral');
    await act(async () => {
      fireEvent.click(workflowButton);
    });

    // Modal should be open
    expect(screen.getByText(/Enviar solicitacao/i)).toBeInTheDocument();

    // Close via Cancel button
    const cancelButton = screen.getByText('Cancelar');
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    // Modal should be closed and selection cleared
    expect(screen.queryByText(/Enviar solicitacao/i)).not.toBeInTheDocument();
    // Area grid should be visible again
    expect(screen.getByText('Manutencao Geral')).toBeInTheDocument();
  });

  it('should show toast and reset flow on successful submission', async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue({ requestId: 1001, docId: 'abc123' });
    (useOpenRequesterWorkflow as jest.Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });

    render(<RequestsV2Page />, { wrapper: createWrapper() });

    // Open modal
    const workflowButton = screen.getByText('Manutencao Geral');
    await act(async () => {
      fireEvent.click(workflowButton);
    });

    // Submit form (no required fields, so it should succeed)
    const submitButton = screen.getByText('Enviar solicitacao');
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Verify mutation was called
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });

    // Verify toast was shown
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Solicitacao aberta com sucesso!',
      description: 'Seu numero de solicitacao e 1001.',
    });

    // Verify modal closed
    expect(screen.queryByText(/Enviar solicitacao/i)).not.toBeInTheDocument();
  });

  it('should render Minhas Solicitacoes section below the catalog', () => {
    render(<RequestsV2Page />, { wrapper: createWrapper() });

    expect(screen.getByText('Minhas Solicitacoes')).toBeInTheDocument();
  });

  it('should open detail dialog when eye button is clicked', async () => {
    const mockItems = [
      {
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
    ];

    (useMyRequests as jest.Mock).mockReturnValue({
      data: { items: mockItems, groups: [] },
      isLoading: false,
      error: null,
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

    // Find and click the eye button by accessible name
    const eyeButton = screen.getByRole('button', { name: 'Ver detalhes da solicitacao 1001' });
    await act(async () => {
      fireEvent.click(eyeButton);
    });

    // Dialog should be open with detail content
    await waitFor(() => {
      expect(screen.getByText(/Solicitacao #1001/i)).toBeInTheDocument();
    });
    // Use getAllByText since text appears in multiple places (catalog and dialog)
    expect(screen.getAllByText('Manutencao Geral').length).toBeGreaterThanOrEqual(1);
  });

  it('should reset selectedRequestId and close dialog when closed via Escape', async () => {
    const mockItems = [
      {
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
    ];

    (useMyRequests as jest.Mock).mockReturnValue({
      data: { items: mockItems, groups: [] },
      isLoading: false,
      error: null,
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

    // Open dialog
    const eyeButton = screen.getByRole('button', { name: 'Ver detalhes da solicitacao 1001' });
    await act(async () => {
      fireEvent.click(eyeButton);
    });

    // Verify dialog is open with correct content
    await waitFor(() => {
      expect(screen.getByText(/Solicitacao #1001/i)).toBeInTheDocument();
    });

    // Close dialog via Escape key (Radix Dialog DismissableLayer listens at document level)
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape', keyCode: 27 });
    });

    // Verify dialog closed and RequestsV2Page reset selectedRequestId + showDetailDialog
    await waitFor(() => {
      expect(screen.queryByText(/Solicitacao #1001/i)).not.toBeInTheDocument();
    });
  });
});
