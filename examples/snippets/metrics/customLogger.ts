import { Logger, LogLevel } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';

const logger = new Logger({ logLevel: LogLevel.CRITICAL });
const metrics = new Metrics({
  serviceName: 'serverless-airline',
  namespace: 'orders',
  singleMetric: true,
  logger,
});

metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
