import { exec } from "child_process";
import * as fs from "fs";
import path from "path";
import { PullRequest } from "./types";
import { callChatGPTApi } from "../ChatGPTApi";
import { loadCustomPrompt } from "../prDescriptionGenerator/prompts/customPrompt";

const GITHUB_ACHIEVEMENTS_PROMPT = `You are helping to document GitHub achievements for an L5 IC engineer at Block. Focus on technical contributions, code quality, and architectural decisions. Generate clear, impactful summaries that map to Impact, Behavior, and Betterment (IBB) framework.

Output Format:
###### [Date]
- **[Category > Subcategory]** Description [Evidence](link)`;

const SOCIAL_ACHIEVEMENTS_PROMPT = `You are helping to document non-coding achievements and social contributions for an L5 IC engineer at Block. Focus on activities, interactions, and achievements found in Slack, meeting notes, documentation, and other non-GitHub sources.

Output Format:
###### [Date]
- **[Category > Subcategory]** Description [Evidence](link)`;

export async function generateGitHubSummary(prs: PullRequest[]): Promise<string> {
  const prsData: string = JSON.stringify(prs);
  const tempFilePath: string = "./temp_prs_data.json";
  fs.writeFileSync(tempFilePath, prsData);

  try {
    const customPromptPath = path.resolve(`./customRaconteurPrompt.txt`);
    const customPrompt = loadCustomPrompt(customPromptPath);
    const prompt = customPrompt || GITHUB_ACHIEVEMENTS_PROMPT;

    const summary = await callChatGPTApi(prompt, prsData);
    fs.unlinkSync(tempFilePath);
    return summary;
  } catch (error) {
    throw new Error(`Failed to generate GitHub summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateSocialSummary(useGoose: boolean): Promise<string> {
  if (!useGoose) {
    return SOCIAL_ACHIEVEMENTS_PROMPT;
  }

  const promptPath = path.resolve(__dirname, './prompts/social-achievements.md');
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