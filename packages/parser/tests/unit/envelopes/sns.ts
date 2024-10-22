import type { SNSEvent, SQSEvent } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { SnsEnvelope, SnsSqsEnvelope } from '../../../src/envelopes/index.js';
import { ParseError } from '../../../src/errors.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Sns and SQS Envelope', () => {
  describe('SnsSqsEnvelope parse', () => {
    it('should parse sqs inside sns envelope', () => {
      const snsSqsTestEvent = TestEvents.snsSqsEvent as SQSEvent;

      const data = generateMock(TestSchema);
      const snsEvent = JSON.parse(snsSqsTestEvent.Records[0].body);
      snsEvent.Message = JSON.stringify(data);

      snsSqsTestEvent.Records[0].body = JSON.stringify(snsEvent);

      expect(SnsSqsEnvelope.parse(snsSqsTestEvent, TestSchema)).toEqual([data]);
    });
  });
  describe('SnsSqsEnvelope safeParse', () => {
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
        error: expect.any(Error),
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

      expect(SnsSqsEnvelope.safeParse(snsSqsTestEvent, TestSchema)).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: snsSqsTestEvent,
      });
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
        error: expect.any(Error),
        originalEvent: snsSqsTestEvent,
      });
    });
  });
});
describe('SnsEnvelope', () => {
  describe('parse', () => {
    it('should parse custom schema in envelope', () => {
      const testEvent = TestEvents.snsEvent as SNSEvent;

      const testRecords = [] as z.infer<typeof TestSchema>[];

      testEvent.Records.map((record) => {
        const value = generateMock(TestSchema);
        testRecords.push(value);
        record.Sns.Message = JSON.stringify(value);
      });

      expect(SnsEnvelope.parse(testEvent, TestSchema)).toEqual(testRecords);
    });

    it('should throw if message does not macht schema', () => {
      const testEvent = TestEvents.snsEvent as SNSEvent;

      testEvent.Records.map((record) => {
        record.Sns.Message = JSON.stringify({
          foo: 'bar',
        });
      });

      expect(() => SnsEnvelope.parse(testEvent, TestSchema)).toThrow();
    });
    it('should throw if envelope is not valid', () => {
      expect(() => SnsEnvelope.parse({ foo: 'bar' }, TestSchema)).toThrow();
    });
  });
  describe('safeParse', () => {
    it('should parse custom schema in envelope', () => {
      const testEvent = TestEvents.snsEvent as SNSEvent;

      const testRecords = [] as z.infer<typeof TestSchema>[];

      testEvent.Records.map((record) => {
        const value = generateMock(TestSchema);
        testRecords.push(value);
        record.Sns.Message = JSON.stringify(value);
      });

      expect(SnsEnvelope.safeParse(testEvent, TestSchema)).toEqual({
        success: true,
        data: testRecords,
      });
    });

    it('should return error when message does not macht schema', () => {
      const testEvent = TestEvents.snsEvent as SNSEvent;

      testEvent.Records.map((record) => {
        record.Sns.Message = JSON.stringify({
          foo: 'bar',
        });
      });

      expect(SnsEnvelope.safeParse(testEvent, TestSchema)).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: testEvent,
      });
    });
    it('should return error when envelope is not valid', () => {
      expect(SnsEnvelope.safeParse({ foo: 'bar' }, TestSchema)).toEqual({
        success: false,
        error: expect.any(Error),
        originalEvent: { foo: 'bar' },
      });
    });
  });
});
