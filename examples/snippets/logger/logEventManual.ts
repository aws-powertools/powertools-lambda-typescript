process.env.POWERTOOLS_LOGGER_LOG_EVENT = 'true';

import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger();

export const handler = async (event: unknown) => {
  logger.logEventIfEnabled(event); // (1)
  // ... your handler code
};
