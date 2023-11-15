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
    expect(VpcLatticeSchema.parse(vpcLatticeEvent)).toEqual(vpcLatticeEvent);
  });
  it('should parse vpc lattice path trailing slash event', () => {
    expect(VpcLatticeSchema.parse(vpcLatticeEventPathTrailingSlash)).toEqual(
      vpcLatticeEventPathTrailingSlash
    );
  });
});
