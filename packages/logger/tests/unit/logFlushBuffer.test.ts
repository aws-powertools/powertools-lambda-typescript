import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../../src/Logger.js';
import { LogLevel, LogLevelThreshold } from '../../src/constants.js';
import type { ConfigServiceInterface } from '../../src/types/ConfigServiceInterface.js';
import type {
  LogFunction,
  LogLevel as LogLevelType,
} from '../../src/types/Logger.js';

/**
 * Helper function to get the console method for a given log level, we use this
 * for properly mocking the console methods in the tests and account for the
 * fact that `critical` is not a valid console method, which we proxy to `error`,
 * and `trace` is internally proxied to `log`.
 *
 * @param method - The method to get the console method for
 */
const getConsoleMethod = (
  method: string
): keyof Omit<LogFunction, 'critical'> | 'log' => {
  const lowercaseMethod = method.toLowerCase();
  switch (lowercaseMethod) {
    case 'trace':
      return 'log';
    case 'critical':
      return 'error';
    default:
      return lowercaseMethod as keyof Omit<LogFunction, 'critical'>;
  }
};

describe('Log flush buffer', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    process.env = { ...ENVIRONMENT_VARIABLES, POWERTOOLS_DEV: 'true' };
    vi.resetAllMocks();
  });

  it("doesn't flush buffer when calling a log level lower than the configured log level", () => {
    // Prepare
    const logger = new Logger({ logLevel: 'WARN' });

    // Act
    logger.debug('debug');
    logger.info('info');

    // Assess
    expect(console.debug).not.toHaveBeenCalled();
    expect(console.info).not.toHaveBeenCalled();
  });

  it("doesn't flush buffer when calling a log level equal to the configured log level", () => {
    // Prepare
    const logger = new Logger({ logLevel: 'WARN' });

    // Act
    logger.debug('debug');
    logger.info('info');
    logger.warn('warn');

    // Assess
    expect(console.debug).not.toHaveBeenCalled();
    expect(console.info).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
  });

  it('flushes buffer when calling a log level higher than the configured log level', () => {
    // Prepare
    const logger = new Logger({ logLevel: 'WARN' });

    // Act
    logger.debug('debug');
    logger.info('info');
    logger.warn('warn');
    logger.error('error');

    // Assess
    expect(console.debug).toHaveBeenCalled();
    expect(console.info).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});
