import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
  defaultDimensions: { environment: 'prod' },
});

export const handler = async () => {
  // Add a single dimension to the default dimension set
  metrics.addDimension('region', 'us-west-2');

  // Add a new dimension set
  metrics.addDimensions({
    dimension1: '1',
    dimension2: '2',
  });

  // Add another dimension set (addDimensionSet is an alias for addDimensions)
  metrics.addDimensionSet({
    feature: 'booking',
    version: 'v1',
  });

  // This will create three dimension sets in the EMF output:
  // [["service", "environment", "region"]],
  // [["service", "dimension1", "dimension2"]], and
  // [["service", "feature", "version"]]
  metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
  metrics.publishStoredMetrics();
};
