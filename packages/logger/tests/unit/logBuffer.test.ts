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
    const logger = new TestLogger();
    logger.enableBuffering();
    logger.overrideBufferLogItem();

    logger.debug('This is a debug');
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
    const logger = new TestLogger({ logLevel: 'SILENT' });
    logger.enableBuffering();
    logger.setbufferLevelThreshold(LogLevelThreshold.CRITICAL);

    logger.debug('This is a debug');
    logger.warn('This is a warning');
    logger.critical('this is a critical');

    expect(console.warn).toHaveBeenCalledTimes(0);
    expect(console.error).toHaveBeenCalledTimes(0);

    logger.flushBufferWrapper();

    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('handles an empty buffer', () => {
    const logger = new TestLogger({ logLevel: 'SILENT' });
    logger.enableBuffering();

    logger.flushBufferWrapper();
  });

  it('does not output buffered logs when trace id is not set', () => {
    process.env._X_AMZN_TRACE_ID = undefined;

    const logger = new TestLogger({});
    logger.enableBuffering();

    logger.debug('This is a debug');
    logger.warn('this is a warning');

    expect(console.debug).toHaveBeenCalledTimes(0);
    expect(console.warn).toHaveBeenCalledTimes(1);

    logger.flushBufferWrapper();

    expect(console.debug).toHaveBeenCalledTimes(0);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });
});

describe('shouldBufferLog', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    process.env = {
      ...ENVIRONMENT_VARIABLES,
      POWERTOOLS_LOGGER_LOG_EVENT: 'true',
      POWERTOOLS_DEV: 'true',
    };
    vi.clearAllMocks();
  });
  it('returns false when _X_AMZN_TRACE_ID is not set', () => {
    const logger = new TestLogger({});
    process.env._X_AMZN_TRACE_ID = undefined;
    logger.enableBuffering();

    expect(logger.shouldBufferLog(undefined, LogLevelThreshold.TRACE)).toBe(
      false
    );
  });

  it('returns false when the buffer is disabled', () => {
    const logger = new TestLogger({});
    logger.disableBuffering();

    const trace = process.env._X_AMZN_TRACE_ID;

    expect(logger.shouldBufferLog(trace, LogLevelThreshold.TRACE)).toBe(false);
  });

  it('returns false when the log level above the bufferLevelThreshold', () => {
    const logger = new TestLogger({});
    logger.enableBuffering();

    const trace = process.env._X_AMZN_TRACE_ID;

    expect(logger.shouldBufferLog(trace, LogLevelThreshold.INFO)).toBe(false);
  });

  it('returns true when the criteria is met', () => {
    const logger = new TestLogger({});
    logger.enableBuffering();
    const trace = process.env._X_AMZN_TRACE_ID;

    expect(logger.shouldBufferLog(trace, LogLevelThreshold.TRACE)).toBe(true);
  });
});
