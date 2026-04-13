import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('lucide-react', () => {
  const Icon = () => <svg />;
  return new Proxy(
    {},
    {
      get: () => Icon,
    },
  );
});

import { WorkflowActionApproverPicker } from '../WorkflowActionApproverPicker';
import type { WorkflowConfigCollaboratorLookup } from '@/lib/workflows/admin-config/types';

const collaborators: WorkflowConfigCollaboratorLookup[] = [
  {
    collaboratorDocId: 'collab-apr1',
    userId: 'APR1',
    name: 'Ana Paula',
    email: 'ana.paula@3ariva.com.br',
    area: 'Facilities',
  },
  {
    collaboratorDocId: 'collab-apr2',
    userId: 'APR2',
    name: 'Bruno Souza',
    email: 'bruno@3ariva.com.br',
    area: 'Governanca',
  },
];

describe('WorkflowActionApproverPicker', () => {
  it('renderiza lista de colaboradores disponiveis', () => {
    render(
      <WorkflowActionApproverPicker
        collaborators={collaborators}
        selectedApprovers={[]}
        unresolvedApproverIds={[]}
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByText('Ana Paula')).toBeTruthy();
    expect(screen.getByText('Bruno Souza')).toBeTruthy();
    expect(screen.getByText('Nenhum aprovador selecionado.')).toBeTruthy();
  });

  it('mostra banner ambar quando ha unresolvedApproverIds', () => {
    render(
      <WorkflowActionApproverPicker
        collaborators={collaborators}
        selectedApprovers={[]}
        unresolvedApproverIds={['APR_GHOST']}
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(
      screen.getByText(/Alguns aprovadores anteriores nao puderam ser resolvidos/i),
    ).toBeTruthy();
  });

  it('limpar selecao chama onChange com arrays vazios', () => {
    const onChange = jest.fn();

    render(
      <WorkflowActionApproverPicker
        collaborators={collaborators}
        selectedApprovers={[
          {
            collaboratorDocId: 'collab-apr1',
            userId: 'APR1',
            name: 'Ana Paula',
            email: 'ana.paula@3ariva.com.br',
          },
        ]}
        unresolvedApproverIds={['APR_GHOST']}
        onChange={onChange}
      />,
    );

    // Desmarca o unico aprovador selecionado:
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([], []);
  });
});
