import { Logger } from '@aws-lambda-powertools/logger';

// With this logger, all the INFO logs will be printed
const logger = new Logger({
    logLevel: 'INFO'
});

// With this logger, only the ERROR logs will be printed
const childLogger = logger.createChild({
    logLevel: 'ERROR'
});

export const handler = async (_event: any, _context: any): Promise<void> => {

    logger.info('This is an INFO log, from the parent logger');
    logger.error('This is an ERROR log, from the parent logger');
    
    childLogger.info('This is an INFO log, from the child logger');
    childLogger.error('This is an ERROR log, from the child logger');

};