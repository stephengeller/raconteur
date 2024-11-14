// Store original console methods
const originalConsole = {
  error: console.error,
  log: console.log,
  warn: console.warn,
  info: console.info,
};

// Create mock functions
const mockConsole = {
  error: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Export mock functions
export const consoleMock = mockConsole;

// Setup function to replace console methods
export function mockConsoleImplementation() {
  console.error = mockConsole.error;
  console.log = mockConsole.log;
  console.warn = mockConsole.warn;
  console.info = mockConsole.info;
}

// Cleanup function to restore original console
export function restoreConsoleImplementation() {
  console.error = originalConsole.error;
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
}

// Clear all mock data
export function clearConsoleMocks() {
  mockConsole.error.mockClear();
  mockConsole.log.mockClear();
  mockConsole.warn.mockClear();
  mockConsole.info.mockClear();
}