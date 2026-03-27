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

/**
 * Main pipeline orchestration:
 * 1. Discover links
 * 2. Crawl each page
 * 3. Build CrawlResult
 * 4. Write raw JSON
 * 5. Synthesize summary
 * 6. Write Markdown summary
 * 7. Write Obsidian note (optional)
 */
export async function runPipeline(config: RunConfig): Promise<void> {
  const { source, topic, maxPages, outputDir, obsidianPath, outputFormats } = config;

  const browser = await createBrowser();
  const page = await createPage(browser);

  try {
    // Step 1: Navigate to source and discover links
    logger.info(`Discovering links from ${source}...`);
    await page.goto(source, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const allLinks = await discoverLinks(source, page);
    const prioritized = prioritizeLinks(allLinks, source, maxPages);
    logger.info(`Found ${prioritized.length} pages to crawl`);

    // Step 2: Crawl each page
    const pages: PageAsset[] = [];
    const failedPages: string[] = [];

    for (let i = 0; i < prioritized.length; i++) {
      const url = prioritized[i];
      logger.info(`Crawling [${i + 1}/${prioritized.length}]: ${url}`);

      const asset = await visitPage(page, url);
      if (asset) {
        pages.push(asset);
      } else {
        failedPages.push(url);
      }
    }

    // Step 3: Build CrawlResult
    const crawlResult: CrawlResult = {
      topic,
      source,
      crawledAt: new Date().toISOString(),
      totalPages: pages.length,
      failedPages,
      pages,
    };

    // Step 4: Write raw JSON
    if (outputFormats.includes('json')) {
      const jsonPath = await writeJson(outputDir, topic, crawlResult);
      logger.success(`Raw JSON: ${jsonPath}`);
    }

    // Step 5: Synthesize
    const summary = buildSummary(crawlResult);

    // Step 6: Write Markdown
    if (outputFormats.includes('markdown')) {
      const mdPath = await writeMarkdown(outputDir, topic, summary);
      logger.success(`Markdown: ${mdPath}`);
    }

    // Step 7: Write Obsidian
    if (outputFormats.includes('obsidian') && obsidianPath) {
      const note = buildObsidianNote(crawlResult, summary);
      const obsPath = await writeObsidian(obsidianPath, topic, note);
      logger.success(`Obsidian: ${obsPath}`);
    } else if (outputFormats.includes('obsidian') && !obsidianPath) {
      logger.warn('Obsidian format requested but --obsidian-path is not set. Skipping.');
    }

    logger.success(
      `Done! Crawled ${pages.length} pages, failed: ${failedPages.length}`,
    );
  } finally {
    await browser.close();
  }
}
