import { search } from '@aws-lambda-powertools/jmespath';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({
  correlationIdSearchFn: search,
});
