import { z, ZodSchema } from 'zod';
import { Envelope } from './Envelope.js';
import { SnsNotificationSchema, SnsSchema } from '../schemas/sns.js';
import { SqsSchema } from '../schemas/sqs.js';

/**
 * SNS Envelope to extract array of Records
 *
 * The record's body parameter is a string, though it can also be a JSON encoded string.
 * Regardless of its type it'll be parsed into a BaseModel object.
 *
 * Note: Records will be parsed the same way so if model is str,
 * all items in the list will be parsed as str and npt as JSON (and vice versa)
 */
export class SnsEnvelope extends Envelope {
  public constructor() {
    super();
  }

  public parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T> {
    const parsedEnvelope = SnsSchema.parse(data);

    return parsedEnvelope.Records.map((record) => {
      return this._parse(record.Sns.Message, schema);
    });
  }
}

/**
 *  SNS plus SQS Envelope to extract array of Records
 *
 *  Published messages from SNS to SQS has a slightly different payload.
 *  Since SNS payload is marshalled into `Record` key in SQS, we have to:
 *
 *  1. Parse SQS schema with incoming data
 *  2. Unmarshall SNS payload and parse against SNS Notification schema not SNS/SNS Record
 *  3. Finally, parse provided model against payload extracted
 *
 */
export class SnsSqsEnvelope extends Envelope {
  public constructor() {
    super();
  }

  public parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T> {
    const parsedEnvelope = SqsSchema.parse(data);

    return parsedEnvelope.Records.map((record) => {
      const snsNotification = SnsNotificationSchema.parse(record.body);

      return this._parse(snsNotification, schema);
    });
  }
}
