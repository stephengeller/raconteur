import { exec } from "child_process";
import * as fs from "fs";
import path from "path";
import { PullRequest } from "../types";
import { ISummaryGenerator, Summary } from "./types";
import { callChatGPTApi } from "../../ChatGPTApi";
import { loadCustomPrompt } from "../../prDescriptionGenerator/prompts/customPrompt";
import { GITHUB_ACHIEVEMENTS_PROMPT, SOCIAL_ACHIEVEMENTS_PROMPT } from "../prompts";
import { SummaryGenerationError } from "../errors";
import { Logger } from "./logger";

export class SummaryGenerator implements ISummaryGenerator {
  async generateGitHubSummary(prs: PullRequest[]): Promise<Summary> {
    const prsData: string = JSON.stringify(prs);
    const tempFilePath: string = "./temp_prs_data.json";
    fs.writeFileSync(tempFilePath, prsData);

    try {
      Logger.progress("Generating GitHub summary...");
      
      const customPromptPath = path.resolve(`./customRaconteurPrompt.txt`);
      const customPrompt = loadCustomPrompt(customPromptPath);
      const prompt = customPrompt || GITHUB_ACHIEVEMENTS_PROMPT;

      if (customPrompt) {
        Logger.info(`Using custom prompt from: ${customPromptPath}`);
      } else {
        Logger.info(`Using default prompt`);
      }

      const content = await callChatGPTApi(prompt, prsData);
      fs.unlinkSync(tempFilePath);

      return {
        content,
        metadata: {
          generatedAt: new Date(),
          source: 'github',
          type: 'pr',
        },
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new SummaryGenerationError(`Failed to generate GitHub summary: ${error.message}`);
      }
      throw new SummaryGenerationError('Failed to generate GitHub summary: Unknown error');
    }
  }

  async generateSocialSummary(useGoose: boolean): Promise<Summary> {
    try {
      Logger.progress("Generating social summary...");
      
      if (useGoose) {
        return await this.generateGooseSummary();
      } else {
        return {
          content: SOCIAL_ACHIEVEMENTS_PROMPT,
          metadata: {
            generatedAt: new Date(),
            source: 'slack',
            type: 'social',
          },
        };
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new SummaryGenerationError(`Failed to generate social summary: ${error.message}`);
      }
      throw new SummaryGenerationError('Failed to generate social summary: Unknown error');
    }
  }

  private async generateGooseSummary(): Promise<Summary> {
    const promptPath = path.resolve(__dirname, '../prompts/social-achievements.md');
    const { stdout, stderr } = await new Promise<{stdout: string, stderr: string}>((resolve) => {
      exec(`goose run --instructions ${promptPath} --with-builtin slack`, (error, stdout, stderr) => {
        resolve({ stdout: stdout || '', stderr: stderr || '' });
      });
    });

    if (stderr) {
      throw new SummaryGenerationError(`Goose error: ${stderr}`);
    }

    return {
      content: stdout,
      metadata: {
        generatedAt: new Date(),
        source: 'slack',
        type: 'social',
      },
    };
  }
}