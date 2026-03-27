import { promises as fs } from 'fs';
import path from 'path';
import slugifyLib from 'slugify';
import type { CrawlResult } from '../types/index.js';

// slugify ships as a CJS module; handle both interop shapes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const slugify: (s: string, opts?: object) => string = (slugifyLib as any).default ?? slugifyLib;

/**
 * Write raw CrawlResult to JSON.
 * Output path: {outputDir}/{slug(topic)}/{filename}
 * Returns the absolute file path.
 */
export async function writeJson(
  outputDir: string,
  topic: string,
  data: CrawlResult,
  filename = 'raw.json',
): Promise<string> {
  const slug = slugify(topic, { lower: true, strict: true });
  const dir = path.join(outputDir, slug);
  await fs.mkdir(dir, { recursive: true });

  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

  return filePath;
}
