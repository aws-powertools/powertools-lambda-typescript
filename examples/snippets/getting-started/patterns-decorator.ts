import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import type { Context } from 'aws-lambda';

const logger = new Logger();
const tracer = new Tracer();
const metrics = new Metrics();

class Lambda implements LambdaInterface {
  @tracer.captureLambdaHandler()
  @logger.injectLambdaContext()
  @metrics.logMetrics()
  async handler(_event: unknown, _context: Context) {
    // Your business logic here
  }
}
const lambda = new Lambda();
export const handler = lambda.handler.bind(lambda);
