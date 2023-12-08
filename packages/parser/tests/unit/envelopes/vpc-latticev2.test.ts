/**
 * Test built in schema envelopes for VPC Lattice V2
 *
 * @group unit/parser/envelopes
 */

import { generateMock } from '@anatine/zod-mock';
import { VpcLatticeSchema } from '../../../src/schemas/vpc-lattice.js';
import { z } from 'zod';
import { Envelopes } from '../../../src/envelopes/Envelopes.js';
import { TestEvents, TestSchema } from '../schema/utils.js';

describe('VPC Lattice envelope', () => {
  const evnelope = Envelopes.VPC_LATTICE_V2_ENVELOPE;
  it('should parse VPC Lattice event', () => {
    const mock = generateMock(TestSchema);
    const testEvent = TestEvents.vpcLatticeV2Event as z.infer<
      typeof VpcLatticeSchema
    >;

    testEvent.body = JSON.stringify(mock);

    const resp = evnelope.parse(testEvent, TestSchema);

    expect(resp).toEqual(mock);
  });

  it('should parse VPC Lattice event with trailing slash', () => {
    const mock = generateMock(TestSchema);
    const testEvent = TestEvents.vpcLatticeEventV2PathTrailingSlash as z.infer<
      typeof VpcLatticeSchema
    >;

    testEvent.body = JSON.stringify(mock);

    const resp = evnelope.parse(testEvent, TestSchema);
    expect(resp).toEqual(mock);
  });
});
