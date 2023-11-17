/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import { loadExampleEvent } from './utils.js';
import { EventBridgeSchema } from '../../../src/schemas/eventbridge.js';

describe('EventBridge ', () => {
  it('should parse eventbridge event', () => {
    const eventBridgeEvent = loadExampleEvent('eventBridgeEvent.json');
    expect(EventBridgeSchema.parse(eventBridgeEvent)).toEqual(eventBridgeEvent);
  });
});
