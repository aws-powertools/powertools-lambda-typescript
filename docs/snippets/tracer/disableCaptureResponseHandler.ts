import { Tracer } from '@aws-lambda-powertools/tracer';
import { LambdaInterface } from '@aws-lambda-powertools/commons';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });

class Lambda implements LambdaInterface {
    @tracer.captureLambdaHandler({ captureResponse: false })
    async handler(_event: any, _context: any): Promise<void> {
        /* ... */
    }
}

const handlerClass = new Lambda();
export const handler = handlerClass.handler.bind(handlerClass);