import { Logger } from '@aws-lambda-powertools/logger';
import { PT_VERSION as version } from '@aws-lambda-powertools/commons';
import { serviceName, defaultValues } from './constants.js';

/**
 * Create logger instance with centralized configuration so that
 * all functions have consistent logging behavior.
 */
const logger = new Logger({
  logLevel: 'debug',
  serviceName,
  persistentLogAttributes: {
    ...defaultValues,
    region: process.env.AWS_REGION || 'N/A',
    logger: {
      name: '@aws-lambda-powertools/logger',
      version,
    },
  },
});

export { logger };
