import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { LambdaFunctionUrlEnvelope } from '../../../src/envelopes/index.js';
import { ParseError } from '../../../src/errors.js';
import type { LambdaFunctionUrlEvent } from '../../../src/types/index.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Envelope: Lambda Functions Url ', () => {
  const baseEvent = getTestEvent<LambdaFunctionUrlEvent>({
    eventsPath: 'lambda',
    filename: 'with-body',
  });

  describe('Method: parse', () => {
    it.fails('parses a Lambda FUrl event', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act
      const parsedBody = LambdaFunctionUrlEnvelope.parse(event, z.string());

      // Assess
      expect(parsedBody).toEqual(event.body);
    });

    it('parses a JSON body within a Lambda FUrl event', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.body = JSON.stringify({ name: 'John' });

      // Act
      const parsedBody = LambdaFunctionUrlEnvelope.parse(
        event,
        z.object({ name: z.string() })
      );

      // Assess
      expect(parsedBody).toEqual({ name: 'John' });
    });

    it.fails('parses a binary body within a Lambda FUrl event', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.body = 'SGVsbG8gV29ybGQ='; // encoded 'Hello World'
      event.isBase64Encoded = true;

      // Act
      const parsedBody = LambdaFunctionUrlEnvelope.parse(event, z.string());

      // Assess
      expect(parsedBody).toEqual('Hello World');
    });

    it('throws if event is not a Lambda FUrl event', () => {
      // Prepare
      const event = { foo: 'bar' };

      // Act & Assess
      expect(() => LambdaFunctionUrlEnvelope.parse(event, z.any())).toThrow();
    });

    it('throws if body does not match schema', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.body = JSON.stringify({ foo: 'bar' });

      // Act & Assess
      expect(() =>
        LambdaFunctionUrlEnvelope.parse(event, z.object({ name: z.string() }))
      ).toThrow();
    });
  });

  describe('Method: safeParse', () => {
    it.fails('parses a Lambda FUrl event', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act
      const result = LambdaFunctionUrlEnvelope.safeParse(event, z.string());

      // Assess
      expect(result).toEqual({
        success: true,
        data: event.body,
      });
    });

    it('returns error if event is not a Lambda FUrl event', () => {
      // Prepare
      const event = { foo: 'bar' };

      // Act
      const result = LambdaFunctionUrlEnvelope.safeParse(event, z.any());

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

      // Act
      const result = LambdaFunctionUrlEnvelope.safeParse(event, z.number());

      // Assess
      expect(result).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: event,
      });
    });
  });
});
