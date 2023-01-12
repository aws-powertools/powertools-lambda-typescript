import { Tracer } from '@aws-lambda-powertools/tracer';
import { LambdaInterface } from '@aws-lambda-powertools/commons';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });

class Lambda implements LambdaInterface {
    // Decorate your handler class method
    @tracer.captureLambdaHandler()
    public async handler(_event: any, _context: any): Promise<void> {
        /* ... */
    }
}
 
const handlerClass = new Lambda();
export const handler = handlerClass.handler.bind(handlerClass); // (1)