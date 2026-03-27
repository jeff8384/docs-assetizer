import { chromium, type Browser, type Page } from 'playwright';
import { DEFAULT_TIMEOUT } from '../config.js';

/**
 * Launch a headless Chromium browser instance.
 */
export async function createBrowser(): Promise<Browser> {
  return chromium.launch({ headless: true });
}

/**
 * Create a new page in the given browser with the default navigation timeout.
 */
export async function createPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(DEFAULT_TIMEOUT);
  page.setDefaultTimeout(DEFAULT_TIMEOUT);
  return page;
}
