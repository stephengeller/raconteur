import { cleanCommitMessage } from "./main";

describe("cleanCommitMessage", () => {
  const testCases = [
    {
      name: "should handle plaintext language identifier",
      input: "```plaintext\nfeat: add new feature\n```",
      expected: "feat: add new feature",
    },
    {
      name: "should handle text language identifier",
      input: "```text\nfeat: add new feature\n```",
      expected: "feat: add new feature",
    },
    {
      name: "should be case insensitive for language identifiers",
      input: "```PLAINTEXT\nfeat: add new feature\n```",
      expected: "feat: add new feature",
    },
    {
      name: "should handle newlines after language identifier",
      input: "```plaintext\n\nfeat: add new feature\n```",
      expected: "feat: add new feature",
    },
    {
      name: "should maintain backward compatibility with simple backticks",
      input: "```feat: add new feature```",
      expected: "feat: add new feature",
    },
    {
      name: "should properly trim whitespace",
      input: "```plaintext\n  feat: add new feature  \n```",
      expected: "feat: add new feature",
    },
    {
      name: "should handle message without any backticks",
      input: "feat: add new feature",
      expected: "feat: add new feature",
    },
    {
      name: "should handle empty message with backticks",
      input: "```plaintext\n```",
      expected: "",
    },
  ];

  testCases.forEach(({ name, input, expected }) => {
    it(name, () => {
      const result = cleanCommitMessage(input);
      expect(result).toBe(expected);
    });
  });
});
