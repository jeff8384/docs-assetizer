import { PRIORITY_KEYWORDS, EXCLUDE_KEYWORDS } from '../config.js';
import { normalizeUrl } from './normalizeUrl.js';

/**
 * Score a URL path based on priority and exclude keyword lists.
 */
function scoreUrl(urlString: string): number {
  const path = urlString.toLowerCase();
  let score = 0;

  for (const keyword of PRIORITY_KEYWORDS) {
    if (path.includes(keyword)) {
      score += 2;
    }
  }

  for (const keyword of EXCLUDE_KEYWORDS) {
    if (path.includes(keyword)) {
      score -= 10;
    }
  }

  return score;
}

/**
 * Prioritize a list of discovered links:
 * 1. Always include the source URL first.
 * 2. Score remaining links and sort descending.
 * 3. Limit total to maxPages.
 */
export function prioritizeLinks(
  links: string[],
  sourceUrl: string,
  maxPages: number,
): string[] {
  const normalizedSource = normalizeUrl(sourceUrl) ?? sourceUrl;

  // Separate source from the rest
  const others = links.filter((l) => l !== normalizedSource);

  // Sort by score descending
  const sorted = others.sort((a, b) => scoreUrl(b) - scoreUrl(a));

  // Build final list: source first, then sorted others, capped at maxPages
  const result: string[] = [normalizedSource];
  for (const link of sorted) {
    if (result.length >= maxPages) break;
    result.push(link);
  }

  return result;
}
