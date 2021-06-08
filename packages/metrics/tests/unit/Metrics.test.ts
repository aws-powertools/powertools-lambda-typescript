import { populateEnvironmentVariables } from "../helpers";
import { Metrics } from "../../src/";

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

  test('should log service dimension', () => {
    const metrics = new Metrics({ namespace: 'test', service: 'testing' });
    metrics.addMetric('test_name', 'Seconds', 14);
    metrics.logMetrics();
    expect(console.log).toBeCalledWith({});

  });
});