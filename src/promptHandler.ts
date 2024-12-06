import prompts from "prompts";

export interface PromptHandler {
  confirmCommit(message: string): Promise<boolean>;

  getExtraContext(): Promise<string>;
}

export class SystemPromptHandler implements PromptHandler {
  async confirmCommit(): Promise<boolean> {
    const response = await prompts({
      type: "toggle",
      name: "value",
      message: "Do you want to commit with the above message?",
      initial: true,
      active: "yes",
      inactive: "no",
    });
    return response.value;
  }

  async getExtraContext(): Promise<string> {
    const response = await prompts({
      type: "text",
      name: "value",
      message: "Enter your extra context:",
    });
    return response.value?.trim() || "";
  }
}

export class MockPromptHandler implements PromptHandler {
  private mockResponses: Map<string, boolean | string> = new Map();

  setMockResponse(prompt: string, response: boolean | string) {
    this.mockResponses.set(prompt, response);
  }

  async confirmCommit(): Promise<boolean> {
    const response = this.mockResponses.get("confirmCommit");
    if (typeof response !== "boolean") {
      throw new Error("No mock response set for confirmCommit");
    }
    return response;
  }

  async getExtraContext(): Promise<string> {
    const response = this.mockResponses.get("getExtraContext");
    if (typeof response !== "string") {
      throw new Error("No mock response set for getExtraContext");
    }
    return response;
  }
}
