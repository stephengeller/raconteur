import { exec } from "child_process";
import * as fs from "fs";
import path from "path";
import chalk from "chalk";
import { PullRequest } from "../types";
import { callChatGPTApi } from "../../ChatGPTApi";
import { loadCustomPrompt } from "../../prDescriptionGenerator/prompts/customPrompt";
import { GITHUB_ACHIEVEMENTS_PROMPT, SOCIAL_ACHIEVEMENTS_PROMPT } from "../prompts";

export class SummaryGenerator {
  static async generateGitHubSummary(prs: PullRequest[]): Promise<string> {
    const prsData: string = JSON.stringify(prs);
    const tempFilePath: string = "./temp_prs_data.json";
    fs.writeFileSync(tempFilePath, prsData);

    try {
      const customPromptPath = path.resolve(`./customRaconteurPrompt.txt`);
      const customPrompt = loadCustomPrompt(customPromptPath);
      const prompt = customPrompt || GITHUB_ACHIEVEMENTS_PROMPT;

      if (customPrompt) {
        console.log(chalk.blue(`Using custom prompt from: ${customPromptPath}`));
      } else {
        console.log(chalk.blue(`Using default prompt`));
      }

      const summary = await callChatGPTApi(prompt, prsData);
      fs.unlinkSync(tempFilePath);
      return summary;
    } catch (error) {
      throw new Error(`Failed to generate GitHub summary: ${error}`);
    }
  }

  static async generateSocialSummary(useGoose: boolean): Promise<string> {
    if (useGoose) {
      return await SummaryGenerator.generateGooseSummary();
    } else {
      return SOCIAL_ACHIEVEMENTS_PROMPT;
    }
  }

  private static async generateGooseSummary(): Promise<string> {
    const promptPath = path.resolve(__dirname, '../prompts/social-achievements.md');
    const { stdout, stderr } = await new Promise<{stdout: string, stderr: string}>((resolve) => {
      exec(`goose run --instructions ${promptPath} --with-builtin slack`, (error, stdout, stderr) => {
        resolve({ stdout: stdout || '', stderr: stderr || '' });
      });
    });

    if (stderr) {
      throw new Error(`Goose error: ${stderr}`);
    }

    return stdout;
  }
}