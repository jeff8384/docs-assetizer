import type { ElementHandle } from 'playwright';
import type { TableAsset } from '../types/index.js';

/**
 * Extract all <table> elements from the content element.
 * Returns headers and rows as string arrays.
 */
export async function extractTables(
  contentEl: ElementHandle<Element>,
): Promise<TableAsset[]> {
  return contentEl.$$eval('table', (tables: Element[]) => {
    return tables.map((table) => {
      // Headers: <th> in <thead> or first <tr>
      const thEls = table.querySelectorAll('thead th, thead td');
      const headers = thEls.length > 0
        ? Array.from(thEls).map((th) => (th as HTMLElement).innerText?.trim() ?? '')
        : (() => {
            const firstRow = table.querySelector('tr');
            if (!firstRow) return [];
            return Array.from(firstRow.querySelectorAll('th, td')).map(
              (td) => (td as HTMLElement).innerText?.trim() ?? ''
            );
          })();

      // Rows: <tbody> <tr> rows
      const bodyRows = table.querySelectorAll('tbody tr');
      const targetRows = bodyRows.length > 0 ? bodyRows : table.querySelectorAll('tr:not(:first-child)');
      const rows = Array.from(targetRows).map((tr) =>
        Array.from(tr.querySelectorAll('td')).map(
          (td) => (td as HTMLElement).innerText?.trim() ?? ''
        )
      ).filter((row) => row.length > 0);

      return { headers, rows };
    }).filter((t) => t.headers.length > 0 || t.rows.length > 0);
  });
}
