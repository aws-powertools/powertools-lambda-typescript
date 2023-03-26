/**
 * Test Metrics class
 *
 * @group unit/metrics/class
 */

import { MetricResolution, MetricUnits, Metrics } from '../../src/';

describe('Class: Metrics', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeAll(() => {
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  describe('Method: addMetric', () => {
    
    test('when called, it should store metrics', () => {
      
      //Prepare
      const metrics = new Metrics();
      const metricName = 'test_metric';

      //Act
      metrics.addMetric(metricName, MetricUnits.Count, 1, MetricResolution.High);

      // Assess
      expect(metrics).toEqual(expect.objectContaining({
        storedMetrics: {
          [metricName]: {
            name: metricName,
            resolution: MetricResolution.High,
            unit: MetricUnits.Count,
            value: 1
          }
        },
      }));
    });

  });
});
