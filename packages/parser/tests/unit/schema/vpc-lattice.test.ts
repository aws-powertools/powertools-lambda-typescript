/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import { VpcLatticeSchema } from '../../../src/schemas/';
import { TestEvents, makeSchemaStrictForTesting } from './utils.js';

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

  it('should detect missing properties in schema for vpc lattice event', () => {
    const vpcLatticeEvent = TestEvents.vpcLatticeEvent;
    const strictSchema = makeSchemaStrictForTesting(VpcLatticeSchema);
    expect(() => strictSchema.parse(vpcLatticeEvent)).not.toThrow();
  });
});
