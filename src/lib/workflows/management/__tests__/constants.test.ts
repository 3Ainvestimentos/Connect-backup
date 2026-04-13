import {
  MANAGEMENT_DEFAULT_ASSIGNMENTS_SUBTAB,
  MANAGEMENT_DEFAULT_CURRENT_FILTER,
  MANAGEMENT_DEFAULT_TAB,
  MANAGEMENT_TAB_DEFINITIONS,
  WORKFLOW_MANAGEMENT_ROUTE,
} from '../constants';

describe('workflow management constants', () => {
  it('keeps the official route stable', () => {
    expect(WORKFLOW_MANAGEMENT_ROUTE).toBe('/gestao-de-chamados');
  });

  it('keeps the tab ids valid and in the expected order', () => {
    expect(MANAGEMENT_DEFAULT_TAB).toBe('assignments');
    expect(MANAGEMENT_DEFAULT_ASSIGNMENTS_SUBTAB).toBe('assigned');
    expect(MANAGEMENT_DEFAULT_CURRENT_FILTER).toBe('all');
    expect(MANAGEMENT_TAB_DEFINITIONS.map((tab) => tab.tab)).toEqual([
      'current',
      'assignments',
      'completed',
    ]);
  });
});
