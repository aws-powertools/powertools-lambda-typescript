import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from 'vitest';
import { LogJsonIndent, LogLevel } from '../../src/constants.js';
import { Logger } from '../../src/Logger.js';

describe('Log levels', () => {
  beforeEach(() => {
    vi.stubEnv('POWERTOOLS_DEV', 'true');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses the default service name when none is provided', () => {
    // Prepare
    vi.stubEnv('POWERTOOLS_SERVICE_NAME', undefined);
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
    vi.stubEnv('POWERTOOLS_SERVICE_NAME', 'hello-world');
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
    vi.stubEnv('POWERTOOLS_SERVICE_NAME', undefined);
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
    vi.stubEnv('POWERTOOLS_SERVICE_NAME', 'hello-world');
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

  it('overrides the service name when creating a child logger', () => {
    // Prepare
    vi.stubEnv('POWERTOOLS_SERVICE_NAME', 'hello-world');
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

  it('maintains persistentKeys when creating a child logger', () => {
    // Prepare
    const mockDate = new Date(1466424490000);
    vi.useFakeTimers().setSystemTime(mockDate);
    const logger = new Logger({
      persistentKeys: {
        foo: 'hello',
        overridable: 1,
      },
    });

    logger.appendKeys({
      resettableKey: 'some-id',
    });

    logger.appendPersistentKeys({
      dynamic: 'stays',
    });

    const childLogger = logger.createChild({
      serviceName: 'child-service',
      persistentKeys: {
        bar: 'world',
        overridable: 2,
      },
    });

    // Act
    childLogger.info('Hello, world!');
    childLogger.resetKeys();
    childLogger.info('Hello again!');

    // Assess
    expect(console.info).toHaveBeenCalledTimes(2);
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({
        service: 'child-service',
        foo: 'hello',
        bar: 'world',
        dynamic: 'stays',
        message: 'Hello, world!',
        overridable: 2,
        resettableKey: 'some-id',
      })
    );

    expect(console.info).toHaveLoggedNth(
      2,
      // using direct match here to ensure removal of resetKeys
      {
        service: 'child-service',
        foo: 'hello',
        bar: 'world',
        dynamic: 'stays',
        message: 'Hello again!',
        overridable: 2,
        level: 'INFO',
        sampling_rate: 0,
        timestamp: '2016-06-20T12:08:10.000Z',
        xray_trace_id: '1-abcdef12-3456abcdef123456abcdef12',
      }
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
    vi.stubEnv('POWERTOOLS_DEV', undefined);
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

  it('splits the stack trace into an array when POWERTOOLS_DEV is set', () => {
    // Prepare
    const logger = new Logger();
    const err = new Error('Hello, world!');

    // Act
    logger.error('Error occured', err);

    // Assess
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveLoggedNth(
      1,
      expect.objectContaining({
        error: {
          location: expect.any(String),
          message: 'Hello, world!',
          name: 'Error',
          stack: expect.any(Array),
        },
      })
    );
  });
});
