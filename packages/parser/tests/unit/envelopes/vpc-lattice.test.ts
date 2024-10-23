/**
 * Test built in schema envelopes for VPC Lattice
 *
 * @group unit/parser/envelopes
 */

import { generateMock } from '@anatine/zod-mock';
import { ZodError } from 'zod';
import { ParseError } from '../../../src';
import { VpcLatticeEnvelope } from '../../../src/envelopes/index.js';
import type { VpcLatticeEvent } from '../../../src/types/index.js';
import { TestEvents, TestSchema } from '../schema/utils.js';

describe('VpcLatticeEnvelope', () => {
  describe('parse', () => {
    it('should parse VPC Lattice event', () => {
      const mock = generateMock(TestSchema);
      const testEvent = TestEvents.vpcLatticeEvent as VpcLatticeEvent;

      testEvent.body = JSON.stringify(mock);

      const resp = VpcLatticeEnvelope.parse(testEvent, TestSchema);

      expect(resp).toEqual(mock);
    });

    it('should parse VPC Lattice event with trailing slash', () => {
      const mock = generateMock(TestSchema);
      const testEvent =
        TestEvents.vpcLatticeEventPathTrailingSlash as VpcLatticeEvent;

      testEvent.body = JSON.stringify(mock);

      const resp = VpcLatticeEnvelope.parse(testEvent, TestSchema);
      expect(resp).toEqual(mock);
    });

    it('should throw if event is not a VPC Lattice event', () => {
      expect(() =>
        VpcLatticeEnvelope.parse({ foo: 'bar' }, TestSchema)
      ).toThrow();
    });

    it('should throw if body does not match schema', () => {
      const testEvent = TestEvents.vpcLatticeEvent as VpcLatticeEvent;

      testEvent.body = JSON.stringify({ foo: 'bar' });

      expect(() => VpcLatticeEnvelope.parse(testEvent, TestSchema)).toThrow();
    });
  });

  describe('safeParse', () => {
    it('should parse VPC Lattice event', () => {
      const mock = generateMock(TestSchema);
      const testEvent = TestEvents.vpcLatticeEvent as VpcLatticeEvent;

      testEvent.body = JSON.stringify(mock);

      const resp = VpcLatticeEnvelope.safeParse(testEvent, TestSchema);

      expect(resp).toEqual({ success: true, data: mock });
    });

    it('should parse VPC Lattice event with trailing slash', () => {
      const mock = generateMock(TestSchema);
      const testEvent =
        TestEvents.vpcLatticeEventPathTrailingSlash as VpcLatticeEvent;

      testEvent.body = JSON.stringify(mock);

      const resp = VpcLatticeEnvelope.safeParse(testEvent, TestSchema);
      expect(resp).toEqual({ success: true, data: mock });
    });

    it('should return error if event is not a VPC Lattice event', () => {
      const resp = VpcLatticeEnvelope.safeParse({ foo: 'bar' }, TestSchema);

      expect(resp).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: { foo: 'bar' },
      });
    });

    it('should return error if body does not match schema', () => {
      const testEvent = TestEvents.vpcLatticeEvent as VpcLatticeEvent;

      testEvent.body = JSON.stringify({ foo: 'bar' });

      const parseResult = VpcLatticeEnvelope.safeParse(testEvent, TestSchema);
      expect(parseResult).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: testEvent,
      });

      if (!parseResult.success && parseResult.error) {
        expect(parseResult.error.cause).toBeInstanceOf(ZodError);
      }
    });
  });
});
