import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useOpenRequesterWorkflow } from '../use-requester-workflows';
import { openRequesterWorkflow } from '@/lib/workflows/requester/api-client';

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/workflows/requester/api-client', () => ({
  openRequesterWorkflow: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockOpenRequesterWorkflow = openRequesterWorkflow as jest.MockedFunction<typeof openRequesterWorkflow>;

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

describe('useOpenRequesterWorkflow', () => {
  const mockInvalidateQueries = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: {
        uid: 'firebase-uid-1',
        displayName: 'Test User',
        email: 'test@example.com',
      },
      currentUserCollab: {
        id: 'collab-1',
        id3a: '1',
        name: 'Test User',
        email: 'test@example.com',
      },
    } as any);

    mockOpenRequesterWorkflow.mockResolvedValue({
      requestId: 1001,
      docId: 'abc123',
    });

    // Mock queryClient.invalidateQueries
    jest.spyOn(QueryClient.prototype, 'invalidateQueries').mockImplementation(mockInvalidateQueries);
  });

  it('should call openRequesterWorkflow with the correct payload', async () => {
    const { result } = renderHook(() => useOpenRequesterWorkflow(), {
      wrapper: createWrapper(),
    });

    const payload = {
      workflowTypeId: 'wf-test-001',
      requesterName: 'Test User',
      formData: { description: 'Test' },
    };

    await result.current.mutateAsync(payload);

    expect(mockOpenRequesterWorkflow).toHaveBeenCalledWith(
      expect.any(Object), // user object
      payload
    );
  });

  it('should NOT invalidate catalog query on success', async () => {
    const { result } = renderHook(() => useOpenRequesterWorkflow(), {
      wrapper: createWrapper(),
    });

    const payload = {
      workflowTypeId: 'wf-test-001',
      requesterName: 'Test User',
      formData: { description: 'Test' },
    };

    await result.current.mutateAsync(payload);

    expect(mockInvalidateQueries).not.toHaveBeenCalledWith({
      queryKey: ['workflows', 'requester', 'catalog'],
    });
  });

  it('should throw error when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      currentUserCollab: null,
    } as any);

    const { result } = renderHook(() => useOpenRequesterWorkflow(), {
      wrapper: createWrapper(),
    });

    const payload = {
      workflowTypeId: 'wf-test-001',
      requesterName: 'Test User',
      formData: { description: 'Test' },
    };

    await expect(result.current.mutateAsync(payload)).rejects.toThrow(
      'Usuario nao autenticado'
    );
  });
});
