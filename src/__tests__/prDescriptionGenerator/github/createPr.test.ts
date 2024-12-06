import { extractConventionalCommitTitle } from '../../../prDescriptionGenerator/github/createPr';

describe('createPr', () => {
  describe('extractConventionalCommitTitle', () => {
    it('should extract conventional commit title with Jira ticket', () => {
      const prDescription = `[PROJ-123]
feat: add new feature
Some description here`;
      const result = extractConventionalCommitTitle(prDescription, 'default-branch');
      expect(result).toBe('[PROJ-123] feat: add new feature');
    });

    it('should extract conventional commit title without Jira ticket', () => {
      const prDescription = 'feat: add new feature\nSome description here';
      const result = extractConventionalCommitTitle(prDescription, 'default-branch');
      expect(result).toBe('feat: add new feature');
    });

    it('should handle multiple conventional commit types', () => {
      const prDescription = `[PROJ-123]
feat: first feature
fix: bug fix
chore: cleanup`;
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
      const prDescription = `[PROJ-123][PROJ-456]
feat: add feature`;
      const result = extractConventionalCommitTitle(prDescription, 'default');
      expect(result).toBe('[PROJ-123][PROJ-456] feat: add feature');
    });
  });
});