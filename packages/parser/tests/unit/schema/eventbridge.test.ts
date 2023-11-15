/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import { EventBridgeSchema } from '../../../src/schemas/eventbridge';
import eventBridgeEvent from '../../events/eventBridgeEvent.json';

describe('EventBridge ', () => {
  it('should parse eventbridge event', () => {
    expect(EventBridgeSchema.parse(eventBridgeEvent)).toEqual(eventBridgeEvent);
  });
});
