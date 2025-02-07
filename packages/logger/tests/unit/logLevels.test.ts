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

describe('Log levels', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    process.env = { ...ENVIRONMENT_VARIABLES, POWERTOOLS_DEV: 'true' };
    vi.clearAllMocks();
  });

  it('sets the correct log level when initialized with a log level', () => {
    // Act
    const logger = new Logger({ logLevel: LogLevel.WARN });

    // Assess
    expect(logger.level).toBe(LogLevelThreshold.WARN);
    expect(logger.getLevelName()).toBe(LogLevel.WARN);
  });

  it('defaults to INFO log level when initialized without a log level', () => {
    // Prepare
    process.env.POWERTOOLS_LOG_LEVEL = undefined;

    // Act
    const logger = new Logger();

    // Assess
    expect(logger.level).toBe(LogLevelThreshold.INFO);
    expect(logger.getLevelName()).toBe(LogLevel.INFO);
  });

  it('defaults to INFO log level when initialized with an invalid log level', () => {
    // Prepare
    process.env.POWERTOOLS_LOG_LEVEL = undefined;

    // Act
    const logger = new Logger({ logLevel: 'INVALID' as LogLevelType });

    // Assess
    expect(logger.level).toBe(LogLevelThreshold.INFO);
    expect(logger.getLevelName()).toBe(LogLevel.INFO);
  });

  it('sets the correct log level when calling setLogLevel()', () => {
    // Prepare
    const logger = new Logger();

    // Act
    logger.setLogLevel(LogLevel.ERROR);

    // Assess
    expect(logger.level).toBe(LogLevelThreshold.ERROR);
    expect(logger.getLevelName()).toBe(LogLevel.ERROR);
  });

  it('throws when trying to set an invalid log level via setLogLevel()', () => {
    // Prepare
    const logger = new Logger();

    // Act & Assess
    expect(() => logger.setLogLevel('INVALID' as LogLevelType)).toThrow(
      'Invalid log level: INVALID'
    );
  });

  it('sets the correct log level when setting the POWERTOOLS_LOG_LEVEL environment variable', () => {
    // Prepare
    process.env.POWERTOOLS_LOG_LEVEL = LogLevel.CRITICAL;

    // Act
    const logger = new Logger();

    // Assess
    expect(logger.level).toBe(LogLevelThreshold.CRITICAL);
    expect(logger.getLevelName()).toBe(LogLevel.CRITICAL);
  });

  it('sets the correct log level when using a custom config service', () => {
    // Prepare
    process.env.POWERTOOLS_LOG_LEVEL = undefined;
    const customConfigService = {
      getLogLevel: () => LogLevel.WARN,
      getCurrentEnvironment: vi.fn(),
      getServiceName: vi.fn(),
      getSampleRateValue: vi.fn(),
    } as unknown as ConfigServiceInterface;

    // Act
    const logger = new Logger({ customConfigService });

    // Assess
    expect(logger.level).toBe(LogLevelThreshold.WARN);
    expect(logger.getLevelName()).toBe(LogLevel.WARN);
  });

  it.each([
    { level: LogLevel.TRACE },
    { level: LogLevel.DEBUG },
    { level: LogLevel.INFO },
    { level: LogLevel.WARN },
    { level: LogLevel.ERROR },
    { level: LogLevel.CRITICAL },
  ])('logs at the correct level when calling $level()', ({ level }) => {
    // Prepare
    const consoleMethod = getConsoleMethod(level);
    const logger = new Logger({ logLevel: level });

    // Act
    logger[level.toLowerCase() as keyof LogFunction]('foo');

    // Assess
    expect(console[consoleMethod]).toHaveBeenCalledTimes(1);
    expect(console[consoleMethod]).toHaveLogged(
      expect.objectContaining({ level: level })
    );
  });

  it.each([
    { level: LogLevel.DEBUG, moreVerboseLevel: LogLevel.TRACE },
    { level: LogLevel.INFO, moreVerboseLevel: LogLevel.DEBUG },
    { level: LogLevel.WARN, moreVerboseLevel: LogLevel.INFO },
    { level: LogLevel.ERROR, moreVerboseLevel: LogLevel.WARN },
    { level: LogLevel.CRITICAL, moreVerboseLevel: LogLevel.ERROR },
  ])(
    "doesn't log when calling a level more verbose than the current log level ($level vs $moreVerboseLevel)",
    ({ level, moreVerboseLevel }) => {
      // Prepare
      const consoleMethod = getConsoleMethod(moreVerboseLevel);
      const logger = new Logger({ logLevel: level });

      // Act
      logger[moreVerboseLevel.toLowerCase() as keyof LogFunction]('foo');

      // Assess
      expect(console[consoleMethod]).not.toHaveBeenCalled();
    }
  );

  it.each([
    { level: LogLevel.TRACE, lessVerboseLevel: LogLevel.DEBUG },
    { level: LogLevel.DEBUG, lessVerboseLevel: LogLevel.INFO },
    { level: LogLevel.INFO, lessVerboseLevel: LogLevel.WARN },
    { level: LogLevel.WARN, lessVerboseLevel: LogLevel.ERROR },
    { level: LogLevel.ERROR, lessVerboseLevel: LogLevel.CRITICAL },
  ])(
    'logs when calling a level less verbose than the current log level ($level vs $lessVerboseLevel)',
    ({ level, lessVerboseLevel }) => {
      // Prepare
      const consoleMethod = getConsoleMethod(lessVerboseLevel);
      const logger = new Logger({ logLevel: level });

      // Act
      logger[lessVerboseLevel.toLowerCase() as keyof LogFunction]('foo');

      // Assess
      expect(console[consoleMethod]).toHaveBeenCalledTimes(1);
    }
  );

  it('emits a warning and falls back to the ALC level when trying to set a more verbose log level than the one set in ALC', () => {
    // Prepare
    process.env.AWS_LAMBDA_LOG_LEVEL = LogLevel.ERROR;
    process.env.LOG_LEVEL = undefined;
    process.env.POWERTOOLS_LOG_LEVEL = undefined;
    const logger = new Logger();
    const warningSpy = vi.spyOn(logger, 'warn');

    // Act
    logger.setLogLevel(LogLevel.WARN);

    // Assess
    expect(logger.level).toBe(LogLevelThreshold.ERROR);
    expect(logger.getLevelName()).toBe(LogLevel.ERROR);
    expect(warningSpy).toHaveBeenCalledTimes(1);
    expect(warningSpy).toHaveBeenCalledWith(
      'Current log level (WARN) does not match AWS Lambda Advanced Logging Controls minimum log level (ERROR). This can lead to data loss, consider adjusting them.'
    );
  });

  it('emits a warning and falls back to the ALC level when trying to init the logger with a more verbose log level than the one set in ALC', () => {
    // Prepare
    process.env.AWS_LAMBDA_LOG_LEVEL = LogLevel.INFO;
    process.env.LOG_LEVEL = undefined;
    process.env.POWERTOOLS_LOG_LEVEL = undefined;
    const warningSpy = vi.spyOn(console, 'warn');

    // Act
    const logger = new Logger({ logLevel: LogLevel.DEBUG });

    // Assess
    expect(logger.level).toBe(LogLevelThreshold.INFO);
    expect(logger.getLevelName()).toBe(LogLevel.INFO);
    expect(warningSpy).toHaveBeenCalledTimes(1);
    expect(warningSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'Current log level (DEBUG) does not match AWS Lambda Advanced Logging Controls minimum log level (INFO). This can lead to data loss, consider adjusting them.'
      )
    );
  });

  it('propagates the log level to child loggers', () => {
    // Prepare
    const parentLogger = new Logger({ logLevel: LogLevel.WARN });
    const childLogger = parentLogger.createChild();

    // Act & Assess
    expect(childLogger.level).toBe(LogLevelThreshold.WARN);
  });
});
