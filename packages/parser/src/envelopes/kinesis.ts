import { Envelope } from './Envelope.js';
import { z, ZodSchema } from 'zod';
import { KinesisDataStreamSchema } from '../schemas/kinesis.js';

/**
 * Kinesis Data Stream Envelope to extract array of Records
 *
 * The record's data parameter is a base64 encoded string which is parsed into a bytes array,
 * though it can also be a JSON encoded string.
 * Regardless of its type it'll be parsed into a BaseModel object.
 *
 * Note: Records will be parsed the same way so if model is str,
 * all items in the list will be parsed as str and not as JSON (and vice versa)
 */
export class KinesisEnvelope extends Envelope {
  public constructor() {
    super();
  }

  public parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T> {
    const parsedEnvelope = KinesisDataStreamSchema.parse(data);

    return parsedEnvelope.Records.map((record) => {
      return this._parse(record.kinesis.data, schema);
    });
  }
}
