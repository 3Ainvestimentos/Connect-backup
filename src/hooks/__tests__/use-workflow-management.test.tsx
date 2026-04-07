import { renderHook } from '@testing-library/react';
import { useAuth } from '@/contexts/AuthContext';
import { managementKeys } from '@/lib/workflows/management/query-keys';
import { useWorkflowManagement } from '../use-workflow-management';

const mockInvalidateQueries = jest.fn();
const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/workflows/management/api-client', () => ({
  getManagementBootstrap: jest.fn(),
  getManagementCurrent: jest.fn(),
  getManagementAssignments: jest.fn(),
  getManagementCompleted: jest.fn(),
  getManagementRequestDetail: jest.fn(),
  assignManagementResponsible: jest.fn(),
  finalizeManagementRequest: jest.fn(),
  archiveManagementRequest: jest.fn(),
  requestManagementAction: jest.fn(),
  respondManagementAction: jest.fn(),
}));

jest.mock('@/lib/workflows/upload/client', () => ({
  uploadWorkflowActionResponseFile: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('useWorkflowManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: {
        uid: 'firebase-uid-1',
        displayName: 'Owner',
      },
      currentUserCollab: {
        id: 'col-1',
        id3a: 'SMO2',
        name: 'Owner',
      },
    } as ReturnType<typeof useAuth>);

    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockUseMutation.mockImplementation((options: { onSuccess?: (data: unknown, variables: { requestId: number }) => Promise<void> }) => ({
      mutateAsync: async (variables: { requestId: number }) => {
        await options.onSuccess?.({}, variables);
      },
      isPending: false,
    }));
  });

  it('invalidates official lists and detail after operational mutations', async () => {
    const state = {
      activeTab: 'assignments' as const,
      assignmentsSubtab: 'assigned' as const,
      currentFilter: 'all' as const,
      filters: {},
    };

    const { result } = renderHook(() => useWorkflowManagement(state, 812));

    await result.current.assignMutation.mutateAsync({
      requestId: 812,
      responsibleUserId: 'RESP2',
      responsibleName: 'Novo Responsavel',
    });
    await result.current.finalizeMutation.mutateAsync({
      requestId: 812,
    });
    await result.current.archiveMutation.mutateAsync({
      requestId: 812,
    });
    await result.current.requestActionMutation.mutateAsync({
      requestId: 812,
    });
    await result.current.respondActionMutation.mutateAsync({
      requestId: 812,
      response: 'approved',
    });

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: managementKeys.currentRoot('firebase-uid-1'),
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: managementKeys.assignmentsRoot('firebase-uid-1'),
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: managementKeys.completedRoot('firebase-uid-1'),
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: managementKeys.detail('firebase-uid-1', 812),
    });
  });

  it('refetches only the active tab and the selected detail when asked', async () => {
    const currentRefetch = jest.fn();
    const assignmentsRefetch = jest.fn();
    const completedRefetch = jest.fn();
    const detailRefetch = jest.fn();

    mockUseQuery.mockImplementation((options: { queryKey: readonly unknown[] }) => {
      const queryKey = options.queryKey;

      if (queryKey.includes('current')) {
        return { data: undefined, isLoading: false, error: null, refetch: currentRefetch };
      }

      if (queryKey.includes('assignments')) {
        return { data: undefined, isLoading: false, error: null, refetch: assignmentsRefetch };
      }

      if (queryKey.includes('completed')) {
        return { data: undefined, isLoading: false, error: null, refetch: completedRefetch };
      }

      if (queryKey.includes('detail')) {
        return { data: undefined, isLoading: false, error: null, refetch: detailRefetch };
      }

      return {
        data: {
          capabilities: {
            canViewCurrentQueue: true,
          },
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      };
    });

    const state = {
      activeTab: 'assignments' as const,
      assignmentsSubtab: 'assigned' as const,
      currentFilter: 'all' as const,
      filters: {},
    };

    const { result } = renderHook(() => useWorkflowManagement(state, 812));

    await result.current.refetchActiveTab();
    await result.current.refetchDetail();

    expect(assignmentsRefetch).toHaveBeenCalledTimes(1);
    expect(currentRefetch).not.toHaveBeenCalled();
    expect(completedRefetch).not.toHaveBeenCalled();
    expect(detailRefetch).toHaveBeenCalledTimes(1);
  });
});
