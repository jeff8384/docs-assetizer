import type { Page } from 'playwright';
import { NAV_SELECTORS, DOCS_PATH_PREFIXES, EXCLUDE_KEYWORDS } from '../config.js';
import { normalizeUrl } from './normalizeUrl.js';
import { dedupeUrls } from '../utils/dedupe.js';

function isExcluded(url: string): boolean {
  const lower = url.toLowerCase();
  return EXCLUDE_KEYWORDS.some((kw) => lower.includes(kw));
}

function hasDocsPrefix(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  return DOCS_PATH_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

/**
 * Discover all doc-relevant internal links from a page.
 *
 * Strategy:
 * 1. Query all NAV_SELECTORS
 * 2. Filter: same-origin, not excluded
 * 3. Boost links whose path starts with a known docs prefix
 * 4. Return deduped, docs-prefixed links first
 */
export async function discoverLinks(sourceUrl: string, page: Page): Promise<string[]> {
  const sourceOrigin = new URL(sourceUrl).origin;

  const allHrefs = await page.evaluate(
    ({ selectors }: { selectors: string[] }) => {
      const seen = new Set<string>();
      const hrefs: string[] = [];
      for (const selector of selectors) {
        try {
          const elements = document.querySelectorAll<HTMLAnchorElement>(selector);
          elements.forEach((el) => {
            const href = el.getAttribute('href');
            if (href && !seen.has(href)) {
              seen.add(href);
              hrefs.push(href);
            }
          });
        } catch {
          // Ignore invalid selectors
        }
      }
      return hrefs;
    },
    { selectors: NAV_SELECTORS },
  );

  const docsPrefixed: string[] = [];
  const others: string[] = [];

  for (const href of allHrefs) {
    try {
      const absolute = new URL(href, sourceUrl).toString();
      const norm = normalizeUrl(absolute);
      if (!norm) continue;

      const parsed = new URL(norm);
      if (parsed.origin !== sourceOrigin) continue;
      if (isExcluded(norm)) continue;

      if (hasDocsPrefix(parsed.pathname)) {
        docsPrefixed.push(norm);
      } else {
        others.push(norm);
      }
    } catch {
      // Skip malformed hrefs
    }
  }

  // Docs-prefixed links first, then others
  return dedupeUrls([...docsPrefixed, ...others]);
}
