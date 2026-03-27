import type { Page, ElementHandle } from 'playwright';
import { cleanText } from './cleanText.js';

/**
 * Extract h1, h2, and h3 heading text from the given content element.
 */
export async function extractHeadings(
  page: Page,
  contentEl: ElementHandle<Element>,
): Promise<string[]> {
  const rawHeadings = await contentEl.$$eval(
    'h1, h2, h3',
    (els: Element[]) => els.map((el) => (el as HTMLElement).innerText || el.textContent || ''),
  );

  return rawHeadings
    .map((h) => cleanText(h))
    .filter((h) => h.length > 0);
}
