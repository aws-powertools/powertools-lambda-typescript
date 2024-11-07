import { generateMock } from '@anatine/zod-mock';
import type { EventBridgeEvent } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { EventBridgeEnvelope } from '../../../src/envelopes/index.js';
import { ParseError } from '../../../src/errors.js';
import { TestEvents, TestSchema } from '../schema/utils.js';

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

      const parseResult = EventBridgeEnvelope.safeParse(
        eventBridgeEvent,
        TestSchema
      );
      expect(parseResult).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: eventBridgeEvent,
      });

      if (!parseResult.success && parseResult.error) {
        expect(parseResult.error.cause).toBeInstanceOf(ZodError);
      }
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
        error: expect.any(ParseError),
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
