import { extractConventionalCommitTitle } from "../../../../prDescriptionGenerator/github/createPr";

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
