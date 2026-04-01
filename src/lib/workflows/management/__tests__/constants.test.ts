import {
  MANAGEMENT_DEFAULT_TAB,
  MANAGEMENT_SHELL_TABS,
  WORKFLOW_MANAGEMENT_ROUTE,
} from '../constants';

describe('workflow management constants', () => {
  it('keeps the official route stable', () => {
    expect(WORKFLOW_MANAGEMENT_ROUTE).toBe('/gestao-de-chamados');
  });

  it('keeps the tab ids valid and in the expected order', () => {
    expect(MANAGEMENT_DEFAULT_TAB).toBe('current');
    expect(MANAGEMENT_SHELL_TABS.map((tab) => tab.tab)).toEqual([
      'current',
      'assignments',
      'completed',
    ]);
  });
});
