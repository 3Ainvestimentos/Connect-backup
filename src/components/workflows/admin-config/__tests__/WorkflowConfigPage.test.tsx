import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { WorkflowConfigPage } from '../WorkflowConfigPage';

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
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
            versions: [
              {
                version: 1,
                state: 'published',
                uiStatus: 'Inativa',
                isActivePublished: false,
                stepCount: 1,
                fieldCount: 1,
                publishedAt: '2026-04-01T10:00:00.000Z',
              },
              {
                version: 2,
                state: 'published',
                uiStatus: 'Publicada',
                isActivePublished: true,
                stepCount: 2,
                fieldCount: 2,
                publishedAt: '2026-04-03T15:30:00.000Z',
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

  it('renders the placeholder when the history tab is selected', async () => {
    const user = userEvent.setup();

    render(<WorkflowConfigPage />);

    await user.click(screen.getByRole('tab', { name: 'Historico Geral' }));

    expect(screen.getByText('Planejado para a proxima subetapa')).toBeTruthy();
    expect(screen.getByText(/grid consolidado de historico ainda nao entra na 2E.1/i)).toBeTruthy();
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

    expect(screen.getByText('Catalogo vazio')).toBeTruthy();
  });

  it('reveals workflow types and versions when an area is expanded', async () => {
    const user = userEvent.setup();

    render(<WorkflowConfigPage />);

    await user.click(screen.getByRole('button', { name: /Facilities/i }));

    expect(screen.getByText('Manutencao')).toBeTruthy();
    expect(screen.getByText('v2 publicada')).toBeTruthy();
    expect(screen.getAllByText('state=published')).toHaveLength(2);
  });
});
