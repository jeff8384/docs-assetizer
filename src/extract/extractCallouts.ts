import type { ElementHandle } from 'playwright';
import type { CalloutAsset } from '../types/index.js';
import { cleanText } from './cleanText.js';
import { CALLOUT_SELECTORS } from '../config.js';

/**
 * Extract callout/admonition boxes (note, warning, tip, danger) from content.
 */
export async function extractCallouts(
  contentEl: ElementHandle<Element>,
): Promise<CalloutAsset[]> {
  const selector = CALLOUT_SELECTORS.join(', ');
  const results = await contentEl.$$eval(
    selector,
    (els: Element[]) => {
      return els.map((el) => {
        const cls = (el.className || '').toLowerCase();
        const title = el.querySelector('[class*="title"], [class*="label"], strong')?.textContent?.toLowerCase() ?? '';
        let type: string;
        if (cls.includes('warning') || cls.includes('danger') || title.includes('warning') || title.includes('danger')) type = 'warning';
        else if (cls.includes('tip') || title.includes('tip')) type = 'tip';
        else if (cls.includes('info') || title.includes('info')) type = 'info';
        else if (cls.includes('danger') || title.includes('danger')) type = 'danger';
        else if (cls.includes('note') || title.includes('note')) type = 'note';
        else type = 'other';
        return {
          type,
          content: (el as HTMLElement).innerText?.trim() ?? el.textContent?.trim() ?? '',
        };
      });
    }
  );

  return results
    .map((r) => ({ type: r.type as CalloutAsset['type'], content: cleanText(r.content) }))
    .filter((r) => r.content.length > 10);
}
