import path from "path";
import { Logger } from "../raconteur/logger";
import { promptForWeeks } from "./prompts";
import { execAndValidate } from "./utils/exec";
import { saveSummary, readSummary, cleanupSummaries } from "./utils/files";

export class Summariser {
  constructor() {
    // No configuration needed for now
  }

  async run(): Promise<void> {
    try {
      // Get the number of weeks to analyze
      const weeksAgo = await promptForWeeks();

      // Generate and save the summary
      const summaryPath = await this.generateAndSaveSummary(weeksAgo);

      // Read the saved summary
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

  private async generateAndSaveSummary(weeksAgo: number): Promise<string> {
    Logger.progress("Generating achievement summary...");

    const promptPath = path.resolve(__dirname, "./prompts/achievements.md");
    const output = await execAndValidate(`goose run --instructions ${promptPath}`);
    
    Logger.progress("Saving summary...");
    const summaryPath = await saveSummary(output);
    
    return summaryPath;
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