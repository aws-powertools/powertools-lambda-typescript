import { gunzipSync } from 'node:zlib';
import { z } from 'zod';
import { DecompressError } from '../errors.js';

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
  logEvents: z.array(CloudWatchLogEventSchema).min(1),
});

const decompressRecordToJSON = (
  data: string
): z.infer<typeof CloudWatchLogsDecodeSchema> => {
  try {
    const uncompressed = gunzipSync(Buffer.from(data, 'base64')).toString(
      'utf8'
    );

    return CloudWatchLogsDecodeSchema.parse(JSON.parse(uncompressed));
  } catch (error) {
    throw new DecompressError('Failed to decompress CloudWatch log data');
  }
};

/**
 * Zod schema for CloudWatch Logs.
 *
 * @example
 * ```json
 * {
 *   "awslogs": {
 *     "data": "H4sIAAAAAAAAAHWPwQqCQBCGX0Xm7EFtK+smZBEUgXoLCdMhFtKV3akI8d0bLYmibvPPN3wz00CJxmQnTO41whwWQRIctmEcB6sQbFC3CjW3XW8kxpOpP+OC22d1Wml1qZkQGtoMsScxaczKN3plG8zlaHIta5KqWsozoTYw3/djzwhpLwivWFGHGpAFe7DL68JlBUk+l7KSN7tCOEJ4M3/qOI49vMHj+zCKdlFqLaU2ZHV2a4Ct/an0/ivdX8oYc1UVX860fQDQiMdxRQEAAA=="
 *   }
 * }
 * ```
 * The `data` field compressed JSON string, once transformed the payload will look like:
 *
 * @example
 * ```json
 * {
 *   "owner": "123456789012",
 *   "logGroup": "CloudTrail",
 *   "logStream": "123456789012_CloudTrail_us-east-1",
 *   "subscriptionFilters": [
 *     "Destination"
 *   ],
 *   "messageType": "DATA_MESSAGE",
 *   "logEvents": [
 *     {
 *       "id": "31953106606966983378809025079804211143289615424298221568",
 *       "timestamp": 1432826855000,
 *       "message": "{\"eventVersion\":\"1.03\",\"userIdentity\":{\"type\":\"Root\"}"
 *     },
 *     {
 *       "id": "31953106606966983378809025079804211143289615424298221569",
 *       "timestamp": 1432826855000,
 *       "message": "{\"eventVersion\":\"1.03\",\"userIdentity\":{\"type\":\"Root\"}"
 *     },
 *     {
 *       "id": "31953106606966983378809025079804211143289615424298221570",
 *       "timestamp": 1432826855000,
 *       "message": "{\"eventVersion\":\"1.03\",\"userIdentity\":{\"type\":\"Root\"}"
 *     }
 *   ]
 * }
 * ```
 *
 * @see {@link types.CloudWatchLogsEvent | CloudWatchLogsEvent}
 * @see {@link https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/SubscriptionFilters.html#LambdaFunctionExample}
 */
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
