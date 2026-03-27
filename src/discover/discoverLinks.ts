import type { Page } from 'playwright';
import { NAV_SELECTORS } from '../config.js';
import { normalizeUrl } from './normalizeUrl.js';
import { dedupeUrls } from '../utils/dedupe.js';

/**
 * Discover all internal links from a page by querying nav/sidebar/content selectors.
 * Only links with the same origin as the source page are returned.
 */
export async function discoverLinks(sourceUrl: string, page: Page): Promise<string[]> {
  const sourceOrigin = new URL(sourceUrl).origin;

  // Collect all hrefs from every nav selector in one pass
  const allHrefs = await page.evaluate(
    ({ selectors }: { selectors: string[] }) => {
      const hrefs: string[] = [];
      for (const selector of selectors) {
        const elements = document.querySelectorAll<HTMLAnchorElement>(selector);
        elements.forEach((el) => {
          const href = el.getAttribute('href');
          if (href) {
            hrefs.push(href);
          }
        });
      }
      return hrefs;
    },
    { selectors: NAV_SELECTORS },
  );

  // Resolve relative URLs against the source, filter to same origin, normalize
  const normalized: string[] = [];
  for (const href of allHrefs) {
    try {
      const absolute = new URL(href, sourceUrl).toString();
      const norm = normalizeUrl(absolute);
      if (norm && new URL(norm).origin === sourceOrigin) {
        normalized.push(norm);
      }
    } catch {
      // Skip malformed hrefs
    }
  }

  return dedupeUrls(normalized);
}
