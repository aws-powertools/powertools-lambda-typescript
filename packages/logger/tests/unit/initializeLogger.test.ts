import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../../src/Logger.js';
import { LogJsonIndent, LogLevel } from '../../src/constants.js';

describe('Log levels', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    process.env = { ...ENVIRONMENT_VARIABLES, POWERTOOLS_DEV: 'true' };
    vi.resetAllMocks();
  });

  it('uses the default service name when none is provided', () => {
    // Prepare
    process.env.POWERTOOLS_SERVICE_NAME = undefined;
    const logger = new Logger();

    // Act
    logger.info('Hello, world!');

    // Assess
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(
      1,
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
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(
      1,
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
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(
      1,
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
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({ service: 'child-service' })
    );
  });

  it('creates a child logger that is distinct from the parent logger', () => {
    // Prepare
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
    expect(console.debug).toHaveBeenCalledTimes(1);
    expect(console.debug).toHaveLoggedNth(
      1,
      expect.objectContaining({
        service: 'child-service',
        foo: 'bar',
        level: LogLevel.DEBUG,
      })
    );
  });

  it('`logRecordOrder` should be passed down to child logger', () => {
    // Prepare
    const expectedKeys = [
      'service',
      'timestamp',
      'level',
      'message',
      'sampling_rate',
      'xray_trace_id',
    ];
    const logger = new Logger({ logRecordOrder: ['service', 'timestamp'] });
    const childLogger = logger.createChild({ serviceName: 'child-service' });

    // Act
    logger.info('Hello, world!');
    childLogger.info('Hello, world from child!');

    // Assess
    expect(console.info).toHaveBeenCalledTimes(2);
    // For this test don't care about the values, just the order of the keys
    const calls = (console.info as Mock).mock.calls;
    expect(Object.keys(JSON.parse(calls[0][0]))).toEqual(expectedKeys);
    expect(Object.keys(JSON.parse(calls[1][0]))).toEqual(expectedKeys);
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
    vi.useFakeTimers().setSystemTime(mockDate);
    const logger = new Logger();

    // Act
    logger.info('Hello, world!');

    // Assess
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveBeenCalledWith(
      JSON.stringify(
        {
          level: 'INFO',
          message: 'Hello, world!',
          timestamp: '2016-06-20T12:08:10.000Z',
          service: 'hello-world',
          sampling_rate: 0,
          xray_trace_id: '1-abcdef12-3456abcdef123456abcdef12',
        },
        null,
        LogJsonIndent.PRETTY
      )
    );

    vi.useRealTimers();
  });
});
