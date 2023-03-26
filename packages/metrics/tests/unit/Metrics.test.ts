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

    test('when called with multiple metric name, it should store multiple metrics', () => {
      
      //Prepare
      const metrics = new Metrics();

      //Act
      metrics.addMetric('test_metric-1', MetricUnits.Count, 1, MetricResolution.High);
      metrics.addMetric('test_metric-2', MetricUnits.Count, 3, MetricResolution.High);
      metrics.addMetric('test_metric-3', MetricUnits.Count, 6, MetricResolution.High);

      // Assess
      expect(metrics).toEqual(expect.objectContaining({
        storedMetrics: {
          'test_metric-1': {
            name: 'test_metric-1',
            resolution: MetricResolution.High,
            unit: MetricUnits.Count,
            value: 1
          },
          'test_metric-2': {
            name: 'test_metric-2',
            resolution: MetricResolution.High,
            unit: MetricUnits.Count,
            value: 3
          },
          'test_metric-3': {
            name: 'test_metric-3',
            resolution: MetricResolution.High,
            unit: MetricUnits.Count,
            value: 6
          }
        },
      }));
    });

    test('when called without resolution, it should store metrics with standard resolution', () => {
   
      //Prepare
      const metrics = new Metrics();

      //Act
      metrics.addMetric('test-metric-1', MetricUnits.Count, 1);
      metrics.addMetric('test-metric-2', MetricUnits.Seconds, 3);

      // Assess
      expect(metrics).toEqual(expect.objectContaining({
        storedMetrics: {
          'test-metric-1': {
            name: 'test-metric-1',
            resolution: MetricResolution.Standard,
            unit: MetricUnits.Count,
            value: 1
          },
          'test-metric-2': {
            name: 'test-metric-2',
            resolution: MetricResolution.Standard,
            unit: MetricUnits.Seconds,
            value: 3
          }
        },
      }));
    });

    test('when trying to add metric with the same name multiple times, values should be grouped together in an array', () => {

      //Prepare
      const metrics = new Metrics();
      const metricName = 'test-metric';

      //Act
      metrics.addMetric(metricName, MetricUnits.Count, 1);
      metrics.addMetric(metricName, MetricUnits.Count, 5);
      metrics.addMetric(metricName, MetricUnits.Count, 1);
      metrics.addMetric(metricName, MetricUnits.Count, 4);
      
      // Assess
      expect(metrics).toEqual(expect.objectContaining({
        storedMetrics: {
          [metricName]: {
            name: metricName,
            resolution: MetricResolution.Standard,
            unit: MetricUnits.Count,
            value: [ 1, 5, 1, 4 ]
          }
        },
      }));
    });

    test('when trying to add metric with the same name multiple times but with different unit, it will throw an error', () => {

      //Prepare
      const metrics = new Metrics();
      const metricName = 'test-metric';

      // Act & Assess
      expect(() => {
        metrics.addMetric(metricName, MetricUnits.Count, 1);
        metrics.addMetric(metricName, MetricUnits.Kilobits, 5);
      }).toThrowError(Error);
      
    });

  });
});
