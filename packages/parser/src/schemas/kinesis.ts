import { gunzipSync } from 'node:zlib';
import { z } from 'zod';

const KinesisDataStreamRecordPayload = z.object({
  kinesisSchemaVersion: z.string(),
  partitionKey: z.string(),
  sequenceNumber: z.string(),
  approximateArrivalTimestamp: z.number(),
  data: z.string().transform((data) => {
    const decompresed = decompress(data);
    const decoded = Buffer.from(data, 'base64').toString('utf-8');
    try {
      // If data was not compressed, try to parse it as JSON otherwise it must be string
      return decompresed === data ? JSON.parse(decoded) : decompresed;
    } catch (e) {
      return decoded;
    }
  }),
});

const decompress = (data: string): string => {
  try {
    return JSON.parse(gunzipSync(Buffer.from(data, 'base64')).toString('utf8'));
  } catch (e) {
    return data;
  }
};

const KinesisDataStreamRecord = z.object({
  eventSource: z.literal('aws:kinesis'),
  eventVersion: z.string(),
  eventID: z.string(),
  eventName: z.literal('aws:kinesis:record'),
  awsRegion: z.string(),
  invokeIdentityArn: z.string(),
  eventSourceARN: z.string(),
  kinesis: KinesisDataStreamRecordPayload,
});

/**
 * Zod schema for Kinesis Data Stream event
 *
 * @example
 * ```json
 * {
 *   "Records": [
 *     {
 *       "kinesis": {
 *         "kinesisSchemaVersion": "1.0",
 *         "partitionKey": "1",
 *         "sequenceNumber": "49590338271490256608559692538361571095921575989136588898",
 *         "data": "SGVsbG8sIHRoaXMgaXMgYSB0ZXN0Lg==",
 *         "approximateArrivalTimestamp": 1545084650.987
 *       },
 *       "eventSource": "aws:kinesis",
 *       "eventVersion": "1.0",
 *       "eventID": "shardId-000000000006:49590338271490256608559692538361571095921575989136588898",
 *       "eventName": "aws:kinesis:record",
 *       "invokeIdentityArn": "arn:aws:iam::123456789012:role/lambda-role",
 *       "awsRegion": "us-east-2",
 *       "eventSourceARN": "arn:aws:kinesis:us-east-2:123456789012:stream/lambda-stream"
 *     },
 *     {
 *       "kinesis": {
 *         "kinesisSchemaVersion": "1.0",
 *         "partitionKey": "1",
 *         "sequenceNumber": "49590338271490256608559692540925702759324208523137515618",
 *         "data": "VGhpcyBpcyBvbmx5IGEgdGVzdC4=",
 *         "approximateArrivalTimestamp": 1545084711.166
 *       },
 *       "eventSource": "aws:kinesis",
 *       "eventVersion": "1.0",
 *       "eventID": "shardId-000000000006:49590338271490256608559692540925702759324208523137515618",
 *       "eventName": "aws:kinesis:record",
 *       "invokeIdentityArn": "arn:aws:iam::123456789012:role/lambda-role",
 *       "awsRegion": "us-east-2",
 *       "eventSourceARN": "arn:aws:kinesis:us-east-2:123456789012:stream/lambda-stream"
 *     }
 *   ]
 * }
 *```
 * @see {@link types.KinesisDataStreamEvent | KinesisDataStreamEvent}
 * @see {@link https://docs.aws.amazon.com/lambda/latest/dg/with-kinesis.html#services-kinesis-event-example}
 *
 */
const KinesisDataStreamSchema = z.object({
  Records: z.array(KinesisDataStreamRecord),
});

export {
  KinesisDataStreamSchema,
  KinesisDataStreamRecord,
  KinesisDataStreamRecordPayload,
};
