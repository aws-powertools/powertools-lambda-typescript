/**
 * Test Logger class
 *
 * @group unit/logger/all
 */
import {
  ContextExamples as dummyContext,
  Events as dummyEvent,
  LambdaInterface,
} from '@aws-lambda-powertools/commons';
import { createLogger, Logger } from '../../src';
import { EnvironmentVariablesService } from '../../src/config';
import { PowertoolsLogFormatter } from '../../src/formatter';
import {
  ClassThatLogs,
  LogJsonIndent,
  ConstructorOptions,
  LogLevelThresholds,
  LogLevel,
} from '../../src/types';
import type { Context } from 'aws-lambda';
import { Console } from 'console';

const mockDate = new Date(1466424490000);
const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
const getConsoleMethod = (
  method: string
): keyof Omit<ClassThatLogs, 'critical'> =>
  method === 'critical'
    ? 'error'
    : (method.toLowerCase() as keyof Omit<ClassThatLogs, 'critical'>);

describe('Class: Logger', () => {
  const ENVIRONMENT_VARIABLES = process.env;
  const context = dummyContext.helloworldContext;
  const event = dummyEvent.Custom.CustomEvent;
  const logLevelThresholds: LogLevelThresholds = {
    DEBUG: 8,
    INFO: 12,
    WARN: 16,
    ERROR: 20,
    CRITICAL: 24,
    SILENT: 28,
  };

  beforeEach(() => {
    dateSpy.mockClear();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  describe.each([
    [
      'debug',
      'DOES',
      true,
      'DOES NOT',
      false,
      'DOES NOT',
      false,
      'DOES NOT',
      false,
    ],
    ['info', 'DOES', true, 'DOES', true, 'DOES NOT', false, 'DOES NOT', false],
    ['warn', 'DOES', true, 'DOES', true, 'DOES', true, 'DOES NOT', false],
    ['error', 'DOES', true, 'DOES', true, 'DOES', true, 'DOES', true],
    ['critical', 'DOES', true, 'DOES', true, 'DOES', true, 'DOES', true],
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
      errorPrints
    ) => {
      const methodOfLogger = method as keyof ClassThatLogs;

      describe('Feature: log level', () => {
        test(`when the level is DEBUG, it ${debugAction} print to stdout`, () => {
          // Prepare
          const logger: Logger = createLogger({
            logLevel: 'DEBUG',
          });
          const consoleSpy = jest
            .spyOn(logger['console'], getConsoleMethod(method))
            .mockImplementation();

          // Act
          logger[methodOfLogger]('foo');

          // Assess
          expect(consoleSpy).toBeCalledTimes(debugPrints ? 1 : 0);
          if (debugPrints) {
            expect(consoleSpy).toHaveBeenNthCalledWith(
              1,
              JSON.stringify({
                level: methodOfLogger.toUpperCase(),
                message: 'foo',
                service: 'hello-world',
                timestamp: '2016-06-20T12:08:10.000Z',
                xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              })
            );
          }
        });

        test(`when the log level is INFO, it ${infoAction} print to stdout`, () => {
          // Prepare
          const logger: Logger = createLogger({
            logLevel: 'INFO',
          });
          const consoleSpy = jest
            .spyOn(logger['console'], getConsoleMethod(methodOfLogger))
            .mockImplementation();

          // Act
          logger[methodOfLogger]('foo');

          // Assess
          expect(consoleSpy).toBeCalledTimes(infoPrints ? 1 : 0);
          if (infoPrints) {
            expect(consoleSpy).toHaveBeenNthCalledWith(
              1,
              JSON.stringify({
                level: methodOfLogger.toUpperCase(),
                message: 'foo',
                service: 'hello-world',
                timestamp: '2016-06-20T12:08:10.000Z',
                xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              })
            );
          }
        });

        test(`when the log level is WARN, it ${warnAction} print to stdout`, () => {
          // Prepare
          const logger: Logger = createLogger({
            logLevel: 'WARN',
          });
          const consoleSpy = jest
            .spyOn(logger['console'], getConsoleMethod(methodOfLogger))
            .mockImplementation();

          // Act
          logger[methodOfLogger]('foo');

          // Assess
          expect(consoleSpy).toBeCalledTimes(warnPrints ? 1 : 0);
          if (warnPrints) {
            expect(consoleSpy).toHaveBeenNthCalledWith(
              1,
              JSON.stringify({
                level: methodOfLogger.toUpperCase(),
                message: 'foo',
                service: 'hello-world',
                timestamp: '2016-06-20T12:08:10.000Z',
                xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              })
            );
          }
        });

        test(`when the log level is ERROR, it ${errorAction} print to stdout`, () => {
          // Prepare
          const logger: Logger = createLogger({
            logLevel: 'ERROR',
          });
          const consoleSpy = jest
            .spyOn(logger['console'], getConsoleMethod(methodOfLogger))
            .mockImplementation();

          // Act
          logger[methodOfLogger]('foo');

          // Assess
          expect(consoleSpy).toBeCalledTimes(errorPrints ? 1 : 0);
          if (errorPrints) {
            expect(consoleSpy).toHaveBeenNthCalledWith(
              1,
              JSON.stringify({
                level: methodOfLogger.toUpperCase(),
                message: 'foo',
                service: 'hello-world',
                timestamp: '2016-06-20T12:08:10.000Z',
                xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              })
            );
          }
        });

        test('when the log level is SILENT, it DOES NOT print to stdout', () => {
          // Prepare
          const logger: Logger = createLogger({
            logLevel: 'SILENT',
          });
          const consoleSpy = jest
            .spyOn(logger['console'], getConsoleMethod(methodOfLogger))
            .mockImplementation();

          // Act
          logger[methodOfLogger]('foo');

          // Assess
          expect(consoleSpy).toBeCalledTimes(0);
        });

        test('when the log level is set through LOG_LEVEL env variable, it DOES print to stdout', () => {
          // Prepare
          process.env.LOG_LEVEL = methodOfLogger.toUpperCase();
          const logger = new Logger();
          const consoleSpy = jest
            .spyOn(logger['console'], getConsoleMethod(methodOfLogger))
            .mockImplementation();

          // Act
          logger[methodOfLogger]('foo');

          // Assess
          expect(consoleSpy).toBeCalledTimes(1);
          expect(consoleSpy).toHaveBeenNthCalledWith(
            1,
            JSON.stringify({
              level: methodOfLogger.toUpperCase(),
              message: 'foo',
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
            })
          );
        });
      });

      describe('Feature: sample rate', () => {
        test('when the log level is higher and the current Lambda invocation IS NOT sampled for logging, it DOES NOT print to stdout', () => {
          // Prepare
          const logger: Logger = createLogger({
            logLevel: 'SILENT',
            sampleRateValue: 0,
          });
          const consoleSpy = jest
            .spyOn(logger['console'], getConsoleMethod(methodOfLogger))
            .mockImplementation();

          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(consoleSpy).toBeCalledTimes(0);
        });

        test('when the log level is higher and the current Lambda invocation IS sampled for logging, it DOES print to stdout', () => {
          // Prepare
          const logger: Logger = createLogger({
            logLevel: 'SILENT',
            sampleRateValue: 1,
          });
          const consoleSpy = jest
            .spyOn(logger['console'], getConsoleMethod(methodOfLogger))
            .mockImplementation();

          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(consoleSpy).toBeCalledTimes(1);
          expect(consoleSpy).toHaveBeenNthCalledWith(
            1,
            JSON.stringify({
              level: method.toUpperCase(),
              message: 'foo',
              sampling_rate: 1,
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
            })
          );
        });
      });

      describe('Feature: inject context', () => {
        test(
          'when the Lambda context is not captured and a string is passed as log message, it should print a valid ' +
            method.toUpperCase() +
            ' log',
          () => {
            // Prepare
            const logger: Logger = createLogger();
            const consoleSpy = jest
              .spyOn(logger['console'], getConsoleMethod(methodOfLogger))
              .mockImplementation();

            // Act
            if (logger[methodOfLogger]) {
              logger[methodOfLogger]('foo');
            }

            // Assess
            expect(consoleSpy).toBeCalledTimes(1);
            expect(consoleSpy).toHaveBeenNthCalledWith(
              1,
              JSON.stringify({
                level: method.toUpperCase(),
                message: 'foo',
                service: 'hello-world',
                timestamp: '2016-06-20T12:08:10.000Z',
                xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              })
            );
          }
        );

        test(
          'when the Lambda context is captured, it returns a valid ' +
            method.toUpperCase() +
            ' log',
          () => {
            // Prepare
            const logger: Logger & { addContext: (context: Context) => void } =
              createLogger({
                logLevel: 'DEBUG',
              });
            logger.addContext(context);
            const consoleSpy = jest
              .spyOn(logger['console'], getConsoleMethod(methodOfLogger))
              .mockImplementation();

            // Act
            if (logger[methodOfLogger]) {
              logger[methodOfLogger]('foo');
            }

            // Assess
            expect(consoleSpy).toBeCalledTimes(1);
            expect(consoleSpy).toHaveBeenNthCalledWith(
              1,
              JSON.stringify({
                cold_start: true,
                function_arn:
                  'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
                function_memory_size: 128,
                function_name: 'foo-bar-function',
                function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
                level: method.toUpperCase(),
                message: 'foo',
                service: 'hello-world',
                timestamp: '2016-06-20T12:08:10.000Z',
                xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              })
            );
          }
        );
      });

      describe('Feature: ephemeral log attributes', () => {
        test('when added, they should appear in that log item only', () => {
          // Prepare
          const logger: Logger = createLogger({
            logLevel: 'DEBUG',
          });
          const consoleSpy = jest
            .spyOn(logger['console'], getConsoleMethod(methodOfLogger))
            .mockImplementation();

          interface NestedObject {
            bool: boolean;
            str: string;
            num: number;
            err: Error;
          }
          interface ArbitraryObject<TNested> {
            value: 'CUSTOM' | 'USER_DEFINED';
            nested: TNested;
          }

          const arbitraryObject: ArbitraryObject<NestedObject> = {
            value: 'CUSTOM',
            nested: {
              bool: true,
              str: 'string value',
              num: 42,
              err: new Error('Arbitrary object error'),
            },
          };

          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('A log item without extra parameters');
            logger[methodOfLogger](
              'A log item with a string as first parameter, and an object as second parameter',
              { extra: 'parameter' }
            );
            logger[methodOfLogger](
              'A log item with a string as first parameter, and objects as other parameters',
              { parameterOne: 'foo' },
              { parameterTwo: 'bar' }
            );
            logger[methodOfLogger]({
              message: 'A log item with an object as first parameters',
              extra: 'parameter',
            });
            logger[methodOfLogger](
              'A log item with a string as first parameter, and an error as second parameter',
              new Error('Something happened!')
            );
            logger[methodOfLogger](
              'A log item with a string as first parameter, and an error with custom key as second parameter',
              { myCustomErrorKey: new Error('Something happened!') }
            );
            logger[methodOfLogger](
              'A log item with a string as first parameter, and a string as second parameter',
              'parameter'
            );
            logger[methodOfLogger](
              'A log item with a string as first parameter, and an inline object as second parameter',
              { extra: { custom: mockDate } }
            );
            logger[methodOfLogger](
              'A log item with a string as first parameter, and an arbitrary object as second parameter',
              { extra: arbitraryObject }
            );
          }

          // Assess
          expect(consoleSpy).toHaveBeenNthCalledWith(
            1,
            JSON.stringify({
              level: method.toUpperCase(),
              message: 'A log item without extra parameters',
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
            })
          );
          expect(consoleSpy).toHaveBeenNthCalledWith(
            2,
            JSON.stringify({
              level: method.toUpperCase(),
              message:
                'A log item with a string as first parameter, and an object as second parameter',
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              extra: 'parameter',
            })
          );
          expect(consoleSpy).toHaveBeenNthCalledWith(
            3,
            JSON.stringify({
              level: method.toUpperCase(),
              message:
                'A log item with a string as first parameter, and objects as other parameters',
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              parameterOne: 'foo',
              parameterTwo: 'bar',
            })
          );
          expect(consoleSpy).toHaveBeenNthCalledWith(
            4,
            JSON.stringify({
              level: method.toUpperCase(),
              message: 'A log item with an object as first parameters',
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              extra: 'parameter',
            })
          );
          const parameterCallNumber5 = JSON.parse(consoleSpy.mock.calls[4][0]);
          expect(parameterCallNumber5).toEqual(
            expect.objectContaining({
              level: method.toUpperCase(),
              message:
                'A log item with a string as first parameter, and an error as second parameter',
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              error: {
                location: expect.stringMatching(/Logger.test.ts:[0-9]+$/),
                message: 'Something happened!',
                name: 'Error',
                stack: expect.stringMatching(/Logger.test.ts:[0-9]+:[0-9]+/),
              },
            })
          );
          const parameterCallNumber6 = JSON.parse(
            consoleSpy.mock.calls[5][0] as string
          );
          expect(parameterCallNumber6).toEqual(
            expect.objectContaining({
              level: method.toUpperCase(),
              message:
                'A log item with a string as first parameter, and an error with custom key as second parameter',
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              myCustomErrorKey: {
                location: expect.stringMatching(/Logger.test.ts:[0-9]+$/),
                message: 'Something happened!',
                name: 'Error',
                stack: expect.stringMatching(/Logger.test.ts:[0-9]+:[0-9]+/),
              },
            })
          );
          expect(consoleSpy).toHaveBeenNthCalledWith(
            7,
            JSON.stringify({
              level: method.toUpperCase(),
              message:
                'A log item with a string as first parameter, and a string as second parameter',
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              extra: 'parameter',
            })
          );
          expect(consoleSpy).toHaveBeenNthCalledWith(
            8,
            JSON.stringify({
              level: method.toUpperCase(),
              message:
                'A log item with a string as first parameter, and an inline object as second parameter',
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              extra: { custom: '2016-06-20T12:08:10.000Z' },
            })
          );
          const parameterCallNumber9 = JSON.parse(consoleSpy.mock.calls[8][0]);
          expect(parameterCallNumber9).toEqual(
            expect.objectContaining({
              level: method.toUpperCase(),
              message:
                'A log item with a string as first parameter, and an arbitrary object as second parameter',
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
                    stack: expect.stringMatching(
                      /Logger.test.ts:[0-9]+:[0-9]+/
                    ),
                  },
                },
              },
            })
          );
        });
      });

      describe('Feature: persistent log attributes', () => {
        test('when persistent log attributes are added to the Logger instance, they should appear in all logs printed by the instance', () => {
          // Prepare
          const logger: Logger = createLogger({
            logLevel: 'DEBUG',
            persistentLogAttributes: {
              aws_account_id: '123456789012',
              aws_region: 'eu-west-1',
            },
          });
          const consoleSpy = jest
            .spyOn(logger['console'], getConsoleMethod(methodOfLogger))
            .mockImplementation();

          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(consoleSpy).toBeCalledTimes(1);
          expect(consoleSpy).toHaveBeenNthCalledWith(
            1,
            JSON.stringify({
              level: method.toUpperCase(),
              message: 'foo',
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              aws_account_id: '123456789012',
              aws_region: 'eu-west-1',
            })
          );
        });
      });

      describe('Feature: X-Ray Trace ID injection', () => {
        test('when the `_X_AMZN_TRACE_ID` environment variable is set it parses it correctly and adds the Trace ID to the log', () => {
          // Prepare
          const logger: Logger = createLogger({
            logLevel: 'DEBUG',
          });
          const consoleSpy = jest
            .spyOn(logger['console'], getConsoleMethod(methodOfLogger))
            .mockImplementation();

          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(consoleSpy).toBeCalledTimes(1);
          expect(consoleSpy).toHaveBeenNthCalledWith(
            1,
            JSON.stringify({
              level: method.toUpperCase(),
              message: 'foo',
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
            })
          );
        });

        test('when the `_X_AMZN_TRACE_ID` environment variable is NOT set it parses it correctly and adds the Trace ID to the log', () => {
          // Prepare
          delete process.env._X_AMZN_TRACE_ID;
          const logger: Logger = createLogger({
            logLevel: 'DEBUG',
          });
          const consoleSpy = jest
            .spyOn(logger['console'], getConsoleMethod(methodOfLogger))
            .mockImplementation();

          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(consoleSpy).toBeCalledTimes(1);
          expect(consoleSpy).toHaveBeenNthCalledWith(
            1,
            JSON.stringify({
              level: method.toUpperCase(),
              message: 'foo',
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
            })
          );
        });
      });

      describe('Feature: handle safely unexpected errors', () => {
        test('when a logged item references itself, the logger ignores the keys that cause a circular reference', () => {
          // Prepare
          const logger: Logger = createLogger({
            logLevel: 'DEBUG',
          });
          const consoleSpy = jest
            .spyOn(logger['console'], getConsoleMethod(methodOfLogger))
            .mockImplementation();
          const circularObject = {
            foo: 'bar',
            self: {},
          };
          circularObject.self = circularObject;
          const logCircularReference = (): string => {
            if (logger[methodOfLogger]) {
              logger[methodOfLogger]('A log with a circular reference', {
                details: circularObject,
              });
            }

            return 'All good!';
          };

          // Act
          const result = logCircularReference();

          // Assess
          expect(result).toBe('All good!');
          expect(consoleSpy).toHaveBeenNthCalledWith(
            1,
            JSON.stringify({
              level: method.toUpperCase(),
              message: 'A log with a circular reference',
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              details: {
                foo: 'bar',
              },
            })
          );
        });

        test('when a logged item has BigInt value, it does not throw TypeError', () => {
          // Prepare
          const logger = new Logger();
          jest
            .spyOn(logger['console'], getConsoleMethod(methodOfLogger))
            .mockImplementation();
          const message = `This is an ${methodOfLogger} log with BigInt value`;
          const logItem = { value: BigInt(42) };
          const errorMessage = 'Do not know how to serialize a BigInt';

          // Act & Assess
          expect(() => {
            logger[methodOfLogger](message, logItem);
          }).not.toThrow(errorMessage);
        });

        test('when a logged item has a BigInt value, it prints the log with value as a string', () => {
          // Prepare
          const logger = new Logger();
          const consoleSpy = jest
            .spyOn(logger['console'], getConsoleMethod(methodOfLogger))
            .mockImplementation();
          const message = `This is an ${methodOfLogger} log with BigInt value`;
          const logItem = { value: BigInt(42) };

          // Act
          logger[methodOfLogger](message, logItem);

          // Assess
          expect(consoleSpy).toBeCalledTimes(1);
          expect(consoleSpy).toHaveBeenNthCalledWith(
            1,
            JSON.stringify({
              level: methodOfLogger.toUpperCase(),
              message: message,
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              value: '42',
            })
          );
        });

        test('when a logged item has empty string, null, or undefined values, it removes it', () => {
          // Prepare
          const logger = new Logger();
          const consoleSpy = jest
            .spyOn(logger['console'], getConsoleMethod(methodOfLogger))
            .mockImplementation();
          const message = `This is an ${methodOfLogger} log with empty, null, and undefined values`;
          const logItem = {
            value: 42,
            emptyValue: '',
            undefinedValue: undefined,
            nullValue: null,
          };

          // Act
          logger[methodOfLogger](message, logItem);

          // Assess
          expect(consoleSpy).toBeCalledTimes(1);
          expect(consoleSpy).toHaveBeenNthCalledWith(
            1,
            JSON.stringify({
              level: methodOfLogger.toUpperCase(),
              message: message,
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              value: 42,
            })
          );
        });
      });
    }
  );

  describe('Method: addContext', () => {
    test('when called during a cold start invocation, it populates the logger PowertoolLogData object with coldStart set to TRUE', () => {
      // Prepare
      const logger = new Logger();

      // Act
      logger.addContext(context);

      // Assess
      expect(logger).toEqual({
        console: expect.any(Console),
        coldStart: false, // This is now false because the `coldStart` attribute has been already accessed once by the `addContext` method
        customConfigService: undefined,
        defaultServiceName: 'service_undefined',
        envVarsService: expect.any(EnvironmentVariablesService),
        logEvent: false,
        logIndentation: 0,
        logFormatter: expect.any(PowertoolsLogFormatter),
        logLevel: 8,
        logLevelThresholds: {
          ...logLevelThresholds,
        },
        logsSampled: false,
        persistentLogAttributes: {},
        powertoolLogData: {
          awsRegion: 'eu-west-1',
          environment: '',
          lambdaContext: {
            awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
            coldStart: true,
            functionName: 'foo-bar-function',
            functionVersion: '$LATEST',
            invokedFunctionArn:
              'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
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
      const context1 = {
        ...context,
        awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
      };
      const context2 = {
        ...context,
        awsRequestId: 'd40c98a9-91c4-478c-a179-433c4b978289',
      };

      // Act
      logger.addContext(context1);
      logger.addContext(context2);

      // Assess
      expect(context1.awsRequestId).toEqual(
        'c6af9ac6-7b61-11e6-9a41-93e812345678'
      );
      expect(context2.awsRequestId).toEqual(
        'd40c98a9-91c4-478c-a179-433c4b978289'
      );
    });

    test('when called multiple times, the newer values override earlier values', () => {
      // Prepare
      const logger = new Logger();
      const context1 = {
        ...context,
        awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
      };
      const context2 = {
        ...context,
        awsRequestId: 'd40c98a9-91c4-478c-a179-433c4b978289',
      };

      // Act
      logger.addContext(context1);
      logger.addContext(context2);

      // Assess
      expect(logger).toEqual(
        expect.objectContaining({
          powertoolLogData: expect.objectContaining({
            lambdaContext: expect.objectContaining({
              awsRequestId: context2.awsRequestId,
            }),
          }),
        })
      );
    });
  });

  describe('Method: appendKeys', () => {
    test('when called, it populates the logger persistentLogAttributes property', () => {
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
      expect(logger).toEqual(
        expect.objectContaining({
          persistentLogAttributes: {
            aws_account_id: '123456789012',
            aws_region: 'eu-west-1',
            logger: {
              name: 'aws-lambda-powertool-typescript',
              version: '0.2.4',
            },
          },
        })
      );
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
        duplicateKey: 'one',
      });
      logger.appendKeys({
        duplicateKey: 'two',
      });

      // Assess
      expect(logger).toEqual(
        expect.objectContaining({
          persistentLogAttributes: {
            duplicateKey: 'two',
          },
        })
      );
    });
  });

  describe('Method: removeKeys', () => {
    test('when called, it removes keys from the logger persistentLogAttributes property', () => {
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
      logger.removeKeys(['aws_account_id', 'aws_region']);

      // Assess
      expect(logger).toEqual(
        expect.objectContaining({
          persistentLogAttributes: {
            logger: {
              name: 'aws-lambda-powertool-typescript',
              version: '0.2.4',
            },
          },
        })
      );
    });

    test('when called with non-existing keys, the logger property persistentLogAttributes is not mutated and it does not throw an error', () => {
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
      expect(logger).toEqual(
        expect.objectContaining({
          persistentLogAttributes: {
            aws_account_id: '123456789012',
            aws_region: 'eu-west-1',
            logger: {
              name: 'aws-lambda-powertool-typescript',
              version: '0.2.4',
            },
          },
        })
      );
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
      logger.removeKeys(['aws_account_id', 'aws_region']);
      logger.removeKeys(['aws_account_id', 'aws_region']);

      // Assess
      expect(logger).toEqual(
        expect.objectContaining({
          persistentLogAttributes: {
            logger: {
              name: 'aws-lambda-powertool-typescript',
              version: '0.2.4',
            },
          },
        })
      );
    });
  });

  describe('Method: injectLambdaContext', () => {
    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation(() => ({}));
    });

    test('it returns a decorated method with the correct scope of the decorated class', async () => {
      // Prepare

      const logger = new Logger();
      const consoleSpy = jest
        .spyOn(logger['console'], 'info')
        .mockImplementation();
      class LambdaFunction implements LambdaInterface {
        @logger.injectLambdaContext()
        public async handler<TEvent>(
          _event: TEvent,
          _context: Context
        ): Promise<void> {
          this.myClassMethod();
        }

        private myClassMethod(): void {
          logger.info('This is an INFO log with some context');
        }
      }
      const handlerClass = new LambdaFunction();
      const handler = handlerClass.handler.bind(handlerClass);

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
          function_memory_size: 128,
          function_name: 'foo-bar-function',
          function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
          level: 'INFO',
          message: 'This is an INFO log with some context',
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        })
      );
    });

    test('it captures Lambda context information and adds it in the printed logs', async () => {
      // Prepare
      const logger = new Logger();
      const consoleSpy = jest
        .spyOn(logger['console'], 'info')
        .mockImplementation();
      class LambdaFunction implements LambdaInterface {
        @logger.injectLambdaContext()
        public async handler<TEvent>(
          _event: TEvent,
          _context: Context
        ): Promise<void> {
          logger.info('This is an INFO log with some context');
        }
      }
      const handlerClass = new LambdaFunction();
      const handler = handlerClass.handler.bind(handlerClass);

      // Act
      logger.info('An INFO log without context!');
      await handler(event, context);

      // Assess

      expect(consoleSpy).toBeCalledTimes(2);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        JSON.stringify({
          level: 'INFO',
          message: 'An INFO log without context!',
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        })
      );
      expect(consoleSpy).toHaveBeenNthCalledWith(
        2,
        JSON.stringify({
          cold_start: true,
          function_arn:
            'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
          function_memory_size: 128,
          function_name: 'foo-bar-function',
          function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
          level: 'INFO',
          message: 'This is an INFO log with some context',
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        })
      );
    });

    test('it captures Lambda context information and adds it in the printed logs for async methods', async () => {
      // Prepare
      const expectedReturnValue = 'Lambda invoked!';
      const logger = new Logger();
      const consoleSpy = jest
        .spyOn(logger['console'], 'info')
        .mockImplementation();
      class LambdaFunction implements LambdaInterface {
        @logger.injectLambdaContext()
        public async handler<TEvent>(
          _event: TEvent,
          _context: Context
        ): Promise<string> {
          logger.info('This is an INFO log with some context');

          return expectedReturnValue;
        }
      }
      const handlerClass = new LambdaFunction();
      const handler = handlerClass.handler.bind(handlerClass);

      // Act
      logger.info('An INFO log without context!');
      const actualResult = await handler(event, context);

      // Assess

      expect(actualResult).toEqual(expectedReturnValue);
      expect(consoleSpy).toBeCalledTimes(2);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        JSON.stringify({
          level: 'INFO',
          message: 'An INFO log without context!',
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        })
      );
      expect(consoleSpy).toHaveBeenNthCalledWith(
        2,
        JSON.stringify({
          cold_start: true,
          function_arn:
            'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
          function_memory_size: 128,
          function_name: 'foo-bar-function',
          function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
          level: 'INFO',
          message: 'This is an INFO log with some context',
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        })
      );
    });

    test('when clearState is enabled, the persistent log attributes added in the handler are cleared when the method returns', async () => {
      // Prepare
      const logger = new Logger({
        logLevel: 'DEBUG',
        persistentLogAttributes: {
          foo: 'bar',
          biz: 'baz',
        },
      });
      jest.spyOn(logger['console'], 'debug').mockImplementation();
      class LambdaFunction implements LambdaInterface {
        @logger.injectLambdaContext({ clearState: true })
        public async handler<TEvent>(
          _event: TEvent,
          _context: Context
        ): Promise<void> {
          // Only add these persistent for the scope of this lambda handler
          logger.appendKeys({
            details: { user_id: '1234' },
          });
          logger.debug('This is a DEBUG log with the user_id');
          logger.debug('This is another DEBUG log with the user_id');
        }
      }
      const handlerClass = new LambdaFunction();
      const handler = handlerClass.handler.bind(handlerClass);
      const persistentAttribsBeforeInvocation = {
        ...logger.getPersistentLogAttributes(),
      };

      // Act
      await handler(event, context);
      const persistentAttribsAfterInvocation = {
        ...logger.getPersistentLogAttributes(),
      };

      // Assess
      expect(persistentAttribsBeforeInvocation).toEqual({
        foo: 'bar',
        biz: 'baz',
      });
      expect(persistentAttribsAfterInvocation).toEqual(
        persistentAttribsBeforeInvocation
      );
    });

    test('when clearState is enabled, the persistent log attributes added in the handler are cleared when the method throws', async () => {
      // Prepare
      const logger = new Logger({
        logLevel: 'DEBUG',
        persistentLogAttributes: {
          foo: 'bar',
          biz: 'baz',
        },
      });
      jest.spyOn(logger['console'], 'debug').mockImplementation();
      class LambdaFunction implements LambdaInterface {
        @logger.injectLambdaContext({ clearState: true })
        public async handler<TEvent>(
          _event: TEvent,
          _context: Context
        ): Promise<string> {
          // Only add these persistent for the scope of this lambda handler
          logger.appendKeys({
            details: { user_id: '1234' },
          });
          logger.debug('This is a DEBUG log with the user_id');
          logger.debug('This is another DEBUG log with the user_id');

          throw new Error('Unexpected error occurred!');
        }
      }
      const handlerClass = new LambdaFunction();
      const handler = handlerClass.handler.bind(handlerClass);
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
      expect(persistentAttribsAfterInvocation).toEqual(
        persistentAttribsBeforeInvocation
      );
    });

    test('when logEvent is enabled, it logs the event in the first log', async () => {
      // Prepare
      const logger = new Logger({
        logLevel: 'DEBUG',
      });
      const consoleSpy = jest
        .spyOn(logger['console'], 'info')
        .mockImplementation();
      class LambdaFunction implements LambdaInterface {
        @logger.injectLambdaContext({ logEvent: true })
        public async handler<TEvent>(
          _event: TEvent,
          _context: Context
        ): Promise<void> {
          return;
        }
      }
      const handlerClass = new LambdaFunction();
      const handler = handlerClass.handler.bind(handlerClass);

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
          function_memory_size: 128,
          function_name: 'foo-bar-function',
          function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
          level: 'INFO',
          message: 'Lambda invocation event',
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
          event: {
            key1: 'value1',
            key2: 'value2',
            key3: 'value3',
          },
        })
      );
    });

    test('when logEvent is enabled via POWERTOOLS_LOGGER_LOG_EVENT env var, it logs the event', async () => {
      // Prepare
      process.env.POWERTOOLS_LOGGER_LOG_EVENT = 'true';
      const logger = new Logger({
        logLevel: 'DEBUG',
      });
      const consoleSpy = jest
        .spyOn(logger['console'], 'info')
        .mockImplementation();

      class LambdaFunction implements LambdaInterface {
        @logger.injectLambdaContext()
        public async handler<TEvent>(
          _event: TEvent,
          _context: Context
        ): Promise<void> {
          return;
        }
      }
      const handlerClass = new LambdaFunction();
      const handler = handlerClass.handler.bind(handlerClass);

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
          function_memory_size: 128,
          function_name: 'foo-bar-function',
          function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
          level: 'INFO',
          message: 'Lambda invocation event',
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
          event: {
            key1: 'value1',
            key2: 'value2',
            key3: 'value3',
          },
        })
      );
    });

    test('it preserves the value of `this` of the decorated method/class', async () => {
      // Prepare
      const logger = new Logger({
        logLevel: 'DEBUG',
      });
      const consoleSpy = jest
        .spyOn(logger['console'], 'info')
        .mockImplementation();

      class LambdaFunction implements LambdaInterface {
        private readonly memberVariable: string;

        public constructor(memberVariable: string) {
          this.memberVariable = memberVariable;
        }

        @logger.injectLambdaContext()
        public async handler<TEvent>(
          _event: TEvent,
          _context: Context
        ): Promise<void> {
          this.dummyMethod();

          return;
        }

        private dummyMethod(): void {
          logger.info({ message: `memberVariable:${this.memberVariable}` });
        }
      }
      const lambda = new LambdaFunction('someValue');
      const handler = lambda.handler.bind(lambda);

      // Act
      await handler({}, context);

      // Assess
      expect(consoleSpy).toBeCalledTimes(1);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        JSON.stringify({
          cold_start: true,
          function_arn:
            'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
          function_memory_size: 128,
          function_name: 'foo-bar-function',
          function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
          level: 'INFO',
          message: 'memberVariable:someValue',
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        })
      );
    });

    test('it awaits the decorated method correctly', async () => {
      // Prepare
      const injectLambdaContextAfterOrOnErrorSpy = jest.spyOn(
        Logger,
        'injectLambdaContextAfterOrOnError'
      );
      const logger = new Logger({
        logLevel: 'DEBUG',
      });
      const consoleSpy = jest
        .spyOn(logger['console'], 'info')
        .mockImplementation();
      class LambdaFunction implements LambdaInterface {
        @logger.injectLambdaContext()
        public async handler(
          _event: unknown,
          _context: unknown
        ): Promise<unknown> {
          await this.dummyMethod();
          logger.info('This is a DEBUG log');

          return;
        }

        private async dummyMethod(): Promise<void> {
          return;
        }
      }
      const lambda = new LambdaFunction();
      const handler = lambda.handler.bind(lambda);

      // Act
      await handler({}, context);

      // Assess
      expect(consoleSpy).toBeCalledTimes(1);
      // Here we assert that the logger.info method is called before the cleanup function that should always
      // be called ONLY after the handler has returned. If logger.info is called after the cleanup function
      // it means the decorator is NOT awaiting the handler which would cause the test to fail.
      expect(consoleSpy.mock.invocationCallOrder[0]).toBeLessThan(
        injectLambdaContextAfterOrOnErrorSpy.mock.invocationCallOrder[0]
      );
    });

    test('when logEvent and clearState are both TRUE, and the logger has persistent attributes, any key added in the handler is cleared properly', async () => {
      // Prepare
      const logger = new Logger({
        persistentLogAttributes: {
          version: '1.0.0',
        },
      });
      const consoleSpy = jest
        .spyOn(logger['console'], 'info')
        .mockImplementation();
      class LambdaFunction implements LambdaInterface {
        @logger.injectLambdaContext({ clearState: true, logEvent: true })
        public async handler(
          event: { foo: string },
          _context: unknown
        ): Promise<unknown> {
          logger.appendKeys({ foo: event.foo });

          return;
        }
      }
      const lambda = new LambdaFunction();
      const handler = lambda.handler.bind(lambda);

      // Act
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

  describe('Method: refreshSampleRateCalculation', () => {
    test('it recalculates whether the current Lambda invocation logs will be printed or not', () => {
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
    test('child and grandchild loggers should have all the options of its ancestor', () => {
      // Prepare
      const INDENTATION = LogJsonIndent.COMPACT;
      const loggerOptions = {
        serviceName: 'parent-service-name',
        sampleRateValue: 0,
      };
      const parentLogger = new Logger(loggerOptions);

      // Act
      const childLoggerOptions = { sampleRateValue: 1 };
      const childLogger = parentLogger.createChild(childLoggerOptions);

      const grandchildLoggerOptions = { serviceName: 'grandchild-logger-name' };
      const grandchildLogger = childLogger.createChild(grandchildLoggerOptions);

      // Assess
      expect(parentLogger === childLogger).toBe(false);
      expect(childLogger === grandchildLogger).toBe(false);
      expect(parentLogger === grandchildLogger).toBe(false);

      expect(parentLogger).toEqual({
        console: expect.any(Console),
        coldStart: true,
        customConfigService: undefined,
        defaultServiceName: 'service_undefined',
        envVarsService: expect.any(EnvironmentVariablesService),
        logEvent: false,
        logIndentation: INDENTATION,
        logFormatter: expect.any(PowertoolsLogFormatter),
        logLevel: 8,
        logLevelThresholds: {
          ...logLevelThresholds,
        },
        logsSampled: false,
        persistentLogAttributes: {},
        powertoolLogData: {
          awsRegion: 'eu-west-1',
          environment: '',
          sampleRateValue: undefined,
          serviceName: 'parent-service-name',
        },
      });

      expect(childLogger).toEqual({
        console: expect.any(Console),
        coldStart: true,
        customConfigService: undefined,
        defaultServiceName: 'service_undefined',
        envVarsService: expect.any(EnvironmentVariablesService),
        logEvent: false,
        logIndentation: INDENTATION,
        logFormatter: expect.any(PowertoolsLogFormatter),
        logLevel: 8,
        logLevelThresholds: {
          ...logLevelThresholds,
        },
        logsSampled: true,
        persistentLogAttributes: {},
        powertoolLogData: {
          awsRegion: 'eu-west-1',
          environment: '',
          sampleRateValue: 1,
          serviceName: 'parent-service-name',
        },
      });

      expect(grandchildLogger).toEqual({
        console: expect.any(Console),
        coldStart: true,
        customConfigService: undefined,
        defaultServiceName: 'service_undefined',
        envVarsService: expect.any(EnvironmentVariablesService),
        logEvent: false,
        logIndentation: INDENTATION,
        logFormatter: expect.any(PowertoolsLogFormatter),
        logLevel: 8,
        logLevelThresholds: {
          ...logLevelThresholds,
        },
        logsSampled: true,
        persistentLogAttributes: {},
        powertoolLogData: {
          awsRegion: 'eu-west-1',
          environment: '',
          sampleRateValue: 1,
          serviceName: 'grandchild-logger-name',
        },
      });
    });

    test('child logger should be a DISTINCT clone of the logger instance', () => {
      // Prepare
      const INDENTATION = LogJsonIndent.COMPACT;
      const parentLogger = new Logger();

      // Act
      const childLogger = parentLogger.createChild();

      const optionsWithPermanentAttributes = {
        persistentLogAttributes: {
          extra:
            'This is an attribute that will be logged only by the child logger',
        },
      };
      const childLoggerWithPermanentAttributes = parentLogger.createChild(
        optionsWithPermanentAttributes
      );

      const optionsWithSampleRateEnabled = {
        sampleRateValue: 1, // 100% probability to make sure that the logs are sampled
      };
      const childLoggerWithSampleRateEnabled = parentLogger.createChild(
        optionsWithSampleRateEnabled
      );

      const optionsWithErrorLogLevel: ConstructorOptions = {
        logLevel: 'ERROR',
      };
      const childLoggerWithErrorLogLevel = parentLogger.createChild(
        optionsWithErrorLogLevel
      );

      // Assess
      expect(parentLogger === childLogger).toBe(false);
      expect(childLogger).toEqual({
        ...parentLogger,
        console: expect.any(Console),
      });
      expect(parentLogger === childLoggerWithPermanentAttributes).toBe(false);
      expect(parentLogger === childLoggerWithSampleRateEnabled).toBe(false);
      expect(parentLogger === childLoggerWithErrorLogLevel).toBe(false);

      expect(parentLogger).toEqual({
        console: expect.any(Console),
        coldStart: true,
        customConfigService: undefined,
        defaultServiceName: 'service_undefined',
        envVarsService: expect.any(EnvironmentVariablesService),
        logEvent: false,
        logIndentation: INDENTATION,
        logFormatter: expect.any(PowertoolsLogFormatter),
        logLevel: 8,
        logLevelThresholds: {
          ...logLevelThresholds,
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
        defaultServiceName: 'service_undefined',
        envVarsService: expect.any(EnvironmentVariablesService),
        logEvent: false,
        logIndentation: INDENTATION,
        logFormatter: expect.any(PowertoolsLogFormatter),
        logLevel: 8,
        logLevelThresholds: {
          ...logLevelThresholds,
        },
        logsSampled: false,
        persistentLogAttributes: {
          extra:
            'This is an attribute that will be logged only by the child logger',
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
        defaultServiceName: 'service_undefined',
        envVarsService: expect.any(EnvironmentVariablesService),
        logEvent: false,
        logIndentation: INDENTATION,
        logFormatter: expect.any(PowertoolsLogFormatter),
        logLevel: 8,
        logLevelThresholds: {
          ...logLevelThresholds,
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
        defaultServiceName: 'service_undefined',
        envVarsService: expect.any(EnvironmentVariablesService),
        logEvent: false,
        logIndentation: INDENTATION,
        logFormatter: expect.any(PowertoolsLogFormatter),
        logLevel: 20,
        logLevelThresholds: {
          ...logLevelThresholds,
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

    test('child logger should have same keys in persistentLogAttributes as its parent', () => {
      // Prepare
      const INDENTATION = LogJsonIndent.COMPACT;
      const parentLogger = new Logger();
      const childLogger = parentLogger.createChild();

      // Act
      parentLogger.appendKeys({
        aws_account_id: '123456789012',
        aws_region: 'eu-west-1',
        logger: {
          name: 'aws-lambda-powertool-typescript',
          version: '0.2.4',
        },
        test_key: 'key-for-test',
      });
      const childLoggerWithKeys = parentLogger.createChild();
      childLoggerWithKeys.removeKeys(['test_key']);

      // Assess
      expect(childLogger).toEqual({
        console: expect.any(Console),
        coldStart: true,
        customConfigService: undefined,
        defaultServiceName: 'service_undefined',
        envVarsService: expect.any(EnvironmentVariablesService),
        logEvent: false,
        logIndentation: INDENTATION,
        logFormatter: expect.any(PowertoolsLogFormatter),
        logLevel: 8,
        logLevelThresholds: {
          ...logLevelThresholds,
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

      expect(childLoggerWithKeys).toEqual({
        console: expect.any(Console),
        coldStart: true,
        customConfigService: undefined,
        defaultServiceName: 'service_undefined',
        envVarsService: expect.any(EnvironmentVariablesService),
        logEvent: false,
        logIndentation: INDENTATION,
        logFormatter: expect.any(PowertoolsLogFormatter),
        logLevel: 8,
        logLevelThresholds: {
          ...logLevelThresholds,
        },
        logsSampled: false,
        persistentLogAttributes: {
          aws_account_id: '123456789012',
          aws_region: 'eu-west-1',
          logger: {
            name: 'aws-lambda-powertool-typescript',
            version: '0.2.4',
          },
        },
        powertoolLogData: {
          awsRegion: 'eu-west-1',
          environment: '',
          sampleRateValue: undefined,
          serviceName: 'hello-world',
        },
      });

      expect(parentLogger).toEqual({
        console: expect.any(Console),
        coldStart: true,
        customConfigService: undefined,
        defaultServiceName: 'service_undefined',
        envVarsService: expect.any(EnvironmentVariablesService),
        logEvent: false,
        logIndentation: INDENTATION,
        logFormatter: expect.any(PowertoolsLogFormatter),
        logLevel: 8,
        logLevelThresholds: {
          ...logLevelThresholds,
        },
        logsSampled: false,
        persistentLogAttributes: {
          aws_account_id: '123456789012',
          aws_region: 'eu-west-1',
          logger: {
            name: 'aws-lambda-powertool-typescript',
            version: '0.2.4',
          },
          test_key: 'key-for-test',
        },
        powertoolLogData: {
          awsRegion: 'eu-west-1',
          environment: '',
          sampleRateValue: undefined,
          serviceName: 'hello-world',
        },
      });
    });

    test('child logger should have same context as its parent', () => {
      // Prepare
      const parentLogger = new Logger();

      // Act
      parentLogger.addContext(context);
      const childLoggerWithContext = parentLogger.createChild();

      // Assess
      expect(childLoggerWithContext).toEqual({
        console: expect.any(Console),
        coldStart: false, // This is now false because the `coldStart` attribute has been already accessed once by the `addContext` method
        customConfigService: undefined,
        defaultServiceName: 'service_undefined',
        envVarsService: expect.any(EnvironmentVariablesService),
        logEvent: false,
        logIndentation: 0,
        logFormatter: expect.any(PowertoolsLogFormatter),
        logLevel: 8,
        logLevelThresholds: {
          ...logLevelThresholds,
        },
        logsSampled: false,
        persistentLogAttributes: {},
        powertoolLogData: {
          awsRegion: 'eu-west-1',
          environment: '',
          lambdaContext: {
            awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
            coldStart: true,
            functionName: 'foo-bar-function',
            functionVersion: '$LATEST',
            invokedFunctionArn:
              'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
            memoryLimitInMB: 128,
          },
          sampleRateValue: undefined,
          serviceName: 'hello-world',
        },
      });
    });

    test('child logger should have the same logFormatter as its parent', () => {
      // Prepare
      class MyCustomLogFormatter extends PowertoolsLogFormatter {}
      const parentLogger = new Logger({
        logFormatter: new MyCustomLogFormatter(),
      });

      // Act
      const childLoggerWithParentLogFormatter = parentLogger.createChild();

      // Assess
      expect(childLoggerWithParentLogFormatter).toEqual(
        expect.objectContaining({
          logFormatter: expect.any(MyCustomLogFormatter),
        })
      );
    });

    test('child logger with custom logFormatter in options should have provided logFormatter', () => {
      // Prepare
      class MyCustomLogFormatter extends PowertoolsLogFormatter {}
      const parentLogger = new Logger();

      // Act
      const childLoggerWithCustomLogFormatter = parentLogger.createChild({
        logFormatter: new MyCustomLogFormatter(),
      });

      // Assess
      expect(parentLogger).toEqual(
        expect.objectContaining({
          logFormatter: expect.any(PowertoolsLogFormatter),
        })
      );

      expect(childLoggerWithCustomLogFormatter).toEqual(
        expect.objectContaining({
          logFormatter: expect.any(MyCustomLogFormatter),
        })
      );
    });

    test('child logger should have exact same attributes as the parent logger created with all non-default options', () => {
      // Prepare
      class MyCustomLogFormatter extends PowertoolsLogFormatter {}
      class MyCustomEnvironmentVariablesService extends EnvironmentVariablesService {}

      const options: ConstructorOptions = {
        logLevel: 'ERROR',
        serviceName: 'test-service-name',
        sampleRateValue: 0.77,
        logFormatter: new MyCustomLogFormatter(),
        customConfigService: new MyCustomEnvironmentVariablesService(),
        persistentLogAttributes: {
          aws_account_id: '1234567890',
          aws_region: 'eu-west-1',
        },
        environment: 'local',
      };
      const parentLogger = new Logger(options);

      // Act
      const childLogger = parentLogger.createChild();

      // Assess
      expect(childLogger).toEqual({
        ...parentLogger,
        console: expect.any(Console),
        logsSampled: expect.any(Boolean),
      });

      expect(childLogger).toEqual(
        expect.objectContaining({
          logFormatter: expect.any(MyCustomLogFormatter),
        })
      );

      expect(childLogger).toEqual(
        expect.objectContaining({
          customConfigService: expect.any(MyCustomEnvironmentVariablesService),
        })
      );
    });
  });

  describe('Method: logEventIfEnabled', () => {
    test('When the feature is disabled, it DOES NOT log the event', () => {
      // Prepare
      const logger = new Logger();
      const consoleSpy = jest
        .spyOn(logger['console'], 'info')
        .mockImplementation();

      // Act
      logger.logEventIfEnabled(event);

      // Assess
      expect(consoleSpy).toBeCalledTimes(0);
    });

    test('When the feature is enabled via overwrite flag, it DOES log the event', () => {
      // Prepare
      const event = {
        something: 'happened!',
      };
      const logger = new Logger();
      const consoleSpy = jest
        .spyOn(logger['console'], 'info')
        .mockImplementation();

      // Act
      logger.logEventIfEnabled(event, true);

      // Assess
      expect(consoleSpy).toBeCalledTimes(1);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        JSON.stringify({
          level: 'INFO',
          message: 'Lambda invocation event',
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
          event: {
            something: 'happened!',
          },
        })
      );
    });
  });

  describe('Feature: Pretty indentation for a local or non-production environment', () => {
    test('when the `POWERTOOLS_DEV` env var is SET it makes log output has multiple lines', () => {
      // Prepare
      process.env.POWERTOOLS_DEV = 'true';
      const INDENTATION = LogJsonIndent.PRETTY;
      const logger = new Logger();
      const consoleSpy = jest
        .spyOn(logger['console'], 'info')
        .mockImplementation();

      // Act
      logger.info('Message with pretty identation');

      // Assess
      expect(consoleSpy).toBeCalledTimes(1);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        JSON.stringify(
          {
            level: 'INFO',
            message: 'Message with pretty identation',
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
          },
          null,
          INDENTATION
        )
      );
    });

    test('when the `POWERTOOLS_DEV` env var is NOT SET it makes log output as one-liner', () => {
      // Prepare
      const logger = new Logger();
      const consoleSpy = jest
        .spyOn(logger['console'], 'info')
        .mockImplementation();

      // Act
      logger.info('Message without pretty identation');

      // Assess
      expect(consoleSpy).toBeCalledTimes(1);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        JSON.stringify({
          level: 'INFO',
          message: 'Message without pretty identation',
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        })
      );
    });
  });

  describe('Method: setConsole()', () => {
    test('When the `POWERTOOLS_DEV` env var is SET console object is set to the global node console otherwise to the instance of the internal version of console', () => {
      // Prepare
      const logger = new Logger();
      process.env.POWERTOOLS_DEV = 'true';
      const devLogger = new Logger();

      // Assess
      expect(devLogger).toEqual({
        ...devLogger,
        console: console,
      });
      // since instances of a class are not equal objects,
      // we assert the opposite – console is not the global node object
      expect(logger).not.toEqual({
        ...logger,
        console: console,
      });
    });
  });

  describe('Method: setLogLevel', () => {
    test('it sets the correct log level provided', () => {
      // Prepare
      const logger = new Logger();

      // Act
      logger.setLogLevel('ERROR');

      // Assess
      expect(logger.level).toBe(20);
      expect(logger.getLevelName()).toBe('ERROR');
    });

    test('it throws when passed an invalid log level name', () => {
      // Prepare
      const logger = new Logger();

      // Act & Assess
      expect(() => logger.setLogLevel('INVALID' as LogLevel)).toThrow(
        'Invalid log level: INVALID'
      );
    });
  });
});
