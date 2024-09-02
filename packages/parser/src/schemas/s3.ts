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

const S3RecordSchema = z.object({
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
});

const S3EventNotificationEventBridgeDetailSchema = z.object({
  version: z.string(),
  bucket: z.object({
    name: z.string(),
  }),
  object: z.object({
    key: z.string(),
    size: z.number().nonnegative().optional(), // not present in DeleteObject events
    etag: z.string().optional(), // not present in DeleteObject events
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

/**
 * Zod schema for S3 -> EventBridge -> Lambda event notification.
 *
 * @example
 * ```json
 * {
 *   "version": "0",
 *   "id": "f5f1e65c-dc3a-93ca-6c1e-b1647eac7963",
 *   "detail-type": "Object Created",
 *   "source": "aws.s3",
 *   "account": "123456789012",
 *   "time": "2023-03-08T17:50:14Z",
 *   "region": "eu-west-1",
 *   "resources": [
 *     "arn:aws:s3:::example-bucket"
 *   ],
 *   "detail": {
 *     "version": "0",
 *     "bucket": {
 *       "name": "example-bucket"
 *     },
 *     "object": {
 *       "key": "IMG_m7fzo3.jpg",
 *       "size": 184662,
 *       "etag": "4e68adba0abe2dc8653dc3354e14c01d",
 *       "sequencer": "006408CAD69598B05E"
 *     },
 *     "request-id": "57H08PA84AB1JZW0",
 *     "requester": "123456789012",
 *     "source-ip-address": "34.252.34.74",
 *     "reason": "PutObject"
 *   }
 * }
 * ```
 *
 * @see {@link types.S3EventNotificationEventBridge | S3EventNotificationEventBridge }
 * @see {@link https://docs.aws.amazon.com/AmazonS3/latest/userguide/ev-events.html#ev-events-list}
 */
const S3EventNotificationEventBridgeSchema = EventBridgeSchema.extend({
  detail: S3EventNotificationEventBridgeDetailSchema,
});

/**
 * Zod schema for S3 event
 *
 * @example
 * ```json
 * {
 *   "Records": [
 *     {
 *       "eventVersion": "2.1",
 *       "eventSource": "aws:s3",
 *       "awsRegion": "us-east-2",
 *       "eventTime": "2019-09-03T19:37:27.192Z",
 *       "eventName": "ObjectCreated:Put",
 *       "userIdentity": {
 *         "principalId": "AWS:AIDAINPONIXQXHT3IKHL2"
 *       },
 *       "requestParameters": {
 *         "sourceIPAddress": "205.255.255.255"
 *       },
 *       "responseElements": {
 *         "x-amz-request-id": "D82B88E5F771F645",
 *         "x-amz-id-2": "vlR7PnpV2Ce81l0PRw6jlUpck7Jo5ZsQjryTjKlc5aLWGVHPZLj5NeC6qMa0emYBDXOo6QBU0Wo="
 *       },
 *       "s3": {
 *         "s3SchemaVersion": "1.0",
 *         "configurationId": "828aa6fc-f7b5-4305-8584-487c791949c1",
 *         "bucket": {
 *           "name": "lambda-artifacts-deafc19498e3f2df",
 *           "ownerIdentity": {
 *             "principalId": "A3I5XTEXAMAI3E"
 *           },
 *           "arn": "arn:aws:s3:::lambda-artifacts-deafc19498e3f2df"
 *         },
 *         "object": {
 *           "key": "b21b84d653bb07b05b1e6b33684dc11b",
 *           "size": 1305107,
 *           "eTag": "b21b84d653bb07b05b1e6b33684dc11b",
 *           "sequencer": "0C0F6F405D6ED209E1"
 *         }
 *       }
 *     }
 *   ]
 * }
 * ```
 * @see {@link types.S3Event | S3Event }
 * @see {@link https://docs.aws.amazon.com/AmazonS3/latest/userguide/notification-content-structure.html}
 */
const S3Schema = z.object({
  Records: z.array(S3RecordSchema),
});

const S3SqsEventNotificationRecordSchema = SqsRecordSchema.extend({
  body: z.string(),
});

/**
 * Zod schema for S3 -> SQS -> Lambda event notification.
 *
 * @example
 * ```json
 * {
 *   "Records": [
 *     {
 *       "messageId": "ca3e7a89-c358-40e5-8aa0-5da01403c267",
 *       "receiptHandle": "AQEBE7XoI7IQRLF7SrpiW9W4BanmOWe8UtVDbv6/CEZYKf/OktSNIb4j689tQfR4k44V/LY20lZ5VpxYt2GTYCsSLKTcBalTJaRX9CKu/hVqy/23sSNiKxnP56D+VLSn+hU275+AP1h4pUL0d9gLdRB2haX8xiM+LcGfis5Jl8BBXtoxKRF60O87O9/NvCmmXLeqkJuexfyEZNyed0fFCRXFXSjbmThG0OIQgcrGI8glBRGPA8htns58VtXFsSaPYNoqP3p5n6+ewKKVLD0lfm+0DlnLKRa+mjvFBaSer9KK1ff+Aq6zJ6HynPwADj+aF70Hwimc2zImYe51SLEF/E2csYlMNZYI/2qXW0m9R7wJ/XDTV4g2+h+BMTxsKnJQ6NQd",
 *       "body": "{\"Records\":[{\"eventVersion\":\"2.1\",\"eventSource\":\"aws:s3\",\"awsRegion\":\"us-east-1\",\"eventTime\":\"2023-04-12T20:43:38.021Z\",\"eventName\":\"ObjectCreated:Put\",\"userIdentity\":{\"principalId\":\"A1YQ72UWCM96UF\"},\"requestParameters\":{\"sourceIPAddress\":\"93.108.161.96\"},\"responseElements\":{\"x-amz-request-id\":\"YMSSR8BZJ2Y99K6P\",\"x-amz-id-2\":\"6ASrUfj5xpn859fIq+6FXflOex/SKl/rjfiMd7wRzMg/zkHKR22PDpnh7KD3uq//cuOTbdX4DInN5eIs+cR0dY1z2Mc5NDP/\"},\"s3\":{\"s3SchemaVersion\":\"1.0\",\"configurationId\":\"SNS\",\"bucket\":{\"name\":\"xxx\",\"ownerIdentity\":{\"principalId\":\"A1YQ72UWCM96UF\"},\"arn\":\"arn:aws:s3:::xxx\"},\"object\":{\"key\":\"test.pdf\",\"size\":104681,\"eTag\":\"2e3ad1e983318bbd8e73b080e2997980\",\"versionId\":\"yd3d4HaWOT2zguDLvIQLU6ptDTwKBnQV\",\"sequencer\":\"00643717F9F8B85354\"}}}]}",
 *       "attributes": {
 *         "ApproximateReceiveCount": "1",
 *         "SentTimestamp": "1681332219270",
 *         "SenderId": "AIDAJHIPRHEMV73VRJEBU",
 *         "ApproximateFirstReceiveTimestamp": "1681332239270"
 *       },
 *       "messageAttributes": {
 *       },
 *       "md5OfBody": "16f4460f4477d8d693a5abe94fdbbd73",
 *       "eventSource": "aws:sqs",
 *       "eventSourceARN": "arn:aws:sqs:us-east-1:123456789012:SQS",
 *       "awsRegion": "us-east-1"
 *     }
 *   ]
 * }
 * ```
 *
 * @see {@link types.S3SqsEventNotification | S3SqsEventNotification }
 */
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

/**
 * Zod schema for S3 IAM Access Point Lambda event notification.
 *
 * @example
 * ```json
 * {
 *     "xAmzRequestId": "1a5ed718-5f53-471d-b6fe-5cf62d88d02a",
 *     "getObjectContext": {
 *         "inputS3Url": "https://myap-123412341234.s3-accesspoint.us-east-1.amazonaws.com/s3.txt?X-Amz-Security-Token=...",
 *         "outputRoute": "io-iad-cell001",
 *         "outputToken": "..."
 *     },
 *     "configuration": {
 *         "accessPointArn": "arn:aws:s3-object-lambda:us-east-1:123412341234:accesspoint/myolap",
 *         "supportingAccessPointArn": "arn:aws:s3:us-east-1:123412341234:accesspoint/myap",
 *         "payload": "test"
 *     },
 *     "userRequest": {
 *         "url": "/s3.txt",
 *         "headers": {
 *             "Host": "myolap-123412341234.s3-object-lambda.us-east-1.amazonaws.com",
 *             "Accept-Encoding": "identity",
 *             "X-Amz-Content-SHA256": "e3b0c44297fc1c149afbf4c8995fb92427ae41e4649b934ca495991b7852b855"
 *         }
 *     },
 *     "userIdentity": {
 *         "type": "IAMUser",
 *         "principalId": "...",
 *         "arn": "arn:aws:iam::123412341234:user/myuser",
 *         "accountId": "123412341234",
 *         "accessKeyId": "...",
 *         "userName": "Alice"
 *     },
 *     "protocolVersion": "1.00"
 * }
 * ```
 *
 * @see {@link https://docs.aws.amazon.com/AmazonS3/latest/userguide/olap-event-context.html}
 * @see {@link types.S3ObjectLambdaEvent | S3ObjectLambdaEvent }
 */
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
