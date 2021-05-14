import { context as dummyContext } from '../../../../tests/resources/contexts/hello-world';
import { createLogger, Logger } from '../../src';
import { EnvironmentVariablesService } from '../../src/config';
import { PowertoolLogFormatter } from '../../src/formatter';

const mockDate = new Date(1466424490000);
const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string);

const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

describe('Logger', () => {

  beforeEach(() => {
    Logger.coldStart = true;
    consoleSpy.mockClear();
    dateSpy.mockClear();
  });

  describe('info method', () => {

    describe('when context is not enabled', ()=> {
      test('when a string is passed as log message, it should print a valid INFO log', () => {

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

      test('when extra input is passed as second parameter, it should print a valid INFO log', () => {

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

      test('when the log level is ERROR, it does not print any logs', () => {

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

      test('when the log level is WARN, it does not print any logs', () => {

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
    });

    describe('when context is enabled', () => {

      test('should return a valid INFO log', () => {

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

  });

  describe('error method', () => {

    describe('when context is not enabled', () => {

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

    describe('when context is enabled', () => {

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

  describe('debug method', () => {

    describe('when context is not enabled', ()=> {

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

      test('when the log level is INFO, it does not print any logs', () => {

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

      test('when the log level is ERROR, it does not print any logs', () => {

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

      test('when the log level is WARN, it does not print any logs', () => {

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

    describe('when context is enabled', () => {
      test('should return a valid DEBUG log', () => {

        // Prepare
        const logger = new Logger();
        logger.addContext(dummyContext);

        // Act
        logger.debug('foo');
        logger.debug( { message: 'foo', bar: 'baz' });

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

  describe('warn method', () => {

    describe('when context is not enabled', ()=> {
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

      test('when the log level is ERROR, it does not print any logs', () => {

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

    describe('when context is enabled', () => {
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

  describe('appendKeys method', () => {

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

  describe('createChild method', () => {

    test('when called, creates a distinct clone of the original logger object', () => {

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

});