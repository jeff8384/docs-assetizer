import type { CrawlResult, SummaryAsset, PageAsset, SummarySection } from '../types/index.js';
import { classifyPageSection, type SectionType } from './classifySection.js';

const PREFERRED_LANGUAGES = ['typescript', 'javascript', 'python', 'ts', 'js', 'py', 'bash', 'shell'];
const ACTION_VERBS = ['use', 'create', 'call', 'run', 'install', 'add', 'configure', 'enable', 'import', 'define', 'click', 'fill', 'navigate', 'assert', 'launch'];
const WARNING_KEYWORDS = ['warning', 'note', 'caution', 'important', 'avoid', "don't", 'deprecated', 'gotcha', 'error', 'never', 'make sure'];

// Headings that are navigation / UI chrome, not document concepts
const NOISE_HEADING_EXACT = new Set([
  'next', 'previous', 'prev', 'back', 'home', 'menu', 'search', 'skip',
  'contents', 'table of contents', 'on this page', 'in this section',
  'see also', 'related', 'more', 'learn more', 'read more',
  'example', 'examples', 'note', 'tip', 'warning', 'info',
  'introduction', 'overview', 'summary', 'conclusion',
  'edit this page', 'edit page', 'contribute',
]);

// Patterns that indicate noise: purely numeric, "Product N", "Item N", single char, etc.
const NOISE_HEADING_PATTERNS = [
  /^\d+$/,                        // pure number: "1", "42"
  /^\d+\./,                       // numbered list item: "1. Something"
  /^(product|item|chapter|section|part|step|figure|table|appendix)\s+\d+/i,
  /^(page|p\.)\s*\d+/i,
  /^[a-z]$/i,                     // single letter
  /^[\W\d]+$/,                    // only punctuation/numbers
  /^\s*[\u2190-\u21FF]\s*/,       // arrow characters
];

function isNoisyHeading(raw: string): boolean {
  const h = raw.toLowerCase().trim();
  if (h.length <= 2) return true;
  if (NOISE_HEADING_EXACT.has(h)) return true;
  if (NOISE_HEADING_PATTERNS.some((re) => re.test(h))) return true;
  // Reject if more than 60% of characters are non-alphabetic (URLs, code fragments, etc.)
  const alphaCount = (h.match(/[a-z]/g) ?? []).length;
  if (alphaCount / h.length < 0.4) return true;
  return false;
}

function titleCase(h: string): string {
  return h.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function topHeadings(pages: PageAsset[], topN: number): string[] {
  const freq: Map<string, number> = new Map();
  for (const page of pages) {
    // skip first heading (usually page title, not a concept)
    for (const h of page.headings.slice(1)) {
      const normalized = h.toLowerCase().trim();
      if (!isNoisyHeading(normalized)) {
        freq.set(normalized, (freq.get(normalized) ?? 0) + 1);
      }
    }
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([h]) => titleCase(h));
}

function buildSections(pages: PageAsset[]): SummarySection[] {
  const grouped = new Map<SectionType, PageAsset[]>();

  for (const page of pages) {
    const type = (page.section as SectionType | undefined) ?? classifyPageSection(page.url, page.title, page.headings);
    const existing = grouped.get(type) ?? [];
    existing.push(page);
    grouped.set(type, existing);
  }

  const SECTION_ORDER: SectionType[] = ['install', 'concepts', 'usage', 'api', 'debugging', 'other'];

  return SECTION_ORDER
    .filter((type) => grouped.has(type))
    .map((type) => {
      const sectionPages = grouped.get(type)!;
      const keyHeadings = topHeadings(sectionPages, 5);
      return {
        type,
        pages: sectionPages.map((p) => p.url),
        keyHeadings,
      };
    });
}

/**
 * Build a context-aware one-line summary from actual crawl content.
 * Uses: section distribution + top concepts + intro page title/h1.
 */
function buildOneLineSummary(topic: string, pages: PageAsset[], sections: SummarySection[]): string {
  // Collect h1s from all pages as the most authoritative description signal
  const h1s = pages
    .map((p) => p.headings[0])
    .filter((h): h is string => !!h && !isNoisyHeading(h.toLowerCase()));

  // Most descriptive h1: prefer the intro/install page (first page) h1
  const leadH1 = h1s[0] ?? '';

  // Build section label list (skip 'other', keep install/usage/api/debugging/concepts)
  const sectionLabels: string[] = sections
    .filter((s) => s.type !== 'other')
    .map((s) => {
      const labels: Record<string, string> = {
        install: 'installation',
        usage: 'usage patterns',
        api: 'API reference',
        debugging: 'debugging',
        concepts: 'core concepts',
      };
      return labels[s.type] ?? s.type;
    });

  // Top 3 clean concept headings as content signal
  const topConcepts = topHeadings(pages, 3);

  // Compose summary
  if (sectionLabels.length >= 2 && topConcepts.length >= 2) {
    const coveredSections = sectionLabels.slice(0, 3).join(', ');
    const exampleConcepts = topConcepts.slice(0, 2).join(' and ');
    return `${topic} documentation covering ${coveredSections} — including ${exampleConcepts} — across ${pages.length} pages.`;
  }

  if (leadH1 && leadH1.toLowerCase() !== topic.toLowerCase()) {
    return `${leadH1}. ${pages.length} pages crawled covering ${topic} documentation.`;
  }

  // Fallback: still better than pure count
  const uniqueHeadings = new Set(pages.flatMap((p) => p.headings.filter((h) => !isNoisyHeading(h.toLowerCase())))).size;
  return `${topic} documentation: ${uniqueHeadings} unique topics across ${pages.length} pages.`;
}

export function buildSummary(result: CrawlResult): SummaryAsset {
  const { topic, pages } = result;

  const sections = buildSections(pages);
  const oneLineSummary = buildOneLineSummary(topic, pages, sections);
  const keyConcepts = topHeadings(pages, 10);

  const usagePatterns: string[] = [];
  for (const page of pages) {
    for (const block of page.contentBlocks) {
      const lower = block.toLowerCase();
      if (ACTION_VERBS.some((v) => lower.includes(v)) && block.length > 30 && block.length < 500) {
        usagePatterns.push(block);
      }
    }
    // Also include callout content as usage hints
    for (const callout of page.callouts ?? []) {
      if (callout.type === 'tip' || callout.type === 'info') {
        usagePatterns.push(callout.content);
      }
    }
  }

  const gotchas: string[] = [];
  for (const page of pages) {
    for (const block of page.contentBlocks) {
      const lower = block.toLowerCase();
      if (WARNING_KEYWORDS.some((w) => lower.includes(w)) && block.length > 20) {
        gotchas.push(block);
      }
    }
    // Warning/danger callouts are excellent gotchas
    for (const callout of page.callouts ?? []) {
      if (callout.type === 'warning' || callout.type === 'danger') {
        gotchas.push(`[${callout.type.toUpperCase()}] ${callout.content}`);
      }
    }
  }

  const allCodeBlocks = pages.flatMap((p) =>
    p.codeBlocks.map((cb) => ({ fromUrl: p.url, ...cb })),
  );
  const preferred = allCodeBlocks.filter((cb) =>
    cb.language ? PREFERRED_LANGUAGES.includes(cb.language.toLowerCase()) : false,
  );
  const others = allCodeBlocks.filter(
    (cb) => !cb.language || !PREFERRED_LANGUAGES.includes(cb.language.toLowerCase()),
  );
  const codeExamples = [...preferred, ...others]
    .sort((a, b) => b.code.length - a.code.length)
    .slice(0, 5);

  return {
    topic,
    oneLineSummary,
    sections,
    keyConcepts,
    usagePatterns: usagePatterns.slice(0, 20),
    gotchas: gotchas.slice(0, 15),
    codeExamples,
    sourceUrls: pages.map((p) => p.url),
  };
}
