import context from '@aws-lambda-powertools/testing-utils/context';
import middy from '@middy/core';
import type { Context } from 'aws-lambda';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../../src/Logger.js';
import { search } from '../../src/correlationId.js';
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

  it.each([
    {
      case: 'middleware',
      getHandler: (logger: Logger) =>
        middy(async () => {
          logger.info('Hello, world!');
        }).use(injectLambdaContext(logger)),
    },
    {
      case: 'decorator',
      getHandler: (logger: Logger) => {
        class Lambda {
          @logger.injectLambdaContext()
          public async handler(
            _event: unknown,
            _context: Context
          ): Promise<void> {
            logger.info('test');
          }
        }
        const lambda = new Lambda();
        return lambda.handler.bind(lambda);
      },
    },
  ])(
    'refreshes sample rate calculation before only during warm starts ($case)',
    async ({ getHandler }) => {
      // Prepare
      const logger = new Logger({ sampleRateValue: 1 });
      const setLogLevelSpy = vi.spyOn(logger, 'setLogLevel');

      const handler = getHandler(logger);

      // Act
      await handler(event, context); // cold start
      await handler(event, context); // warm start

      // Assess
      expect(setLogLevelSpy).toHaveBeenCalledTimes(1);
      expect(console.debug).toHaveBeenCalledTimes(2);
      expect(console.debug).toHaveLoggedNth(
        1,
        expect.objectContaining({
          message: 'Setting log level to DEBUG due to sampling rate',
        })
      );
      expect(console.debug).toHaveLoggedNth(
        2,
        expect.objectContaining({
          message: 'Setting log level to DEBUG due to sampling rate',
        })
      );
    }
  );

  describe('Correlation ID', () => {
    const testEvent = {
      headers: {
        'x-correlation-id': '12345-test-id',
      },
      requestContext: {
        requestId: 'api-gateway-request-id',
      },
      id: 'eventbridge-id',
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
      const logger = new Logger({ correlationIdSearchFn: search });
      const handler = middy(async () => {
        logger.info('Hello, world!');
      }).use(
        injectLambdaContext(logger, {
          correlationIdPath: 'headers."x-correlation-id"',
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
      const logger = new Logger({ correlationIdSearchFn: search });

      class TestHandler {
        @logger.injectLambdaContext({
          correlationIdPath: 'headers."x-correlation-id"',
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

    it('should warn when correlationIdPath is provided but no search function is available', async () => {
      // Prepare
      const logger = new Logger(); // No search function provided
      const warnSpy = vi.spyOn(logger, 'warn');

      // Act - Use middleware which will internally call setCorrelationIdFromPath
      const handler = middy(async () => {
        logger.info('Hello, world!');
      }).use(
        injectLambdaContext(logger, {
          correlationIdPath: 'headers.x-correlation-id',
        })
      );

      await handler(testEvent, context);

      // Assess
      expect(warnSpy).toHaveBeenCalledWith(
        'correlationIdPath is set but no search function was provided. The correlation ID will not be added to the log attributes.'
      );
    });

    it('should not set correlation ID when search function returns falsy value', async () => {
      // Prepare
      const logger = new Logger({ correlationIdSearchFn: search });

      // Act - Use middleware which will internally call setCorrelationIdFromPath
      const handler = middy(async () => {
        logger.info('Hello, world!');
      }).use(
        injectLambdaContext(logger, {
          correlationIdPath: 'headers."non-existent"',
        })
      );

      await handler(testEvent, context);

      // Assess
      expect(logger.getCorrelationId()).toBeUndefined();
      expect(console.info).toHaveBeenCalledTimes(1);
      expect(console.info).toHaveLoggedNth(
        1,
        expect.not.objectContaining({
          correlation_id: expect.anything(),
        })
      );
    });

    it('should propagate correlation ID to child loggers', () => {
      // Prepare
      const logger = new Logger();
      logger.setCorrelationId('parent-correlation-id');

      // Act
      const childLogger = logger.createChild();
      childLogger.info('Hello from child!');

      // Assess
      expect(console.info).toHaveBeenCalledTimes(1);
      expect(console.info).toHaveLoggedNth(
        1,
        expect.objectContaining({
          message: 'Hello from child!',
          correlation_id: 'parent-correlation-id',
        })
      );
    });

    it('should allow using different types as correlation ID', () => {
      // Prepare
      const logger = new Logger();
      const numericId = 12345;

      // Act
      logger.setCorrelationId(numericId);
      logger.info('Using numeric ID');

      // Assess
      expect(console.info).toHaveBeenCalledTimes(1);
      expect(console.info).toHaveLoggedNth(
        1,
        expect.objectContaining({
          message: 'Using numeric ID',
          correlation_id: numericId,
        })
      );
      expect(logger.getCorrelationId()).toBe(numericId);
    });

    it('should handle complex objects as correlation ID', () => {
      // Prepare
      const logger = new Logger();
      const complexId = { requestId: 'abc123', timestamp: Date.now() };

      // Act
      logger.setCorrelationId(complexId);
      logger.info('Using complex object ID');

      // Assess
      expect(console.info).toHaveBeenCalledTimes(1);
      expect(console.info).toHaveLoggedNth(
        1,
        expect.objectContaining({
          message: 'Using complex object ID',
          correlation_id: complexId,
        })
      );
      expect(logger.getCorrelationId()).toEqual(complexId);
    });

    it('should set correlation IDs across multiple logger instances with middleware', async () => {
      // Prepare
      const logger1 = new Logger({ correlationIdSearchFn: search });
      const logger2 = new Logger({ correlationIdSearchFn: search });

      const handler = middy(async () => {
        logger1.info('Log from first logger');
        logger2.info('Log from second logger');
      }).use(
        injectLambdaContext([logger1, logger2], {
          correlationIdPath: 'headers."x-correlation-id"',
        })
      );

      // Act
      await handler(testEvent, context);

      // Assess
      expect(console.info).toHaveBeenCalledTimes(2);
      expect(console.info).toHaveLoggedNth(
        1,
        expect.objectContaining({
          message: 'Log from first logger',
          correlation_id: '12345-test-id',
        })
      );
      expect(console.info).toHaveLoggedNth(
        2,
        expect.objectContaining({
          message: 'Log from second logger',
          correlation_id: '12345-test-id',
        })
      );
    });

    it('should work with both correlationIdPath and logEvent options together', async () => {
      // Prepare
      const logger = new Logger({ correlationIdSearchFn: search });
      const infoSpy = vi.spyOn(logger, 'info');

      const handler = middy(async () => {
        logger.info('Log with correlation ID');
      }).use(
        injectLambdaContext(logger, {
          correlationIdPath: 'headers."x-correlation-id"',
          logEvent: true,
        })
      );

      // Act
      await handler(testEvent, context);

      // Assess
      // First call should be for the event logging
      expect(infoSpy).toHaveBeenNthCalledWith(
        1,
        'Lambda invocation event',
        expect.objectContaining({ event: testEvent })
      );
      // Second call should be our actual log
      expect(infoSpy).toHaveBeenNthCalledWith(2, 'Log with correlation ID');

      // Check the log output includes correlation ID
      expect(console.info).toHaveBeenCalledTimes(2);
      expect(console.info).toHaveLoggedNth(
        2,
        expect.objectContaining({
          message: 'Log with correlation ID',
          correlation_id: '12345-test-id',
        })
      );
    });

    it('should use the API_GATEWAY_REST predefined path to extract correlation ID', async () => {
      // Prepare
      const logger = new Logger({ correlationIdSearchFn: search });
      const handler = middy(async () => {
        logger.info('Using API Gateway request ID');
      }).use(
        injectLambdaContext(logger, {
          correlationIdPath: 'requestContext.requestId',
        })
      );

      // Act
      await handler(testEvent, context);

      // Assess
      expect(console.info).toHaveBeenCalledTimes(1);
      expect(console.info).toHaveLoggedNth(
        1,
        expect.objectContaining({
          message: 'Using API Gateway request ID',
          correlation_id: 'api-gateway-request-id',
        })
      );
    });

    it('should handle undefined correlation ID gracefully', async () => {
      // Prepare
      const searchFn = vi.fn().mockReturnValue(undefined);
      const logger = new Logger({ correlationIdSearchFn: searchFn });

      const handler = middy(async () => {
        logger.info('No correlation ID available');
      }).use(
        injectLambdaContext(logger, {
          correlationIdPath: 'non.existent.path',
        })
      );

      // Act
      await handler(testEvent, context);

      // Assess
      expect(searchFn).toHaveBeenCalledWith('non.existent.path', testEvent);
      expect(console.info).toHaveBeenCalledTimes(1);
      expect(console.info).toHaveLoggedNth(
        1,
        expect.not.objectContaining({
          correlation_id: expect.anything(),
        })
      );
    });
  });
});
