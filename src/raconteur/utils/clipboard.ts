import chalk from "chalk";
import { copyToClipboard } from "../../copyToClipboard";
import { UserPrompts } from "../ui/prompts";
import { IClipboardManager } from "../services/types";
import { Logger } from "../services/logger";

export class ClipboardManager implements IClipboardManager {
  async copyWithConfirmation(content: string, message?: string): Promise<void> {
    try {
      const shouldCopy = await UserPrompts.confirmCopyToClipboard(message);
      if (shouldCopy) {
        await copyToClipboard(content);
        Logger.success("Content copied to clipboard!");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        Logger.error(`Failed to copy to clipboard: ${error.message}`);
      } else {
        Logger.error('Failed to copy to clipboard: Unknown error');
      }
    }
  }
}