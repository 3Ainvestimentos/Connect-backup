import { render, screen } from '@testing-library/react';
import { RequesterSubmittedDataSection } from '../RequesterSubmittedDataSection';

describe('RequesterSubmittedDataSection', () => {
  it('renders fields and attachments inline preserving the submitted order', () => {
    render(
      <RequesterSubmittedDataSection
        fields={[
          {
            fieldId: 'motivo',
            label: 'Motivo da compra',
            value: 'Notebook',
            type: 'textarea',
            order: 0,
          },
          {
            fieldId: 'criticidade',
            label: 'Nível de criticidade',
            value: 'Alta',
            type: 'select',
            order: 2,
          },
        ]}
        attachments={[
          {
            fieldId: 'anexo_complementar',
            label: 'Anexos complementares',
            url: 'https://example.com/uploads/Refact-workflow-5.jpg?alt=media',
            fileName: 'Refact-workflow-5.jpg',
            order: 1,
          },
        ]}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Dados enviados' })).toBeInTheDocument();
    expect(screen.queryByText('Anexos')).toBeNull();
    expect(screen.getByRole('link', { name: 'Ver anexo' }).getAttribute('href')).toBe(
      'https://example.com/uploads/Refact-workflow-5.jpg?alt=media',
    );

    const labels = screen
      .getAllByText(/Motivo da compra|Anexos complementares|Nível de criticidade/)
      .map((node) => node.textContent);
    expect(labels).toEqual([
      'Motivo da compra',
      'Anexos complementares',
      'Nível de criticidade',
    ]);
  });

  it('suppresses duplicated file fields when an attachment with the same fieldId exists', () => {
    render(
      <RequesterSubmittedDataSection
        fields={[
          {
            fieldId: 'anexo_complementar',
            label: 'Anexos complementares',
            value: 'https://example.com/uploads/Refact-workflow-5.jpg?alt=media',
            type: 'file',
            order: 1,
          },
        ]}
        attachments={[
          {
            fieldId: 'anexo_complementar',
            label: 'Anexos complementares',
            url: 'https://example.com/uploads/Refact-workflow-5.jpg?alt=media',
            fileName: 'Refact-workflow-5.jpg',
            order: 1,
          },
        ]}
      />,
    );

    expect(screen.getAllByText('Anexos complementares')).toHaveLength(1);
  });
});
