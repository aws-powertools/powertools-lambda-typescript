import { setTimeout } from 'node:timers/promises';
import context from '@aws-lambda-powertools/testing-utils/context';
import type { Context } from 'aws-lambda';
import middy from 'middy5';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from 'vitest';
import { LogLevel, UncaughtErrorLogMessage } from '../../src/constants.js';
import { Logger } from '../../src/Logger.js';
import { injectLambdaContext } from '../../src/middleware/middy.js';

describe('Buffer logs', () => {
  beforeEach(() => {
    vi.stubEnv('POWERTOOLS_DEV', 'true');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does not buffer logs when disabled', () => {
    // Prepare
    const logger = new Logger({
      logLevel: LogLevel.ERROR,
      logBufferOptions: { enabled: false },
    });

    // Act
    logger.debug('This is a log message');
    logger.flushBuffer();

    // Assess
    expect(console.debug).toBeCalledTimes(0);
  });

  it('does not flush on error logs when flushOnErrorLog is disabled ', () => {
    // Prepare
    const logger = new Logger({
      logLevel: LogLevel.ERROR,
      logBufferOptions: { enabled: true, flushOnErrorLog: false },
    });

    // Act
    logger.debug('This is a log message');
    logger.error('This is an error message');

    // Assess
    expect(console.debug).toBeCalledTimes(0);
    expect(console.error).toBeCalledTimes(1);
  });

  it('buffers logs when the config object is provided, but not specifically enabled', () => {
    // Prepare
    const logger = new Logger({
      logLevel: LogLevel.ERROR,
      logBufferOptions: { maxBytes: 20480 },
    });

    // Act
    logger.debug('This is a log message');

    // Assess
    expect(console.debug).toBeCalledTimes(0);
  });

  it('sets a max buffer sized when specified', () => {
    // Prepare
    const logger = new Logger({
      logBufferOptions: {
        maxBytes: 250,
      },
    });

    // Act
    logger.debug('this is a debug 1');
    logger.debug('this is a debug 2');
    logger.flushBuffer();

    // Assess
    expect(console.debug).toHaveLoggedNth(
      1,
      expect.objectContaining({
        level: LogLevel.DEBUG,
        message: 'this is a debug 2',
      })
    );
    expect(console.warn).toHaveLogged(
      expect.objectContaining({
        level: 'WARN',
        message:
          'Some logs are not displayed because they were evicted from the buffer. Increase buffer size to store more logs in the buffer',
      })
    );
  });

  it('outputs a warning when the Advanced Logging Configuration Log Level is less verbose than the Log Buffering Log Level', () => {
    // Assemble
    vi.stubEnv('AWS_LAMBDA_LOG_LEVEL', 'INFO');
    const logger = new Logger({
      logLevel: LogLevel.DEBUG,
      logBufferOptions: { enabled: true, bufferAtVerbosity: 'DEBUG' },
    });

    // Act
    logger.debug('This is a debug');

    // Assess
    expect(console.warn).toHaveLogged(
      expect.objectContaining({
        message: expect.stringContaining(
          'Advanced Loggging Controls (ALC) Log Level is less verbose than Log Buffering Log Level. Buffered logs will be filtered by ALC'
        ),
        level: LogLevel.WARN,
      })
    );
  });

  it('When the buffer is flushed it outputs a warning if the Advanced Logging Configuration Log Level is less verbose than the Log Buffering Log Level', () => {
    // Assemble
    vi.stubEnv('AWS_LAMBDA_LOG_LEVEL', 'INFO');
    const logger = new Logger({
      logLevel: LogLevel.DEBUG,
      logBufferOptions: { enabled: true, bufferAtVerbosity: 'DEBUG' },
    });

    // Act
    logger.debug('This is a debug');
    logger.flushBuffer();

    // Assess
    expect(console.warn).toHaveLogged(
      expect.objectContaining({
        message: expect.stringContaining(
          'Advanced Loggging Controls (ALC) Log Level is less verbose than Log Buffering Log Level. Some logs might be missing.'
        ),
        level: LogLevel.WARN,
      })
    );
  });

  it('outputs a warning when there is an error buffering the log', () => {
    // Prepare
    const logger = new Logger({ logBufferOptions: { maxBytes: 100 } });

    // Act
    logger.debug('This is a debug');

    // Assess
    expect(console.debug).toHaveLogged(
      expect.objectContaining({
        level: LogLevel.DEBUG,
        message: 'This is a debug',
      })
    );
    expect(console.warn).toHaveLoggedNth(
      1,
      expect.objectContaining({
        message: expect.stringContaining('Unable to buffer log: Item too big'),
        level: LogLevel.WARN,
      })
    );
  });

  it('outputs buffered logs', () => {
    // Prepare
    const logger = new Logger({
      logLevel: 'SILENT',
      logBufferOptions: {
        bufferAtVerbosity: LogLevel.WARN,
      },
    });

    // Act
    logger.debug('This is a debug');
    logger.warn('This is a warning');

    // Assess
    expect(console.debug).toHaveBeenCalledTimes(0);
    expect(console.warn).toHaveBeenCalledTimes(0);

    // Act
    logger.flushBuffer();

    // Assess
    expect(console.debug).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('handles an empty buffer', () => {
    // Prepare
    const logger = new Logger({ logBufferOptions: { enabled: true } });

    // Act & Assess
    expect(() => logger.flushBuffer()).not.toThrow();
  });

  it('does not output buffered logs when trace id is not set', () => {
    // Prepare
    vi.stubEnv('_X_AMZN_TRACE_ID', undefined);
    const logger = new Logger({ logBufferOptions: { enabled: true } });

    // Act
    logger.debug('This is a debug');
    logger.warn('this is a warning');
    logger.flushBuffer();

    // Assess
    expect(console.debug).toHaveBeenCalledTimes(0);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('it safely short circuits when clearBuffer is called without a trace id', () => {
    // Prepare
    vi.stubEnv('_X_AMZN_TRACE_ID', undefined);
    const logger = new Logger({
      logLevel: LogLevel.ERROR,
      logBufferOptions: { enabled: true, bufferAtVerbosity: LogLevel.DEBUG },
    });

    // Assess
    expect(() => logger.clearBuffer()).not.toThrow();
  });

  it('it clears the buffer', () => {
    // Prepare
    const logger = new Logger({
      logLevel: LogLevel.ERROR,
      logBufferOptions: { enabled: true, bufferAtVerbosity: LogLevel.DEBUG },
    });

    // Arrange
    logger.debug('This is a log message');
    logger.clearBuffer();
    logger.flushBuffer();

    // Assess
    expect(console.debug).not.toBeCalled();
  });

  it('it flushes the buffer when an error is logged', () => {
    // Prepare
    const logger = new Logger({
      logLevel: LogLevel.ERROR,
      logBufferOptions: { enabled: true },
    });

    // Act
    logger.debug('This is a log message');
    logger.error('This is an error message');

    // Assess
    expect(console.debug).toBeCalledTimes(1);
    expect(console.error).toBeCalledTimes(1);
  });

  it('passes down the same buffer config to child loggers', () => {
    // Prepare
    const logger = new Logger({
      logLevel: LogLevel.TRACE,
      logBufferOptions: { enabled: true, bufferAtVerbosity: LogLevel.INFO },
    });
    const childLogger = logger.createChild();

    // Assess
    childLogger.debug('This is a log message');
    childLogger.info('This is an info message');

    // Assess
    expect(console.debug).toBeCalledTimes(0);
    expect(console.info).toBeCalledTimes(0);
  });

  it.each([
    {
      handlerFactory: (logger: Logger) =>
        middy()
          .use(
            injectLambdaContext(logger, { flushBufferOnUncaughtError: true })
          )
          .handler(() => {
            logger.debug('This is a log message');
            logger.info('This is an info message');
            throw new Error('This is an error');
          }),
      case: 'middleware',
    },
    {
      handlerFactory: (logger: Logger) => {
        class TestClass {
          @logger.injectLambdaContext({ flushBufferOnUncaughtError: true })
          async handler(_event: unknown, _context: Context) {
            logger.debug('This is a log message');
            logger.info('This is an info message');
            await setTimeout(1); // simulate some async operation
            throw new Error('This is an error');
          }
        }
        const lambda = new TestClass();
        return lambda.handler.bind(lambda);
      },
      case: 'decorator',
    },
  ])(
    'flushes the buffer when an uncaught error is thrown ($case)',
    async ({ handlerFactory }) => {
      // Prepare
      const logger = new Logger({ logBufferOptions: { enabled: true } });
      const handler = handlerFactory(logger);

      // Act & Assess
      await expect(() =>
        handler(
          {
            foo: 'bar',
          },
          context
        )
      ).rejects.toThrow(new Error('This is an error'));
      expect(console.debug).toBeCalledTimes(1);
      expect(console.info).toBeCalledTimes(1);
      expect(console.error).toHaveLogged(
        expect.objectContaining({
          message: UncaughtErrorLogMessage,
        })
      );
      // If debug is called after info, it means it was buffered and then flushed
      expect(console.debug).toHaveBeenCalledAfter(console.info as Mock);
      // If error is called after debug, it means the buffer was flushed before the error log
      expect(console.debug).toHaveBeenCalledBefore(console.error as Mock);
    }
  );

  it.each([
    {
      handlerFactory: (logger: Logger) =>
        middy()
          .use(
            injectLambdaContext(logger, { flushBufferOnUncaughtError: false })
          )
          .handler(() => {
            logger.debug('This is a log message');
            logger.info('This is an info message');
            throw new Error('This is an error');
          }),
      case: 'middleware',
    },
    {
      handlerFactory: (logger: Logger) => {
        class TestClass {
          @logger.injectLambdaContext({ flushBufferOnUncaughtError: false })
          async handler(_event: unknown, _context: Context) {
            logger.debug('This is a log message');
            logger.info('This is an info message');
            await setTimeout(1); // simulate some async operation
            throw new Error('This is an error');
          }
        }
        const lambda = new TestClass();
        return lambda.handler.bind(lambda);
      },
      case: 'decorator',
    },
  ])(
    'clears the buffer when an uncaught error is thrown and flushBufferOnUncaughtError is false ($case)',
    async ({ handlerFactory }) => {
      // Prepare
      const logger = new Logger({ logBufferOptions: { enabled: true } });
      const handler = handlerFactory(logger);

      // Act & Assess
      await expect(() =>
        handler(
          {
            foo: 'bar',
          },
          context
        )
      ).rejects.toThrow(new Error('This is an error'));

      // Assess
      expect(console.debug).not.toBeCalled;
      expect(console.info).not.toBeCalled;
    }
  );
});
