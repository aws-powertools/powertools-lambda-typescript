import { describe, expect, it } from 'vitest';
import { ZodError, z } from 'zod';
import { VpcLatticeV2Envelope } from '../../../src/envelopes/vpc-latticev2.js';
import { ParseError } from '../../../src/errors.js';
import { JSONStringified } from '../../../src/helpers/index.js';
import type { VpcLatticeEventV2 } from '../../../src/types/index.js';
import { getTestEvent, omit } from '../helpers/utils.js';

describe('Envelope: VPC Lattice v2', () => {
  const schema = z
    .object({
      message: z.string(),
    })
    .strict();
  const baseEvent = getTestEvent<VpcLatticeEventV2>({
    eventsPath: 'vpc-lattice-v2',
    filename: 'base',
  });

  describe('Method: parse', () => {
    it('throws if the payload does not match the schema', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act & Assess
      expect(() => VpcLatticeV2Envelope.parse(event, schema)).toThrow(
        expect.objectContaining({
          message: expect.stringContaining(
            'Failed to parse VPC Lattice v2 body'
          ),
          cause: expect.objectContaining({
            issues: [
              {
                code: 'invalid_type',
                expected: 'object',
                received: 'string',
                path: ['body'],
                message: 'Expected object, received string',
              },
            ],
          }),
        })
      );
    });

    it('parses a VPC Lattice v2 event with plain text', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act
      const result = VpcLatticeV2Envelope.parse(event, z.string());

      // Assess
      expect(result).toEqual('{"message": "Hello from Lambda!"}');
    });

    it('parses an VPC Lattice v2 event with JSON-stringified body', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act
      const result = VpcLatticeV2Envelope.parse(event, JSONStringified(schema));

      // Assess
      expect(result).toStrictEqual({ message: 'Hello from Lambda!' });
    });

    it('parses an VPC Lattice v2 event with binary body', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.body = 'aGVsbG8gd29ybGQ='; // base64 encoded 'hello world'
      event.headers['content-type'] = 'application/octet-stream';
      event.isBase64Encoded = true;

      // Act
      const result = VpcLatticeV2Envelope.parse(event, z.string());

      // Assess
      expect(result).toEqual('aGVsbG8gd29ybGQ=');
    });
  });

  describe('Method: safeParse', () => {
    it('parses a VPC Lattice v2 event', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act
      const result = VpcLatticeV2Envelope.safeParse(
        event,
        JSONStringified(schema)
      );

      // Assess
      expect(result).toEqual({
        success: true,
        data: { message: 'Hello from Lambda!' },
      });
    });

    it('returns an error if the event is not a valid VPC Lattice v2 event', () => {
      // Prepare
      const event = omit(['path'], structuredClone(baseEvent));

      // Act
      const result = VpcLatticeV2Envelope.safeParse(event, z.string());

      // Assess
      expect(result).be.deep.equal({
        success: false,
        error: new ParseError('Failed to parse VPC Lattice v2 body', {
          cause: new ZodError([
            {
              code: 'invalid_type',
              expected: 'string',
              received: 'undefined',
              path: ['path'],
              message: 'Required',
            },
          ]),
        }),
        originalEvent: event,
      });
    });
  });
});
