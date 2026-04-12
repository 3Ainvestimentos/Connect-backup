import { render, screen, waitFor } from '@testing-library/react';
import { RequesterV2Guard } from '../RequesterV2Guard';

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

describe('RequesterV2Guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to /login when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      permissions: { canOpenRequestsV2: false },
    });

    render(
      <RequesterV2Guard>
        <div>Test</div>
      </RequesterV2Guard>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  it('redirects to /dashboard when canOpenRequestsV2 is false', async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: '123' },
      loading: false,
      permissions: { canOpenRequestsV2: false },
    });

    render(
      <RequesterV2Guard>
        <div>Test</div>
      </RequesterV2Guard>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('renders children when canOpenRequestsV2 is true', async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: '123' },
      loading: false,
      permissions: { canOpenRequestsV2: true },
    });

    render(
      <RequesterV2Guard>
        <div data-testid="content">Solicitacoes V2</div>
      </RequesterV2Guard>
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
      permissions: { canOpenRequestsV2: false },
    });

    render(
      <RequesterV2Guard>
        <div>Test</div>
      </RequesterV2Guard>
    );

    expect(screen.getByText(/carregando solicitacoes v2/i)).toBeInTheDocument();
  });
});
