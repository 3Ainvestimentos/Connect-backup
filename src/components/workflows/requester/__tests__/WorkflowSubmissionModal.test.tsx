import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WorkflowSubmissionModal } from '../WorkflowSubmissionModal';
import { useAuth } from '@/contexts/AuthContext';
import { usePublishedWorkflow, useOpenRequesterWorkflow } from '@/hooks/use-requester-workflows';
import type { RequesterCatalogWorkflow } from '@/lib/workflows/requester/catalog-types';
import type { WorkflowPublishedMetadata } from '@/lib/workflows/catalog/types';
import '@testing-library/jest-dom';

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/use-requester-workflows', () => ({
  usePublishedWorkflow: jest.fn(),
  useOpenRequesterWorkflow: jest.fn(),
}));

jest.mock('@/lib/workflows/upload/client', () => ({
  uploadWorkflowFile: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUsePublishedWorkflow = usePublishedWorkflow as jest.MockedFunction<typeof usePublishedWorkflow>;
const mockUseOpenRequesterWorkflow = useOpenRequesterWorkflow as jest.MockedFunction<typeof useOpenRequesterWorkflow>;

const mockWorkflow: RequesterCatalogWorkflow = {
  workflowTypeId: 'wf-test-001',
  name: 'Test Workflow',
  description: 'Test workflow description',
  icon: 'file-text',
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

describe('WorkflowSubmissionModal', () => {
  const mockOnSuccess = jest.fn();
  const mockOnOpenChange = jest.fn();
  const mockMutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: {
        uid: 'firebase-uid-1',
        displayName: 'Google Display Name',
        email: 'user@example.com',
      },
      currentUserCollab: {
        id: 'collab-1',
        id3a: '1',
        name: 'Canonical Collaborator Name',
        email: 'user@example.com',
      },
    } as any);

    mockUsePublishedWorkflow.mockReturnValue({
      data: {
        workflowTypeId: 'wf-test-001',
        version: 1,
        fields: [
          {
            id: 'field-desc',
            type: 'textarea',
            label: 'Descricao',
            required: true,
            order: 1,
          },
        ],
      } as WorkflowPublishedMetadata,
      isLoading: false,
      error: null,
    });

    mockMutateAsync.mockResolvedValue({ requestId: 1001, docId: 'abc123' });
    mockUseOpenRequesterWorkflow.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      data: undefined,
      error: null,
      variables: undefined,
      isError: false,
      isPaused: false,
      isSuccess: false,
      status: 'idle',
      reset: jest.fn(),
      mutate: jest.fn(),
      context: undefined,
      failureCount: 0,
      failureReason: null,
    } as any);
  });

  it('should use currentUserCollab.name for requesterName in payload', async () => {
    render(
      <WorkflowSubmissionModal
        open={true}
        onOpenChange={mockOnOpenChange}
        workflow={mockWorkflow}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    // Fill required field
    const textarea = screen.getByLabelText(/Descricao/i);
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Test description' } });
    });

    // Submit
    const submitButton = screen.getByText('Enviar solicitacao');
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          workflowTypeId: 'wf-test-001',
          requesterName: 'Canonical Collaborator Name',
          formData: expect.any(Object),
        })
      );
    });

    // Verify onSuccess was called
    expect(mockOnSuccess).toHaveBeenCalledWith(1001);
  });

  it('should NOT use user.displayName for requesterName', async () => {
    render(
      <WorkflowSubmissionModal
        open={true}
        onOpenChange={mockOnOpenChange}
        workflow={mockWorkflow}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    // Fill required field
    const textarea = screen.getByLabelText(/Descricao/i);
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Test description' } });
    });

    // Submit
    const submitButton = screen.getByText('Enviar solicitacao');
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          requesterName: 'Canonical Collaborator Name',
        })
      );
    });

    // Verify it was NOT called with Google display name
    const calls = mockMutateAsync.mock.calls;
    const requesterNames = calls.map((call: any[]) => call[0].requesterName);
    expect(requesterNames).not.toContain('Google Display Name');
  });

  it('should send empty string when currentUserCollab.name is absent', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        uid: 'firebase-uid-1',
        displayName: 'Google Display Name',
        email: 'user@example.com',
      },
      currentUserCollab: null,
    } as any);

    render(
      <WorkflowSubmissionModal
        open={true}
        onOpenChange={mockOnOpenChange}
        workflow={mockWorkflow}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    // Fill required field
    const textarea = screen.getByLabelText(/Descricao/i);
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Test description' } });
    });

    // Submit
    const submitButton = screen.getByText('Enviar solicitacao');
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          requesterName: '',
        })
      );
    });
  });

  it('should call onSuccess with requestId after successful submission', async () => {
    render(
      <WorkflowSubmissionModal
        open={true}
        onOpenChange={mockOnOpenChange}
        workflow={mockWorkflow}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    // Fill required field
    const textarea = screen.getByLabelText(/Descricao/i);
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Test description' } });
    });

    // Submit
    const submitButton = screen.getByText('Enviar solicitacao');
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(1001);
    });
  });
});
