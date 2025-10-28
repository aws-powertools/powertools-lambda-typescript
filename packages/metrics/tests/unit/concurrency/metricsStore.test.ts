import { sequence } from '@aws-lambda-powertools/testing-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MetricUnit } from '../../../src/index.js';
import { MetricsStore } from '../../../src/MetricsStore.js';
import type { StoredMetric } from '../../../src/types/index.js';

describe('MetricsStore concurrent invocation isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedResult1: {
        name: 'count',
        unit: MetricUnit.Count,
        value: [1, 2],
        resolution: 60,
      },
      expectedResult2: {
        name: 'count',
        unit: MetricUnit.Count,
        value: [1, 2],
        resolution: 60,
      },
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedResult1: {
        name: 'count',
        unit: MetricUnit.Count,
        value: 1,
        resolution: 60,
      },
      expectedResult2: {
        name: 'count',
        unit: MetricUnit.Count,
        value: 2,
        resolution: 60,
      },
    },
  ])(
    'getMetric() $description',
    async ({ useInvokeStore, expectedResult1, expectedResult2 }) => {
      // Prepare
      const store = new MetricsStore();

      // Act
      const [result1, result2] = await sequence(
        {
          sideEffects: [
            () => store.setMetric('count', MetricUnit.Count, 1, 60),
          ],
          return: () => store.getMetric('count'),
        },
        {
          sideEffects: [
            () => store.setMetric('count', MetricUnit.Count, 2, 60),
          ],
          return: () => store.getMetric('count'),
        },
        { useInvokeStore }
      );

      // Assess
      expect(result1).toEqual(expectedResult1);
      expect(result2).toEqual(expectedResult2);
    }
  );

  const countMetric: StoredMetric = {
    name: 'count',
    unit: MetricUnit.Count,
    value: 1,
    resolution: 60,
  };
  const latencyMetric: StoredMetric = {
    name: 'latency',
    unit: MetricUnit.Milliseconds,
    value: 100,
    resolution: 60,
  };
  const errorMetric: StoredMetric = {
    name: 'errors',
    unit: MetricUnit.Count,
    value: 1,
    resolution: 60,
  };

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedResult1: [countMetric, latencyMetric, errorMetric],
      expectedResult2: [countMetric, latencyMetric, errorMetric],
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedResult1: [countMetric, latencyMetric],
      expectedResult2: [errorMetric],
    },
  ])(
    'getAllMetrics() $description',
    async ({ useInvokeStore, expectedResult1, expectedResult2 }) => {
      // Prepare
      const store = new MetricsStore();

      // Act
      const [result1, result2] = await sequence(
        {
          sideEffects: [
            () => {
              store.setMetric('count', MetricUnit.Count, 1, 60);
              store.setMetric('latency', MetricUnit.Milliseconds, 100, 60);
            },
          ],
          return: () => store.getAllMetrics(),
        },
        {
          sideEffects: [
            () => {
              store.setMetric('errors', MetricUnit.Count, 1, 60);
            },
          ],
          return: () => store.getAllMetrics(),
        },
        { useInvokeStore }
      );

      // Assess
      expect(result1).toEqual(expectedResult1);
      expect(result2).toEqual(expectedResult2);
    }
  );

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedResult1: 2000,
      expectedResult2: 2000,
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedResult1: 1000,
      expectedResult2: 2000,
    },
  ])(
    'timestamp $description',
    async ({ useInvokeStore, expectedResult1, expectedResult2 }) => {
      // Prepare
      const store = new MetricsStore();
      const timestamp1 = 1000;
      const timestamp2 = 2000;

      // Act
      const [result1, result2] = await sequence(
        {
          sideEffects: [() => store.setTimestamp(timestamp1)],
          return: () => store.getTimestamp(),
        },
        {
          sideEffects: [() => store.setTimestamp(timestamp2)],
          return: () => store.getTimestamp(),
        },
        { useInvokeStore }
      );

      // Assess
      expect(result1).toBe(expectedResult1);
      expect(result2).toBe(expectedResult2);
    }
  );

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedResult1: { metrics: [], timestamp: undefined },
      expectedResult2: { metrics: [], timestamp: undefined },
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedResult1: { metrics: [], timestamp: undefined },
      expectedResult2: { metrics: [errorMetric], timestamp: 2000 },
    },
  ])(
    'clearMetrics() $description',
    async ({ useInvokeStore, expectedResult1, expectedResult2 }) => {
      // Prepare
      const store = new MetricsStore();

      // Act
      const [result1, result2] = await sequence(
        {
          sideEffects: [
            () => {
              store.setMetric('count', MetricUnit.Count, 1, 60);
              store.setTimestamp(1000);
            },
            () => {}, // Wait for inv2 to add
            () => store.clearMetrics(),
          ],
          return: () => ({
            metrics: store.getAllMetrics(),
            timestamp: store.getTimestamp(),
          }),
        },
        {
          sideEffects: [
            () => {}, // Wait for inv1 to add
            () => {
              store.setMetric('errors', MetricUnit.Count, 1, 60);
              store.setTimestamp(2000);
            },
            () => {}, // Wait for clear
          ],
          return: () => ({
            metrics: store.getAllMetrics(),
            timestamp: store.getTimestamp(),
          }),
        },
        { useInvokeStore }
      );

      // Assess
      expect(result1).toEqual(expectedResult1);
      expect(result2).toEqual(expectedResult2);
    }
  );

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedResult1: true,
      expectedResult2: true,
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedResult1: true,
      expectedResult2: false,
    },
  ])(
    'hasMetrics() $description',
    async ({ useInvokeStore, expectedResult1, expectedResult2 }) => {
      // Prepare
      const store = new MetricsStore();

      // Act
      const [result1, result2] = await sequence(
        {
          sideEffects: [
            () => store.setMetric('count', MetricUnit.Count, 1, 60),
          ],
          return: () => store.hasMetrics(),
        },
        {
          sideEffects: [() => {}], // No-op
          return: () => store.hasMetrics(),
        },
        { useInvokeStore }
      );

      // Assess
      expect(result1).toBe(expectedResult1);
      expect(result2).toBe(expectedResult2);
    }
  );

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedResult1: 2,
      expectedResult2: 2,
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedResult1: 1,
      expectedResult2: 1,
    },
  ])(
    'getMetricsCount() $description',
    async ({ useInvokeStore, expectedResult1, expectedResult2 }) => {
      // Prepare
      const store = new MetricsStore();

      // Act
      const [result1, result2] = await sequence(
        {
          sideEffects: [
            () => store.setMetric('count', MetricUnit.Count, 1, 60),
          ],
          return: () => store.getMetricsCount(),
        },
        {
          sideEffects: [
            () => store.setMetric('errors', MetricUnit.Count, 1, 60),
          ],
          return: () => store.getMetricsCount(),
        },
        { useInvokeStore }
      );

      // Assess
      expect(result1).toBe(expectedResult1);
      expect(result2).toBe(expectedResult2);
    }
  );
});
