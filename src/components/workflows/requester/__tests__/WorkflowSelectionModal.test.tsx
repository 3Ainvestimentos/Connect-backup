import { act, fireEvent, render, screen } from '@testing-library/react';
import { WorkflowSelectionModal } from '../WorkflowSelectionModal';
import type { RequesterCatalogArea } from '@/lib/workflows/requester/catalog-types';
import '@testing-library/jest-dom';

jest.mock('lucide-react', () => ({
  FileText: () => null,
  Heart: () => null,
}));

const mockArea: RequesterCatalogArea = {
  areaId: 'gente',
  areaName: 'Gente e Comunicacao',
  areaIcon: 'Heart',
  workflows: [
    {
      workflowTypeId: 'wf-1',
      name: 'Alteracao Cadastral',
      description: 'Solicitacao de alteracao cadastral nos bancos de dados da 3A RIVA.',
      icon: 'FileText',
    },
    {
      workflowTypeId: 'wf-2',
      name: 'Fale com a GENTE',
      description: 'Fale com a GENTE',
      icon: 'Heart',
    },
  ],
};

describe('WorkflowSelectionModal', () => {
  it('renders the compact legacy-inspired header and workflow cards', () => {
    render(
      <WorkflowSelectionModal
        open={true}
        onOpenChange={jest.fn()}
        area={mockArea}
        onWorkflowSelect={jest.fn()}
      />
    );

    expect(screen.getByText('Gente e Comunicacao')).toBeInTheDocument();
    expect(
      screen.getByText('Selecione um dos processos abaixo para iniciar uma nova solicitacao.')
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveClass('sm:max-w-md');
    expect(screen.getByRole('button', { name: 'Alteracao Cadastral' })).toHaveClass('hover:bg-muted/50');
    expect(
      screen.getByText('Solicitacao de alteracao cadastral nos bancos de dados da 3A RIVA.')
    ).toBeInTheDocument();
  });

  it('calls onWorkflowSelect when a workflow card is clicked', async () => {
    const handleWorkflowSelect = jest.fn();

    render(
      <WorkflowSelectionModal
        open={true}
        onOpenChange={jest.fn()}
        area={mockArea}
        onWorkflowSelect={handleWorkflowSelect}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Fale com a GENTE' }));
    });

    expect(handleWorkflowSelect).toHaveBeenCalledWith(mockArea.workflows[1]);
  });

  it('supports keyboard activation on workflow cards', async () => {
    const handleWorkflowSelect = jest.fn();

    render(
      <WorkflowSelectionModal
        open={true}
        onOpenChange={jest.fn()}
        area={mockArea}
        onWorkflowSelect={handleWorkflowSelect}
      />
    );

    await act(async () => {
      fireEvent.keyDown(screen.getByRole('button', { name: 'Alteracao Cadastral' }), {
        key: 'Enter',
        code: 'Enter',
      });
    });

    expect(handleWorkflowSelect).toHaveBeenCalledWith(mockArea.workflows[0]);
  });
});
