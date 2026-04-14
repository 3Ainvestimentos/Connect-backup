import { legacyRequestToUnifiedListItem } from '../legacy-to-unified-list-item';
import { legacyRequestToUnifiedDetail } from '../legacy-to-unified-detail';
import { mockLegacyRequest, mockWorkflowDefinition, mockWorkflowArea } from '../../legacy/__tests__/fixtures';

describe('legacyRequestToUnifiedListItem', () => {
  it('creates a unified list item from legacy request', () => {
    const item = legacyRequestToUnifiedListItem(mockLegacyRequest, mockWorkflowDefinition, mockWorkflowArea);
    expect(item.origin).toBe('legacy');
    expect(item.detailKey).toBe('legacy:legacy-req-001');
    expect(item.displayRequestId).toBe('0001');
    expect(item.workflowName).toBe('vacation_request');
    expect(item.statusLabel).toBe('Em Andamento');
    expect(item.raw.request).toBe(mockLegacyRequest);
    expect(item.raw.definition).toBe(mockWorkflowDefinition);
    expect(item.raw.workflowArea).toBe(mockWorkflowArea);
  });

  it('handles null definition and workflowArea gracefully', () => {
    const item = legacyRequestToUnifiedListItem(mockLegacyRequest, null, null);
    expect(item.workflowName).toBe('vacation_request');
    expect(item.statusLabel).toBe('in_progress');
    expect(item.raw.definition).toBeNull();
    expect(item.raw.workflowArea).toBeNull();
  });
});

describe('legacyRequestToUnifiedDetail', () => {
  it('creates a unified detail from legacy request', () => {
    const detail = legacyRequestToUnifiedDetail(mockLegacyRequest, mockWorkflowDefinition, mockWorkflowArea);
    expect(detail.origin).toBe('legacy');
    expect(detail.detailKey).toBe('legacy:legacy-req-001');
    expect(detail.summary.requesterName).toBe('Joao Silva');
    expect(detail.summary.workflowName).toBe('vacation_request');
    expect(detail.summary.displayRequestId).toBe('0001');
    expect(detail.progress).toBeNull();
    expect(detail.fields.length).toBeGreaterThan(0);
    expect(detail.attachments.length).toBe(1);
    expect(detail.timeline.length).toBe(2);
  });

  it('has currentStepName as null for legacy', () => {
    const detail = legacyRequestToUnifiedDetail(mockLegacyRequest, mockWorkflowDefinition, mockWorkflowArea);
    expect(detail.summary.currentStepName).toBeNull();
  });
});
