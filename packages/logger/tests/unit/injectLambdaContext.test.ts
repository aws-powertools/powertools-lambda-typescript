/**
 * Logger injectLambdaContext tests
 *
 * @group unit/logger/logger/injectLambdaContext
 */
import context from '@aws-lambda-powertools/testing-utils/context';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import middy from '@middy/core';
import type { Context } from 'aws-lambda';
import { Logger } from '../../src/Logger.js';
import { injectLambdaContext } from '../../src/middleware/middy.js';

const event = {
  foo: 'bar',
};

const getContextLogEntries = (overrides?: Record<string, unknown>) => ({
  function_arn: context.invokedFunctionArn,
  function_memory_size: context.memoryLimitInMB,
  function_name: context.functionName,
  function_request_id: context.awsRequestId,
  cold_start: true,
  ...overrides,
});

const logSpy = jest.spyOn(console, 'info');

describe('Inject Lambda Context', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    process.env = {
      ...ENVIRONMENT_VARIABLES,
      POWERTOOLS_DEV: 'true',
    };
    jest.resetAllMocks();
  });

  it('adds the context to log messages when the feature is enabled', () => {
    // Prepare
    const logger = new Logger();

    // Act
    logger.addContext(context);
    logger.info('Hello, world!');

    // Assess
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(logSpy.mock.calls[0][0])).toStrictEqual(
      expect.objectContaining({
        message: 'Hello, world!',
        ...getContextLogEntries(),
      })
    );
  });

  it('replaces the context when a new context is added', () => {
    // Prepare
    const logger = new Logger();

    // Act
    logger.addContext(context);
    logger.info('Hello, world!');
    logger.addContext({
      ...context,
      awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e812345679',
    });
    logger.info('Hello, world!');

    // Assess
    expect(logSpy).toHaveBeenCalledTimes(2);
    expect(JSON.parse(logSpy.mock.calls[0][0])).toStrictEqual(
      expect.objectContaining({
        message: 'Hello, world!',
        ...getContextLogEntries(),
      })
    );
    expect(JSON.parse(logSpy.mock.calls[1][0])).toStrictEqual(
      expect.objectContaining({
        message: 'Hello, world!',
        ...getContextLogEntries({
          function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345679',
          cold_start: false,
        }),
      })
    );
  });

  it('adds the context to log messages when the feature is enabled in the Middy.js middleware', async () => {
    // Prepare
    const logger = new Logger();
    const handler = middy(async () => {
      logger.info('Hello, world!');
    }).use(injectLambdaContext(logger));

    // Act
    await handler(event, context);

    // Assess
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(logSpy.mock.calls[0][0])).toStrictEqual(
      expect.objectContaining({
        message: 'Hello, world!',
        ...getContextLogEntries(),
      })
    );
  });

  it('adds the context to the messages of each logger instance', async () => {
    // Prepare
    const logger1 = new Logger({ serviceName: 'parent' });
    const logger2 = logger1.createChild({ serviceName: 'child' });
    const handler = middy(async () => {
      logger1.info('Hello, world!');
      logger2.info('Hello, world!');
    }).use(injectLambdaContext([logger1, logger2]));

    // Act
    await handler(event, context);

    // Assess
    expect(logSpy).toHaveBeenCalledTimes(2);
    expect(JSON.parse(logSpy.mock.calls[0][0])).toStrictEqual(
      expect.objectContaining({
        message: 'Hello, world!',
        service: 'parent',
        ...getContextLogEntries(),
      })
    );
    expect(JSON.parse(logSpy.mock.calls[1][0])).toStrictEqual(
      expect.objectContaining({
        message: 'Hello, world!',
        service: 'child',
        ...getContextLogEntries(),
      })
    );
  });

  it('adds the context to the messages when the feature is enabled using the class method decorator', async () => {
    // Prepare
    const logger = new Logger();
    class Test {
      readonly #greeting: string;

      public constructor(greeting: string) {
        this.#greeting = greeting;
      }

      @logger.injectLambdaContext()
      async handler(_event: unknown, _context: Context) {
        this.logGreeting();
      }

      logGreeting() {
        logger.info(this.#greeting);
      }
    }
    const lambda = new Test('Hello, world!');
    const handler = lambda.handler.bind(lambda);

    // Act
    await handler(event, context);

    // Assess
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(logSpy.mock.calls[0][0])).toStrictEqual(
      expect.objectContaining({
        message: 'Hello, world!',
        ...getContextLogEntries(),
      })
    );
  });

  it('propagates the context data to the child logger instances', () => {
    // Prepare
    const logger = new Logger();

    // Act
    logger.addContext(context);
    const childLogger = logger.createChild({ serviceName: 'child' });
    childLogger.info('Hello, world!');

    // Assess
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(logSpy.mock.calls[0][0])).toStrictEqual(
      expect.objectContaining({
        message: 'Hello, world!',
        service: 'child',
        ...getContextLogEntries(),
      })
    );
  });
});
