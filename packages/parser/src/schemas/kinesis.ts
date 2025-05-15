import { gunzipSync } from 'node:zlib';
import { fromBase64 } from '@aws-lambda-powertools/commons/utils/base64';
import { z } from 'zod';
import { DynamoDBStreamToKinesisRecord } from './dynamodb.js';

const decoder = new TextDecoder();

const KinesisDataStreamRecordPayload = z.object({
  kinesisSchemaVersion: z.string(),
  partitionKey: z.string(),
  sequenceNumber: z.string(),
  approximateArrivalTimestamp: z.number(),
  data: z.string().transform((data) => {
    const decompressed = decompress(data);
    const decoded = decoder.decode(fromBase64(data, 'base64'));
    try {
      // If data was not compressed, try to parse it as JSON otherwise it must be string
      return decompressed === data ? JSON.parse(decoded) : decompressed;
    } catch (e) {
      return decoded;
    }
  }),
});

const decompress = (data: string): string => {
  try {
    return JSON.parse(gunzipSync(fromBase64(data, 'base64')).toString('utf8'));
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

const KinesisDynamoDBStreamSchema = z.object({
  Records: z.array(
    KinesisDataStreamRecord.extend({
      kinesis: KinesisDataStreamRecordPayload.extend({
        data: z
          .string()
          .transform((data) => {
            const decoded = decoder.decode(fromBase64(data, 'base64'));
            return JSON.parse(decoded);
          })
          .pipe(DynamoDBStreamToKinesisRecord),
      }),
    })
  ),
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
 *         "approximateArrivalTimestamp": 1607497475.000
 *       },
 *       "eventSource": "aws:kinesis",
 *       "eventVersion": "1.0",
 *       "eventID": "shardId-000000000006:49590338271490256608559692538361571095921575989136588898",
 *       "eventName": "aws:kinesis:record",
 *       "invokeIdentityArn": "arn:aws:iam::123456789012:role/lambda-kinesis-role",
 *       "awsRegion": "us-east-1",
 *       "eventSourceARN": "arn:aws:kinesis:us-east-1:123456789012:stream/lambda-stream"
 *     }
 *   ],
 *   "window": {
 *     "start": "2020-12-09T07:04:00Z",
 *     "end": "2020-12-09T07:06:00Z"
 *   },
 *   "state": {
 *     "1": 282,
 *     "2": 715
 *   },
 *   "shardId": "shardId-000000000006",
 *   "eventSourceARN": "arn:aws:kinesis:us-east-1:123456789012:stream/lambda-stream",
 *   "isFinalInvokeForWindow": false,
 *   "isWindowTerminatedEarly": false
 * }
 *```
 * @see {@link types.KinesisDataStreamEvent | KinesisDataStreamEvent}
 * @see {@link https://docs.aws.amazon.com/lambda/latest/dg/services-kinesis-windows.html#streams-tumbling-processing}
 *
 */
const KinesisDataStreamSchema = z.object({
  Records: z.array(KinesisDataStreamRecord).min(1),
});

export {
  KinesisDataStreamRecord,
  KinesisDataStreamRecordPayload,
  KinesisDataStreamSchema,
  KinesisDynamoDBStreamSchema,
};
