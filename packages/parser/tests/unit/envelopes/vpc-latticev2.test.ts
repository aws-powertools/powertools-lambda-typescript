/**
 * Test built in schema envelopes for VPC Lattice V2
 *
 * @group unit/parser/envelopes
 */

import { generateMock } from '@anatine/zod-mock';
import { VpcLatticeSchema } from '../../../src/schemas/';
import { z } from 'zod';
import { TestEvents, TestSchema } from '../schema/utils.js';
import { vpcLatticeV2Envelope } from '../../../src/envelopes/';

describe('VPC Lattice envelope', () => {
  it('should parse VPC Lattice event', () => {
    const mock = generateMock(TestSchema);
    const testEvent = TestEvents.vpcLatticeV2Event as z.infer<
      typeof VpcLatticeSchema
    >;

    testEvent.body = JSON.stringify(mock);

    const resp = vpcLatticeV2Envelope(testEvent, TestSchema);

    expect(resp).toEqual(mock);
  });

  it('should parse VPC Lattice event with trailing slash', () => {
    const mock = generateMock(TestSchema);
    const testEvent = TestEvents.vpcLatticeEventV2PathTrailingSlash as z.infer<
      typeof VpcLatticeSchema
    >;

    testEvent.body = JSON.stringify(mock);

    const resp = vpcLatticeV2Envelope(testEvent, TestSchema);
    expect(resp).toEqual(mock);
  });
});
