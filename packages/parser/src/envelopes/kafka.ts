import { ZodError, type ZodIssue, type ZodSchema, z } from 'zod';
import { ParseError } from '../errors.js';
import {
  KafkaMskEventSchema,
  KafkaSelfManagedEventSchema,
} from '../schemas/kafka.js';
import type { KafkaMskEvent, ParsedResult } from '../types/index.js';
import { envelopeDiscriminator } from './envelope.js';

/**
 * Get the event source from the data.
 *
 * Before we can access the event source, we need to parse the data with a minimal schema.
 *
 * @param data - The data to extract the event source from
 */
const extractEventSource = (
  data: unknown
): 'aws:kafka' | 'SelfManagedKafka' => {
  const verifiedData = z
    .object({
      eventSource: z.union([
        z.literal('aws:kafka'),
        z.literal('SelfManagedKafka'),
      ]),
    })
    .parse(data);

  return verifiedData.eventSource;
};

/**
 * Kafka event envelope to extract data within body key
 * The record's body parameter is a string, though it can also be a JSON encoded string.
 * Regardless of its type it'll be parsed into a BaseModel object.
 *
 * Note: Records will be parsed the same way so if model is str,
 * all items in the list will be parsed as str and not as JSON (and vice versa)
 */
export const KafkaEnvelope = {
  /**
   * This is a discriminator to differentiate whether an envelope returns an array or an object
   * @hidden
   */
  [envelopeDiscriminator]: 'array' as const,
  parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T>[] {
    const eventSource = extractEventSource(data);

    const parsedEnvelope =
      eventSource === 'aws:kafka'
        ? KafkaMskEventSchema.parse(data)
        : KafkaSelfManagedEventSchema.parse(data);

    const values: z.infer<T>[] = [];
    for (const topicRecord of Object.values(parsedEnvelope.records)) {
      for (const record of topicRecord) {
        values.push(schema.parse(record.value));
      }
    }

    return values;
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

    const values: z.infer<T>[] = [];
    const issues: ZodIssue[] = [];
    for (const [topicKey, topicRecord] of Object.entries(
      parsedEnvelope.data.records
    )) {
      for (const record of topicRecord) {
        const parsedRecord = schema.safeParse(record.value);
        if (!parsedRecord.success) {
          issues.push(
            ...(parsedRecord.error as ZodError).issues.map((issue) => ({
              ...issue,
              path: ['records', topicKey, ...issue.path],
            }))
          );
        }
        values.push(parsedRecord.data);
      }
    }

    return issues.length > 0
      ? {
          success: false,
          error: new ParseError('Failed to parse Kafka envelope', {
            cause: new ZodError(issues),
          }),
          originalEvent: data,
        }
      : {
          success: true,
          data: values,
        };
  },
};
