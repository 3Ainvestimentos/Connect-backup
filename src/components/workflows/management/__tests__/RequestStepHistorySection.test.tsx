import { render, screen } from '@testing-library/react';
import { buildManagementRequestDetailFixture } from '@/lib/workflows/management/__tests__/request-detail-test-data';
import { RequestStepHistorySection } from '../RequestStepHistorySection';

jest.mock('lucide-react', () => ({
  ChevronDown: () => null,
}));

describe('RequestStepHistorySection', () => {
  it('renders the enriched step history with the current step expanded by default', () => {
    const detail = buildManagementRequestDetailFixture();

    render(
      <RequestStepHistorySection
        stepsHistory={detail.stepsHistory}
        progress={detail.progress}
        timeline={detail.timeline}
        hasLegacyFallback={false}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Histórico do chamado' })).toBeTruthy();
    expect(screen.getByText('Etapa 3: Execucao')).toBeTruthy();
    expect(screen.getByText('Etapa iniciada')).toBeTruthy();
    expect(screen.getByText('Respostas de action')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Abrir anexo da resposta' }).getAttribute('href')).toBe(
      'https://example.com/resposta.pdf',
    );
  });

  it('renders the temporary legacy fallback when stepsHistory is absent', () => {
    const detail = buildManagementRequestDetailFixture({ stepsHistory: undefined });

    render(
      <RequestStepHistorySection
        stepsHistory={detail.stepsHistory}
        progress={detail.progress}
        timeline={detail.timeline}
        hasLegacyFallback
      />,
    );

    expect(screen.getByText('Compatibilidade temporária')).toBeTruthy();
    expect(screen.getByText('Progresso')).toBeTruthy();
    expect(screen.getByText('Timeline')).toBeTruthy();
  });
});
