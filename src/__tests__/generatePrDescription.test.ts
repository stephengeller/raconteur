import { extractConventionalCommitTitle } from "../generatePrDescription";

describe("extractConventionalCommitTitle", () => {
  it("returns the conventional commit title when present in the PR description", () => {
    const prDescription = `
      feat: Add new feature
      This is a new feature that adds functionality.
    `;
    const defaultTitle = "default-title";
    const result = extractConventionalCommitTitle(prDescription, defaultTitle);
    expect(result).toBe("feat: Add new feature");
  });

  it("returns the default title when no conventional commit title is present in the PR description", () => {
    const prDescription = `
      This is a new feature that adds functionality.
    `;
    const defaultTitle = "default-title";
    const result = extractConventionalCommitTitle(prDescription, defaultTitle);
    expect(result).toBe(defaultTitle);
  });

  it("returns the first conventional commit title when multiple are present in the PR description", () => {
    const prDescription = `
      feat: Add new feature
      This is a new feature that adds functionality.
      fix: Fix a bug
      This is a bug fix.
    `;
    const defaultTitle = "default-title";
    const result = extractConventionalCommitTitle(prDescription, defaultTitle);
    expect(result).toBe("feat: Add new feature");
  });
});
