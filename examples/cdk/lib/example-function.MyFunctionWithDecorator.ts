import { Tracer } from '@aws-lambda-powertools/tracer';
import { Context } from 'aws-lambda';
import { Events, LambdaInterface } from '@aws-lambda-powertools/commons';
import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
import { Logger } from '@aws-lambda-powertools/logger';

const namespace = 'CDKExample';
const serviceName = 'MyFunctionWithDecorator';

const metrics = new Metrics({ namespace: namespace, serviceName: serviceName });
const logger = new Logger({ logLevel: 'INFO', serviceName: serviceName });
const tracer = new Tracer({ serviceName: serviceName });

export class MyFunctionWithDecorator implements LambdaInterface {
  // We decorate the handler with the various decorators
  @tracer.captureLambdaHandler()
  @logger.injectLambdaContext()
  @metrics.logMetrics({
    captureColdStartMetric: true,
    throwOnEmptyMetrics: true,
    defaultDimensions: { environment: 'example', type: 'withDecorator' },
  })
  public async handler(event: typeof Events.Custom.CustomEvent, context: Context): Promise<unknown> {
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

    // Service & Cold Start annotations will be added for you by the decorator/middleware

    // These traces will be added to the main segment (## index.handler)
    tracer.putAnnotation('awsRequestId', context.awsRequestId);
    tracer.putMetadata('eventPayload', event);

    // Create another subsegment & set it as active
    const handlerSegment = tracer.getSegment(); // This is the custom segment created by Tracer for you (## index.handler)
    const subsegment = handlerSegment.addNewSubsegment('### MySubSegment');
    tracer.setSegment(subsegment);

    let res;
    try {
      res = { foo: 'bar' };
    } catch (err) {
      throw err;
    } finally {
      // Close the subsegment you created (### MySubSegment)
      subsegment.close();
      // Set back the original segment as active (## index.handler)
      tracer.setSegment(handlerSegment);
      // The main segment (facade) will be closed for you at the end by the decorator/middleware
    }
    
    return res;
  }
}

export const myFunction = new MyFunctionWithDecorator();
export const handler = myFunction.handler;
