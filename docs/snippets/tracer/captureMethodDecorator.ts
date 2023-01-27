import { Tracer } from '@aws-lambda-powertools/tracer';
import { LambdaInterface } from '@aws-lambda-powertools/commons';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });

class Lambda implements LambdaInterface {
    // Decorate your class method
    @tracer.captureMethod() // (1)
    public async getChargeId(): Promise<string> {
        /* ... */
        return 'foo bar';
    }

    public async handler(_event: any, _context: any): Promise<void> {
        /* ... */
    }
}
 
const handlerClass = new Lambda();
export const handler = handlerClass.handler.bind(handlerClass); // (2)