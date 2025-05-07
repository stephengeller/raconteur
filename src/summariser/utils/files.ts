import fs from "fs/promises";
import path from "path";

/**
 * Save content to a file in the .goose/summaries directory
 * @param content Content to save
 * @returns Path to the saved file
 */
export async function saveSummary(content: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `summary-${timestamp}.md`;
  const filepath = path.resolve(process.cwd(), ".goose/summaries", filename);

  await fs.writeFile(filepath, content, "utf-8");
  return filepath;
}

/**
 * Read content from a summary file
 * @param filepath Path to the summary file
 * @returns File content
 */
export async function readSummary(filepath: string): Promise<string> {
  return fs.readFile(filepath, "utf-8");
}

/**
 * List all summary files
 * @returns Array of summary file paths
 */
export async function listSummaries(): Promise<string[]> {
  const summariesDir = path.resolve(process.cwd(), ".goose/summaries");
  const files = await fs.readdir(summariesDir);
  return files.map(file => path.join(summariesDir, file));
}

/**
 * Clean up old summary files, keeping only the most recent ones
 * @param keep Number of recent files to keep (default: 10)
 */
export async function cleanupSummaries(keep: number = 10): Promise<void> {
  const files = await listSummaries();
  
  // Sort files by creation time (newest first)
  const sortedFiles = await Promise.all(
    files.map(async file => ({
      path: file,
      ctime: (await fs.stat(file)).ctime
    }))
  );
  sortedFiles.sort((a, b) => b.ctime.getTime() - a.ctime.getTime());

  // Remove older files
  const filesToRemove = sortedFiles.slice(keep);
  await Promise.all(
    filesToRemove.map(file => fs.unlink(file.path))
  );
}