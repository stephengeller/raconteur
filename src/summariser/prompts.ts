import prompts from "prompts";
import chalk from "chalk";

export async function promptForWeeks(): Promise<number> {
  const response = await prompts({
    type: "number",
    name: "value",
    message: chalk.yellow("How many weeks of achievements would you like to analyze?"),
    initial: 2,
    validate: value => value > 0 ? true : "Please enter a number greater than 0"
  });
  
  return response.value || 2; // Default to 2 weeks if no response
}