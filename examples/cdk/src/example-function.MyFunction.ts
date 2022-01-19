import { Context } from 'aws-lambda';
import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';

const namespace = 'CDKExample';
const serviceName = 'MyFunctionWithStandardHandler';

const metrics = new Metrics({ namespace: namespace, serviceName: serviceName });
const logger = new Logger({ logLevel: 'INFO', serviceName: serviceName });
const tracer = new Tracer({ serviceName: serviceName });

export const handler = async (event: unknown, context: Context): Promise<void> => {
  // Since we are in manual mode we need to create the handler segment (the 4 lines below would be done for you by decorator/middleware)
  // we do it at the beginning because we want to trace the whole duration of the handler
  const segment = tracer.getSegment(); // This is the facade segment (the one that is created by AWS Lambda)
  // Create subsegment for the function & set it as active
  const handlerSegment = segment.addNewSubsegment(`## ${process.env._HANDLER}`);
  tracer.setSegment(handlerSegment);

  // Annotate the subsegment with the cold start & serviceName
  tracer.annotateColdStart();
  tracer.addServiceNameAnnotation();

  // ### Experiment with Logger
  logger.addContext(context);
  logger.addPersistentLogAttributes({
    testKey: 'testValue',
  });
  logger.debug('This is an DEBUG log'); // Won't show by default
  logger.info('This is an INFO log');
  logger.warn('This is an WARN log');
  logger.error('This is an ERROR log');

  // ### Experiment with Metrics
  metrics.captureColdStartMetric();
  metrics.throwOnEmptyMetrics();
  metrics.setDefaultDimensions({ environment: 'example', type: 'standardFunction' });
  metrics.addMetric('test-metric', MetricUnits.Count, 10);

  const metricWithItsOwnDimensions = metrics.singleMetric();
  metricWithItsOwnDimensions.addDimension('InnerDimension', 'true');
  metricWithItsOwnDimensions.addMetric('single-metric', MetricUnits.Percent, 50);

  metrics.publishStoredMetrics();
  metrics.throwOnEmptyMetrics();

  // ### Experiment with Tracer
  // This annotation & metadata will be added to the handlerSegment subsegment (## index.handler)
  tracer.putAnnotation('awsRequestId', context.awsRequestId);
  tracer.putMetadata('eventPayload', event);

  // Create another subsegment & set it as active
  const subsegment = handlerSegment.addNewSubsegment('### MySubSegment');
  tracer.setSegment(subsegment);

  let res;
  try {
    res = { foo: 'bar' };
    tracer.addResponseAsMetadata(res, process.env._HANDLER);
  } catch (err) {
    // Add the error as metadata
    subsegment.addError(err as Error, false);
    throw err;
  } finally {
    // Close subsegments (the AWS Lambda one is closed automatically)
    subsegment.close(); // (### MySubSegment)
    handlerSegment.close(); // (## index.handler)
    // Set the facade segment as active again (the one created by AWS Lambda)
    tracer.setSegment(segment);
  }

};
