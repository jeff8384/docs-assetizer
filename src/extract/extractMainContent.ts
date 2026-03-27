import type { Page, ElementHandle } from 'playwright';
import { CONTENT_SELECTORS, MIN_CONTENT_LENGTH } from '../config.js';

/**
 * Find the main content element on a page by trying CONTENT_SELECTORS in order.
 * Returns the first element whose text content length meets MIN_CONTENT_LENGTH,
 * or null if none match.
 */
export async function extractMainContent(
  page: Page,
): Promise<ElementHandle<Element> | null> {
  for (const selector of CONTENT_SELECTORS) {
    try {
      const el = await page.$(selector);
      if (!el) continue;

      const text = await el.textContent();
      if (text && text.length >= MIN_CONTENT_LENGTH) {
        return el;
      }
    } catch {
      // Selector failed; try the next one
    }
  }

  // Fallback: return the body element
  return page.$('body');
}
