import { deriveLegacyWorkflowName } from '../derive-legacy-workflow-name';
import { deriveLegacyStatusLabel } from '../derive-legacy-status-label';
import { deriveLegacyArea } from '../derive-legacy-area';
import { deriveLegacyExpectedCompletion } from '../derive-legacy-expected-completion';
import { deriveLegacyAttachments } from '../derive-legacy-attachments';
import { deriveLegacyTimeline } from '../derive-legacy-timeline';
import { resolveLegacyIdentity } from '../resolve-legacy-identity';
import {
  mockLegacyRequest,
  mockWorkflowDefinition,
  mockWorkflowArea,
  mockLegacyRequestNoFormData,
} from './fixtures';

describe('deriveLegacyWorkflowName', () => {
  it('returns definition.name when available', () => {
    expect(deriveLegacyWorkflowName(mockLegacyRequest, mockWorkflowDefinition)).toBe('vacation_request');
  });

  it('falls back to request.type when definition is null', () => {
    expect(deriveLegacyWorkflowName(mockLegacyRequest, null)).toBe('vacation_request');
  });

  it('returns "-" when both are missing', () => {
    expect(deriveLegacyWorkflowName({ type: '' }, null)).toBe('-');
  });
});

describe('deriveLegacyStatusLabel', () => {
  it('returns label from definition.statuses', () => {
    expect(deriveLegacyStatusLabel(mockLegacyRequest, mockWorkflowDefinition)).toBe('Em Andamento');
  });

  it('falls back to request.status when definition is null', () => {
    expect(deriveLegacyStatusLabel({ status: 'custom_status' }, null)).toBe('custom_status');
  });

  it('returns "-" when status is missing', () => {
    expect(deriveLegacyStatusLabel({ status: '' }, null)).toBe('');
  });
});

describe('deriveLegacyArea', () => {
  it('resolves areaId and label', () => {
    const result = deriveLegacyArea(mockWorkflowDefinition, mockWorkflowArea);
    expect(result.areaId).toBe('area-hr');
    expect(result.areaLabel).toBe('Recursos Humanos');
  });

  it('falls back to areaId when workflowArea is null', () => {
    const result = deriveLegacyArea(mockWorkflowDefinition, null);
    expect(result.areaId).toBe('area-hr');
    expect(result.areaLabel).toBe('area-hr');
  });

  it('returns "-" when definition is null', () => {
    const result = deriveLegacyArea(null, mockWorkflowArea);
    expect(result.areaId).toBe('-');
    expect(result.areaLabel).toBe('Recursos Humanos');
  });
});

describe('deriveLegacyExpectedCompletion', () => {
  it('calculates SLA date using defaultSlaDays', () => {
    const result = deriveLegacyExpectedCompletion(mockLegacyRequest, mockWorkflowDefinition);
    expect(result.expectedCompletionAt).toBeInstanceOf(Date);
    expect(result.expectedCompletionLabel).not.toBe('-');
  });

  it('returns null when definition is missing', () => {
    const result = deriveLegacyExpectedCompletion(mockLegacyRequest, null);
    expect(result.expectedCompletionAt).toBeNull();
    expect(result.expectedCompletionLabel).toBe('-');
  });

  it('returns null when submittedAt is invalid', () => {
    const result = deriveLegacyExpectedCompletion(
      { submittedAt: 'invalid-date', formData: {} },
      mockWorkflowDefinition,
    );
    expect(result.expectedCompletionAt).toBeNull();
    expect(result.expectedCompletionLabel).toBe('-');
  });
});

describe('deriveLegacyAttachments', () => {
  it('extracts file fields from formData', () => {
    const attachments = deriveLegacyAttachments(mockLegacyRequest, mockWorkflowDefinition);
    expect(attachments).toHaveLength(1);
    expect(attachments[0].fieldId).toBe('attachment');
    expect(attachments[0].label).toBe('Anexo');
    expect(attachments[0].url).toBe('https://storage.example.com/file.pdf');
  });

  it('falls back to URL detection without definition', () => {
    const attachments = deriveLegacyAttachments(mockLegacyRequest, null);
    expect(attachments.length).toBeGreaterThanOrEqual(1);
    expect(attachments[0].url).toBe('https://storage.example.com/file.pdf');
  });

  it('returns empty array when no file fields', () => {
    const attachments = deriveLegacyAttachments(mockLegacyRequestNoFormData, mockWorkflowDefinition);
    expect(attachments).toHaveLength(0);
  });
});

describe('deriveLegacyTimeline', () => {
  it('converts history to timeline sorted desc', () => {
    const timeline = deriveLegacyTimeline(mockLegacyRequest, mockWorkflowDefinition);
    expect(timeline.length).toBe(2);
    // Most recent first
    expect(timeline[0].label).toBe('Em Andamento');
    expect(timeline[1].label).toBe('Pendente');
  });

  it('returns empty array when history is empty', () => {
    const timeline = deriveLegacyTimeline({ history: [] }, mockWorkflowDefinition);
    expect(timeline).toEqual([]);
  });

  it('falls back to status id when definition is null', () => {
    const timeline = deriveLegacyTimeline(mockLegacyRequest, null);
    expect(timeline[0].label).toBe('in_progress');
  });
});

describe('resolveLegacyIdentity', () => {
  it('resolves id3a from collaborator email', () => {
    const collaborators = [{ id: 'c1', id3a: 'user001', email: 'joao@3ainvestimentos.com.br', name: 'Joao' } as any];
    const user = { email: 'joao@3ariva.com.br' } as any;
    const result = resolveLegacyIdentity(user, collaborators);
    expect(result.resolved).toBe(true);
    expect(result.id3a).toBe('user001');
  });

  it('returns resolved: false when user is null', () => {
    const result = resolveLegacyIdentity(null, []);
    expect(result.resolved).toBe(false);
  });

  it('returns resolved: false when email does not match', () => {
    const collaborators = [{ id: 'c1', id3a: 'user001', email: 'other@3ainvestimentos.com.br', name: 'Other' } as any];
    const user = { email: 'unknown@3ainvestimentos.com.br' } as any;
    const result = resolveLegacyIdentity(user, collaborators);
    expect(result.resolved).toBe(false);
  });
});
