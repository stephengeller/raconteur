import { spawn } from "child_process";

export interface ExecResult {
  stdout: string;
  stderr: string;
  code: number | null;
}

/**
 * Execute a command and stream its output in real-time while also capturing it
 * @param command The command to execute
 * @returns Promise resolving to the command output
 */
export async function exec(command: string): Promise<ExecResult> {
  return new Promise<ExecResult>((resolve) => {
    // Split command into program and arguments
    const [cmd, ...args] = command.split(" ");
    const proc = spawn(cmd, args, { stdio: ["inherit", "pipe", "pipe"] });

    let stdout = "";
    let stderr = "";

    // Stream and capture stdout
    proc.stdout.on("data", (data) => {
      const text = data.toString();
      stdout += text;
      process.stdout.write(text);
    });

    // Stream and capture stderr
    proc.stderr.on("data", (data) => {
      const text = data.toString();
      stderr += text;
      process.stderr.write(text);
    });

    // Handle process completion
    proc.on("close", (code) => {
      resolve({
        stdout,
        stderr,
        code,
      });
    });
  });
}

/**
 * Execute a command and validate its output
 * @param command The command to execute
 * @throws Error if the command fails or produces no output
 * @returns The command's stdout
 */
export async function execAndValidate(command: string): Promise<string> {
  const { stdout, code } = await exec(command);

  // Handle command execution errors
  if (code !== 0) {
    throw new Error(`Command failed with exit code ${code}: ${stdout}`);
  }

  // Validate output
  if (!stdout.trim()) {
    throw new Error("No output generated");
  }

  return stdout;
}
