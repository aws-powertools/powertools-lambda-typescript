import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_NAMESPACE } from '../../src/constants.js';
import { Metrics, MetricUnit } from '../../src/index.js';

// The `using` keyword requires Node.js 24 or newer.
describe.skipIf(Number(process.versions.node.split('.')[0]) < 24)(
  'Disposable support (using keyword)',
  () => {
    const ENVIRONMENT_VARIABLES = process.env;

    beforeEach(() => {
      process.env = {
        ...ENVIRONMENT_VARIABLES,
        POWERTOOLS_DEV: 'true',
        POWERTOOLS_METRICS_DISABLED: 'false',
      };
      vi.clearAllMocks();
    });

    it('flushes the stored metrics when the scope exits', () => {
      // Prepare
      const metrics = new Metrics({
        singleMetric: false,
        namespace: DEFAULT_NAMESPACE,
      });
      vi.spyOn(metrics, 'publishStoredMetrics');

      // Act
      {
        using _ = metrics;
        metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
      }

      // Assess
      expect(metrics.publishStoredMetrics).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveEmittedNthEMFWith(
        1,
        expect.objectContaining({ successfulBooking: 1 })
      );
    });

    it('flushes the stored metrics even when an error is thrown', () => {
      // Prepare
      const metrics = new Metrics({
        singleMetric: false,
        namespace: DEFAULT_NAMESPACE,
      });
      vi.spyOn(metrics, 'publishStoredMetrics');

      // Act & Assess
      expect(() => {
        using _ = metrics;
        metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
        throw new Error('Something went wrong');
      }).toThrow('Something went wrong');

      expect(metrics.publishStoredMetrics).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveEmittedNthEMFWith(
        1,
        expect.objectContaining({ successfulBooking: 1 })
      );
    });

    it('warns instead of throwing when no metrics are stored', () => {
      // Prepare
      const metrics = new Metrics({
        singleMetric: false,
        namespace: DEFAULT_NAMESPACE,
      });
      const warnSpy = vi.spyOn(console, 'warn');

      // Act
      {
        using _ = metrics;
      }

      // Assess
      expect(console.log).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('No application metrics to publish')
      );
    });

    it('delegates to publishStoredMetrics when disposed directly', () => {
      // Prepare
      const metrics = new Metrics({
        singleMetric: false,
        namespace: DEFAULT_NAMESPACE,
      });
      vi.spyOn(metrics, 'publishStoredMetrics');
      metrics.addMetric('successfulBooking', MetricUnit.Count, 1);

      // Act
      metrics[Symbol.dispose]();

      // Assess
      expect(metrics.publishStoredMetrics).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledTimes(1);
    });
  }
);
