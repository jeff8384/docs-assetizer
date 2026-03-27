import type { RunConfig, PageAsset, CrawlResult } from './types/index.js';
import { createBrowser, createPage } from './crawl/browser.js';
import { discoverLinks } from './discover/discoverLinks.js';
import { prioritizeLinks } from './discover/prioritizeLinks.js';
import { visitPage } from './crawl/visitPage.js';
import { buildSummary } from './synthesize/buildSummary.js';
import { buildObsidianNote } from './synthesize/buildObsidianNote.js';
import { writeJson } from './write/writeJson.js';
import { writeMarkdown } from './write/writeMarkdown.js';
import { writeObsidian } from './write/writeObsidian.js';
import { logger } from './utils/logger.js';

export async function runPipeline(config: RunConfig): Promise<void> {
  const { source, topic, maxPages, outputDir, obsidianPath, outputFormats, timeout, retryCount } = config;

  const browser = await createBrowser();
  const page = await createPage(browser);

  const pages: PageAsset[] = [];
  const failedPages: string[] = [];

  try {
    // Step 1: Discover
    logger.info(`Discovering links from ${source}...`);
    await page.goto(source, { waitUntil: 'domcontentloaded', timeout });
    const allLinks = await discoverLinks(source, page);
    const prioritized = prioritizeLinks(allLinks, source, maxPages);
    logger.info(`Found ${prioritized.length} pages to crawl`);

    // Step 2: First crawl pass
    for (let i = 0; i < prioritized.length; i++) {
      const url = prioritized[i];
      logger.info(`Crawling [${i + 1}/${prioritized.length}]: ${url}`);
      const asset = await visitPage(page, url, { timeout, retryCount });
      if (asset) {
        pages.push(asset);
      } else {
        failedPages.push(url);
      }

      // Partial save every 5 pages
      if (pages.length > 0 && pages.length % 5 === 0 && outputFormats.includes('json')) {
        const partialResult: CrawlResult = {
          topic, source,
          crawledAt: new Date().toISOString(),
          totalPages: pages.length,
          failedPages: [...failedPages],
          pages: [...pages],
        };
        await writeJson(outputDir, topic, partialResult, 'raw.partial.json');
        logger.info(`Partial save: ${pages.length} pages so far`);
      }
    }

    // Step 3: Retry failed pages once more
    if (failedPages.length > 0) {
      logger.info(`Retrying ${failedPages.length} failed pages...`);
      const stillFailed: string[] = [];
      for (const url of [...failedPages]) {
        const asset = await visitPage(page, url, { timeout: Math.floor(timeout * 1.5), retryCount: 1 });
        if (asset) {
          pages.push(asset);
          failedPages.splice(failedPages.indexOf(url), 1);
        } else {
          stillFailed.push(url);
        }
      }
      if (stillFailed.length > 0) {
        logger.warn(`Permanently failed pages (${stillFailed.length}): ${stillFailed.join(', ')}`);
      }
    }

    // Step 4: Build final result
    const crawlResult: CrawlResult = {
      topic, source,
      crawledAt: new Date().toISOString(),
      totalPages: pages.length,
      failedPages,
      pages,
    };

    // Step 5: Write raw JSON (final)
    if (outputFormats.includes('json')) {
      const jsonPath = await writeJson(outputDir, topic, crawlResult);
      logger.success(`Raw JSON: ${jsonPath}`);
    }

    // Step 6: Synthesize
    const summary = buildSummary(crawlResult);

    // Step 7: Write Markdown
    if (outputFormats.includes('markdown')) {
      const mdPath = await writeMarkdown(outputDir, topic, summary);
      logger.success(`Markdown: ${mdPath}`);
    }

    // Step 8: Write Obsidian
    if (outputFormats.includes('obsidian') && obsidianPath) {
      const note = buildObsidianNote(crawlResult, summary);
      const obsPath = await writeObsidian(obsidianPath, topic, note);
      logger.success(`Obsidian: ${obsPath}`);
    } else if (outputFormats.includes('obsidian') && !obsidianPath) {
      logger.warn('Obsidian format requested but --obsidian-path not set. Skipping.');
    }

    logger.success(`Done! Crawled ${pages.length} pages, failed: ${failedPages.length}`);
  } finally {
    await browser.close();
  }
}
