/**
 * Test Logger middleware
 *
 * @group unit/logger/middleware
 */
import { cleanupMiddlewares } from '@aws-lambda-powertools/commons';
import context from '@aws-lambda-powertools/testing-utils/context';
import middy from '@middy/core';
import type { Context } from 'aws-lambda';
import { injectLambdaContext } from '../../../src/middleware/middy.js';
import { ConfigServiceInterface } from '../../../src/types/ConfigServiceInterface.js';
import { Logger } from './../../../src/Logger.js';

const mockDate = new Date(1466424490000);
const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

describe('Middy middleware', () => {
  const ENVIRONMENT_VARIABLES = process.env;
  const event = {
    foo: 'bar',
    bar: 'baz',
  };

  beforeEach(() => {
    jest.resetModules();
    dateSpy.mockClear();
    jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => null as unknown as boolean);
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('injectLambdaContext', () => {
    describe('Feature: add context data', () => {
      test('when a logger object is passed, it adds the context to the logger instance', async () => {
        // Prepare
        const logger = new Logger();
        const handler = middy((): void => {
          logger.info('This is an INFO log with some context');
        }).use(injectLambdaContext(logger));

        // Act
        await handler(event, context);

        // Assess
        expect(logger).toEqual(
          expect.objectContaining({
            powertoolsLogData: expect.objectContaining({
              lambdaContext: {
                awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
                coldStart: true,
                functionName: 'foo-bar-function',
                functionVersion: '$LATEST',
                invokedFunctionArn:
                  'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
                memoryLimitInMB: '128',
              },
            }),
          })
        );
      });

      test('when a logger array is passed, it adds the context to all logger instances', async () => {
        // Prepare
        const logger = new Logger();
        const anotherLogger = new Logger();
        const handler = middy((): void => {
          logger.info('This is an INFO log with some context');
          anotherLogger.info('This is an INFO log with some context');
        }).use(injectLambdaContext([logger, anotherLogger]));

        // Act
        await handler(event, context);

        // Assess
        const expectation = expect.objectContaining({
          powertoolsLogData: expect.objectContaining({
            lambdaContext: {
              awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
              coldStart: true,
              functionName: 'foo-bar-function',
              functionVersion: '$LATEST',
              invokedFunctionArn:
                'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
              memoryLimitInMB: '128',
            },
          }),
        });
        expect(logger).toEqual(expectation);
        expect(anotherLogger).toEqual(expectation);
      });
    });
  });

  describe('Feature: reset state', () => {
    test('when enabled, it clears all the log attributes added with appendKeys() inside and outside of the handler function', async () => {
      // Prepare
      const logger = new Logger({
        logLevel: 'DEBUG',
      });
      logger.appendKeys({
        foo: 'bar',
        biz: 'baz',
      });

      const debugSpy = jest.spyOn(logger['console'], 'debug');

      const handler = middy((): void => {
        // Only add these keys for the scope of this lambda handler
        logger.appendKeys({
          details: { user_id: '1234' },
        });
        logger.debug('This is a DEBUG log with the user_id');
      }).use(injectLambdaContext(logger, { clearState: true }));

      // Act
      await handler(event, context);
      logger.debug('Checking state after handler execution');

      // Assess
      expect(debugSpy).toHaveBeenCalledTimes(2);
      const log1 = JSON.parse(debugSpy.mock.calls[0][0]);
      expect(log1).toStrictEqual(
        expect.objectContaining({
          cold_start: true,
          function_arn:
            'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
          function_memory_size: '128',
          function_name: 'foo-bar-function',
          function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
          level: 'DEBUG',
          message: 'This is a DEBUG log with the user_id',
          sampling_rate: 0,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
          foo: 'bar',
          biz: 'baz',
          details: { user_id: '1234' },
        })
      );
      const log2 = JSON.parse(debugSpy.mock.calls[1][0]);
      expect(log2).toStrictEqual(
        expect.objectContaining({
          cold_start: true,
          function_arn:
            'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
          function_memory_size: '128',
          function_name: 'foo-bar-function',
          function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
          level: 'DEBUG',
          message: 'Checking state after handler execution',
          sampling_rate: 0,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        })
      );
    });

    test('when enabled, the temporary log attributes added within the handler scope are removed after the invocation ends', async () => {
      // Prepare
      const logger = new Logger({
        logLevel: 'DEBUG',
        persistentLogAttributes: {
          foo: 'bar',
        },
      });
      logger.appendKeys({
        biz: 'baz',
      });

      const debugSpy = jest.spyOn(logger['console'], 'debug');

      const handler = middy((): void => {
        // These keys stay only in the scope of this lambda handler
        logger.appendKeys({
          details: { user_id: '1234' },
        });
        logger.debug('This is a DEBUG log with the user_id');
      }).use(injectLambdaContext(logger, { clearState: true }));

      // Act
      await handler(event, context);
      logger.debug('Checking state after handler execution');

      // Assess
      expect(debugSpy).toHaveBeenCalledTimes(2);
      const log1 = JSON.parse(debugSpy.mock.calls[0][0]);
      expect(log1).toStrictEqual(
        expect.objectContaining({
          cold_start: true,
          function_arn:
            'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
          function_memory_size: '128',
          function_name: 'foo-bar-function',
          function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
          level: 'DEBUG',
          message: 'This is a DEBUG log with the user_id',
          sampling_rate: 0,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
          foo: 'bar',
          biz: 'baz',
          details: { user_id: '1234' },
        })
      );
      const log2 = JSON.parse(debugSpy.mock.calls[1][0]);
      expect(log2).toStrictEqual(
        expect.objectContaining({
          cold_start: true,
          function_arn:
            'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
          function_memory_size: '128',
          function_name: 'foo-bar-function',
          function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
          level: 'DEBUG',
          message: 'Checking state after handler execution',
          sampling_rate: 0,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
          foo: 'bar',
        })
      );
    });

    test('when enabled, the persistent log attributes added within the handler scope ARE NOT removed after the invocation ends', async () => {
      // Prepare
      const logger = new Logger({
        logLevel: 'DEBUG',
        persistentLogAttributes: {
          foo: 'bar',
          biz: 'baz',
        },
      });

      const handler = middy((): void => {
        // These persistent attributes stay persistent
        logger.addPersistentLogAttributes({
          details: { user_id: '1234' },
        });
        logger.debug('This is a DEBUG log with the user_id');
        logger.debug('This is another DEBUG log with the user_id');
      }).use(injectLambdaContext(logger, { clearState: true }));
      const persistentAttribsBeforeInvocation = {
        ...logger.getPersistentLogAttributes(),
      };

      // Act
      await handler(event, context);

      // Assess
      const persistentAttribsAfterInvocation = {
        ...logger.getPersistentLogAttributes(),
      };
      expect(persistentAttribsBeforeInvocation).toEqual({
        foo: 'bar',
        biz: 'baz',
      });
      expect(persistentAttribsAfterInvocation).toEqual({
        foo: 'bar',
        biz: 'baz',
        details: { user_id: '1234' },
      });
    });

    test('when enabled, the persistent log attributes added within the handler scope ARE NOT removed after the invocation ends even if an error is thrown', async () => {
      // Prepare
      const logger = new Logger({
        logLevel: 'DEBUG',
        persistentLogAttributes: {
          foo: 'bar',
          biz: 'baz',
        },
      });
      const handler = middy((): void => {
        // These persistent attributes stay persistent
        logger.addPersistentLogAttributes({
          details: { user_id: '1234' },
        });
        logger.debug('This is a DEBUG log with the user_id');
        logger.debug('This is another DEBUG log with the user_id');

        throw new Error('Unexpected error occurred!');
      }).use(injectLambdaContext(logger, { clearState: true }));
      const persistentAttribsBeforeInvocation = {
        ...logger.getPersistentLogAttributes(),
      };

      // Act & Assess
      await expect(handler(event, context)).rejects.toThrow();
      const persistentAttribsAfterInvocation = {
        ...logger.getPersistentLogAttributes(),
      };
      expect(persistentAttribsBeforeInvocation).toEqual({
        foo: 'bar',
        biz: 'baz',
      });
      expect(persistentAttribsAfterInvocation).toEqual({
        foo: 'bar',
        biz: 'baz',
        details: { user_id: '1234' },
      });
    });

    test('when enabled, and another middleware returns early, it still clears the state', async () => {
      // Prepare
      const logger = new Logger({
        logLevel: 'DEBUG',
      });
      const loggerSpy = jest.spyOn(logger['console'], 'debug');
      const myCustomMiddleware = (): middy.MiddlewareObj => {
        const before = async (
          request: middy.Request
        ): Promise<undefined | string> => {
          // Return early on the second invocation
          if (request.event.idx === 1) {
            // Cleanup Powertools resources
            await cleanupMiddlewares(request);

            // Then return early
            return 'foo';
          }
        };

        return {
          before,
        };
      };
      const handler = middy(
        (event: { foo: string; bar: string } & { idx: number }): void => {
          // Add a key only at the first invocation, so we can check that it's cleared
          if (event.idx === 0) {
            logger.appendKeys({
              details: { user_id: '1234' },
            });
          }
          logger.debug('This is a DEBUG log');
        }
      )
        .use(injectLambdaContext(logger, { clearState: true }))
        .use(myCustomMiddleware());

      // Act
      await handler({ ...event, idx: 0 }, context);
      await handler({ ...event, idx: 1 }, context);

      // Assess
      const persistentAttribsAfterInvocation = {
        ...logger.getPersistentLogAttributes(),
      };
      expect(persistentAttribsAfterInvocation).toEqual({});
      // Only one log because the second invocation returned early
      // from the custom middleware
      expect(loggerSpy).toBeCalledTimes(1);
      expect(loggerSpy).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('"details":{"user_id":"1234"}')
      );
    });
  });

  describe('Feature: log event', () => {
    test('when enabled, it logs the event', async () => {
      // Prepare
      const logger = new Logger();
      const consoleSpy = jest
        .spyOn(logger['console'], 'info')
        .mockImplementation();
      const handler = middy((): void => {
        logger.info('This is an INFO log with some context');
      }).use(injectLambdaContext(logger, { logEvent: true }));

      // Act
      await handler(event, context);

      // Assess
      expect(consoleSpy).toBeCalledTimes(2);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        JSON.stringify({
          cold_start: true,
          function_arn:
            'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
          function_memory_size: '128',
          function_name: 'foo-bar-function',
          function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
          level: 'INFO',
          message: 'Lambda invocation event',
          sampling_rate: 0,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
          event: {
            foo: 'bar',
            bar: 'baz',
          },
        })
      );
    });

    test('when enabled, while also having a custom configService, it logs the event', async () => {
      // Prepare
      const configService: ConfigServiceInterface = {
        get(name: string): string {
          return `a-string-from-${name}`;
        },
        getAwsLogLevel(): string {
          return 'INFO';
        },
        getCurrentEnvironment(): string {
          return 'dev';
        },
        getLogEvent(): boolean {
          return true;
        },
        getLogLevel(): string {
          return 'INFO';
        },
        getSampleRateValue(): number | undefined {
          return undefined;
        },
        getServiceName(): string {
          return 'my-backend-service';
        },
        getXrayTraceId(): string | undefined {
          return undefined;
        },
        isDevMode(): boolean {
          return false;
        },
        isValueTrue(): boolean {
          return true;
        },
      };

      const logger = new Logger({
        customConfigService: configService,
      });
      const consoleSpy = jest
        .spyOn(logger['console'], 'info')
        .mockImplementation();
      const handler = middy((): void => {
        logger.info('This is an INFO log with some context');
      }).use(injectLambdaContext(logger, { logEvent: true }));

      // Act
      await handler(event, context);

      // Assess
      expect(consoleSpy).toBeCalledTimes(2);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        JSON.stringify({
          cold_start: true,
          function_arn:
            'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
          function_memory_size: '128',
          function_name: 'foo-bar-function',
          function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
          level: 'INFO',
          message: 'Lambda invocation event',
          sampling_rate: 0,
          service: 'my-backend-service',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
          event: {
            foo: 'bar',
            bar: 'baz',
          },
        })
      );
    });

    test('when enabled via POWERTOOLS_LOGGER_LOG_EVENT env var, it logs the event', async () => {
      // Prepare
      process.env.POWERTOOLS_LOGGER_LOG_EVENT = 'true';
      const logger = new Logger();
      const consoleSpy = jest
        .spyOn(logger['console'], 'info')
        .mockImplementation();
      const handler = middy((): void => {
        logger.info('This is an INFO log with some context');
      }).use(injectLambdaContext(logger));

      // Act
      await handler(event, context);

      // Assess
      expect(consoleSpy).toBeCalledTimes(2);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        JSON.stringify({
          cold_start: true,
          function_arn:
            'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
          function_memory_size: '128',
          function_name: 'foo-bar-function',
          function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
          level: 'INFO',
          message: 'Lambda invocation event',
          sampling_rate: 0,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
          event: {
            foo: 'bar',
            bar: 'baz',
          },
        })
      );
    });

    test('when disabled in the middleware, but enabled via POWERTOOLS_LOGGER_LOG_EVENT env var, it still does not log the event', async () => {
      // Prepare
      process.env.POWERTOOLS_LOGGER_LOG_EVENT = 'true';
      const logger = new Logger();
      const consoleSpy = jest
        .spyOn(logger['console'], 'info')
        .mockImplementation();
      const handler = middy((): void => {
        logger.info('This is an INFO log');
      }).use(injectLambdaContext(logger, { logEvent: false }));

      // Act
      await handler(event, context);

      // Assess
      expect(consoleSpy).toBeCalledTimes(1);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        JSON.stringify({
          cold_start: true,
          function_arn:
            'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
          function_memory_size: '128',
          function_name: 'foo-bar-function',
          function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
          level: 'INFO',
          message: 'This is an INFO log',
          sampling_rate: 0,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        })
      );
    });

    test('when logEvent and clearState are both TRUE, and the logger has persistent attributes, any key added in the handler is cleared properly', async () => {
      const logger = new Logger({
        persistentLogAttributes: {
          version: '1.0.0',
        },
      });
      const consoleSpy = jest
        .spyOn(logger['console'], 'info')
        .mockImplementation();
      const handler = middy(
        async (event: { foo: string }, _context: Context) => {
          logger.appendKeys({ foo: event.foo });
        }
      ).use(injectLambdaContext(logger, { logEvent: true, clearState: true }));

      await handler({ foo: 'bar' }, {} as Context);
      await handler({ foo: 'baz' }, {} as Context);
      await handler({ foo: 'biz' }, {} as Context);
      await handler({ foo: 'buz' }, {} as Context);
      await handler({ foo: 'boz' }, {} as Context);

      expect(consoleSpy).toBeCalledTimes(5);
      for (let i = 1; i === 5; i++) {
        expect(consoleSpy).toHaveBeenNthCalledWith(
          i,
          expect.stringContaining('"message":"Lambda invocation event"')
        );
        expect(consoleSpy).toHaveBeenNthCalledWith(
          i,
          expect.stringContaining('"version":"1.0.0"')
        );
      }
      expect(consoleSpy).toHaveBeenNthCalledWith(
        2,
        expect.not.stringContaining('"foo":"bar"')
      );
      expect(consoleSpy).toHaveBeenNthCalledWith(
        3,
        expect.not.stringContaining('"foo":"baz"')
      );
      expect(consoleSpy).toHaveBeenNthCalledWith(
        4,
        expect.not.stringContaining('"foo":"biz"')
      );
      expect(consoleSpy).toHaveBeenNthCalledWith(
        5,
        expect.not.stringContaining('"foo":"buz"')
      );
    });
  });
});
