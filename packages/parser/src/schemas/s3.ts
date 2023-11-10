import { z } from 'zod';

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
  configurationId: z.string(),
  object: z.object({
    key: z.string(),
    size: z.number(),
    eTag: z.string(),
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

const S3Record = z.object({
  eventVersion: z.string(),
  eventSource: z.literal('aws:s3'),
  awsRegion: z.string(),
  eventTime: z.string(),
  eventName: z.string(),
  userIdentity: S3Identity,
  requestParameters: S3RequestParameters,
  responseElements: S3ResponseElements,
  s3: S3Message,
  glacierEventData: z.optional(S3EventRecordGlacierEventData),
});

const S3EventNotificationEventBridgeDetailSchema = z.object({
  version: z.string(),
  bucket: z.object({
    name: z.string(),
  }),
  object: z.object({
    key: z.string(),
    size: z.number().nonnegative().optional(),
    etag: z.string(),
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

const S3EventNotificationEventBridgeSchema = z.object({
  detail: S3EventNotificationEventBridgeDetailSchema,
});

const S3Schema = z.object({
  Records: z.array(S3Record),
});

const S3SqsEventNotificationRecordSchema = z.object({
  body: z.string(),
});

const S3SqsEventNotificationSchema = z.object({
  Records: z.array(S3SqsEventNotificationRecordSchema),
});

const S3ObjectContext = z.object({
  inputS3Url: z.string(),
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
    mfaAuthenticated: z.string(),
  }),
});

const S3ObjectUserIdentity = z.object({
  type: z.string(),
  accountId: z.string(),
  accessKeyId: z.string(),
  userName: z.string().optional(),
  principalId: z.string(),
  arn: z.string(),
  sessionContext: S3ObjectSessionContext,
});

const S3ObjectLambdaEventSchema = z.object({
  xAmzRequestId: z.string(),
  getObjectContext: S3ObjectContext,
  configurationId: S3ObjectConfiguration,
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
