import chalk from "chalk";
import { copyToClipboard } from "../../copyToClipboard";
import { UserPrompts } from "../ui/prompts";

export class ClipboardManager {
  static async copyWithConfirmation(content: string, message?: string): Promise<void> {
    const shouldCopy = await UserPrompts.confirmCopyToClipboard(message);
    if (shouldCopy) {
      await copyToClipboard(content);
      console.log(chalk.green("✅  Content copied to clipboard!"));
    }
  }
}