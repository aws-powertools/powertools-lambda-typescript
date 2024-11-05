import type { ZodSchema, z } from 'zod';
import { ParseError } from '../errors.js';
import {
  KafkaMskEventSchema,
  KafkaSelfManagedEventSchema,
} from '../schemas/kafka.js';
import type { KafkaMskEvent, ParsedResult } from '../types/index.js';
import { Envelope } from './envelope.js';

/**
 * Kafka event envelope to extract data within body key
 * The record's body parameter is a string, though it can also be a JSON encoded string.
 * Regardless of its type it'll be parsed into a BaseModel object.
 *
 * Note: Records will be parsed the same way so if model is str,
 * all items in the list will be parsed as str and not as JSON (and vice versa)
 */

export const KafkaEnvelope = {
  symbol: 'array' as const,
  parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T>[] {
    // manually fetch event source to decide between Msk or SelfManaged
    const eventSource = (data as KafkaMskEvent).eventSource;

    const parsedEnvelope:
      | z.infer<typeof KafkaMskEventSchema>
      | z.infer<typeof KafkaSelfManagedEventSchema> =
      eventSource === 'aws:kafka'
        ? KafkaMskEventSchema.parse(data)
        : KafkaSelfManagedEventSchema.parse(data);

    return Object.values(parsedEnvelope.records).map((topicRecord) => {
      return topicRecord.map((record) => {
        return Envelope.parse(record.value, schema);
      });
    });
  },

  safeParse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): ParsedResult<unknown, z.infer<T>[]> {
    // manually fetch event source to deside between Msk or SelfManaged
    const eventSource = (data as KafkaMskEvent).eventSource;

    const parsedEnvelope =
      eventSource === 'aws:kafka'
        ? KafkaMskEventSchema.safeParse(data)
        : KafkaSelfManagedEventSchema.safeParse(data);

    if (!parsedEnvelope.success) {
      return {
        success: false,
        error: new ParseError('Failed to parse Kafka envelope', {
          cause: parsedEnvelope.error,
        }),
        originalEvent: data,
      };
    }
    const parsedRecords: z.infer<T>[] = [];

    for (const topicRecord of Object.values(parsedEnvelope.data.records)) {
      for (const record of topicRecord) {
        const parsedRecord = Envelope.safeParse(record.value, schema);
        if (!parsedRecord.success) {
          return {
            success: false,
            error: new ParseError('Failed to parse Kafka record', {
              cause: parsedRecord.error,
            }),
            originalEvent: data,
          };
        }
        parsedRecords.push(parsedRecord.data);
      }
    }

    return {
      success: true,
      data: parsedRecords,
    };
  },
};
