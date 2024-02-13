import { exec } from "child_process";

export function copyToClipboard(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const platform = process.platform;

    let command: string;
    if (platform === "darwin") {
      command = "pbcopy";
    } else if (platform === "win32") {
      command = "clip";
    } else if (platform === "linux") {
      // Requires 'xclip' or 'xsel' to be installed on Linux
      command = "xclip -selection clipboard" || "xsel --clipboard --input";
    } else {
      return reject(
        new Error(
          `Platform ${platform} is not supported for clipboard operations.`,
        ),
      );
    }

    const proc = exec(command, (error) => {
      if (error) return reject(error);
      resolve();
    });
    proc.stdin?.write(text);
    proc.stdin?.end();
  });
}
