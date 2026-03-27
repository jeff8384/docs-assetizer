import { PRIORITY_KEYWORDS, EXCLUDE_KEYWORDS, DOCS_PATH_PREFIXES } from '../config.js';
import { normalizeUrl } from './normalizeUrl.js';

function scoreUrl(urlString: string): number {
  const lower = urlString.toLowerCase();
  const pathname = (() => { try { return new URL(urlString).pathname.toLowerCase(); } catch { return lower; } })();
  let score = 0;

  // Docs path prefix bonus
  if (DOCS_PATH_PREFIXES.some((p) => pathname.startsWith(p))) {
    score += 5;
  }

  // Priority keyword bonus
  for (const keyword of PRIORITY_KEYWORDS) {
    if (pathname.includes(keyword)) score += 2;
  }

  // Path depth penalty (deeply nested pages are lower priority)
  const depth = (pathname.match(/\//g) ?? []).length;
  score -= Math.max(0, depth - 3);

  // Exclude keyword hard penalty
  for (const keyword of EXCLUDE_KEYWORDS) {
    if (lower.includes(keyword)) score -= 20;
  }

  return score;
}

export function prioritizeLinks(
  links: string[],
  sourceUrl: string,
  maxPages: number,
): string[] {
  const normalizedSource = normalizeUrl(sourceUrl) ?? sourceUrl;

  const others = links.filter((l) => l !== normalizedSource);
  const sorted = others.sort((a, b) => scoreUrl(b) - scoreUrl(a));

  const result: string[] = [normalizedSource];
  for (const link of sorted) {
    if (result.length >= maxPages) break;
    result.push(link);
  }

  return result;
}
