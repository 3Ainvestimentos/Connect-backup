export function getFileNameFromUrl(url: string): string {
  const rawName = url.split('/').pop()?.split('?')[0]?.trim() || 'Arquivo';

  try {
    return decodeURIComponent(rawName);
  } catch {
    return rawName;
  }
}
