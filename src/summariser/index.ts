import { exec } from "child_process";
import path from "path";
import { Logger } from "../raconteur/logger";
import { promptForWeeks } from "./prompts";

export class Summariser {
  constructor() {
    // No configuration needed for now
  }

  async run(): Promise<void> {
    try {
      // Get the number of weeks to analyze
      const weeksAgo = await promptForWeeks();

      // Generate the summary using Goose
      const summary = await this.generateSummary(weeksAgo);

      // Display the summary
      Logger.success("Achievement Summary:");
      console.log(summary);

      // Copy to clipboard if requested
      await this.handleClipboardCopy(summary);
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

    // Execute Goose with our prompt
    const { stdout, code } = await new Promise<{
      stdout: string;
      stderr: string;
      code: number | null;
    }>((resolve) =>
      exec(
        `goose run --instructions ${promptPath}`,
        (error, stdout, stderr) => {
          resolve({
            stdout: stdout || "",
            stderr: stderr || "",
            code: error ? error.code || 1 : 0,
          });
        },
      ),
    );

    // Handle command execution errors
    if (code !== 0) {
      throw new Error(`Goose command failed with exit code ${code}: ${stdout}`);
    }

    // Validate output
    if (!stdout.trim()) {
      throw new Error("No summary generated");
    }

    return stdout;
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
