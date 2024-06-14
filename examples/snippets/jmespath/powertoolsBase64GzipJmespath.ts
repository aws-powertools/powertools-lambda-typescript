import { extractDataFromEnvelope } from '@aws-lambda-powertools/jmespath/envelopes';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger();

export const handler = async (event: { payload: string }): Promise<void> => {
  const logGroup = extractDataFromEnvelope<string>(
    event, // (1)!
    'powertools_base64_gzip(payload) | powertools_json(@).logGroup'
  );

  logger.info('Log group name', { logGroup }); // (2)!
};
