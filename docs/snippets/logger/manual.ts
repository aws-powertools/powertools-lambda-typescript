import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger();

export const handler = async (_event, context): Promise<void> => {

  logger.addContext(context);
    
  logger.info('This is an INFO log with some context');

};