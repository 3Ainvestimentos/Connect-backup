import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { UserNav } from '../AppLayout';

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/contexts/CollaboratorsContext', () => ({
  useCollaborators: jest.fn(),
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

jest.mock('@/contexts/WorkflowsContext', () => ({
  useWorkflows: () => ({
    requests: [],
    loading: false,
  }),
}));

jest.mock('@/contexts/ApplicationsContext', () => ({
  useApplications: () => ({
    workflowDefinitions: [],
  }),
}));

jest.mock('@/contexts/SystemSettingsContext', () => ({
  useSystemSettings: () => ({
    settings: {},
    loading: false,
  }),
}));

jest.mock('@/contexts/FabMessagesContext', () => ({
  useFabMessages: () => ({
    fabMessages: [],
  }),
}));

jest.mock('@/components/layout/Header', () => ({
  Header: () => null,
}));

jest.mock('@/components/guides/FAQModal', () => () => null);
jest.mock('@/components/applications/ProfileModal', () => () => null);
jest.mock('@/components/polls/PollTrigger', () => () => null);
jest.mock('@/components/auth/TermsOfUseModal', () => ({
  TermsOfUseModal: () => null,
}));
jest.mock('@/components/fab/NotificationFAB', () => () => null);
jest.mock('@/components/rss/DailyRssModal', () => ({
  DailyRssModal: () => null,
}));

jest.mock('@/lib/firestore-service', () => ({
  addDocumentToCollection: jest.fn(),
  updateDocumentInCollection: jest.fn(),
}));

jest.mock('@/lib/email-utils', () => ({
  findCollaboratorByEmail: (collaborators: Array<{ email: string }>, email?: string | null) =>
    collaborators.find((collaborator) => collaborator.email === email) ?? null,
}));

jest.mock('next/link', () => {
  return React.forwardRef<
    HTMLAnchorElement,
    {
      href: string;
      className?: string;
      children: React.ReactNode;
    }
  >(function MockLink({ href, className, children }, ref) {
    return (
      <a ref={ref} href={href} className={className}>
        {children}
      </a>
    );
  });
});

jest.mock('next/image', () => {
  return function MockImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
    return <img {...props} alt={props.alt ?? ''} />;
  };
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
  }),
  usePathname: () => '/dashboard',
}));

jest.mock('@/components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Sidebar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenuButton: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  SidebarInset: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useSidebar: () => ({
    setOpen: jest.fn(),
  }),
}));

jest.mock('lucide-react', () => {
  const Icon = () => <svg />;
  return new Proxy(
    {},
    {
      get: () => Icon,
    },
  );
});

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseCollaborators = useCollaborators as jest.MockedFunction<typeof useCollaborators>;
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

describe('AppLayout workflow dropdown rollout', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: {
        email: 'owner@3ariva.com.br',
        displayName: 'Owner',
        photoURL: null,
      },
      signOut: jest.fn(),
      loading: false,
      isAdmin: false,
      isSuperAdmin: false,
      permissions: {
        canManageRequests: true,
        canViewTasks: true,
        canViewCRM: false,
        canViewStrategicPanel: false,
        canViewDirectoria: false,
        canManageContent: false,
        canManageWorkflows: false,
        canManageWorkflowsV2: false,
        canManageTripsBirthdays: false,
      },
    } as unknown as ReturnType<typeof useAuth>);

    mockUseCollaborators.mockReturnValue({
      collaborators: [
        {
          id: 'col-1',
          id3a: 'SMO2',
          name: 'Owner',
          email: 'owner@3ariva.com.br',
        },
      ],
    } as ReturnType<typeof useCollaborators>);

    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: jest.fn(),
    } as ReturnType<typeof useTheme>);
  });

  it('promotes the official route and groups legacy entries under a transition label', async () => {
    const user = userEvent.setup();

    render(
      <UserNav
        onProfileClick={() => {}}
        hasPendingRequests
        hasPendingTasks={false}
      />,
    );

    await user.click(screen.getByRole('button'));

    const officialLink = screen.getByRole('link', { name: /Gestao de chamados/i });
    const legacyLabel = screen.getByText('Atalhos legados durante transicao');
    const requestsLink = screen.getByRole('link', { name: /Gestão de Solicitações/i });
    const tasksLink = screen.getByRole('link', { name: /Minhas Tarefas\/Ações/i });

    expect(officialLink.getAttribute('href')).toBe('/gestao-de-chamados');
    expect(officialLink.className).toContain('bg-admin-primary/10');
    expect(legacyLabel).toBeTruthy();
    expect(requestsLink.getAttribute('href')).toBe('/requests');
    expect(tasksLink.getAttribute('href')).toBe('/me/tasks');
  });

  it('shows the request config v2 admin entry only when the dedicated permission is present', async () => {
    const user = userEvent.setup();

    mockUseAuth.mockReturnValue({
      user: {
        email: 'owner@3ariva.com.br',
        displayName: 'Owner',
        photoURL: null,
      },
      signOut: jest.fn(),
      loading: false,
      isAdmin: true,
      isSuperAdmin: false,
      permissions: {
        canManageRequests: false,
        canViewTasks: false,
        canViewCRM: false,
        canViewStrategicPanel: false,
        canViewDirectoria: false,
        canManageContent: false,
        canManageWorkflows: false,
        canManageWorkflowsV2: true,
        canManageTripsBirthdays: false,
      },
    } as unknown as ReturnType<typeof useAuth>);

    render(
      <UserNav
        onProfileClick={() => {}}
        hasPendingRequests={false}
        hasPendingTasks={false}
      />,
    );

    await user.click(screen.getByRole('button'));

    const requestConfigLink = screen.getByRole('link', { name: /Config. de chamados v2/i });
    expect(requestConfigLink.getAttribute('href')).toBe('/admin/request-config');
    expect(screen.queryByRole('link', { name: /^Workflows$/i })).toBeNull();
  });
});
