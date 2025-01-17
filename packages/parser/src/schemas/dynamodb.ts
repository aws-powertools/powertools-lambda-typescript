import { unmarshallDynamoDB } from '@aws-lambda-powertools/commons/utils/unmarshallDynamoDB';
import { z } from 'zod';

const DynamoDBStreamChangeRecordBase = z.object({
  ApproximateCreationDateTime: z.number().optional(),
  Keys: z.record(z.string(), z.record(z.string(), z.any())),
  NewImage: z.record(z.string(), z.any()).optional(),
  OldImage: z.record(z.string(), z.any()).optional(),
  SequenceNumber: z.string(),
  SizeBytes: z.number(),
  StreamViewType: z.enum([
    'NEW_IMAGE',
    'OLD_IMAGE',
    'NEW_AND_OLD_IMAGES',
    'KEYS_ONLY',
  ]),
});

const DynamoDBStreamChangeRecord = DynamoDBStreamChangeRecordBase.transform(
  (object, ctx) => {
    const result = { ...object };

    const unmarshallAttributeValue = (
      imageName: 'NewImage' | 'OldImage' | 'Keys',
      image: Record<string, unknown>
    ) => {
      try {
        // @ts-expect-error
        return unmarshallDynamoDB(image) as Record<string, unknown>;
      } catch (err) {
        ctx.addIssue({
          code: 'custom',
          message: `Could not unmarshall ${imageName} in DynamoDB stream record`,
          fatal: true,
          path: [imageName],
        });
        return z.NEVER;
      }
    };

    const unmarshalledKeys = unmarshallAttributeValue('Keys', object.Keys);
    if (unmarshalledKeys === z.NEVER) return z.NEVER;
    // @ts-expect-error - We are intentionally mutating the object
    result.Keys = unmarshalledKeys;

    if (object.NewImage) {
      const unmarshalled = unmarshallAttributeValue(
        'NewImage',
        object.NewImage
      );
      if (unmarshalled === z.NEVER) return z.NEVER;
      result.NewImage = unmarshalled;
    }

    if (object.OldImage) {
      const unmarshalled = unmarshallAttributeValue(
        'OldImage',
        object.OldImage
      );
      if (unmarshalled === z.NEVER) return z.NEVER;
      result.OldImage = unmarshalled;
    }

    return result;
  }
);

const UserIdentity = z.object({
  type: z.enum(['Service']),
  principalId: z.literal('dynamodb.amazonaws.com'),
});

const DynamoDBStreamRecord = z.object({
  eventID: z.string(),
  eventName: z.enum(['INSERT', 'MODIFY', 'REMOVE']),
  eventVersion: z.string(),
  eventSource: z.literal('aws:dynamodb'),
  awsRegion: z.string(),
  eventSourceARN: z.string(),
  dynamodb: DynamoDBStreamChangeRecord,
  userIdentity: UserIdentity.optional(),
});

const DynamoDBStreamToKinesisRecord = DynamoDBStreamRecord.extend({
  recordFormat: z.literal('application/json'),
  tableName: z.string(),
  userIdentity: UserIdentity.nullish(),
  dynamodb: DynamoDBStreamChangeRecordBase.omit({
    SequenceNumber: true,
    StreamViewType: true,
  }),
}).omit({
  eventVersion: true,
  eventSourceARN: true,
});

/**
 * Zod schema for Amazon DynamoDB Stream event.
 *
 * @example
 * ```json
 * {
 *   "Records": [
 *     {
 *       "eventID": "1",
 *       "eventVersion": "1.0",
 *       "dynamodb": {
 *         "ApproximateCreationDateTime": 1693997155.0,
 *         "Keys": {
 *           "Id": {
 *             "N": "101"
 *           }
 *         },
 *         "NewImage": {
 *           "Message": {
 *             "S": "New item!"
 *           },
 *           "Id": {
 *             "N": "101"
 *           }
 *         },
 *         "StreamViewType": "NEW_AND_OLD_IMAGES",
 *         "SequenceNumber": "111",
 *         "SizeBytes": 26
 *       },
 *       "awsRegion": "us-west-2",
 *       "eventName": "INSERT",
 *       "eventSourceARN": "eventsource_arn",
 *       "eventSource": "aws:dynamodb"
 *     },
 *     {
 *       "eventID": "2",
 *       "eventVersion": "1.0",
 *       "dynamodb": {
 *         "OldImage": {
 *           "Message": {
 *             "S": "New item!"
 *           },
 *           "Id": {
 *             "N": "101"
 *           }
 *         },
 *         "SequenceNumber": "222",
 *         "Keys": {
 *           "Id": {
 *             "N": "101"
 *           }
 *         },
 *         "SizeBytes": 59,
 *         "NewImage": {
 *           "Message": {
 *             "S": "This item has changed"
 *           },
 *           "Id": {
 *             "N": "101"
 *           }
 *         },
 *         "StreamViewType": "NEW_AND_OLD_IMAGES"
 *       },
 *       "awsRegion": "us-west-2",
 *       "eventName": "MODIFY",
 *       "eventSourceARN": "source_arn",
 *       "eventSource": "aws:dynamodb"
 *     }
 *   ]
 * }
 * ```
 *
 * @see {@link types.DynamoDBStreamEvent | DynamoDBStreamEvent}
 * @see {@link https://docs.aws.amazon.com/lambda/latest/dg/with-ddb.html}
 */
const DynamoDBStreamSchema = z.object({
  Records: z.array(DynamoDBStreamRecord).min(1),
});

export {
  DynamoDBStreamToKinesisRecord,
  DynamoDBStreamSchema,
  DynamoDBStreamRecord,
  DynamoDBStreamChangeRecord,
  UserIdentity,
};
