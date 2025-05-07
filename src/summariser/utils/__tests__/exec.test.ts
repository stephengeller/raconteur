import { ExecException } from "child_process";
import { exec, execAndValidate } from "../exec";

jest.mock("child_process", () => ({
  exec: jest.fn(),
}));

type MockCallback = (error: ExecException | null, stdout: string, stderr: string) => void;

describe("exec utilities", () => {
  const mockExec = jest.requireMock("child_process").exec as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("exec", () => {
    it("should execute a command and return its output", async () => {
      mockExec.mockImplementation((cmd: string, callback: MockCallback) =>
        callback(null, "test output", ""),
      );

      const result = await exec("test command");
      expect(result).toEqual({
        stdout: "test output",
        stderr: "",
        code: 0,
      });
    });

    it("should handle command errors", async () => {
      const error = new Error("Command failed") as ExecException;
      Object.assign(error, { code: 1 });
      mockExec.mockImplementation((cmd: string, callback: MockCallback) =>
        callback(error, "", "error output"),
      );

      const result = await exec("test command");
      expect(result).toEqual({
        stdout: "",
        stderr: "error output",
        code: 1,
      });
    });
  });

  describe("execAndValidate", () => {
    it("should return stdout for successful commands", async () => {
      mockExec.mockImplementation((cmd: string, callback: MockCallback) =>
        callback(null, "test output", ""),
      );

      const result = await execAndValidate("test command");
      expect(result).toBe("test output");
    });

    it("should throw error for failed commands", async () => {
      const error = new Error("Command failed") as ExecException;
      Object.assign(error, { code: 1 });
      mockExec.mockImplementation((cmd: string, callback: MockCallback) =>
        callback(error, "error message", ""),
      );

      await expect(execAndValidate("test command")).rejects.toThrow(
        "Command failed with exit code 1: error message",
      );
    });

    it("should throw error for empty output", async () => {
      mockExec.mockImplementation((cmd: string, callback: MockCallback) => 
        callback(null, "", ""),
      );

      await expect(execAndValidate("test command")).rejects.toThrow(
        "No output generated",
      );
    });

    it("should throw error for whitespace-only output", async () => {
      mockExec.mockImplementation((cmd: string, callback: MockCallback) =>
        callback(null, "  \n  \t  ", ""),
      );

      await expect(execAndValidate("test command")).rejects.toThrow(
        "No output generated",
      );
    });
  });
});