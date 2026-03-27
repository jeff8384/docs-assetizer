// Common nav/footer phrases to strip from extracted content
const NAV_PHRASES = [
  'skip to content',
  'edit this page',
  'on this page',
  'table of contents',
  'previous page',
  'next page',
  'was this helpful?',
  'give feedback',
  'view source',
  'improve this page',
];

/**
 * Clean extracted text:
 * - Collapse multiple whitespace / newlines into a single space
 * - Remove known navigation/footer phrases (case-insensitive)
 * - Trim leading and trailing whitespace
 */
export function cleanText(text: string): string {
  let result = text;

  // Remove known phrases (case-insensitive)
  for (const phrase of NAV_PHRASES) {
    result = result.replace(new RegExp(phrase, 'gi'), '');
  }

  // Collapse whitespace
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}
