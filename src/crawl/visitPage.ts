import type { Page } from 'playwright';
import type { PageAsset } from '../types/index.js';
import { extractPage } from './extractPage.js';
import { logger } from '../utils/logger.js';
import { DEFAULT_TIMEOUT, DEFAULT_RETRY_COUNT, DEFAULT_RETRY_DELAY_MS } from '../config.js';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Visit a page with retry logic and configurable timeout.
 * Returns null if all attempts fail.
 */
export async function visitPage(
  page: Page,
  url: string,
  options?: { timeout?: number; retryCount?: number },
): Promise<PageAsset | null> {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT;
  const maxRetries = options?.retryCount ?? DEFAULT_RETRY_COUNT;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
      const asset = await extractPage(page, url);
      return asset;
    } catch (err) {
      const isLast = attempt === maxRetries + 1;
      if (isLast) {
        logger.warn(`Failed [${attempt}/${maxRetries + 1}]: ${url} — ${(err as Error).message}`);
        return null;
      }
      logger.warn(`Retrying [${attempt}/${maxRetries + 1}]: ${url}`);
      await sleep(DEFAULT_RETRY_DELAY_MS * attempt);
    }
  }

  return null;
}
