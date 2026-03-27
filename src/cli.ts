import { Command } from 'commander';
import { z } from 'zod';
import path from 'path';
import { runPipeline } from './pipeline.js';
import { logger } from './utils/logger.js';
import type { RunConfig } from './types/index.js';

// Zod schema for validating CLI arguments
const CliSchema = z.object({
  source: z.string().url({ message: '--source must be a valid URL' }),
  topic: z.string().min(1, { message: '--topic is required' }),
  maxPages: z.coerce.number().int().min(1).max(100).default(20),
  outputDir: z.string().min(1).default('./output'),
  obsidianPath: z.string().optional(),
  formats: z
    .string()
    .default('json,markdown,obsidian')
    .transform((val) => val.split(',').map((s) => s.trim())),
});

// Validate formats to the known union
const FormatSchema = z
  .array(z.enum(['json', 'markdown', 'obsidian']))
  .min(1, { message: '--formats must include at least one of: json, markdown, obsidian' });

async function main(): Promise<void> {
  const program = new Command();

  program
    .name('docs-assetizer')
    .description('Documentation assetization pipeline — crawl, extract, and synthesize doc sites')
    .requiredOption('--source <url>', 'Documentation URL to crawl')
    .requiredOption('--topic <name>', 'Name of the topic / library being documented')
    .option('--max-pages <n>', 'Maximum number of pages to crawl', '20')
    .option('--output-dir <path>', 'Directory to write output files', './output')
    .option('--obsidian-path <path>', 'Obsidian vault path for note output')
    .option('--formats <list>', 'Comma-separated list of output formats: json,markdown,obsidian', 'json,markdown,obsidian');

  program.parse(process.argv);
  const opts = program.opts();

  // Validate input
  const parsed = CliSchema.safeParse({
    source: opts['source'],
    topic: opts['topic'],
    maxPages: opts['maxPages'],
    outputDir: opts['outputDir'],
    obsidianPath: opts['obsidianPath'],
    formats: opts['formats'],
  });

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      logger.error(issue.message);
    }
    process.exit(1);
  }

  const formatsResult = FormatSchema.safeParse(parsed.data.formats);
  if (!formatsResult.success) {
    logger.error(formatsResult.error.issues[0].message);
    process.exit(1);
  }

  const config: RunConfig = {
    source: parsed.data.source,
    topic: parsed.data.topic,
    maxPages: parsed.data.maxPages,
    outputDir: path.resolve(parsed.data.outputDir),
    obsidianPath: parsed.data.obsidianPath
      ? path.resolve(parsed.data.obsidianPath)
      : undefined,
    // formatsResult.success guard above ensures data is defined
    outputFormats: formatsResult.data as ('json' | 'markdown' | 'obsidian')[],
  };

  logger.info(`Starting docs-assetizer for topic: ${config.topic}`);
  logger.info(`Source: ${config.source}`);
  logger.info(`Max pages: ${config.maxPages}`);
  logger.info(`Output dir: ${config.outputDir}`);
  logger.info(`Formats: ${config.outputFormats.join(', ')}`);

  try {
    await runPipeline(config);
  } catch (err) {
    logger.error(`Pipeline failed: ${String(err)}`);
    process.exit(1);
  }
}

main();
