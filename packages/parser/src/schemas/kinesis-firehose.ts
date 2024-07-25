import { z } from 'zod';
import { SqsRecordSchema } from './sqs.js';

const KinesisRecordMetaData = z.object({
  shardId: z.string(),
  partitionKey: z.string(),
  approximateArrivalTimestamp: z.number().positive(),
  sequenceNumber: z.string(),
  subsequenceNumber: z.number(),
});

const KinesisFireHoseRecordBase = z.object({
  recordId: z.string(),
  approximateArrivalTimestamp: z.number().positive(),
  kinesisRecordMetaData: KinesisRecordMetaData.optional(),
});

const KinesisFireHoseBaseSchema = z.object({
  invocationId: z.string(),
  deliveryStreamArn: z.string(),
  region: z.string(),
  sourceKinesisStreamArn: z.string().optional(),
});

/**
 * Zod schema for a Kinesis Firehose record from an Kinesis Firehose event.
 */
const KinesisFirehoseRecord = KinesisFireHoseRecordBase.extend({
  data: z
    .string()
    .transform((data) => Buffer.from(data, 'base64').toString('utf8')),
});

/**
 * Zod schema for a SQS record from an Kinesis Firehose event.
 */
const KinesisFirehoseSqsRecord = KinesisFireHoseRecordBase.extend({
  data: z.string().transform((data) => {
    try {
      return SqsRecordSchema.parse(
        JSON.parse(Buffer.from(data, 'base64').toString('utf8'))
      );
    } catch (e) {
      return data;
    }
  }),
});

/**
 * Zod schema for Kinesis Firehose events
 *
 * @example
 * ```json
 * {
 *   "invocationId": "2b4d1ad9-2f48-94bd-a088-767c317e994a",
 *   "sourceKinesisStreamArn": "arn:aws:kinesis:us-east-1:123456789012:stream/kinesis-source",
 *   "deliveryStreamArn": "arn:aws:firehose:us-east-2:123456789012:deliverystream/delivery-stream-name",
 *   "region": "us-east-2",
 *   "records": [
 *     {
 *       "data": "SGVsbG8gV29ybGQ=",
 *       "recordId": "record1",
 *       "approximateArrivalTimestamp": 1664028820148,
 *       "kinesisRecordMetadata": {
 *         "shardId": "shardId-000000000000",
 *         "partitionKey": "4d1ad2b9-24f8-4b9d-a088-76e9947c317a",
 *         "approximateArrivalTimestamp": 1664028820148,
 *         "sequenceNumber": "49546986683135544286507457936321625675700192471156785154",
 *         "subsequenceNumber": 0
 *       }
 *     },
 *     {
 *       "data": "eyJIZWxsbyI6ICJXb3JsZCJ9",
 *       "recordId": "record2",
 *       "approximateArrivalTimestamp": 1664028793294,
 *       "kinesisRecordMetadata": {
 *         "shardId": "shardId-000000000001",
 *         "partitionKey": "4d1ad2b9-24f8-4b9d-a088-76e9947c318a",
 *         "approximateArrivalTimestamp": 1664028793294,
 *         "sequenceNumber": "49546986683135544286507457936321625675700192471156785155",
 *         "subsequenceNumber": 0
 *       }
 *     }
 *   ]
 * }
 * ```
 *
 * @see {@link types.KinesisFireHoseEvent | KinesisFireHoseEvent}
 * @see {@link https://docs.aws.amazon.com/lambda/latest/dg/services-kinesisfirehose.html}
 */
const KinesisFirehoseSchema = KinesisFireHoseBaseSchema.extend({
  records: z.array(KinesisFirehoseRecord),
});

/**
 * Zod schema for Kinesis Firehose events with SQS records
 *
 * @example
 * ```json
 * {
 *   "invocationId": "556b67a3-48fc-4385-af49-e133aade9cb9",
 *   "deliveryStreamArn": "arn:aws:firehose:us-east-1:123456789012:deliverystream/PUT-S3-tdyyE",
 *   "region": "us-east-1",
 *   "records": [
 *     {
 *       "recordId": "49640912821178817833517986466168945147170627572855734274000000",
 *       "approximateArrivalTimestamp": 1684864917398,
 *       "data": "eyJtZXNzYWdlSWQiOiI1YWI4MDdkNC01NjQ0LTRjNTUtOTdhMy00NzM5NjYzNWFjNzQiLCJyZWNlaXB0SGFuZGxlIjoiQVFFQndKbkt5ckhpZ1VNWmo2cllpZ0NneGxhUzNTTHkwYS4uLiIsImJvZHkiOiJUZXN0IG1lc3NhZ2UuIiwiYXR0cmlidXRlcyI6eyJBcHByb3hpbWF0ZVJlY2VpdmVDb3VudCI6IjEiLCJTZW50VGltZXN0YW1wIjoiMTY4NDg2NDg1MjQ5MSIsIlNlbmRlcklkIjoiQUlEQUlFTlFaSk9MTzIzWVZKNFZPIiwiQXBwcm94aW1hdGVGaXJzdFJlY2VpdmVUaW1lc3RhbXAiOiIxNjg0ODY0ODcyNDkxIn0sIm1lc3NhZ2VBdHRyaWJ1dGVzIjp7fSwibWQ1T2ZNZXNzYWdlQXR0cmlidXRlcyI6bnVsbCwibWQ1T2ZCb2R5IjoiYzhiNmJjNjBjOGI4YjNhOTA0ZTQ1YzFmYWJkZjUyM2QiLCJldmVudFNvdXJjZSI6ImF3czpzcXMiLCJldmVudFNvdXJjZUFSTiI6ImFybjphd3M6c3FzOnVzLWVhc3QtMToyMDA5ODQxMTIzODY6U05TIiwiYXdzUmVnaW9uIjoidXMtZWFzdC0xIn0K"
 *     }
 *   ]
 * }
 * ```
 *
 * @see {@link types.KinesisFireHoseSqsEvent | KinesisFireHoseSqsEvent}
 */
const KinesisFirehoseSqsSchema = KinesisFireHoseBaseSchema.extend({
  records: z.array(KinesisFirehoseSqsRecord),
});

export {
  KinesisFirehoseSchema,
  KinesisFirehoseSqsSchema,
  KinesisFirehoseRecord,
  KinesisFirehoseSqsRecord,
};
