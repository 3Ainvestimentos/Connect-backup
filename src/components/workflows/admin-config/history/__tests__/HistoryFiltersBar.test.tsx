import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AdminHistoryFilters } from '@/lib/workflows/admin-config/types';
import { HistoryFiltersBar } from '../HistoryFiltersBar';

const filterOptions = {
  origins: ['legacy', 'v2'],
  areas: [{ value: 'facilities', label: 'Facilities' }],
  workflows: [{ value: 'facilities_manutencao', label: 'Manutencao' }],
  owners: [{ value: 'SMO2', label: 'Owner Name' }],
  statusCategories: ['open', 'in_progress', 'waiting_action', 'finalized', 'archived'],
};

describe('HistoryFiltersBar', () => {
  it('emits immediate filter changes without apply button', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const onClear = jest.fn();
    const filters: AdminHistoryFilters = { limit: 50 };

    render(
      <HistoryFiltersBar
        filters={filters}
        filterOptions={filterOptions}
        onChange={onChange}
        onClear={onClear}
      />,
    );

    await user.type(screen.getByLabelText('Busca'), 'manutencao');
    await user.selectOptions(screen.getByLabelText('Origem'), 'legacy');

    expect(onChange).toHaveBeenCalledWith({ limit: 50, query: 'm' });
    expect(onChange).toHaveBeenLastCalledWith({ limit: 50, origin: 'legacy' });
    expect(screen.queryByRole('button', { name: /Aplicar/i })).toBeNull();
  });

  it('delegates clear action immediately', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const onClear = jest.fn();

    render(
      <HistoryFiltersBar
        filters={{ limit: 50, query: 'abc' }}
        filterOptions={filterOptions}
        onChange={onChange}
        onClear={onClear}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Limpar filtros/i }));

    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
  });
});
