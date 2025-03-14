import { Logger } from '@aws-lambda-powertools/logger';
import { validate } from '@aws-lambda-powertools/validation';
import { SchemaValidationError } from '@aws-lambda-powertools/validation/errors';
import { type InboundSchema, inboundSchema } from './schemas.js';

const logger = new Logger();

export const handler = async (event: InboundSchema) => {
  try {
    validate({
      payload: event,
      schema: inboundSchema,
    });

    return {
      message: 'ok', // (1)!
    };
  } catch (error) {
    if (error instanceof SchemaValidationError) {
      logger.error('Schema validation failed', error);
      throw new Error('Invalid event payload');
    }

    throw error;
  }
};
