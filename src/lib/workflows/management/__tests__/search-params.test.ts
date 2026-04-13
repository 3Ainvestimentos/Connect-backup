import {
  parseManagementSearchParams,
  serializeManagementSearchParams,
} from '../search-params';

describe('workflow management search params', () => {
  it('parses the official URL contract into view state', () => {
    const params = new URLSearchParams(
      'tab=completed&subtab=pending&queue=waiting_action&requestId=801&workflow=facilities&area=ops&requester=alice&sla=at_risk&from=2026-03-01&to=2026-03-31',
    );

    expect(parseManagementSearchParams(params)).toEqual({
      activeTab: 'completed',
      assignmentsSubtab: 'pending',
      currentFilter: 'waiting_action',
      filters: {
        requestId: 801,
        workflowTypeId: 'facilities',
        areaId: 'ops',
        requesterQuery: 'alice',
        slaState: 'at_risk',
        periodFrom: '2026-03-01',
        periodTo: '2026-03-31',
      },
    });
  });

  it('serializes only the active non-default values needed to restore the state', () => {
    const params = serializeManagementSearchParams({
      activeTab: 'completed',
      assignmentsSubtab: 'pending',
      currentFilter: 'waiting_action',
      filters: {
        requestId: 801,
        workflowTypeId: 'facilities',
        areaId: 'ops',
        requesterQuery: 'alice',
        slaState: 'at_risk',
      },
    });

    expect(params.toString()).toBe(
      'tab=completed&subtab=pending&queue=waiting_action&requestId=801&workflow=facilities&area=ops&requester=alice&sla=at_risk',
    );
  });
});
