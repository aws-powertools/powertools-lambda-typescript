import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger, LogLevel, LogLevelThreshold } from '../../src/index.js';

describe('Log sampling', () => {
  beforeEach(() => {
    vi.stubEnv('POWERTOOLS_DEV', 'true');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('informs the customer that sample rate is setting the level to DEBUG', () => {
    // Act
    new Logger({ sampleRateValue: 1, logLevel: LogLevel.CRITICAL });

    // Assess
    expect(console.debug).toHaveBeenCalledTimes(1);
    expect(console.debug).toHaveLoggedNth(
      1,
      expect.objectContaining({
        message: 'Setting log level to DEBUG due to sampling rate',
      })
    );
  });

  it('changes the log level to DEBUG log sampling is configured via constructor', () => {
    // Act
    const logger: Logger = new Logger({
      logLevel: LogLevel.ERROR,
      sampleRateValue: 1,
    });

    // Assess
    expect(logger.level).toBe(LogLevelThreshold.DEBUG);
  });

  it('changes the log level to debug log sampling is configured via env variable', () => {
    // Prepare
    vi.stubEnv('POWERTOOLS_LOGGER_SAMPLE_RATE', '1');

    // Act
    const logger: Logger = new Logger({
      logLevel: LogLevel.ERROR,
    });

    // Assess
    expect(logger.level).toBe(LogLevelThreshold.DEBUG);
  });

  it("doesn't change the log level when sample rate is 0", () => {
    // Prepare & Act
    const logger: Logger = new Logger({
      logLevel: LogLevel.ERROR,
      sampleRateValue: 0,
    });

    // Assess
    expect(logger.level).toBe(LogLevelThreshold.ERROR);
  });

  it('prioritizes and uses the sample rate specified in the constructor', () => {
    // Prepare
    vi.stubEnv('POWERTOOLS_LOGGER_SAMPLE_RATE', '0.5');

    // Act
    const logger: Logger = new Logger({
      sampleRateValue: 1,
    });

    // Assess
    expect(logger.level).toBe(LogLevelThreshold.DEBUG);
  });

  it.each([
    {
      options: {
        sampleRateValue: 42,
      },
      type: 'constructor',
    },
    {
      options: {},
      type: 'env variable',
    },
  ])('ignores invalid sample rate values via $type', ({ options, type }) => {
    // Prepare
    if (type === 'env variable') {
      vi.stubEnv('POWERTOOLS_LOGGER_SAMPLE_RATE', '42');
    }

    // Act
    const logger: Logger = new Logger({
      logLevel: LogLevel.INFO,
      ...options,
    });

    // Assess
    expect(logger.getLevelName()).toBe(LogLevel.INFO);
  });

  it('refreshes and applies log sampling', () => {
    // Prepare
    const logger = new Logger({
      logLevel: LogLevel.ERROR,
      sampleRateValue: 0.1, // 10% probability
    });

    let logLevelChangedToDebug = 0;
    const numOfIterations = 1000;
    const minExpected = numOfIterations * 0.05; // Min expected based on 5% probability
    const maxExpected = numOfIterations * 0.15; // Max expected based on 15% probability

    // Act
    for (let i = 0; i < numOfIterations; i++) {
      logger.refreshSampleRateCalculation();
      if (logger.getLevelName() === LogLevel.DEBUG) {
        logLevelChangedToDebug++;
      }
    }

    // Assess
    expect(logLevelChangedToDebug).toBeGreaterThanOrEqual(minExpected);
    expect(logLevelChangedToDebug).toBeLessThanOrEqual(maxExpected);
  });

  it('propagates the sample rate to child loggers', () => {
    // Prepare
    const logger = new Logger({
      sampleRateValue: 0.5,
    });
    const childLogger = logger.createChild();

    // Act
    childLogger.info('Hello, world!');

    // Assess
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({ sampling_rate: 0.5 })
    );
  });
});
