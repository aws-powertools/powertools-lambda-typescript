/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import { VpcLatticeSchema } from '../../../src/schemas/vpc-lattice';
import vpcLatticeEvent from '../../events/vpcLatticeEvent.json';
import vpcLatticeEventPathTrailingSlash from '../../events/vpcLatticeEventPathTrailingSlash.json';

describe('VPC Lattice ', () => {
  it('should parse vpc lattice event', () => {
    const parsed = VpcLatticeSchema.parse(vpcLatticeEvent);
    expect(parsed).toMatchObject(vpcLatticeEvent);
  });
  it('should parse vpc lattice path trailing slash event', () => {
    const parsed = VpcLatticeSchema.parse(vpcLatticeEventPathTrailingSlash);
    expect(parsed).toMatchObject(vpcLatticeEventPathTrailingSlash);
  });
});
