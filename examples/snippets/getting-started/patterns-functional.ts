import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import type { Context } from 'aws-lambda';

const logger = new Logger();
const tracer = new Tracer();
const metrics = new Metrics();

export const handler = async (event: unknown, context: Context) => {
  logger.addContext(context);
  logger.logEventIfEnabled(event);

  const subsegment = tracer.getSegment()?.addNewSubsegment('#### handler');

  try {
    // Your business logic here
    throw new Error('An error occurred');
  } catch (error) {
    logger.error('Error occurred', { error });
    tracer.addErrorAsMetadata(error);
    throw error;
  } finally {
    subsegment?.close();
    metrics.publishStoredMetrics();
  }
};
