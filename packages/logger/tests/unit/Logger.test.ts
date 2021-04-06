import { context as dummyContext } from '../../../../tests/resources/contexts/hello-world';
import { Logger } from '../../src';
import { populateEnvironmentVariables } from '../helpers';

const mockDate = new Date(1466424490000);
const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string);

const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

describe('Logger', () => {

  const originalEnvironmentVariables = process.env;

  beforeAll(() => {
    populateEnvironmentVariables();
  });

  beforeEach(() => {
    consoleSpy.mockClear();
    dateSpy.mockClear();
  });

  afterAll(() => {
    process.env = originalEnvironmentVariables;
  });

  test('should return a valid INFO log', () => {

    const logger = new Logger();

    logger.info('foo');
    logger.info('foo', { bar: 'baz' });

    expect(console.log).toBeCalledTimes(2);
    expect(console.log).toHaveBeenNthCalledWith(1, {
      message: 'foo',
      service: 'hello-world',
      level: 'INFO',
      timestamp: '2016-06-20T12:08:10.000Z',
      xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
    });
    expect(console.log).toHaveBeenNthCalledWith(2, {
      bar: 'baz',
      message: 'foo',
      service: 'hello-world',
      level: 'INFO',
      timestamp: '2016-06-20T12:08:10.000Z',
      xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
    });

  });

  test('should return a valid ERROR log', () => {

    const logger = new Logger();

    logger.error('foo');
    logger.error('foo', { bar: 'baz' });
    logger.error({ bar: 'baz', message: 'foo' });

    const error = new Error('Something happened!');
    logger.error('foo', { bar: 'baz' }, error);

    expect(console.log).toBeCalledTimes(4);
    expect(console.log).toHaveBeenNthCalledWith(1, {
      message: 'foo',
      service: 'hello-world',
      level: 'ERROR',
      timestamp: '2016-06-20T12:08:10.000Z',
      xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
    });
    expect(console.log).toHaveBeenNthCalledWith(2, {
      bar: 'baz',
      message: 'foo',
      service: 'hello-world',
      level: 'ERROR',
      timestamp: '2016-06-20T12:08:10.000Z',
      xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
    });
    expect(console.log).toHaveBeenNthCalledWith(3, {
      bar: 'baz',
      message: 'foo',
      service: 'hello-world',
      level: 'ERROR',
      timestamp: '2016-06-20T12:08:10.000Z',
      xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
    });
    expect(console.log).toHaveBeenNthCalledWith(4, {
      bar: 'baz',
      error: {
        location: expect.stringMatching(/Logger.test.ts:[1-9]+$/),
        message: 'Something happened!',
        name: 'Error',
        stack: expect.stringMatching(/Logger.test.ts:[1-9]+:[1-9]+/),
      },
      message: 'foo',
      service: 'hello-world',
      level: 'ERROR',
      timestamp: '2016-06-20T12:08:10.000Z',
      xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
    });
  });

  test('should return a valid DEBUG log', () => {

    const logger = new Logger();

    logger.debug('foo');
    logger.debug('foo', { bar: 'baz' });

    expect(console.log).toBeCalledTimes(2);
    expect(console.log).toHaveBeenNthCalledWith(1, {
      message: 'foo',
      service: 'hello-world',
      level: 'DEBUG',
      timestamp: '2016-06-20T12:08:10.000Z',
      xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
    });
    expect(console.log).toHaveBeenNthCalledWith(2, {
      bar: 'baz',
      message: 'foo',
      service: 'hello-world',
      level: 'DEBUG',
      timestamp: '2016-06-20T12:08:10.000Z',
      xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
    });
  });

  test('should return a valid WARN log', () => {

    const logger = new Logger();

    logger.warn('foo');
    logger.warn( { message: 'foo', bar: 'baz' });

    expect(console.log).toBeCalledTimes(2);
    expect(console.log).toHaveBeenNthCalledWith(1, {
      timestamp: '2016-06-20T12:08:10.000Z',
      message: 'foo',
      level: 'WARN',
      service: 'hello-world',
      xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
    });
    expect(console.log).toHaveBeenNthCalledWith(2, {
      bar: 'baz',
      level: 'WARN',
      message: 'foo',
      service: 'hello-world',
      timestamp: '2016-06-20T12:08:10.000Z',
      xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
    });

  });

  test('should return a valid INFO log with context enabled', () => {

    const logger = new Logger();
    logger.addContext(dummyContext);

    logger.info('foo');
    logger.info( { message: 'foo', bar: 'baz' });

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

