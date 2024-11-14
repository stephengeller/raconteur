import { exec } from "child_process";

export interface GitCommandExecutor {
  execute(command: string, repoPath: string): Promise<string>;
}

export class SystemGitCommandExecutor implements GitCommandExecutor {
  async execute(command: string, repoPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(`git -C "${repoPath}" ${command}`, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }
}

export class MockGitCommandExecutor implements GitCommandExecutor {
  private mockResponses: Map<string, string> = new Map();

  setMockResponse(command: string, response: string) {
    this.mockResponses.set(command, response);
  }

  async execute(command: string, repoPath: string): Promise<string> {
    const response = this.mockResponses.get(command);
    if (response === undefined) {
      throw new Error(`No mock response set for command: ${command}`);
    }
    return response;
  }
}