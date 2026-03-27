/**
 * Remove duplicate URLs while preserving insertion order.
 */
export function dedupeUrls(urls: string[]): string[] {
  return [...new Set(urls)];
}

/**
 * Remove exact duplicate content blocks while preserving insertion order.
 * For MVP this is an exact string match; extend later for near-duplicate detection.
 */
export function dedupeContentBlocks(blocks: string[]): string[] {
  return [...new Set(blocks)];
}
