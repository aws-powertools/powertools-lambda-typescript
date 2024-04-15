/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import { VpcLatticeSchema } from '../../../src/schemas/';
import { TestEvents } from './utils.js';

describe('VPC Lattice ', () => {
  it('should parse vpc lattice event', () => {
    const vpcLatticeEvent = TestEvents.vpcLatticeEvent;
    expect(VpcLatticeSchema.parse(vpcLatticeEvent)).toEqual(vpcLatticeEvent);
  });
  it('should parse vpc lattice path trailing slash event', () => {
    const vpcLatticeEventPathTrailingSlash =
      TestEvents.vpcLatticeEventPathTrailingSlash;
    expect(VpcLatticeSchema.parse(vpcLatticeEventPathTrailingSlash)).toEqual(
      vpcLatticeEventPathTrailingSlash
    );
  });
});
