import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { VpcLatticeV2Envelope } from '../../../src/envelopes/index.js';
import { ParseError } from '../../../src/errors.js';
import type { VpcLatticeEventV2 } from '../../../src/types/index.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Envelope: VpcLatticeV2Envelope', () => {
  const testSchema = z.object({
    name: z.string(),
    age: z.number(),
  });
  const mockBody = {
    name: 'John',
    age: 18,
  };
  const mockJSONStringifiedBody = JSON.stringify(mockBody);
  const baseEvent = getTestEvent<VpcLatticeEventV2>({
    eventsPath: 'vpc-lattice',
    filename: 'base-v2',
  });

  describe('Method: parse', () => {
    it('parses a VPC Lattice v2 event', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.body = mockJSONStringifiedBody;
      event.isBase64Encoded = false;

      // Act
      const parsedBody = VpcLatticeV2Envelope.parse(event, testSchema);

      // Assess
      expect(parsedBody).toEqual(mockBody);
    });

    it('throws when the body is base64 encoded', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act & Assess
      expect(() => VpcLatticeV2Envelope.parse(event, testSchema)).toThrow();
    });

    it('throws if event is not a VPC Lattice v2 event', () => {
      // Prepare
      const event = { foo: 'bar' };

      // Act & Assess
      expect(() => VpcLatticeV2Envelope.parse(event, testSchema)).toThrow();
    });

    it('throws if body does not match schema', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.body = JSON.stringify({ foo: 'bar' });
      event.isBase64Encoded = false;

      // Act & Assess
      expect(() => VpcLatticeV2Envelope.parse(event, testSchema)).toThrow();
    });
  });

  describe('Method: safeParse', () => {
    it('parses a VPC Lattice v2 event', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.body = mockJSONStringifiedBody;
      event.isBase64Encoded = false;

      // Act
      const result = VpcLatticeV2Envelope.safeParse(event, testSchema);

      // Assess
      expect(result).toEqual({ success: true, data: mockBody });
    });

    it('returns error if event is not a VPC Lattice v2 event', () => {
      // Prepare
      const event = { foo: 'bar' };

      // Act
      const result = VpcLatticeV2Envelope.safeParse(event, testSchema);

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
      event.body = JSON.stringify({ foo: 'bar' });
      event.isBase64Encoded = false;

      // Act
      const result = VpcLatticeV2Envelope.safeParse(event, testSchema);

      // Assess
      expect(result).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: event,
      });
    });
  });
});
