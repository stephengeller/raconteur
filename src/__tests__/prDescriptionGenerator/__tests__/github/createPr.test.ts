import { execSync } from "child_process";
import { Octokit } from "@octokit/rest";
import {
  createGitHubPr,
  extractConventionalCommitTitle,
} from "../../../../prDescriptionGenerator/github/createPr";

jest.mock("child_process", () => ({
  execSync: jest.fn(),
}));

jest.mock("@octokit/rest", () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    pulls: {
      create: jest.fn(),
    },
  })),
}));

describe("createGitHubPr", () => {
  it("creates a pull request with the correct parameters", async () => {
    // Mock execSync to return branch name and repo info
    (execSync as jest.Mock)
      .mockReturnValueOnce(Buffer.from("branch-name"))
      .mockReturnValueOnce(Buffer.from("github.com:owner/repo.git"));

    const octokit = new Octokit();
    // Cast to any to allow mockResolvedValue
    (octokit.pulls.create as jest.MockedFunction<any>).mockResolvedValue({
      data: { html_url: "https://github.com/owner/repo/pull/1" },
    });

    const prDescription = "This is a PR description";
    const dirPath = "/path/to/repo";

    process.env.GITHUB_TOKEN = "token";

    await createGitHubPr(prDescription, dirPath);

    expect(octokit.pulls.create).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      head: "branch-name",
      base: "main",
      title: expect.any(String),
      body: prDescription,
    });
  });

  it("throws an error when the GitHub token is not set", async () => {
    process.env.GITHUB_TOKEN = undefined;

    await expect(
      createGitHubPr("PR description", "/path/to/repo"),
    ).rejects.toThrow("GitHub token is not set in the environment variables");
  });
});

describe("extractConventionalCommitTitle", () => {
  it("extracts the conventional commit title from the PR description", () => {
    const prDescription = `
      ## PR Title: feat: Add new feature
      This is a new feature that adds functionality.
    `;
    const defaultTitle = "default-title";
    const result = extractConventionalCommitTitle(prDescription, defaultTitle);
    expect(result).toBe("feat: Add new feature");
  });

  it("returns the default title when the PR description does not contain a conventional commit title", () => {
    const prDescription = `
      ## PR Title: This is a PR title
      This PR does not follow the conventional commit format.
    `;
    const defaultTitle = "default-title";
    const result = extractConventionalCommitTitle(prDescription, defaultTitle);
    expect(result).toBe(defaultTitle);
  });

  it("removes trailing symbols from the title", () => {
    const prDescription = `
      ## PR Title: feat: Add new feature*
        This is a new feature that adds functionality.
            `;
    const defaultTitle = "default-title";
    const result = extractConventionalCommitTitle(prDescription, defaultTitle);
    expect(result).toBe("feat: Add new feature");
  });
});
