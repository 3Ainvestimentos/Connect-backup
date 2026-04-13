/**
 * Extrai uma URL HTTPS a partir de uma URL solta ou do atributo src de um snippet <iframe>.
 */
export function parseIframeSrcFromInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.toLowerCase().includes("<iframe")) {
    const srcMatch = trimmed.match(/src\s*=\s*["']([^"']+)["']/i);
    if (!srcMatch?.[1]) return null;
    return normalizeToHttpsUrl(srcMatch[1].trim());
  }

  return normalizeToHttpsUrl(trimmed);
}

function normalizeToHttpsUrl(value: string): string | null {
  try {
    const u = new URL(value);
    if (u.protocol !== "https:") return null;
    return u.href;
  } catch {
    return null;
  }
}
