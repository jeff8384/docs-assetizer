// Discovery selectors — ordered by specificity
export const NAV_SELECTORS = [
  // Dedicated navigation / sidebar
  'nav a',
  'aside a',
  '.sidebar a',
  '[data-sidebar] a',
  '.toc a',
  '.table-of-contents a',
  // Prev / Next navigation
  'a[rel="next"]',
  'a[rel="prev"]',
  '[class*="pagination"] a',
  '[class*="prev-next"] a',
  // Breadcrumb
  '[aria-label="breadcrumb"] a',
  '.breadcrumb a',
  // In-page content links (lower priority, processed last)
  'main a',
  'article a',
];

export const DOCS_PATH_PREFIXES = [
  '/docs',
  '/guide',
  '/guides',
  '/api',
  '/reference',
  '/learn',
  '/tutorial',
  '/tutorials',
  '/manual',
  '/handbook',
  '/getting-started',
  '/introduction',
];

export const PRIORITY_KEYWORDS = [
  'intro',
  'introduction',
  'getting-started',
  'installation',
  'install',
  'quickstart',
  'quick-start',
  'guide',
  'docs',
  'api',
  'reference',
  'locators',
  'assertions',
  'usage',
  'configuration',
  'config',
  'overview',
  'concepts',
  'examples',
];

export const EXCLUDE_KEYWORDS = [
  'blog',
  'releases',
  'release-notes',
  'release_notes',
  'changelog',
  'CHANGELOG',
  'community',
  'forum',
  'discuss',
  'privacy',
  'privacy-policy',
  'terms',
  'terms-of-service',
  'legal',
  'login',
  'signin',
  'signup',
  'register',
  'search',
  'cdn',
  'download',
  'pricing',
  'enterprise',
  'jobs',
  'careers',
  'about',
  'contact',
  'support',
  'status',
  'twitter',
  'github.com/issues',
  'github.com/discussions',
];

export const CONTENT_SELECTORS = [
  'main',
  'article',
  '[role="main"]',
  '.content',
  '.doc-content',
  '.docs-content',
  '.markdown-body',
  '.theme-doc-markdown',
  '#content',
  '.container article',
];

// Callout / admonition selectors (note, warning, tip, danger boxes)
export const CALLOUT_SELECTORS = [
  '.admonition',
  '.callout',
  '.note',
  '.warning',
  '.tip',
  '.danger',
  '.info',
  '[class*="admonition"]',
  '[class*="callout"]',
  '[class*="alert"]',
  'blockquote',
];

export const DEFAULT_TIMEOUT = 20000;
export const DEFAULT_RETRY_COUNT = 2;
export const DEFAULT_RETRY_DELAY_MS = 1500;
export const MIN_CONTENT_LENGTH = 100;
