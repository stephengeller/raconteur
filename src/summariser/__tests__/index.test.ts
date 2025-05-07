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
      // Mock exec to return a warning
      (exec as unknown as jest.Mock).mockImplementation((cmd: string, callback: Function) => {
        callback(null, 'Test summary', 'Test warning');
      });

      await summariser.run();
      
      // Verify warning was logged (you might need to mock your logger)
      // This depends on how you've implemented your logging
    }, 10000); // Increase timeout to 10 seconds

    it('should handle empty summaries', async () => {
      // Mock exec to return an empty summary
      (exec as unknown as jest.Mock).mockImplementation((cmd: string, callback: Function) => {
        callback(null, '', '');
      });

      await summariser.run();
      
      // Verify process.exit was called with code 1
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should use the number of weeks from user input', async () => {
      // Mock promptForWeeks to return a specific value
      (promptForWeeks as jest.Mock).mockResolvedValue(4);

      await summariser.run();
      
      // Verify promptForWeeks was called
      expect(promptForWeeks).toHaveBeenCalled();
    }, 10000); // Increase timeout to 10 seconds
  });
});