import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  useOpenRequesterWorkflow,
  useMyRequests,
  useRequestDetail,
} from '../use-requester-workflows';
import {
  openRequesterWorkflow,
  fetchMyRequests,
  fetchRequestDetail,
} from '@/lib/workflows/requester/api-client';
import type { WorkflowGroupedReadData, WorkflowRequestDetailData } from '@/lib/workflows/read/types';

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/workflows/requester/api-client', () => ({
  openRequesterWorkflow: jest.fn(),
  fetchMyRequests: jest.fn(),
  fetchRequestDetail: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockOpenRequesterWorkflow = openRequesterWorkflow as jest.MockedFunction<typeof openRequesterWorkflow>;
const mockFetchMyRequests = fetchMyRequests as jest.MockedFunction<typeof fetchMyRequests>;
const mockFetchRequestDetail = fetchRequestDetail as jest.MockedFunction<typeof fetchRequestDetail>;

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

  it('should invalidate mine query on openRequest success', async () => {
    const invalidateQueriesSpy = jest.spyOn(QueryClient.prototype, 'invalidateQueries');

    const { result } = renderHook(() => useOpenRequesterWorkflow(), {
      wrapper: createWrapper(),
    });

    const payload = {
      workflowTypeId: 'wf-test-001',
      requesterName: 'Test User',
      formData: { description: 'Test' },
    };

    await result.current.mutateAsync(payload);

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['workflows', 'requester', 'mine'],
    });

    invalidateQueriesSpy.mockRestore();
  });
});

describe('useMyRequests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { uid: 'user-1', displayName: 'Test User', email: 'test@example.com' },
      currentUserCollab: { id: 'collab-1', id3a: '1', name: 'Test User', email: 'test@example.com' },
    } as any);
  });

  it('should fetch my requests when user is authenticated', async () => {
    const mockData: WorkflowGroupedReadData = { items: [], groups: [] };
    mockFetchMyRequests.mockResolvedValue(mockData);

    const { result } = renderHook(() => useMyRequests(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFetchMyRequests).toHaveBeenCalled();
  });

  it('should not fetch when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null, currentUserCollab: null } as any);

    const { result } = renderHook(() => useMyRequests(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isEnabled).toBe(false);
  });
});

describe('useRequestDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { uid: 'user-1', displayName: 'Test User', email: 'test@example.com' },
      currentUserCollab: { id: 'collab-1', id3a: '1', name: 'Test User', email: 'test@example.com' },
    } as any);
  });

  it('should fetch detail when enabled and requestId is valid', async () => {
    const mockDetail: WorkflowRequestDetailData = {
      summary: {} as any,
      permissions: {} as any,
      formData: { fields: [], extraFields: [] },
      attachments: [],
      progress: { currentStepId: 'step-1', totalSteps: 1, completedSteps: 0, items: [] },
      action: {} as any,
      timeline: [],
    };
    mockFetchRequestDetail.mockResolvedValue(mockDetail);

    const { result } = renderHook(() => useRequestDetail(1001, true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFetchRequestDetail).toHaveBeenCalled();
  });

  it('should not fetch when disabled', () => {
    const { result } = renderHook(() => useRequestDetail(1001, false), {
      wrapper: createWrapper(),
    });

    expect(result.current.isEnabled).toBe(false);
  });

  it('should not fetch when requestId is null', () => {
    const { result } = renderHook(() => useRequestDetail(null, true), {
      wrapper: createWrapper(),
    });

    expect(result.current.isEnabled).toBe(false);
  });
});
