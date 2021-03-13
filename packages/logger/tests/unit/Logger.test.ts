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

    expect(console.log).toBeCalledTimes(2);
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

});

