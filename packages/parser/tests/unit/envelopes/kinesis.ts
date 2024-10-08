/**
 * Test built in schema envelopes for Kinesis
 *
 * @group unit/parser/envelopes
 */

import { generateMock } from '@anatine/zod-mock';
import type { KinesisStreamEvent } from 'aws-lambda';
import { KinesisEnvelope } from '../../../src/envelopes/index.js';
import { ParseError } from '../../../src/errors.js';
import { TestEvents, TestSchema } from '../schema/utils.js';

describe('KinesisEnvelope', () => {
  describe('parse', () => {
    it('should parse Kinesis Stream event', () => {
      const mock = generateMock(TestSchema);
      const testEvent = TestEvents.kinesisStreamEvent as KinesisStreamEvent;

      testEvent.Records.map((record) => {
        record.kinesis.data = Buffer.from(JSON.stringify(mock)).toString(
          'base64'
        );
      });

      const resp = KinesisEnvelope.parse(testEvent, TestSchema);
      expect(resp).toEqual([mock, mock]);
    });
    it('should throw if envelope is invalid', () => {
      expect(() => KinesisEnvelope.parse({ foo: 'bar' }, TestSchema)).toThrow();
    });
    it('should throw if record is invalid', () => {
      const testEvent = TestEvents.kinesisStreamEvent as KinesisStreamEvent;
      testEvent.Records[0].kinesis.data = 'invalid';
      expect(() => KinesisEnvelope.parse(testEvent, TestSchema)).toThrow();
    });
  });

  describe('safeParse', () => {
    it('should parse Kinesis Stream event', () => {
      const mock = generateMock(TestSchema);
      const testEvent = TestEvents.kinesisStreamEvent as KinesisStreamEvent;

      testEvent.Records.map((record) => {
        record.kinesis.data = Buffer.from(JSON.stringify(mock)).toString(
          'base64'
        );
      });

      const resp = KinesisEnvelope.safeParse(testEvent, TestSchema);
      expect(resp).toEqual({ success: true, data: [mock, mock] });
    });
    it('should return original event if envelope is invalid', () => {
      const testEvent = { foo: 'bar' };
      const resp = KinesisEnvelope.safeParse(testEvent, TestSchema);
      expect(resp).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: testEvent,
      });
    });
    it('should return original event if record is invalid', () => {
      const testEvent = TestEvents.kinesisStreamEvent as KinesisStreamEvent;
      testEvent.Records[0].kinesis.data = 'invalid';
      const resp = KinesisEnvelope.safeParse(testEvent, TestSchema);
      expect(resp).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: testEvent,
      });
    });
  });
});
