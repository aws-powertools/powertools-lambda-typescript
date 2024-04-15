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
  DeadLetterQueueSourceArn: z.string().optional(), // Undocumented, but used by AWS to support their re-drive functionality in the console
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

const SqsSchema = z.object({
  Records: z.array(SqsRecordSchema),
});

export {
  SqsSchema,
  SqsRecordSchema,
  SqsAttributesSchema,
  SqsMsgAttributeSchema,
};
