/**
 * Test Logger class
 *
 * @group unit/logger/all
 */

import { context as dummyContext } from '../../../../tests/resources/contexts/hello-world';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as dummyEvent from '../../../../tests/resources/events/custom/hello-world.json';
import { createLogger, Logger } from '../../src';
import { EnvironmentVariablesService } from '../../src/config';
import { PowertoolLogFormatter } from '../../src/formatter';
import { ClassThatLogs } from '../../src/types';
import { Context, Handler } from 'aws-lambda';
import { Console } from 'console';

interface LambdaInterface {
  handler: Handler
}

const mockDate = new Date(1466424490000);
const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string);

describe('Class: Logger', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    dateSpy.mockClear();
    process.env = { ...ENVIRONMENT_VARIABLES };
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

        test('when the Logger\'s log level is DEBUG, it ' + debugAction + ' print to stdout', () => {

          // Prepare
          const logger: Logger = createLogger({
            logLevel: 'DEBUG',
          });
          const consoleSpy = jest.spyOn(logger['console'], methodOfLogger).mockImplementation();

          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(consoleSpy).toBeCalledTimes(debugPrints ? 1 : 0);
          if (debugPrints) {
            expect(consoleSpy).toHaveBeenNthCalledWith(1, JSON.stringify({
              level: methodOfLogger.toUpperCase(),
              message: 'foo',
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
            }));
          }

        });

        test('when the Logger\'s log level is INFO, it ' + infoAction + ' print to stdout', () => {

          // Prepare
          const logger: Logger = createLogger({
            logLevel: 'INFO',
          });
          const consoleSpy = jest.spyOn(logger['console'], methodOfLogger).mockImplementation();

          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(consoleSpy).toBeCalledTimes(infoPrints ? 1 : 0);
          if (infoPrints) {
            expect(consoleSpy).toHaveBeenNthCalledWith(1, JSON.stringify({
              level: methodOfLogger.toUpperCase(),
              message: 'foo',
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
            }));
          }

        });

        test('when the Logger\'s log level is WARN, it ' + warnAction + ' print to stdout', () => {

          // Prepare
          const logger: Logger = createLogger({
            logLevel: 'WARN',
          });
          const consoleSpy = jest.spyOn(logger['console'], methodOfLogger).mockImplementation();

          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(consoleSpy).toBeCalledTimes(warnPrints ? 1 : 0);
          if (warnPrints) {
            expect(consoleSpy).toHaveBeenNthCalledWith(1, JSON.stringify({
              level: methodOfLogger.toUpperCase(),
              message: 'foo',
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
            }));
          }

        });

        test('when the Logger\'s log level is ERROR, it ' + errorAction + ' print to stdout', () => {

          // Prepare
          const logger: Logger = createLogger({
            logLevel: 'ERROR',
          });
          const consoleSpy = jest.spyOn(logger['console'], methodOfLogger).mockImplementation();

          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(consoleSpy).toBeCalledTimes(errorPrints ? 1 : 0);
          if (errorPrints) {
            expect(consoleSpy).toHaveBeenNthCalledWith(1, JSON.stringify({
              level: methodOfLogger.toUpperCase(),
              message: 'foo',
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
            }));
          }

        });

      });

      describe('Feature: sample rate', () => {

        const methodOfLogger = method as keyof ClassThatLogs;

        test('when the Logger\'s log level is higher and the current Lambda invocation IS NOT sampled for logging, it DOES NOT print to stdout', () => {

          // Prepare
          const logger: Logger = createLogger({
            logLevel: 'ERROR',
            sampleRateValue: 0,
          });
          const consoleSpy = jest.spyOn(logger['console'], methodOfLogger).mockImplementation();

          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(consoleSpy).toBeCalledTimes(method === 'error' ? 1 : 0);
        });

        test('when the Logger\'s log level is higher and the current Lambda invocation IS sampled for logging, it DOES print to stdout', () => {

          // Prepare
          const logger: Logger = createLogger({
            logLevel: 'ERROR',
            sampleRateValue: 1,
          });
          const consoleSpy = jest.spyOn(logger['console'], methodOfLogger).mockImplementation();

          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(consoleSpy).toBeCalledTimes(1);
          expect(consoleSpy).toHaveBeenNthCalledWith(1, JSON.stringify({
            level: method.toUpperCase(),
            message: 'foo',
            sampling_rate: 1,
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
          }));
        });

      });

      describe('Feature: capture Lambda context information and add it in the printed logs', () => {

        const methodOfLogger = method as keyof ClassThatLogs;

        test('when the Lambda context is not captured and a string is passed as log message, it should print a valid ' + method.toUpperCase() + ' log', () => {

          // Prepare
          const logger: Logger = createLogger();
          const consoleSpy = jest.spyOn(logger['console'], methodOfLogger).mockImplementation();

          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(consoleSpy).toBeCalledTimes(1);
          expect(consoleSpy).toHaveBeenNthCalledWith(1, JSON.stringify({
            level: method.toUpperCase(),
            message: 'foo',
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
          }));
        });

        test('when the Lambda context is captured, it returns a valid ' + method.toUpperCase() + ' log', () => {

          // Prepare
          const logger: Logger & { addContext: (context: Context) => void } = createLogger({
            logLevel: 'DEBUG',
          });
          logger.addContext(dummyContext);
          const consoleSpy = jest.spyOn(logger['console'], methodOfLogger).mockImplementation();

          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(consoleSpy).toBeCalledTimes(1);
          expect(consoleSpy).toHaveBeenNthCalledWith(1, JSON.stringify({
            cold_start: true,
            function_arn: 'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
            function_memory_size: 128,
            function_name: 'foo-bar-function',
            function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
            level: method.toUpperCase(),
            message: 'foo',
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
          }));

        });

      });

      describe('Feature: ephemeral log attributes', () => {

        const methodOfLogger = method as keyof ClassThatLogs;

        test('when added, they should appear in that log item only', () => {

          // Prepare
          const logger: Logger = createLogger({
            logLevel: 'DEBUG',
          });
          const consoleSpy = jest.spyOn(logger['console'], methodOfLogger).mockImplementation();

          interface NestedObject { bool: boolean; str: string; num: number; err: Error }
          interface ArbitraryObject<TNested> { value: 'CUSTOM' | 'USER_DEFINED'; nested: TNested }

          const arbitraryObject: ArbitraryObject<NestedObject> = {
            value: 'CUSTOM',
            nested: { bool: true, str: 'string value', num: 42, err: new Error('Arbitrary object error') }
          };

          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('A log item without extra parameters');
            logger[methodOfLogger]('A log item with a string as first parameter, and an object as second parameter', { extra: 'parameter' });
            logger[methodOfLogger]('A log item with a string as first parameter, and objects as other parameters', { parameterOne: 'foo' }, { parameterTwo: 'bar' });
            logger[methodOfLogger]({ message: 'A log item with an object as first parameters', extra: 'parameter' });
            logger[methodOfLogger]('A log item with a string as first parameter, and an error as second parameter', new Error('Something happened!'));
            logger[methodOfLogger]('A log item with a string as first parameter, and an error with custom key as second parameter', { myCustomErrorKey: new Error('Something happened!') });
            logger[methodOfLogger]('A log item with a string as first parameter, and a string as second parameter', 'parameter');
            logger[methodOfLogger]('A log item with a string as first parameter, and an inline object as second parameter', { extra: { custom: mockDate } });
            logger[methodOfLogger]('A log item with a string as first parameter, and an arbitrary object as second parameter', { extra: arbitraryObject });
          }

          // Assess
          expect(consoleSpy).toHaveBeenNthCalledWith(1, JSON.stringify({
            level: method.toUpperCase(),
            message: 'A log item without extra parameters',
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
          }));
          expect(consoleSpy).toHaveBeenNthCalledWith(2, JSON.stringify({
            level: method.toUpperCase(),
            message: 'A log item with a string as first parameter, and an object as second parameter',
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
            extra: 'parameter',
          }));
          expect(consoleSpy).toHaveBeenNthCalledWith(3, JSON.stringify({
            level: method.toUpperCase(),
            message: 'A log item with a string as first parameter, and objects as other parameters',
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
            parameterOne: 'foo',
            parameterTwo: 'bar',
          }));
          expect(consoleSpy).toHaveBeenNthCalledWith(4, JSON.stringify({
            level: method.toUpperCase(),
            message: 'A log item with an object as first parameters',
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
            extra: 'parameter',
          }));
          const parameterCallNumber5 = JSON.parse(consoleSpy.mock.calls[4][0]);
          expect(parameterCallNumber5).toEqual(expect.objectContaining({
            level: method.toUpperCase(),
            message: 'A log item with a string as first parameter, and an error as second parameter',
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
            error: {
              location: expect.stringMatching(/Logger.test.ts:[0-9]+$/),
              message: 'Something happened!',
              name: 'Error',
              stack: expect.stringMatching(/Logger.test.ts:[0-9]+:[0-9]+/),
            },
          }));
          const parameterCallNumber6 = JSON.parse(consoleSpy.mock.calls[5][0] as string);
          expect(parameterCallNumber6).toEqual(expect.objectContaining({
            level: method.toUpperCase(),
            message: 'A log item with a string as first parameter, and an error with custom key as second parameter',
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
            myCustomErrorKey: {
              location: expect.stringMatching(/Logger.test.ts:[0-9]+$/),
              message: 'Something happened!',
              name: 'Error',
              stack: expect.stringMatching(/Logger.test.ts:[0-9]+:[0-9]+/),
            },
          }));
          expect(consoleSpy).toHaveBeenNthCalledWith(7, JSON.stringify({
            level: method.toUpperCase(),
            message: 'A log item with a string as first parameter, and a string as second parameter',
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
            extra: 'parameter',
          }));
          expect(consoleSpy).toHaveBeenNthCalledWith(8, JSON.stringify({
            level: method.toUpperCase(),
            message: 'A log item with a string as first parameter, and an inline object as second parameter',
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
            extra: { custom: '2016-06-20T12:08:10.000Z' }
          }));
          const parameterCallNumber9 = JSON.parse(consoleSpy.mock.calls[8][0]);
          expect(parameterCallNumber9).toEqual(expect.objectContaining({
            level: method.toUpperCase(),
            message: 'A log item with a string as first parameter, and an arbitrary object as second parameter',
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
            extra: {
              value: 'CUSTOM',
              nested: {
                bool: true,
                str: 'string value',
                num: 42,
                err: {
                  location: expect.stringMatching(/Logger.test.ts:[0-9]+$/),
                  message: 'Arbitrary object error',
                  name: 'Error',
                  stack: expect.stringMatching(/Logger.test.ts:[0-9]+:[0-9]+/),
                }
              }
            }
          }));
        });
      });

      describe('Feature: persistent log attributes', () => {

        const methodOfLogger = method as keyof ClassThatLogs;

        test('when persistent log attributes are added to the Logger instance, they should appear in all logs printed by the instance', () => {

          // Prepare
          const logger: Logger = createLogger({
            logLevel: 'DEBUG',
            persistentLogAttributes: {
              aws_account_id: '123456789012',
              aws_region: 'eu-west-1',
            },
          });
          const consoleSpy = jest.spyOn(logger['console'], methodOfLogger).mockImplementation();

          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(consoleSpy).toBeCalledTimes(1);
          expect(consoleSpy).toHaveBeenNthCalledWith(1, JSON.stringify({
            level: method.toUpperCase(),
            message: 'foo',
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
            aws_account_id: '123456789012',
            aws_region: 'eu-west-1',
          }));
        });

      });

      describe('Feature: X-Ray Trace ID injection', () => {

        const methodOfLogger = method as keyof ClassThatLogs;

        test('when the `_X_AMZN_TRACE_ID` environment variable is set it parses it correctly and adds the Trace ID to the log', () => {

          // Prepare
          const logger: Logger = createLogger({
            logLevel: 'DEBUG',
          });
          const consoleSpy = jest.spyOn(logger['console'], methodOfLogger).mockImplementation();

          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(consoleSpy).toBeCalledTimes(1);
          expect(consoleSpy).toHaveBeenNthCalledWith(1, JSON.stringify({
            level: method.toUpperCase(),
            message: 'foo',
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
          }));
        });

        test('when the `_X_AMZN_TRACE_ID` environment variable is NOT set it parses it correctly and adds the Trace ID to the log', () => {

          // Prepare
          delete process.env._X_AMZN_TRACE_ID;
          const logger: Logger = createLogger({
            logLevel: 'DEBUG',
          });
          const consoleSpy = jest.spyOn(logger['console'], methodOfLogger).mockImplementation();

          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(consoleSpy).toBeCalledTimes(1);
          expect(consoleSpy).toHaveBeenNthCalledWith(1, JSON.stringify({
            level: method.toUpperCase(),
            message: 'foo',
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
          }));
        });

      });

      describe('Feature: handle safely unexpected errors', () => {

        const methodOfLogger = method as keyof ClassThatLogs;

        test('when a logged item references itself, the logger ignores the keys that cause a circular reference', () => {

          // Prepare
          const logger: Logger = createLogger({
            logLevel: 'DEBUG',
          });
          const consoleSpy = jest.spyOn(logger['console'], methodOfLogger).mockImplementation();
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
          expect(consoleSpy).toHaveBeenNthCalledWith(1, JSON.stringify({
            level: method.toUpperCase(),
            message: 'A log with a circular reference',
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
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
      logStreamName: '2021/03/09/[$LATEST]1-5759e988-bd862e3fe1be46a994272793',
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
        console: expect.any(Console),
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

    test('when called, it populates the logger\'s persistentLogAttributes property', () => {

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

  describe('Method: removeKeys', () => {

    test('when called, it removes keys from the logger\'s persistentLogAttributes property', () => {

      // Prepare
      const logger = new Logger();
      logger.appendKeys({
        aws_account_id: '123456789012',
        aws_region: 'eu-west-1',
        logger: {
          name: 'aws-lambda-powertool-typescript',
          version: '0.2.4',
        },
      });

      // Act
      logger.removeKeys([ 'aws_account_id', 'aws_region' ]);

      // Assess
      expect(logger).toEqual(expect.objectContaining({
        persistentLogAttributes: {
          logger: {
            name: 'aws-lambda-powertool-typescript',
            version: '0.2.4',
          },
        },
      }));
    });

    test('when called with non-existing keys, the logger\'s property persistentLogAttributes is not mutated and it does not throw an error', () => {

      // Prepare
      const logger = new Logger();
      logger.appendKeys({
        aws_account_id: '123456789012',
        aws_region: 'eu-west-1',
        logger: {
          name: 'aws-lambda-powertool-typescript',
          version: '0.2.4',
        },
      });
      const loggerBeforeKeysAreRemoved = { ...logger };

      // Act
      logger.removeKeys(['not_existing_key']);

      // Assess
      expect(logger).toEqual(loggerBeforeKeysAreRemoved);
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

  });

  test('when called multiple times with the same keys, the outcome is the same', () => {

    // Prepare
    const logger = new Logger();
    logger.appendKeys({
      aws_account_id: '123456789012',
      aws_region: 'eu-west-1',
      logger: {
        name: 'aws-lambda-powertool-typescript',
        version: '0.2.4',
      },
    });

    // Act
    logger.removeKeys([ 'aws_account_id', 'aws_region' ]);
    logger.removeKeys([ 'aws_account_id', 'aws_region' ]);

    // Assess
    expect(logger).toEqual(expect.objectContaining({
      persistentLogAttributes: {
        logger: {
          name: 'aws-lambda-powertool-typescript',
          version: '0.2.4',
        },
      },
    }));

  });

  describe('Method: injectLambdaContext', () => {

    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      jest.spyOn(console, 'log').mockImplementation(() => { });
    });

    test('when used as decorator, it returns a function with the correct scope of the decorated class', async () => {

      // Prepare
      const logger = new Logger();
      const consoleSpy = jest.spyOn(logger['console'], 'info').mockImplementation();
      class LambdaFunction implements LambdaInterface {

        @logger.injectLambdaContext()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
          this.myClassMethod();
        }

        private myClassMethod(): void {
          logger.info('This is an INFO log with some context');
        }

      }

      // Act
      await new LambdaFunction().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

      // Assess
      expect(consoleSpy).toBeCalledTimes(1);
      expect(consoleSpy).toHaveBeenNthCalledWith(1, JSON.stringify({
        cold_start: true,
        function_arn: 'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
        function_memory_size: 128,
        function_name: 'foo-bar-function',
        function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
        level: 'INFO',
        message: 'This is an INFO log with some context',
        service: 'hello-world',
        timestamp: '2016-06-20T12:08:10.000Z',
        xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
      }));

    });

    test('when used as decorator, it returns a function that captures Lambda\'s context information and adds it in the printed logs', async () => {

      // Prepare
      const logger = new Logger();
      const consoleSpy = jest.spyOn(logger['console'], 'info').mockImplementation();
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

      expect(consoleSpy).toBeCalledTimes(2);
      expect(consoleSpy).toHaveBeenNthCalledWith(1, JSON.stringify({
        level: 'INFO',
        message: 'An INFO log without context!',
        service: 'hello-world',
        timestamp: '2016-06-20T12:08:10.000Z',
        xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
      }));
      expect(consoleSpy).toHaveBeenNthCalledWith(2, JSON.stringify({
        cold_start: true,
        function_arn: 'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
        function_memory_size: 128,
        function_name: 'foo-bar-function',
        function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
        level: 'INFO',
        message: 'This is an INFO log with some context',
        service: 'hello-world',
        timestamp: '2016-06-20T12:08:10.000Z',
        xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
      }));

    });

    test('when used as decorator on an async handler without context, it returns a function that captures Lambda\'s context information and adds it in the printed logs', async () => {

      // Prepare
      const expectedReturnValue = 'Lambda invoked!';
      const logger = new Logger();
      const consoleSpy = jest.spyOn(logger['console'], 'info').mockImplementation();
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
      expect(consoleSpy).toBeCalledTimes(2);
      expect(consoleSpy).toHaveBeenNthCalledWith(1, JSON.stringify({
        level: 'INFO',
        message: 'An INFO log without context!',
        service: 'hello-world',
        timestamp: '2016-06-20T12:08:10.000Z',
        xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
      }));
      expect(consoleSpy).toHaveBeenNthCalledWith(2, JSON.stringify({
        cold_start: true,
        function_arn: 'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
        function_memory_size: 128,
        function_name: 'foo-bar-function',
        function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
        level: 'INFO',
        message: 'This is an INFO log with some context',
        service: 'hello-world',
        timestamp: '2016-06-20T12:08:10.000Z',
        xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
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
        console: expect.any(Console),
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
        },
      });

      expect(childLoggerWithPermanentAttributes).toEqual({
        console: expect.any(Console),
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
        },
      });

      expect(childLoggerWithSampleRateEnabled).toEqual({
        console: expect.any(Console),
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
        },
      });

      expect(childLoggerWithErrorLogLevel).toEqual({
        console: expect.any(Console),
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
        },
      });

    });

  });

});