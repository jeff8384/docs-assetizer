import type { CrawlResult, SummaryAsset, PageAsset, SummarySection } from '../types/index.js';
import { classifyPageSection, type SectionType } from './classifySection.js';

const PREFERRED_LANGUAGES = ['typescript', 'javascript', 'python', 'ts', 'js', 'py', 'bash', 'shell'];
const ACTION_VERBS = ['use', 'create', 'call', 'run', 'install', 'add', 'configure', 'enable', 'import', 'define', 'click', 'fill', 'navigate', 'assert', 'launch'];
const WARNING_KEYWORDS = ['warning', 'note', 'caution', 'important', 'avoid', "don't", 'deprecated', 'gotcha', 'error', 'never', 'make sure'];

function topHeadings(pages: PageAsset[], topN: number): string[] {
  const freq: Map<string, number> = new Map();
  for (const page of pages) {
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
    .map(([h]) => h.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
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

export function buildSummary(result: CrawlResult): SummaryAsset {
  const { topic, pages } = result;

  const headingCount = new Set(pages.flatMap((p) => p.headings)).size;
  const oneLineSummary = `A comprehensive guide to ${topic} covering ${headingCount} topics across ${pages.length} pages.`;

  const sections = buildSections(pages);
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
