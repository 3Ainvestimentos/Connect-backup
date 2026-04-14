import { compareUnifiedListItems } from '../unified-sort';
import type { RequesterUnifiedV2ListItem, RequesterUnifiedLegacyListItem } from '../unified-types';

function makeV2Item(overrides: Partial<RequesterUnifiedV2ListItem> = {}): RequesterUnifiedV2ListItem {
  return {
    origin: 'v2' as const,
    detailKey: 'v2:1' as const,
    requestId: 1,
    displayRequestId: '1',
    workflowName: 'Test',
    statusLabel: 'Open',
    statusVariant: 'default' as const,
    expectedCompletionLabel: '-',
    expectedCompletionAt: null,
    submittedAt: null,
    lastUpdatedAt: null,
    raw: {} as any,
    ...overrides,
  };
}

function makeLegacyItem(overrides: Partial<RequesterUnifiedLegacyListItem> = {}): RequesterUnifiedLegacyListItem {
  return {
    origin: 'legacy' as const,
    detailKey: 'legacy:abc' as const,
    requestDocId: 'abc',
    displayRequestId: '0001',
    workflowName: 'Test',
    statusLabel: 'Pending',
    statusVariant: 'secondary' as const,
    expectedCompletionLabel: '-',
    expectedCompletionAt: null,
    submittedAt: null,
    lastUpdatedAt: null,
    raw: { request: {} as any, definition: null, workflowArea: null },
    ...overrides,
  };
}

describe('compareUnifiedListItems', () => {
  it('sorts by lastUpdatedAt desc', () => {
    const a = makeV2Item({ lastUpdatedAt: new Date('2026-04-10') });
    const b = makeV2Item({ lastUpdatedAt: new Date('2026-04-01') });
    expect(compareUnifiedListItems(a, b)).toBeLessThan(0);
    expect(compareUnifiedListItems(b, a)).toBeGreaterThan(0);
  });

  it('ties by submittedAt desc', () => {
    const a = makeV2Item({ lastUpdatedAt: new Date('2026-04-01'), submittedAt: new Date('2026-04-10') });
    const b = makeV2Item({ lastUpdatedAt: new Date('2026-04-01'), submittedAt: new Date('2026-04-01') });
    expect(compareUnifiedListItems(a, b)).toBeLessThan(0);
  });

  it('ties by origin (v2 before legacy)', () => {
    const v2 = makeV2Item({ lastUpdatedAt: null, submittedAt: null, detailKey: 'v2:1' });
    const legacy = makeLegacyItem({ lastUpdatedAt: null, submittedAt: null, detailKey: 'legacy:abc' });
    expect(compareUnifiedListItems(v2, legacy)).toBeLessThan(0);
    expect(compareUnifiedListItems(legacy, v2)).toBeGreaterThan(0);
  });

  it('ties by detailKey ascending', () => {
    const a = makeV2Item({ lastUpdatedAt: null, submittedAt: null, detailKey: 'v2:1' });
    const b = makeV2Item({ lastUpdatedAt: null, submittedAt: null, detailKey: 'v2:2' });
    expect(compareUnifiedListItems(a, b)).toBeLessThan(0);
  });

  it('handles null timestamps gracefully', () => {
    const a = makeV2Item({ lastUpdatedAt: null, submittedAt: null });
    const b = makeV2Item({ lastUpdatedAt: null, submittedAt: null });
    expect(compareUnifiedListItems(a, b)).toBe(0);
  });
});
