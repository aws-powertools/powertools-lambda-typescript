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

/**
 * Zod schema for SES events from AWS.
 *
 * @example
 * ```json
 * {
 *   "Records": [
 *     {
 *       "eventVersion": "1.0",
 *       "ses": {
 *         "mail": {
 *           "commonHeaders": {
 *             "from": [
 *               "Jane Doe <janedoe@example.com>"
 *             ],
 *             "to": [
 *               "johndoe@example.com"
 *             ],
 *             "returnPath": "janedoe@example.com",
 *             "messageId": "<0123456789example.com>",
 *             "date": "Wed, 7 Oct 2015 12:34:56 -0700",
 *             "subject": "Test Subject"
 *           },
 *           "source": "janedoe@example.com",
 *           "timestamp": "1970-01-01T00:00:00.000Z",
 *           "destination": [
 *             "johndoe@example.com"
 *           ],
 *           "headers": [
 *             {
 *               "name": "Return-Path",
 *               "value": "<janedoe@example.com>"
 *             },
 *             {
 *               "name": "Received",
 *               "value": "from mailer.example.com (mailer.example.com [203.0.113.1]) by ..."
 *             },
 *             {
 *               "name": "DKIM-Signature",
 *               "value": "v=1; a=rsa-sha256; c=relaxed/relaxed; d=example.com; s=example; ..."
 *             },
 *             {
 *               "name": "MIME-Version",
 *               "value": "1.0"
 *             },
 *             {
 *               "name": "From",
 *               "value": "Jane Doe <janedoe@example.com>"
 *             },
 *             {
 *               "name": "Date",
 *               "value": "Wed, 7 Oct 2015 12:34:56 -0700"
 *             },
 *             {
 *               "name": "Message-ID",
 *               "value": "<0123456789example.com>"
 *             },
 *             {
 *               "name": "Subject",
 *               "value": "Test Subject"
 *             },
 *             {
 *               "name": "To",
 *               "value": "johndoe@example.com"
 *             },
 *             {
 *               "name": "Content-Type",
 *               "value": "text/plain; charset=UTF-8"
 *             }
 *           ],
 *           "headersTruncated": false,
 *           "messageId": "o3vrnil0e2ic28tr"
 *         },
 *         "receipt": {
 *           "recipients": [
 *             "johndoe@example.com"
 *           ],
 *           "timestamp": "1970-01-01T00:00:00.000Z",
 *           "spamVerdict": {
 *             "status": "PASS"
 *           },
 *           "dkimVerdict": {
 *             "status": "PASS"
 *           },
 *           "dmarcPolicy": "reject",
 *           "processingTimeMillis": 574,
 *           "action": {
 *             "type": "Lambda",
 *             "invocationType": "Event",
 *             "functionArn": "arn:aws:lambda:us-west-2:012345678912:function:Example"
 *           },
 *           "dmarcVerdict": {
 *             "status": "PASS"
 *           },
 *           "spfVerdict": {
 *             "status": "PASS"
 *           },
 *           "virusVerdict": {
 *             "status": "PASS"
 *           }
 *         }
 *       },
 *       "eventSource": "aws:ses"
 *     }
 *   ]
 * }
 * ```
 *
 * @see {@link types.SesEvent | SesEvent}
 * @see {@link https://docs.aws.amazon.com/ses/latest/dg/receiving-email-notifications-examples.html}
 */
const SesSchema = z.object({
  Records: z.array(SesRecordSchema),
});

export { SesSchema };
