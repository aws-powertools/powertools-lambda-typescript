import { z } from 'zod';

const KafkaRecordSchema = z.object({
  topic: z.string(),
  partition: z.number(),
  offset: z.number(),
  timestamp: z.number(),
  timestampType: z.string(),
  key: z.string().transform((key) => {
    return key ? Buffer.from(key, 'base64').toString() : undefined;
  }),
  value: z.string().transform((value) => {
    return value ? Buffer.from(value, 'base64').toString() : undefined;
  }),
  headers: z.array(
    z.record(
      z.string(),
      z.array(z.number()).transform((value) => {
        return String.fromCharCode(...value);
      })
    )
  ),
});

const KafkaBaseEventSchema = z.object({
  bootstrapServers: z
    .string()
    .transform((bootstrapServers) => {
      return bootstrapServers ? bootstrapServers.split(',') : undefined;
    })
    .nullish(),
  records: z.record(z.string(), z.array(KafkaRecordSchema)),
});

const KafkaSelfManagedEventSchema = KafkaBaseEventSchema.extend({
  eventSource: z.literal('aws:SelfManagedKafka'),
});

const KafkaMskEventSchema = KafkaBaseEventSchema.extend({
  eventSource: z.literal('aws:kafka'),
  eventSourceArn: z.string(),
});

export { KafkaSelfManagedEventSchema, KafkaMskEventSchema };
