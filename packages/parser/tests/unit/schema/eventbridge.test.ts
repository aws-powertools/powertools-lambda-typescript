/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import { EventBridgeSchema } from '../../../src/schemas/';
import { TestEvents, makeSchemaStrictForTesting } from './utils.js';

describe('EventBridge ', () => {
  it('should parse eventbridge event', () => {
    const eventBridgeEvent = TestEvents.eventBridgeEvent;

    expect(EventBridgeSchema.parse(eventBridgeEvent)).toEqual(eventBridgeEvent);
  });

  it('should detect missing properties in schema', () => {
    const eventBridgeEvent = TestEvents.eventBridgeEvent;
    const strictSchema = makeSchemaStrictForTesting(EventBridgeSchema);

    expect(() => strictSchema.parse(eventBridgeEvent)).not.toThrow();
  });
});
