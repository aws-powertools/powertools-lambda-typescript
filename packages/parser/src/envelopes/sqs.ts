import { ZodSchema } from 'zod';
import { SqsSchema } from '../schemas/sqs.js';

class SqsEnvelope {
  public parse<T extends ZodSchema>(data: unknown, schema: T): unknown[] {
    const parsedEnvelope = SqsSchema.parse(data);

    return parsedEnvelope.Records.map((record) => {
      const body = JSON.parse(record.body);

      return schema.parse(body);
    });
  }
}

export { SqsEnvelope };
