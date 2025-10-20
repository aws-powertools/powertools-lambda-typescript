import { sequence } from '@aws-lambda-powertools/testing-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Metrics, MetricUnit } from '../../../src/index.js';

describe('Metrics concurrent invocation isolation', () => {
  beforeEach(() => {
    vi.stubEnv('POWERTOOLS_DEV', 'true');
    vi.stubEnv('POWERTOOLS_METRICS_DISABLED', 'false');
    vi.clearAllMocks();
  });

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedCallCount: 1,
      expectedOutputs: [
        {
          env: 'dev',
          key: 'value2',
          count: [1, 2],
        },
      ],
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedCallCount: 2,
      expectedOutputs: [
        { env: 'prod', key: 'value1', count: 1 },
        { env: 'dev', key: 'value2', count: 2 },
      ],
    },
  ])(
    'handles metrics, metadata, and dimensions $description',
    async ({ useInvokeStore, expectedCallCount, expectedOutputs }) => {
      const metrics = new Metrics({ singleMetric: false });

      await sequence(
        {
          sideEffects: [
            () => {
              metrics.addDimension('env', 'prod');
              metrics.addMetric('count', MetricUnit.Count, 1);
              metrics.addMetadata('key', 'value1');
            },
          ],
          return: () => metrics.publishStoredMetrics(),
        },
        {
          sideEffects: [
            () => {
              metrics.addDimension('env', 'dev');
              metrics.addMetric('count', MetricUnit.Count, 2);
              metrics.addMetadata('key', 'value2');
            },
          ],
          return: () => metrics.publishStoredMetrics(),
        },
        { useInvokeStore }
      );

      expect(console.log).toHaveBeenCalledTimes(expectedCallCount);
      for (const expectedOutput of expectedOutputs) {
        expect(console.log).toHaveEmittedEMFWith(
          expect.objectContaining(expectedOutput)
        );
      }
    }
  );

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedCallCount: 1,
      expectedOutputs: [
        {
          _aws: expect.objectContaining({ Timestamp: 2000 }),
          count: [1, 2],
        },
      ],
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedCallCount: 2,
      expectedOutputs: [
        { _aws: expect.objectContaining({ Timestamp: 1000 }), count: 1 },
        { _aws: expect.objectContaining({ Timestamp: 2000 }), count: 2 },
      ],
    },
  ])(
    'handles timestamps $description',
    async ({ useInvokeStore, expectedCallCount, expectedOutputs }) => {
      const metrics = new Metrics({ singleMetric: false });
      const timestamp1 = 1000;
      const timestamp2 = 2000;

      await sequence(
        {
          sideEffects: [
            () => {
              metrics.setTimestamp(timestamp1);
              metrics.addMetric('count', MetricUnit.Count, 1);
            },
            () => {},
            () => metrics.publishStoredMetrics(),
          ],
          return: () => {},
        },
        {
          sideEffects: [
            () => {},
            () => {
              metrics.setTimestamp(timestamp2);
              metrics.addMetric('count', MetricUnit.Count, 2);
            },
            () => metrics.publishStoredMetrics(),
          ],
          return: () => {},
        },
        { useInvokeStore }
      );

      expect(console.log).toHaveBeenCalledTimes(expectedCallCount);
      for (const expectedOutput of expectedOutputs) {
        expect(console.log).toHaveEmittedEMFWith(
          expect.objectContaining(expectedOutput)
        );
      }
    }
  );
});
