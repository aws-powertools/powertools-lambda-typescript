import { parse } from './envelope.js';
import { z, ZodSchema } from 'zod';
import { EventBridgeSchema } from '../schemas/eventbridge.js';

/**
 * Envelope for EventBridge schema that extracts and parses data from the `detail` key.
 */
export const eventBridgeEnvelope = <T extends ZodSchema>(
  data: unknown,
  schema: T
): z.infer<T> => {
  return parse(EventBridgeSchema.parse(data).detail, schema);
};
