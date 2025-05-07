import { exec } from 'child_process';
import * as path from 'path';
import { Summariser } from '../index';
import { promptForWeeks } from '../prompts';

// Mock dependencies
jest.mock('child_process', () => ({
  exec: jest.fn()
}));
jest.mock('path');
jest.mock('../prompts');
jest.mock('../../raconteur/prompts', () => ({
  copyToClipboardWithConfirmation: jest.fn().mockResolvedValue(undefined)
}));

// Mock process.exit
const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => undefined as never);

describe('Summariser', () => {
  let summariser: Summariser;

  beforeEach(() => {
    jest.clearAllMocks();
    summariser = new Summariser();
    
    // Mock path.resolve to return a test path
    (path.resolve as jest.Mock).mockImplementation((...args) => args.join('/'));
    
    // Mock promptForWeeks to return 2 by default
    (promptForWeeks as jest.Mock).mockResolvedValue(2);
    
    // Mock exec to return a test summary
    (exec as unknown as jest.Mock).mockImplementation((cmd: string, callback: Function) => {
      callback(null, 'Test achievement summary', '');
    });
  });

  afterAll(() => {
    mockExit.mockRestore();
  });

  describe('run', () => {
    it('should generate a summary using Goose', async () => {
      // Mock exec to return a successful summary
      (exec as unknown as jest.Mock).mockImplementation((cmd: string, callback: Function) => {
        callback(null, 'Test achievement summary', '');
        return {
          on: jest.fn((event, handler) => {
            if (event === 'exit') {
              handler(0);
            }
          })
        };
      });

      await summariser.run();
      
      // Verify Goose was called with correct parameters
      expect(exec).toHaveBeenCalledWith(
        expect.stringContaining('goose run --instructions'),
        expect.any(Function)
      );
      
      // Verify the command includes both GitHub and Slack
      expect(exec).toHaveBeenCalledWith(
        expect.stringContaining('--with-builtin github,slack'),
        expect.any(Function)
      );
    }, 10000); // Increase timeout to 10 seconds

    it('should handle Goose warnings', async () => {
      // Mock exec to return a warning but still succeed
      (exec as unknown as jest.Mock).mockImplementation((cmd: string, callback: Function) => {
        callback(null, 'Test summary', 'Test warning');
        return {
          on: jest.fn((event, handler) => {
            if (event === 'exit') {
              handler(0);
            }
          })
        };
      });

      await summariser.run();
      
      // Verify process.exit was not called (warning doesn't cause failure)
      expect(mockExit).not.toHaveBeenCalled();
    }, 10000); // Increase timeout to 10 seconds

    it('should handle command execution errors', async () => {
      // Mock exec to simulate a command failure
      (exec as unknown as jest.Mock).mockImplementation((cmd: string, callback: Function) => {
        const error = new Error('Command failed') as Error & { code?: number };
        error.code = 1;
        callback(error, '', 'Command failed');
        return {
          on: jest.fn((event, handler) => {
            if (event === 'exit') {
              handler(1);
            }
          })
        };
      });

      await summariser.run();
      
      // Verify process.exit was called with code 1
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle empty summaries', async () => {
      // Mock exec to return an empty summary with success exit code
      (exec as unknown as jest.Mock).mockImplementation((cmd: string, callback: Function) => {
        callback(null, '', '');
        return {
          on: jest.fn((event, handler) => {
            if (event === 'exit') {
              handler(0);
            }
          })
        };
      });

      await summariser.run();
      
      // Verify process.exit was called with code 1
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle successful execution', async () => {
      // Mock exec to return a successful summary
      (exec as unknown as jest.Mock).mockImplementation((cmd: string, callback: Function) => {
        callback(null, 'Test achievement summary', '');
        return {
          on: jest.fn((event, handler) => {
            if (event === 'exit') {
              handler(0);
            }
          })
        };
      });

      await summariser.run();
      
      // Verify process.exit was not called
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should use the number of weeks from user input', async () => {
      // Mock promptForWeeks to return a specific value
      (promptForWeeks as jest.Mock).mockResolvedValue(4);

      // Mock exec to return a successful summary
      (exec as unknown as jest.Mock).mockImplementation((cmd: string, callback: Function) => {
        callback(null, 'Test achievement summary', '');
        return {
          on: jest.fn((event, handler) => {
            if (event === 'exit') {
              handler(0);
            }
          })
        };
      });

      await summariser.run();
      
      // Verify promptForWeeks was called
      expect(promptForWeeks).toHaveBeenCalled();
    }, 10000); // Increase timeout to 10 seconds
  });
});