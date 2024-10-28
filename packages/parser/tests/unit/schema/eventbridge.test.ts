/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import { EventBridgeSchema } from '../../../src/schemas/';
import { TestEvents } from './utils.js';

describe('EventBridge ', () => {
  it('should parse eventbridge event', () => {
    const eventBridgeEvent = TestEvents.eventBridgeEvent;

    expect(EventBridgeSchema.parse(eventBridgeEvent)).toEqual(eventBridgeEvent);
  });
});
