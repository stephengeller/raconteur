import fs from "fs/promises";
import path from "path";
import { Logger } from "../raconteur/logger";
import { promptForWeeks } from "./prompts";
import { execAndValidate } from "./utils/exec";
import { readSummary, listSummaries, cleanupSummaries } from "./utils/files";

export class Summariser {
  constructor() {
    // No configuration needed for now
  }

  async run(): Promise<void> {
    try {
      // Get the number of weeks to analyze
      const weeksAgo = await promptForWeeks();

      // Generate the summary using Goose
      const summaryPath = await this.generateSummary(weeksAgo);

      // Read the generated summary
      const summary = await readSummary(summaryPath);

      // Display the summary
      Logger.success("Achievement Summary:");
      console.log(summary);

      // Copy to clipboard if requested
      await this.handleClipboardCopy(summary);

      // Cleanup old summaries
      await cleanupSummaries();
    } catch (error) {
      Logger.error(
        error instanceof Error ? error.message : "Unknown error",
        error instanceof Error ? error : undefined,
      );
      process.exit(1);
    }
  }

  private async generateSummary(weeksAgo: number): Promise<string> {
    Logger.progress("Generating achievement summary...");

    const promptPath = path.resolve(__dirname, "./prompts/achievements.md");
    await execAndValidate(`goose run --instructions ${promptPath}`);

    // Get the most recently created summary file
    const files = await listSummaries();
    if (files.length === 0) {
      throw new Error("No summary file was generated");
    }

    // Sort by creation time (newest first) and get the latest
    const sortedFiles = await Promise.all(
      files.map(async file => ({
        path: file,
        ctime: (await fs.stat(file)).ctime
      }))
    );
    sortedFiles.sort((a, b) => b.ctime.getTime() - a.ctime.getTime());

    return sortedFiles[0].path;
  }

  private async handleClipboardCopy(content: string): Promise<void> {
    try {
      const { copyToClipboardWithConfirmation } = await import(
        "../raconteur/prompts"
      );
      await copyToClipboardWithConfirmation(content);
    } catch (error) {
      Logger.error(
        "Failed to handle clipboard operation",
        error instanceof Error ? error : undefined,
      );
    }
  }
}