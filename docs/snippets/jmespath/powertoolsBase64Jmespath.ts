import { extractDataFromEnvelope } from '@aws-lambda-powertools/jmespath/envelopes';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger();

export const handler = async (event: { payload: string }): Promise<void> => {
  const data = extractDataFromEnvelope<string>(
    event,
    'powertools_json(powertools_base64(payload))'
  );

  logger.info('Decoded payload', { data });
};
