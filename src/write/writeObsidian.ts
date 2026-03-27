import { promises as fs } from 'fs';
import path from 'path';

/**
 * Write an Obsidian note to the specified vault path.
 * Output: {obsidianPath}/{topic} 문서 자산.md
 * Returns the absolute file path.
 */
export async function writeObsidian(
  obsidianPath: string,
  topic: string,
  note: string,
): Promise<string> {
  await fs.mkdir(obsidianPath, { recursive: true });

  const fileName = `${topic} 문서 자산.md`;
  const filePath = path.join(obsidianPath, fileName);
  await fs.writeFile(filePath, note, 'utf-8');

  return filePath;
}
