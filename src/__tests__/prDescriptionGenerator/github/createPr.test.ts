import { extractConventionalCommitTitle } from '../../../prDescriptionGenerator/github/createPr';

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

describe('createPr', () => {
  describe('extractConventionalCommitTitle', () => {
    it('should extract conventional commit title with Jira ticket on separate line', () => {
      const prDescription = `[PROJ-123]\nfeat: add new feature\nSome description here`;
      const result = extractConventionalCommitTitle(prDescription, 'default-branch');
      expect(result).toBe('[PROJ-123] feat: add new feature');
    });

    it('should extract conventional commit title with inline Jira ticket', () => {
      const prDescription = '[EXPERIENCE-1212] refactor: Improve Match/No Match logic in Voice Support\nSome description here';
      const result = extractConventionalCommitTitle(prDescription, 'default-branch');
      expect(result).toBe('[EXPERIENCE-1212] refactor: Improve Match/No Match logic in Voice Support');
    });

    it('should extract conventional commit title with multiple inline Jira tickets', () => {
      const prDescription = '[PROJ-123][PROJ-456] feat: add new feature\nSome description here';
      const result = extractConventionalCommitTitle(prDescription, 'default-branch');
      expect(result).toBe('[PROJ-123][PROJ-456] feat: add new feature');
    });

    it('should extract conventional commit title without Jira ticket', () => {
      const prDescription = 'feat: add new feature\nSome description here';
      const result = extractConventionalCommitTitle(prDescription, 'default-branch');
      expect(result).toBe('feat: add new feature');
    });

    it('should handle multiple conventional commit types', () => {
      const prDescription = `[PROJ-123]\nfeat: first feature\nfix: bug fix\nchore: cleanup`;
      const result = extractConventionalCommitTitle(prDescription, 'default-branch');
      expect(result).toBe('[PROJ-123] feat: first feature');
    });

    it('should return default branch name when no conventional commit found', () => {
      const prDescription = 'Some random text\nwithout conventional commit';
      const defaultBranch = 'default-branch';
      const result = extractConventionalCommitTitle(prDescription, defaultBranch);
      expect(result).toBe(defaultBranch);
    });

    it('should handle empty description', () => {
      const defaultBranch = 'default-branch';
      const result = extractConventionalCommitTitle('', defaultBranch);
      expect(result).toBe(defaultBranch);
    });

    it('should handle description with only Jira ticket', () => {
      const prDescription = '[PROJ-123]';
      const defaultBranch = 'default-branch';
      const result = extractConventionalCommitTitle(prDescription, defaultBranch);
      expect(result).toBe(defaultBranch);
    });

    it('should handle all conventional commit types', () => {
      const types = ['feat', 'fix', 'chore', 'docs', 'style', 'refactor', 'perf', 'test'];
      types.forEach(type => {
        const prDescription = `${type}: some change`;
        const result = extractConventionalCommitTitle(prDescription, 'default');
        expect(result).toBe(`${type}: some change`);
      });
    });

    it('should trim trailing punctuation from commit title', () => {
      const prDescription = '[PROJ-123]\nfeat: add feature.';
      const result = extractConventionalCommitTitle(prDescription, 'default');
      expect(result).toBe('[PROJ-123] feat: add feature');
    });

    it('should handle multiple Jira ticket references', () => {
      const prDescription = `[PROJ-123][PROJ-456]\nfeat: add feature`;
      const result = extractConventionalCommitTitle(prDescription, 'default');
      expect(result).toBe('[PROJ-123][PROJ-456] feat: add feature');
    });

    it('extracts the conventional commit title from PR description with title section', () => {
      const prDescription = `
        ## PR Title: feat: Add new feature
        This is a new feature that adds functionality.
      `;
      const defaultTitle = "default-title";
      const result = extractConventionalCommitTitle(prDescription, defaultTitle);
      expect(result).toBe("feat: Add new feature");
    });

    it('extracts the conventional commit title from PR description with single # title section', () => {
      const prDescription = `
        # PR Title: feat: Add new feature
        This is a new feature that adds functionality.
      `;
      const defaultTitle = "default-title";
      const result = extractConventionalCommitTitle(prDescription, defaultTitle);
      expect(result).toBe("feat: Add new feature");
    });

    it('extracts the conventional commit title from PR description with triple ### title section', () => {
      const prDescription = `
        ### PR Title: feat: Add new feature
        This is a new feature that adds functionality.
      `;
      const defaultTitle = "default-title";
      const result = extractConventionalCommitTitle(prDescription, defaultTitle);
      expect(result).toBe("feat: Add new feature");
    });

    it('extracts the conventional commit title from PR description with many ##### title section', () => {
      const prDescription = `
        ##### PR Title: feat: Add new feature
        This is a new feature that adds functionality.
      `;
      const defaultTitle = "default-title";
      const result = extractConventionalCommitTitle(prDescription, defaultTitle);
      expect(result).toBe("feat: Add new feature");
    });

    it('returns the default title when PR description does not contain conventional commit title', () => {
      const prDescription = `
        ## PR Title: This is a PR title
        This PR does not follow the conventional commit format.
      `;
      const defaultTitle = "default-title";
      const result = extractConventionalCommitTitle(prDescription, defaultTitle);
      expect(result).toBe(defaultTitle);
    });
  });
});