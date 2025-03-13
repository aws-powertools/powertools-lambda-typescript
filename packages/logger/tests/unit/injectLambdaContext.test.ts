import context from '@aws-lambda-powertools/testing-utils/context';
import middy from '@middy/core';
import type { Context } from 'aws-lambda';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('Inject Lambda Context', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    process.env = {
      ...ENVIRONMENT_VARIABLES,
      POWERTOOLS_DEV: 'true',
    };
    vi.clearAllMocks();
  });

  it('adds the context to log messages when the feature is enabled', () => {
    // Prepare
    const logger = new Logger();

    // Act
    logger.addContext(context);
    logger.info('Hello, world!');

    // Assess
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(
      1,
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
    expect(console.info).toHaveBeenCalledTimes(2);
    expect(console.info).toHaveLoggedNth(
      2,
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
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(
      1,
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
    expect(console.info).toHaveBeenCalledTimes(2);
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({
        message: 'Hello, world!',
        service: 'parent',
        ...getContextLogEntries(),
      })
    );
    expect(console.info).toHaveLoggedNth(
      2,
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
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(
      1,
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
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({
        message: 'Hello, world!',
        service: 'child',
        ...getContextLogEntries(),
      })
    );
  });

  it('refreshes sample rate calculation before each invocation using decorator for warm start only', async () => {
    // Prepare
    const logger = new Logger({ sampleRateValue: 0.5 });
    const refreshSpy = vi.spyOn(logger, 'refreshSampleRateCalculation');

    class Lambda {
      @logger.injectLambdaContext()
      public async handler(_event: unknown, _context: Context): Promise<void> {
        logger.info('test');
      }
    }
    const lambda = new Lambda();
    // Act
    await lambda.handler({}, {} as Context);

    // Assess
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });

  it('refreshes sample rate calculation before each invocation using middleware for warm start only', async () => {
    // Prepare
    const logger = new Logger({ sampleRateValue: 0.5 });
    const refreshSpy = vi.spyOn(logger, 'refreshSampleRateCalculation');

    const handler = middy(async () => {
      logger.info('Hello, world!');
    }).use(injectLambdaContext(logger));

    // Act
    await handler(event, context);

    // Assess
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });
  describe('Correlation ID', () => {
    const testEvent = {
      headers: {
        'x-correlation-id': '12345-test-id',
      },
    };

    beforeEach(() => {
      process.env = {
        ...ENVIRONMENT_VARIABLES,
        POWERTOOLS_DEV: 'true',
      };
      vi.clearAllMocks();
    });

    it('should set correlation ID through middleware', async () => {
      // Prepare
      const searchFn = vi.fn().mockReturnValue('12345-test-id');
      const logger = new Logger({ correlationIdSearchFn: searchFn });
      const handler = middy(async () => {
        logger.info('Hello, world!');
      }).use(
        injectLambdaContext(logger, {
          correlationIdPath: 'headers.x-correlation-id',
        })
      );

      // Act
      await handler(testEvent, context);

      // Assess
      expect(console.info).toHaveBeenCalledTimes(1);
      expect(console.info).toHaveLoggedNth(
        1,
        expect.objectContaining({
          message: 'Hello, world!',
          correlation_id: '12345-test-id',
          ...getContextLogEntries(),
        })
      );
    });

    it('should set correlation ID when using class decorator', async () => {
      // Prepare
      const searchFn = vi.fn().mockReturnValue('12345-test-id');
      const logger = new Logger({ correlationIdSearchFn: searchFn });

      class TestHandler {
        @logger.injectLambdaContext({
          correlationIdPath: 'headers.x-correlation-id',
        })
        async handler(event: unknown, _context: Context): Promise<void> {
          logger.info('Hello from handler');
        }
      }

      const lambda = new TestHandler();
      const handler = lambda.handler.bind(lambda);

      // Act
      await handler(testEvent, context);

      // Assess
      expect(searchFn).toHaveBeenCalledWith(
        'headers.x-correlation-id',
        testEvent
      );
      expect(console.info).toHaveBeenCalledTimes(1);
      expect(console.info).toHaveLoggedNth(
        1,
        expect.objectContaining({
          message: 'Hello from handler',
          correlation_id: '12345-test-id',
          ...getContextLogEntries(),
        })
      );
    });

    it('should set correlation ID manually', () => {
      // Prepare
      const logger = new Logger();

      // Act
      logger.addContext(context);
      logger.setCorrelationId('12345-test-id');
      logger.info('Hello, world!');

      // Assess
      expect(console.info).toHaveBeenCalledTimes(1);
      expect(console.info).toHaveLoggedNth(
        1,
        expect.objectContaining({
          message: 'Hello, world!',
          correlation_id: '12345-test-id',
          ...getContextLogEntries(),
        })
      );

      expect(logger.getCorrelationId()).toBe('12345-test-id');
    });
  });
});
