import { z, ZodSchema } from 'zod';
import { SqsSchema } from '../schemas/sqs.js';
import { Envelope } from './Envelope.js';

/**
 *  SQS Envelope to extract array of Records
 *
 *  The record's body parameter is a string, though it can also be a JSON encoded string.
 *  Regardless of its type it'll be parsed into a BaseModel object.
 *
 *  Note: Records will be parsed the same way so if model is str,
 *  all items in the list will be parsed as str and npt as JSON (and vice versa)
 */
export class SqsEnvelope extends Envelope {
  public constructor() {
    super();
  }

  public parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T>[] {
    const parsedEnvelope = SqsSchema.parse(data);

    return parsedEnvelope.Records.map((record) => {
      return this._parse(record.body, schema);
    });
  }
}
