import { Metrics } from '../../src/';
import { populateEnvironmentVariables } from '../helpers';

const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

describe('Metrics', () => {

  const originalEnvironmentVariables = process.env;

  beforeEach(() => {
    consoleSpy.mockClear();
  });

  beforeAll(() => {
    populateEnvironmentVariables();
  });

  afterAll(() => {
    process.env = originalEnvironmentVariables;
  });

  test('should log service dimension correctly when passed', () => {
    const serviceName = 'testing_name';
    const metrics = new Metrics({ namespace: 'test', service: serviceName });
    metrics.addMetric('test_name', 'Seconds', 14);
    metrics.logMetrics();
    expect(console.log).toBeCalledTimes(1);
    const loggedData = JSON.parse(consoleSpy.mock.calls[0][0]);

    expect(loggedData.service).toEqual(serviceName);
    expect(loggedData._aws.CloudWatchMetrics[0].Dimensions.length).toEqual(1);
    expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0][0]).toEqual('service');
  });

  test('should log service dimension correctly from env var when not passed', () => {
    const serviceName = 'hello-world';
    const metrics = new Metrics({ namespace: 'test' });
    metrics.addMetric('test_name', 'Seconds', 10);
    metrics.logMetrics();
    expect(console.log).toBeCalledTimes(1);
    const loggedData = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(loggedData.service).toEqual(serviceName);
  });

});