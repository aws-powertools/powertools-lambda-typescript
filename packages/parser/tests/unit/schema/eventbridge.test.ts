/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import { EventBridgeSchema } from '../../../src/schemas/eventbridge';
import { loadExampleEvent } from './utils';

describe('EventBridge ', () => {
  it('should parse eventbridge event', () => {
    const eventBridgeEvent = loadExampleEvent('eventBridgeEvent.json');
    expect(EventBridgeSchema.parse(eventBridgeEvent)).toEqual(eventBridgeEvent);
  });
});
