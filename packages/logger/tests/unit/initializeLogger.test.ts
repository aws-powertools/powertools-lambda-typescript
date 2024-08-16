/**
 * Logger log levels tests
 *
 * @group unit/logger/logger/logLevels
 */
import { Logger } from '../../src/Logger.js';
import { LogJsonIndent, LogLevel } from '../../src/constants.js';

const logSpy = jest.spyOn(console, 'info');

describe('Log levels', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    process.env = { ...ENVIRONMENT_VARIABLES, POWERTOOLS_DEV: 'true' };
    jest.resetAllMocks();
  });

  it('uses the default service name when none is provided', () => {
    // Prepare
    process.env.POWERTOOLS_SERVICE_NAME = undefined;
    const logger = new Logger();

    // Act
    logger.info('Hello, world!');

    // Assess
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(logSpy.mock.calls[0][0])).toStrictEqual(
      expect.objectContaining({ service: 'service_undefined' })
    );
  });

  it('uses service name specified in environment variables', () => {
    // Prepare
    process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';
    const logger = new Logger();

    // Act
    logger.info('Hello, world!');

    // Assess
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(logSpy.mock.calls[0][0])).toStrictEqual(
      expect.objectContaining({ service: 'hello-world' })
    );
  });

  it('uses service name specified in the constructor', () => {
    // Prepare
    process.env.POWERTOOLS_SERVICE_NAME = undefined;
    const logger = new Logger({ serviceName: 'hello-world' });

    // Act
    logger.info('Hello, world!');

    // Assess
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(logSpy.mock.calls[0][0])).toStrictEqual(
      expect.objectContaining({ service: 'hello-world' })
    );
  });

  it('overrides the service name when creating a child logger', () => {
    // Prepare
    process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';
    const logger = new Logger();
    const childLogger = logger.createChild({ serviceName: 'child-service' });

    // Act
    childLogger.info('Hello, world!');

    // Assess
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(logSpy.mock.calls[0][0])).toStrictEqual(
      expect.objectContaining({ service: 'child-service' })
    );
  });

  it('creates a child logger that is distinct from the parent logger', () => {
    // Prepare
    const debugSpy = jest.spyOn(console, 'debug');
    const logger = new Logger({ logLevel: LogLevel.CRITICAL });
    const childLogger = logger.createChild({
      logLevel: LogLevel.DEBUG,
      serviceName: 'child-service',
    });

    // Act
    logger.debug('Hello, world!');
    childLogger.appendKeys({ foo: 'bar' });
    childLogger.debug('Hello, world!');

    // Assess
    expect(debugSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(debugSpy.mock.calls[0][0])).toStrictEqual(
      expect.objectContaining({
        service: 'child-service',
        foo: 'bar',
        level: LogLevel.DEBUG,
      })
    );
  });

  it("doesn't use the global console object by default", () => {
    // Prepare
    process.env.POWERTOOLS_DEV = undefined;
    const logger = new Logger();

    // Assess
    // biome-ignore lint/complexity/useLiteralKeys: we need to access the internal console object
    expect(logger['console']).not.toEqual(console);
  });

  it('uses pretty print when POWERTOOLS_DEV is set', () => {
    // Prepare
    const mockDate = new Date(1466424490000);
    jest.useFakeTimers().setSystemTime(mockDate);
    const logger = new Logger();

    // Act
    logger.info('Hello, world!');

    // Assess
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      JSON.stringify(
        {
          level: 'INFO',
          message: 'Hello, world!',
          sampling_rate: 0,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        },
        null,
        LogJsonIndent.PRETTY
      )
    );

    jest.useRealTimers();
  });
});
