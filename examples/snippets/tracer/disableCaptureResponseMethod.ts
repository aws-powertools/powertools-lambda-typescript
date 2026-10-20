import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Tracer } from '@aws-lambda-powertools/tracer';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });

class Lambda implements LambdaInterface {
  @tracer.captureMethod({ captureResponse: false })
  public async getChargeId(): Promise<string> {
    /* ... */
    return 'foo bar';
  }

  public async handler(_event: unknown, _context: unknown): Promise<void> {
    /* ... */
  }
}

const handlerClass = new Lambda();
export const handler = handlerClass.handler.bind(handlerClass);
