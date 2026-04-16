import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery } from '@tanstack/react-query';
import { saveWorkflowDraft } from '@/lib/workflows/admin-config/api-client';

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

jest.mock('@/lib/workflows/admin-config/api-client', () => ({
  WorkflowConfigApiError: class WorkflowConfigApiError extends Error {
    code: string;
    httpStatus: number;

    constructor(code: string, message: string, httpStatus: number) {
      super(message);
      this.code = code;
      this.httpStatus = httpStatus;
    }
  },
  fetchWorkflowDraftEditor: jest.fn(),
  publishWorkflowVersion: jest.fn(),
  saveWorkflowDraft: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
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
const mockSaveWorkflowDraft = saveWorkflowDraft as jest.MockedFunction<typeof saveWorkflowDraft>;

function buildDraftPayload() {
  return {
    draft: {
      workflowTypeId: 'facilities_manutencao',
      version: 1,
      state: 'draft',
      mode: 'edit',
      derivedStatus: 'Rascunho',
      canPublish: false,
      canActivate: false,
      isNewWorkflowType: true,
      general: {
        name: 'Manutencao Predial',
        description: 'Chamados prediais',
        icon: 'Wrench',
        areaId: 'facilities',
        areaName: 'Facilities',
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
      steps: [
        {
          stepId: 'start',
          stepName: 'Inicio',
          statusKey: 'solicitacao_aberta',
          kind: 'start',
        },
        {
          stepId: 'work',
          stepName: 'Execucao',
          statusKey: 'em_andamento',
          kind: 'work',
          action: {
            type: 'approval',
            label: 'Aprovar',
            approvers: [
              {
                collaboratorDocId: 'collab-apr1',
                userId: 'APR1',
                name: 'Ana Paula',
                email: 'ana.paula@3ariva.com.br',
              },
            ],
            unresolvedApproverIds: [],
            commentRequired: false,
            attachmentRequired: false,
            commentPlaceholder: '',
            attachmentPlaceholder: '',
          },
        },
      ],
      initialStepId: '',
      publishReadiness: [
        {
          code: 'MISSING_STEPS',
          category: 'steps',
          severity: 'blocking',
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
    mockSaveWorkflowDraft.mockResolvedValue({
      savedAt: '2026-04-08T18:00:00.000Z',
      publishReadiness: [],
    });
  });

  it('renders the editor shell and readiness issues', () => {
    render(<WorkflowDraftEditorPage workflowTypeId="facilities_manutencao" version={1} />);

    expect(screen.getByText('Manutencao Predial')).toBeTruthy();
    expect(screen.getByText('General section')).toBeTruthy();
    expect(screen.getByText('Access section')).toBeTruthy();
    expect(screen.getByText('Defina ao menos uma etapa antes de publicar.')).toBeTruthy();
    expect((screen.getByRole('button', { name: /Publicar versao/i }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('hides the readiness publish CTA when embedded with hidden primary actions', () => {
    render(
      <WorkflowDraftEditorPage
        workflowTypeId="facilities_manutencao"
        version={1}
        embedded
        hidePrimaryActions
      />,
    );

    expect(screen.queryByRole('button', { name: /Publicar versao/i })).toBeNull();
    expect(screen.getByText('Defina ao menos uma etapa antes de publicar.')).toBeTruthy();
  });

  it('submits the save action', async () => {
    const user = userEvent.setup();
    mockSaveWorkflowDraft.mockResolvedValue({ savedAt: '2026-04-08T18:00:00.000Z', publishReadiness: [] });
    mockUseMutation.mockImplementation((options: unknown) => {
      const config = options as { mutationFn?: (values?: unknown) => Promise<unknown> };
      return {
        mutateAsync: (values?: unknown) => {
          if (config.mutationFn) {
            return config.mutationFn(values);
          }

          return Promise.resolve(undefined);
        },
        isPending: false,
      } as unknown as ReturnType<typeof useMutation>;
    });

    render(<WorkflowDraftEditorPage workflowTypeId="facilities_manutencao" version={1} />);

    await user.click(screen.getByRole('button', { name: /Salvar rascunho/i }));

    expect(mockSaveWorkflowDraft).toHaveBeenCalledTimes(1);
    expect(mockSaveWorkflowDraft).toHaveBeenCalledWith(
      expect.objectContaining({ uid: 'firebase-uid-1' }),
      'facilities_manutencao',
      1,
      expect.objectContaining({
        general: expect.any(Object),
        access: expect.any(Object),
        fields: expect.any(Array),
        steps: expect.any(Array),
      }),
    );
    expect(mockSaveWorkflowDraft.mock.calls[0][3]).not.toHaveProperty('initialStepId');
    expect(mockSaveWorkflowDraft.mock.calls[0][3].steps).toEqual([
      {
        stepId: 'start',
        stepName: 'Inicio',
        action: undefined,
      },
      {
        stepId: 'work',
        stepName: 'Execucao',
        action: {
          type: 'approval',
          label: 'Aprovar',
          approverCollaboratorDocIds: ['collab-apr1'],
          unresolvedApproverIds: [],
          commentRequired: false,
          attachmentRequired: false,
          commentPlaceholder: '',
          attachmentPlaceholder: '',
        },
      },
    ]);
  });

  it('exibe badge "Somente leitura" e desabilita salvar quando mode e read-only', () => {
    const readOnlyPayload = buildDraftPayload();
    readOnlyPayload.draft.mode = 'read-only';
    readOnlyPayload.draft.state = 'published';
    mockUseQuery.mockReturnValue({
      data: readOnlyPayload,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn().mockResolvedValue({ data: readOnlyPayload }),
    } as unknown as ReturnType<typeof useQuery>);

    render(<WorkflowDraftEditorPage workflowTypeId="facilities_manutencao" version={1} />);

    // Badge "Somente leitura" substitui o botao "Salvar rascunho":
    expect(screen.getByRole('button', { name: /Somente leitura/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Salvar rascunho/i })).toBeNull();
  });

  it('propaga onDirtyStateChange quando formulario e montado', () => {
    const onDirtyStateChange = jest.fn();

    render(
      <WorkflowDraftEditorPage
        workflowTypeId="facilities_manutencao"
        version={1}
        onDirtyStateChange={onDirtyStateChange}
      />,
    );

    // Chamada inicial (form limpo, modo edit):
    expect(onDirtyStateChange).toHaveBeenCalled();
    expect(onDirtyStateChange).toHaveBeenCalledWith({ isDirty: false, isReadOnly: false });
  });

  it('propaga shell state com hidratacao quando os dados estao resolvidos', () => {
    const onShellStateChange = jest.fn();

    render(
      <WorkflowDraftEditorPage
        workflowTypeId="facilities_manutencao"
        version={1}
        onShellStateChange={onShellStateChange}
      />,
    );

    expect(onShellStateChange).toHaveBeenCalled();
    expect(onShellStateChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isHydrated: true,
        isReadOnly: false,
      }),
    );
  });
});
