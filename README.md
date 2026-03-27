# docs-assetizer

CLI-first documentation assetization pipeline.
Crawls a documentation site with Playwright, extracts structured content, and outputs reusable assets.

**Output formats:**
- `raw.json` — full structured crawl data (pages, headings, code blocks, tables, callouts)
- `summary.md` — Markdown summary with section classification, noise-filtered key concepts, usage patterns, gotchas, and code examples
- `{topic} 문서 자산.md` — Obsidian-compatible note with YAML frontmatter

## Design

```
Playwright (crawl)
  → Discover  (links: nav / sidebar / TOC / breadcrumb / prev-next)
  → Extract   (headings / code / tables / callouts / content blocks)
  → Classify  (install / usage / api / debugging / concepts)
  → Synthesize (rule-based summary — no LLM)
  → Write     (json / markdown / obsidian)
```

No LLM calls. No external APIs. Pure heuristic extraction.

## Sample Output

See [`samples/playwright/`](samples/playwright/) for real output based on the Playwright docs:

| File | Description |
|------|-------------|
| [`raw.json`](samples/playwright/raw.json) | Structured crawl data (pages, code blocks, tables, callouts) |
| [`summary.md`](samples/playwright/summary.md) | Section-classified Markdown summary with noise-filtered key concepts |
| [`obsidian-note.md`](samples/playwright/obsidian-note.md) | Obsidian note with YAML frontmatter |

## Install

```bash
npm install
npx playwright install chromium
```

## Usage

```bash
# Basic
npm run dev -- \
  --source https://playwright.dev/docs/intro \
  --topic Playwright \
  --max-pages 20 \
  --output-dir ./output

# With all options
npm run dev -- \
  --source https://playwright.dev/docs/intro \
  --topic Playwright \
  --max-pages 30 \
  --output-dir ./output \
  --obsidian-path ~/Documents/Obsidian/Vault/Docs \
  --formats json,markdown,obsidian \
  --timeout 25000 \
  --retry 3
```

## Options

| Option            | Default                  | Description |
|-------------------|--------------------------|-------------|
| `--source`        | *(required)*             | Documentation root URL to crawl |
| `--topic`         | *(required)*             | Topic name used for output folder and titles |
| `--max-pages`     | `20`                     | Maximum pages to crawl (1–100) |
| `--output-dir`    | `./output`               | Directory to write JSON and Markdown output |
| `--obsidian-path` | *(none)*                 | Obsidian vault path for note output |
| `--formats`       | `json,markdown,obsidian` | Comma-separated output formats |
| `--timeout`       | `20000`                  | Page load timeout in milliseconds |
| `--retry`         | `2`                      | Retry attempts per failed page |

## Output Structure

```
output/
  playwright/
    raw.json          <- full crawl data (pages, code blocks, tables, callouts)
    raw.partial.json  <- auto-saved every 5 pages during crawl
    summary.md        <- synthesized Markdown summary
```

Obsidian note is written to:
```
{obsidian-path}/Playwright 문서 자산.md
```

## Stability Features

- **Retry with backoff** — each failed page is retried up to `--retry` times with exponential backoff
- **Partial save** — `raw.partial.json` is written every 5 pages so a crash doesn't lose progress
- **Failed page retry pass** — after the main crawl, all failed pages get one more attempt with 1.5× timeout
- **Configurable timeout** — set `--timeout` for slow documentation sites

## Section Classification

Pages are automatically classified into sections:

| Section | Matched keywords |
|---------|-----------------|
| `install` | installation, setup, getting-started, prerequisites |
| `usage` | guide, locator, action, click, fill, navigate, assertion |
| `api` | api, reference, class, method, interface, enum |
| `debugging` | debug, trace, inspect, devtools, troubleshoot |
| `concepts` | overview, architecture, introduction, what is |
| `other` | everything else |

Section classification groups pages in `summary.md` and the Obsidian note.

## Discovery Strategy

Links are collected from (in priority order):
1. `nav`, `aside`, `.sidebar`, `.toc`, `[data-sidebar]`
2. `a[rel="next"]`, `a[rel="prev"]`, breadcrumb links
3. In-page `main` / `article` links

**Scoring**: links whose path starts with `/docs`, `/guide`, `/api`, `/reference`, etc. are ranked higher.
Path depth beyond 3 levels gets a small penalty.

**Excluded**: `blog`, `changelog`, `releases`, `community`, `privacy`, `terms`, `login`, `search`, and similar non-doc paths.

## Extraction Coverage

| Element | Extracted |
|---------|-----------|
| `h1 / h2 / h3` | headings |
| `pre code` | code blocks with language detection |
| `p / li / dt / dd / blockquote / td` | content blocks |
| `table` | headers + rows as structured TableAsset |
| `.admonition / .callout / .note / .warning / blockquote` | callouts with type classification |
| `a[href]` | internal links for further discovery |

## Build

```bash
npm run build
node dist/cli.js --source https://... --topic MyTopic
```
