import { Context } from 'aws-lambda';
import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';

const namespace = 'CDKExample';
const serviceName = 'MyFunctionWithStandardHandler';

const metrics = new Metrics({ namespace: namespace, service: serviceName });
const logger = new Logger({ logLevel: 'INFO', serviceName: serviceName });
const tracer = new Tracer({ serviceName: serviceName });

export const handler = async (_event: unknown, context: Context): Promise<void> => {
  // Since we are in manual mode we need to create the handler segment (the 4 lines below would be done for you by decorator/middleware)
  // we do it at the beginning because we want to trace the whole duration of the handler
  const segment = tracer.getSegment(); // This is the facade segment (the one that is created by Lambda & that can't be manipulated)
  const handlerSegment = segment.addNewSubsegment(`## ${context.functionName}`);
  // TODO: expose tracer.annotateColdStart()
  tracer.putAnnotation('ColdStart', Tracer.coldStart);

  // ### Experiment logger
  logger.addPersistentLogAttributes({
    testKey: 'testValue',
  });
  logger.debug('This is an DEBUG log'); // Won't show by default
  logger.info('This is an INFO log');
  logger.warn('This is an WARN log');
  logger.error('This is an ERROR log');

  // ### Experiment metrics
  metrics.captureColdStartMetric();
  metrics.raiseOnEmptyMetrics();
  metrics.setDefaultDimensions({ environment: 'example', type: 'standardFunction' });
  metrics.addMetric('test-metric', MetricUnits.Count, 10);

  const metricWithItsOwnDimensions = metrics.singleMetric();
  metricWithItsOwnDimensions.addDimension('InnerDimension', 'true');
  metricWithItsOwnDimensions.addMetric('single-metric', MetricUnits.Percent, 50);

  metrics.purgeStoredMetrics();
  metrics.raiseOnEmptyMetrics();

  // ### Experiment tracer

  tracer.putAnnotation('Myannotation', 'My annotation\'s value');

  // Create subsegment & set it as active
  const subsegment = handlerSegment.addNewSubsegment('MySubSegment');

  try {
    throw new Error('test');
    // Add the response as metadata
  } catch (err) {
    // Add the error as metadata
    subsegment.addError(err as Error, false);
  }

  // Close subsegment
  subsegment.close();
  handlerSegment.close();
};
