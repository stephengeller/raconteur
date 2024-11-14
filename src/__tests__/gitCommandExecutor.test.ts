import { exec } from 'child_process';
import { SystemGitCommandExecutor, MockGitCommandExecutor } from '../gitCommandExecutor';

jest.mock('child_process', () => ({
  exec: jest.fn()
}));

describe('GitCommandExecutor', () => {
  describe('SystemGitCommandExecutor', () => {
    let executor: SystemGitCommandExecutor;
    const mockExec = exec as unknown as jest.Mock;

    beforeEach(() => {
      executor = new SystemGitCommandExecutor();
      jest.clearAllMocks();
    });

    it('should execute git command successfully', async () => {
      const mockStdout = 'command output';
      mockExec.mockImplementation((cmd: string, callback: Function) => {
        callback(null, mockStdout, '');
      });

      const result = await executor.execute('status', '/test/repo');
      
      expect(result).toBe(mockStdout);
      expect(mockExec).toHaveBeenCalledWith(
        'git -C "/test/repo" status',
        expect.any(Function)
      );
    });

    it('should handle command errors', async () => {
      const mockError = new Error('Command failed');
      mockExec.mockImplementation((cmd: string, callback: Function) => {
        callback(mockError, '', 'error output');
      });

      await expect(executor.execute('status', '/test/repo')).rejects.toThrow(mockError);
    });
  });

  describe('MockGitCommandExecutor', () => {
    let executor: MockGitCommandExecutor;

    beforeEach(() => {
      executor = new MockGitCommandExecutor();
    });

    it('should return mock response when set', async () => {
      const mockResponse = 'mock output';
      executor.setMockResponse('status', mockResponse);

      const result = await executor.execute('status', '/test/repo');
      expect(result).toBe(mockResponse);
    });

    it('should throw error when no mock response is set', async () => {
      await expect(executor.execute('status', '/test/repo')).rejects.toThrow(
        'No mock response set for command: status'
      );
    });
  });
});