import { Logger } from '@aws-lambda-powertools/logger';
import { validate } from '@aws-lambda-powertools/validation';
import { SchemaValidationError } from '@aws-lambda-powertools/validation/errors';
import Ajv2019 from 'ajv/dist/2019';
import { inboundSchema } from './schemas.js';

const logger = new Logger();

const ajv = new Ajv2019();

export const handler = async (event: unknown) => {
  try {
    await validate({
      payload: event,
      schema: inboundSchema,
      ajv, // (1)!
    });

    return {
      message: 'ok',
    };
  } catch (error) {
    if (error instanceof SchemaValidationError) {
      logger.error('Schema validation failed', error);
      throw new Error('Invalid event payload');
    }

    throw error;
  }
};
