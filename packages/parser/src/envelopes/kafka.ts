import { z, type ZodSchema } from 'zod';
import { Envelope } from './envelope.js';
import {
  KafkaMskEventSchema,
  KafkaSelfManagedEventSchema,
} from '../schemas/kafka.js';
import { ParsedResult, KafkaMskEvent } from '../types/index.js';
import { ParseError } from '../errors.js';

/**
 * Kafka event envelope to extract data within body key
 * The record's body parameter is a string, though it can also be a JSON encoded string.
 * Regardless of its type it'll be parsed into a BaseModel object.
 *
 * Note: Records will be parsed the same way so if model is str,
 * all items in the list will be parsed as str and not as JSON (and vice versa)
 */

export class KafkaEnvelope extends Envelope {
  public static parse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): z.infer<T> {
    // manually fetch event source to deside between Msk or SelfManaged
    const eventSource = (data as KafkaMskEvent)['eventSource'];

    const parsedEnvelope:
      | z.infer<typeof KafkaMskEventSchema>
      | z.infer<typeof KafkaSelfManagedEventSchema> =
      eventSource === 'aws:kafka'
        ? KafkaMskEventSchema.parse(data)
        : KafkaSelfManagedEventSchema.parse(data);

    return Object.values(parsedEnvelope.records).map((topicRecord) => {
      return topicRecord.map((record) => {
        return super.parse(record.value, schema);
      });
    });
  }

  public static safeParse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): ParsedResult {
    // manually fetch event source to deside between Msk or SelfManaged
    const eventSource = (data as KafkaMskEvent)['eventSource'];

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
        const parsedRecord = super.safeParse(record.value, schema);
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
  }
}
