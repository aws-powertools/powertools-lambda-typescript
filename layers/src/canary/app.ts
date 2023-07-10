import { Context } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';

const logger = new Logger();
const tracer = new Tracer();
const metrics = new Metrics({});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ssmProvider = new SSMProvider();

export const handler = async (
  _event: unknown,
  _context: Context
): Promise<void> => {
  logger.info('Hello, world!');
  metrics.addMetric('MyMetric', MetricUnits.Count, 1);
  tracer.annotateColdStart();
};
