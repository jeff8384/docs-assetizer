import { promises as fs } from 'fs';
import path from 'path';
import slugifyLib from 'slugify';
import type { SummaryAsset } from '../types/index.js';

// slugify ships as a CJS module; handle both interop shapes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const slugify: (s: string, opts?: object) => string = (slugifyLib as any).default ?? slugifyLib;

/**
 * Render a SummaryAsset to a Markdown string.
 */
function renderMarkdown(summary: SummaryAsset): string {
  const lines: string[] = [];

  lines.push(`# ${summary.topic} — Summary`);
  lines.push('');
  lines.push(`> ${summary.oneLineSummary}`);
  lines.push('');

  // Key concepts
  if (summary.keyConcepts.length > 0) {
    lines.push('## Key Concepts');
    lines.push('');
    for (const concept of summary.keyConcepts) {
      lines.push(`- ${concept}`);
    }
    lines.push('');
  }

  // Usage patterns
  if (summary.usagePatterns.length > 0) {
    lines.push('## Usage Patterns');
    lines.push('');
    summary.usagePatterns.slice(0, 10).forEach((pattern, i) => {
      lines.push(`${i + 1}. ${pattern}`);
    });
    lines.push('');
  }

  // Gotchas
  if (summary.gotchas.length > 0) {
    lines.push('## Gotchas & Notes');
    lines.push('');
    for (const gotcha of summary.gotchas.slice(0, 10)) {
      lines.push(`- ${gotcha}`);
    }
    lines.push('');
  }

  // Code examples
  if (summary.codeExamples.length > 0) {
    lines.push('## Code Examples');
    lines.push('');
    for (const example of summary.codeExamples) {
      lines.push(`**Source:** ${example.fromUrl}`);
      lines.push('');
      const lang = example.language ?? '';
      lines.push(`\`\`\`${lang}`);
      lines.push(example.code.trim());
      lines.push('```');
      lines.push('');
    }
  }

  // Sources
  if (summary.sourceUrls.length > 0) {
    lines.push('## Source URLs');
    lines.push('');
    for (const url of summary.sourceUrls) {
      lines.push(`- ${url}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Write summary Markdown to disk.
 * Output path: {outputDir}/{slug(topic)}/summary.md
 * Returns the absolute file path.
 */
export async function writeMarkdown(
  outputDir: string,
  topic: string,
  summary: SummaryAsset,
): Promise<string> {
  const slug = slugify(topic, { lower: true, strict: true });
  const dir = path.join(outputDir, slug);
  await fs.mkdir(dir, { recursive: true });

  const filePath = path.join(dir, 'summary.md');
  await fs.writeFile(filePath, renderMarkdown(summary), 'utf-8');

  return filePath;
}
