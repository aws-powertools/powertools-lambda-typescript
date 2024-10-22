import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { KafkaEnvelope } from '../../../src/envelopes/index.js';
import { ParseError } from '../../../src/errors.js';
import type {
  KafkaMskEvent,
  KafkaSelfManagedEvent,
} from '../../../src/types/index.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Envelope: Kafka', () => {
  const testSchema = z.object({
    name: z.string(),
    age: z.number(),
  });
  const mockBody = {
    name: 'John',
    age: 18,
  };
  const mockJSONStringifiedBody = JSON.stringify(mockBody);

  describe('Method: parse', () => {
    /* it('should parse MSK kafka envelope', () => {
      const mock = generateMock(TestSchema);

      const kafkaEvent = TestEvents.kafkaEventMsk as MSKEvent;
      kafkaEvent.records['mytopic-0'][0].value = Buffer.from(
        JSON.stringify(mock)
      ).toString('base64');

      const result = KafkaEnvelope.parse(kafkaEvent, TestSchema);

      expect(result).toEqual([[mock]]);
    }); */
    /* it('should parse Self Managed kafka envelope', () => {
      const mock = generateMock(TestSchema);

      const kafkaEvent =
        TestEvents.kafkaEventSelfManaged as SelfManagedKafkaEvent;
      kafkaEvent.records['mytopic-0'][0].value = Buffer.from(
        JSON.stringify(mock)
      ).toString('base64');

      const result = KafkaEnvelope.parse(kafkaEvent, TestSchema);

      expect(result).toEqual([[mock]]);
    }); */
    /* describe('safeParse', () => {
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

        const result = KafkaEnvelope.safeParse(kafkaEvent, TestSchema);

        expect(result).toEqual({
          success: false,
          error: expect.any(Error),
          originalEvent: kafkaEvent,
        });
      });
      it('should return original event and error if envelope is invalid', () => {
        expect(KafkaEnvelope.safeParse({ foo: 'bar' }, TestSchema)).toEqual({
          success: false,
          error: expect.any(Error),
          originalEvent: { foo: 'bar' },
        });
      });
    }); */
  });
});
