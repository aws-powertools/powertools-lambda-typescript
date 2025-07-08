import { Logger } from '@aws-lambda-powertools/logger';
import { search } from '@aws-lambda-powertools/logger/correlationId';

const _logger = new Logger({
  correlationIdSearchFn: search,
});
