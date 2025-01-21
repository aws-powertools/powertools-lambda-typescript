import { generateMock } from '@anatine/zod-mock';
import type { SQSEvent } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { SnsSqsEnvelope, SqsEnvelope } from '../../../src/envelopes/sqs.js';
import { ParseError } from '../../../src/errors.js';
import { TestEvents, TestSchema } from '../schema/utils.js';

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
      const parseResult = SqsEnvelope.safeParse(sqsEvent, TestSchema);
      expect(parseResult).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: sqsEvent,
      });

      if (!parseResult.success && parseResult.error) {
        expect(parseResult.error.cause).toBeInstanceOf(ZodError);
      }
    });

    it('should return error if envelope is invalid', () => {
      expect(SqsEnvelope.safeParse({ foo: 'bar' }, TestSchema)).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: { foo: 'bar' },
      });
    });
  });

  describe('SnsSqsEnvelope safeParse', () => {
    it('parse sqs inside sns envelope', () => {
      const snsSqsTestEvent = TestEvents.snsSqsEvent as SQSEvent;

      const data = generateMock(TestSchema);
      const snsEvent = JSON.parse(snsSqsTestEvent.Records[0].body);
      snsEvent.Message = JSON.stringify(data);

      snsSqsTestEvent.Records[0].body = JSON.stringify(snsEvent);

      expect(SnsSqsEnvelope.parse(snsSqsTestEvent, TestSchema)).toEqual([data]);
    });

    it('should parse sqs inside sns envelope', () => {
      const snsSqsTestEvent = TestEvents.snsSqsEvent as SQSEvent;

      const data = generateMock(TestSchema);
      const snsEvent = JSON.parse(snsSqsTestEvent.Records[0].body);
      snsEvent.Message = JSON.stringify(data);

      snsSqsTestEvent.Records[0].body = JSON.stringify(snsEvent);

      expect(SnsSqsEnvelope.safeParse(snsSqsTestEvent, TestSchema)).toEqual({
        success: true,
        data: [data],
      });
    });
    it('should return error when envelope is not valid', () => {
      expect(SnsSqsEnvelope.safeParse({ foo: 'bar' }, TestSchema)).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: { foo: 'bar' },
      });
    });
    it('should return error if message does not match schema', () => {
      const snsSqsTestEvent = TestEvents.snsSqsEvent as SQSEvent;

      const snsEvent = JSON.parse(snsSqsTestEvent.Records[0].body);
      snsEvent.Message = JSON.stringify({
        foo: 'bar',
      });

      snsSqsTestEvent.Records[0].body = JSON.stringify(snsEvent);

      const parseResult = SnsSqsEnvelope.safeParse(snsSqsTestEvent, TestSchema);
      expect(parseResult).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: snsSqsTestEvent,
      });

      if (!parseResult.success && parseResult.error) {
        expect(parseResult.error.cause).toBeInstanceOf(ZodError);
      }
    });
    it('should return error if sns message is not valid', () => {
      const snsSqsTestEvent = TestEvents.snsSqsEvent as SQSEvent;

      snsSqsTestEvent.Records[0].body = JSON.stringify({
        foo: 'bar',
      });

      expect(SnsSqsEnvelope.safeParse(snsSqsTestEvent, TestSchema)).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: snsSqsTestEvent,
      });
    });
    it('should return error if JSON parse fails for record.body', () => {
      const snsSqsTestEvent = TestEvents.snsSqsEvent as SQSEvent;

      snsSqsTestEvent.Records[0].body = 'not a json string';

      expect(SnsSqsEnvelope.safeParse(snsSqsTestEvent, TestSchema)).toEqual({
        success: false,
        error: expect.any(SyntaxError),
        originalEvent: snsSqsTestEvent,
      });
    });
  });
});
