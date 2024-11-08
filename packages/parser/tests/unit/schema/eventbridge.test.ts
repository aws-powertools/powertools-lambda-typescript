import { describe, expect, it } from 'vitest';
import { EventBridgeSchema } from '../../../src/schemas/';
import { TestEvents } from './utils.js';

describe('EventBridge ', () => {
  it('should parse eventbridge event', () => {
    const eventBridgeEvent = TestEvents.eventBridgeEvent;

    expect(EventBridgeSchema.parse(eventBridgeEvent)).toEqual(eventBridgeEvent);
  });
});
