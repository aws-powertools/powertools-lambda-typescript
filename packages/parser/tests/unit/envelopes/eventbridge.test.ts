/**
 * Test built in schema envelopes for event bridge
 *
 * @group unit/parser/envelopes
 */

import { TestEvents, TestSchema } from '../schema/utils.js';
import { Envelopes } from '../../../src/envelopes/Envelopes.js';
import { generateMock } from '@anatine/zod-mock';
import { EventBridgeEvent } from 'aws-lambda';

describe('EventBridgeEnvelope ', () => {
  const envelope = Envelopes.EVENT_BRIDGE_ENVELOPE;

  it('should parse eventbridge event', () => {
    const eventBridgeEvent = TestEvents.eventBridgeEvent as EventBridgeEvent<
      string,
      object
    >;

    const data = generateMock(TestSchema);

    eventBridgeEvent.detail = data;

    expect(envelope.parse(eventBridgeEvent, TestSchema)).toEqual(data);
  });

  it('should throw error if detail type does not match schema', () => {
    const eventBridgeEvent = TestEvents.eventBridgeEvent as EventBridgeEvent<
      string,
      object
    >;

    const envelope = Envelopes.EVENT_BRIDGE_ENVELOPE;

    eventBridgeEvent.detail = {
      foo: 'bar',
    };

    expect(() => envelope.parse(eventBridgeEvent, TestSchema)).toThrowError();
  });

  it('should throw when invalid data type provided', () => {
    const testEvent = TestEvents.eventBridgeEvent as EventBridgeEvent<
      string,
      object
    >;

    testEvent.detail = 1 as unknown as object;

    expect(() => envelope.parse(testEvent, TestSchema)).toThrow();
  });
});
