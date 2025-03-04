import context from '@aws-lambda-powertools/testing-utils/context';
import type { Context } from 'aws-lambda';
import middy from 'middy5';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../../src/Logger.js';
import { LogLevel, UncaughtErrorLogMessage } from '../../src/constants.js';
import { injectLambdaContext } from '../../src/middleware/middy.js';
import type { ConstructorOptions } from '../../src/types/Logger.js';

describe('Buffer logs', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    process.env = {
      ...ENVIRONMENT_VARIABLES,
      POWERTOOLS_DEV: 'true',
    };
    vi.clearAllMocks();
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
      logBufferOptions: { maxBytes: 100 },
    });

    // Act
    logger.debug('This is a log message');
    logger.flushBuffer();
    // Assess
    expect(console.debug).toBeCalledTimes(1);
  });

  it('sets a max buffer sized when specified', () => {
    // Prepare
    const logger = new Logger({
      logBufferOptions: {
        maxBytes: 250,
        bufferAtVerbosity: LogLevel.DEBUG,
        enabled: true,
      },
    });

    // Act
    logger.debug('this is a debug');
    logger.debug('this is a debug');
    logger.flushBuffer();

    // Assess
    expect(console.debug).toBeCalledTimes(1);
    expect(console.warn).toHaveLogged(
      expect.objectContaining({
        level: 'WARN',
        message:
          'Some logs are not displayed because they were evicted from the buffer. Increase buffer size to store more logs in the buffer',
      })
    );
  });

  it('outputs a warning when there is an error buffering the log', () => {
    // Prepare
    class MockLogger extends Logger {
      constructor(options: ConstructorOptions) {
        super(options);
        // We want to simulate an error in the bufferLogItem method, which is protected, so we override it
        this.bufferLogItem = vi.fn().mockImplementation(() => {
          throw new Error('bufferLogItem error');
        });
      }
    }
    const logger = new MockLogger({ logBufferOptions: { enabled: true } });

    // Act
    logger.debug('This is a debug');

    // Assess
    expect(console.debug).toBeCalledTimes(1);
    expect(console.warn).toBeCalledTimes(1);
  });

  it('outputs buffered logs', () => {
    // Prepare
    const logger = new Logger({
      logLevel: 'SILENT',
      logBufferOptions: {
        enabled: true,
        bufferAtVerbosity: LogLevel.CRITICAL,
      },
    });

    // Act
    logger.debug('This is a debug');
    logger.warn('This is a warning');
    logger.critical('this is a critical');

    // Assess
    expect(console.warn).toHaveBeenCalledTimes(0);
    expect(console.error).toHaveBeenCalledTimes(0);

    // Act
    logger.flushBuffer();

    // Assess
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('handles an empty buffer', () => {
    // Prepare
    const logger = new Logger({ logBufferOptions: { enabled: true } });

    // Act & Assess
    expect(() => logger.flushBuffer()).not.toThrow();
  });

  it('does not output buffered logs when trace id is not set', () => {
    // Prepare
    process.env._X_AMZN_TRACE_ID = undefined;
    const logger = new Logger({ logBufferOptions: { enabled: true } });

    // Act
    logger.debug('This is a debug');
    logger.warn('this is a warning');

    // Assess
    expect(console.debug).toHaveBeenCalledTimes(0);
    expect(console.warn).toHaveBeenCalledTimes(1);

    // Act
    logger.flushBuffer();

    // Assess
    expect(console.debug).toHaveBeenCalledTimes(0);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('outputs a warning when buffered logs have been evicted', () => {
    // Prepare
    const logger = new Logger({
      logLevel: LogLevel.ERROR,
      logBufferOptions: {
        enabled: true,
        bufferAtVerbosity: LogLevel.INFO,
        maxBytes: 1024,
      },
    });

    // Act
    const longMessage = 'blah'.repeat(10);

    let i = 0;
    while (i < 4) {
      logger.info(
        `${i} This is a really long log message intended to exceed the buffer ${longMessage}`
      );
      i++;
    }
    logger.flushBuffer();

    // Assess
    expect(console.warn).toHaveLogged(
      expect.objectContaining({
        level: LogLevel.WARN,
        message:
          'Some logs are not displayed because they were evicted from the buffer. Increase buffer size to store more logs in the buffer',
      })
    );
  });

  it('it safely short circuits when clearBuffer is called without a trace id', () => {
    // Prepare
    process.env._X_AMZN_TRACE_ID = undefined;
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
    expect(console.debug).not.toBeCalled;
  });
  it('it flushes the buffer when an error in logged', () => {
    // Prepare
    const logger = new Logger({
      logLevel: LogLevel.ERROR,
      logBufferOptions: { enabled: true, bufferAtVerbosity: LogLevel.DEBUG },
    });
    const flushBufferSpy = vi.spyOn(logger, 'flushBuffer');

    // Act
    logger.debug('This is a log message');
    logger.error('This is an error message');

    // Assess
    expect(flushBufferSpy).toBeCalledTimes(1);
    expect(console.debug).toBeCalledTimes(1);
    expect(console.error).toBeCalledTimes(1);
  });

  it.each([
    {
      handlerFactory: (logger: Logger) =>
        middy()
          .use(
            injectLambdaContext(logger, { flushBufferOnUncaughtError: true })
          )
          .handler(async () => {
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
          .handler(async () => {
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
