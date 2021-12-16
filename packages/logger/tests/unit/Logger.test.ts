import { Callback, Context } from 'aws-lambda/handler';
import { context as dummyContext } from '../../../../tests/resources/contexts/hello-world';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as dummyEvent from '../../../../tests/resources/events/custom/hello-world.json';
import { LambdaInterface } from '../../examples/utils/lambda';
import { createLogger, Logger } from '../../src';
import { EnvironmentVariablesService } from '../../src/config';
import { PowertoolLogFormatter } from '../../src/formatter';
import { ClassThatLogs } from '../../src/types';

const mockDate = new Date(1466424490000);
const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string);

const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

describe('Class: Logger', () => {

  beforeEach(() => {
    Logger.coldStart = true;
    consoleSpy.mockClear();
    dateSpy.mockClear();
  });

  describe.each([
    ['debug', 'DOES', true, 'DOES NOT', false, 'DOES NOT', false, 'DOES NOT', false],
    ['info', 'DOES', true, 'DOES', true, 'DOES NOT', false, 'DOES NOT', false],
    ['warn', 'DOES', true, 'DOES', true, 'DOES', true, 'DOES NOT', false],
    ['error', 'DOES', true, 'DOES', true, 'DOES', true, 'DOES', true],
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

        test('when the Logger\'s log level is DEBUG, it '+ debugAction + ' prints to stdout', () => {

          // Prepare
          const logger: ClassThatLogs = createLogger({
            logLevel: 'DEBUG',
          });

          // Act
          if (logger[method as keyof ClassThatLogs]) {
            logger[method as keyof ClassThatLogs]('foo');
          }

          // Assess
          expect(console.log).toBeCalledTimes(debugPrints ? 1 : 0);
          if (debugPrints) {
            expect(console.log).toHaveBeenNthCalledWith(1, {
              message: 'foo',
              service: 'hello-world',
              level: method.toUpperCase(),
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
            });
          }

        });

        test('when the Logger\'s log level is INFO, it '+ infoAction + ' print to stdout', () => {

          // Prepare
          const logger: ClassThatLogs = createLogger({
            logLevel: 'INFO',
          });

          // Act
          if (logger[method as keyof ClassThatLogs]) {
            logger[method as keyof ClassThatLogs]('foo');
          }

          // Assess
          expect(console.log).toBeCalledTimes(infoPrints ? 1 : 0);
          if (infoPrints) {
            expect(console.log).toHaveBeenNthCalledWith(1, {
              message: 'foo',
              service: 'hello-world',
              level: method.toUpperCase(),
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
            });
          }

        });

        test('when the Logger\'s log level is WARN, it '+ warnAction + ' print to stdout', () => {

          // Prepare
          const logger: ClassThatLogs = createLogger({
            logLevel: 'WARN',
          });

          // Act
          if (logger[method as keyof ClassThatLogs]) {
            logger[method as keyof ClassThatLogs]('foo');
          }

          // Assess
          expect(console.log).toBeCalledTimes(warnPrints ? 1 : 0);
          if (warnPrints) {
            expect(console.log).toHaveBeenNthCalledWith(1, {
              message: 'foo',
              service: 'hello-world',
              level: method.toUpperCase(),
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
            });
          }

        });

        test('when the Logger\'s log level is ERROR, it '+ errorAction + ' print to stdout', () => {

          // Prepare
          const logger: ClassThatLogs = createLogger({
            logLevel: 'ERROR',
          });

          // Act
          if (logger[method as keyof ClassThatLogs]) {
            logger[method as keyof ClassThatLogs]('foo');
          }

          // Assess
          expect(console.log).toBeCalledTimes(errorPrints ? 1 : 0);
          if (errorPrints) {
            expect(console.log).toHaveBeenNthCalledWith(1, {
              message: 'foo',
              service: 'hello-world',
              level: method.toUpperCase(),
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
            });
          }

        });

      });

      describe('Feature: sample rate', () => {

        test('when the Logger\'s log level is higher and the current Lambda invocation IS NOT sampled for logging, it DOES NOT print to stdout', () => {

          // Prepare
          const logger: ClassThatLogs = createLogger({
            logLevel: 'ERROR',
            sampleRateValue: 0,
          });

          // Act
          if (logger[method as keyof ClassThatLogs]) {
            logger[method as keyof ClassThatLogs]('foo');
          }

          // Assess
          expect(console.log).toBeCalledTimes(method === 'error' ? 1 : 0);
        });

        test('when the Logger\'s log level is higher and the current Lambda invocation IS sampled for logging, it DOES print to stdout', () => {

          // Prepare
          const logger: ClassThatLogs = createLogger({
            logLevel: 'ERROR',
            sampleRateValue: 1,
          });

          // Act
          if (logger[method as keyof ClassThatLogs]) {
            logger[method as keyof ClassThatLogs]('foo');
          }

          // Assess
          expect(console.log).toBeCalledTimes(1);
          expect(console.log).toHaveBeenNthCalledWith(1, {
            message: 'foo',
            sampling_rate: 1,
            service: 'hello-world',
            level: method.toUpperCase(),
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
          });
        });

      });

      describe('Feature: capture Lambda context information and add it in the printed logs', () => {

        test('when the Lambda context is not captured and a string is passed as log message, it should print a valid '+ method.toUpperCase() + ' log', () => {

          // Prepare
          const logger: ClassThatLogs = createLogger();

          // Act
          if (logger[method as keyof ClassThatLogs]) {
            logger[method as keyof ClassThatLogs]('foo');
          }

          // Assess
          expect(console.log).toBeCalledTimes(1);
          expect(console.log).toHaveBeenNthCalledWith(1, {
            message: 'foo',
            service: 'hello-world',
            level: method.toUpperCase(),
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
          });
        });

        test('when the Lambda context is captured, it returns a valid '+ method.toUpperCase() + ' log', () => {

          // Prepare
          const logger: ClassThatLogs & { addContext: (context: Context) => void } = createLogger({
            logLevel: 'DEBUG',
          });
          logger.addContext(dummyContext);

          // Act
          if (logger[method as keyof ClassThatLogs]) {
            logger[method as keyof ClassThatLogs]('foo');
          }

          // Assess
          expect(console.log).toBeCalledTimes(1);
          expect(console.log).toHaveBeenNthCalledWith(1, {
            cold_start: true,
            function_arn: 'arn:aws:lambda:eu-central-1:123456789012:function:Example',
            function_memory_size: 128,
            function_name: 'foo-bar-function',
            function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
            level: method.toUpperCase(),
            message: 'foo',
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
          });

        });

      });

      describe('Feature: ephemeral log attributes', () => {

        test('when added, they should appear in that log item only', () => {

          // Prepare
          const logger: ClassThatLogs = createLogger({
            logLevel: 'DEBUG',
          });

          // Act
          if (logger[method as keyof ClassThatLogs]) {
            logger[method as keyof ClassThatLogs]('A log item without extra parameters');
            logger[method as keyof ClassThatLogs]('A log item with a string as first parameter, and an object as second parameter', { extra: 'parameter' });
            logger[method as keyof ClassThatLogs]('A log item with a string as first parameter, and objects as other parameters', { parameterOne: 'foo' }, { parameterTwo: 'bar' });
            logger[method as keyof ClassThatLogs]( { message: 'A log item with an object as first parameters', extra: 'parameter' });
            logger[method as keyof ClassThatLogs]('A log item with a string as first parameter, and an error as second parameter', new Error('Something happened!') );
            logger[method as keyof ClassThatLogs]('A log item with a string as first parameter, and an error with custom key as second parameter', { myCustomErrorKey: new Error('Something happened!') });
          }

          // Assess
          expect(console.log).toHaveBeenNthCalledWith(1, {
            message: 'A log item without extra parameters',
            service: 'hello-world',
            level: method.toUpperCase(),
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
          });
          expect(console.log).toHaveBeenNthCalledWith(2, {
            extra: 'parameter',
            message: 'A log item with a string as first parameter, and an object as second parameter',
            service: 'hello-world',
            level: method.toUpperCase(),
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
          });
          expect(console.log).toHaveBeenNthCalledWith(3, {
            message: 'A log item with a string as first parameter, and objects as other parameters',
            service: 'hello-world',
            level: method.toUpperCase(),
            parameterOne: 'foo',
            parameterTwo: 'bar',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
          });
          expect(console.log).toHaveBeenNthCalledWith(4, {
            extra: 'parameter',
            message: 'A log item with an object as first parameters',
            service: 'hello-world',
            level: method.toUpperCase(),
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
          });
          expect(console.log).toHaveBeenNthCalledWith(5, {
            error: {
              location: expect.stringMatching(/Logger.test.ts:[0-9]+$/),
              message: 'Something happened!',
              name: 'Error',
              stack: expect.stringMatching(/Logger.test.ts:[0-9]+:[0-9]+/),
            },
            level: method.toUpperCase(),
            message: 'A log item with a string as first parameter, and an error as second parameter',
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
          });
          expect(console.log).toHaveBeenNthCalledWith(6, {
            level: method.toUpperCase(),
            message: 'A log item with a string as first parameter, and an error with custom key as second parameter',
            myCustomErrorKey: {
              location: expect.stringMatching(/Logger.test.ts:[0-9]+$/),
              message: 'Something happened!',
              name: 'Error',
              stack: expect.stringMatching(/Logger.test.ts:[0-9]+:[0-9]+/),
            },
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
          });
        });
      });

      describe('Feature: persistent log attributes', () => {

        test('when persistent log attributes are added to the Logger instance, they should appear in all logs printed by the instance', () => {

          // Prepare
          const logger: ClassThatLogs = createLogger({
            logLevel: 'DEBUG',
            persistentLogAttributes: {
              aws_account_id: '123456789012',
              aws_region: 'eu-central-1',
            },
          });

          // Act
          if (logger[method as keyof ClassThatLogs]) {
            logger[method as keyof ClassThatLogs]('foo');
          }

          // Assess
          expect(console.log).toBeCalledTimes(1);
          expect(console.log).toHaveBeenNthCalledWith(1, {
            aws_account_id: '123456789012',
            aws_region: 'eu-central-1',
            message: 'foo',
            service: 'hello-world',
            level: method.toUpperCase(),
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
          });
        });

      });

      describe('Feature: handle safely unexpected errors', () => {

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
            if (logger[method as keyof ClassThatLogs]) {
              logger[method as keyof ClassThatLogs]('A log with a circular reference', { details: circularObject });
            }

            return 'All good!';
          };

          // Act
          const result = logCircularReference();

          // Assess
          expect(result).toBe('All good!');
          expect(console.log).toHaveBeenNthCalledWith(1, {
            details: {
              foo: 'bar',
            },
            message: 'A log with a circular reference',
            service: 'hello-world',
            level: method.toUpperCase(),
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
          });

        });

      });
    });

  describe('Method: appendKeys', () => {

    test('when called, populates the logger\'s propriety persistentLogAttributes ', () => {

      // Prepare
      const logger = new Logger();

      // Act
      logger.appendKeys({
        aws_account_id: '123456789012',
        aws_region: 'eu-central-1',
        logger: {
          name: 'aws-lambda-powertool-typescript',
          version: '0.2.4',
        },
      });

      // Assess
      expect(logger).toEqual(expect.objectContaining({
        persistentLogAttributes: {
          aws_account_id: '123456789012',
          aws_region: 'eu-central-1',
          logger: {
            name: 'aws-lambda-powertool-typescript',
            version: '0.2.4',
          },
        },
      }));
    });
  });

  describe('Method: createChild', () => {

    test('when called, creates a distinct clone of the original logger instance', () => {

      // Prepare
      const logger = new Logger();

      // Act
      const childLogger = logger.createChild({
        logLevel: 'ERROR',
      });

      // Assess
      expect(logger).toEqual(expect.objectContaining({
        logLevel: 'DEBUG',
      }));
      expect(childLogger).toBeInstanceOf(Logger);
      expect(childLogger).toEqual(expect.objectContaining({
        logLevel: 'ERROR',
      }));
    });

  });

  describe('Method: injectLambdaContext', () => {

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

      expect(console.log).toBeCalledTimes(2);
      expect(console.log).toHaveBeenNthCalledWith(1, {
        message: 'An INFO log without context!',
        service: 'hello-world',
        level: 'INFO',
        timestamp: '2016-06-20T12:08:10.000Z',
        xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
      });
      expect(console.log).toHaveBeenNthCalledWith(2, {
        cold_start: true,
        function_arn: 'arn:aws:lambda:eu-central-1:123456789012:function:Example',
        function_memory_size: 128,
        function_name: 'foo-bar-function',
        function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
        message: 'This is an INFO log with some context',
        service: 'hello-world',
        level: 'INFO',
        timestamp: '2016-06-20T12:08:10.000Z',
        xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
      });

    });

  });

  describe('Method: isColdStart', () => {

    test('when called, it returns false the first time and always true after that', () => {

      // Assess
      expect(Logger.isColdStart()).toBe(true);
      expect(Logger.isColdStart()).toBe(false);
      expect(Logger.isColdStart()).toBe(false);
      expect(Logger.isColdStart()).toBe(false);

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
          awsRegion: 'eu-central-1',
          environment: '',
          sampleRateValue: undefined,
          serviceName: 'hello-world',
          xRayTraceId: 'abcdef123456abcdef123456abcdef123456',
        },
      });

      expect(childLoggerWithPermanentAttributes).toEqual({
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
          awsRegion: 'eu-central-1',
          environment: '',
          sampleRateValue: undefined,
          serviceName: 'hello-world',
          xRayTraceId: 'abcdef123456abcdef123456abcdef123456',
        },
      });

      expect(childLoggerWithSampleRateEnabled).toEqual({
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
          awsRegion: 'eu-central-1',
          environment: '',
          sampleRateValue: 1,
          serviceName: 'hello-world',
          xRayTraceId: 'abcdef123456abcdef123456abcdef123456',
        },
      });

      expect(childLoggerWithErrorLogLevel).toEqual({
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
          awsRegion: 'eu-central-1',
          environment: '',
          sampleRateValue: undefined,
          serviceName: 'hello-world',
          xRayTraceId: 'abcdef123456abcdef123456abcdef123456',
        },
      });

    });

  });

});