import context from '@aws-lambda-powertools/testing-utils/context';
import middy from '@middy/core';
import type { Context } from 'aws-lambda';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../../src/Logger.js';
import { injectLambdaContext } from '../../src/middleware/middy.js';

const event = {
  foo: 'bar',
};

describe('Log event', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    process.env = {
      ...ENVIRONMENT_VARIABLES,
      POWERTOOLS_LOGGER_LOG_EVENT: 'true',
      POWERTOOLS_DEV: 'true',
    };
    vi.resetAllMocks();
  });

  it('logs the event with the correct log level and message', () => {
    // Prepare
    const logger = new Logger();

    // Act
    logger.logEventIfEnabled(event);

    // Assess
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(1, expect.objectContaining({ event }));
  });

  it("doesn't log the event when the feature is disabled", () => {
    // Prepare
    process.env.POWERTOOLS_LOGGER_LOG_EVENT = 'false';
    const logger = new Logger();

    // Act
    logger.logEventIfEnabled(event);

    // Assess
    expect(console.info).not.toHaveBeenCalled();
  });

  it('respects the overwrite flag when provided', () => {
    // Prepare
    const logger = new Logger();

    // Act
    logger.logEventIfEnabled(event, false);

    // Assess
    expect(console.info).not.toHaveBeenCalled();
  });

  it('logs the event when logEvent is set in the Middy.js middleware', async () => {
    // Prepare
    const logger = new Logger();
    const handler = middy(async () => {}).use(
      injectLambdaContext(logger, { logEvent: true })
    );

    // Act
    await handler(event, context);

    // Assess
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({
        event,
        function_arn:
          'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
        function_memory_size: '128',
        function_name: 'foo-bar-function',
        function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
      })
    );
  });

  it('logs the event when logEvent is set in the class method decorator', async () => {
    // Prepare
    const logger = new Logger();
    class Test {
      @logger.injectLambdaContext({ logEvent: true })
      async handler(event: unknown, context: Context) {
        return event;
      }
    }
    const handler = new Test().handler;

    // Act
    await handler(event, context);

    // Assess
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({
        event,
        function_arn:
          'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
        function_memory_size: '128',
        function_name: 'foo-bar-function',
        function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
      })
    );
  });

  it('prefers the local logEvent configuration over the environment variable', async () => {
    // Prepare
    process.env.POWERTOOLS_LOGGER_LOG_EVENT = 'false';
    const logger = new Logger();
    const handler = middy(async () => {}).use(
      injectLambdaContext(logger, { logEvent: true })
    );

    // Act
    await handler(event, context);

    // Assess
    expect(console.info).toHaveBeenCalledTimes(1);
  });

  it('passes down the log event configuration to child loggers', () => {
    // Prepare
    process.env.POWERTOOLS_LOGGER_LOG_EVENT = 'false';
    const logger = new Logger();
    const childLogger = logger.createChild();

    // Act
    childLogger.logEventIfEnabled(event);

    // Assess
    expect(console.info).not.toHaveBeenCalled();
  });
});
