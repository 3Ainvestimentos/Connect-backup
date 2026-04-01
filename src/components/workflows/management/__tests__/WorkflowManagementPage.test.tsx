import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkflowManagementPage } from '../WorkflowManagementPage';

describe('WorkflowManagementPage', () => {
  it('renders the official header, transition context and placeholder tabs', () => {
    render(<WorkflowManagementPage />);

    expect(screen.getByRole('heading', { name: 'Gestao de chamados' })).toBeTruthy();
    expect(
      screen.getByText(
        'Nova central oficial da operacao, entregue de forma incremental a partir da Fase 2A.',
      ),
    ).toBeTruthy();
    expect(screen.getByText('Transicao da superficie operacional')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Chamados atuais' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Atribuicoes e acoes' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Concluidas' })).toBeTruthy();
    expect(screen.getByText('Proxima entrega: bootstrap e lista do owner.')).toBeTruthy();
  });

  it('updates the placeholder content when the user switches tabs', async () => {
    const user = userEvent.setup();

    render(<WorkflowManagementPage />);

    const completedTab = screen.getByRole('tab', { name: 'Concluidas' });
    await user.click(completedTab);

    expect(completedTab.getAttribute('data-state')).toBe('active');
    expect(screen.getByText('O historico oficial sera conectado na 2A.2.')).toBeTruthy();
    expect(screen.getByText('Proxima entrega: lista concluida oficial.')).toBeTruthy();
    expect(
      screen.getByText(
        'Sem dados reais nesta etapa: este shell nao simula lista vazia, contadores ou detalhe operacional.',
      ),
    ).toBeTruthy();
  });
});
