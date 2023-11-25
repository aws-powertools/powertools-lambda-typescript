import { Envelope } from './Envelope.js';
import { z, ZodSchema } from 'zod';
import { EventBridgeSchema } from '../schemas/eventbridge.js';

/**
 * Envelope for EventBridge schema that extracts and parses data from the `detail` key.
 */
export class EventBridgeEnvelope extends Envelope {
  public constructor() {
    super();
  }

  public parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T> {
    const parsedEnvelope = EventBridgeSchema.parse(data);

    return this._parse(parsedEnvelope.detail, schema);
  }
}
