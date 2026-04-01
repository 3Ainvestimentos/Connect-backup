import {
  getManagementActiveFilterChips,
  getManagementEmptyStateCopy,
  hasManagementActiveFilters,
  sortManagementMonthGroups,
} from '../presentation';

describe('workflow management presentation helpers', () => {
  it('detects when the official toolbar has active filters', () => {
    expect(
      hasManagementActiveFilters({
        requesterQuery: 'Alice',
      }),
    ).toBe(true);

    expect(hasManagementActiveFilters({})).toBe(false);
  });

  it('derives readable chips for active filters using known option labels', () => {
    expect(
      getManagementActiveFilterChips(
        {
          requestId: 801,
          requesterQuery: 'Alice',
          workflowTypeId: 'facilities',
          areaId: 'ops',
          slaState: 'at_risk',
          periodFrom: '2026-03-01',
          periodTo: '2026-03-31',
        },
        {
          workflows: [
            {
              workflowTypeId: 'facilities',
              workflowName: 'Facilities',
              areaId: 'ops',
            },
          ],
          areas: [
            {
              areaId: 'ops',
              label: 'Operacoes',
            },
          ],
        },
      ),
    ).toEqual([
      { key: 'requestId', label: 'Chamado: #801' },
      { key: 'requesterQuery', label: 'Solicitante: Alice' },
      { key: 'workflowTypeId', label: 'Workflow: Facilities' },
      { key: 'areaId', label: 'Area: Operacoes' },
      { key: 'slaState', label: 'SLA: Em risco' },
      { key: 'periodFrom', label: 'De: 01/03/2026' },
      { key: 'periodTo', label: 'Ate: 31/03/2026' },
    ]);
  });

  it('sorts month groups from newest to oldest and leaves unknown last', () => {
    expect(
      sortManagementMonthGroups([
        { monthKey: 'unknown', items: [] },
        { monthKey: '2026-01', items: [] },
        { monthKey: '2026-03', items: [] },
      ]).map((group) => group.monthKey),
    ).toEqual(['2026-03', '2026-01', 'unknown']);
  });

  it('returns contextual empty state copy for permission, filter and natural empty cases', () => {
    expect(
      getManagementEmptyStateCopy({
        activeTab: 'current',
        hasActiveFilters: false,
        canViewTab: false,
      }),
    ).toEqual({
      title: 'Aba indisponivel para este perfil',
      description:
        'Esta visao depende de ownership ou capability operacional que nao esta ativa para voce.',
    });

    expect(
      getManagementEmptyStateCopy({
        activeTab: 'assignments',
        hasActiveFilters: true,
        canViewTab: true,
      }),
    ).toEqual({
      title: 'Nenhum resultado para os filtros aplicados',
      description: 'Ajuste ou limpe os filtros para ampliar a busca nesta visao.',
    });

    expect(
      getManagementEmptyStateCopy({
        activeTab: 'completed',
        hasActiveFilters: false,
        canViewTab: true,
      }),
    ).toEqual({
      title: 'Nenhum chamado concluido neste escopo',
      description:
        'Concluidos e arquivados aparecem aqui assim que houver historico dentro do seu recorte operacional.',
    });
  });
});
