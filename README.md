# docs-assetizer

A CLI-first documentation assetization pipeline. Crawls a documentation site, extracts structured content (titles, headings, code blocks, links), and generates:

- `raw.json` — Full structured crawl data
- `summary.md` — Markdown summary with key concepts, usage patterns, gotchas, and code examples
- `{topic} 문서 자산.md` — Obsidian-compatible note with YAML frontmatter

## Design

```
Playwright (crawl) → Extract (structure) → Synthesize (rule-based summary) → Write (json/md/obsidian)
```

No LLM calls. No external APIs. Pure heuristic extraction.

## Install

```bash
npm install
npx playwright install chromium
```

## Usage

```bash
npm run dev -- \
  --source https://playwright.dev/docs/intro \
  --topic Playwright \
  --max-pages 20 \
  --output-dir ./output
```

With Obsidian vault:

```bash
npm run dev -- \
  --source https://playwright.dev/docs/intro \
  --topic Playwright \
  --max-pages 20 \
  --output-dir ./output \
  --obsidian-path ~/Documents/Obsidian/Vault/Docs \
  --formats json,markdown,obsidian
```

## Options

| Option             | Default                    | Description                                    |
|--------------------|----------------------------|------------------------------------------------|
| `--source`         | *(required)*               | Documentation URL to crawl                     |
| `--topic`          | *(required)*               | Topic name used for output folder and titles   |
| `--max-pages`      | `20`                       | Maximum pages to crawl (1–100)                 |
| `--output-dir`     | `./output`                 | Directory to write JSON and Markdown output    |
| `--obsidian-path`  | *(none)*                   | Obsidian vault path for note output            |
| `--formats`        | `json,markdown,obsidian`   | Comma-separated list of output formats         |

## Output structure

```
output/
  playwright/
    raw.json       <- full crawl data
    summary.md     <- synthesized summary
```

Obsidian note is written to:

```
{obsidian-path}/Playwright 문서 자산.md
```

## Build

```bash
npm run build
node dist/cli.js --source https://... --topic MyTopic
```
