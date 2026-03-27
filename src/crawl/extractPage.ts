import type { Page } from 'playwright';
import type { PageAsset } from '../types/index.js';
import { extractMainContent } from '../extract/extractMainContent.js';
import { extractHeadings } from '../extract/extractHeadings.js';
import { extractCodeBlocks } from '../extract/extractCodeBlocks.js';
import { cleanText } from '../extract/cleanText.js';
import { normalizeUrl } from '../discover/normalizeUrl.js';
import { dedupeUrls } from '../utils/dedupe.js';

/**
 * Extract structured content from the current page state.
 * Tries main content selectors first, falls back to body.
 */
export async function extractPage(page: Page, pageUrl: string): Promise<PageAsset> {
  const title = cleanText(await page.title());
  const origin = new URL(pageUrl).origin;

  // Find main content element
  const contentEl = await extractMainContent(page);

  let headings: string[] = [];
  let contentBlocks: string[] = [];
  let codeBlocks: { language?: string; code: string }[] = [];
  let links: string[] = [];

  if (contentEl) {
    headings = await extractHeadings(page, contentEl);
    codeBlocks = await extractCodeBlocks(page, contentEl);

    // Extract paragraph and list item text blocks
    const rawBlocks = await contentEl.$$eval(
      'p, li',
      (els: Element[]) =>
        els.map((el) => (el as HTMLElement).innerText || el.textContent || ''),
    );
    contentBlocks = rawBlocks
      .map((b) => cleanText(b))
      .filter((b) => b.length > 20);

    // Extract internal links
    const rawLinks = await contentEl.$$eval(
      'a[href]',
      (els: Element[]) => els.map((el) => el.getAttribute('href') ?? ''),
    );
    const resolvedLinks: string[] = [];
    for (const href of rawLinks) {
      try {
        const absolute = new URL(href, pageUrl).toString();
        const norm = normalizeUrl(absolute);
        if (norm && new URL(norm).origin === origin) {
          resolvedLinks.push(norm);
        }
      } catch {
        // Skip malformed href
      }
    }
    links = dedupeUrls(resolvedLinks);
  }

  return { url: pageUrl, title, headings, contentBlocks, codeBlocks, links };
}
