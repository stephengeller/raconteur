import { config } from 'dotenv';
import { loadEnv } from '../../../prDescriptionGenerator/config/env';

jest.mock('dotenv');

describe('loadEnv', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call dotenv config', () => {
    loadEnv();
    expect(config).toHaveBeenCalled();
  });
});