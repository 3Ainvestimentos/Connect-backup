import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { WorkflowConfigHistoryTab } from '../WorkflowConfigHistoryTab';

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

const historyItems = [
  {
    origin: 'v2' as const,
    requestKey: '101',
    requestIdLabel: '0101',
    sourceRequestId: 101,
    areaId: 'facilities',
    areaLabel: 'Facilities',
    workflowTypeId: 'facilities_manutencao',
    workflowLabel: 'Manutencao',
    statusKey: 'execucao',
    statusLabel: 'Execucao',
    statusCategory: 'in_progress' as const,
    ownerUserId: 'SMO2',
    ownerLabel: 'Owner Name',
    requesterLabel: 'Ana',
    responsibleLabel: 'Responsavel',
    submittedAt: '2026-04-01T10:00:00.000Z',
    lastUpdatedAt: '2026-04-02T10:00:00.000Z',
    periodReferenceAt: '2026-04-02T10:00:00.000Z',
    isArchived: false,
    compatibilityWarnings: [],
  },
  {
    origin: 'legacy' as const,
    requestKey: 'legacy-1',
    requestIdLabel: 'L-1',
    sourceRequestId: 'L-1',
    areaId: null,
    areaLabel: 'Legado',
    workflowTypeId: 'legacy_tipo',
    workflowLabel: 'Workflow legado',
    statusKey: 'aberto',
    statusLabel: 'aberto',
    statusCategory: 'open' as const,
    ownerUserId: null,
    ownerLabel: 'legacy@3ariva.com.br',
    requesterLabel: 'Bruno',
    responsibleLabel: null,
    submittedAt: '2026-03-01T10:00:00.000Z',
    lastUpdatedAt: '2026-03-01T10:00:00.000Z',
    periodReferenceAt: '2026-03-01T10:00:00.000Z',
    isArchived: false,
    compatibilityWarnings: [],
  },
];

const historyListData = {
  items: historyItems,
  filterOptions: {
    origins: ['legacy', 'v2'] as const,
    areas: [{ value: 'facilities', label: 'Facilities' }],
    workflows: [
      { value: 'facilities_manutencao', label: 'Manutencao' },
      { value: 'legacy_tipo', label: 'Workflow legado' },
    ],
    owners: [{ value: 'SMO2', label: 'Owner Name' }],
    statusCategories: ['open', 'in_progress', 'waiting_action', 'finalized', 'archived'] as const,
  },
  partialSources: [] as Array<'legacy' | 'v2'>,
  totalVisible: historyItems.length,
};

const historyDetailData = {
  origin: 'v2' as const,
  summary: historyItems[0],
  detail: {
    summary: {
      docId: 'doc-1',
      requestId: 101,
      workflowTypeId: 'facilities_manutencao',
      workflowVersion: 2,
      workflowName: 'Manutencao',
      areaId: 'facilities',
      ownerEmail: 'owner@3ariva.com.br',
      ownerUserId: 'SMO2',
      requesterUserId: 'REQ1',
      requesterName: 'Ana',
      responsibleUserId: 'RESP1',
      responsibleName: 'Responsavel',
      currentStepId: 'execucao',
      currentStepName: 'Execucao',
      currentStatusKey: 'execucao',
      statusCategory: 'in_progress',
      hasResponsible: true,
      hasPendingActions: false,
      pendingActionRecipientIds: [],
      pendingActionTypes: [],
      operationalParticipantIds: [],
      slaDays: 5,
      expectedCompletionAt: null,
      lastUpdatedAt: null,
      finalizedAt: null,
      closedAt: null,
      archivedAt: null,
      submittedAt: null,
      submittedMonthKey: '2026-04',
      closedMonthKey: null,
      isArchived: false,
    },
    permissions: {
      canAssign: false,
      canFinalize: false,
      canArchive: false,
      canRequestAction: false,
      canRespondAction: false,
    },
    formData: {
      fields: [{ fieldId: 'descricao', label: 'Descricao', type: 'text', value: 'Trocar luminaria' }],
      extraFields: [],
    },
    attachments: [],
    progress: {
      currentStepId: 'execucao',
      totalSteps: 1,
      completedSteps: 0,
      items: [{ stepId: 'execucao', stepName: 'Execucao', statusKey: 'execucao', kind: 'work', order: 1, state: 'active', isCurrent: true }],
    },
    action: {
      available: false,
      state: 'idle',
      batchId: null,
      type: null,
      label: null,
      commentRequired: false,
      attachmentRequired: false,
      commentPlaceholder: null,
      attachmentPlaceholder: null,
      canRequest: false,
      canRespond: false,
      requestedAt: null,
      completedAt: null,
      requestedByUserId: null,
      requestedByName: null,
      recipients: [],
      configurationError: null,
    },
    timeline: [{ action: 'request_opened', label: 'Solicitacao aberta', timestamp: null, userId: 'REQ1', userName: 'Ana', details: {} }],
  },
  permissions: {
    canAssign: false,
    canFinalize: false,
    canArchive: false,
    canRequestAction: false,
    canRespondAction: false,
  },
};

function filteredList(filters: Record<string, string | number | undefined>) {
  let items = [...historyItems];

  if (filters.origin) {
    items = items.filter((item) => item.origin === filters.origin);
  }

  if (filters.query) {
    const query = String(filters.query).toLowerCase();
    items = items.filter((item) =>
      [item.requestIdLabel, item.workflowLabel, item.ownerLabel, item.requesterLabel].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }

  return {
    ...historyListData,
    items,
    totalVisible: items.length,
  };
}

describe('WorkflowConfigHistoryTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { uid: 'firebase-uid-1' },
    } as ReturnType<typeof useAuth>);
    mockUseQuery.mockImplementation((input: unknown) => {
      const options = input as { queryKey: unknown[] };
      const queryKey = options.queryKey;

      if (queryKey[2] === 'history') {
        const filters = (queryKey[3] ?? {}) as Record<string, string | number | undefined>;
        return {
          data: filteredList(filters),
          isLoading: false,
          isError: false,
          error: null,
          refetch: jest.fn(),
        } as unknown as ReturnType<typeof useQuery>;
      }

      if (queryKey[2] === 'history-detail') {
        const selectedItem = queryKey[3] as { origin: string; requestKey: string } | null;
        return {
          data: selectedItem ? historyDetailData : undefined,
          isLoading: false,
          isError: false,
          error: null,
          refetch: jest.fn(),
        } as unknown as ReturnType<typeof useQuery>;
      }

      return {
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
      } as unknown as ReturnType<typeof useQuery>;
    });
  });

  it('renders mixed badges and no write CTAs', () => {
    render(<WorkflowConfigHistoryTab />);

    expect(screen.getAllByText('V2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Legado').length).toBeGreaterThan(0);
    expect(screen.queryByText('Editar')).toBeNull();
    expect(screen.queryByText('Publicar')).toBeNull();
    expect(screen.queryByText('Ativar')).toBeNull();
  });

  it('only applies the origin filter after confirmation', async () => {
    const user = userEvent.setup();

    render(<WorkflowConfigHistoryTab />);
    await user.click(screen.getByRole('button', { name: /Abrir filtros do historico/i }));
    await user.selectOptions(screen.getByLabelText('Origem'), 'legacy');

    expect(screen.getAllByText('Workflow legado').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Manutencao').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Abrir filtros do historico/i })).not.toHaveTextContent('1');

    await user.click(screen.getByRole('button', { name: /Aplicar filtros/i }));

    expect(screen.getAllByText('Workflow legado').length).toBeGreaterThan(0);
    expect(screen.queryByRole('cell', { name: 'Manutencao' })).toBeNull();
    expect(screen.getByRole('button', { name: /Abrir filtros do historico/i })).toHaveTextContent('1');
  });

  it('shows partial degradation without blocking the table', () => {
    mockUseQuery.mockImplementation((input: unknown) => {
      const options = input as { queryKey: unknown[] };

      if (options.queryKey[2] === 'history') {
        return {
          data: {
            ...historyListData,
            partialSources: ['legacy'],
          },
          isLoading: false,
          isError: false,
          error: null,
          refetch: jest.fn(),
        } as unknown as ReturnType<typeof useQuery>;
      }

      return {
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
      } as unknown as ReturnType<typeof useQuery>;
    });

    render(<WorkflowConfigHistoryTab />);

    expect(screen.getByText('Degradacao parcial do historico')).toBeTruthy();
    expect(screen.getAllByText('Manutencao').length).toBeGreaterThan(0);
  });

  it('changes the empty state only after applying draft filters', async () => {
    const user = userEvent.setup();

    render(<WorkflowConfigHistoryTab />);
    await user.click(screen.getByRole('button', { name: /Abrir filtros do historico/i }));
    await user.type(screen.getByLabelText('Busca'), 'nao existe');

    expect(screen.queryByText('Nenhum resultado para os filtros aplicados')).toBeNull();

    await user.click(screen.getByRole('button', { name: /Aplicar filtros/i }));

    expect(screen.getByText('Nenhum resultado para os filtros aplicados')).toBeTruthy();
  });

  it('opens the detail dialog in read-only mode', async () => {
    const user = userEvent.setup();

    render(<WorkflowConfigHistoryTab />);
    await user.click(screen.getAllByRole('button', { name: 'Ver detalhe' })[0]);

    expect(screen.getByText('Chamado 0101')).toBeTruthy();
    expect(screen.getByText('Dados do formulario')).toBeTruthy();
    expect(screen.getByText('Descricao')).toBeTruthy();
    expect(screen.queryByText('Editar')).toBeNull();
    expect(screen.queryByText('Publicar')).toBeNull();
    expect(screen.queryByText('Ativar')).toBeNull();
  });
});
