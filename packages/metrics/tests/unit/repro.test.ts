import middy from '@middy/core';
import type { Context } from 'aws-lambda';
import { Metrics } from '../../src/Metrics.js';
import { logMetrics } from '../../src/middleware/middy.js';

describe('Metrics', () => {
  beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('does not log', () => {
    process.env.POWERTOOLS_DEV = 'true';
    const metrics = new Metrics({
      serviceName: 'foo',
      namespace: 'bar',
      defaultDimensions: {
        aws_account_id: '123456789012',
        aws_region: 'us-west-2',
      },
    });
    const logSpy = jest.spyOn(console, 'log').mockImplementation();

    metrics.publishStoredMetrics();

    expect(logSpy).toHaveBeenCalledTimes(0);
  });

  it('does log because of captureColdStartMetric enabled', () => {
    process.env.POWERTOOLS_DEV = 'true';
    const metrics = new Metrics({
      serviceName: 'foo',
      namespace: 'bar',
      defaultDimensions: {
        aws_account_id: '123456789012',
        aws_region: 'us-west-2',
      },
    });
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    const handler = middy(() => {}).use(
      logMetrics(metrics, { captureColdStartMetric: true })
    );

    handler({}, {} as Context);

    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it('does not log because of captureColdStartMetric disabled', () => {
    process.env.POWERTOOLS_DEV = 'true';
    const metrics = new Metrics({
      serviceName: 'foo',
      namespace: 'bar',
      defaultDimensions: {
        aws_account_id: '123456789012',
        aws_region: 'us-west-2',
      },
    });
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    const handler = middy(() => {}).use(
      logMetrics(metrics, { captureColdStartMetric: false })
    );

    handler({}, {} as Context);

    expect(logSpy).toHaveBeenCalledTimes(0);
  });
});
