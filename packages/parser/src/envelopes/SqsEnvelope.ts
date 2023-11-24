import { z, ZodSchema } from 'zod';
import { SqsSchema } from '../schemas/sqs.js';
import { Envelope } from './Envelope.js';

class SqsEnvelope extends Envelope {
  public constructor() {
    super();
  }

  public parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T>[] {
    if (typeof data !== 'object') {
      throw new Error('Data must be an object');
    }

    if (!schema) {
      throw new Error('Schema must be provided');
    }
    const parsedEnvelope = SqsSchema.parse(data);

    return parsedEnvelope.Records.map((record) => {
      const body = JSON.parse(record.body);

      return schema.parse(body);
    });
  }
}

class Envelopes {
  public static readonly SQS_ENVELOPE = new SqsEnvelope();
}

export { SqsEnvelope, Envelopes };
