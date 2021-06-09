import { context as dummyContext } from '../../../../tests/resources/contexts/hello-world';
import { Callback, Context } from 'aws-lambda/handler';
import { createLogger, Logger } from '../../src';
import * as dummyEvent from '../../../../tests/resources/events/custom/hello-world.json';
import { LambdaInterface } from '../../src/lambda';
import { EnvironmentVariablesService } from '../../src/config';
import { PowertoolLogFormatter } from '../../src/formatter';

const mockDate = new Date(1466424490000);
const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string);

const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

describe('Class: Logger', () => {

  beforeEach(() => {
    Logger.coldStart = true;
    consoleSpy.mockClear();
    dateSpy.mockClear();
  });

  //   logLevel?: LogLevel
  //   serviceName?: string
  //   sampleRateValue?: number
  //   logFormatter?: LogFormatterInterface
  //   customConfigService?: ConfigServiceInterface
  //   persistentLogAttributes?: LogAttributes
  //   environment?: Environment

  //   // Reserved environment variables
  //   private awsRegionVariable = 'AWS_REGION';
  //   private functionNameVariable = 'AWS_LAMBDA_FUNCTION_NAME';
  //   private functionVersionVariable = 'AWS_LAMBDA_FUNCTION_VERSION';
  //   private memoryLimitInMBVariable = 'AWS_LAMBDA_FUNCTION_MEMORY_SIZE';
  //   private xRayTraceIdVariable = '_X_AMZN_TRACE_ID';

  //   // Custom environment variables
  //   protected currentEnvironmentVariable = 'ENVIRONMENT';
  //   protected logLevelVariable = 'LOG_LEVEL';
  //   protected sampleRateValueVariable = 'POWERTOOLS_LOGGER_SAMPLE_RATE';
  //   protected serviceNameVariable = 'POWERTOOLS_SERVICE_NAME';

  // Context
  // Env variables
  // Constructor variables
  // Persistent log attributes
  // Log formatter
  // Custom config service
  //

  describe('Method: info', () => {

    describe('Feature: log level', () => {

      test('when the Logger\'s log level is DEBUG, it DOES print to stdout', () => {

        // Prepare
        const loggerOptions = {
          logLevel: 'DEBUG'
        };
        const logger = createLogger(loggerOptions);

        // Act
        logger.info('foo');

        // Assess
        expect(console.log).toBeCalledTimes(1);
        expect(console.log).toHaveBeenNthCalledWith(1, {
          message: 'foo',
          service: 'hello-world',
          level: 'INFO',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
        });

      });

      test('when the Logger\'s log level is INFO, it DOES print to stdout', () => {

        // Prepare
        const loggerOptions = {
          logLevel: 'INFO'
        };
        const logger = createLogger(loggerOptions);

        // Act
        logger.info('foo');

        // Assess
        expect(console.log).toBeCalledTimes(1);
        expect(console.log).toHaveBeenNthCalledWith(1, {
          message: 'foo',
          service: 'hello-world',
          level: 'INFO',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
        });

      });

      test('when the Logger\'s log level is WARN, it DOES NOT print to stdout', () => {

        // Prepare
        const loggerOptions = {
          logLevel: 'WARN'
        };
        const logger = createLogger(loggerOptions);

        // Act
        logger.info('foo');

        // Assess
        expect(console.log).toBeCalledTimes(0);

      });

      test('when the Logger\'s log level is ERROR, it DOES NOT print to stdout', () => {

        // Prepare
        const loggerOptions = {
          logLevel: 'ERROR'
        };
        const logger = createLogger(loggerOptions);

        // Act
        logger.info('foo');

        // Assess
        expect(console.log).toBeCalledTimes(0);

      });

    });

    describe('Feature: sample rate', () => {
      
      test('when the Logger\'s log level is higher and the current Lambda invocation IS NOT sampled for logging, it DOES NOT print to stdout', () => {

        // Prepare
        const logger = new Logger({
          logLevel: 'ERROR',
          sampleRateValue: 0
        });

        // Act
        logger.info('foo');

        // Assess
        expect(console.log).toBeCalledTimes(0);
      });

      test('when the Logger\'s log level is higher and the current Lambda invocation IS sampled for logging, it DOES print to stdout', () => {

        // Prepare
        const logger = new Logger({
          logLevel: 'ERROR',
          sampleRateValue: 1
        });

        // Act
        logger.info('foo');

        // Assess
        expect(console.log).toBeCalledTimes(1);
        expect(console.log).toHaveBeenNthCalledWith(1, {
          message: 'foo',
          sampling_rate: 1,
          service: 'hello-world',
          level: 'INFO',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
        });
      });

    });

    describe('Feature: capture Lambda context information and add it in the printed logs', () => {

      test('when the Lambda context is not captured and a string is passed as log message, it should print a valid INFO log', () => {

        // Prepare
        const logger = new Logger();

        // Act
        logger.info('foo');

        // Assess
        expect(console.log).toBeCalledTimes(1);
        expect(console.log).toHaveBeenNthCalledWith(1, {
          message: 'foo',
          service: 'hello-world',
          level: 'INFO',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
        });
      });

      test('when the Lambda context is not captured and extra input is passed as second parameter, it should print a valid INFO log', () => {

        // Prepare
        const logger = new Logger();

        // Act
        logger.info('foo', { bar: 'baz' });

        // Assess
        expect(console.log).toBeCalledTimes(1);
        expect(console.log).toHaveBeenNthCalledWith(1, {
          bar: 'baz',
          message: 'foo',
          service: 'hello-world',
          level: 'INFO',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
        });
      });

      test('when the Lambda context is captured it returns a valid INFO log', () => {

        // Prepare
        const logger = new Logger();
        logger.addContext(dummyContext);

        // Act
        logger.info('foo');
        logger.info( { message: 'foo', bar: 'baz' });

        // Assess
        expect(console.log).toBeCalledTimes(2);
        expect(console.log).toHaveBeenNthCalledWith(1, {
          'cold_start': true,
          'function_arn': 'arn:aws:lambda:eu-central-1:123456789012:function:Example',
          'function_memory_size': 128,
          'function_name': 'foo-bar-function',
          'function_request_id': 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
          'level': 'INFO',
          'message': 'foo',
          'service': 'hello-world',
          'timestamp': '2016-06-20T12:08:10.000Z',
          'xray_trace_id': 'abcdef123456abcdef123456abcdef123456'
        });
        expect(console.log).toHaveBeenNthCalledWith(2, {
          'bar': 'baz',
          'cold_start': true,
          'function_arn': 'arn:aws:lambda:eu-central-1:123456789012:function:Example',
          'function_memory_size': 128,
          'function_name': 'foo-bar-function',
          'function_request_id': 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
          'level': 'INFO',
          'message': 'foo',
          'service': 'hello-world',
          'timestamp': '2016-06-20T12:08:10.000Z',
          'xray_trace_id': 'abcdef123456abcdef123456abcdef123456'
        });

      });

    });

    describe('Feature: persistent log attributes', () => {

      test('when persistent log attributes are added to the Logger instance, they should appear in all logs printed by the instance', () => {

        // Prepare
        const logger = new Logger({
          persistentLogAttributes: {
            aws_account_id: '123456789012',
            aws_region: 'eu-central-1',
          }
        });

        // Act
        logger.debug('foo');
        logger.info('bar');
        logger.warn('baz');
        logger.error('hello');

        // Assess
        expect(console.log).toBeCalledTimes(4);
        expect(console.log).toHaveBeenNthCalledWith(1, {
          aws_account_id: '123456789012',
          aws_region: 'eu-central-1',
          message: 'foo',
          service: 'hello-world',
          level: 'DEBUG',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
        });
        expect(console.log).toHaveBeenNthCalledWith(2, {
          aws_account_id: '123456789012',
          aws_region: 'eu-central-1',
          message: 'bar',
          service: 'hello-world',
          level: 'INFO',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
        });
        expect(console.log).toHaveBeenNthCalledWith(3, {
          aws_account_id: '123456789012',
          aws_region: 'eu-central-1',
          message: 'baz',
          service: 'hello-world',
          level: 'WARN',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
        });
        expect(console.log).toHaveBeenNthCalledWith(4, {
          aws_account_id: '123456789012',
          aws_region: 'eu-central-1',
          message: 'hello',
          service: 'hello-world',
          level: 'ERROR',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
        });
      });
    });

    describe('Feature: handle safely unexpected errors', () => {

      test('when a logged item references itself, the logger ignored the circular dependency', () => {

        // Prepare
        const logger = new Logger();
        const circularObject = {
          foo: 'bar',
          self: {}
        };
        circularObject.self = circularObject;
        const logCircularReference = (): string => {
          logger.info('A simple log', { details: circularObject });

          return 'All good!';
        };

        // Act
        const result = logCircularReference();

        // Assess
        expect(result).toBe('All good!');
        expect(console.log).toHaveBeenNthCalledWith(1, {
          details: {
            foo: 'bar'
          },
          message: 'A simple log',
          service: 'hello-world',
          level: 'INFO',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
        });

      });

    });

  });

  describe('Method: error', () => {

    describe('Feature: sample rate', () => {

      test('when the current invocation is not sampled for logging, it should print ERROR logs anyway', () => {

        // Prepare
        const logger = new Logger({
          sampleRateValue: 0
        });

        // Act
        logger.error('foo');

        // Assess
        expect(console.log).toBeCalledTimes(1);
        expect(console.log).toHaveBeenNthCalledWith(1, {
          message: 'foo',
          service: 'hello-world',
          level: 'ERROR',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
        });
      });

    });

    describe('Feature: capture Lambda context information and add it in the printed logs', () => {

      describe('when the Lambda context is not captured', () => {

        test('when a string is passed as log message, it should print a valid ERROR log', () => {

          // Prepare
          const logger = new Logger();

          // Act
          logger.error('foo');

          // Assess
          expect(console.log).toBeCalledTimes(1);
          expect(console.log).toHaveBeenNthCalledWith(1, {
            message: 'foo',
            service: 'hello-world',
            level: 'ERROR',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
          });
        });

        test('when extra input is passed as second parameter, it should print a valid ERROR log', () => {

          // Prepare
          const logger = new Logger();

          // Act
          logger.error('foo', { bar: 'baz' });

          // Assess
          expect(console.log).toBeCalledTimes(1);
          expect(console.log).toHaveBeenNthCalledWith(1, {
            bar: 'baz',
            message: 'foo',
            service: 'hello-world',
            level: 'ERROR',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
          });
        });

        test('when extra input containing an Error is passed as second parameter, it should print a valid ERROR log', () => {

          // Prepare
          const logger = new Logger();

          // Act
          try {
            throw new Error('Something happened!');
          } catch (error) {
            logger.error('foo', { bar: 'baz' }, error);
          }

          // Assess
          expect(console.log).toBeCalledTimes(1);
          expect(console.log).toHaveBeenNthCalledWith(1, {
            bar: 'baz',
            error: {
              location: expect.stringMatching(/Logger.test.ts:[0-9]+$/),
              message: 'Something happened!',
              name: 'Error',
              stack: expect.stringMatching(/Logger.test.ts:[0-9]+:[0-9]+/),
            },
            message: 'foo',
            service: 'hello-world',
            level: 'ERROR',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
          });
        });

      });

      describe('when the Lambda context is captured', () => {

        test('should return a valid ERROR log', () => {

          // Prepare
          const logger = new Logger();
          logger.addContext(dummyContext);

          // Act
          logger.error('foo');
          logger.error( { message: 'foo', bar: 'baz' });

          // Assess
          expect(console.log).toBeCalledTimes(2);
          expect(console.log).toHaveBeenNthCalledWith(1, {
            'cold_start': true,
            'function_arn': 'arn:aws:lambda:eu-central-1:123456789012:function:Example',
            'function_memory_size': 128,
            'function_name': 'foo-bar-function',
            'function_request_id': 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
            'level': 'ERROR',
            'message': 'foo',
            'service': 'hello-world',
            'timestamp': '2016-06-20T12:08:10.000Z',
            'xray_trace_id': 'abcdef123456abcdef123456abcdef123456'
          });
          expect(console.log).toHaveBeenNthCalledWith(2, {
            'bar': 'baz',
            'cold_start': true,
            'function_arn': 'arn:aws:lambda:eu-central-1:123456789012:function:Example',
            'function_memory_size': 128,
            'function_name': 'foo-bar-function',
            'function_request_id': 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
            'level': 'ERROR',
            'message': 'foo',
            'service': 'hello-world',
            'timestamp': '2016-06-20T12:08:10.000Z',
            'xray_trace_id': 'abcdef123456abcdef123456abcdef123456'
          });
        });

      });

    });

  });

  describe('Method: debug', () => {

    describe('Feature: capture Lambda context information and add it in the printed logs', () => {

      describe('when the Lambda context is not captured', () => {

        test('when a string is passed as log message, it should print a valid DEBUG log', () => {

          // Prepare
          const logger = new Logger();

          // Act
          logger.debug('foo');

          // Assess
          expect(console.log).toBeCalledTimes(1);
          expect(console.log).toHaveBeenNthCalledWith(1, {
            message: 'foo',
            service: 'hello-world',
            level: 'DEBUG',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
          });
        });

        test('when extra input is passed as second parameter, it should print a valid DEBUG log', () => {

          // Prepare
          const logger = new Logger();

          // Act
          logger.debug('foo', { bar: 'baz' });

          // Assess
          expect(console.log).toBeCalledTimes(1);
          expect(console.log).toHaveBeenNthCalledWith(1, {
            bar: 'baz',
            message: 'foo',
            service: 'hello-world',
            level: 'DEBUG',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
          });
        });

        test('when the Logger\'s log level is INFO, it DOES NOT print to stdout', () => {

          // Prepare
          const loggerOptions = {
            logLevel: 'INFO'
          };
          const logger = createLogger(loggerOptions);

          // Act
          logger.debug('foo');

          // Assess
          expect(console.log).toBeCalledTimes(0);

        });

        test('when the Logger\'s log level is ERROR, it DOES NOT print to stdout', () => {

          // Prepare
          const loggerOptions = {
            logLevel: 'ERROR'
          };
          const logger = createLogger(loggerOptions);

          // Act
          logger.debug('foo');

          // Assess
          expect(console.log).toBeCalledTimes(0);

        });

        test('when the Logger\'s log level is WARN, it DOES NOT print to stdout', () => {

          // Prepare
          const loggerOptions = {
            logLevel: 'WARN'
          };
          const logger = createLogger(loggerOptions);

          // Act
          logger.debug('foo');

          // Assess
          expect(console.log).toBeCalledTimes(0);

        });

      });

      describe('when the Lambda context is captured', () => {
        test('should return a valid DEBUG log', () => {

          // Prepare
          const logger = new Logger();
          logger.addContext(dummyContext);

          // Act
          logger.debug('foo');
          logger.debug({ message: 'foo', bar: 'baz' });

          // Assess
          expect(console.log).toBeCalledTimes(2);
          expect(console.log).toHaveBeenNthCalledWith(1, {
            'cold_start': true,
            'function_arn': 'arn:aws:lambda:eu-central-1:123456789012:function:Example',
            'function_memory_size': 128,
            'function_name': 'foo-bar-function',
            'function_request_id': 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
            'level': 'DEBUG',
            'message': 'foo',
            'service': 'hello-world',
            'timestamp': '2016-06-20T12:08:10.000Z',
            'xray_trace_id': 'abcdef123456abcdef123456abcdef123456'
          });
          expect(console.log).toHaveBeenNthCalledWith(2, {
            'bar': 'baz',
            'cold_start': true,
            'function_arn': 'arn:aws:lambda:eu-central-1:123456789012:function:Example',
            'function_memory_size': 128,
            'function_name': 'foo-bar-function',
            'function_request_id': 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
            'level': 'DEBUG',
            'message': 'foo',
            'service': 'hello-world',
            'timestamp': '2016-06-20T12:08:10.000Z',
            'xray_trace_id': 'abcdef123456abcdef123456abcdef123456'
          });

        });
      });

    });

  });

  describe('Method: warn', () => {

    describe('Feature: capture Lambda context information and add it in the printed logs', () => {

      describe('when the Lambda context is not captured', ()=> {
        test('when a string is passed as log message, it should print a valid WARN log', () => {

          // Prepare
          const logger = new Logger();

          // Act
          logger.warn('foo');

          // Assess
          expect(console.log).toBeCalledTimes(1);
          expect(console.log).toHaveBeenNthCalledWith(1, {
            message: 'foo',
            service: 'hello-world',
            level: 'WARN',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
          });
        });

        test('when extra input is passed as second parameter, it should print a valid WARN log', () => {

          // Prepare
          const logger = new Logger();

          // Act
          logger.debug('foo', { bar: 'baz' });

          // Assess
          expect(console.log).toBeCalledTimes(1);
          expect(console.log).toHaveBeenNthCalledWith(1, {
            bar: 'baz',
            message: 'foo',
            service: 'hello-world',
            level: 'DEBUG',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
          });
        });

        test('when the Logger\'s log level is ERROR, it DOES NOT print to stdout', () => {

          // Prepare
          const loggerOptions = {
            logLevel: 'ERROR'
          };
          const logger = createLogger(loggerOptions);

          // Act
          logger.warn('foo');

          // Assess
          expect(console.log).toBeCalledTimes(0);

        });
      });

      describe('when the Lambda context is captured', () => {
        test('should return a valid WARN log', () => {

          // Prepare
          const logger = new Logger();
          logger.addContext(dummyContext);

          // Act
          logger.warn('foo');
          logger.warn( { message: 'foo', bar: 'baz' });

          // Assess
          expect(console.log).toBeCalledTimes(2);
          expect(console.log).toHaveBeenNthCalledWith(1, {
            'cold_start': true,
            'function_arn': 'arn:aws:lambda:eu-central-1:123456789012:function:Example',
            'function_memory_size': 128,
            'function_name': 'foo-bar-function',
            'function_request_id': 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
            'level': 'WARN',
            'message': 'foo',
            'service': 'hello-world',
            'timestamp': '2016-06-20T12:08:10.000Z',
            'xray_trace_id': 'abcdef123456abcdef123456abcdef123456'
          });
          expect(console.log).toHaveBeenNthCalledWith(2, {
            'bar': 'baz',
            'cold_start': true,
            'function_arn': 'arn:aws:lambda:eu-central-1:123456789012:function:Example',
            'function_memory_size': 128,
            'function_name': 'foo-bar-function',
            'function_request_id': 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
            'level': 'WARN',
            'message': 'foo',
            'service': 'hello-world',
            'timestamp': '2016-06-20T12:08:10.000Z',
            'xray_trace_id': 'abcdef123456abcdef123456abcdef123456'
          });

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
        }
      });

      // Assess
      expect(logger).toEqual(expect.objectContaining({
        persistentLogAttributes: {
          aws_account_id: '123456789012',
          aws_region: 'eu-central-1',
          logger: {
            name: 'aws-lambda-powertool-typescript',
            version: '0.2.4',
          }
        }
      }));
    });
  });

  describe('Method: createChild', () => {

    test('when called, creates a distinct clone of the original logger instance', () => {

      // Prepare
      const logger = new Logger();

      // Act
      const childLogger = logger.createChild({
        logLevel: 'ERROR'
      });

      // Assess
      expect(logger).toEqual(expect.objectContaining({
        logLevel: 'DEBUG'
      }));
      expect(childLogger).toBeInstanceOf(Logger);
      expect(childLogger).toEqual(expect.objectContaining({
        logLevel: 'ERROR'
      }));
    });

  });

  describe('Method: injectLambdaContext', () => {

    test('when used as decorator, it returns a function that captures Lambda\'s context information and adds it in the printed logs', () => {

      // Prepare
      const logger = new Logger();
      class LambdaFunction implements LambdaInterface {
        @logger.injectLambdaContext()
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
          logger.info('This is an INFO log with some context');
        }
      }

      // Act
      logger.info('An INFO log without context!');
      new LambdaFunction().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

      // Assess

      expect(console.log).toBeCalledTimes(2);
      expect(console.log).toHaveBeenNthCalledWith(1, {
        message: 'An INFO log without context!',
        service: 'hello-world',
        level: 'INFO',
        timestamp: '2016-06-20T12:08:10.000Z',
        xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
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
        xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
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
        sampleRateValue: 0.1 // 10% probability
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
          extra: 'This is an attribute that will be logged only by the child logger'
        }
      });
      const childLoggerWithSampleRateEnabled = parentLogger.createChild({
        sampleRateValue: 1 // 100% probability to make sure that the logs are sampled
      });
      const childLoggerWithErrorLogLevel = parentLogger.createChild({
        logLevel: 'ERROR'
      });

      // Assess
      expect(parentLogger === childLogger).toBe(false);
      expect(parentLogger).toEqual(childLogger);
      expect(parentLogger === childLoggerWithPermanentAttributes).toBe(false);
      expect(parentLogger === childLoggerWithSampleRateEnabled).toBe(false);
      expect(parentLogger === childLoggerWithErrorLogLevel).toBe(false);

      expect(parentLogger).toEqual({
        'customConfigService': undefined,
        'envVarsService':  expect.any(EnvironmentVariablesService),
        'logFormatter':  expect.any(PowertoolLogFormatter),
        'logLevel': 'DEBUG',
        'logLevelThresholds':  {
          'DEBUG': 8,
          'ERROR': 20,
          'INFO': 12,
          'WARN': 16,
        },
        'logsSampled': false,
        'persistentLogAttributes':  {},
        'powertoolLogData':  {
          'awsRegion': 'eu-central-1',
          'environment': '',
          'sampleRateValue': undefined,
          'serviceName': 'hello-world',
          'xRayTraceId': 'abcdef123456abcdef123456abcdef123456'
        }
      });

      expect(childLoggerWithPermanentAttributes).toEqual({
        'customConfigService': undefined,
        'envVarsService':  expect.any(EnvironmentVariablesService),
        'logFormatter':  expect.any(PowertoolLogFormatter),
        'logLevel': 'DEBUG',
        'logLevelThresholds':  {
          'DEBUG': 8,
          'ERROR': 20,
          'INFO': 12,
          'WARN': 16,
        },
        'logsSampled': false,
        'persistentLogAttributes': {
          'extra': 'This is an attribute that will be logged only by the child logger',
        },
        'powertoolLogData':  {
          'awsRegion': 'eu-central-1',
          'environment': '',
          'sampleRateValue': undefined,
          'serviceName': 'hello-world',
          'xRayTraceId': 'abcdef123456abcdef123456abcdef123456'
        }
      });

      expect(childLoggerWithSampleRateEnabled).toEqual({
        'customConfigService': undefined,
        'envVarsService':  expect.any(EnvironmentVariablesService),
        'logFormatter':  expect.any(PowertoolLogFormatter),
        'logLevel': 'DEBUG',
        'logLevelThresholds':  {
          'DEBUG': 8,
          'ERROR': 20,
          'INFO': 12,
          'WARN': 16,
        },
        'logsSampled': true,
        'persistentLogAttributes':  {},
        'powertoolLogData':  {
          'awsRegion': 'eu-central-1',
          'environment': '',
          'sampleRateValue': 1,
          'serviceName': 'hello-world',
          'xRayTraceId': 'abcdef123456abcdef123456abcdef123456'
        }
      });

      expect(childLoggerWithErrorLogLevel).toEqual({
        'customConfigService': undefined,
        'envVarsService':  expect.any(EnvironmentVariablesService),
        'logFormatter':  expect.any(PowertoolLogFormatter),
        'logLevel': 'ERROR',
        'logLevelThresholds':  {
          'DEBUG': 8,
          'ERROR': 20,
          'INFO': 12,
          'WARN': 16,
        },
        'logsSampled': false,
        'persistentLogAttributes':  {},
        'powertoolLogData':  {
          'awsRegion': 'eu-central-1',
          'environment': '',
          'sampleRateValue': undefined,
          'serviceName': 'hello-world',
          'xRayTraceId': 'abcdef123456abcdef123456abcdef123456'
        }
      });

    });

  });

});