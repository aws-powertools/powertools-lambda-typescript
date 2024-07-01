import { z } from 'zod';

const SqsMsgAttributeSchema = z.object({
  stringValue: z.string().optional(),
  binaryValue: z.string().optional(),
  stringListValues: z.array(z.string()).optional(),
  binaryListValues: z.array(z.string()).optional(),
  dataType: z.string(),
});

const SqsAttributesSchema = z.object({
  ApproximateReceiveCount: z.string(),
  ApproximateFirstReceiveTimestamp: z.string(),
  MessageDeduplicationId: z.string().optional(),
  MessageGroupId: z.string().optional(),
  SenderId: z.string(),
  SentTimestamp: z.string(),
  SequenceNumber: z.string().optional(),
  AWSTraceHeader: z.string().optional(),
  /**
   * Undocumented, but used by AWS to support their re-drive functionality in the console
   */
  DeadLetterQueueSourceArn: z.string().optional(),
});

const SqsRecordSchema = z.object({
  messageId: z.string(),
  receiptHandle: z.string(),
  body: z.string(),
  attributes: SqsAttributesSchema,
  messageAttributes: z.record(z.string(), SqsMsgAttributeSchema),
  md5OfBody: z.string(),
  md5OfMessageAttributes: z.string().optional().nullable(),
  eventSource: z.literal('aws:sqs'),
  eventSourceARN: z.string(),
  awsRegion: z.string(),
});

/**
 * Zod schema for SQS event
 *
 * @example
 * ```json
 * {
 *   "Records": [
 *     {
 *       "messageId": "059f36b4-87a3-44ab-83d2-661975830a7d",
 *       "receiptHandle": "AQEBwJnKyrHigUMZj6rYigCgxlaS3SLy0a...",
 *       "body": "Test message.",
 *       "attributes": {
 *         "ApproximateReceiveCount": "1",
 *         "SentTimestamp": "1545082649183",
 *         "SenderId": "AIDAIENQZJOLO23YVJ4VO",
 *         "ApproximateFirstReceiveTimestamp": "1545082649185"
 *       },
 *       "messageAttributes": {
 *         "testAttr": {
 *           "stringValue": "100",
 *           "binaryValue": "base64Str",
 *           "dataType": "Number"
 *         }
 *       },
 *       "md5OfBody": "e4e68fb7bd0e697a0ae8f1bb342846b3",
 *       "eventSource": "aws:sqs",
 *       "eventSourceARN": "arn:aws:sqs:us-east-2:123456789012:my-queue",
 *       "awsRegion": "us-east-2"
 *     },
 *     {
 *       "messageId": "2e1424d4-f796-459a-8184-9c92662be6da",
 *       "receiptHandle": "AQEBzWwaftRI0KuVm4tP+/7q1rGgNqicHq...",
 *       "body": "{\"message\": \"foo1\"}",
 *       "attributes": {
 *         "ApproximateReceiveCount": "1",
 *         "SentTimestamp": "1545082650636",
 *         "SenderId": "AIDAIENQZJOLO23YVJ4VO",
 *         "ApproximateFirstReceiveTimestamp": "1545082650649",
 *         "DeadLetterQueueSourceArn": "arn:aws:sqs:us-east-2:123456789012:my-queue-dead"
 *       },
 *       "messageAttributes": {},
 *       "md5OfBody": "e4e68fb7bd0e697a0ae8f1bb342846b3",
 *       "eventSource": "aws:sqs",
 *       "eventSourceARN": "arn:aws:sqs:us-east-2:123456789012:my-queue",
 *       "awsRegion": "us-east-2"
 *     }
 *   ]
 * }
 * ```
 *
 * @see {@link types.SqsEvent | SqsEvent}
 * @see {@link https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html#example-standard-queue-message-event}
 */
const SqsSchema = z.object({
  Records: z.array(SqsRecordSchema),
});

export { SqsSchema, SqsRecordSchema };
