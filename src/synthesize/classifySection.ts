/**
 * Classify a page into a doc section type based on URL path, title, and headings.
 */
export type SectionType = 'install' | 'usage' | 'api' | 'debugging' | 'concepts' | 'other';

const SECTION_RULES: { type: SectionType; keywords: string[] }[] = [
  {
    type: 'install',
    keywords: ['install', 'installation', 'setup', 'getting-started', 'quickstart', 'quick-start', 'requirements', 'prerequisites'],
  },
  {
    type: 'api',
    keywords: ['api', 'reference', 'class ', 'method', 'interface', 'enum', 'type ', 'namespace', 'module', 'function('],
  },
  {
    type: 'debugging',
    keywords: ['debug', 'debugging', 'troubleshoot', 'error', 'trace', 'inspect', 'devtools', 'playwright inspector'],
  },
  {
    type: 'usage',
    keywords: ['usage', 'use', 'guide', 'how to', 'locator', 'selector', 'action', 'click', 'fill', 'navigate', 'assertion', 'expect', 'test'],
  },
  {
    type: 'concepts',
    keywords: ['concept', 'overview', 'architecture', 'introduction', 'about', 'what is', 'why', 'principle'],
  },
];

export function classifyPageSection(
  url: string,
  title: string,
  headings: string[],
): SectionType {
  const combined = [url, title, ...headings.slice(0, 5)]
    .join(' ')
    .toLowerCase();

  for (const rule of SECTION_RULES) {
    if (rule.keywords.some((kw) => combined.includes(kw))) {
      return rule.type;
    }
  }

  return 'other';
}
