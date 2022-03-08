/**
 * Test Logger class
 *
 * @group unit/logger/all
 */

import { context as dummyContext } from '../../../../tests/resources/contexts/hello-world';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as dummyEvent from '../../../../tests/resources/events/custom/hello-world.json';
import { LambdaInterface } from '../../examples/utils/lambda';
import { createLogger, Logger } from '../../src';
import { EnvironmentVariablesService } from '../../src/config';
import { PowertoolLogFormatter } from '../../src/formatter';
import { ClassThatLogs } from '../../src/types';
import { Context } from 'aws-lambda';

const mockDate = new Date(1466424490000);
const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string);

const consoleSpy = {
  'debug': jest.spyOn(console, 'debug').mockImplementation(),
  'info': jest.spyOn(console, 'info').mockImplementation(),
  'warn': jest.spyOn(console, 'warn').mockImplementation(),
  'error': jest.spyOn(console, 'error').mockImplementation(),
};

describe('Class: Logger', () => {

  beforeEach(() => {
    consoleSpy['debug'].mockClear();
    consoleSpy['info'].mockClear();
    consoleSpy['warn'].mockClear();
    consoleSpy['error'].mockClear();
    dateSpy.mockClear();
  });

  describe.each([
    [ 'debug', 'DOES', true, 'DOES NOT', false, 'DOES NOT', false, 'DOES NOT', false ],
    [ 'info', 'DOES', true, 'DOES', true, 'DOES NOT', false, 'DOES NOT', false ],
    [ 'warn', 'DOES', true, 'DOES', true, 'DOES', true, 'DOES NOT', false ],
    [ 'error', 'DOES', true, 'DOES', true, 'DOES', true, 'DOES', true ],
  ])(
    'Method: %p',
    (
      method: string,
      debugAction,
      debugPrints,
      infoAction,
      infoPrints,
      warnAction,
      warnPrints,
      errorAction,
      errorPrints,
    ) => {

      describe('Feature: log level', () => {
        const methodOfLogger = method as keyof ClassThatLogs;

        test('when the Logger\'s log level is DEBUG, it '+ debugAction + ' print to stdout', () => {

          // Prepare
          const logger: ClassThatLogs = createLogger({
            logLevel: 'DEBUG',
          });

          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(console[methodOfLogger]).toBeCalledTimes(debugPrints ? 1 : 0);
          if (debugPrints) {
            expect(console[methodOfLogger]).toHaveBeenNthCalledWith(1, JSON.stringify({
              level: methodOfLogger.toUpperCase(),
              message: 'foo',
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
            }));
          }

        });

        test('when the Logger\'s log level is INFO, it '+ infoAction + ' print to stdout', () => {

          // Prepare
          const logger: ClassThatLogs = createLogger({
            logLevel: 'INFO',
          });

          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(console[methodOfLogger]).toBeCalledTimes(infoPrints ? 1 : 0);
          if (infoPrints) {
            expect(console[methodOfLogger]).toHaveBeenNthCalledWith(1, JSON.stringify({
              level: methodOfLogger.toUpperCase(),
              message: 'foo',
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
            }));
          }

        });

        test('when the Logger\'s log level is WARN, it '+ warnAction + ' print to stdout', () => {

          // Prepare
          const logger: ClassThatLogs = createLogger({
            logLevel: 'WARN',
          });

          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(console[methodOfLogger]).toBeCalledTimes(warnPrints ? 1 : 0);
          if (warnPrints) {
            expect(console[methodOfLogger]).toHaveBeenNthCalledWith(1, JSON.stringify({
              level: methodOfLogger.toUpperCase(),
              message: 'foo',
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
            }));
          }

        });

        test('when the Logger\'s log level is ERROR, it '+ errorAction + ' print to stdout', () => {

          // Prepare
          const logger: ClassThatLogs = createLogger({
            logLevel: 'ERROR',
          });

          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(console[methodOfLogger]).toBeCalledTimes(errorPrints ? 1 : 0);
          if (errorPrints) {
            expect(console[methodOfLogger]).toHaveBeenNthCalledWith(1, JSON.stringify({
              level: methodOfLogger.toUpperCase(),
              message: 'foo',
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
            }));
          }

        });

      });

      describe('Feature: sample rate', () => {

        const methodOfLogger = method as keyof ClassThatLogs;

        test('when the Logger\'s log level is higher and the current Lambda invocation IS NOT sampled for logging, it DOES NOT print to stdout', () => {

          // Prepare
          const logger: ClassThatLogs = createLogger({
            logLevel: 'ERROR',
            sampleRateValue: 0,
          });

          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(console[methodOfLogger]).toBeCalledTimes(method === 'error' ? 1 : 0);
        });

        test('when the Logger\'s log level is higher and the current Lambda invocation IS sampled for logging, it DOES print to stdout', () => {

          // Prepare
          const logger: ClassThatLogs = createLogger({
            logLevel: 'ERROR',
            sampleRateValue: 1,
          });

          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(console[methodOfLogger]).toBeCalledTimes(1);
          expect(console[methodOfLogger]).toHaveBeenNthCalledWith(1, JSON.stringify({
            level: method.toUpperCase(),
            message: 'foo',
            sampling_rate: 1,
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
          }));
        });

      });

      describe('Feature: capture Lambda context information and add it in the printed logs', () => {

        const methodOfLogger = method as keyof ClassThatLogs;

        test('when the Lambda context is not captured and a string is passed as log message, it should print a valid '+ method.toUpperCase() + ' log', () => {

          // Prepare
          const logger: ClassThatLogs = createLogger();

          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(console[methodOfLogger]).toBeCalledTimes(1);
          expect(console[methodOfLogger]).toHaveBeenNthCalledWith(1, JSON.stringify({
            level: method.toUpperCase(),
            message: 'foo',
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
          }));
        });

        test('when the Lambda context is captured, it returns a valid '+ method.toUpperCase() + ' log', () => {

          // Prepare
          const logger: ClassThatLogs & { addContext: (context: Context) => void } = createLogger({
            logLevel: 'DEBUG',
          });
          logger.addContext(dummyContext);

          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(console[methodOfLogger]).toBeCalledTimes(1);
          expect(console[methodOfLogger]).toHaveBeenNthCalledWith(1, JSON.stringify({
            cold_start: true,
            function_arn: 'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
            function_memory_size: 128,
            function_name: 'foo-bar-function',
            function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
            level: method.toUpperCase(),
            message: 'foo',
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
          }));

        });

      });

      describe('Feature: ephemeral log attributes', () => {

        const methodOfLogger = method as keyof ClassThatLogs;
        const methodOfConsole = methodOfLogger;

        test('when added, they should appear in that log item only', () => {

          // Prepare
          const logger: ClassThatLogs = createLogger({
            logLevel: 'DEBUG',
          });

          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('A log item without extra parameters');
            logger[methodOfLogger]('A log item with a string as first parameter, and an object as second parameter', { extra: 'parameter' });
            logger[methodOfLogger]('A log item with a string as first parameter, and objects as other parameters', { parameterOne: 'foo' }, { parameterTwo: 'bar' });
            logger[methodOfLogger]( { message: 'A log item with an object as first parameters', extra: 'parameter' });
            logger[methodOfLogger]('A log item with a string as first parameter, and an error as second parameter', new Error('Something happened!') );
            logger[methodOfLogger]('A log item with a string as first parameter, and an error with custom key as second parameter', { myCustomErrorKey: new Error('Something happened!') });
            logger[methodOfLogger]('A log item with a string as first parameter, and a string as second parameter', 'parameter');
          }

          // Assess
          expect(console[methodOfConsole]).toHaveBeenNthCalledWith(1, JSON.stringify({
            level: method.toUpperCase(),
            message: 'A log item without extra parameters',
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
          }));
          expect(console[methodOfConsole]).toHaveBeenNthCalledWith(2, JSON.stringify({
            level: method.toUpperCase(),
            message: 'A log item with a string as first parameter, and an object as second parameter',
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
            extra: 'parameter',
          }));
          expect(console[methodOfConsole]).toHaveBeenNthCalledWith(3, JSON.stringify({
            level: method.toUpperCase(),
            message: 'A log item with a string as first parameter, and objects as other parameters',
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
            parameterOne: 'foo',
            parameterTwo: 'bar',
          }));
          expect(console[methodOfConsole]).toHaveBeenNthCalledWith(4, JSON.stringify({
            level: method.toUpperCase(),
            message: 'A log item with an object as first parameters',
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
            extra: 'parameter',
          }));
          const parameterCallNumber5 = JSON.parse(consoleSpy[methodOfConsole].mock.calls[4][0]);
          expect(parameterCallNumber5).toEqual(expect.objectContaining( {
            level: method.toUpperCase(),
            message: 'A log item with a string as first parameter, and an error as second parameter',
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
            error: {
              location: expect.stringMatching(/Logger.test.ts:[0-9]+$/),
              message: 'Something happened!',
              name: 'Error',
              stack: expect.stringMatching(/Logger.test.ts:[0-9]+:[0-9]+/),
            },
          }));
          const parameterCallNumber6 = JSON.parse(consoleSpy[methodOfConsole].mock.calls[5][0]);
          expect(parameterCallNumber6).toEqual(expect.objectContaining({
            level: method.toUpperCase(),
            message: 'A log item with a string as first parameter, and an error with custom key as second parameter',
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
            myCustomErrorKey: {
              location: expect.stringMatching(/Logger.test.ts:[0-9]+$/),
              message: 'Something happened!',
              name: 'Error',
              stack: expect.stringMatching(/Logger.test.ts:[0-9]+:[0-9]+/),
            },
          }));
          expect(console[methodOfConsole]).toHaveBeenNthCalledWith(7, JSON.stringify({
            level: method.toUpperCase(),
            message: 'A log item with a string as first parameter, and a string as second parameter',
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
            extra: 'parameter',
          }));
        });
      });

      describe('Feature: persistent log attributes', () => {

        const methodOfLogger = method as keyof ClassThatLogs;
        const methodOfConsole = methodOfLogger;

        test('when persistent log attributes are added to the Logger instance, they should appear in all logs printed by the instance', () => {

          // Prepare
          const logger: ClassThatLogs = createLogger({
            logLevel: 'DEBUG',
            persistentLogAttributes: {
              aws_account_id: '123456789012',
              aws_region: 'eu-west-1',
            },
          });

          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(console[methodOfConsole]).toBeCalledTimes(1);
          expect(console[methodOfConsole]).toHaveBeenNthCalledWith(1, JSON.stringify({
            level: method.toUpperCase(),
            message: 'foo',
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
            aws_account_id: '123456789012',
            aws_region: 'eu-west-1',
          }));
        });

      });

      describe('Feature: handle safely unexpected errors', () => {

        const methodOfLogger = method as keyof ClassThatLogs;
        const methodOfConsole = methodOfLogger;

        test('when a logged item references itself, the logger ignores the keys that cause a circular reference', () => {

          // Prepare
          const logger: ClassThatLogs = createLogger({
            logLevel: 'DEBUG',
          });
          const circularObject = {
            foo: 'bar',
            self: {},
          };
          circularObject.self = circularObject;
          const logCircularReference = (): string => {
            if (logger[methodOfLogger]) {
              logger[methodOfLogger]('A log with a circular reference', { details: circularObject });
            }

            return 'All good!';
          };

          // Act
          const result = logCircularReference();

          // Assess
          expect(result).toBe('All good!');
          expect(console[methodOfConsole]).toHaveBeenNthCalledWith(1, JSON.stringify({
            level: method.toUpperCase(),
            message: 'A log with a circular reference',
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
            details: {
              foo: 'bar',
            },
          }));

        });

      });
    });

  describe('Method: addContext', () => {

    const baseContext = {
      callbackWaitsForEmptyEventLoop: true,
      functionVersion: '$LATEST',
      functionName: 'foo-bar-function-with-cold-start',
      memoryLimitInMB: '128',
      logGroupName: '/aws/lambda/foo-bar-function-with-cold-start',
      logStreamName: '2021/03/09/[$LATEST]abcdef123456abcdef123456abcdef123456',
      invokedFunctionArn: 'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function-with-cold-start',
      awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
      getRemainingTimeInMillis: () => 1234,
      done: () => console.log('Done!'),
      fail: () => console.log('Failed!'),
      succeed: () => console.log('Succeeded!'),
    };

    test('when called during a COLD START invocation, it populates the logger\'s PowertoolLogData object with coldstart set to true', () => {

      // Prepare
      const logger = new Logger();

      // Act
      logger.addContext(baseContext);

      // Assess
      expect(logger).toEqual({
        coldStart: false, // This is now false because the `coldStart` attribute has been already accessed once by the `addContext` method
        customConfigService: undefined,
        envVarsService: expect.any(EnvironmentVariablesService),
        logFormatter: expect.any(PowertoolLogFormatter),
        logLevel: 'DEBUG',
        logLevelThresholds: {
          DEBUG: 8,
          ERROR: 20,
          INFO: 12,
          WARN: 16,
        },
        logsSampled: false,
        persistentLogAttributes: {},
        powertoolLogData: {
          awsRegion: 'eu-west-1',
          environment: '',
          lambdaContext: {
            awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
            coldStart: true,
            functionName: 'foo-bar-function-with-cold-start',
            functionVersion: '$LATEST',
            invokedFunctionArn: 'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function-with-cold-start',
            memoryLimitInMB: 128,
          },
          sampleRateValue: undefined,
          serviceName: 'hello-world',
          xRayTraceId: 'abcdef123456abcdef123456abcdef123456',
        },
      });
    });

    test('when called with a context object, the object is not mutated', () => {

      // Prepare
      const logger = new Logger();
      const context1 = { ...baseContext, awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e812345678' };
      const context2 = { ...baseContext, awsRequestId: 'd40c98a9-91c4-478c-a179-433c4b978289' };

      // Act
      logger.addContext(context1);
      logger.addContext(context2);

      // Assess
      expect(context1.awsRequestId).toEqual('c6af9ac6-7b61-11e6-9a41-93e812345678');
      expect(context2.awsRequestId).toEqual('d40c98a9-91c4-478c-a179-433c4b978289');
    });

    test('when called multiple times, the newer values override earlier values', () => {

      // Prepare
      const logger = new Logger();
      const context1 = { ...baseContext, awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e812345678' };
      const context2 = { ...baseContext, awsRequestId: 'd40c98a9-91c4-478c-a179-433c4b978289' };

      // Act
      logger.addContext(context1);
      logger.addContext(context2);

      // Assess
      expect(logger).toEqual(
        expect.objectContaining({
          powertoolLogData: expect.objectContaining({
            lambdaContext: expect.objectContaining({
              awsRequestId: context2.awsRequestId,
            })
          })
        })
      );
    });
  });

  describe('Method: appendKeys', () => {

    test('when called, populates the logger\'s propriety persistentLogAttributes ', () => {

      // Prepare
      const logger = new Logger();

      // Act
      logger.appendKeys({
        aws_account_id: '123456789012',
        aws_region: 'eu-west-1',
        logger: {
          name: 'aws-lambda-powertool-typescript',
          version: '0.2.4',
        },
      });

      // Assess
      expect(logger).toEqual(expect.objectContaining({
        persistentLogAttributes: {
          aws_account_id: '123456789012',
          aws_region: 'eu-west-1',
          logger: {
            name: 'aws-lambda-powertool-typescript',
            version: '0.2.4',
          },
        },
      }));
    });

    test('when called with user-provided attribute objects, the objects are not mutated', () => {

      // Prepare
      const logger = new Logger();
      const attributes1 = { keyOne: 'abc' };
      const attributes2 = { keyTwo: 'def' };

      // Act
      logger.appendKeys(attributes1);
      logger.appendKeys(attributes2);

      // Assess
      expect(attributes1).toEqual({ keyOne: 'abc' });
      expect(attributes2).toEqual({ keyTwo: 'def' });
    });

    test('when called multiple times, the newer values override earlier values', () => {

      // Prepare
      const logger = new Logger();

      // Act
      logger.appendKeys({
        duplicateKey: 'one'
      });
      logger.appendKeys({
        duplicateKey: 'two'
      });

      // Assess
      expect(logger).toEqual(expect.objectContaining({
        persistentLogAttributes: {
          duplicateKey: 'two'
        }
      }));
    });
  });

  describe('Method: injectLambdaContext', () => {

    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    test('when used as decorator, it returns a function with the correct scope of the decorated class', async () => {

      // Prepare
      const logger = new Logger();
      class LambdaFunction implements LambdaInterface {

        @logger.injectLambdaContext()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
          this.myClassMethod();
        }

        private myClassMethod (): void {
          logger.info('This is an INFO log with some context');
        }

      }

      // Act
      await new LambdaFunction().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

      // Assess
      expect(console['info']).toBeCalledTimes(1);
      expect(console['info']).toHaveBeenNthCalledWith(1, JSON.stringify({
        cold_start: true,
        function_arn: 'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
        function_memory_size: 128,
        function_name: 'foo-bar-function',
        function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
        level: 'INFO',
        message: 'This is an INFO log with some context',
        service: 'hello-world',
        timestamp: '2016-06-20T12:08:10.000Z',
        xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
      }));

    });

    test('when used as decorator, it returns a function that captures Lambda\'s context information and adds it in the printed logs', async () => {

      // Prepare
      const logger = new Logger();
      class LambdaFunction implements LambdaInterface {

        @logger.injectLambdaContext()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
          logger.info('This is an INFO log with some context');
        }
      }

      // Act
      logger.info('An INFO log without context!');
      await new LambdaFunction().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

      // Assess

      expect(console['info']).toBeCalledTimes(2);
      expect(console['info']).toHaveBeenNthCalledWith(1, JSON.stringify({
        level: 'INFO',
        message: 'An INFO log without context!',
        service: 'hello-world',
        timestamp: '2016-06-20T12:08:10.000Z',
        xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
      }));
      expect(console['info']).toHaveBeenNthCalledWith(2, JSON.stringify({
        cold_start: true,
        function_arn: 'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
        function_memory_size: 128,
        function_name: 'foo-bar-function',
        function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
        level: 'INFO',
        message: 'This is an INFO log with some context',
        service: 'hello-world',
        timestamp: '2016-06-20T12:08:10.000Z',
        xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
      }));

    });

    test('when used as decorator on an async handler without context, it returns a function that captures Lambda\'s context information and adds it in the printed logs', async () => {

      // Prepare
      const expectedReturnValue = 'Lambda invoked!';
      const logger = new Logger();
      class LambdaFunction implements LambdaInterface {

        @logger.injectLambdaContext()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public async handler<TEvent>(_event: TEvent, _context: Context): Promise<string> {
          logger.info('This is an INFO log with some context');

          return expectedReturnValue;
        }
      }

      // Act
      logger.info('An INFO log without context!');
      const actualResult = await new LambdaFunction().handler(dummyEvent, dummyContext);

      // Assess

      expect(actualResult).toEqual(expectedReturnValue);
      expect(console['info']).toBeCalledTimes(2);
      expect(console['info']).toHaveBeenNthCalledWith(1, JSON.stringify({
        level: 'INFO',
        message: 'An INFO log without context!',
        service: 'hello-world',
        timestamp: '2016-06-20T12:08:10.000Z',
        xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
      }));
      expect(console['info']).toHaveBeenNthCalledWith(2, JSON.stringify({
        cold_start: true,
        function_arn: 'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
        function_memory_size: 128,
        function_name: 'foo-bar-function',
        function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
        level: 'INFO',
        message: 'This is an INFO log with some context',
        service: 'hello-world',
        timestamp: '2016-06-20T12:08:10.000Z',
        xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
      }));

    });

  });

  describe('Method: refreshSampleRateCalculation', () => {

    test('when called, it recalculates whether the current Lambda invocation\'s logs will be printed or not', () => {

      // Prepare
      const logger = new Logger({
        logLevel: 'ERROR',
        sampleRateValue: 0.1, // 10% probability
      });
      let logsSampledCount = 0;

      // Act
      for (let i = 0; i < 1000; i++) {
        logger.refreshSampleRateCalculation();
        if (logger.getLogsSampled() === true) {
          logsSampledCount++;
        }
      }

      // Assess
      expect(logsSampledCount > 50).toBe(true);
      expect(logsSampledCount < 150).toBe(true);

    });

  });

  describe('Method: createChild', () => {

    test('when called, it returns a DISTINCT clone of the logger instance', () => {

      // Prepare
      const parentLogger = new Logger();

      // Act
      const childLogger = parentLogger.createChild();
      const childLoggerWithPermanentAttributes = parentLogger.createChild({
        persistentLogAttributes: {
          extra: 'This is an attribute that will be logged only by the child logger',
        },
      });
      const childLoggerWithSampleRateEnabled = parentLogger.createChild({
        sampleRateValue: 1, // 100% probability to make sure that the logs are sampled
      });
      const childLoggerWithErrorLogLevel = parentLogger.createChild({
        logLevel: 'ERROR',
      });

      // Assess
      expect(parentLogger === childLogger).toBe(false);
      expect(parentLogger).toEqual(childLogger);
      expect(parentLogger === childLoggerWithPermanentAttributes).toBe(false);
      expect(parentLogger === childLoggerWithSampleRateEnabled).toBe(false);
      expect(parentLogger === childLoggerWithErrorLogLevel).toBe(false);

      expect(parentLogger).toEqual({
        coldStart: true,
        customConfigService: undefined,
        envVarsService: expect.any(EnvironmentVariablesService),
        logFormatter: expect.any(PowertoolLogFormatter),
        logLevel: 'DEBUG',
        logLevelThresholds: {
          DEBUG: 8,
          ERROR: 20,
          INFO: 12,
          WARN: 16,
        },
        logsSampled: false,
        persistentLogAttributes: {},
        powertoolLogData: {
          awsRegion: 'eu-west-1',
          environment: '',
          sampleRateValue: undefined,
          serviceName: 'hello-world',
          xRayTraceId: 'abcdef123456abcdef123456abcdef123456',
        },
      });

      expect(childLoggerWithPermanentAttributes).toEqual({
        coldStart: true,
        customConfigService: undefined,
        envVarsService: expect.any(EnvironmentVariablesService),
        logFormatter: expect.any(PowertoolLogFormatter),
        logLevel: 'DEBUG',
        logLevelThresholds: {
          DEBUG: 8,
          ERROR: 20,
          INFO: 12,
          WARN: 16,
        },
        logsSampled: false,
        persistentLogAttributes: {
          extra: 'This is an attribute that will be logged only by the child logger',
        },
        powertoolLogData: {
          awsRegion: 'eu-west-1',
          environment: '',
          sampleRateValue: undefined,
          serviceName: 'hello-world',
          xRayTraceId: 'abcdef123456abcdef123456abcdef123456',
        },
      });

      expect(childLoggerWithSampleRateEnabled).toEqual({
        coldStart: true,
        customConfigService: undefined,
        envVarsService: expect.any(EnvironmentVariablesService),
        logFormatter: expect.any(PowertoolLogFormatter),
        logLevel: 'DEBUG',
        logLevelThresholds: {
          DEBUG: 8,
          ERROR: 20,
          INFO: 12,
          WARN: 16,
        },
        logsSampled: true,
        persistentLogAttributes: {},
        powertoolLogData: {
          awsRegion: 'eu-west-1',
          environment: '',
          sampleRateValue: 1,
          serviceName: 'hello-world',
          xRayTraceId: 'abcdef123456abcdef123456abcdef123456',
        },
      });

      expect(childLoggerWithErrorLogLevel).toEqual({
        coldStart: true,
        customConfigService: undefined,
        envVarsService: expect.any(EnvironmentVariablesService),
        logFormatter: expect.any(PowertoolLogFormatter),
        logLevel: 'ERROR',
        logLevelThresholds: {
          DEBUG: 8,
          ERROR: 20,
          INFO: 12,
          WARN: 16,
        },
        logsSampled: false,
        persistentLogAttributes: {},
        powertoolLogData: {
          awsRegion: 'eu-west-1',
          environment: '',
          sampleRateValue: undefined,
          serviceName: 'hello-world',
          xRayTraceId: 'abcdef123456abcdef123456abcdef123456',
        },
      });

    });

  });

});