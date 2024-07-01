import { z } from 'zod';

const DynamoDBStreamChangeRecord = z.object({
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
  Records: z.array(DynamoDBStreamRecord),
});

export {
  DynamoDBStreamSchema,
  DynamoDBStreamRecord,
  DynamoDBStreamChangeRecord,
  UserIdentity,
};
