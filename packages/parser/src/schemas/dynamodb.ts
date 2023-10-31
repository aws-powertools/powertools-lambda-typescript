import {z} from 'zod';

const DynamoDBStreamChangeRecordSchema = z.object({
  ApproximateCreationDateTime: z.optional(z.number()),
  Keys: z.record(z.string(), z.record(z.string(), z.any())),
  NewImage: z.optional(z.record(z.string(), z.any())),
  OldImage: z.optional(z.record(z.string(), z.any())),
  SequenceNumber: z.string(),
  SizeBytes: z.number(),
  StreamViewType: z.enum([
    'NEW_IMAGE',
    'OLD_IMAGE',
    'NEW_AND_OLD_IMAGES',
    'KEYS_ONLY',
  ]),
});

const UserIdentitySchema = z.object({
  type: z.enum(['Service']),
  principalId: z.literal('dynamodb.amazonaws.com'),
});

const DynamoDBStreamRecordSchema = z.object({
  eventID: z.string(),
  eventName: z.enum(['INSERT', 'MODIFY', 'REMOVE']),
  eventVersion: z.string(),
  eventSource: z.literal('aws:dynamodb'),
  awsRegion: z.string(),
  eventSourceARN: z.string(),
  dynamodb: DynamoDBStreamChangeRecordSchema,
  userIdentity: z.optional(UserIdentitySchema),
});


type DynamoDBStreamRecord = z.infer<typeof DynamoDBStreamRecordSchema>;
type DynamoDBStreamChangeRecord = z.infer<
  typeof DynamoDBStreamChangeRecordSchema
>;
type UserIdentity = z.infer<typeof UserIdentitySchema>;

export {
  DynamoDBStreamRecord,
  DynamoDBStreamChangeRecord,
  UserIdentity,
  DynamoDBStreamRecordSchema,
  DynamoDBStreamChangeRecordSchema,
  UserIdentitySchema,
};