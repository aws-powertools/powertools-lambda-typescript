import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { KafkaEnvelope } from '../../../src/envelopes/kafka.js';
import { JSONStringified } from '../../../src/helpers/index.js';
import { getTestEvent } from '../helpers/utils.js';

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

    it('parses a self managed Kafka event', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.eventSource = 'SelfManagedKafka';

      // Act
      const result = KafkaEnvelope.parse(event, z.string());

      // Assess
      expect(result).toEqual(['{"key":"value"}']);
    });
  });

  describe('Method: safeParse', () => {
    it('parses a Kafka event', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act
      const result = KafkaEnvelope.safeParse(event, z.string());

      // Assess
      expect(result).toEqual({
        success: true,
        data: ['{"key":"value"}'],
      });
    });

    it('returns an error if the event is not a valid Kafka event', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.eventSource = 'SelfManagedKafka';
      // @ts-expect-error - Intentionally invalid event
      event.records['mytopic-0'] = [];

      // Act
      const result = KafkaEnvelope.safeParse(event, z.string());

      // Assess
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          name: 'ParseError',
          message: expect.stringContaining('Failed to parse Kafka envelope'),
          cause: expect.objectContaining({
            issues: [
              {
                origin: 'array',
                code: 'too_small',
                minimum: 1,
                inclusive: true,
                message: 'Too small: expected array to have >=1 items',
                path: ['records', 'mytopic-0'],
              },
            ],
          }),
        }),
        originalEvent: event,
      });
    });

    it('returns the original event and the error if the payload of the value does not match the schema', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act
      const result = KafkaEnvelope.safeParse(event, z.number());

      // Assess
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          name: 'ParseError',
          message: expect.stringContaining('Failed to parse Kafka envelope'),
        }),
        originalEvent: event,
      });
    });
  });
});
