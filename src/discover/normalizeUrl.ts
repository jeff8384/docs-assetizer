/**
 * Normalize a URL for deduplication and comparison:
 * - Remove hash fragments (#...)
 * - Remove trailing slash (except root path "/")
 * - Remove query strings
 * Returns the normalized URL string, or null if the input is not a valid URL.
 */
export function normalizeUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  // Drop hash and query
  url.hash = '';
  url.search = '';

  // Remove trailing slash from non-root paths
  if (url.pathname !== '/' && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
  }

  return url.toString();
}
