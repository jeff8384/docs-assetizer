export type CodeBlock = {
  language?: string;
  code: string;
};

export type TableAsset = {
  headers: string[];
  rows: string[][];
};

export type CalloutAsset = {
  type: 'note' | 'warning' | 'tip' | 'danger' | 'info' | 'other';
  content: string;
};

export type PageAsset = {
  url: string;
  title: string;
  headings: string[];
  contentBlocks: string[];
  codeBlocks: CodeBlock[];
  tables: TableAsset[];
  callouts: CalloutAsset[];
  links: string[];
  section?: string; // classified section type
};

export type CrawlResult = {
  topic: string;
  source: string;
  crawledAt: string;
  totalPages: number;
  failedPages: string[];
  pages: PageAsset[];
};

export type SummarySection = {
  type: 'install' | 'usage' | 'api' | 'debugging' | 'concepts' | 'other';
  pages: string[]; // URLs
  keyHeadings: string[];
};

export type SummaryAsset = {
  topic: string;
  oneLineSummary: string;
  sections: SummarySection[];
  keyConcepts: string[];
  usagePatterns: string[];
  gotchas: string[];
  codeExamples: { fromUrl: string; language?: string; code: string }[];
  sourceUrls: string[];
};

export type RunConfig = {
  source: string;
  topic: string;
  maxPages: number;
  outputDir: string;
  obsidianPath?: string;
  outputFormats: ('json' | 'markdown' | 'obsidian')[];
  timeout: number;
  retryCount: number;
};
