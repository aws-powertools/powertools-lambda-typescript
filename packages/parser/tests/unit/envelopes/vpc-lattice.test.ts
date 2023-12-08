/**
 * Test built in schema envelopes for VPC Lattice
 *
 * @group unit/parser/envelopes
 */

import { Envelopes } from '../../../src/envelopes/Envelopes.js';
import { generateMock } from '@anatine/zod-mock';
import { TestEvents, TestSchema } from '../schema/utils.js';
import { VpcLatticeSchema } from '../../../src/schemas/vpc-lattice.js';
import { z } from 'zod';

describe('VPC Lattice envelope', () => {
  const evnelope = Envelopes.VPC_LATTICE_ENVELOPE;
  it('should parse VPC Lattice event', () => {
    const mock = generateMock(TestSchema);
    const testEvent = TestEvents.vpcLatticeEvent as z.infer<
      typeof VpcLatticeSchema
    >;

    testEvent.body = JSON.stringify(mock);

    const resp = evnelope.parse(testEvent, TestSchema);

    expect(resp).toEqual(mock);
  });

  it('should parse VPC Lattice event with trailing slash', () => {
    const mock = generateMock(TestSchema);
    const testEvent = TestEvents.vpcLatticeEventPathTrailingSlash as z.infer<
      typeof VpcLatticeSchema
    >;

    testEvent.body = JSON.stringify(mock);

    const resp = evnelope.parse(testEvent, TestSchema);
    expect(resp).toEqual(mock);
  });
});
