import { z } from 'zod';

const SnsMsgAttribute = z.object({
  Type: z.string(),
  Value: z.string(),
});

/**
 * Zod schema for a SNS event notification record.
 */
const SnsNotificationSchema = z.object({
  Subject: z.string().optional(),
  TopicArn: z.string(),
  UnsubscribeUrl: z.string().url(),
  UnsubscribeURL: z.string().url().optional(),
  SigningCertUrl: z.string().url().optional(),
  SigningCertURL: z.string().url().optional(),
  Type: z.literal('Notification'),
  MessageAttributes: z.record(z.string(), SnsMsgAttribute).optional(),
  Message: z.string(),
  MessageId: z.string(),
  Signature: z.string().optional(),
  SignatureVersion: z.string().optional(),
  Timestamp: z.string().datetime(),
});

/**
 * Zod schema for SQS -> SNS event
 *
 * @example
 * ```json
 * {
 *   "Records": [
 *     {
 *       "messageId": "79406a00-bf15-46ca-978c-22c3613fcb30",
 *       "receiptHandle": "AQEB3fkqlBqq239bMCAHIr5mZkxJYKtxsTTy1lMImmpY7zqpQdfcAE8zFiuRh7X5ciROy24taT2rRXfuJFN/yEUVcQ6d5CIOCEK4htmRJJOHIyGdZPAm2NUUG5nNn2aEzgfzVvrkPBsrCbr7XTzK5s6eUZNH/Nn9AJtHKHpzweRK34Bon9OU/mvyIT7EJbwHPsdhL14NrCp8pLWBiIhkaJkG2G6gPO89dwHtGVUARJL+zP70AuIu/f7QgmPtY2eeE4AVbcUT1qaIlSGHUXxoHq/VMHLd/c4zWl0EXQOo/90DbyCUMejTIKL7N15YfkHoQDHprvMiAr9S75cdMiNOduiHzZLg/qVcv4kxsksKLFMKjwlzmYuQYy2KslVGwoHMd4PD",
 *       "body": "{\n  \"Type\" : \"Notification\",\n  \"MessageId\" : \"d88d4479-6ec0-54fe-b63f-1cf9df4bb16e\",\n  \"TopicArn\" : \"arn:aws:sns:eu-west-1:231436140809:powertools265\",\n  \"Message\" : \"{\\\"message\\\": \\\"hello world\\\", \\\"username\\\": \\\"lessa\\\"}\",\n  \"Timestamp\" : \"2021-01-19T10:07:07.287Z\",\n  \"SignatureVersion\" : \"1\",\n  \"Signature\" : \"tEo2i6Lw6/Dr7Jdlulh0sXgnkF0idd3hqs8QZCorQpzkIWVOuu583NT0Gv0epuZD1Bo+tex6NgP5p6415yNVujGHJKnkrA9ztzXaVgFiol8rf8AFGQbmb7RsM9BqATQUJeg9nCTe0jksmWXmjxEFr8XKyyRuQBwSlRTngAvOw8jUnCe1vyYD5xPec1xpfOEGLi5BqSog+6tBtsry3oAtcENX8SV1tVuMpp6D+UrrU8xNT/5D70uRDppkPE3vq+t7rR0fVSdQRdUV9KmQD2bflA1Dyb2y37EzwJOMHDDQ82aOhj/JmPxvEAlV8RkZl6J0HIveraRy9wbNLbI7jpiOCw==\",\n  \"SigningCertURL\" : \"https://sns.eu-west-1.amazonaws.com/SimpleNotificationService-010a507c1833636cd94bdb98bd93083a.pem\",\n  \"UnsubscribeURL\" : \"https://sns.eu-west-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:eu-west-1:231436140809:powertools265:15189ad7-870e-40e5-a7dd-a48898cd9f86\"\n}",
 *       "attributes": {
 *         "ApproximateReceiveCount": "1",
 *         "SentTimestamp": "1611050827340",
 *         "SenderId": "AIDAISMY7JYY5F7RTT6AO",
 *         "ApproximateFirstReceiveTimestamp": "1611050827344"
 *       },
 *       "messageAttributes": {},
 *       "md5OfBody": "8910bdaaf9a30a607f7891037d4af0b0",
 *       "eventSource": "aws:sqs",
 *       "eventSourceARN": "arn:aws:sqs:eu-west-1:231436140809:powertools265",
 *       "awsRegion": "eu-west-1"
 *     }
 *   ]
 * }
 * ```
 *
 * @see {@link types.SnsSqsNotification | SnsSqsNotification}
 */
const SnsSqsNotificationSchema = SnsNotificationSchema.extend({
  UnsubscribeURL: z.string().optional(),
  SigningCertURL: z.string().url().optional(),
}).omit({
  UnsubscribeUrl: true,
  SigningCertUrl: true,
});

/**
 * Zod schema for a SNS record inside of an SNS event.
 */
const SnsRecordSchema = z.object({
  EventSource: z.literal('aws:sns'),
  EventVersion: z.string(),
  EventSubscriptionArn: z.string(),
  Sns: SnsNotificationSchema,
});

/**
 * Zod schema for SNS event
 *
 * @example
 * ```json
 * {
 *   "Records": [
 *     {
 *       "EventVersion": "1.0",
 *       "EventSubscriptionArn": "arn:aws:sns:us-east-2:123456789012:sns-la ...",
 *       "EventSource": "aws:sns",
 *       "Sns": {
 *         "SignatureVersion": "1",
 *         "Timestamp": "2019-01-02T12:45:07.000Z",
 *         "Signature": "tcc6faL2yUC6dgZdmrwh1Y4cGa/ebXEkAi6RibDsvpi+tE/1+82j...65r==",
 *         "SigningCertUrl": "https://sns.us-east-2.amazonaws.com/SimpleNotification",
 *         "MessageId": "95df01b4-ee98-5cb9-9903-4c221d41eb5e",
 *         "Message": "Hello from SNS!",
 *         "MessageAttributes": {
 *           "Test": {
 *             "Type": "String",
 *             "Value": "TestString"
 *           },
 *           "TestBinary": {
 *             "Type": "Binary",
 *             "Value": "TestBinary"
 *           }
 *         },
 *         "Type": "Notification",
 *         "UnsubscribeUrl": "https://sns.us-east-2.amazonaws.com/?Action=Unsubscribe",
 *         "TopicArn": "arn:aws:sns:us-east-2:123456789012:sns-lambda",
 *         "Subject": "TestInvoke"
 *       }
 *     }
 *   ]
 * }
 * ```
 *
 * @see {@link types.SnsEvent | SnsEvent}
 * @see {@link https://docs.aws.amazon.com/lambda/latest/dg/with-sns.html#sns-sample-event}
 */
const SnsSchema = z.object({
  Records: z.array(SnsRecordSchema),
});

export {
  SnsSchema,
  SnsSqsNotificationSchema,
  SnsRecordSchema,
  SnsNotificationSchema,
};
