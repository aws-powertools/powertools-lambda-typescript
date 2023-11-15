import { z } from 'zod';

const SesReceiptVerdict = z.object({
  status: z.enum(['PASS', 'FAIL', 'GRAY', 'PROCESSING_FAILED']),
});

const SesReceipt = z.object({
  timestamp: z.string().datetime(),
  processingTimeMillis: z.number().int().positive(),
  recipients: z.array(z.string()),
  spamVerdict: SesReceiptVerdict,
  virusVerdict: SesReceiptVerdict,
  spfVerdict: SesReceiptVerdict,
  dmarcVerdict: SesReceiptVerdict,
  dkimVerdict: SesReceiptVerdict,
  dmarcPolicy: z.enum(['none', 'quarantine', 'reject']),
  action: z.object({
    type: z.enum(['Lambda']),
    invocationType: z.literal('Event'),
    functionArn: z.string(),
  }),
});

const SesMail = z.object({
  timestamp: z.string().datetime(),
  source: z.string(),
  messageId: z.string(),
  destination: z.array(z.string()),
  headersTruncated: z.boolean(),
  headers: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
    })
  ),
  commonHeaders: z.object({
    from: z.array(z.string()),
    to: z.array(z.string()),
    cc: z.array(z.string()).optional(),
    bcc: z.array(z.string()).optional(),
    sender: z.array(z.string()).optional(),
    'reply-to': z.array(z.string()).optional(),
    returnPath: z.string(),
    messageId: z.string(),
    date: z.string(),
    subject: z.string(),
  }),
});

const SesMessage = z.object({
  mail: SesMail,
  receipt: SesReceipt,
});

const SesRecordSchema = z.object({
  eventSource: z.literal('aws:ses'),
  eventVersion: z.string(),
  ses: SesMessage,
});

const SesSchema = z.object({
  Records: z.array(SesRecordSchema),
});

export { SesSchema, SesRecordSchema };
