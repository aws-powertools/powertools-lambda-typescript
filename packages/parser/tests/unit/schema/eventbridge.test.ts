import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { EventBridgeSchema } from '../../../src/schemas/eventbridge.js';
import type { EventBridgeEvent } from '../../../src/types/index.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Schema: EventBridge', () => {
  const baseEvent = getTestEvent<EventBridgeEvent>({
    eventsPath: 'eventbridge',
    filename: 'base',
  });

  it('parses an EventBridge event', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    const schema = EventBridgeSchema.extend({
      detail: z.object({
        instance_id: z.string(),
        state: z.string(),
      }),
    });

    // Act
    const parsedEvent = schema.parse(event);

    // Assess
    expect(parsedEvent).toEqual(event);
    expect(parsedEvent.detail.state).toEqual('terminated');
  });

  it('throws if event is not an EventBridge event', () => {
    // Prepare
    const event = { foo: 'bar' };

    // Act & Assess
    expect(() => EventBridgeSchema.parse(event)).toThrow();
  });
});
