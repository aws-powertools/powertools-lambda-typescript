/**
 * Test built in schema envelopes for event bridge
 *
 * @group unit/parser/envelopes
 */

import { TestEvents, TestSchema } from '../schema/utils.js';
import { generateMock } from '@anatine/zod-mock';
import { EventBridgeEvent } from 'aws-lambda';
import { eventBridgeEnvelope } from '../../../src/envelopes/';

describe('EventBridgeEnvelope ', () => {
  it('should parse eventbridge event', () => {
    const eventBridgeEvent = TestEvents.eventBridgeEvent as EventBridgeEvent<
      string,
      object
    >;

    const data = generateMock(TestSchema);

    eventBridgeEvent.detail = data;

    expect(eventBridgeEnvelope(eventBridgeEvent, TestSchema)).toEqual(data);
  });

  it('should throw error if detail type does not match schema', () => {
    const eventBridgeEvent = TestEvents.eventBridgeEvent as EventBridgeEvent<
      string,
      object
    >;

    eventBridgeEvent.detail = {
      foo: 'bar',
    };

    expect(() =>
      eventBridgeEnvelope(eventBridgeEvent, TestSchema)
    ).toThrowError();
  });

  it('should throw when invalid data type provided', () => {
    const eventBridgeEvent = TestEvents.eventBridgeEvent as EventBridgeEvent<
      string,
      object
    >;

    eventBridgeEvent.detail = 1 as unknown as object;

    expect(() => eventBridgeEnvelope(eventBridgeEvent, TestSchema)).toThrow();
  });
});
