import { Tracer } from '@aws-lambda-powertools/tracer';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });

class Lambda implements LambdaInterface {
    @tracer.captureMethod({ captureResult: false })
    public getChargeId(): string {
        /* ... */
        return 'foo bar';
    }

    public async handler(_event: any, _context: any): Promise<void> {
        /* ... */
    }
}

const handlerClass = new Lambda();
export const handler = handlerClass.handler.bind(handlerClass);