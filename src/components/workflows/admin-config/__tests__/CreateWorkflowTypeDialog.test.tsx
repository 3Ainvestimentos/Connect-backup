import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { useWorkflowAreas } from '@/contexts/WorkflowAreasContext';
import { createWorkflowArea, createWorkflowType } from '@/lib/workflows/admin-config/api-client';
import { CreateWorkflowAreaDialog } from '../CreateWorkflowAreaDialog';
import { CreateWorkflowTypeDialog } from '../CreateWorkflowTypeDialog';

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/contexts/CollaboratorsContext', () => ({
  useCollaborators: jest.fn(),
}));

jest.mock('@/contexts/WorkflowAreasContext', () => ({
  useWorkflowAreas: jest.fn(),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

jest.mock('@/lib/workflows/admin-config/api-client', () => ({
  createWorkflowArea: jest.fn(),
  createWorkflowType: jest.fn(),
}));

jest.mock('@/components/admin/RecipientSelectionModal', () => ({
  RecipientSelectionModal: ({ isOpen, onConfirm }: { isOpen: boolean; onConfirm: (ids: string[]) => void }) =>
    isOpen ? <button onClick={() => onConfirm(['SMO2'])}>confirm-recipient-modal</button> : null,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('lucide-react', () => {
  const Icon = () => <svg />;
  return new Proxy({}, { get: () => Icon });
});

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseCollaborators = useCollaborators as jest.MockedFunction<typeof useCollaborators>;
const mockUseWorkflowAreas = useWorkflowAreas as jest.MockedFunction<typeof useWorkflowAreas>;
const mockCreateWorkflowArea = createWorkflowArea as jest.MockedFunction<typeof createWorkflowArea>;
const mockCreateWorkflowType = createWorkflowType as jest.MockedFunction<typeof createWorkflowType>;

describe('workflow config creation dialogs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as typeof globalThis & { ResizeObserver?: typeof ResizeObserver }).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
    mockUseAuth.mockReturnValue({ user: { uid: 'firebase-uid-1' } } as ReturnType<typeof useAuth>);
    mockUseCollaborators.mockReturnValue({
      collaborators: [
        {
          id: '1',
          id3a: 'SMO2',
          name: 'Owner Name',
          email: 'owner@3ariva.com.br',
        },
      ],
    } as ReturnType<typeof useCollaborators>);
    mockUseWorkflowAreas.mockReturnValue({
      workflowAreas: [
        {
          id: 'facilities',
          name: 'Facilities',
          icon: 'Building',
          storageFolderPath: 'facilities',
        },
      ],
    } as ReturnType<typeof useWorkflowAreas>);
  });

  it('creates an area without exposing storageFolderPath', async () => {
    const user = userEvent.setup();
    mockCreateWorkflowArea.mockResolvedValue({
      areaId: 'facilities',
      name: 'Facilities',
      icon: 'Building',
    });

    render(<CreateWorkflowAreaDialog open={true} onOpenChange={jest.fn()} onCreated={jest.fn()} />);

    expect(screen.queryByLabelText(/storageFolderPath/i)).toBeNull();

    await user.type(screen.getByLabelText('Nome da area'), 'Facilities');
    await user.click(screen.getByRole('button', { name: 'Criar area' }));

    expect(mockCreateWorkflowArea).toHaveBeenCalledWith(
      expect.objectContaining({ uid: 'firebase-uid-1' }),
      expect.objectContaining({ name: 'Facilities' }),
    );
  });

  it('switches access mode from all to specific and submits a new workflow type', async () => {
    const user = userEvent.setup();
    mockCreateWorkflowType.mockResolvedValue({
      workflowTypeId: 'facilities_manutencao_predial',
      version: 1,
      editorPath: '/admin/request-config/facilities_manutencao_predial/versions/1/edit',
    });

    render(
      <CreateWorkflowTypeDialog
        open={true}
        onOpenChange={jest.fn()}
      />,
    );

    await user.type(screen.getByLabelText('Nome'), 'Manutencao Predial');
    await user.type(screen.getByLabelText('Descricao'), 'Chamados prediais');
    await user.click(screen.getByText('Lista especifica'));
    await user.click(screen.getByRole('button', { name: /Selecionar lista/i }));
    fireEvent.click(screen.getByText('confirm-recipient-modal'));
    await user.click(screen.getByRole('button', { name: /Criar e abrir rascunho/i }));

    expect(screen.getByText('Acesso restrito a 1 colaborador')).toBeTruthy();
    expect(mockCreateWorkflowType).toHaveBeenCalledWith(
      expect.objectContaining({ uid: 'firebase-uid-1' }),
      expect.objectContaining({
        name: 'Manutencao Predial',
        allowedUserIds: ['SMO2'],
      }),
    );
  });
});
