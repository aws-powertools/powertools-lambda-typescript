import { KafkaRecordSchema } from '../schemas/kafka.js';
import { z } from 'zod';
import {
  KinesisDataStreamRecord,
  KinesisDataStreamRecordPayload,
} from '../schemas/kinesis.js';
import { APIGatewayProxyEventSchema } from '../schemas/apigw.js';

export type KafkaRecord = z.infer<typeof KafkaRecordSchema>;

export type KinesisDataStreamRecord = z.infer<typeof KinesisDataStreamRecord>;

export type KinesisDataStreamRecordPayload = z.infer<
  typeof KinesisDataStreamRecordPayload
>;

export type ApiGatewayProxyEvent = z.infer<typeof APIGatewayProxyEventSchema>;
