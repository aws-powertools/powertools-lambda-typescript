/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import { loadExampleEvent } from './utils.js';
import { VpcLatticeSchema } from '../../../src/schemas/vpc-lattice.js';

describe('VPC Lattice ', () => {
  it('should parse vpc lattice event', () => {
    const vpcLatticeEvent = loadExampleEvent('vpcLatticeEvent.json');
    expect(VpcLatticeSchema.parse(vpcLatticeEvent)).toEqual(vpcLatticeEvent);
  });
  it('should parse vpc lattice path trailing slash event', () => {
    const vpcLatticeEventPathTrailingSlash = loadExampleEvent(
      'vpcLatticeEventPathTrailingSlash.json'
    );
    expect(VpcLatticeSchema.parse(vpcLatticeEventPathTrailingSlash)).toEqual(
      vpcLatticeEventPathTrailingSlash
    );
  });
});
