import { exec } from "child_process";
import * as fs from "fs";
import path from "path";
import { PullRequest } from "./types";
import { callChatGPTApi } from "../ChatGPTApi";
import { loadCustomPrompt } from "../prDescriptionGenerator/prompts/customPrompt";
import { Logger } from "./logger";

// Default prompts (fallbacks)
const DEFAULT_GITHUB_ACHIEVEMENTS_PROMPT = `You are helping to document GitHub achievements for an engineer at Block. Focus on technical contributions, code quality, and architectural decisions. Generate clear, impactful summaries..

Output Format:
###### [Date]
- **[Category > Subcategory]** Description [Evidence](link)`;

const DEFAULT_SOCIAL_ACHIEVEMENTS_PROMPT = `You are helping to document non-coding achievements and social contributions for an engineer at Block. Focus on activities, interactions, and achievements found in Slack, meeting notes, documentation, and other non-GitHub sources.

Output Format:
###### [Date]
- **[Category > Subcategory]** Description [Evidence](link)`;

// Load prompts from files if they exist
function loadPromptFromFile(filePath: string): string | null {
  try {
    if (fs.existsSync(filePath)) {
      Logger.info(`Loading prompt from ${filePath}`);
      return fs.readFileSync(filePath, "utf8");
    }
  } catch (error) {
    Logger.warning(`Failed to load prompt from ${filePath}`);
  }
  return null;
}

// Get GitHub achievements prompt
const githubPromptPath = path.resolve(__dirname, "./prompts/githubAchievements.ts");
let GITHUB_ACHIEVEMENTS_PROMPT = DEFAULT_GITHUB_ACHIEVEMENTS_PROMPT;

try {
  // Try to load from the prompts directory
  if (fs.existsSync(githubPromptPath)) {
    // This is a bit hacky but works - we're importing the TS file contents and extracting the prompt
    const githubPromptContent = fs.readFileSync(githubPromptPath, "utf8");
    const promptMatch = githubPromptContent.match(/export const GITHUB_ACHIEVEMENTS_PROMPT = `([\s\S]*?)`/);
    if (promptMatch && promptMatch[1]) {
      GITHUB_ACHIEVEMENTS_PROMPT = promptMatch[1];
      Logger.info("Using GitHub achievements prompt from prompts directory");
    }
  }
} catch (error) {
  Logger.warning("Failed to load GitHub achievements prompt from prompts directory, using default");
}

// Get Social achievements prompt
const socialPromptPath = path.resolve(__dirname, "./prompts/socialAchievements.ts");
let SOCIAL_ACHIEVEMENTS_PROMPT = DEFAULT_SOCIAL_ACHIEVEMENTS_PROMPT;

try {
  // Try to load from the prompts directory
  if (fs.existsSync(socialPromptPath)) {
    // This is a bit hacky but works - we're importing the TS file contents and extracting the prompt
    const socialPromptContent = fs.readFileSync(socialPromptPath, "utf8");
    const promptMatch = socialPromptContent.match(/export const SOCIAL_ACHIEVEMENTS_PROMPT = `([\s\S]*?)`/);
    if (promptMatch && promptMatch[1]) {
      SOCIAL_ACHIEVEMENTS_PROMPT = promptMatch[1];
      Logger.info("Using social achievements prompt from prompts directory");
    }
  }
} catch (error) {
  Logger.warning("Failed to load social achievements prompt from prompts directory, using default");
}

export async function generateGitHubSummary(
  prs: PullRequest[],
): Promise<string> {
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

    const summary = await callChatGPTApi(prompt, prsData);
    fs.unlinkSync(tempFilePath);
    return summary;
  } catch (error) {
    throw new Error(
      `Failed to generate GitHub summary: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

export async function generateSocialSummary(
  useGoose: boolean,
): Promise<string> {
  if (!useGoose) {
    return SOCIAL_ACHIEVEMENTS_PROMPT;
  }

  Logger.progress("Generating social summary...");

  const promptPath = path.resolve(
    __dirname,
    "./prompts/social-achievements.md",
  );
  const { stdout, stderr } = await new Promise<{
    stdout: string;
    stderr: string;
  }>((resolve) => {
    exec(
      `goose run --instructions ${promptPath} --with-builtin slack`,
      (error, stdout, stderr) => {
        resolve({ stdout: stdout || "", stderr: stderr || "" });
      },
    );
  });

  if (stderr) {
    throw new Error(`Goose error: ${stderr}`);
  }

  return stdout;
}

// Get Combined achievements prompt
const combinedPromptPath = path.resolve(__dirname, "./prompts/combinedAchievements.ts");
let COMBINED_ACHIEVEMENTS_PROMPT = `You are helping to document both GitHub and non-coding achievements for an engineer at Block. Focus on technical contributions, social interactions, and all achievements.

Output Format:
###### [Date]
- **[Category > Subcategory]** Description [Evidence](link)`;

try {
  // Try to load from the prompts directory
  if (fs.existsSync(combinedPromptPath)) {
    // This is a bit hacky but works - we're importing the TS file contents and extracting the prompt
    const combinedPromptContent = fs.readFileSync(combinedPromptPath, "utf8");
    const promptMatch = combinedPromptContent.match(/export const COMBINED_ACHIEVEMENTS_PROMPT = `([\s\S]*?)`/);
    if (promptMatch && promptMatch[1]) {
      COMBINED_ACHIEVEMENTS_PROMPT = promptMatch[1];
      Logger.info("Using combined achievements prompt from prompts directory");
    }
  }
} catch (error) {
  Logger.warning("Failed to load combined achievements prompt from prompts directory, using default");
}

export async function generateCombinedSummary(
  prs: PullRequest[],
  useGoose: boolean
): Promise<string> {
  const prsData: string = JSON.stringify(prs);
  const tempFilePath: string = "./temp_prs_data.json";
  fs.writeFileSync(tempFilePath, prsData);

  try {
    Logger.progress("Generating combined summary...");

    // First get GitHub summary
    const customPromptPath = path.resolve(`./customCombinedPrompt.txt`);
    const customPrompt = loadCustomPrompt(customPromptPath);
    const prompt = customPrompt || COMBINED_ACHIEVEMENTS_PROMPT;

    if (customPrompt) {
      Logger.info(`Using custom combined prompt from: ${customPromptPath}`);
    } else {
      Logger.info(`Using default combined prompt`);
    }

    // Get social data if using Goose
    let socialData = "";
    if (useGoose) {
      Logger.progress("Getting social data from Goose...");
      const promptPath = path.resolve(
        __dirname,
        "./prompts/combined-achievements.md",
      );
      const { stdout, stderr } = await new Promise<{
        stdout: string;
        stderr: string;
      }>((resolve) => {
        exec(
          `goose run --instructions ${promptPath} --with-builtin slack`,
          (error, stdout, stderr) => {
            resolve({ stdout: stdout || "", stderr: stderr || "" });
          },
        );
      });

      if (stderr) {
        Logger.warning(`Goose warning: ${stderr}`);
      }
      
      socialData = stdout;
    }

    // Combine PR data with social data
    const combinedData = {
      prs: JSON.parse(prsData),
      socialData: socialData
    };

    const summary = await callChatGPTApi(prompt, JSON.stringify(combinedData));
    fs.unlinkSync(tempFilePath);
    return summary;
  } catch (error) {
    throw new Error(
      `Failed to generate combined summary: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}
