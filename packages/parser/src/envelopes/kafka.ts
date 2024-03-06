import { z, ZodSchema } from 'zod';
import { parse } from './envelope.js';
import {
  KafkaMskEventSchema,
  KafkaSelfManagedEventSchema,
} from '../schemas/kafka.js';

/**
 * Kafka event envelope to extract data within body key
 * The record's body parameter is a string, though it can also be a JSON encoded string.
 * Regardless of its type it'll be parsed into a BaseModel object.
 *
 * Note: Records will be parsed the same way so if model is str,
 * all items in the list will be parsed as str and not as JSON (and vice versa)
 */
export const kafkaEnvelope = <T extends ZodSchema>(
  data: unknown,
  schema: T
): z.infer<T> => {
  // manually fetch event source to deside between Msk or SelfManaged

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const eventSource = data['eventSource'];

  const parsedEnvelope:
    | z.infer<typeof KafkaMskEventSchema>
    | z.infer<typeof KafkaSelfManagedEventSchema> =
    eventSource === 'aws:kafka'
      ? KafkaMskEventSchema.parse(data)
      : KafkaSelfManagedEventSchema.parse(data);

  return Object.values(parsedEnvelope.records).map((topicRecord) => {
    return topicRecord.map((record) => {
      return parse(record.value, schema);
    });
  });
};
