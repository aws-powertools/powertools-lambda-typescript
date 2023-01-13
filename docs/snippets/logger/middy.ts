import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger';
import middy from '@middy/core';

const logger = new Logger();

const lambdaHandler = async (_event: any, _context: any): Promise<void> => {
    logger.info('This is an INFO log with some context');
};

export const handler = middy(lambdaHandler)
    .use(injectLambdaContext(logger));