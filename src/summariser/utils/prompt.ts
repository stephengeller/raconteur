import fs from "fs/promises";

interface PromptVariables {
  REPO_ROOT: string;
  WEEKS_AGO: number;
}

/**
 * Load and process a prompt template, substituting variables
 * @param templatePath Path to the template file
 * @param variables Variables to substitute in the template
 * @returns Processed prompt content
 */
export async function processPromptTemplate(
  templatePath: string,
  variables: PromptVariables,
): Promise<string> {
  // Read the template
  const template = await fs.readFile(templatePath, "utf-8");

  // Replace variables
  return template.replace(/\{(\w+)}/g, (match, key) => {
    if (key in variables) {
      return String(variables[key as keyof PromptVariables]);
    }
    // Leave unmatched variables unchanged
    return match;
  });
}
