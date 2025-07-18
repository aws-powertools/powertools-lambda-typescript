import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { VpcLatticeEnvelope } from '../../../src/envelopes/vpc-lattice.js';
import { JSONStringified } from '../../../src/helpers/index.js';
import type { VpcLatticeEvent } from '../../../src/types/index.js';
import { getTestEvent, omit } from '../helpers/utils.js';

describe('Envelope: VPC Lattice', () => {
  const schema = z
    .object({
      message: z.string(),
    })
    .strict();
  const baseEvent = getTestEvent<VpcLatticeEvent>({
    eventsPath: 'vpc-lattice',
    filename: 'base',
  });

  describe('Method: parse', () => {
    it('throws if the payload does not match the schema', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act & Assess
      expect(() => VpcLatticeEnvelope.parse(event, schema)).toThrow(
        expect.objectContaining({
          name: 'ParseError',
          message: expect.stringContaining('Failed to parse VPC Lattice body'),
          cause: expect.objectContaining({
            issues: [
              {
                code: 'invalid_type',
                expected: 'object',
                path: ['body'],
                message: 'Invalid input: expected object, received string',
              },
            ],
          }),
        })
      );
    });

    it('parses a VPC Lattice event with plain text', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act
      const result = VpcLatticeEnvelope.parse(event, z.string());

      // Assess
      expect(result).toEqual('{"message": "Hello from Lambda!"}');
    });

    it('parses an VPC Lattice event with JSON-stringified body', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act
      const result = VpcLatticeEnvelope.parse(event, JSONStringified(schema));

      // Assess
      expect(result).toStrictEqual({ message: 'Hello from Lambda!' });
    });

    it('parses a VPC Lattice event with binary body', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.body = 'aGVsbG8gd29ybGQ='; // base64 encoded 'hello world'
      event.headers['content-type'] = 'application/octet-stream';
      event.is_base64_encoded = true;

      // Act
      const result = VpcLatticeEnvelope.parse(event, z.string());

      // Assess
      expect(result).toEqual('aGVsbG8gd29ybGQ=');
    });
  });

  describe('Method: safeParse', () => {
    it('parses a VPC Lattice event', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act
      const result = VpcLatticeEnvelope.safeParse(
        event,
        JSONStringified(schema)
      );

      // Assess
      expect(result).toEqual({
        success: true,
        data: { message: 'Hello from Lambda!' },
      });
    });

    it('returns an error if the event is not a valid VPC Lattice event', () => {
      // Prepare
      const event = omit(['is_base64_encoded'], structuredClone(baseEvent));

      // Act
      const result = VpcLatticeEnvelope.safeParse(event, z.string());

      // Assess
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          name: 'ParseError',
          message: expect.stringContaining('Failed to parse VPC Lattice body'),
          cause: expect.objectContaining({
            issues: [
              {
                code: 'invalid_type',
                expected: 'boolean',
                path: ['is_base64_encoded'],
                message: 'Invalid input: expected boolean, received undefined',
              },
            ],
          }),
        }),
        originalEvent: event,
      });
    });
  });
});
