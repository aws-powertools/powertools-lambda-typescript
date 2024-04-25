import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';

const serviceName = 'serverlessAirline';
const logger = new Logger({ serviceName: serviceName });
const tracer = new Tracer({ serviceName: serviceName });
tracer.provider.setLogger(logger);
