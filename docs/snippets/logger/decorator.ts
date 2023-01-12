import { Logger } from '@aws-lambda-powertools/logger';
import { LambdaInterface } from '@aws-lambda-powertools/commons';

const logger = new Logger();

class Lambda implements LambdaInterface {
    // Decorate your handler class method
    @logger.injectLambdaContext()
    public async handler(_event: any, _context: any): Promise<void> {
        logger.info('This is an INFO log with some context');
    }

}

const myFunction = new Lambda();
export const handler = myFunction.handler.bind(myFunction); // (1)