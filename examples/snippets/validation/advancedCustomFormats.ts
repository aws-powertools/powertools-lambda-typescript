import { Logger } from '@aws-lambda-powertools/logger';
import { validate } from '@aws-lambda-powertools/validation';
import { SchemaValidationError } from '@aws-lambda-powertools/validation/errors';
import schemaWithCustomFormat from './samples/schemaWithCustomFormat.json';

const logger = new Logger();

const customFormats = {
  awsaccountid: /^\d{12}$/,
  creditcard: (value: string) => {
    // Luhn algorithm (for demonstration purposes only - do not use in production)
    const sum = value
      .split('')
      .reverse()
      .reduce((acc, digit, index) => {
        const num = Number.parseInt(digit, 10);
        return acc + (index % 2 === 0 ? num : num < 5 ? num * 2 : num * 2 - 9);
      }, 0);

    return sum % 10 === 0;
  },
};

export const handler = async (event: unknown) => {
  try {
    await validate({
      payload: event,
      schema: schemaWithCustomFormat,
      formats: customFormats,
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
