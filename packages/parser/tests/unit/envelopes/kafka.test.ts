import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { KafkaEnvelope } from '../../../src/envelopes/index.js';
import { ParseError } from '../../../src/errors.js';
import { JSONStringified } from '../../../src/helpers.js';
import { getTestEvent } from '../schema/utils.js';

describe('Envelope: Kafka', () => {
  const baseEvent = getTestEvent({
    eventsPath: 'kafka',
    filename: 'base',
  });

  describe('Method: parse', () => {
    it('throws if the payload of the value does not match the schema', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act & Assess
      expect(() => KafkaEnvelope.parse(event, z.number())).toThrow();
    });

    it('parses a Kafka event', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act
      const result = KafkaEnvelope.parse(event, z.string());

      // Assess
      expect(result).toEqual(['{"key":"value"}']);
    });

    it('parses a Kafka event and applies the schema transformation', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act
      const result = KafkaEnvelope.parse(
        event,
        JSONStringified(z.object({ key: z.string() }))
      );

      // Assess
      expect(result).toEqual([{ key: 'value' }]);
    });
  });
  /* describe('parse', () => {
    it('should parse MSK kafka envelope', () => {
      const mock = generateMock(TestSchema);

      const kafkaEvent = TestEvents.kafkaEventMsk as MSKEvent;
      kafkaEvent.records['mytopic-0'][0].value = Buffer.from(
        JSON.stringify(mock)
      ).toString('base64');

      const result = KafkaEnvelope.parse(kafkaEvent, TestSchema);

      expect(result).toEqual([[mock]]);
    });

    it('should parse Self Managed kafka envelope', () => {
      const mock = generateMock(TestSchema);

      const kafkaEvent =
        TestEvents.kafkaEventSelfManaged as SelfManagedKafkaEvent;
      kafkaEvent.records['mytopic-0'][0].value = Buffer.from(
        JSON.stringify(mock)
      ).toString('base64');

      const result = KafkaEnvelope.parse(kafkaEvent, TestSchema);

      expect(result).toEqual([[mock]]);
    });

    describe('safeParse', () => {
      it('should parse MSK kafka envelope', () => {
        const mock = generateMock(TestSchema);

        const kafkaEvent = TestEvents.kafkaEventMsk as MSKEvent;
        kafkaEvent.records['mytopic-0'][0].value = Buffer.from(
          JSON.stringify(mock)
        ).toString('base64');

        const result = KafkaEnvelope.safeParse(kafkaEvent, TestSchema);

        expect(result).toEqual({
          success: true,
          data: [mock],
        });
      });

      it('should parse Self Managed kafka envelope', () => {
        const mock = generateMock(TestSchema);

        const kafkaEvent =
          TestEvents.kafkaEventSelfManaged as SelfManagedKafkaEvent;
        kafkaEvent.records['mytopic-0'][0].value = Buffer.from(
          JSON.stringify(mock)
        ).toString('base64');

        const result = KafkaEnvelope.safeParse(kafkaEvent, TestSchema);

        expect(result).toEqual({
          success: true,
          data: [mock],
        });
      });

      it('should return original event on failure', () => {
        const kafkaEvent = TestEvents.kafkaEventMsk as MSKEvent;
        kafkaEvent.records['mytopic-0'][0].value = 'not a valid json';

        const parseResult = KafkaEnvelope.safeParse(kafkaEvent, TestSchema);

        expect(parseResult).toEqual({
          success: false,
          error: expect.any(ParseError),
          originalEvent: kafkaEvent,
        });

        if (!parseResult.success && parseResult.error) {
          expect(parseResult.error.cause).toBeInstanceOf(SyntaxError);
        }
      });
      it('should return original event and error if envelope is invalid', () => {
        expect(KafkaEnvelope.safeParse({ foo: 'bar' }, TestSchema)).toEqual({
          success: false,
          error: expect.any(ParseError),
          originalEvent: { foo: 'bar' },
        });
      });
    });
  }); */
});
