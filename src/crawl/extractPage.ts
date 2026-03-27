import type { Page } from 'playwright';
import type { PageAsset } from '../types/index.js';
import { extractMainContent } from '../extract/extractMainContent.js';
import { extractHeadings } from '../extract/extractHeadings.js';
import { extractCodeBlocks } from '../extract/extractCodeBlocks.js';
import { extractTables } from '../extract/extractTables.js';
import { extractCallouts } from '../extract/extractCallouts.js';
import { cleanText } from '../extract/cleanText.js';
import { normalizeUrl } from '../discover/normalizeUrl.js';
import { dedupeUrls } from '../utils/dedupe.js';
import { classifyPageSection } from '../synthesize/classifySection.js';

/**
 * Extract structured content from the current page state.
 */
export async function extractPage(page: Page, pageUrl: string): Promise<PageAsset> {
  const title = cleanText(await page.title());
  const origin = new URL(pageUrl).origin;

  const contentEl = await extractMainContent(page);

  let headings: string[] = [];
  let contentBlocks: string[] = [];
  let codeBlocks: { language?: string; code: string }[] = [];
  let tables: import('../types/index.js').TableAsset[] = [];
  let callouts: import('../types/index.js').CalloutAsset[] = [];
  let links: string[] = [];

  if (contentEl) {
    headings = await extractHeadings(page, contentEl);
    codeBlocks = await extractCodeBlocks(page, contentEl);
    tables = await extractTables(contentEl);
    callouts = await extractCallouts(contentEl);

    // Expanded content block selectors: p, li, dt, dd, blockquote, table td
    const rawBlocks = await contentEl.$$eval(
      'p, li, dt, dd, blockquote, td',
      (els: Element[]) =>
        els.map((el) => (el as HTMLElement).innerText || el.textContent || ''),
    );
    contentBlocks = rawBlocks
      .map((b) => cleanText(b))
      .filter((b) => b.length > 20);

    // Internal links
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

  const section = classifyPageSection(pageUrl, title, headings);

  return { url: pageUrl, title, headings, contentBlocks, codeBlocks, tables, callouts, links, section };
}
