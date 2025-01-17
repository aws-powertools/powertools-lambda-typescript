import { z } from 'zod';

/**
 * Zod schema for a Kafka record from an Kafka event.
 */
const KafkaRecordSchema = z.object({
  topic: z.string(),
  partition: z.number(),
  offset: z.number(),
  timestamp: z.number(),
  timestampType: z.string(),
  key: z.string().transform((key) => {
    return Buffer.from(key, 'base64').toString();
  }),
  value: z.string().transform((value) => {
    return Buffer.from(value, 'base64').toString();
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
    .transform((bootstrapServers) => bootstrapServers.split(','))
    .nullish(),
  records: z.record(z.string(), z.array(KafkaRecordSchema).min(1)),
});

/** Zod schema for Kafka event from Self Managed Kafka
 *
 * @example
 * ```json
 * {
 *   "eventSource":"SelfManagedKafka",
 *   "bootstrapServers":"b-2.demo-cluster-1.a1bcde.c1.kafka.us-east-1.amazonaws.com:9092,b-1.demo-cluster-1.a1bcde.c1.kafka.us-east-1.amazonaws.com:9092",
 *   "records":{
 *      "mytopic-0":[
 *         {
 *            "topic":"mytopic",
 *            "partition":0,
 *            "offset":15,
 *            "timestamp":1545084650987,
 *            "timestampType":"CREATE_TIME",
 *            "key":"cmVjb3JkS2V5",
 *            "value":"eyJrZXkiOiJ2YWx1ZSJ9",
 *            "headers":[
 *               {
 *                  "headerKey":[
 *                     104,
 *                     101,
 *                     97,
 *                     100,
 *                     101,
 *                     114,
 *                     86,
 *                     97,
 *                     108,
 *                     117,
 *                     101
 *                  ]
 *               }
 *            ]
 *         }
 *      ]
 *   }
 * }
 * ```
 *
 * @see {@link types.KafkaSelfManagedEvent | KafkaSelfManagedEvent}
 * @see {@link https://docs.aws.amazon.com/lambda/latest/dg/with-kafka.html}
 */
const KafkaSelfManagedEventSchema = KafkaBaseEventSchema.extend({
  eventSource: z.literal('SelfManagedKafka'),
});

/**
 * Zod schema for Kafka event from MSK
 *
 * @example
 * ```json
 * {
 *   "eventSource":"aws:kafka",
 *   "eventSourceArn":"arn:aws:kafka:us-east-1:0123456789019:cluster/SalesCluster/abcd1234-abcd-cafe-abab-9876543210ab-4",
 *   "bootstrapServers":"b-2.demo-cluster-1.a1bcde.c1.kafka.us-east-1.amazonaws.com:9092,b-1.demo-cluster-1.a1bcde.c1.kafka.us-east-1.amazonaws.com:9092",
 *   "records":{
 *      "mytopic-0":[
 *         {
 *            "topic":"mytopic",
 *            "partition":0,
 *            "offset":15,
 *            "timestamp":1545084650987,
 *            "timestampType":"CREATE_TIME",
 *            "key":"cmVjb3JkS2V5",
 *            "value":"eyJrZXkiOiJ2YWx1ZSJ9",
 *            "headers":[
 *               {
 *                  "headerKey":[
 *                     104,
 *                     101,
 *                     97,
 *                     100,
 *                     101,
 *                     114,
 *                     86,
 *                     97,
 *                     108,
 *                     117,
 *                     101
 *                  ]
 *               }
 *            ]
 *         }
 *      ]
 *   }
 * }
 * ```
 *
 * @see {@link types.KafkaMskEvent | KafkaMskEvent}
 * @see {@link https://docs.aws.amazon.com/lambda/latest/dg/with-msk.html}
 */
const KafkaMskEventSchema = KafkaBaseEventSchema.extend({
  eventSource: z.literal('aws:kafka'),
  eventSourceArn: z.string(),
});

export { KafkaSelfManagedEventSchema, KafkaMskEventSchema, KafkaRecordSchema };
