import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../../src/Logger.js';
import { LogLevel } from '../../src/constants.js';

class TestLogger extends Logger {
  public overrideBufferLogItem(): void {
    this.bufferLogItem = vi.fn().mockImplementation(() => {
      throw new Error('bufferLogItem error');
    });
  }
}
describe('Log Buffer', () => {
  describe('Configuration', () => {
    const ENVIRONMENT_VARIABLES = process.env;

    beforeEach(() => {
      process.env = {
        ...ENVIRONMENT_VARIABLES,
        POWERTOOLS_LOGGER_LOG_EVENT: 'true',
        POWERTOOLS_DEV: 'true',
      };
      vi.clearAllMocks();
    });

    it('does not buffer logs when disabled', () => {
      // Prepare
      const logger = new TestLogger({
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
      const logger = new TestLogger({
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
      const logger = new TestLogger({
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
      const logger = new TestLogger({
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
  });

  describe('Functionality', () => {
    const ENVIRONMENT_VARIABLES = process.env;

    beforeEach(() => {
      process.env = {
        ...ENVIRONMENT_VARIABLES,
        POWERTOOLS_LOGGER_LOG_EVENT: 'true',
        POWERTOOLS_DEV: 'true',
      };
      vi.clearAllMocks();
    });
    it('outputs a warning when there is an error buffering the log', () => {
      // Prepare
      process.env.POWERTOOLS_DEV = 'true';
      const logger = new TestLogger({ logBufferOptions: { enabled: true } });
      logger.overrideBufferLogItem();

      // Act
      logger.debug('This is a debug');

      // Assess
      expect(console.debug).toBeCalledTimes(1);
      expect(console.warn).toBeCalledTimes(1);
    });

    it('outputs buffered logs', () => {
      // Prepare
      const logger = new TestLogger({
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
      const logger = new TestLogger({ logBufferOptions: { enabled: true } });

      // Act
      logger.flushBuffer();
    });

    it('does not output buffered logs when trace id is not set', () => {
      // Prepare
      process.env._X_AMZN_TRACE_ID = undefined;
      const logger = new TestLogger({ logBufferOptions: { enabled: true } });

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
      const logger = new TestLogger({
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

      // Act
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

    it('it flushes the buffer when an error in logged', () => {
      // Prepare
      const logger = new TestLogger({
        logLevel: LogLevel.ERROR,
        logBufferOptions: { enabled: true, bufferAtVerbosity: LogLevel.DEBUG },
      });

      const spy = vi.spyOn(logger, 'flushBuffer');

      // Act
      logger.debug('This is a log message');

      logger.error('This is an error message');

      // Assess
      expect(spy).toBeCalledTimes(1);
      expect(console.debug).toBeCalledTimes(1);
      expect(console.error).toBeCalledTimes(1);
    });
  });
});
