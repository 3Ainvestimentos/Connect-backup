import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { WorkflowConfigPage } from '../WorkflowConfigPage';

const pushMock = jest.fn();
let currentSearchParams = new URLSearchParams({
  tab: 'definitions',
});

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  usePathname: () => '/admin/request-config',
  useSearchParams: () => currentSearchParams,
}));

jest.mock('@/lib/workflows/admin-config/api-client', () => ({
  createWorkflowDraft: jest.fn(),
}));

jest.mock('../CreateWorkflowAreaDialog', () => ({
  CreateWorkflowAreaDialog: () => null,
}));

jest.mock('../CreateWorkflowTypeDialog', () => ({
  CreateWorkflowTypeDialog: () => null,
}));

jest.mock('../WorkflowVersionEditorDialog', () => ({
  WorkflowVersionEditorDialog: ({
    workflowTypeId,
    version,
    onClose,
  }: {
    workflowTypeId: string;
    version: number;
    onClose: () => void;
  }) => (
    <div>
      <p>{`Modal ${workflowTypeId} v${version}`}</p>
      <button type="button" onClick={onClose}>
        Fechar modal
      </button>
    </div>
  ),
}));

jest.mock('../WorkflowConfigHistoryTab', () => ({
  WorkflowConfigHistoryTab: () => <div>Historico Geral carregado</div>,
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
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;

function buildCatalog() {
  return {
    areas: [
      {
        areaId: 'facilities',
        name: 'Facilities',
        icon: 'building-2',
        typeCount: 1,
        publishedTypeCount: 1,
        draftOnlyTypeCount: 0,
        types: [
          {
            workflowTypeId: 'facilities_manutencao',
            name: 'Manutencao',
            description: 'Chamados prediais.',
            areaId: 'facilities',
            ownerEmail: 'owner@3ariva.com.br',
            ownerUserId: 'SMO2',
            active: true,
            latestPublishedVersion: 2,
            versionCount: 2,
            publishedVersionLabel: 'v2 publicada',
            hasPublishedVersion: true,
            draftVersion: null,
            versions: [
              {
                version: 1,
                state: 'published',
                uiStatus: 'Inativa',
                derivedStatus: 'Inativa',
                isActivePublished: false,
                canPublish: false,
                canActivate: true,
                hasBlockingIssues: false,
                stepCount: 1,
                fieldCount: 1,
                publishedAt: '2026-04-01T10:00:00.000Z',
                lastTransitionAt: '2026-04-02T10:00:00.000Z',
              },
              {
                version: 2,
                state: 'published',
                uiStatus: 'Publicada',
                derivedStatus: 'Publicada',
                isActivePublished: true,
                canPublish: false,
                canActivate: false,
                hasBlockingIssues: false,
                stepCount: 2,
                fieldCount: 2,
                publishedAt: '2026-04-03T15:30:00.000Z',
                lastTransitionAt: '2026-04-03T15:30:00.000Z',
              },
            ],
          },
        ],
      },
    ],
    summary: {
      areaCount: 1,
      workflowTypeCount: 1,
      versionCount: 2,
    },
  };
}

describe('WorkflowConfigPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentSearchParams = new URLSearchParams({
      tab: 'definitions',
    });
    mockUseAuth.mockReturnValue({
      user: { uid: 'firebase-uid-1' },
    } as ReturnType<typeof useAuth>);
    mockUseQuery.mockReturnValue({
      data: buildCatalog(),
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useQuery>);
  });

  it('renders the definitions catalog by default', () => {
    render(<WorkflowConfigPage />);

    expect(screen.getByRole('tab', { name: 'Definicoes' }).getAttribute('data-state')).toBe('active');
    expect(screen.getByText('Configuracao de chamados v2')).toBeTruthy();
    expect(screen.getByText('Facilities')).toBeTruthy();
    expect(screen.queryByText('Manutencao')).toBeNull();
  });

  it('pushes the history tab state into the URL when the history tab is selected', async () => {
    const user = userEvent.setup();

    render(<WorkflowConfigPage />);

    await user.click(screen.getByRole('tab', { name: 'Historico Geral' }));

    expect(pushMock).toHaveBeenCalledWith('/admin/request-config?tab=history');
  });

  it('shows retry state when the catalog query fails', async () => {
    const refetch = jest.fn();
    const user = userEvent.setup();

    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Falha ao carregar'),
      refetch,
    } as unknown as ReturnType<typeof useQuery>);

    render(<WorkflowConfigPage />);

    expect(screen.getByText('Falha ao carregar o catalogo')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('shows the empty state when no areas are returned', () => {
    mockUseQuery.mockReturnValue({
      data: {
        areas: [],
        summary: {
          areaCount: 0,
          workflowTypeCount: 0,
          versionCount: 0,
        },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useQuery>);

    render(<WorkflowConfigPage />);

    expect(screen.getByText(/Nenhuma area foi encontrada/i)).toBeTruthy();
  });

  it('reveals workflow types and versions when an area is expanded', async () => {
    const user = userEvent.setup();

    render(<WorkflowConfigPage />);

    await user.click(screen.getByRole('button', { name: /Facilities/i }));

    expect(screen.getByText('Manutencao')).toBeTruthy();
    expect(screen.getByText('v2 publicada')).toBeTruthy();
    expect(screen.queryByText(/state=published/i)).toBeNull();
    expect(screen.getByText('Ultima transicao em 2026-04-03T15:30:00.000Z')).toBeTruthy();
  });

  it('opens the editor modal from deep-link search params', async () => {
    const user = userEvent.setup();
    currentSearchParams = new URLSearchParams({
      tab: 'definitions',
      editorWorkflowTypeId: 'facilities_manutencao',
      editorVersion: '2',
    });

    render(<WorkflowConfigPage />);

    await user.click(screen.getByRole('button', { name: /Facilities/i }));

    expect(screen.getByText('Modal facilities_manutencao v2')).toBeTruthy();
  });

  it('cleans only editor params when the modal is closed', async () => {
    const user = userEvent.setup();
    currentSearchParams = new URLSearchParams({
      tab: 'definitions',
      editorWorkflowTypeId: 'facilities_manutencao',
      editorVersion: '2',
    });

    render(<WorkflowConfigPage />);

    await user.click(screen.getByRole('button', { name: /Facilities/i }));
    await user.click(screen.getByRole('button', { name: 'Fechar modal' }));

    expect(pushMock).toHaveBeenCalledWith('/admin/request-config?tab=definitions');
  });
});
