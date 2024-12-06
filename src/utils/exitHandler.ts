import chalk from "chalk";

/**
 * Sets up handlers for graceful process termination
 * Handles both SIGINT (Ctrl+C) and keypress events when in raw mode
 */
export function setupExitHandlers(): void {
  // Register SIGINT handler
  process.on("SIGINT", () => {
    console.log(chalk.red("\nExiting gracefully..."));
    process.exit(0);
  });

  // Handle Ctrl+C even when raw mode is used (for prompts)
  process.stdin.on("keypress", function (_chunk, key) {
    if (key && key.name === "c" && key.ctrl) {
      process.stdout.write("\x1B[?25h"); // Restore cursor
      process.exit(130);
    }
  });
}