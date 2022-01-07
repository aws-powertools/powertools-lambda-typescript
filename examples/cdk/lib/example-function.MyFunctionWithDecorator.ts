import { Tracer } from '@aws-lambda-powertools/tracer';
import { Callback, Context } from 'aws-lambda';
import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
import { Logger } from '@aws-lambda-powertools/logger';

const namespace = 'CDKExample';
const serviceName = 'MyFunctionWithDecorator';

const metrics = new Metrics({ namespace: namespace, service: serviceName });
const logger = new Logger({ logLevel: 'INFO', serviceName: serviceName });
const tracer = new Tracer({ serviceName: serviceName });

export class MyFunctionWithDecorator {
  @tracer.captureLambdaHanlder()
  @logger.injectLambdaContext()
  @metrics.logMetrics({
    captureColdStartMetric: true,
    throwOnEmptyMetrics: true,
    defaultDimensions: { environment: 'example', type: 'withDecorator' },
  })
  public handler(_event: unknown, _context: Context, _callback: Callback<unknown>): void | Promise<unknown> {
    // ### Experiment logger
    logger.addPersistentLogAttributes({
      testKey: 'testValue',
    });
    logger.debug('This is an DEBUG log'); // Won't show by default
    logger.info('This is an INFO log');
    logger.warn('This is an WARN log');
    logger.error('This is an ERROR log');

    // ### Experiment metrics
    metrics.addMetric('test-metric', MetricUnits.Count, 10);

    const metricWithItsOwnDimensions = metrics.singleMetric();
    metricWithItsOwnDimensions.addDimension('InnerDimension', 'true');
    metricWithItsOwnDimensions.addMetric('single-metric', MetricUnits.Percent, 50);

    // ### Experiment tracer
    tracer.putAnnotation('Myannotation', 'My annotation\'s value');

    // Create subsegment & set it as active
    const segment = tracer.getSegment(); // This is the facade segment (the one that is created by Lambda & that can't be manipulated)
    const subsegment = segment.addNewSubsegment('MySubSegment');

    tracer.setSegment(subsegment);
    // TODO: Add the ColdStart annotation !!! NOT POSSIBLE
    // tracer.putAnnotation('ColdStart', tracer);

    try {
      throw new Error('test');
      // Add the response as metadata
    } catch (err) {
      // Add the error as metadata
      subsegment.addError(err as Error, false);
    }

    // Close subsegment
    subsegment.close();
  }
}

export const handlerClass = new MyFunctionWithDecorator();
export const handler = handlerClass.handler;
