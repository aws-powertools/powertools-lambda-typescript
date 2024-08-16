/**
 * Log Sampling
 *
 * @group unit/logger/logger/sampling
 */
import { EnvironmentVariablesService } from '../../src/config/EnvironmentVariablesService.js';
import { LogLevel, LogLevelThreshold, Logger } from '../../src/index.js';

class CustomConfigService extends EnvironmentVariablesService {
  #sampleRateValue = 1;

  public constructor(value = 1) {
    super();
    this.#sampleRateValue = value;
  }

  public getSampleRateValue(): number {
    return this.#sampleRateValue;
  }
}

const logSpy = jest.spyOn(console, 'info');

describe('Log sampling', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    process.env = { ...ENVIRONMENT_VARIABLES, POWERTOOLS_DEV: 'true' };
  });

  it('informs the customer that sample rate is setting the level to DEBUG', () => {
    // Prepare
    const debugSpy = jest.spyOn(console, 'debug');

    // Act
    new Logger({ sampleRateValue: 1, logLevel: LogLevel.CRITICAL });

    // Assess
    expect(debugSpy).toHaveBeenCalledTimes(1);
    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining('Setting log level to DEBUG due to sampling rate')
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

  it('changes the log level to DEBUG log sampling is configured via custom config service', () => {
    // Act
    const logger: Logger = new Logger({
      logLevel: LogLevel.ERROR,
      customConfigService: new CustomConfigService(),
    });

    // Assess
    expect(logger.level).toBe(LogLevelThreshold.DEBUG);
  });

  it('changes the log level to debug log sampling is configured via env variable', () => {
    // Prepare
    process.env.POWERTOOLS_LOGGER_SAMPLE_RATE = '1';

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
    process.env.POWERTOOLS_LOGGER_SAMPLE_RATE = '0.5';

    // Act
    const logger: Logger = new Logger({
      sampleRateValue: 1,
      customConfigService: new CustomConfigService(0.75),
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
      options: {
        customConfigService: new CustomConfigService(42),
      },
      type: 'custom config service',
    },
    {
      options: {},
      type: 'env variable',
    },
  ])('ignores invalid sample rate values via $type', ({ options, type }) => {
    // Prepare
    if (type === 'env variable') {
      process.env.POWERTOOLS_LOGGER_SAMPLE_RATE = '42';
    }

    // Act
    const logger: Logger = new Logger({
      logLevel: LogLevel.INFO,
      ...options,
    });

    // Assess
    expect(logger.getLevelName()).toBe(LogLevel.INFO);
  });

  it('when sample rate calculation is refreshed, it respects probability sampling and change log level to DEBUG ', () => {
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
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(logSpy.mock.calls[0][0])).toStrictEqual(
      expect.objectContaining({ sampling_rate: 0.5 })
    );
  });
});
