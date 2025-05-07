import { exec as childProcessExec, ExecException } from "child_process";

export interface ExecResult {
  stdout: string;
  stderr: string;
  code: number | null;
}

type ExecCallback = (error: ExecException | null, stdout: string, stderr: string) => void;

/**
 * Execute a command and return its output
 * @param command The command to execute
 * @returns Promise resolving to the command output
 */
export async function exec(command: string): Promise<ExecResult> {
  return new Promise<ExecResult>((resolve) =>
    childProcessExec(command, (error: ExecException | null, stdout: string, stderr: string) => {
      resolve({
        stdout: stdout || "",
        stderr: stderr || "",
        code: error ? error.code || 1 : 0,
      });
    }),
  );
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