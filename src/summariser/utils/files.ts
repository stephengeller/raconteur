import fs from "fs/promises";
import path from "path";

/**
 * Save content to a file in the tmp/summaries directory
 * @param content Content to save
 * @returns Path to the saved file
 */
export async function saveSummary(content: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `summary-${timestamp}.md`;
  const filepath = path.resolve(process.cwd(), "tmp/summaries", filename);

  // Ensure the directory exists
  await fs.mkdir(path.dirname(filepath), { recursive: true });
  
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
  const summariesDir = path.resolve(process.cwd(), "tmp/summaries");
  
  try {
    const files = await fs.readdir(summariesDir);
    return files.map(file => path.join(summariesDir, file));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      // Directory doesn't exist yet, return empty array
      return [];
    }
    throw error;
  }
}

/**
 * Clean up old summary files, keeping only the most recent ones
 * @param keep Number of recent files to keep (default: 10)
 */
export async function cleanupSummaries(keep: number = 10): Promise<void> {
  const files = await listSummaries();
  
  // If no files or directory doesn't exist yet, nothing to do
  if (files.length === 0) return;
  
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