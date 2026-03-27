export type PageAsset = {
  url: string;
  title: string;
  headings: string[];
  contentBlocks: string[];
  codeBlocks: { language?: string; code: string }[];
  links: string[];
};

export type CrawlResult = {
  topic: string;
  source: string;
  crawledAt: string;
  totalPages: number;
  failedPages: string[];
  pages: PageAsset[];
};

export type SummaryAsset = {
  topic: string;
  oneLineSummary: string;
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
};
