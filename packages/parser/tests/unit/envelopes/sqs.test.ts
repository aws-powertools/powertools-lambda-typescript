import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { SqsEnvelope } from '../../../src/envelopes/sqs.js';
import { ParseError } from '../../../src/errors.js';
import type { SqsEvent } from '../../../src/types/index.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Envelope: SqsEnvelope ', () => {
  const testSchema = z.object({
    name: z.string(),
    age: z.number(),
  });
  const mockBody = {
    name: 'John',
    age: 18,
  };
  const mockJSONStringifiedBody = JSON.stringify(mockBody);
  const baseEvent = getTestEvent<SqsEvent>({
    eventsPath: 'sqs',
    filename: 'base',
  });

  describe('Method: parse', () => {
    it('parses a SQS event', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.Records[0].body = mockJSONStringifiedBody;
      event.Records[1].body = mockJSONStringifiedBody;

      // Act
      const parsedBody = SqsEnvelope.parse(event, testSchema);

      // Assess
      expect(parsedBody).toEqual([mockBody, mockBody]);
    });

    it('throws if event is not a SQS event', () => {
      // Prepare
      const event = { foo: 'bar' };

      // Act & Assess
      expect(() => SqsEnvelope.parse(event, testSchema)).toThrow();
    });

    it('throws if body does not match schema', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.Records[0].body = JSON.stringify({ foo: 'bar' });
      event.Records[1].body = mockJSONStringifiedBody;

      // Act & Assess
      expect(() => SqsEnvelope.parse(event, testSchema)).toThrow();
    });
  });

  describe('Method: safeParse', () => {
    it('parses a SQS event', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.Records[0].body = mockJSONStringifiedBody;
      event.Records[1].body = mockJSONStringifiedBody;

      // Act
      const result = SqsEnvelope.safeParse(event, testSchema);

      // Assess
      expect(result).toEqual({
        success: true,
        data: [mockBody, mockBody],
      });
    });

    it('returns error if event is not a SQS event', () => {
      // Prepare
      const event = { foo: 'bar' };

      // Act
      const result = SqsEnvelope.safeParse(event, testSchema);

      // Assess
      expect(result).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: event,
      });
    });

    it('returns error if body does not match schema', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.Records[0].body = JSON.stringify({ foo: 'bar' });
      event.Records[1].body = mockJSONStringifiedBody;

      // Act
      const result = SqsEnvelope.safeParse(event, testSchema);

      // Assess
      expect(result).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: event,
      });
    });
  });
});
