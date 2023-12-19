import { z } from 'zod';

const SnsMsgAttribute = z.object({
  Type: z.string(),
  Value: z.string(),
});

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

const SnsSqsNotificationSchema = SnsNotificationSchema.extend({
  UnsubscribeURL: z.string().optional(),
  SigningCertURL: z.string().url().optional(),
}).omit({
  UnsubscribeUrl: true,
  SigningCertUrl: true,
});

const SnsRecordSchema = z.object({
  EventSource: z.literal('aws:sns'),
  EventVersion: z.string(),
  EventSubscriptionArn: z.string(),
  Sns: SnsNotificationSchema,
});

const SnsSchema = z.object({
  Records: z.array(SnsRecordSchema),
});

export {
  SnsSchema,
  SnsRecordSchema,
  SnsNotificationSchema,
  SnsMsgAttribute,
  SnsSqsNotificationSchema,
};
