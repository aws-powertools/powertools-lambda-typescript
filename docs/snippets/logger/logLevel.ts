import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger();

logger.getLevelName(); // returns "INFO"
logger.setLogLevel('DEBUG');
logger.level; // returns 8
