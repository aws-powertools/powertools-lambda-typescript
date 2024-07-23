import {
  SQS,
  extractDataFromEnvelope,
} from '@aws-lambda-powertools/jmespath/envelopes';
import { Logger } from '@aws-lambda-powertools/logger';
import type { SQSEvent } from 'aws-lambda';

const logger = new Logger();

type MessageBody = {
  customerId: string;
};

export const handler = async (event: SQSEvent): Promise<void> => {
  const records = extractDataFromEnvelope<Array<MessageBody>>(event, SQS);
  for (const record of records) {
    // records is now a list containing the deserialized body of each message
    const { customerId } = record;
    logger.appendKeys({ customerId });
  }
};
