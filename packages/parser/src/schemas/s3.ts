import { z } from 'zod';
import { EventBridgeSchema } from './eventbridge.js';
import { SqsRecordSchema } from './sqs.js';

const S3Identity = z.object({
  principalId: z.string(),
});

const S3RequestParameters = z.object({
  sourceIPAddress: z.string().ip(),
});

const S3ResponseElements = z.object({
  'x-amz-request-id': z.string(),
  'x-amz-id-2': z.string(),
});

const S3Message = z.object({
  s3SchemaVersion: z.string(),
  configurationId: z.string(),
  object: z.object({
    key: z.string(),
    size: z.number().optional(),
    urlDecodedKey: z.string().optional(),
    eTag: z.string().optional(),
    sequencer: z.string(),
    versionId: z.optional(z.string()),
  }),
  bucket: z.object({
    name: z.string(),
    ownerIdentity: S3Identity,
    arn: z.string(),
  }),
});

const S3EventRecordGlacierEventData = z.object({
  restoreEventData: z.object({
    lifecycleRestorationExpiryTime: z.string(),
    lifecycleRestoreStorageClass: z.string(),
  }),
});

const S3RecordSchema = z
  .object({
    eventVersion: z.string(),
    eventSource: z.literal('aws:s3'),
    awsRegion: z.string(),
    eventTime: z.string().datetime(),
    eventName: z.string(),
    userIdentity: S3Identity,
    requestParameters: S3RequestParameters,
    responseElements: S3ResponseElements,
    s3: S3Message,
    glacierEventData: z.optional(S3EventRecordGlacierEventData),
  })
  .refine((value) => {
    return (
      (!value.eventName.includes('ObjectRemoved') &&
        value.s3.object.size === undefined) ||
        value.s3.object.eTag === undefined,
      {
        message:
          'S3 event notification with ObjectRemoved event name must have size or eTag defined',
      }
    );
  });

const S3EventNotificationEventBridgeDetailSchema = z.object({
  version: z.string(),
  bucket: z.object({
    name: z.string(),
  }),
  object: z.object({
    key: z.string(),
    size: z.number().nonnegative().optional(),
    etag: z.string().optional(),
    'version-id': z.string().optional(),
    sequencer: z.string().optional(),
  }),
  'request-id': z.string(),
  requester: z.string(),
  'source-ip-address': z.string().ip().optional(),
  reason: z.string().optional(),
  'deletion-type': z.string().optional(),
  'restore-expiry-time': z.string().optional(),
  'source-storage-class': z.string().optional(),
  'destination-storage-class': z.string().optional(),
  'destination-access-tier': z.string().optional(),
});

const S3EventNotificationEventBridgeSchema = EventBridgeSchema.extend({
  detail: S3EventNotificationEventBridgeDetailSchema,
});

const S3Schema = z.object({
  Records: z.array(S3RecordSchema),
});

const S3SqsEventNotificationRecordSchema = SqsRecordSchema.extend({
  body: z.string(),
});

const S3SqsEventNotificationSchema = z.object({
  Records: z.array(S3SqsEventNotificationRecordSchema),
});

const S3ObjectContext = z.object({
  inputS3Url: z.string().url(),
  outputRoute: z.string(),
  outputToken: z.string(),
});

const S3ObjectConfiguration = z.object({
  accessPointArn: z.string(),
  supportingAccessPointArn: z.string(),
  payload: z.union([z.string(), z.object({})]),
});

const S3ObjectUserRequest = z.object({
  url: z.string(),
  headers: z.record(z.string(), z.string()),
});

const S3ObjectSessionContext = z.object({
  sessionIssuer: z.object({
    type: z.string(),
    userName: z.string().optional(),
    principalId: z.string(),
    arn: z.string(),
    accountId: z.string(),
  }),
  attributes: z.object({
    creationDate: z.string(),
    mfaAuthenticated: z
      .union([z.boolean(), z.literal('true'), z.literal('false')])
      .transform((value) => value === true || value === 'true'),
  }),
});

const S3ObjectUserIdentity = z.object({
  type: z.string(),
  accountId: z.string(),
  accessKeyId: z.string(),
  userName: z.string().optional(),
  principalId: z.string(),
  arn: z.string(),
  sessionContext: S3ObjectSessionContext.optional(),
});

const S3ObjectLambdaEventSchema = z.object({
  xAmzRequestId: z.string(),
  getObjectContext: S3ObjectContext,
  configuration: S3ObjectConfiguration,
  userRequest: S3ObjectUserRequest,
  userIdentity: S3ObjectUserIdentity,
  protocolVersion: z.string(),
});

export {
  S3Schema,
  S3EventNotificationEventBridgeSchema,
  S3SqsEventNotificationSchema,
  S3ObjectLambdaEventSchema,
};
