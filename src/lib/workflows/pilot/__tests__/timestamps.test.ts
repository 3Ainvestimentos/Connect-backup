import { normalizePilotTimestamp } from '../timestamps';

describe('normalizePilotTimestamp', () => {
  it('normalizes ISO strings', () => {
    expect(normalizePilotTimestamp('2026-03-27T10:20:00.000Z')?.toISOString()).toBe(
      '2026-03-27T10:20:00.000Z',
    );
  });

  it('normalizes serialized firebase timestamps', () => {
    expect(
      normalizePilotTimestamp({ seconds: 1_774_606_800, nanoseconds: 0 })?.toISOString(),
    ).toBe('2026-03-27T10:20:00.000Z');
  });

  it('returns null for empty values', () => {
    expect(normalizePilotTimestamp(null)).toBeNull();
  });
});
