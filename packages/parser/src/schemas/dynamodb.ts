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

const DynamoDBStreamSchema = z.object({
  Records: z.array(DynamoDBStreamRecord),
});

export {
  DynamoDBStreamSchema,
  DynamoDBStreamRecord,
  DynamoDBStreamChangeRecord,
  UserIdentity,
};
