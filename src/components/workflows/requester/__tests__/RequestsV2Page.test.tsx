import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RequestsV2Page } from '../RequestsV2Page';
import { useRequesterCatalog, useOpenRequesterWorkflow, usePublishedWorkflow, useMyRequests, useRequestDetail } from '@/hooks/use-requester-workflows';
import type { RequesterCatalogArea } from '@/lib/workflows/requester/catalog-types';
import '@testing-library/jest-dom';

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
});
