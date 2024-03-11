/**
 * Test built in schema envelopes for VPC Lattice
 *
 * @group unit/parser/envelopes
 */

import { generateMock } from '@anatine/zod-mock';
import { TestEvents, TestSchema } from '../schema/utils.js';
import { VpcLatticeSchema } from '../../../src/schemas/';
import { z } from 'zod';
import { vpcLatticeEnvelope } from '../../../src/envelopes/';

describe('VPC Lattice envelope', () => {
  it('should parse VPC Lattice event', () => {
    const mock = generateMock(TestSchema);
    const testEvent = TestEvents.vpcLatticeEvent as z.infer<
      typeof VpcLatticeSchema
    >;

    testEvent.body = JSON.stringify(mock);

    const resp = vpcLatticeEnvelope(testEvent, TestSchema);

    expect(resp).toEqual(mock);
  });

  it('should parse VPC Lattice event with trailing slash', () => {
    const mock = generateMock(TestSchema);
    const testEvent = TestEvents.vpcLatticeEventPathTrailingSlash as z.infer<
      typeof VpcLatticeSchema
    >;

    testEvent.body = JSON.stringify(mock);

    const resp = vpcLatticeEnvelope(testEvent, TestSchema);
    expect(resp).toEqual(mock);
  });
});
