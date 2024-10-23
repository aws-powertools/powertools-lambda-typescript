/**
 * Test built in schema envelopes for api gateway v2
 *
 * @group unit/parser/envelopes
 */

import { generateMock } from '@anatine/zod-mock';
import type { MSKEvent, SelfManagedKafkaEvent } from 'aws-lambda';
import { ZodError } from 'zod';
import { ParseError } from '../../../src';
import { KafkaEnvelope } from '../../../src/envelopes/index.js';
import { TestEvents, TestSchema } from '../schema/utils.js';

describe('Kafka', () => {
  describe('parse', () => {
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
  });
});
