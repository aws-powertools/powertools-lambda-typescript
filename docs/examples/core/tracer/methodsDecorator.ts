import { Tracer } from '@aws-lambda-powertools/tracer';
import { LambdaInterface } from '@aws-lambda-powertools/commons';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });

class Lambda implements LambdaInterface {
  // Decorate your class method
  @tracer.captureMethod()
  public getChargeId(): string {
    /* ... */
    return 'foo bar';
  }

  public async handler(_event: any, _context: any): Promise<void> {
    /* ... */
  }
}

export const myFunction = new Lambda();
export const handler = myFunction.handler; 
