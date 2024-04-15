import { z } from 'zod';
import { gunzipSync } from 'node:zlib';

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

const decompressRecordToJSON = (
  data: string
): z.infer<typeof CloudWatchLogsDecodeSchema> => {
  const uncompressed = gunzipSync(Buffer.from(data, 'base64')).toString('utf8');

  return CloudWatchLogsDecodeSchema.parse(JSON.parse(uncompressed));
};

const CloudWatchLogsSchema = z.object({
  awslogs: z.object({
    data: z.string().transform((data) => decompressRecordToJSON(data)),
  }),
});

export {
  CloudWatchLogsSchema,
  CloudWatchLogsDecodeSchema,
  decompressRecordToJSON,
  CloudWatchLogEventSchema,
};
