import type { CrawlResult, SummaryAsset } from '../types/index.js';

/**
 * Generate Obsidian-compatible Markdown with YAML frontmatter from crawl and summary data.
 */
export function buildObsidianNote(result: CrawlResult, summary: SummaryAsset): string {
  const { topic, source, crawledAt } = result;
  const {
    oneLineSummary,
    keyConcepts,
    usagePatterns,
    codeExamples,
    gotchas,
    sourceUrls,
  } = summary;

  const lines: string[] = [];

  // --- YAML frontmatter ---
  lines.push('---');
  lines.push(`topic: ${topic}`);
  lines.push(`source: ${source}`);
  lines.push(`crawledAt: ${crawledAt}`);
  lines.push(`tags: [docs, ${topic.toLowerCase().replace(/\s+/g, '-')}]`);
  lines.push('---');
  lines.push('');

  // --- Title ---
  lines.push(`# ${topic} - Documentation Asset`);
  lines.push('');

  // --- Overview ---
  lines.push('## Overview');
  lines.push('');
  lines.push(oneLineSummary);
  lines.push('');

  // --- Key Concepts ---
  lines.push('## Key Concepts');
  lines.push('');
  for (const concept of keyConcepts) {
    lines.push(`- ${concept}`);
  }
  lines.push('');

  // --- Usage Patterns ---
  lines.push('## Usage Patterns');
  lines.push('');
  const patternsToShow = usagePatterns.slice(0, 10);
  patternsToShow.forEach((pattern, i) => {
    lines.push(`${i + 1}. ${pattern}`);
  });
  lines.push('');

  // --- Code Examples ---
  if (codeExamples.length > 0) {
    lines.push('## Code Examples');
    lines.push('');
    for (const example of codeExamples) {
      lines.push(`> Source: ${example.fromUrl}`);
      lines.push('');
      const lang = example.language ?? '';
      lines.push(`\`\`\`${lang}`);
      lines.push(example.code.trim());
      lines.push('```');
      lines.push('');
    }
  }

  // --- Gotchas & Notes ---
  if (gotchas.length > 0) {
    lines.push('## Gotchas & Notes');
    lines.push('');
    for (const gotcha of gotchas.slice(0, 10)) {
      lines.push(`- ${gotcha}`);
    }
    lines.push('');
  }

  // --- Sources ---
  lines.push('## Sources');
  lines.push('');
  for (const url of sourceUrls) {
    lines.push(`- [${url}](${url})`);
  }
  lines.push('');

  return lines.join('\n');
}
