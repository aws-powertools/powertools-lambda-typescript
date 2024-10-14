import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { VpcLatticeEnvelope } from '../../../src/envelopes/vpc-lattice.js';
import { ParseError } from '../../../src/errors.js';
import type { VpcLatticeEvent } from '../../../src/types/index.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Envelope: VpcLatticeEnvelope', () => {
  const testSchema = z.object({
    name: z.string(),
    age: z.number(),
  });
  const mockBody = {
    name: 'John',
    age: 18,
  };
  const mockJSONStringifiedBody = JSON.stringify(mockBody);
  const baseEvent = getTestEvent<VpcLatticeEvent>({
    eventsPath: 'vpc-lattice',
    filename: 'base',
  });

  describe('Method: parse', () => {
    it('parses a VPC Lattice event', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.body = mockJSONStringifiedBody;
      event.is_base64_encoded = false;

      // Act
      const parsedBody = VpcLatticeEnvelope.parse(event, testSchema);

      // Assess
      expect(parsedBody).toEqual(mockBody);
    });

    it('throws when the body is base64 encoded', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act & Assess
      expect(() => VpcLatticeEnvelope.parse(event, testSchema)).toThrow();
    });

    it('throws if event is not a VPC Lattice event', () => {
      // Prepare
      const event = { foo: 'bar' };

      // Act & Assess
      expect(() => VpcLatticeEnvelope.parse(event, testSchema)).toThrow();
    });

    it('throws if body does not match schema', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.body = JSON.stringify({ foo: 'bar' });
      event.is_base64_encoded = false;

      // Act & Assess
      expect(() => VpcLatticeEnvelope.parse(event, testSchema)).toThrow();
    });
  });

  describe('Method: safeParse', () => {
    it('parses a VPC Lattice event', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.body = mockJSONStringifiedBody;
      event.is_base64_encoded = false;

      // Act
      const result = VpcLatticeEnvelope.safeParse(event, testSchema);

      // Assess
      expect(result).toEqual({ success: true, data: mockBody });
    });

    it('returns error if event is not a VPC Lattice event', () => {
      // Prepare
      const event = { foo: 'bar' };

      // Act
      const result = VpcLatticeEnvelope.safeParse(event, testSchema);

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
      event.is_base64_encoded = false;

      // Act
      const result = VpcLatticeEnvelope.safeParse(event, testSchema);

      // Assess
      expect(result).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: event,
      });
    });
  });
});
