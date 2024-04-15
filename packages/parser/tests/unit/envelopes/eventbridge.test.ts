/**
 * Test built in schema envelopes for event bridge
 *
 * @group unit/parser/envelopes
 */

import { TestEvents, TestSchema } from '../schema/utils.js';
import { generateMock } from '@anatine/zod-mock';
import { EventBridgeEvent } from 'aws-lambda';
import { EventBridgeEnvelope } from '../../../src/envelopes/index.js';
import { ParseError } from '../../../src/errors.js';

describe('EventBridgeEnvelope ', () => {
  describe('parse', () => {
    it('should parse eventbridge event', () => {
      const eventBridgeEvent = TestEvents.eventBridgeEvent as EventBridgeEvent<
        string,
        object
      >;

      const data = generateMock(TestSchema);

      eventBridgeEvent.detail = data;

      expect(EventBridgeEnvelope.parse(eventBridgeEvent, TestSchema)).toEqual(
        data
      );
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
        EventBridgeEnvelope.parse(eventBridgeEvent, TestSchema)
      ).toThrowError();
    });

    it('should throw when invalid data type provided', () => {
      const eventBridgeEvent = TestEvents.eventBridgeEvent as EventBridgeEvent<
        string,
        object
      >;

      eventBridgeEvent.detail = 1 as unknown as object;

      expect(() =>
        EventBridgeEnvelope.parse(eventBridgeEvent, TestSchema)
      ).toThrow();
    });
  });

  describe('safeParse', () => {
    it('should safe parse eventbridge event', () => {
      const eventBridgeEvent = TestEvents.eventBridgeEvent as EventBridgeEvent<
        string,
        object
      >;

      const data = generateMock(TestSchema);

      eventBridgeEvent.detail = data;

      expect(
        EventBridgeEnvelope.safeParse(eventBridgeEvent, TestSchema)
      ).toEqual({
        success: true,
        data: data,
      });
    });

    it('should safe parse eventbridge event and return original event if invalid', () => {
      const eventBridgeEvent = TestEvents.eventBridgeEvent as EventBridgeEvent<
        string,
        object
      >;

      eventBridgeEvent.detail = {
        foo: 'bar',
      };

      expect(
        EventBridgeEnvelope.safeParse(eventBridgeEvent, TestSchema)
      ).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: eventBridgeEvent,
      });
    });

    it('should safe parse eventbridge event and return original event if invalid data type', () => {
      const eventBridgeEvent = TestEvents.eventBridgeEvent as EventBridgeEvent<
        string,
        object
      >;

      eventBridgeEvent.detail = 1 as unknown as object;

      expect(
        EventBridgeEnvelope.safeParse(eventBridgeEvent, TestSchema)
      ).toEqual({
        success: false,
        error: expect.any(Error),
        originalEvent: eventBridgeEvent,
      });
    });

    it('should return original event and error envelope is invalid', () => {
      expect(EventBridgeEnvelope.safeParse(1, TestSchema)).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: 1,
      });
    });
  });
});
