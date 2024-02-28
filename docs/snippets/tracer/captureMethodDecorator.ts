import { Tracer } from '@aws-lambda-powertools/tracer';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });

class Lambda implements LambdaInterface {
  // Decorate your class method
  @tracer.captureMethod() // (1)
  public async getChargeId(): Promise<string> {
    /* ... */
    return 'foo bar';
  }

  public async handler(_event: unknown, _context: unknown): Promise<void> {
    await this.getChargeId();
  }
}

const handlerClass = new Lambda();
export const handler = handlerClass.handler.bind(handlerClass); // (2)
