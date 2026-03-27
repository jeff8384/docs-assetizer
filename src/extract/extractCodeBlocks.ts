import type { Page, ElementHandle } from 'playwright';

type CodeBlock = { language?: string; code: string };

/**
 * Extract <pre><code> blocks from the given content element.
 * Language is inferred from the code element's class (e.g. "language-typescript" -> "typescript").
 */
export async function extractCodeBlocks(
  page: Page,
  contentEl: ElementHandle<Element>,
): Promise<CodeBlock[]> {
  const blocks = await contentEl.$$eval(
    'pre code',
    (els: Element[]) =>
      els.map((el) => {
        const className = el.className || '';
        // Look for a class matching "language-XYZ" or "lang-XYZ"
        const langMatch = className.match(/(?:language|lang)-(\S+)/);
        return {
          language: langMatch ? langMatch[1] : undefined,
          code: (el as HTMLElement).innerText || el.textContent || '',
        };
      }),
  );

  return blocks.filter((b) => b.code.trim().length > 0);
}
