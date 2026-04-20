import { render, screen } from '@testing-library/react';
import { buildManagementRequestDetailFixture } from '@/lib/workflows/management/__tests__/request-detail-test-data';
import { RequestSubmittedDataSection } from '../RequestSubmittedDataSection';

describe('RequestSubmittedDataSection', () => {
  it('renders fields, extra fields and attachment affordances in one section', () => {
    const detail = buildManagementRequestDetailFixture();

    render(
      <RequestSubmittedDataSection
        formData={detail.formData}
        attachments={detail.attachments}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Dados enviados' })).toBeTruthy();
    expect(screen.getByText('Campos enviados')).toBeTruthy();
    expect(screen.getByText('Campos extras')).toBeTruthy();
    expect(screen.queryByText('Anexos da abertura')).toBeNull();
    const fieldLabels = screen.getAllByText(/Nome e Sobrenome|Anexo da planilha/).map((node) => node.textContent);
    expect(fieldLabels).toEqual(['Nome e Sobrenome', 'Anexo da planilha']);
    expect(screen.getByText('planilha.pdf')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Ver anexo' }).getAttribute('href')).toBe(
      'https://example.com/planilha.pdf',
    );
    expect(screen.queryByRole('link', { name: 'Baixar anexo' })).toBeNull();
  });

  it('renders the empty state when the submission has no visible data', () => {
    render(
      <RequestSubmittedDataSection
        formData={{ fields: [], extraFields: [] }}
        attachments={[]}
      />,
    );

    expect(
      screen.getByText('Nenhum campo nem anexo da submissão inicial foi exposto pelo contrato oficial.'),
    ).toBeTruthy();
  });
});
