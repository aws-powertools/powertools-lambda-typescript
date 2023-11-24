import { z, ZodSchema } from 'zod';
import { SqsSchema } from '../schemas/sqs.js';
import { Envelope } from './Envelope.js';

class SqsEnvelope extends Envelope {
  public static parse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): z.infer<T>[] {
    const parsedEnvelope = SqsSchema.parse(data);

    return parsedEnvelope.Records.map((record) => {
      const body = JSON.parse(record.body);

      return this._parse(body, schema);
    });
  }
}

export { SqsEnvelope };
