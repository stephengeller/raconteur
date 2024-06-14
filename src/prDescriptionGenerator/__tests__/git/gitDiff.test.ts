import { execSync } from "child_process";
import { getGitDiff } from "../../git/gitDiff";

jest.mock("child_process", () => ({
  execSync: jest.fn(),
}));

describe("getGitDiff", () => {
  it("returns the git diff for the given directory and base branch", async () => {
    (execSync as jest.Mock).mockReturnValue(Buffer.from("git diff output"));

    const result = await getGitDiff("/path/to/repo", "main");

    expect(result).toBe("git diff output");
    expect(execSync).toHaveBeenCalledWith("git diff main", {
      cwd: "/path/to/repo",
    });
  });

  it("throws an error when the git diff command fails", async () => {
    (execSync as jest.Mock).mockImplementation(() => {
      throw new Error("git diff command failed");
    });

    await expect(getGitDiff("/path/to/repo", "main")).rejects.toThrow(
      "git diff command failed",
    );
  });
});
