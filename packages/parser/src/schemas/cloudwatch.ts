import { z } from 'zod';
import { gunzipSync } from 'zlib';

const CloudWatchLogEventSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  message: z.string(),
});

const CloudWatchLogsDecodeSchema = z.object({
  messageType: z.string(),
  owner: z.string(),
  logGroup: z.string(),
  logStream: z.string(),
  subscriptionFilters: z.array(z.string()),
  logEvents: z.array(CloudWatchLogEventSchema),
});

function decompressRecordToJSON(
  data: string
): z.infer<typeof CloudWatchLogsDecodeSchema> {
  try {
    console.debug('Decoding data', data);
    const uncompressed = gunzipSync(Buffer.from(data, 'base64')).toString(
      'utf8'
    );

    return CloudWatchLogsDecodeSchema.parse(JSON.parse(uncompressed));
  } catch (e) {
    console.debug('Failed to gunzip data', e);
    throw e;
  }
}

const CloudWatchLogsSchema = z.object({
  awslogs: z.object({
    data: z.string().transform((data) => decompressRecordToJSON(data)),
  }),
});

export {
  CloudWatchLogsSchema,
  CloudWatchLogsDecodeSchema,
  decompressRecordToJSON,
};
