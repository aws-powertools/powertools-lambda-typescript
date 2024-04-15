/**
 * Test built in schema envelopes for sqs
 *
 * @group unit/parser/envelopes
 */

import { generateMock } from '@anatine/zod-mock';
import { TestEvents, TestSchema } from '../schema/utils.js';
import { SQSEvent } from 'aws-lambda';
import { SqsEnvelope } from '../../../src/envelopes/sqs.js';
import { ParseError } from '../../../src/errors.js';

describe('SqsEnvelope ', () => {
  describe('parse', () => {
    it('should parse custom schema in envelope', () => {
      const mock = generateMock(TestSchema);

      const sqsEvent = TestEvents.sqsEvent as SQSEvent;
      sqsEvent.Records[0].body = JSON.stringify(mock);
      sqsEvent.Records[1].body = JSON.stringify(mock);

      const resp = SqsEnvelope.parse(sqsEvent, TestSchema);
      expect(resp).toEqual([mock, mock]);
    });

    it('should throw error if invalid keys for a schema', () => {
      expect(() => {
        SqsEnvelope.parse({ Records: [{ foo: 'bar' }] }, TestSchema);
      }).toThrow();
    });

    it('should throw if invalid envelope', () => {
      expect(() => {
        SqsEnvelope.parse({ foo: 'bar' }, TestSchema);
      }).toThrow();
    });
  });
  describe('safeParse', () => {
    it('should parse custom schema in envelope', () => {
      const mock = generateMock(TestSchema);

      const sqsEvent = TestEvents.sqsEvent as SQSEvent;
      sqsEvent.Records[0].body = JSON.stringify(mock);
      sqsEvent.Records[1].body = JSON.stringify(mock);

      expect(SqsEnvelope.safeParse(sqsEvent, TestSchema)).toEqual({
        success: true,
        data: [mock, mock],
      });
    });

    it('should return error if event does not match schema', () => {
      const sqsEvent = TestEvents.sqsEvent as SQSEvent;
      sqsEvent.Records[0].body = JSON.stringify({ foo: 'bar' });
      expect(SqsEnvelope.safeParse(sqsEvent, TestSchema)).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: sqsEvent,
      });
    });

    it('should return error if envelope is invalid', () => {
      expect(SqsEnvelope.safeParse({ foo: 'bar' }, TestSchema)).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: { foo: 'bar' },
      });
    });
  });
});
