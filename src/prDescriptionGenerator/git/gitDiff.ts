import { execSync } from "node:child_process";

export async function getGitDiff(
  dirPath: string,
  baseBranch: string,
): Promise<string> {
  return execSync(`git diff ${baseBranch}`, { cwd: dirPath }).toString();
}
