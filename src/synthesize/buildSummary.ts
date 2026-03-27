import type { CrawlResult, SummaryAsset, PageAsset } from '../types/index.js';

// Preferred languages for code examples (in descending priority order)
const PREFERRED_LANGUAGES = ['typescript', 'javascript', 'python', 'ts', 'js', 'py'];

// Action verbs that signal usage patterns
const ACTION_VERBS = ['use', 'create', 'call', 'run', 'install', 'add', 'configure', 'enable', 'import', 'define'];

// Keywords that signal warnings / gotchas
const WARNING_KEYWORDS = ['warning', 'note', 'caution', 'important', 'avoid', "don't", 'deprecated', 'gotcha', 'error'];

/**
 * Count heading frequency across all pages and return the top N unique headings.
 */
function topHeadings(pages: PageAsset[], topN: number): string[] {
  const freq: Map<string, number> = new Map();

  for (const page of pages) {
    // Skip h1-level headings (usually page title) — keep h2/h3-level concepts
    for (const h of page.headings.slice(1)) {
      const normalized = h.toLowerCase().trim();
      if (normalized.length > 2) {
        freq.set(normalized, (freq.get(normalized) ?? 0) + 1);
      }
    }
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([heading]) =>
      heading
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
    );
}

/**
 * Rule-based extraction: build a SummaryAsset from a CrawlResult.
 * No LLM calls — pure heuristic analysis.
 */
export function buildSummary(result: CrawlResult): SummaryAsset {
  const { topic, pages } = result;

  // One-line summary
  const headingCount = new Set(pages.flatMap((p) => p.headings)).size;
  const oneLineSummary = `A comprehensive guide to ${topic} covering ${headingCount} topics across ${pages.length} pages.`;

  // Key concepts: most frequent h2/h3 headings
  const keyConcepts = topHeadings(pages, 10);

  // Usage patterns: blocks containing action verbs
  const usagePatterns: string[] = [];
  for (const page of pages) {
    for (const block of page.contentBlocks) {
      const lower = block.toLowerCase();
      const hasVerb = ACTION_VERBS.some((v) => lower.includes(v));
      if (hasVerb && block.length > 30 && block.length < 500) {
        usagePatterns.push(block);
      }
    }
  }

  // Gotchas: blocks containing warning keywords
  const gotchas: string[] = [];
  for (const page of pages) {
    for (const block of page.contentBlocks) {
      const lower = block.toLowerCase();
      const hasWarning = WARNING_KEYWORDS.some((w) => lower.includes(w));
      if (hasWarning && block.length > 20) {
        gotchas.push(block);
      }
    }
  }

  // Code examples: top 5 longest blocks, preferring TS/JS/Python
  const allCodeBlocks = pages.flatMap((p) =>
    p.codeBlocks.map((cb) => ({ fromUrl: p.url, ...cb })),
  );

  const preferred = allCodeBlocks.filter((cb) =>
    cb.language ? PREFERRED_LANGUAGES.includes(cb.language.toLowerCase()) : false,
  );
  const others = allCodeBlocks.filter(
    (cb) => !cb.language || !PREFERRED_LANGUAGES.includes(cb.language.toLowerCase()),
  );

  const ranked = [...preferred, ...others].sort((a, b) => b.code.length - a.code.length);
  const codeExamples = ranked.slice(0, 5);

  // Source URLs
  const sourceUrls = pages.map((p) => p.url);

  return {
    topic,
    oneLineSummary,
    keyConcepts,
    usagePatterns: usagePatterns.slice(0, 20),
    gotchas: gotchas.slice(0, 15),
    codeExamples,
    sourceUrls,
  };
}
