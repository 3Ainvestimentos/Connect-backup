import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AdminHistoryFilters, AdminHistoryListData } from '@/lib/workflows/admin-config/types';
import { HistoryFiltersBar } from '../HistoryFiltersBar';

const filterOptions: AdminHistoryListData['filterOptions'] = {
  origins: ['legacy', 'v2'],
  areas: [{ value: 'facilities', label: 'Facilities' }],
  workflows: [{ value: 'facilities_manutencao', label: 'Manutencao' }],
  owners: [{ value: 'SMO2', label: 'Owner Name' }],
  statusCategories: ['open', 'in_progress', 'waiting_action', 'finalized', 'archived'],
};

describe('HistoryFiltersBar', () => {
  it('captures draft changes and exposes an apply action', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const onClear = jest.fn();
    const onApply = jest.fn();
    const filters: AdminHistoryFilters = { limit: 50 };

    render(
      <HistoryFiltersBar
        filters={filters}
        filterOptions={filterOptions}
        onChange={onChange}
        onClear={onClear}
        onApply={onApply}
      />,
    );

    await user.type(screen.getByLabelText('Busca'), 'manutencao');
    await user.selectOptions(screen.getByLabelText('Origem'), 'legacy');
    await user.click(screen.getByRole('button', { name: /Aplicar filtros/i }));

    expect(onChange).toHaveBeenCalledWith({ limit: 50, query: 'm' });
    expect(onChange).toHaveBeenLastCalledWith({ limit: 50, origin: 'legacy' });
    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it('delegates clear action immediately', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const onClear = jest.fn();
    const onApply = jest.fn();

    render(
      <HistoryFiltersBar
        filters={{ limit: 50, query: 'abc' }}
        filterOptions={filterOptions}
        onChange={onChange}
        onClear={onClear}
        onApply={onApply}
      />,
    );

    await user.click(screen.getByRole('button', { name: /^Limpar$/i }));

    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
    expect(onApply).not.toHaveBeenCalled();
  });
});
