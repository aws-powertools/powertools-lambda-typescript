import { Logger } from '../../src';

const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

describe('Logger', () => {

  const logger = new Logger();

  beforeEach(() => {
    consoleSpy.mockClear();
  });

  test('should return a valid INFO log', () => {

    logger.info('foo');
    logger.info('foo', { bar: 'baz' });

    expect(console.log).toBeCalledTimes(2);
    expect(console.log).toHaveBeenNthCalledWith(1, {
      timestamp: '2020-05-24 18:17:33,774',
      message: 'foo',
      level: 'INFO',
      location: 'foo',
      service: 'bar',
      sampling_rate: 1,
      xray_trace_id: '1234'
    });
    expect(console.log).toHaveBeenNthCalledWith(2, {
      timestamp: '2020-05-24 18:17:33,774',
      message: 'foo',
      bar: 'baz',
      level: 'INFO',
      location: 'foo',
      service: 'bar',
      sampling_rate: 1,
      xray_trace_id: '1234'
    });

  });

  test('should return a valid ERROR log', () => {
    logger.error('foo');
    logger.error('foo', { bar: 'baz' });

    expect(console.log).toBeCalledTimes(2);
    expect(console.log).toHaveBeenNthCalledWith(1, {
      timestamp: '2020-05-24 18:17:33,774',
      message: 'foo',
      level: 'ERROR',
      location: 'foo',
      service: 'bar',
      sampling_rate: 1,
      xray_trace_id: '1234'
    });
    expect(console.log).toHaveBeenNthCalledWith(2, {
      timestamp: '2020-05-24 18:17:33,774',
      message: 'foo',
      bar: 'baz',
      level: 'ERROR',
      location: 'foo',
      service: 'bar',
      sampling_rate: 1,
      xray_trace_id: '1234'
    });
  });

  test('should return a valid DEBUG log', () => {
    logger.debug('foo');
    logger.debug('foo', { bar: 'baz' });

    expect(console.log).toBeCalledTimes(2);
    expect(console.log).toHaveBeenNthCalledWith(1, {
      timestamp: '2020-05-24 18:17:33,774',
      message: 'foo',
      level: 'DEBUG',
      location: 'foo',
      service: 'bar',
      sampling_rate: 1,
      xray_trace_id: '1234'
    });
    expect(console.log).toHaveBeenNthCalledWith(2, {
      timestamp: '2020-05-24 18:17:33,774',
      message: 'foo',
      bar: 'baz',
      level: 'DEBUG',
      location: 'foo',
      service: 'bar',
      sampling_rate: 1,
      xray_trace_id: '1234'
    });
  });

  test('should return a valid WARN log', () => {
    logger.warn('foo');
    logger.warn('foo', { bar: 'baz' });

    expect(console.log).toBeCalledTimes(2);
    expect(console.log).toHaveBeenNthCalledWith(1, {
      timestamp: '2020-05-24 18:17:33,774',
      message: 'foo',
      level: 'WARN',
      location: 'foo',
      service: 'bar',
      sampling_rate: 1,
      xray_trace_id: '1234'
    });
    expect(console.log).toHaveBeenNthCalledWith(2, {
      timestamp: '2020-05-24 18:17:33,774',
      message: 'foo',
      bar: 'baz',
      level: 'WARN',
      location: 'foo',
      service: 'bar',
      sampling_rate: 1,
      xray_trace_id: '1234'
    });

  });

});

