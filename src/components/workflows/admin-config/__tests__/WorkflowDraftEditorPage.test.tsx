import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery } from '@tanstack/react-query';

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
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

jest.mock('../editor/WorkflowDraftGeneralSection', () => ({
  WorkflowDraftGeneralSection: () => <div>General section</div>,
}));

jest.mock('../editor/WorkflowDraftAccessSection', () => ({
  WorkflowDraftAccessSection: () => <div>Access section</div>,
}));

jest.mock('../editor/WorkflowDraftFieldsSection', () => ({
  WorkflowDraftFieldsSection: () => <div>Fields section</div>,
}));

jest.mock('../editor/WorkflowDraftStepsSection', () => ({
  WorkflowDraftStepsSection: () => <div>Steps section</div>,
}));

const { WorkflowDraftEditorPage } = require('../editor/WorkflowDraftEditorPage');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;

function buildDraftPayload() {
  return {
    draft: {
      workflowTypeId: 'facilities_manutencao',
      version: 1,
      state: 'draft',
      isNewWorkflowType: true,
      general: {
        name: 'Manutencao Predial',
        description: 'Chamados prediais',
        icon: 'Wrench',
        areaId: 'facilities',
        ownerEmail: 'owner@3ariva.com.br',
        ownerUserId: 'SMO2',
        defaultSlaDays: 5,
        activeOnPublish: true,
      },
      access: {
        mode: 'all',
        allowedUserIds: ['all'],
        preview: 'Acesso publico para todos os colaboradores',
      },
      fields: [],
      steps: [],
      initialStepId: '',
      publishReadiness: [
        {
          code: 'MISSING_STEPS',
          category: 'steps',
          severity: 'warning',
          message: 'Defina ao menos uma etapa antes de publicar.',
        },
      ],
      meta: {
        createdAt: null,
        updatedAt: null,
        latestPublishedVersion: null,
      },
    },
    lookups: {
      areas: [],
      owners: [],
      collaborators: [],
    },
  };
}

describe('WorkflowDraftEditorPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { uid: 'firebase-uid-1' },
    } as ReturnType<typeof useAuth>);
    mockUseQuery.mockReturnValue({
      data: buildDraftPayload(),
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn().mockResolvedValue({ data: buildDraftPayload() }),
    } as unknown as ReturnType<typeof useQuery>);
    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({ savedAt: '2026-04-08T18:00:00.000Z', publishReadiness: [] }),
      isPending: false,
    } as unknown as ReturnType<typeof useMutation>);
  });

  it('renders the editor shell and readiness issues', () => {
    render(<WorkflowDraftEditorPage workflowTypeId="facilities_manutencao" version={1} />);

    expect(screen.getByText('Manutencao Predial')).toBeTruthy();
    expect(screen.getByText('General section')).toBeTruthy();
    expect(screen.getByText('Access section')).toBeTruthy();
    expect(screen.getByText('Defina ao menos uma etapa antes de publicar.')).toBeTruthy();
  });

  it('submits the save action', async () => {
    const user = userEvent.setup();
    const mutateAsync = jest.fn().mockResolvedValue({ savedAt: '2026-04-08T18:00:00.000Z', publishReadiness: [] });
    mockUseMutation.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useMutation>);

    render(<WorkflowDraftEditorPage workflowTypeId="facilities_manutencao" version={1} />);

    await user.click(screen.getByRole('button', { name: /Salvar rascunho/i }));

    expect(mutateAsync).toHaveBeenCalledTimes(1);
  });
});
