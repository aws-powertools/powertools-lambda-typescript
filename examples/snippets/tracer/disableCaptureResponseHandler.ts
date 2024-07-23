import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Tracer } from '@aws-lambda-powertools/tracer';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });

class Lambda implements LambdaInterface {
  @tracer.captureLambdaHandler({ captureResponse: false })
  public async handler(_event: unknown, _context: unknown): Promise<void> {
    tracer.getSegment();
  }
}

const handlerClass = new Lambda();
export const handler = handlerClass.handler.bind(handlerClass);
