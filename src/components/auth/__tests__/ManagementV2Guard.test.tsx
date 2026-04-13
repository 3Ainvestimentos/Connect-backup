import { render, screen, waitFor } from '@testing-library/react';
import { ManagementV2Guard } from '../ManagementV2Guard';

// Mock AuthContext antes de importar o componente
const mockUseAuth = jest.fn();
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock useRouter
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

describe('ManagementV2Guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to /login when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      permissions: { canManageRequestsV2: false },
    });

    render(
      <ManagementV2Guard>
        <div>Test</div>
      </ManagementV2Guard>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  it('redirects to /dashboard when canManageRequestsV2 is false', async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: '123' },
      loading: false,
      permissions: { canManageRequestsV2: false },
    });

    render(
      <ManagementV2Guard>
        <div>Test</div>
      </ManagementV2Guard>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('renders children when canManageRequestsV2 is true', async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: '123' },
      loading: false,
      permissions: { canManageRequestsV2: true },
    });

    render(
      <ManagementV2Guard>
        <div data-testid="content">Gestao de Chamados V2</div>
      </ManagementV2Guard>
    );

    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('shows loading spinner while loading is true', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      permissions: { canManageRequestsV2: false },
    });

    render(
      <ManagementV2Guard>
        <div>Test</div>
      </ManagementV2Guard>
    );

    expect(screen.getByText(/carregando gestao de chamados v2/i)).toBeInTheDocument();
  });
});
