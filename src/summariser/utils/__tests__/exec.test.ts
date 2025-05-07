import { exec, execAndValidate } from "../exec";
import { spawn } from "child_process";
import { EventEmitter } from "events";

jest.mock("child_process", () => ({
  spawn: jest.fn(),
}));

describe("exec utilities", () => {
  const mockSpawn = jest.requireMock("child_process").spawn;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console spies
    jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    jest.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("exec", () => {
    it("should execute a command and stream its output", async () => {
      // Create mock streams
      const stdout = new EventEmitter();
      const stderr = new EventEmitter();
      
      // Mock the spawn process
      const mockProc = {
        stdout,
        stderr,
        on: jest.fn((event, cb) => {
          if (event === "close") {
            setTimeout(() => cb(0), 0);
          }
        }),
      };
      mockSpawn.mockReturnValue(mockProc);

      // Start the command
      const execPromise = exec("test command");

      // Emit some output
      stdout.emit("data", Buffer.from("test output\n"));
      stderr.emit("data", Buffer.from("test error\n"));

      const result = await execPromise;

      // Verify output was streamed
      expect(process.stdout.write).toHaveBeenCalledWith("test output\n");
      expect(process.stderr.write).toHaveBeenCalledWith("test error\n");

      // Verify output was captured
      expect(result).toEqual({
        stdout: "test output\n",
        stderr: "test error\n",
        code: 0,
      });
    });

    it("should handle command errors", async () => {
      // Create mock streams
      const stdout = new EventEmitter();
      const stderr = new EventEmitter();
      
      // Mock the spawn process with error
      const mockProc = {
        stdout,
        stderr,
        on: jest.fn((event, cb) => {
          if (event === "close") {
            setTimeout(() => cb(1), 0);
          }
        }),
      };
      mockSpawn.mockReturnValue(mockProc);

      // Start the command
      const execPromise = exec("test command");

      // Emit error output
      stderr.emit("data", Buffer.from("error output\n"));

      const result = await execPromise;

      // Verify error was streamed
      expect(process.stderr.write).toHaveBeenCalledWith("error output\n");

      // Verify error was captured
      expect(result).toEqual({
        stdout: "",
        stderr: "error output\n",
        code: 1,
      });
    });
  });

  describe("execAndValidate", () => {
    it("should return stdout for successful commands", async () => {
      // Create mock streams
      const stdout = new EventEmitter();
      const stderr = new EventEmitter();
      
      // Mock the spawn process
      const mockProc = {
        stdout,
        stderr,
        on: jest.fn((event, cb) => {
          if (event === "close") {
            setTimeout(() => cb(0), 0);
          }
        }),
      };
      mockSpawn.mockReturnValue(mockProc);

      // Start the command
      const execPromise = execAndValidate("test command");
      stdout.emit("data", Buffer.from("test output"));

      const result = await execPromise;
      expect(result).toBe("test output");
    });

    it("should throw error for failed commands", async () => {
      // Create mock streams
      const stdout = new EventEmitter();
      const stderr = new EventEmitter();
      
      // Mock the spawn process with error
      const mockProc = {
        stdout,
        stderr,
        on: jest.fn((event, cb) => {
          if (event === "close") {
            setTimeout(() => cb(1), 0);
          }
        }),
      };
      mockSpawn.mockReturnValue(mockProc);

      // Start the command
      const execPromise = execAndValidate("test command");
      stdout.emit("data", Buffer.from("error message"));

      await expect(execPromise).rejects.toThrow(
        "Command failed with exit code 1: error message"
      );
    });

    it("should throw error for empty output", async () => {
      // Create mock streams
      const stdout = new EventEmitter();
      const stderr = new EventEmitter();
      
      // Mock the spawn process
      const mockProc = {
        stdout,
        stderr,
        on: jest.fn((event, cb) => {
          if (event === "close") {
            setTimeout(() => cb(0), 0);
          }
        }),
      };
      mockSpawn.mockReturnValue(mockProc);

      // Start the command
      const execPromise = execAndValidate("test command");
      stdout.emit("data", Buffer.from(""));

      await expect(execPromise).rejects.toThrow("No output generated");
    });

    it("should throw error for whitespace-only output", async () => {
      // Create mock streams
      const stdout = new EventEmitter();
      const stderr = new EventEmitter();
      
      // Mock the spawn process
      const mockProc = {
        stdout,
        stderr,
        on: jest.fn((event, cb) => {
          if (event === "close") {
            setTimeout(() => cb(0), 0);
          }
        }),
      };
      mockSpawn.mockReturnValue(mockProc);

      // Start the command
      const execPromise = execAndValidate("test command");
      stdout.emit("data", Buffer.from("  \n  \t  "));

      await expect(execPromise).rejects.toThrow("No output generated");
    });
  });
});