import { Logger } from '../../src';

const mockDate = new Date(1466424490000);
const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string);

const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

describe('Logger', () => {

  const logger = new Logger({
    logLevel: 'DEBUG'
  });

  beforeEach(() => {
    consoleSpy.mockClear();
    dateSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockClear();
    dateSpy.mockClear();
  });

  test('should return a valid INFO log', () => {

    logger.info('foo');
    logger.info('foo', { bar: 'baz' });

    expect(console.log).toBeCalledTimes(2);
    expect(console.log).toHaveBeenNthCalledWith(1, {
      message: 'foo',
      level: 'INFO',
      timestamp: '2016-06-20T12:08:10.000Z'
    });
    expect(console.log).toHaveBeenNthCalledWith(2, {
      bar: 'baz',
      level: 'INFO',
      message: 'foo',
      timestamp: '2016-06-20T12:08:10.000Z'
    });

  });

  test('should return a valid ERROR log', () => {
    logger.error('foo');
    logger.error('foo', { bar: 'baz' });

    expect(console.log).toBeCalledTimes(2);
    expect(console.log).toHaveBeenNthCalledWith(1, {
      timestamp: '2016-06-20T12:08:10.000Z',
      message: 'foo',
      level: 'ERROR',
    });
    expect(console.log).toHaveBeenNthCalledWith(2, {
      bar: 'baz',
      level: 'ERROR',
      message: 'foo',
      timestamp: '2016-06-20T12:08:10.000Z',
    });
  });

  test('should return a valid DEBUG log', () => {
    logger.debug('foo');
    logger.debug('foo', { bar: 'baz' });

    expect(console.log).toBeCalledTimes(2);
    expect(console.log).toHaveBeenNthCalledWith(1, {
      timestamp: '2016-06-20T12:08:10.000Z',
      message: 'foo',
      level: 'DEBUG',
    });
    expect(console.log).toHaveBeenNthCalledWith(2, {
      bar: 'baz',
      level: 'DEBUG',
      message: 'foo',
      timestamp: '2016-06-20T12:08:10.000Z',
    });
  });

  test('should return a valid WARN log', () => {
    logger.warn('foo');
    logger.warn('foo', { bar: 'baz' });

    expect(console.log).toBeCalledTimes(2);
    expect(console.log).toHaveBeenNthCalledWith(1, {
      timestamp: '2016-06-20T12:08:10.000Z',
      message: 'foo',
      level: 'WARN',
    });
    expect(console.log).toHaveBeenNthCalledWith(2, {
      bar: 'baz',
      level: 'WARN',
      message: 'foo',
      timestamp: '2016-06-20T12:08:10.000Z',
    });

  });

});

