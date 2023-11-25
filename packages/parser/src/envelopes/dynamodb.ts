import { Envelope } from './Envelope.js';
import { z, ZodSchema } from 'zod';
import { DynamoDBStreamSchema } from '../schemas/dynamodb.js';

type DynamoDBStreamEnvelopeResponse<T extends ZodSchema> = {
  NewImage: z.infer<T>;
  OldImage: z.infer<T>;
};

/**
 * DynamoDB Stream Envelope to extract data within NewImage/OldImage
 *
 * Note: Values are the parsed models. Images' values can also be None, and
 * length of the list is the record's amount in the original event.
 */
export class DynamoDBStreamEnvelope extends Envelope {
  public constructor() {
    super();
  }

  public parse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): DynamoDBStreamEnvelopeResponse<T>[] {
    const parsedEnvelope = DynamoDBStreamSchema.parse(data);

    return parsedEnvelope.Records.map((record) => {
      return {
        NewImage: this._parse(record.dynamodb.NewImage, schema),
        OldImage: this._parse(record.dynamodb.OldImage, schema),
      };
    });
  }
}
