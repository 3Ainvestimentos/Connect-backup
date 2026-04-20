import { getFileNameFromUrl } from '../get-file-name-from-url';

describe('getFileNameFromUrl', () => {
  it('extracts and decodes the file name from a URL', () => {
    expect(
      getFileNameFromUrl('https://example.com/uploads/foto%20teste.png?alt=media'),
    ).toBe('foto teste.png');
  });

  it('falls back to Arquivo when the url does not have a path segment', () => {
    expect(getFileNameFromUrl('')).toBe('Arquivo');
  });

  it('returns the raw segment when decodeURIComponent fails', () => {
    expect(getFileNameFromUrl('https://example.com/uploads/%E0%A4%A.png')).toBe(
      '%E0%A4%A.png',
    );
  });
});
