import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../../src/Logger.js';
import { LogLevelThreshold } from '../../src/constants.js';

class TestLogger extends Logger {
  public enableBuffering() {
    this.isBufferEnabled = true;
  }
  public disableBuffering() {
    this.isBufferEnabled = false;
  }

  public flushBufferWrapper(): void {
    this.flushBuffer();
  }

  public overrideBufferLogItem(): void {
    this.bufferLogItem = vi.fn().mockImplementation(() => {
      throw new Error('bufferLogItem error');
    });
  }

  public setbufferLevelThreshold(level: number): void {
    this.bufferLogThreshold = level;
  }
}

describe('bufferLog', () => {
  it('outputs a warning when there is an error buffering the log', () => {
    // Prepare
    process.env.POWERTOOLS_DEV = 'true';
    const logger = new TestLogger();
    logger.enableBuffering();
    logger.overrideBufferLogItem();

    // Act
    logger.debug('This is a debug');

    // Assess
    expect(console.debug).toBeCalledTimes(1);
    expect(console.warn).toBeCalledTimes(1);
  });
});

describe('flushBuffer', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    process.env = {
      ...ENVIRONMENT_VARIABLES,
      POWERTOOLS_LOGGER_LOG_EVENT: 'true',
      POWERTOOLS_DEV: 'true',
    };
    vi.clearAllMocks();
  });

  it('outputs buffered logs', () => {
    // Prepare
    const logger = new TestLogger({ logLevel: 'SILENT' });
    logger.enableBuffering();
    logger.setbufferLevelThreshold(LogLevelThreshold.CRITICAL);

    // Act
    logger.debug('This is a debug');
    logger.warn('This is a warning');
    logger.critical('this is a critical');

    // Assess
    expect(console.warn).toHaveBeenCalledTimes(0);
    expect(console.error).toHaveBeenCalledTimes(0);

    // Act
    logger.flushBufferWrapper();

    // Assess
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('handles an empty buffer', () => {
    // Prepare
    const logger = new TestLogger();
    logger.enableBuffering();

    // Act
    logger.flushBufferWrapper();
  });

  it('does not output buffered logs when trace id is not set', () => {
    // Prepare
    process.env._X_AMZN_TRACE_ID = undefined;
    const logger = new TestLogger({});
    logger.enableBuffering();

    // Act
    logger.debug('This is a debug');
    logger.warn('this is a warning');

    // Assess
    expect(console.debug).toHaveBeenCalledTimes(0);
    expect(console.warn).toHaveBeenCalledTimes(1);

    // Act
    logger.flushBufferWrapper();

    // Assess
    expect(console.debug).toHaveBeenCalledTimes(0);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });
});
