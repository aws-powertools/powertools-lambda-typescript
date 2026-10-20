import { Logger } from '@aws-lambda-powertools/logger';

// Logger parameters fetched from the environment variables (see template.yaml tab)
const logger = new Logger();
logger.info('Hello World');

// You can also pass the parameters in the constructor
// const logger = new Logger({
//     logLevel: 'WARN',
//     serviceName: 'serverlessAirline'
// });
