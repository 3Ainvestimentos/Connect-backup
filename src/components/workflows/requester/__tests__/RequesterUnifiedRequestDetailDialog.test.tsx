import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RequesterUnifiedRequestDetailDialog } from '../RequesterUnifiedRequestDetailDialog';
import { useRequestDetail } from '@/hooks/use-requester-workflows';
import { mockLegacyRequest, mockWorkflowArea, mockWorkflowDefinition } from '@/lib/workflows/requester/legacy/__tests__/fixtures';
import type {
  RequesterUnifiedLegacyListItem,
  RequesterUnifiedV2ListItem,
} from '@/lib/workflows/requester/unified-types';
import type { WorkflowRequestDetailData } from '@/lib/workflows/read/types';
import '@testing-library/jest-dom';

jest.mock('@/hooks/use-requester-workflows', () => ({
  useRequestDetail: jest.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const areaLabelById = new Map([['area-1', 'Facilities']]);

const selectedV2: RequesterUnifiedV2ListItem = {
  origin: 'v2',
  detailKey: 'v2:1001',
  requestId: 1001,
  displayRequestId: '1001',
  workflowName: 'Manutenção Geral',
  statusLabel: 'Em andamento',
  statusVariant: 'default',
  expectedCompletionLabel: '-',
  expectedCompletionAt: null,
  submittedAt: null,
  lastUpdatedAt: null,
  raw: {
    docId: 'doc-1',
    requestId: 1001,
    workflowTypeId: 'wf-facilities-001',
    workflowVersion: 1,
    workflowName: 'Manutenção Geral',
    areaId: 'area-1',
    ownerEmail: 'owner@example.com',
    ownerUserId: 'owner-1',
    requesterUserId: 'user-1',
    requesterName: 'Test User',
    responsibleUserId: null,
    responsibleName: null,
    currentStepId: 'step-2',
    currentStepName: 'Execução',
    currentStatusKey: 'in_progress',
    statusCategory: 'in_progress',
    hasResponsible: false,
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
    closedMonthKey: 'unknown',
    isArchived: false,
  },
};

const detailV2: WorkflowRequestDetailData = {
  summary: {
    ...selectedV2.raw,
  },
  permissions: {
    canAssign: false,
    canAdvance: false,
    canFinalize: false,
    canArchive: false,
    canRequestAction: false,
    canRespondAction: false,
  },
  formData: {
    fields: [{ fieldId: 'description', label: 'Descrição', type: 'text', value: 'Trocar lâmpada' }],
    extraFields: [],
  },
  attachments: [
    {
      fieldId: 'attachment',
      label: 'Foto',
      url: 'https://example.com/uploads/foto%20teste.png?alt=media',
    },
  ],
  progress: {
    currentStepId: 'step-2',
    totalSteps: 3,
    completedSteps: 1,
    items: [
      {
        stepId: 'step-1',
        stepName: 'Abertura',
        statusKey: 'completed',
        kind: 'start',
        order: 1,
        state: 'completed',
        isCurrent: false,
      },
      {
        stepId: 'step-2',
        stepName: 'Execução',
        statusKey: 'in_progress',
        kind: 'work',
        order: 2,
        state: 'active',
        isCurrent: true,
      },
    ],
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
  },
  timeline: [
    {
      action: 'request_opened',
      label: 'Evento técnico',
      timestamp: null,
      userId: 'user-1',
      userName: 'Test User',
    },
    {
      action: 'step_completed',
      label: 'Execução técnica',
      timestamp: {
        toDate: () => new Date('2026-04-12T15:00:00.000Z'),
      },
      userId: 'user-2',
      userName: 'Sistema',
      details: { stepId: 'step-1' },
    },
  ],
};

function makeDetailV2(overrides?: {
  submittedAt?: WorkflowRequestDetailData['summary']['submittedAt'];
  progressItems?: WorkflowRequestDetailData['progress']['items'];
  timeline?: WorkflowRequestDetailData['timeline'];
}) {
  return {
    ...detailV2,
    summary: {
      ...detailV2.summary,
      submittedAt: overrides?.submittedAt ?? detailV2.summary.submittedAt,
    },
    progress: {
      ...detailV2.progress,
      items: overrides?.progressItems ?? detailV2.progress.items,
    },
    timeline: overrides?.timeline ?? detailV2.timeline,
  } satisfies WorkflowRequestDetailData;
}

const selectedLegacy: RequesterUnifiedLegacyListItem = {
  origin: 'legacy',
  detailKey: 'legacy:legacy-req-001',
  requestDocId: 'legacy-req-001',
  displayRequestId: '0001',
  workflowName: 'vacation_request',
  statusLabel: 'Em Andamento',
  statusVariant: 'default',
  expectedCompletionLabel: '-',
  expectedCompletionAt: null,
  submittedAt: new Date('2026-04-01T10:00:00.000Z'),
  lastUpdatedAt: new Date('2026-04-02T14:30:00.000Z'),
  raw: {
    request: mockLegacyRequest,
    definition: mockWorkflowDefinition,
    workflowArea: mockWorkflowArea,
  },
};

describe('RequesterUnifiedRequestDetailDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the requester shell for v2 without separate Timeline or Progresso blocks', () => {
    (useRequestDetail as jest.Mock).mockReturnValue({
      data: detailV2,
      isLoading: false,
      error: null,
      isError: false,
      stableData: detailV2,
      hasStableData: true,
    });

    render(
      <RequesterUnifiedRequestDetailDialog
        open
        onOpenChange={jest.fn()}
        selected={selectedV2}
        areaLabelById={areaLabelById}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('Solicitação #1001 - Manutenção Geral')).toBeInTheDocument();
    expect(screen.getByText('Informações do chamado')).toBeInTheDocument();
    expect(screen.getByText('Dados enviados')).toBeInTheDocument();
    expect(screen.getByText('Histórico')).toBeInTheDocument();
    expect(screen.getByText('Anexos')).toBeInTheDocument();
    expect(screen.getByText('Descrição')).toBeInTheDocument();
    expect(screen.getByText('Trocar lâmpada')).toBeInTheDocument();
    expect(screen.getByText('Execução')).toBeInTheDocument();
    expect(screen.getByText('Atual')).toBeInTheDocument();
    expect(screen.getByText(/12\/04\/2026/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Abrir anexo' })).toBeInTheDocument();
    expect(screen.queryByText('Sem data')).not.toBeInTheDocument();
    expect(screen.queryByText('Timeline')).not.toBeInTheDocument();
    expect(screen.queryByText('Progresso')).not.toBeInTheDocument();
    expect(screen.queryByText('Evento técnico')).not.toBeInTheDocument();
  });

  it('renders legacy history with oldest item first and PT-BR labels', () => {
    (useRequestDetail as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      isError: false,
      stableData: undefined,
      hasStableData: false,
    });

    render(
      <RequesterUnifiedRequestDetailDialog
        open
        onOpenChange={jest.fn()}
        selected={selectedLegacy}
        areaLabelById={areaLabelById}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('Solicitação #0001 - vacation_request')).toBeInTheDocument();
    expect(screen.getByText('Responsável')).toBeInTheDocument();
    expect(screen.getAllByText('Maria Santos').length).toBeGreaterThan(0);
    expect(screen.getByText('Área')).toBeInTheDocument();
    expect(screen.getByText('Recursos Humanos')).toBeInTheDocument();
    expect(screen.queryByText('Timeline')).not.toBeInTheDocument();

    const pendingItem = screen.getByText('Pendente');
    const inProgressItem = screen.getByText('Em Andamento');
    expect(pendingItem.compareDocumentPosition(inProgressItem)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('renders a blocking alert for v2 when the detail request fails without stable data', () => {
    (useRequestDetail as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('boom'),
      isError: true,
      stableData: undefined,
      hasStableData: false,
    });

    render(
      <RequesterUnifiedRequestDetailDialog
        open
        onOpenChange={jest.fn()}
        selected={selectedV2}
        areaLabelById={areaLabelById}
      />,
      { wrapper: createWrapper() },
    );

    expect(
      screen.getByText('Não foi possível carregar os detalhes desta solicitação.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Histórico')).not.toBeInTheDocument();
    expect(screen.queryByText('Dados enviados')).not.toBeInTheDocument();
  });

  it('closes the dialog when the user clicks the close button', async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();

    (useRequestDetail as jest.Mock).mockReturnValue({
      data: detailV2,
      isLoading: false,
      error: null,
      isError: false,
      stableData: detailV2,
      hasStableData: true,
    });

    render(
      <RequesterUnifiedRequestDetailDialog
        open
        onOpenChange={onOpenChange}
        selected={selectedV2}
        areaLabelById={areaLabelById}
      />,
      { wrapper: createWrapper() },
    );

    await user.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders the first step date from request_opened fallback when no step_completed match exists', () => {
    const detail = makeDetailV2({
      timeline: [
        {
          action: 'request_opened',
          label: 'Evento técnico',
          timestamp: {
            toDate: () => new Date('2026-04-11T10:00:00.000Z'),
          },
          userId: 'user-1',
          userName: 'Test User',
        },
      ],
      progressItems: [
        {
          stepId: 'step-1',
          stepName: 'Abertura',
          statusKey: 'completed',
          kind: 'start',
          order: 1,
          state: 'completed',
          isCurrent: false,
        },
        {
          stepId: 'step-2',
          stepName: 'Execução',
          statusKey: 'in_progress',
          kind: 'work',
          order: 2,
          state: 'active',
          isCurrent: true,
        },
      ],
    });

    (useRequestDetail as jest.Mock).mockReturnValue({
      data: detail,
      isLoading: false,
      error: null,
      isError: false,
      stableData: detail,
      hasStableData: true,
    });

    render(
      <RequesterUnifiedRequestDetailDialog
        open
        onOpenChange={jest.fn()}
        selected={selectedV2}
        areaLabelById={areaLabelById}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText(/11\/04\/2026/)).toBeInTheDocument();
    expect(screen.queryByText('Evento técnico')).not.toBeInTheDocument();
  });

  it('does not render any placeholder date for a non-initial completed step without a step_completed match', () => {
    const detail = makeDetailV2({
      timeline: [
        {
          action: 'request_opened',
          label: 'Evento técnico',
          timestamp: {
            toDate: () => new Date('2026-04-11T10:00:00.000Z'),
          },
          userId: 'user-1',
          userName: 'Test User',
        },
      ],
      progressItems: [
        {
          stepId: 'step-1',
          stepName: 'Abertura',
          statusKey: 'in_progress',
          kind: 'start',
          order: 1,
          state: 'active',
          isCurrent: true,
        },
        {
          stepId: 'step-2',
          stepName: 'Execução',
          statusKey: 'completed',
          kind: 'work',
          order: 2,
          state: 'completed',
          isCurrent: false,
        },
      ],
    });

    (useRequestDetail as jest.Mock).mockReturnValue({
      data: detail,
      isLoading: false,
      error: null,
      isError: false,
      stableData: detail,
      hasStableData: true,
    });

    render(
      <RequesterUnifiedRequestDetailDialog
        open
        onOpenChange={jest.fn()}
        selected={selectedV2}
        areaLabelById={areaLabelById}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('Execução')).toBeInTheDocument();
    expect(screen.queryByText('Sem data')).not.toBeInTheDocument();
    expect(screen.queryByText(/11\/04\/2026/)).not.toBeInTheDocument();
  });
});
