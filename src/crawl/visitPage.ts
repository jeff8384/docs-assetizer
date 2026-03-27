import type { Page } from 'playwright';
import type { PageAsset } from '../types/index.js';
import { DEFAULT_TIMEOUT } from '../config.js';
import { extractPage } from './extractPage.js';
import { logger } from '../utils/logger.js';

/**
 * Navigate to a URL and extract page content.
 * Returns null on any navigation or extraction error.
 */
export async function visitPage(page: Page, url: string): Promise<PageAsset | null> {
  try {
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: DEFAULT_TIMEOUT,
    });

    return await extractPage(page, url);
  } catch (err) {
    logger.warn(`Failed to visit ${url}: ${String(err)}`);
    return null;
  }
}
