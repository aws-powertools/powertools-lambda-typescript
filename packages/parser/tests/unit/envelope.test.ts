import { describe, expect, it } from 'vitest';
import { ZodError, z } from 'zod';
import { Envelope } from '../../src/envelopes/envelope.js';
import { ParseError } from '../../src/errors.js';

describe('Feature: Envelope', () => {
  const schema = z.object({ name: z.string() });

  describe('Method: safeParse', () => {
    it('successfully parses a stringified object', () => {
      // Prepare
      const input = JSON.stringify({ name: 'John' });

      // Act
      const result = Envelope.safeParse(input, schema);

      // Assess
      expect(result).toEqual({
        success: true,
        data: { name: 'John' },
      });
    });

    it('successfully parses an object', () => {
      // Prepare
      const input = { name: 'John' };

      // Act
      const result = Envelope.safeParse(input, schema);

      // Assess
      expect(result).toEqual({
        success: true,
        data: { name: 'John' },
      });
    });

    it('returns error when input does not match schema', () => {
      // Prepare
      const input = { name: 123 };

      // Act
      const result = Envelope.safeParse(input, schema);

      // Assess
      expect(result).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: input,
      });
    });

    it('returns error when input is invalid JSON string', () => {
      // Prepare
      const input = '{name: "John"}'; // Missing quotes around key

      // Act
      const result = Envelope.safeParse(input, schema);

      // Assess
      expect(result).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: input,
      });
    });
  });

  describe('Method: parse', () => {
    it('returns parsed data when input is object', () => {
      // Prepare
      const input = { name: 'John' };

      // Act
      const result = Envelope.parse(input, schema);

      // Assess
      expect(result).toEqual(input);
    });

    it('returns parsed data when input is string', () => {
      // Prepare
      const data = { name: 'John' };
      const input = JSON.stringify(data);

      // Act
      const result = Envelope.parse(input, schema);

      // Assess
      expect(result).toEqual(data);
    });

    it('throw custom error if input is not string or object', () => {
      // Prepare
      const input = 123;

      // Act & Assess
      expect(() => Envelope.parse(input, schema)).toThrow(
        'Invalid data type for envelope. Expected string or object, got number'
      );
    });

    it('throws error when input does not match schema', () => {
      // Prepare
      const input = { name: 123 };

      // Act & Assess
      expect(() => Envelope.parse(input, schema)).toThrow(ParseError);
    });

    it('includes the ZodError as the cause of the ParseError', () => {
      // Prepare
      const input = JSON.stringify({ name: 'John' });
      const schema = z.object({ name: z.number() });

      // Act & Assess
      expect(() => Envelope.parse(input, schema))
        .throws(ParseError)
        .property('cause')
        .eql(
          new ZodError([
            {
              code: 'invalid_type',
              expected: 'number',
              received: 'string',
              path: ['name'],
              message: 'Expected number, received string',
            },
          ])
        );
    });
  });
});
